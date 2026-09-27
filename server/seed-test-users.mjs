/**
 * seed-test-users.mjs
 * Creates 5 test users in Supabase Auth using the service-role key.
 * Run from: c:\Users\OWAIS KHAN\Desktop\aasPass\server
 *   node seed-test-users.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tbyolrpqisqahinsuoof.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieW9scnBxaXNxYWhpbnN1b29mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTEzMjE2NCwiZXhwIjoyMTAwNzA4MTY0fQ.0FnBmd0lXTi59ZwXNf4_h2hIYdFfX7606MOwdrVD2LM";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testUsers = [
  { email: "fardeen@aaspass.test", password: "Test@123456", first_name: "Fardeen", last_name: "Khan" },
  { email: "ayesha@aaspass.test",  password: "Test@123456", first_name: "Ayesha",  last_name: "Siddiqui" },
  { email: "rahul@aaspass.test",   password: "Test@123456", first_name: "Rahul",   last_name: "Sharma" },
  { email: "priya@aaspass.test",   password: "Test@123456", first_name: "Priya",   last_name: "Verma" },
  { email: "arjun@aaspass.test",   password: "Test@123456", first_name: "Arjun",   last_name: "Mehta" },
];

console.log("🌱  Seeding test users into Supabase Auth...\n");

for (const user of testUsers) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,         // skip email verification
    user_metadata: {
      first_name: user.first_name,
      last_name:  user.last_name,
    },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log(`⚠️   ${user.email}  — already exists, skipping`);
    } else {
      console.error(`❌  ${user.email}  — ${error.message}`);
    }
  } else {
    console.log(`✅  ${user.email}  — created  (id: ${data.user.id})`);
  }
}

console.log("\n🎉  Done! All test users are email-confirmed and ready to sign in.");
console.log("\n📋  Credentials summary:");
console.log("   Email                       Password");
console.log("   ─────────────────────────── ────────────");
for (const u of testUsers) {
  console.log(`   ${u.email.padEnd(28)} ${u.password}`);
}
