require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL missing in backend/.env'); process.exit(2); }
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const q = `SELECT phone, first_name, created_at,
      (password_hash IS NOT NULL) AS has_hash,
      (password_hash IS NOT NULL AND password_hash LIKE '$2%') AS bcrypt_format,
      length(password_hash) AS hash_len,
      auth_via_otp_only,
      last_login_at
    FROM users
    WHERE phone IN (
      SELECT phone FROM users ORDER BY created_at DESC LIMIT 4
    )
    ORDER BY created_at DESC`;
  const rows = await sql(q);
  for (const r of rows) {
    console.log(`  row: phone=${r.phone} ${r.first_name} created=${String(r.created_at).slice(0,19)} has_hash=${r.has_hash} bcrypt='${r.bcrypt_format}' len=${r.hash_len}`);
  }
  console.log(`  -> ${rows.length} user row(s) physically present in Neon Postgres (NOT in server memory)`);
})().catch((e) => { console.error('Neon SELECT failed: ' + (e && e.message ? e.message.slice(0,160) : e)); process.exit(2); });
