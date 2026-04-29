import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
  return m ? m[1].trim() : null;
};

const supabase = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"));

const { data: cats } = await supabase
  .from("categories")
  .select("id, name, name_ar, slug, icon, color, sort_order, is_active")
  .order("sort_order");

console.log("=== CATEGORIES ===");
for (const c of cats ?? []) {
  const { count } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true })
    .eq("category_id", c.id);
  console.log(`[${c.sort_order}] ${c.name} (${c.slug}) — ${c.icon ?? "no-icon"} — active=${c.is_active} — ${count} courses`);
}

console.log("\n=== COURSES ===");
const { data: courses } = await supabase
  .from("courses")
  .select("id, title, title_ar, status, category_id")
  .order("title");

for (const co of courses ?? []) {
  const cat = (cats ?? []).find((c) => c.id === co.category_id);
  console.log(`- ${co.title ?? co.title_ar} [${co.status}] → ${cat?.name ?? "(no category)"}`);
}
