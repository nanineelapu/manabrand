/**
 * Creates a staff account (the first admin cannot sign up through the website).
 *   npm run admin:create -- boss@manabrand.in "Strong-Password-123" "Boss Name" [admin|seller] [Super admin]
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (reads .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const [email, password, name = "ManaBrand Admin", role = "admin", adminRole = "Super admin"] = process.argv.slice(2);
if (!email || !password) { console.error("Usage: npm run admin:create -- <email> <password> [name] [admin|seller] [admin role]"); process.exit(1); }
if (password.length < 10) { console.error("Password must be at least 10 characters."); process.exit(1); }
if (!["admin", "seller"].includes(role)) { console.error("Role must be admin or seller."); process.exit(1); }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"); process.exit(1); }

async function main() {
  const supabase = createClient(url!, key!, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(), password, email_confirm: true,
    user_metadata: { full_name: name },
    app_metadata: { provisioned_by: "mana-server", role, admin_role: adminRole },
  });
  if (error) {
    console.error(`Failed: ${error.message}${error.code ? ` (${error.code})` : ""}`);
    if (/database error/i.test(error.message)) {
      console.error("The database refused the new user. Almost always the SQL in supabase/migrations has not been run (or only part of it).");
      console.error("Run every migration file in order in Supabase > SQL Editor, then try again. Details: Supabase > Logs > Postgres.");
    }
    process.exitCode = 1; // (process.exit() here can crash Node on Windows while the connection is still closing)
    return;
  }
  console.log(`Created ${role} ${data.user.email} (${data.user.id}). Sign in at /${role}/login`);
}
main();
