export interface ParsedUserRow {
  rowNumber: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  company: string;
  errors: string[];
  isValid: boolean;
}

export interface ParseResult {
  rows: ParsedUserRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateEmails: string[];
  parseError: string | null;
}

const HEADER_ALIASES: Record<string, string> = {
  email: "email",
  "e-mail": "email",
  "email address": "email",
  "email_address": "email",
  first_name: "firstName",
  "first name": "firstName",
  firstname: "firstName",
  "given name": "firstName",
  last_name: "lastName",
  "last name": "lastName",
  lastname: "lastName",
  "family name": "lastName",
  surname: "lastName",
  full_name: "fullName",
  "full name": "fullName",
  fullname: "fullName",
  name: "fullName",
  phone: "phone",
  "phone number": "phone",
  phone_number: "phone",
  mobile: "phone",
  telephone: "phone",
  job_title: "jobTitle",
  "job title": "jobTitle",
  jobtitle: "jobTitle",
  title: "jobTitle",
  position: "jobTitle",
  company: "company",
  organization: "company",
  organisation: "company",
  employer: "company",
};

function mapHeaders(headerRow: string[]): Record<number, string> {
  const colMap: Record<number, string> = {};
  for (let i = 0; i < headerRow.length; i++) {
    const normalized = headerRow[i].trim().toLowerCase();
    const mapped = HEADER_ALIASES[normalized];
    if (mapped) {
      colMap[i] = mapped;
    }
  }
  return colMap;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRow(
  values: string[],
  colMap: Record<number, string>,
  rowNumber: number
): ParsedUserRow {
  const raw: Record<string, string> = {};
  for (const [idx, field] of Object.entries(colMap)) {
    raw[field] = (values[Number(idx)] ?? "").trim();
  }

  const errors: string[] = [];

  const email = raw.email ?? "";
  const firstName = raw.firstName ?? "";
  const lastName = raw.lastName ?? "";
  const fullName = raw.fullName || [firstName, lastName].filter(Boolean).join(" ");
  const phone = raw.phone ?? "";
  const jobTitle = raw.jobTitle ?? "";
  const company = raw.company ?? "";

  if (!email) {
    errors.push("Email is required");
  } else if (!EMAIL_RE.test(email)) {
    errors.push("Invalid email format");
  }

  if (!fullName) {
    errors.push("Name is required (provide full_name, or first_name + last_name)");
  }

  return {
    rowNumber,
    email: email.toLowerCase(),
    firstName,
    lastName,
    fullName,
    phone,
    jobTitle,
    company,
    errors,
    isValid: errors.length === 0,
  };
}

function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current);
        current = "";
      } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
        row.push(current);
        current = "";
        if (row.some((c) => c.trim())) rows.push(row);
        row = [];
        if (ch === "\r") i++;
      } else {
        current += ch;
      }
    }
  }

  // last row
  row.push(current);
  if (row.some((c) => c.trim())) rows.push(row);

  return rows;
}

async function parseExcelFile(file: File): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const data: string[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
    raw: false,
  });
  return data;
}

export async function parseFile(file: File): Promise<ParseResult> {
  const empty: ParseResult = {
    rows: [],
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    duplicateEmails: [],
    parseError: null,
  };

  try {
    const ext = file.name.split(".").pop()?.toLowerCase();
    let rawRows: string[][];

    if (ext === "csv") {
      const text = await file.text();
      rawRows = parseCSVText(text);
    } else if (ext === "xlsx" || ext === "xls") {
      rawRows = await parseExcelFile(file);
    } else {
      return { ...empty, parseError: "Unsupported file type. Use .csv, .xlsx, or .xls" };
    }

    if (rawRows.length < 2) {
      return { ...empty, parseError: "File must have a header row and at least one data row" };
    }

    const [headerRow, ...dataRows] = rawRows;
    const colMap = mapHeaders(headerRow);

    if (!Object.values(colMap).includes("email")) {
      return { ...empty, parseError: 'No "email" column found. Check your headers.' };
    }

    const hasName =
      Object.values(colMap).includes("fullName") ||
      (Object.values(colMap).includes("firstName") &&
        Object.values(colMap).includes("lastName"));

    if (!hasName) {
      return {
        ...empty,
        parseError:
          'No name column found. Provide "full_name" or both "first_name" and "last_name".',
      };
    }

    const rows = dataRows.map((values, i) => validateRow(values, colMap, i + 2));

    // Detect duplicate emails within the file
    const seen = new Map<string, number>();
    const duplicateEmails: string[] = [];

    for (const row of rows) {
      if (!row.email) continue;
      const prev = seen.get(row.email);
      if (prev !== undefined) {
        if (!duplicateEmails.includes(row.email)) duplicateEmails.push(row.email);
        row.errors.push(`Duplicate email (first on row ${prev})`);
        row.isValid = false;
      } else {
        seen.set(row.email, row.rowNumber);
      }
    }

    return {
      rows,
      totalRows: rows.length,
      validRows: rows.filter((r) => r.isValid).length,
      invalidRows: rows.filter((r) => !r.isValid).length,
      duplicateEmails,
      parseError: null,
    };
  } catch (err) {
    return {
      ...empty,
      parseError: err instanceof Error ? err.message : "Failed to parse file",
    };
  }
}

export function generateTemplateCSV(): string {
  return [
    "email,first_name,last_name,phone,job_title,company",
    "john.doe@example.com,John,Doe,+971501234567,Analyst,VIFM",
    "jane.smith@example.com,Jane,Smith,+971507654321,Manager,VIFM",
  ].join("\n");
}
