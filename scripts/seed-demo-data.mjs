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

  // ── 10. Modules with Video, Quiz & Document per Course ─────────
  console.log("\n📝 Seeding modules with video, quiz & document lessons...");

  const SAMPLE_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
  const VIDEO_POOL = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  ];

  // Per-course module definitions: 2 modules each with video, document, and quiz
  const courseQuizData = [
    // 0: Financial Statement Analysis Masterclass
    [
      { mTitle: "Foundations of Financial Reporting", mTitle_ar: "أسس التقارير المالية",
        video: "Understanding Financial Statements", doc: "Financial Statements Reference Guide",
        quizTitle: "Financial Reporting Quiz", quizTitle_ar: "اختبار التقارير المالية",
        questions: [
          { q: "Which of the following is NOT one of the three core financial statements?",
            q_ar: "أي مما يلي ليس من القوائم المالية الأساسية الثلاث؟",
            exp: "The three core statements are Income Statement, Balance Sheet, and Cash Flow Statement.",
            opts: ["Income Statement", "Balance Sheet", "Budget Forecast", "Cash Flow Statement"], correct: 2 },
          { q: "What does the balance sheet represent?",
            q_ar: "ماذا تمثل الميزانية العمومية؟",
            exp: "The balance sheet shows a company's assets, liabilities, and equity at a specific point in time.",
            opts: ["Revenue over a period", "A snapshot of assets, liabilities, and equity", "Cash inflows and outflows", "Future earnings projections"], correct: 1 },
          { q: "In the accounting equation, Assets equal:",
            q_ar: "في المعادلة المحاسبية، الأصول تساوي:",
            exp: "The fundamental accounting equation is Assets = Liabilities + Shareholders' Equity.",
            opts: ["Revenue minus Expenses", "Liabilities plus Shareholders' Equity", "Cash plus Receivables", "Income minus Taxes"], correct: 1 },
        ],
      },
      { mTitle: "Ratio Analysis and Interpretation", mTitle_ar: "تحليل النسب والتفسير",
        video: "Key Financial Ratios Explained", doc: "Ratio Analysis Cheat Sheet",
        quizTitle: "Ratio Analysis Quiz", quizTitle_ar: "اختبار تحليل النسب",
        questions: [
          { q: "The current ratio measures a company's ability to:",
            q_ar: "نسبة التداول تقيس قدرة الشركة على:",
            exp: "Current ratio = Current Assets / Current Liabilities. It measures short-term liquidity.",
            opts: ["Generate long-term profits", "Pay short-term obligations", "Grow revenue year-over-year", "Manage inventory turnover"], correct: 1 },
          { q: "A debt-to-equity ratio of 2.0 means:",
            q_ar: "نسبة الدين إلى حقوق الملكية 2.0 تعني:",
            exp: "D/E of 2.0 means the company has twice as much debt as equity financing.",
            opts: ["The company has no debt", "Debt is twice the equity", "Equity is twice the debt", "The company is bankrupt"], correct: 1 },
          { q: "Which ratio best measures profitability relative to sales?",
            q_ar: "أي نسبة تقيس الربحية بالنسبة للمبيعات؟",
            exp: "Net profit margin = Net Income / Revenue, showing profit earned per dollar of sales.",
            opts: ["Current ratio", "Net profit margin", "Debt-to-equity ratio", "Price-to-earnings ratio"], correct: 1 },
        ],
      },
    ],
    // 1: Investment Banking Fundamentals
    [
      { mTitle: "Investment Banking Overview", mTitle_ar: "نظرة عامة على الخدمات المصرفية الاستثمارية",
        video: "What Investment Banks Really Do", doc: "Investment Banking Industry Guide",
        quizTitle: "Investment Banking Basics Quiz", quizTitle_ar: "اختبار أساسيات الخدمات المصرفية الاستثمارية",
        questions: [
          { q: "What is the primary function of an investment bank?",
            q_ar: "ما هي الوظيفة الأساسية للبنك الاستثماري؟",
            exp: "Investment banks primarily help companies raise capital and provide advisory services for M&A.",
            opts: ["Accepting retail deposits", "Raising capital and M&A advisory", "Issuing credit cards", "Managing personal savings accounts"], correct: 1 },
          { q: "What does IPO stand for?",
            q_ar: "ماذا يعني الاكتتاب العام الأولي؟",
            exp: "IPO stands for Initial Public Offering — the first sale of stock by a company to the public.",
            opts: ["Internal Profit Optimization", "Initial Public Offering", "Investor Portfolio Option", "International Purchase Order"], correct: 1 },
          { q: "In a DCF valuation, what is being discounted?",
            q_ar: "في تقييم التدفقات النقدية المخصومة، ما الذي يتم خصمه؟",
            exp: "DCF (Discounted Cash Flow) discounts projected future cash flows to their present value.",
            opts: ["Past revenues", "Future cash flows", "Current stock price", "Historical dividends"], correct: 1 },
        ],
      },
      { mTitle: "M&A and Deal Structuring", mTitle_ar: "الاندماج والاستحواذ وهيكلة الصفقات",
        video: "Anatomy of an M&A Deal", doc: "M&A Term Sheet Template",
        quizTitle: "M&A Knowledge Check", quizTitle_ar: "اختبار معرفة الاندماج والاستحواذ",
        questions: [
          { q: "Which valuation method uses data from similar publicly traded companies?",
            q_ar: "أي طريقة تقييم تستخدم بيانات من شركات مماثلة مدرجة في البورصة؟",
            exp: "Comparable Company Analysis (Comps) uses multiples from similar public companies.",
            opts: ["DCF Analysis", "Comparable Company Analysis", "Asset-based valuation", "Book value method"], correct: 1 },
          { q: "What is a 'buy-side' advisor in M&A?",
            q_ar: "ما هو مستشار 'جانب المشتري' في الاندماج والاستحواذ؟",
            exp: "A buy-side advisor represents the acquiring company in an M&A transaction.",
            opts: ["Advisor to the selling company", "Advisor to the acquiring company", "A regulatory body", "An independent auditor"], correct: 1 },
          { q: "What does EV/EBITDA measure?",
            q_ar: "ماذا يقيس EV/EBITDA؟",
            exp: "EV/EBITDA is an enterprise value multiple used to assess overall valuation relative to earnings.",
            opts: ["Share price relative to earnings", "Enterprise value relative to operating earnings", "Revenue growth rate", "Cash flow per share"], correct: 1 },
        ],
      },
    ],
    // 2: Islamic Finance and Sukuk
    [
      { mTitle: "Principles of Islamic Finance", mTitle_ar: "مبادئ التمويل الإسلامي",
        video: "Introduction to Shariah-Compliant Finance", doc: "Islamic Finance Key Concepts",
        quizTitle: "Islamic Finance Principles Quiz", quizTitle_ar: "اختبار مبادئ التمويل الإسلامي",
        questions: [
          { q: "What does 'Riba' refer to in Islamic finance?",
            q_ar: "ماذا يعني 'الربا' في التمويل الإسلامي؟",
            exp: "Riba refers to interest or usury, which is prohibited under Islamic law.",
            opts: ["Profit sharing", "Interest or usury", "Charitable giving", "Risk sharing"], correct: 1 },
          { q: "Which of the following is a Shariah-compliant contract?",
            q_ar: "أي من العقود التالية متوافق مع الشريعة؟",
            exp: "Murabaha (cost-plus financing) is a widely used Shariah-compliant contract.",
            opts: ["Conventional mortgage", "Murabaha (cost-plus financing)", "Interest-bearing bond", "Standard credit card debt"], correct: 1 },
          { q: "What is 'Gharar' in Islamic finance?",
            q_ar: "ما هو 'الغرر' في التمويل الإسلامي؟",
            exp: "Gharar refers to excessive uncertainty or ambiguity in contracts, which is prohibited.",
            opts: ["Profit sharing", "Asset backing", "Excessive uncertainty in contracts", "Tax on wealth"], correct: 2 },
        ],
      },
      { mTitle: "Sukuk Structures and Markets", mTitle_ar: "هياكل الصكوك والأسواق",
        video: "Understanding Sukuk Structures", doc: "Global Sukuk Market Report",
        quizTitle: "Sukuk Knowledge Assessment", quizTitle_ar: "تقييم معرفة الصكوك",
        questions: [
          { q: "What is a Sukuk?",
            q_ar: "ما هو الصكوك؟",
            exp: "Sukuk are Islamic financial certificates similar to bonds but backed by tangible assets.",
            opts: ["A conventional bond", "An Islamic financial certificate backed by assets", "A type of equity share", "A derivative instrument"], correct: 1 },
          { q: "Sukuk al-Ijarah is based on which type of contract?",
            q_ar: "صكوك الإجارة مبنية على أي نوع من العقود؟",
            exp: "Sukuk al-Ijarah is based on a leasing contract where the issuer leases an asset to investors.",
            opts: ["Sale contract", "Leasing contract", "Partnership contract", "Agency contract"], correct: 1 },
          { q: "Which country is the largest issuer of Sukuk globally?",
            q_ar: "أي دولة هي أكبر مُصدر للصكوك عالمياً؟",
            exp: "Malaysia is the world's largest Sukuk issuer, followed by Saudi Arabia and Indonesia.",
            opts: ["UAE", "Malaysia", "United Kingdom", "Turkey"], correct: 1 },
        ],
      },
    ],
    // 3: Python for Financial Analysis
    [
      { mTitle: "Python Programming Essentials", mTitle_ar: "أساسيات برمجة بايثون",
        video: "Getting Started with Python for Finance", doc: "Python Quick Reference Card",
        quizTitle: "Python Basics Quiz", quizTitle_ar: "اختبار أساسيات بايثون",
        questions: [
          { q: "Which Python library is most commonly used for data manipulation in finance?",
            q_ar: "أي مكتبة بايثون تُستخدم بشكل شائع لمعالجة البيانات المالية؟",
            exp: "Pandas is the standard library for data manipulation and analysis in financial applications.",
            opts: ["Django", "Pandas", "Flask", "Tkinter"], correct: 1 },
          { q: "What is a DataFrame in Pandas?",
            q_ar: "ما هو DataFrame في مكتبة Pandas؟",
            exp: "A DataFrame is a 2-dimensional labeled data structure with columns of potentially different types.",
            opts: ["A single column of data", "A 2D labeled data structure", "A Python function", "A database connection"], correct: 1 },
          { q: "Which function reads a CSV file into a Pandas DataFrame?",
            q_ar: "أي دالة تقرأ ملف CSV إلى DataFrame في Pandas؟",
            exp: "pd.read_csv() is used to read CSV files into a Pandas DataFrame.",
            opts: ["pd.load_csv()", "pd.read_csv()", "pd.import_csv()", "pd.open_csv()"], correct: 1 },
        ],
      },
      { mTitle: "Financial Data Analysis with Pandas", mTitle_ar: "تحليل البيانات المالية مع Pandas",
        video: "Time Series Analysis in Python", doc: "Pandas Financial Analysis Cookbook",
        quizTitle: "Financial Data Analysis Quiz", quizTitle_ar: "اختبار تحليل البيانات المالية",
        questions: [
          { q: "What does the .rolling() method in Pandas compute?",
            q_ar: "ماذا تحسب طريقة .rolling() في Pandas؟",
            exp: "The .rolling() method calculates moving/rolling window statistics like moving averages.",
            opts: ["Data sorting", "Moving window calculations", "Data filtering", "Column renaming"], correct: 1 },
          { q: "Which library is used for creating financial charts in Python?",
            q_ar: "أي مكتبة تُستخدم لإنشاء الرسوم البيانية المالية في بايثون؟",
            exp: "Matplotlib is the foundational plotting library, often used with Seaborn for financial visualizations.",
            opts: ["NumPy", "Matplotlib", "SciPy", "Requests"], correct: 1 },
          { q: "What does the Sharpe Ratio measure in portfolio analysis?",
            q_ar: "ماذا تقيس نسبة شارب في تحليل المحفظة؟",
            exp: "The Sharpe Ratio measures risk-adjusted return: (Return - Risk-Free Rate) / Standard Deviation.",
            opts: ["Total return only", "Risk-adjusted return", "Maximum drawdown", "Trading volume"], correct: 1 },
        ],
      },
    ],
    // 4: Machine Learning in Banking
    [
      { mTitle: "ML Foundations for Financial Services", mTitle_ar: "أسس التعلم الآلي للخدمات المالية",
        video: "Introduction to ML in Banking", doc: "ML Algorithms Overview for Finance",
        quizTitle: "ML Foundations Quiz", quizTitle_ar: "اختبار أسس التعلم الآلي",
        questions: [
          { q: "Which type of machine learning is used for credit scoring?",
            q_ar: "أي نوع من التعلم الآلي يُستخدم لتصنيف الائتمان؟",
            exp: "Supervised learning is used for credit scoring because we have labeled historical data (good/bad loans).",
            opts: ["Unsupervised learning", "Supervised learning", "Reinforcement learning", "Transfer learning"], correct: 1 },
          { q: "What is a 'feature' in machine learning?",
            q_ar: "ما هي 'الميزة' في التعلم الآلي؟",
            exp: "A feature is an individual measurable property used as input to a machine learning model.",
            opts: ["The model's prediction", "An input variable used for prediction", "The training algorithm", "The accuracy metric"], correct: 1 },
          { q: "What is overfitting in a machine learning model?",
            q_ar: "ما هو الإفراط في التخصيص في نموذج التعلم الآلي؟",
            exp: "Overfitting occurs when a model learns noise in training data and performs poorly on new data.",
            opts: ["Model is too simple", "Model memorizes training data but fails on new data", "Model has too few features", "Model trains too slowly"], correct: 1 },
        ],
      },
      { mTitle: "Fraud Detection and Credit Risk", mTitle_ar: "كشف الاحتيال ومخاطر الائتمان",
        video: "Building Fraud Detection Systems", doc: "Credit Risk Modeling Handbook",
        quizTitle: "Fraud Detection & Credit Risk Quiz", quizTitle_ar: "اختبار كشف الاحتيال ومخاطر الائتمان",
        questions: [
          { q: "Which technique is commonly used for anomaly detection in fraud?",
            q_ar: "أي تقنية تُستخدم عادةً لكشف الشذوذ في الاحتيال؟",
            exp: "Isolation Forest is specifically designed for anomaly detection and works well for fraud detection.",
            opts: ["Linear Regression", "Isolation Forest", "K-Means Clustering", "Principal Component Analysis"], correct: 1 },
          { q: "What is the purpose of a confusion matrix?",
            q_ar: "ما هو الغرض من مصفوفة الارتباك؟",
            exp: "A confusion matrix shows true/false positives and negatives to evaluate classification performance.",
            opts: ["To visualize data clusters", "To evaluate classification model performance", "To reduce dimensionality", "To normalize features"], correct: 1 },
          { q: "In credit scoring, what does PD stand for?",
            q_ar: "في تصنيف الائتمان، ماذا يعني PD؟",
            exp: "PD stands for Probability of Default — the likelihood that a borrower will fail to repay.",
            opts: ["Payment Duration", "Probability of Default", "Portfolio Diversification", "Predictive Data"], correct: 1 },
        ],
      },
    ],
    // 5: Data Visualization with Power BI
    [
      { mTitle: "Power BI Fundamentals", mTitle_ar: "أساسيات Power BI",
        video: "Power BI Interface and Data Connections", doc: "Power BI Getting Started Guide",
        quizTitle: "Power BI Basics Quiz", quizTitle_ar: "اختبار أساسيات Power BI",
        questions: [
          { q: "What is DAX in Power BI?",
            q_ar: "ما هو DAX في Power BI؟",
            exp: "DAX (Data Analysis Expressions) is the formula language used in Power BI for calculations.",
            opts: ["A visualization type", "Data Analysis Expressions formula language", "A data connector", "A file format"], correct: 1 },
          { q: "Which Power BI view is used to create relationships between tables?",
            q_ar: "أي عرض في Power BI يُستخدم لإنشاء العلاقات بين الجداول؟",
            exp: "The Model view in Power BI Desktop is used to create and manage table relationships.",
            opts: ["Report view", "Model view", "Data view", "Dashboard view"], correct: 1 },
          { q: "What type of visual best shows trends over time?",
            q_ar: "أي نوع من التصورات يُظهر الاتجاهات بشكل أفضل بمرور الوقت؟",
            exp: "Line charts are the standard visual for showing trends and changes over time periods.",
            opts: ["Pie chart", "Line chart", "Card visual", "Tree map"], correct: 1 },
        ],
      },
      { mTitle: "Financial Dashboards in Power BI", mTitle_ar: "لوحات المعلومات المالية في Power BI",
        video: "Building Revenue and P&L Dashboards", doc: "Dashboard Design Best Practices",
        quizTitle: "Financial Dashboards Quiz", quizTitle_ar: "اختبار لوحات المعلومات المالية",
        questions: [
          { q: "What is a KPI visual used for in financial dashboards?",
            q_ar: "ما هو استخدام عنصر KPI في لوحات المعلومات المالية؟",
            exp: "KPI visuals display a key metric against a target, showing progress toward financial goals.",
            opts: ["Displaying raw data tables", "Showing a metric's progress against a target", "Creating data relationships", "Filtering dashboard data"], correct: 1 },
          { q: "Which DAX function is used with date functions to create running totals?",
            q_ar: "أي دالة DAX تُستخدم مع دوال التاريخ لإنشاء مجاميع تراكمية؟",
            exp: "CALCULATE with date filter context is commonly used to create running totals (YTD, QTD).",
            opts: ["SUM()", "CALCULATE()", "COUNT()", "AVERAGE()"], correct: 1 },
          { q: "What is the purpose of row-level security (RLS) in Power BI?",
            q_ar: "ما هو الغرض من أمان مستوى الصف (RLS) في Power BI؟",
            exp: "RLS restricts data access so users only see data they are authorized to view.",
            opts: ["To improve query speed", "To restrict data access per user role", "To create visualizations", "To connect to databases"], correct: 1 },
        ],
      },
    ],
    // 6: Strategic Leadership in Financial Services
    [
      { mTitle: "Leadership Foundations in Finance", mTitle_ar: "أسس القيادة في المالية",
        video: "The Evolving Role of Financial Leaders", doc: "Leadership Competency Framework",
        quizTitle: "Leadership Foundations Quiz", quizTitle_ar: "اختبار أسس القيادة",
        questions: [
          { q: "Which leadership style involves collaborative decision-making with the team?",
            q_ar: "أي أسلوب قيادة يتضمن اتخاذ قرارات تعاونية مع الفريق؟",
            exp: "Democratic/participative leadership involves team members in the decision-making process.",
            opts: ["Autocratic", "Democratic/Participative", "Laissez-faire", "Transactional"], correct: 1 },
          { q: "What is a key characteristic of transformational leadership?",
            q_ar: "ما هي السمة الرئيسية للقيادة التحويلية؟",
            exp: "Transformational leaders inspire and motivate followers to exceed expectations through vision.",
            opts: ["Strict rule enforcement", "Inspiring others to achieve beyond expectations", "Minimal team interaction", "Focus solely on financial metrics"], correct: 1 },
          { q: "In change management, what does the 'burning platform' concept refer to?",
            q_ar: "في إدارة التغيير، ماذا يعني مفهوم 'المنصة المشتعلة'؟",
            exp: "The burning platform creates urgency for change by highlighting the risks of maintaining the status quo.",
            opts: ["A failed IT project", "Creating urgency by showing risks of not changing", "A physical workspace redesign", "A type of agile methodology"], correct: 1 },
        ],
      },
      { mTitle: "Strategic Execution and Team Building", mTitle_ar: "التنفيذ الاستراتيجي وبناء الفريق",
        video: "Building High-Performing Financial Teams", doc: "Strategic Planning Toolkit",
        quizTitle: "Strategic Execution Quiz", quizTitle_ar: "اختبار التنفيذ الاستراتيجي",
        questions: [
          { q: "What is a Balanced Scorecard used for?",
            q_ar: "ما هو استخدام بطاقة الأداء المتوازن؟",
            exp: "A Balanced Scorecard measures performance across financial, customer, process, and learning perspectives.",
            opts: ["Only tracking financial metrics", "Measuring performance across multiple perspectives", "Managing employee attendance", "Auditing financial statements"], correct: 1 },
          { q: "Which framework is commonly used for strategic analysis?",
            q_ar: "أي إطار يُستخدم عادةً للتحليل الاستراتيجي؟",
            exp: "SWOT Analysis examines Strengths, Weaknesses, Opportunities, and Threats for strategic planning.",
            opts: ["FIFO method", "SWOT Analysis", "GAAP framework", "Basel III"], correct: 1 },
          { q: "What does 'stakeholder management' primarily involve?",
            q_ar: "ماذا تتضمن 'إدارة أصحاب المصلحة' بشكل أساسي؟",
            exp: "Stakeholder management involves identifying, analyzing, and engaging people affected by decisions.",
            opts: ["Managing financial investments", "Identifying and engaging with affected parties", "Processing payroll", "Conducting IT audits"], correct: 1 },
        ],
      },
    ],
    // 7: Enterprise Risk Management Framework
    [
      { mTitle: "ERM Framework Essentials", mTitle_ar: "أساسيات إطار إدارة المخاطر المؤسسية",
        video: "Introduction to Enterprise Risk Management", doc: "ERM Framework Reference Guide",
        quizTitle: "ERM Essentials Quiz", quizTitle_ar: "اختبار أساسيات إدارة المخاطر",
        questions: [
          { q: "What are the three lines of defense in risk management?",
            q_ar: "ما هي خطوط الدفاع الثلاثة في إدارة المخاطر؟",
            exp: "The three lines are: 1) Business operations, 2) Risk management & compliance, 3) Internal audit.",
            opts: ["IT, HR, Finance", "Operations, Risk/Compliance, Internal Audit", "Board, CEO, CFO", "Sales, Marketing, Legal"], correct: 1 },
          { q: "What does VaR (Value at Risk) measure?",
            q_ar: "ماذا يقيس القيمة المعرضة للخطر (VaR)؟",
            exp: "VaR estimates the maximum potential loss over a specific time period at a given confidence level.",
            opts: ["Average daily profit", "Maximum potential loss at a confidence level", "Total assets under management", "Annual revenue growth"], correct: 1 },
          { q: "What is 'risk appetite' in the context of ERM?",
            q_ar: "ما هي 'الرغبة في المخاطرة' في سياق إدارة المخاطر؟",
            exp: "Risk appetite is the level of risk an organization is willing to accept in pursuit of its objectives.",
            opts: ["Avoiding all risks", "The level of risk an org is willing to accept", "The maximum loss ever incurred", "A regulatory requirement only"], correct: 1 },
        ],
      },
      { mTitle: "Market and Operational Risk", mTitle_ar: "مخاطر السوق والمخاطر التشغيلية",
        video: "VaR Modeling and Stress Testing", doc: "Basel III Capital Requirements Summary",
        quizTitle: "Market & Operational Risk Quiz", quizTitle_ar: "اختبار مخاطر السوق والتشغيلية",
        questions: [
          { q: "Which Basel accord primarily addresses operational risk?",
            q_ar: "أي اتفاقية بازل تعالج بشكل أساسي المخاطر التشغيلية؟",
            exp: "Basel II introduced a formal framework for operational risk capital requirements.",
            opts: ["Basel I", "Basel II", "Dodd-Frank Act", "Sarbanes-Oxley"], correct: 1 },
          { q: "What is a stress test in risk management?",
            q_ar: "ما هو اختبار الإجهاد في إدارة المخاطر؟",
            exp: "A stress test simulates extreme market conditions to assess the resilience of financial institutions.",
            opts: ["A routine audit", "Simulating extreme conditions to test resilience", "A customer satisfaction survey", "A compliance checklist"], correct: 1 },
          { q: "What does operational risk include?",
            q_ar: "ماذا تتضمن المخاطر التشغيلية؟",
            exp: "Operational risk includes losses from failed processes, people, systems, or external events.",
            opts: ["Only market price fluctuations", "Losses from failed processes, people, or systems", "Only credit defaults", "Only regulatory fines"], correct: 1 },
        ],
      },
    ],
    // 8: Digital Transformation in Banking
    [
      { mTitle: "Digital Banking Landscape", mTitle_ar: "مشهد الخدمات المصرفية الرقمية",
        video: "State of Digital Banking in 2026", doc: "Digital Transformation Roadmap Template",
        quizTitle: "Digital Banking Quiz", quizTitle_ar: "اختبار الخدمات المصرفية الرقمية",
        questions: [
          { q: "What is 'Open Banking'?",
            q_ar: "ما هي 'الخدمات المصرفية المفتوحة'؟",
            exp: "Open Banking allows third-party developers to access bank data through APIs with customer consent.",
            opts: ["Banks with no physical branches", "API-based sharing of financial data with third parties", "Free banking services", "Government-owned banks"], correct: 1 },
          { q: "What does API stand for in the context of banking technology?",
            q_ar: "ماذا يعني API في سياق تكنولوجيا الخدمات المصرفية؟",
            exp: "API stands for Application Programming Interface, enabling different software systems to communicate.",
            opts: ["Automated Payment Integration", "Application Programming Interface", "Annual Performance Index", "Account Processing Infrastructure"], correct: 1 },
          { q: "Which technology enables real-time, tamper-proof transaction records?",
            q_ar: "أي تقنية تمكّن من سجلات معاملات فورية ومقاومة للتلاعب؟",
            exp: "Blockchain provides distributed, immutable ledger technology for tamper-proof transaction records.",
            opts: ["Cloud computing", "Blockchain", "Machine learning", "Virtual reality"], correct: 1 },
        ],
      },
      { mTitle: "Fintech Innovation and AI", mTitle_ar: "ابتكار التكنولوجيا المالية والذكاء الاصطناعي",
        video: "AI and Chatbots in Customer Service", doc: "Fintech Partnership Evaluation Guide",
        quizTitle: "Fintech & AI Quiz", quizTitle_ar: "اختبار التكنولوجيا المالية والذكاء الاصطناعي",
        questions: [
          { q: "What is a neobank?",
            q_ar: "ما هو البنك الرقمي (نيوبنك)؟",
            exp: "A neobank is a digital-only bank with no physical branches, operating entirely through mobile/web.",
            opts: ["A traditional bank with new management", "A digital-only bank with no branches", "A central bank", "A bank specializing in loans"], correct: 1 },
          { q: "What is the primary benefit of AI chatbots in banking?",
            q_ar: "ما هي الفائدة الرئيسية لروبوتات الدردشة بالذكاء الاصطناعي في الخدمات المصرفية؟",
            exp: "AI chatbots provide 24/7 customer service, handling routine inquiries and reducing wait times.",
            opts: ["Replacing all human staff", "Providing 24/7 automated customer support", "Generating investment advice", "Processing loan applications only"], correct: 1 },
          { q: "What does CBDC stand for?",
            q_ar: "ماذا يعني CBDC؟",
            exp: "CBDC stands for Central Bank Digital Currency — a digital form of fiat money issued by central banks.",
            opts: ["Corporate Banking Digital Contract", "Central Bank Digital Currency", "Cross-Border Digital Clearing", "Commercial Banking Data Center"], correct: 1 },
        ],
      },
    ],
    // 9: Anti-Money Laundering Compliance
    [
      { mTitle: "AML Regulatory Framework", mTitle_ar: "الإطار التنظيمي لمكافحة غسل الأموال",
        video: "Understanding AML Regulations", doc: "FATF Recommendations Summary",
        quizTitle: "AML Regulations Quiz", quizTitle_ar: "اختبار أنظمة مكافحة غسل الأموال",
        questions: [
          { q: "What are the three stages of money laundering?",
            q_ar: "ما هي المراحل الثلاث لغسل الأموال؟",
            exp: "Money laundering involves Placement (introducing funds), Layering (concealing origin), and Integration (using funds).",
            opts: ["Opening, Moving, Closing", "Placement, Layering, Integration", "Deposit, Transfer, Withdrawal", "Collection, Processing, Distribution"], correct: 1 },
          { q: "What does KYC stand for?",
            q_ar: "ماذا يعني KYC؟",
            exp: "KYC stands for Know Your Customer — the process of verifying client identity and assessing risk.",
            opts: ["Keep Your Cash", "Know Your Customer", "Key Yield Calculation", "Know Your Compliance"], correct: 1 },
          { q: "What organization sets global AML standards?",
            q_ar: "أي منظمة تضع معايير مكافحة غسل الأموال العالمية؟",
            exp: "FATF (Financial Action Task Force) sets international standards for combating money laundering.",
            opts: ["World Bank", "FATF (Financial Action Task Force)", "International Monetary Fund", "World Trade Organization"], correct: 1 },
        ],
      },
      { mTitle: "KYC and Suspicious Activity Reporting", mTitle_ar: "اعرف عميلك والإبلاغ عن الأنشطة المشبوهة",
        video: "CDD and Enhanced Due Diligence", doc: "SAR Filing Guide",
        quizTitle: "KYC & SAR Quiz", quizTitle_ar: "اختبار اعرف عميلك والإبلاغ",
        questions: [
          { q: "What is Enhanced Due Diligence (EDD) required for?",
            q_ar: "متى تكون العناية الواجبة المعززة (EDD) مطلوبة؟",
            exp: "EDD is required for high-risk customers such as PEPs and customers from high-risk jurisdictions.",
            opts: ["All customers equally", "High-risk customers and PEPs", "Only corporate clients", "Only international transfers"], correct: 1 },
          { q: "What triggers the filing of a Suspicious Activity Report (SAR)?",
            q_ar: "ما الذي يستدعي تقديم تقرير نشاط مشبوه (SAR)؟",
            exp: "A SAR is filed when transactions appear unusual or potentially related to illegal activity.",
            opts: ["Every transaction over $100", "Transactions that appear unusual or potentially illegal", "All international wire transfers", "Monthly account statements"], correct: 1 },
          { q: "What is a Politically Exposed Person (PEP)?",
            q_ar: "ما هو الشخص المعرض سياسياً (PEP)؟",
            exp: "A PEP is someone entrusted with a prominent public function, posing higher risk for corruption.",
            opts: ["Any government employee", "A person with a prominent public function posing higher risk", "A bank executive", "A foreign tourist"], correct: 1 },
        ],
      },
    ],
  ];

  let seedModules = 0, seedLessons = 0, seedQuizzes = 0, seedQuestions = 0;

  if (courseIds.length > 0) {
    // ── Clean existing modules/lessons/quizzes ──
    const { data: existingQuizzes } = await admin.from("quizzes").select("id").in("course_id", courseIds);
    const quizIdsToDelete = (existingQuizzes || []).map(q => q.id);

    if (quizIdsToDelete.length > 0) {
      const { data: existingQs } = await admin.from("quiz_questions").select("id").in("quiz_id", quizIdsToDelete);
      const questionIdsToDelete = (existingQs || []).map(q => q.id);
      if (questionIdsToDelete.length > 0) {
        await admin.from("quiz_options").delete().in("question_id", questionIdsToDelete);
      }
      await admin.from("quiz_questions").delete().in("quiz_id", quizIdsToDelete);
      await admin.from("quiz_attempts").delete().in("quiz_id", quizIdsToDelete);
    }
    await admin.from("quizzes").delete().in("course_id", courseIds);
    await admin.from("watch_statistics").delete().in("course_id", courseIds);
    await admin.from("lesson_bookmarks").delete().in("course_id", courseIds);
    await admin.from("lesson_progress").delete().in("course_id", courseIds);
    for (const cid of courseIds) {
      await admin.from("enrollments").update({ last_lesson_id: null }).eq("course_id", cid);
    }
    await admin.from("forum_posts").delete().in("course_id", courseIds).not("parent_id", "is", null);
    await admin.from("forum_posts").delete().in("course_id", courseIds);
    await admin.from("lessons").delete().in("course_id", courseIds);
    await admin.from("modules").delete().in("course_id", courseIds);
    console.log("  Cleaned existing modules/lessons/quizzes");

    // ── Create modules, lessons, quizzes ──
    for (let ci = 0; ci < courseIds.length; ci++) {
      const courseId = courseIds[ci];
      const moduleDefs = courseQuizData[ci];
      if (!moduleDefs) continue;

      for (let mi = 0; mi < moduleDefs.length; mi++) {
        const mod = moduleDefs[mi];

        // Insert module
        const { data: moduleData, error: modErr } = await admin.from("modules").insert({
          course_id: courseId,
          title: mod.mTitle,
          title_ar: mod.mTitle_ar || null,
          sort_order: mi,
          is_preview: mi === 0,
          duration_minutes: 35,
        }).select("id").single();

        if (modErr || !moduleData) {
          console.error(`    Module error [${ci}/${mi}]:`, modErr?.message);
          continue;
        }
        seedModules++;

        const videoUrl = VIDEO_POOL[(ci + mi) % VIDEO_POOL.length];

        // Video lesson (sort_order 0)
        await admin.from("lessons").insert({
          module_id: moduleData.id,
          course_id: courseId,
          title: mod.video,
          content_type: "video",
          video_url: videoUrl,
          video_duration_seconds: 600 + ci * 30 + mi * 120,
          video_thumbnail_url: THUMBNAILS[ci % THUMBNAILS.length],
          duration_minutes: 15,
          sort_order: 0,
          is_preview: mi === 0,
          is_mandatory: true,
          description: `Watch this video lesson on ${mod.video.toLowerCase()}.`,
        });
        seedLessons++;

        // Document lesson (sort_order 1)
        await admin.from("lessons").insert({
          module_id: moduleData.id,
          course_id: courseId,
          title: mod.doc,
          content_type: "document",
          document_url: SAMPLE_PDF_URL,
          document_type: "pdf",
          duration_minutes: 10,
          sort_order: 1,
          is_preview: false,
          is_mandatory: false,
          description: `Read through the ${mod.doc.toLowerCase()} to reinforce your understanding.`,
        });
        seedLessons++;

        // Quiz lesson (sort_order 2)
        const { data: quizLesson, error: qlErr } = await admin.from("lessons").insert({
          module_id: moduleData.id,
          course_id: courseId,
          title: mod.quizTitle,
          content_type: "quiz",
          duration_minutes: 10,
          sort_order: 2,
          is_preview: false,
          is_mandatory: true,
          description: "Test your knowledge with this multiple-choice quiz.",
        }).select("id").single();
        seedLessons++;

        if (qlErr || !quizLesson) continue;

        // Create quiz record
        const { data: quiz, error: quizErr } = await admin.from("quizzes").insert({
          lesson_id: quizLesson.id,
          course_id: courseId,
          title: mod.quizTitle,
          title_ar: mod.quizTitle_ar || null,
          description: `Assessment for ${mod.mTitle}`,
          passing_score: 70,
          max_attempts: 3,
          time_limit_minutes: 15,
          shuffle_questions: true,
          show_correct_answers: true,
          is_published: true,
          is_final_exam: mi === moduleDefs.length - 1,
          sort_order: mi,
        }).select("id").single();

        if (quizErr || !quiz) {
          console.error(`    Quiz error [${ci}/${mi}]:`, quizErr?.message);
          continue;
        }
        seedQuizzes++;

        // Create questions and options
        for (let qi = 0; qi < mod.questions.length; qi++) {
          const qDef = mod.questions[qi];

          const { data: question, error: qErr } = await admin.from("quiz_questions").insert({
            quiz_id: quiz.id,
            question_text: qDef.q,
            question_text_ar: qDef.q_ar || null,
            question_type: "multiple_choice",
            points: 1,
            explanation: qDef.exp || null,
            sort_order: qi,
          }).select("id").single();

          if (qErr || !question) continue;
          seedQuestions++;

          await admin.from("quiz_options").insert(
            qDef.opts.map((optText, oi) => ({
              question_id: question.id,
              option_text: optText,
              is_correct: oi === qDef.correct,
              sort_order: oi,
            }))
          );
        }
      }
    }

    console.log(`  ✓ ${seedModules} modules, ${seedLessons} lessons, ${seedQuizzes} quizzes, ${seedQuestions} questions`);
  }

  // ── Summary ──────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(50));
  console.log("✅ Seed complete!");
  console.log(`   Organizations: ${orgIds.length}`);
  console.log(`   Users: ${userIds.length}`);
  console.log(`   Certificate Templates: ${certTemplateIds.length} new`);
  console.log(`   Courses: ${courseIds.length}`);
  console.log(`   Modules: ${seedModules} (${seedLessons} lessons, ${seedQuizzes} quizzes, ${seedQuestions} questions)`);
  console.log(`   Webinars: ${webinars.length}`);
  console.log(`   Enrollments: ${enrollCount}`);
  console.log(`   Reviews: ${reviewCount}`);
  console.log("\n   All user passwords: Demo1234!");
  console.log("═".repeat(50));
}

main().catch(console.error);
