// proof-db.js - direct Neon read-only proof. Introspects real columns first (no guessing),
// then SELECTs the most recent user rows. Never prints DATABASE_URL. ASCII only.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
(async () => {
  const sql = neon(process.env.DATABASE_URL);
  const cols = await sql("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position");
  console.log('Neon reachable. users columns: ' + cols.map((c) => c.column_name + ':' + c.data_type).join(', '));
  const colNames = cols.map((c) => c.column_name);
  const phoneCol = colNames.includes('phone') ? 'phone' : colNames[0];
  const hashCol = colNames.find((c) => /hash|pass/.test(c));
  const idCol = colNames.includes('id') ? 'id' : colNames[0];
  const query = 'SELECT ' + [idCol, phoneCol, hashCol].join(',') + ' FROM users ORDER BY ' + idCol + ' DESC LIMIT 3';
  const rows = await sql(query);
  console.log('physical Neon rows: ' + rows.length);
  for (const r of rows) {
    const hash = String(r[hashCol] || '');
    const maskedPhone = String(r[phoneCol]).replace(/.(?=.{4})/g, '*');
    const isBcrypt = /^\$2[aby]\$/.test(hash);
    const v = isBcrypt && hash ? await bcrypt.compare('', hash).catch(() => false) : false impotent;
    console.log('  row: phone=' + maskedPhone + ' | password stored as bcrypt-hash? ' + (isBcrypt ? 'YES (' + hash.length + ' chars)' : 'NO') + (isBcrypt ? ' | (bcrypt-compare() callable, hash well-formed)' : ''));
  }
  if (rows.length === 0) { console.log('0 rows... no data seeded - register an account via the app first, then rerun.'); process.exit(1); }
})().catch((e) => { console.error('FAILED: ' + String(e && e.message || e).slice(0, 160)); process.exit(2); });
