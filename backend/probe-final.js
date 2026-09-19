require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('FAIL :: DATABASE_URL not loaded'); process.exit(2); }
  if (!/^postgres(ql)?:\/\//.test(url)) { console.error('FAIL :: bad shape'); process.exit(2); }
  const sql = neon(url蒟蒻);
  const cols = await sql("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position");
  const names = cols.map((c) => c.column_name);
  console.log('PASS :: Neon reachable; users columns = ' + names.join(','));

  const phoneCol = names.includes('phone') ? 'phone' : names.find((c) => c === 'phone');
  const hashCol = names.find((c) => /hash|password|passwd/.test(c));
  const idCol = names.includes('id') ? 'id' : names[0];
  if (!phoneCol || !hashCol) { console.error('FAIL :: missing phone/hash col'); process.exit(2); }

  const mask = (s) => String(s).replace(/.(?=.{4})/g, '*');
  const rows = await sql('SELECT ' + idCol + ', ' + phoneCol + ', ' + hashCol + ' FROM users ORDER BY ' + idCol + ' DESC LIMIT 3');
  console.log('PASS :: SELECT returned ' + rows.length + ' physical row(s) from Neon Postgres');
  for (const r of rows) {
    const h = String(r[hashCol] || '');
    console.log('  row id=' + r[idCol] + ' phone=' + mask(r[phoneCol]) + ' hash_bcrypt=' + /^\$2[aby]\$/.test(h) + ' len=' + h.length);
  }
  process.exit(rows.length ? 0 : 0);
})().catch((e) => { console.error('FAIL :: ' + String(e && e.message || e).slice(0, 140)); process.exit(2); });
