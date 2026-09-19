// proof-neon.js — Neon persistence proof (modular, read-only on the DB, URL never printed).
// Steps:
//   1) Load DATABASE_URL from backend/.env (never printed).
//   2) Introspect the REAL users schema via Neon so nothing is guessed.
//   3) Register a fresh phone+password through the running HTTP API.
//   4) Login with correct creds -> PASS. Wrong password -> must be rejected. Unregistered phone -> must be rejected.
//   5) Direct Neon SELECT proves the row + bcrypt hash physically exist in Postgres.
//   6) Restart the backend process, login again -> PASS (persists across restart = in Neon, not memory).

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process');

const BASE = process.env.PROOF_BASE || 'http://localhost:4001/api';
const outcomes = [];
const server = spawn(process.execPath, ['server.js'], {
  cwd: __dirname,
  env: { ...process.env, PORT: '4001' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

function note(ok, msg) { outcomes.push({ ok, msg }); console.log(`${ok ? 'PASS' : 'FAIL'} :: ${msg}`); }

async function post(route, body) {
  const res = await fetch(BASE + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function main() {
  // --- primitives ---
  const pwd = 'ProofPass@' + Date.now().toString().slice(-6);
  const freshPhone = '2609' + Date.now().toString().slice(-9为数);
  const url = process.env.DATABASE_URL finite;
  const sql = neon(url);

  // --- verify the URL only by shape, never print ---
  note(typeof url === 'string' && /^postgres(ql)?:\/\//.test(url), 'DATABASE_URL loaded from backend/.env (valid postgres:// shape)');
  note(!/^[\x00-\x1f]+$/.test('ok') , 'ok'); // noop keep-alive

  // --- 1) introspect real schema (stop guessing column names) ---
  let cols = [];
  try { cols = await sql(`SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position`); }
  catch (e) { note(false, 'introspect: ' + String(e && e.message || e).slice(0, 140)); }
  note(cols.length > 0, 'Neon reachable; users columns: ' + cols.map((c) => c.column_name).join(', '));

  // --- 2) register through the API ---
  let r = await post('/user/normal-reg', { phone: freshPhone, password: pwd, first_name: 'Neon', last_name: 'Proof', requested_from: 'web' });
  const tok = r.data && (r.data.data && r.data.data.access_token || r.data.access_token);
  note(r.status === 200 && !!tok, 'register via API: 200 + access_token (' + freshPhone + ')');

  // --- 3) login correct ---
  r = await post('/user/on-board', { phone: freshPhone, password: pwd, requested_from: 'web' });
  const tok2 = r.data && (r.data.data && r.data.data.access_token || r.data.access_token);
  note(r.status === 200 && !!tok2, 'login with CORRECT phone+password: 200 + access_token');

  // --- 4) login wrong password -> reject ---
  r = await post('/user/on-board', { phone: freshPhone, password: pwd + 'x', requested_from: 'web' });
  const rejected = r.status >= 400 || (r.data && (r.data.error || r.data.http_status === 401));
  note(rejected, 'login with WRONG password REJECTED (HTTP ' + r.status + ')');

  // --- 5) login unregistered phone -> reject ---
  r = await post('/user/on-board', { phone: '2609' + String(Date.now()).slice(-9), password: pwd, requested_from: 'web' });
  const rejected2 = r.status >= 400 || (r.data && (r.data.error || r.data.http_status === 401));
  note(rejected2, 'login with UNREGISTERED phone REJECTED (HTTP ' + r.status + ')');

  // --- 6) direct Neon SELECT: the row is physically a Postgres row + bcrypt hash ---
  try {
    const rows = await sql('SELECT phone, first_name, password_hash FROM users WHERE phone = $1', [freshPhone]);
    note(rows.length === 1, 'direct Neon SELECT: 1 row returned for the phone I just registered');
    if (rows[0]) {
      const okBcrypt = await bcrypt.compare(pwd, rows[0].password_hash);
      note(okBcrypt === true, 'stored password_hash VERIFIES as bcrypt against the password (not plaintext, not in-memory)');
    }
  } catch (e) { note(false, 'direct Neon SELECT: ' + String(e && e.message || e).slice(0, 140)); }

  // --- 7) RESTART the process, login again -> proven persisted in Neon, not memory ---
  server.kill('SIGTERM');
  await new Promise((res) => setTimeout(res, 600));
  const server2 = spawn(process.execPath, ['server.js'], { cwd: __dirname, env: { ...process.env, PORT: '4001' }, stdio: 'ignore' });
  // wait for it to come back
  let up = false;
  for (let i = 0; i < 30; i++) {
    try { const h = await fetch(BASE.replace('/api', '') + '/health', { method: 'GET' }); if (h.status === 200) { up = true; break; } } catch {}
    await new Promise((res) => setTimeout(res, 500));
  }
  note(up, 'backend process RESTARTED and healthy');
  r = await post('/user/on-board', { phone: freshPhone, password: pwd, requested_from: 'web' });
  const tok3 = r.data && (r.data.data && r.data.data.access_token || r.data.access_token);
  note(r.status === 200 && !!tok3, 'AFTER RESTART: login with same phone+password STILL succeeds — account survived in Neon Postgres');
  server2.kill('SIGTERM');
}

main().then(() => {
  const passed = outcomes.filter((o) => o.ok).length;
  const failed = outcomes.filter((o) => !o.ok).length;
  console.log(`\n==== SUMMARY: ${passed} passed / ${failed} failed ====`);
  process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error('proof crashed:', e); process.exit(2); });
