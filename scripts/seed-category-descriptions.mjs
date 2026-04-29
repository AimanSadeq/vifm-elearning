import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
  return m ? m[1].trim() : null;
};

const supabase = createClient(
  get("NEXT_PUBLIC_SUPABASE_URL"),
  get("SUPABASE_SERVICE_ROLE_KEY")
);

const updates = [
  {
    slug: "all-courses",
    description: "Browse VIFM's complete catalog across every specialty and level.",
    description_ar: "تصفّح كامل كتالوج VIFM في جميع التخصصات والمستويات.",
  },
  {
    slug: "finance",
    description: "Financial analysis, accounting, investment, and corporate finance essentials.",
    description_ar: "التحليل المالي والمحاسبة والاستثمار وأساسيات تمويل الشركات.",
  },
  {
    slug: "data-analytics",
    description: "Excel, Power BI, Tableau, and business reporting for data-driven decisions.",
    description_ar: "إكسل وPower BI وTableau وإعداد التقارير لاتخاذ قرارات قائمة على البيانات.",
  },
  {
    slug: "ai",
    description: "Machine learning, generative AI, and applied intelligence for finance and business.",
    description_ar: "تعلّم الآلة والذكاء الاصطناعي التوليدي وتطبيقاته في المال والأعمال.",
  },
  {
    slug: "strategy-&-leadership",
    description: "Strategic planning, leadership development, and executive decision-making.",
    description_ar: "التخطيط الاستراتيجي وتطوير القيادة واتخاذ القرارات التنفيذية.",
  },
  {
    slug: "real-estate",
    description: "Property valuation, investment, and real estate market fundamentals.",
    description_ar: "تقييم العقارات والاستثمار وأساسيات السوق العقاري.",
  },
  {
    slug: "project-management",
    description: "Planning, execution, and delivery frameworks for modern projects.",
    description_ar: "أُطر التخطيط والتنفيذ والتسليم لإدارة المشاريع الحديثة.",
  },
  {
    slug: "banking",
    description: "Banking operations, regulation, products, and compliance essentials.",
    description_ar: "العمليات المصرفية والتنظيم والمنتجات وأساسيات الامتثال.",
  },
];

for (const u of updates) {
  const { error, data } = await supabase
    .from("categories")
    .update({ description: u.description, description_ar: u.description_ar })
    .eq("slug", u.slug)
    .select("slug");
  if (error) console.log(`  ✗ ${u.slug} :: ${error.message}`);
  else if (!data?.length) console.log(`  ⚠ ${u.slug} :: not found`);
  else console.log(`  ✓ ${u.slug}`);
}
