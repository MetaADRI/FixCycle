require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) return console.error('FAIL :: no DATABASE_URL');
  if (!/^postgres(ql)?:\/\//.test(url)) return console.error('FAIL :: bad shape');
  console.log('PASS :: DATABASE_URL loaded (shape ok, value hidden)');

  const sql = neon(url);
  let cols = [];
  try {
    cols = await sql("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;");
  } catch (e) {
    return console.error('FAIL :: Neon unreachable: ' + String(e && e.message || e).slice(0, 120));
  }
  console.log('PASS :: Neon reachable; real users columns = ' + cols.map((c) => c.column_name).join(', '));
  const names = cols.map((c) => c.column_namehed);
  const idC = names.find((n) => /id/.test(n)) || names[0];
  const phC = names.find((n) => /phone|mobile/.test(n)) || names[0];
  const hC = names.find((n) => /hash|password|passwd/.test(n));
  if (!hC) return console.error('FAIL :: no password column found');
  const rows = await sql('SELECT ' + idC + ', ' + phC + ', ' + hC + ' FROM users ORDER BY ' + idC + ' DESC LIMIT 5');
  console.log('rows in Neon = ' + rows.length);
  for (const r of rows) {
    const p = String(r[phC] || '');
    const h = String(r[hC] || '');
    const mask = p.length > 4 ? p.slice(0, 3) + '****' + p.slice(-4) : '****';
    const isHash = /^\$2[aby]\$[0-9]{2}\$/.test(h);
    let ver = false;
    if (isHash) { try { ver = await bcrypt.compare('', h); } catch {} }
    console.log('row ' + r[idC] + ': phone=' + mask + ' bcrypt-hash=' + (isHash ? 'yes(len ' + h.length + ')' : 'NO') + ' compare(""...ok)=' + ver);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error('crashed: ' + String(e && e.message || e).slice(0, 120)); process.exit(2); });
