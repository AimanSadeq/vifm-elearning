/**
 * Comprehensive seed script for VIFM eLearning Portal
 * Creates: organizations, users, courses (with modules/lessons), webinars,
 *          certificate templates, enrollments, reviews
 *
 * Usage: node scripts/seed-demo-data.mjs
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  env[t.slice(0, eq)] = t.slice(eq + 1);
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── Thumbnail URLs (Unsplash - free to use) ───────────────────────────
const THUMBNAILS = [
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop", // financial charts
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop", // stock trading
  "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&h=450&fit=crop", // Islamic architecture
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop", // code/data
  "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=450&fit=crop", // AI/ML
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop", // dashboard
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=450&fit=crop", // leadership
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop", // risk/docs
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop", // digital
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=450&fit=crop", // compliance
];

// ── Sample video URLs (public domain / sample) ───────────────────────
const SAMPLE_VIDEOS = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
];

function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("🌱 Starting seed...\n");

  // ── 1. Existing data ──────────────────────────────────────────────
  const { data: categories } = await admin.from("categories").select("id, name, slug").order("sort_order");
  console.log(`Found ${categories.length} categories`);

  const catMap = {};
  for (const c of categories) {
    if (c.slug.includes("finance")) catMap.finance = c.id;
    else if (c.slug.includes("data")) catMap.data = c.id;
    else if (c.slug.includes("leadership")) catMap.leadership = c.id;
    else if (c.slug.includes("compliance")) catMap.compliance = c.id;
  }

  // Add compliance category if missing
  if (!catMap.compliance) {
    const { data: compCat } = await admin.from("categories").insert({
      name: "Compliance & Risk Management",
      name_ar: "الامتثال وإدارة المخاطر",
      slug: "compliance-risk",
      description: "Regulatory compliance, risk management, and governance",
      description_ar: "الامتثال التنظيمي وإدارة المخاطر والحوكمة",
      icon: "Shield",
      sort_order: 3,
      is_active: true,
    }).select("id").single();
    catMap.compliance = compCat.id;
    console.log("Created Compliance & Risk category");
  }

  const adminId = (await admin.from("profiles").select("id").eq("role", "super_admin").single()).data.id;

  // ── 2. Organizations ──────────────────────────────────────────────
  console.log("\n📦 Creating organizations...");
  const orgs = [
    {
      name: "Dubai Financial Group",
      name_ar: "مجموعة دبي المالية",
      domain: "dfg.ae",
      contact_email: "training@dfg.ae",
      contact_phone: "+97142001000",
      address: "DIFC, Dubai, UAE",
      license_type: "per_seat",
      max_seats: 50,
      is_active: true,
    },
    {
      name: "Abu Dhabi Capital Partners",
      name_ar: "شركاء أبوظبي كابيتال",
      domain: "adcp.ae",
      contact_email: "hr@adcp.ae",
      contact_phone: "+97126001000",
      address: "Al Maryah Island, Abu Dhabi, UAE",
      license_type: "unlimited",
      max_seats: 200,
      is_active: true,
    },
    {
      name: "Saudi Investment Academy",
      name_ar: "أكاديمية الاستثمار السعودية",
      domain: "sia.sa",
      contact_email: "admin@sia.sa",
      contact_phone: "+966112001000",
      address: "King Abdullah Financial District, Riyadh, KSA",
      license_type: "course_bundle",
      max_seats: 100,
      is_active: true,
    },
  ];

  const orgIds = [];
  for (const org of orgs) {
    // Check if org already exists by name
    const { data: existing } = await admin.from("organizations").select("id").eq("name", org.name).single();
    if (existing) {
      orgIds.push(existing.id);
      console.log(`  ⏭ ${org.name} (already exists)`);
      continue;
    }
    const { data, error } = await admin.from("organizations").insert(org).select("id").single();
    if (error) { console.error("  Org error:", org.name, error.message); continue; }
    orgIds.push(data.id);
    console.log(`  ✓ ${org.name}`);
  }

  // ── 3. Users (10) ────────────────────────────────────────────────
  console.log("\n👥 Creating users...");
  const users = [
    { email: "ahmed.rashid@vifm.ae", full_name: "Dr. Ahmed Al-Rashid", full_name_ar: "د. أحمد الراشد", role: "instructor", phone: "+971501001001", bio: "PhD in Finance, CFA charterholder with 15 years of investment banking experience.", job_title: "Senior Finance Instructor" },
    { email: "sarah.johnson@vifm.ae", full_name: "Sarah Johnson", role: "instructor", phone: "+971501001002", bio: "Former Goldman Sachs data scientist. Expert in ML applications in finance.", job_title: "Data Science Lead" },
    { email: "mohammed.khalid@vifm.ae", full_name: "Mohammed bin Khalid", full_name_ar: "محمد بن خالد", role: "instructor", phone: "+971501001003", bio: "20 years of C-suite advisory experience across GCC markets.", job_title: "Leadership Coach" },
    { email: "fatima.zahra@dfg.ae", full_name: "Fatima Al-Zahra", full_name_ar: "فاطمة الزهراء", role: "corporate_admin", phone: "+971501001004", organization_id: orgIds[0], job_title: "Training Manager" },
    { email: "james.wilson@gmail.com", full_name: "James Wilson", role: "learner", phone: "+971501001005", job_title: "Junior Analyst" },
    { email: "noura.suwaidi@adcp.ae", full_name: "Noura Al-Suwaidi", full_name_ar: "نورة السويدي", role: "learner", phone: "+971501001006", organization_id: orgIds[1], job_title: "Investment Analyst" },
    { email: "khalid.saeed@sia.sa", full_name: "Khalid bin Saeed", full_name_ar: "خالد بن سعيد", role: "learner", phone: "+966551001007", organization_id: orgIds[2], job_title: "Risk Officer" },
    { email: "emily.chen@gmail.com", full_name: "Emily Chen", role: "learner", phone: "+971501001008", job_title: "Portfolio Manager" },
    { email: "omar.hassan@outlook.com", full_name: "Omar Hassan", full_name_ar: "عمر حسن", role: "learner", phone: "+971501001009", job_title: "Compliance Associate" },
    { email: "layla.mansoori@dfg.ae", full_name: "Layla Al-Mansoori", full_name_ar: "ليلى المنصوري", role: "learner", phone: "+971501001010", organization_id: orgIds[0], job_title: "Financial Controller" },
  ];

  const userIds = [];
  const instructorIds = [];

  for (const u of users) {
    // Check if user already exists
    const { data: existing } = await admin.from("profiles").select("id").eq("email", u.email).single();
    if (existing) {
      userIds.push(existing.id);
      if (u.role === "instructor") instructorIds.push(existing.id);
      console.log(`  ⏭ ${u.full_name} (already exists)`);
      continue;
    }

    const password = "Demo1234!";
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: u.email,
      password,
      email_confirm: true,
    });

    if (authErr) { console.error(`  ✗ ${u.email}:`, authErr.message); continue; }

    const uid = authUser.user.id;
    userIds.push(uid);
    if (u.role === "instructor") instructorIds.push(uid);

    await admin.from("profiles").update({
      full_name: u.full_name,
      full_name_ar: u.full_name_ar || null,
      role: u.role,
      phone: u.phone,
      bio: u.bio || null,
      job_title: u.job_title || null,
      organization_id: u.organization_id || null,
      language: u.full_name_ar ? "ar" : "en",
      is_active: true,
    }).eq("id", uid);

    console.log(`  ✓ ${u.full_name} (${u.role})`);
  }

  // ── 4. Certificate Templates ──────────────────────────────────────
  console.log("\n🏅 Creating certificate templates...");
  const templates = [
    {
      name: "Modern Professional",
      name_ar: "المهني الحديث",
      template_key: "modern",
      primary_color: "#0F172A",
      secondary_color: "#3B82F6",
      accent_color: "#10B981",
      organization_name: "Virginia Institute of Finance and Management",
      organization_name_ar: "معهد فرجينيا للمالية والإدارة",
      is_default: false,
      is_active: true,
      created_by: adminId,
    },
    {
      name: "Corporate Excellence",
      name_ar: "التميز المؤسسي",
      template_key: "corporate",
      primary_color: "#1E3A5F",
      secondary_color: "#C5A55A",
      accent_color: "#4A4A4A",
      organization_name: "Virginia Institute of Finance and Management",
      organization_name_ar: "معهد فرجينيا للمالية والإدارة",
      is_default: false,
      is_active: true,
      created_by: adminId,
    },
    {
      name: "Elegant Gold",
      name_ar: "الذهبي الأنيق",
      template_key: "elegant",
      primary_color: "#2D2D2D",
      secondary_color: "#D4AF37",
      accent_color: "#8B7355",
      organization_name: "Virginia Institute of Finance and Management",
      organization_name_ar: "معهد فرجينيا للمالية والإدارة",
      is_default: false,
      is_active: true,
      created_by: adminId,
    },
  ];

  const certTemplateIds = [];
  for (const t of templates) {
    const { data, error } = await admin.from("certificate_templates").insert(t).select("id").single();
    if (error) { console.error("  Template error:", t.name, error.message); continue; }
    certTemplateIds.push(data.id);
    console.log(`  ✓ ${t.name}`);
  }

  // ── 5. Courses (10) ──────────────────────────────────────────────
  console.log("\n📚 Creating courses...");

  const courseDefs = [
    {
      title: "Financial Statement Analysis Masterclass",
      title_ar: "تحليل القوائم المالية - دورة متقدمة",
      description: "Master the art of reading and analyzing financial statements. Learn to evaluate company performance through income statements, balance sheets, and cash flow analysis. Includes real-world case studies from GCC markets.",
      description_ar: "أتقن فن قراءة وتحليل القوائم المالية. تعلم تقييم أداء الشركات من خلال بيانات الدخل والميزانيات العمومية وتحليل التدفقات النقدية.",
      short_description: "Learn to read, analyze, and interpret financial statements like a professional analyst.",
      category_id: catMap.finance,
      instructor_idx: 0,
      level: "beginner",
      price: 199,
      is_free: false,
      is_featured: true,
      tags: ["finance", "accounting", "financial-analysis"],
      learning_outcomes: ["Read and interpret income statements, balance sheets, and cash flow statements", "Calculate and analyze key financial ratios", "Identify red flags in financial reporting", "Compare financial performance across companies"],
      modules: [
        { title: "Introduction to Financial Statements", title_ar: "مقدمة في القوائم المالية", lessons: [
          { title: "Welcome & Course Overview", content_type: "video", duration: 8 },
          { title: "The Three Core Financial Statements", content_type: "video", duration: 22 },
          { title: "Understanding Annual Reports", content_type: "document", duration: 15 },
        ]},
        { title: "Income Statement Deep Dive", title_ar: "تحليل معمق لبيان الدخل", lessons: [
          { title: "Revenue Recognition Principles", content_type: "video", duration: 18 },
          { title: "Operating vs Non-Operating Items", content_type: "video", duration: 20 },
          { title: "Income Statement Quiz", content_type: "quiz", duration: 10 },
        ]},
        { title: "Balance Sheet Analysis", title_ar: "تحليل الميزانية العمومية", lessons: [
          { title: "Assets, Liabilities, and Equity", content_type: "video", duration: 25 },
          { title: "Working Capital Analysis", content_type: "video", duration: 15 },
          { title: "Case Study: GCC Bank Analysis", content_type: "document", duration: 20 },
        ]},
      ],
    },
    {
      title: "Investment Banking Fundamentals",
      title_ar: "أساسيات الخدمات المصرفية الاستثمارية",
      description: "A comprehensive introduction to investment banking covering M&A, IPOs, debt capital markets, and financial modeling. Designed for aspiring investment bankers and finance professionals.",
      short_description: "Your gateway to understanding investment banking operations and deal-making.",
      category_id: catMap.finance,
      instructor_idx: 0,
      level: "intermediate",
      price: 349,
      is_free: false,
      is_featured: true,
      tags: ["investment-banking", "M&A", "IPO", "financial-modeling"],
      learning_outcomes: ["Understand the structure and functions of investment banks", "Analyze M&A transactions and valuation methods", "Build basic financial models in Excel", "Navigate the IPO process from start to finish"],
      modules: [
        { title: "The Investment Banking Landscape", lessons: [
          { title: "What is Investment Banking?", content_type: "video", duration: 15 },
          { title: "Key Players and Market Structure", content_type: "video", duration: 20 },
        ]},
        { title: "Mergers & Acquisitions", lessons: [
          { title: "M&A Process Overview", content_type: "video", duration: 25 },
          { title: "Valuation Methodologies: DCF, Comps, Precedents", content_type: "video", duration: 30 },
          { title: "Deal Structuring and Negotiation", content_type: "video", duration: 18 },
        ]},
        { title: "Capital Markets", lessons: [
          { title: "Equity Capital Markets & IPOs", content_type: "video", duration: 22 },
          { title: "Debt Capital Markets & Bond Issuance", content_type: "video", duration: 20 },
          { title: "Final Assessment", content_type: "quiz", duration: 15 },
        ]},
      ],
    },
    {
      title: "Islamic Finance and Sukuk",
      title_ar: "التمويل الإسلامي والصكوك",
      description: "Explore the principles of Islamic finance including Shariah-compliant investment vehicles, sukuk structures, and Islamic banking practices. Essential knowledge for professionals in GCC financial markets.",
      short_description: "Master Shariah-compliant finance, sukuk, and Islamic banking principles.",
      category_id: catMap.finance,
      instructor_idx: 0,
      level: "advanced",
      price: 449,
      is_free: false,
      is_featured: false,
      tags: ["islamic-finance", "sukuk", "shariah", "banking"],
      learning_outcomes: ["Understand core principles of Islamic finance and Shariah compliance", "Analyze different sukuk structures and their applications", "Compare Islamic and conventional financial products", "Evaluate Islamic banking operations and governance"],
      modules: [
        { title: "Foundations of Islamic Finance", title_ar: "أسس التمويل الإسلامي", lessons: [
          { title: "Principles of Shariah-Compliant Finance", content_type: "video", duration: 20 },
          { title: "Prohibition of Riba and Gharar", content_type: "video", duration: 18 },
          { title: "Key Islamic Finance Contracts", content_type: "video", duration: 25 },
        ]},
        { title: "Sukuk: Islamic Bonds", title_ar: "الصكوك الإسلامية", lessons: [
          { title: "Sukuk Structures: Ijarah, Murabaha, Musharakah", content_type: "video", duration: 30 },
          { title: "Global Sukuk Market Analysis", content_type: "video", duration: 20 },
          { title: "Sukuk Case Study", content_type: "document", duration: 15 },
        ]},
      ],
    },
    {
      title: "Python for Financial Analysis",
      title_ar: "بايثون للتحليل المالي",
      description: "Learn Python programming specifically for financial analysis. Cover data manipulation with Pandas, financial calculations with NumPy, and create stunning visualizations for investment reports.",
      short_description: "Apply Python to real-world financial data analysis and visualization.",
      category_id: catMap.data,
      instructor_idx: 1,
      level: "intermediate",
      price: 299,
      is_free: false,
      is_featured: true,
      tags: ["python", "data-analysis", "pandas", "finance", "programming"],
      learning_outcomes: ["Write Python scripts for financial data analysis", "Use Pandas to manipulate and analyze financial datasets", "Create professional financial visualizations", "Automate financial reporting tasks"],
      modules: [
        { title: "Python Basics for Finance", lessons: [
          { title: "Setting Up Your Python Environment", content_type: "video", duration: 12 },
          { title: "Python Data Types and Operations", content_type: "video", duration: 20 },
          { title: "Working with Financial Data", content_type: "video", duration: 25 },
        ]},
        { title: "Pandas for Financial Data", lessons: [
          { title: "DataFrames and Series", content_type: "video", duration: 22 },
          { title: "Time Series Analysis", content_type: "video", duration: 28 },
          { title: "Portfolio Analysis Project", content_type: "document", duration: 20 },
        ]},
      ],
    },
    {
      title: "Machine Learning in Banking",
      title_ar: "التعلم الآلي في القطاع المصرفي",
      description: "Apply machine learning techniques to banking problems: credit scoring, fraud detection, customer segmentation, and algorithmic trading. Hands-on projects with real datasets.",
      short_description: "Apply ML to credit scoring, fraud detection, and algorithmic trading.",
      category_id: catMap.data,
      instructor_idx: 1,
      level: "advanced",
      price: 499,
      is_free: false,
      is_featured: false,
      tags: ["machine-learning", "AI", "banking", "credit-scoring", "fraud-detection"],
      learning_outcomes: ["Build credit scoring models using supervised learning", "Implement fraud detection systems with anomaly detection", "Apply NLP to financial document analysis", "Design algorithmic trading strategies"],
      modules: [
        { title: "ML Foundations for Banking", lessons: [
          { title: "Introduction to ML in Financial Services", content_type: "video", duration: 15 },
          { title: "Supervised vs Unsupervised Learning", content_type: "video", duration: 25 },
        ]},
        { title: "Credit Risk Modeling", lessons: [
          { title: "Building a Credit Scoring Model", content_type: "video", duration: 30 },
          { title: "Feature Engineering for Credit Risk", content_type: "video", duration: 22 },
          { title: "Model Validation and Backtesting", content_type: "video", duration: 18 },
        ]},
        { title: "Fraud Detection", lessons: [
          { title: "Anomaly Detection Techniques", content_type: "video", duration: 25 },
          { title: "Real-Time Fraud Scoring Pipeline", content_type: "video", duration: 20 },
          { title: "ML in Banking Assessment", content_type: "quiz", duration: 15 },
        ]},
      ],
    },
    {
      title: "Data Visualization with Power BI",
      title_ar: "تصور البيانات باستخدام Power BI",
      description: "Create compelling financial dashboards and reports using Microsoft Power BI. From data connection to interactive visualizations, learn to tell stories with data that drive business decisions.",
      short_description: "Build stunning financial dashboards and interactive reports with Power BI.",
      category_id: catMap.data,
      instructor_idx: 1,
      level: "beginner",
      price: 0,
      is_free: true,
      is_featured: true,
      tags: ["power-bi", "data-visualization", "dashboard", "business-intelligence"],
      learning_outcomes: ["Connect Power BI to various financial data sources", "Build interactive dashboards for financial reporting", "Create DAX formulas for financial calculations", "Publish and share reports across your organization"],
      modules: [
        { title: "Getting Started with Power BI", lessons: [
          { title: "Power BI Interface Overview", content_type: "video", duration: 10 },
          { title: "Connecting to Data Sources", content_type: "video", duration: 18 },
          { title: "Your First Dashboard", content_type: "video", duration: 25 },
        ]},
        { title: "Financial Dashboards", lessons: [
          { title: "Revenue and P&L Dashboards", content_type: "video", duration: 22 },
          { title: "Portfolio Performance Tracker", content_type: "video", duration: 20 },
          { title: "Publishing and Sharing", content_type: "video", duration: 12 },
        ]},
      ],
    },
    {
      title: "Strategic Leadership in Financial Services",
      title_ar: "القيادة الاستراتيجية في الخدمات المالية",
      description: "Develop leadership skills tailored for the financial services industry. Cover strategic thinking, change management, team building, and executive communication in banking and finance contexts.",
      short_description: "Lead with impact in banks, asset managers, and financial institutions.",
      category_id: catMap.leadership,
      instructor_idx: 2,
      level: "intermediate",
      price: 399,
      is_free: false,
      is_featured: false,
      tags: ["leadership", "strategy", "management", "financial-services"],
      learning_outcomes: ["Develop a strategic vision for financial institutions", "Lead high-performing teams in banking environments", "Navigate organizational change in regulated industries", "Communicate effectively with boards and stakeholders"],
      modules: [
        { title: "Leadership in Finance", lessons: [
          { title: "The Evolving Role of Financial Leaders", content_type: "video", duration: 18 },
          { title: "Strategic Thinking Frameworks", content_type: "video", duration: 25 },
          { title: "Case Study: Transformational Leaders in Banking", content_type: "document", duration: 15 },
        ]},
        { title: "Leading Change", lessons: [
          { title: "Change Management in Regulated Industries", content_type: "video", duration: 22 },
          { title: "Building High-Performing Teams", content_type: "video", duration: 20 },
          { title: "Executive Communication Skills", content_type: "video", duration: 18 },
        ]},
      ],
    },
    {
      title: "Enterprise Risk Management Framework",
      title_ar: "إطار إدارة المخاطر المؤسسية",
      description: "Comprehensive coverage of the ERM framework including market risk, credit risk, operational risk, and liquidity risk. Aligned with Basel III/IV requirements and GCC regulatory standards.",
      short_description: "Master the enterprise risk management framework for financial institutions.",
      category_id: catMap.compliance,
      instructor_idx: 0,
      level: "intermediate",
      price: 349,
      is_free: false,
      is_featured: false,
      tags: ["risk-management", "ERM", "Basel", "compliance"],
      learning_outcomes: ["Implement an enterprise risk management framework", "Measure and manage market, credit, and operational risk", "Understand Basel III/IV capital requirements", "Develop risk appetite statements and risk dashboards"],
      modules: [
        { title: "ERM Foundations", lessons: [
          { title: "What is Enterprise Risk Management?", content_type: "video", duration: 15 },
          { title: "Risk Categories and Taxonomy", content_type: "video", duration: 20 },
          { title: "Risk Appetite and Tolerance", content_type: "video", duration: 18 },
        ]},
        { title: "Market and Credit Risk", lessons: [
          { title: "Value at Risk (VaR) Modeling", content_type: "video", duration: 28 },
          { title: "Credit Risk Assessment", content_type: "video", duration: 25 },
          { title: "Risk Management Quiz", content_type: "quiz", duration: 12 },
        ]},
      ],
    },
    {
      title: "Digital Transformation in Banking",
      title_ar: "التحول الرقمي في القطاع المصرفي",
      description: "Navigate the digital revolution in banking. Explore fintech partnerships, open banking APIs, digital customer experience, and the future of financial services in the age of AI and blockchain.",
      short_description: "Lead digital innovation in banking with fintech, APIs, and AI strategies.",
      category_id: catMap.leadership,
      instructor_idx: 2,
      level: "advanced",
      price: 449,
      is_free: false,
      is_featured: true,
      tags: ["digital-transformation", "fintech", "open-banking", "innovation"],
      learning_outcomes: ["Develop a digital transformation strategy for banks", "Evaluate and partner with fintech companies", "Implement open banking and API strategies", "Design digital-first customer experiences"],
      modules: [
        { title: "The Digital Banking Revolution", lessons: [
          { title: "State of Digital Banking in 2026", content_type: "video", duration: 18 },
          { title: "Fintech Landscape and Disruption", content_type: "video", duration: 25 },
          { title: "Open Banking and PSD2/PSD3", content_type: "video", duration: 20 },
        ]},
        { title: "Implementation Strategy", lessons: [
          { title: "Building a Digital Roadmap", content_type: "video", duration: 22 },
          { title: "AI and Chatbots in Customer Service", content_type: "video", duration: 18 },
          { title: "Blockchain and DeFi in Traditional Banking", content_type: "video", duration: 25 },
          { title: "Digital Transformation Assessment", content_type: "quiz", duration: 10 },
        ]},
      ],
    },
    {
      title: "Anti-Money Laundering Compliance",
      title_ar: "الامتثال لمكافحة غسل الأموال",
      description: "Essential AML/CFT training covering KYC procedures, suspicious activity reporting, sanctions screening, and regulatory requirements across GCC jurisdictions. Meets FATF recommendations.",
      short_description: "Master AML/KYC compliance for GCC financial institutions.",
      category_id: catMap.compliance,
      instructor_idx: 2,
      level: "beginner",
      price: 149,
      is_free: false,
      is_featured: false,
      tags: ["AML", "KYC", "compliance", "FATF", "sanctions"],
      learning_outcomes: ["Implement KYC and CDD procedures", "Identify and report suspicious transactions", "Navigate sanctions screening requirements", "Understand FATF recommendations and GCC regulations"],
      modules: [
        { title: "AML Fundamentals", title_ar: "أساسيات مكافحة غسل الأموال", lessons: [
          { title: "Introduction to Money Laundering", content_type: "video", duration: 15 },
          { title: "The Three Stages: Placement, Layering, Integration", content_type: "video", duration: 20 },
          { title: "Global AML Regulatory Framework", content_type: "video", duration: 18 },
        ]},
        { title: "KYC and Due Diligence", title_ar: "اعرف عميلك والعناية الواجبة", lessons: [
          { title: "Customer Due Diligence (CDD) Process", content_type: "video", duration: 22 },
          { title: "Enhanced Due Diligence (EDD)", content_type: "video", duration: 18 },
          { title: "Suspicious Activity Reporting (SAR)", content_type: "video", duration: 20 },
          { title: "AML Compliance Quiz", content_type: "quiz", duration: 10 },
        ]},
      ],
    },
  ];

  const courseIds = [];
  const existingCertTemplateId = "394fa529-f2ac-4cea-9f71-652251db1cf6";
  const allTemplateIds = [existingCertTemplateId, ...certTemplateIds];

  for (let ci = 0; ci < courseDefs.length; ci++) {
    const def = courseDefs[ci];
    const courseSlug = slug(def.title);

    // Check if course already exists
    const { data: existing } = await admin.from("courses").select("id").eq("slug", courseSlug).single();
    if (existing) {
      courseIds.push(existing.id);
      console.log(`  ⏭ ${def.title} (already exists)`);
      continue;
    }

    const durationHours = def.modules.reduce((sum, m) =>
      sum + m.lessons.reduce((ls, l) => ls + l.duration, 0), 0) / 60;

    const { data: course, error: courseErr } = await admin.from("courses").insert({
      title: def.title,
      title_ar: def.title_ar || null,
      slug: courseSlug,
      description: def.description,
      description_ar: def.description_ar || null,
      short_description: def.short_description || null,
      thumbnail_url: THUMBNAILS[ci],
      preview_video_url: SAMPLE_VIDEOS[ci % SAMPLE_VIDEOS.length],
      instructor_id: instructorIds[def.instructor_idx] || instructorIds[0],
      category_id: def.category_id,
      status: "published",
      price: def.price,
      currency: "USD",
      duration_hours: Math.round(durationHours * 10) / 10,
      difficulty_level: def.level,
      tags: def.tags || [],
      learning_outcomes: def.learning_outcomes || [],
      is_featured: def.is_featured,
      is_free: def.is_free,
      certificate_enabled: true,
      certificate_template_id: allTemplateIds[ci % allTemplateIds.length],
      passing_score: 70,
      published_at: new Date().toISOString(),
    }).select("id").single();

    if (courseErr) {
      console.error(`  ✗ ${def.title}:`, courseErr.message);
      continue;
    }

    courseIds.push(course.id);

    // Create modules and lessons
    for (let mi = 0; mi < def.modules.length; mi++) {
      const mod = def.modules[mi];
      const { data: module } = await admin.from("modules").insert({
        course_id: course.id,
        title: mod.title,
        title_ar: mod.title_ar || null,
        sort_order: mi,
        is_published: true,
      }).select("id").single();

      if (!module) continue;

      for (let li = 0; li < mod.lessons.length; li++) {
        const les = mod.lessons[li];
        const videoUrl = les.content_type === "video" ? SAMPLE_VIDEOS[(ci + mi + li) % SAMPLE_VIDEOS.length] : null;

        await admin.from("lessons").insert({
          module_id: module.id,
          title: les.title,
          content_type: les.content_type,
          duration_minutes: les.duration,
          sort_order: li,
          is_published: true,
          is_active: true,
          is_preview: mi === 0 && li === 0, // first lesson of first module is preview
          is_mandatory: les.content_type !== "document",
          video_url: videoUrl,
          content_url: videoUrl,
          description: `Learn about ${les.title.toLowerCase()} in this ${les.content_type} lesson.`,
        });
      }
    }

    console.log(`  ✓ ${def.title} (${def.modules.length} modules, ${def.modules.reduce((s, m) => s + m.lessons.length, 0)} lessons)`);
  }

  // ── 6. Webinars (5) ──────────────────────────────────────────────
  console.log("\n🎥 Creating webinars...");
  const now = new Date();
  const webinars = [
    {
      title: "The Future of AI in Financial Services",
      title_ar: "مستقبل الذكاء الاصطناعي في الخدمات المالية",
      description: "Join our panel of experts as they discuss how AI is reshaping banking, asset management, and insurance across the GCC region.",
      instructor_id: instructorIds[1],
      category_id: catMap.data,
      status: "scheduled",
      scheduled_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 90,
      max_attendees: 200,
      is_free: true,
      price: 0,
      tags: ["AI", "finance", "panel-discussion"],
      thumbnail_url: THUMBNAILS[4],
    },
    {
      title: "ESG Investing Trends 2026",
      title_ar: "اتجاهات الاستثمار البيئي والاجتماعي وحوكمة الشركات 2026",
      description: "Explore the latest trends in ESG investing and sustainable finance, with a focus on GCC sovereign wealth funds and their green initiatives.",
      instructor_id: instructorIds[0],
      category_id: catMap.finance,
      status: "scheduled",
      scheduled_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      max_attendees: 150,
      is_free: false,
      price: 29,
      tags: ["ESG", "sustainable-finance", "investing"],
      thumbnail_url: THUMBNAILS[0],
    },
    {
      title: "Blockchain and Digital Assets in Banking",
      title_ar: "البلوكتشين والأصول الرقمية في القطاع المصرفي",
      description: "A deep dive into how blockchain technology and CBDCs are being adopted by central banks and financial institutions in the Middle East.",
      instructor_id: instructorIds[2],
      category_id: catMap.data,
      status: "scheduled",
      scheduled_at: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 75,
      max_attendees: 100,
      is_free: true,
      price: 0,
      tags: ["blockchain", "CBDC", "digital-assets"],
      thumbnail_url: THUMBNAILS[8],
    },
    {
      title: "Women in Finance Leadership Summit",
      title_ar: "قمة المرأة في القيادة المالية",
      description: "Inspiring talks from women leaders in finance. Topics include career progression, breaking barriers, and building inclusive financial institutions.",
      instructor_id: instructorIds[2],
      category_id: catMap.leadership,
      status: "completed",
      scheduled_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 120,
      max_attendees: 300,
      is_free: true,
      price: 0,
      recording_url: SAMPLE_VIDEOS[5],
      is_recording_public: true,
      tags: ["women-in-finance", "leadership", "diversity"],
      thumbnail_url: THUMBNAILS[6],
    },
    {
      title: "Cybersecurity for Financial Institutions",
      title_ar: "الأمن السيبراني للمؤسسات المالية",
      description: "Essential cybersecurity awareness for financial professionals. Cover threat landscapes, incident response, and regulatory requirements for data protection.",
      instructor_id: instructorIds[1],
      category_id: catMap.compliance,
      status: "scheduled",
      scheduled_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      max_attendees: 250,
      is_free: false,
      price: 19,
      tags: ["cybersecurity", "data-protection", "compliance"],
      thumbnail_url: THUMBNAILS[9],
    },
  ];

  for (const w of webinars) {
    const { error } = await admin.from("webinars").insert(w);
    if (error) { console.error(`  ✗ ${w.title}:`, error.message); continue; }
    console.log(`  ✓ ${w.title} (${w.status})`);
  }

  // ── 7. Enrollments ───────────────────────────────────────────────
  console.log("\n📋 Creating enrollments...");
  // Enroll learners (indices 4-9) in various courses
  const learnerIds = userIds.slice(4); // indices 4-9 are learners (+ corporate_admin at 3)
  const enrollmentPairs = [
    // James Wilson - enrolled in 3 courses
    [4, 0], [4, 3], [4, 5],
    // Noura - enrolled in 4 courses
    [5, 0], [5, 1], [5, 3], [5, 7],
    // Khalid - enrolled in 2 courses
    [6, 7], [6, 9],
    // Emily - enrolled in 3 courses
    [7, 1], [7, 4], [7, 8],
    // Omar - enrolled in 2 courses
    [8, 9], [8, 7],
    // Layla - enrolled in 3 courses
    [9, 0], [9, 5], [9, 6],
    // Fatima (corporate_admin) - enrolled in 1 course
    [3, 6],
  ];

  let enrollCount = 0;
  for (const [userIdx, courseIdx] of enrollmentPairs) {
    if (!userIds[userIdx] || !courseIds[courseIdx]) continue;

    const { error } = await admin.from("enrollments").upsert({
      user_id: userIds[userIdx],
      course_id: courseIds[courseIdx],
      status: "active",
      progress: Math.floor(Math.random() * 80),
      enrolled_at: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "user_id,course_id" });

    if (!error) enrollCount++;
  }
  console.log(`  ✓ Created ${enrollCount} enrollments`);

  // ── 8. Reviews ───────────────────────────────────────────────────
  console.log("\n⭐ Creating reviews...");
  const reviewData = [
    { userIdx: 4, courseIdx: 0, rating: 5, title: "Excellent course!", review_text: "The financial statement analysis content was incredibly well-structured. Dr. Ahmed's real-world examples from GCC markets made the concepts come alive." },
    { userIdx: 5, courseIdx: 0, rating: 4, title: "Very comprehensive", review_text: "Great coverage of the core financial statements. Would love to see more advanced ratio analysis techniques in future updates." },
    { userIdx: 5, courseIdx: 1, rating: 5, title: "Best IB course online", review_text: "As someone transitioning into investment banking, this course gave me exactly the foundation I needed. The M&A valuation section was outstanding." },
    { userIdx: 7, courseIdx: 1, rating: 4, title: "Solid fundamentals", review_text: "Good overview of investment banking. The financial modeling section could be expanded with more hands-on exercises." },
    { userIdx: 5, courseIdx: 3, rating: 5, title: "Python + Finance = Perfect", review_text: "Sarah's teaching style makes Python accessible even for finance professionals with no coding background. Loved the Pandas section!" },
    { userIdx: 9, courseIdx: 5, rating: 5, title: "Great free resource", review_text: "Amazing that this Power BI course is free! The financial dashboard templates alone are worth a premium price." },
    { userIdx: 9, courseIdx: 0, rating: 4, title: "Good but could be longer", review_text: "Solid content on financial statements. The balance sheet section was particularly useful for my work." },
    { userIdx: 8, courseIdx: 9, rating: 5, title: "Essential for compliance professionals", review_text: "As a compliance associate, this AML course is exactly what I needed. The GCC-specific regulatory content sets it apart from other courses." },
  ];

  let reviewCount = 0;
  for (const r of reviewData) {
    if (!userIds[r.userIdx] || !courseIds[r.courseIdx]) continue;
    const { error } = await admin.from("reviews").upsert({
      user_id: userIds[r.userIdx],
      course_id: courseIds[r.courseIdx],
      rating: r.rating,
      title: r.title,
      review_text: r.review_text,
      is_visible: true,
    }, { onConflict: "user_id,course_id" });
    if (!error) reviewCount++;
  }
  console.log(`  ✓ Created ${reviewCount} reviews`);

  // ── 9. Webinar Registrations ─────────────────────────────────────
  console.log("\n🎫 Creating webinar registrations...");
  const { data: webinarList } = await admin.from("webinars").select("id").order("created_at");
  if (webinarList && webinarList.length > 0) {
    let regCount = 0;
    for (let wi = 0; wi < webinarList.length; wi++) {
      // Register 3-5 random learners per webinar
      const count = 3 + Math.floor(Math.random() * 3);
      const shuffled = [...learnerIds].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        if (!shuffled[i]) continue;
        const { error } = await admin.from("webinar_registrations").upsert({
          webinar_id: webinarList[wi].id,
          user_id: shuffled[i],
          attended: wi === 3, // mark attended for the completed webinar
        }, { onConflict: "webinar_id,user_id" });
        if (!error) regCount++;
      }
    }
    console.log(`  ✓ Created ${regCount} webinar registrations`);
  }

  // ── Summary ──────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(50));
  console.log("✅ Seed complete!");
  console.log(`   Organizations: ${orgIds.length}`);
  console.log(`   Users: ${userIds.length}`);
  console.log(`   Certificate Templates: ${certTemplateIds.length} new`);
  console.log(`   Courses: ${courseIds.length}`);
  console.log(`   Webinars: ${webinars.length}`);
  console.log(`   Enrollments: ${enrollCount}`);
  console.log(`   Reviews: ${reviewCount}`);
  console.log("\n   All user passwords: Demo1234!");
  console.log("═".repeat(50));
}

main().catch(console.error);
