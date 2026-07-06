import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const testUsers = [
  {
    email: "admin@viftraining.com",
    password: "Vifm@2017!",
    full_name: "Admin User",
    role: "super_admin",
  },
  {
    email: "instructor@viftraining.com",
    password: "Instructor@2026!",
    full_name: "Instructor User",
    role: "instructor",
  },
  {
    email: "corporate@viftraining.com",
    password: "Corporate@2026!",
    full_name: "Corporate Admin",
    role: "corporate_admin",
  },
  {
    email: "learner@viftraining.com",
    password: "Learner@2026!",
    full_name: "Learner User",
    role: "learner",
  },
];

async function fixTestUsers() {
  for (const user of testUsers) {
    // First, find the user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("Failed to list users:", listError.message);
      return;
    }

    const existingUser = users.find((u) => u.email === user.email);

    if (existingUser) {
      // Update existing user: set role in app_metadata (this is what middleware reads)
      const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
        app_metadata: { role: user.role },
        user_metadata: { full_name: user.full_name, role: user.role },
      });

      if (error) {
        console.error(`Failed to update ${user.email}:`, error.message);
      } else {
        console.log(`Fixed ${user.role}: ${user.email} -> app_metadata.role = "${user.role}"`);
      }

      // Also ensure profile table is correct
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: user.role, full_name: user.full_name })
        .eq("id", existingUser.id);

      if (profileError) {
        console.error(`  -> Profile update failed:`, profileError.message);
      } else {
        console.log(`  -> Profile role confirmed: ${user.role}`);
      }
    } else {
      // Create new user with app_metadata
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        app_metadata: { role: user.role },
        user_metadata: { full_name: user.full_name, role: user.role },
      });

      if (error) {
        console.error(`Failed to create ${user.email}:`, error.message);
        continue;
      }

      console.log(`Created ${user.role}: ${user.email} with app_metadata.role = "${user.role}"`);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: user.role, full_name: user.full_name })
        .eq("id", data.user.id);

      if (profileError) {
        console.error(`  -> Profile update failed:`, profileError.message);
      } else {
        console.log(`  -> Profile role set: ${user.role}`);
      }
    }
  }

  console.log("\n--- Test Accounts (Fixed) ---");
  console.log("| Role             | Email                  | Password          |");
  console.log("|------------------|------------------------|-------------------|");
  for (const user of testUsers) {
    console.log(`| ${user.role.padEnd(16)} | ${user.email.padEnd(22)} | ${user.password.padEnd(17)} |`);
  }
}

fixTestUsers();
