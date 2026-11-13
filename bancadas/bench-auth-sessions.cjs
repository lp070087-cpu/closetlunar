/** Executa as actions reais com banco/cookies em memoria; nao conecta ao Neon. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const modules = new Map();
const jar = new Map();
const cookieAttributes = new Map();
let connected = true;
let failCreate = false;
let failRead = false;
const sessions = [];
let user = { id: 'test-user', name: 'Teste', email: 'test@example.test', role: 'admin', isActive: true };
const database = {
  user: {
    findUnique: async ({ where }) => { if (failRead) throw Error('private-database-url'); return where.email && where.email !== user.email ? null : user; },
    create: async ({ data }) => { user = { ...data, id: 'new-user' }; return user; },
  },
  userSession: {
    create: async ({ data }) => { if (failCreate) throw Error('private-database-url'); sessions.push({ ...data, id: String(sessions.length), revokedAt: null }); },
    findFirst: async ({ where }) => sessions.find(s => s.userId === where.userId && s.tokenHash === where.tokenHash && !s.revokedAt && s.expiresAt > where.expiresAt.gt) || null,
    updateMany: async ({ where, data }) => { let count = 0; for (const s of sessions) if ((!where.userId || s.userId === where.userId) && (!where.tokenHash || s.tokenHash === where.tokenHash) && !s.revokedAt) { Object.assign(s, data); count++; } return { count }; },
  },
  $transaction: async (operation) => { const prior = { ...user }; const count = sessions.length; try { return await operation(database); } catch (e) { user = prior; sessions.splice(count); throw e; } },
};
function load(file) {
  file = path.resolve(file);
  if (!path.extname(file)) file += '.ts';
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} }; modules.set(file, module);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const customRequire = (name) => {
    if (name === 'next/headers') return { cookies: async () => ({ get: key => jar.has(key) ? { value: jar.get(key) } : undefined, set: (key, value, attributes) => { jar.set(key, value); cookieAttributes.set(key, attributes); }, delete: key => jar.delete(key) }) };
    if (name === 'next/navigation') return { redirect: to => { throw Error(`redirect:${to}`); } };
    if (name === 'react') return { cache: fn => fn };
    if (name === '@/lib/db') return { db: () => connected ? database : null, temBanco: () => connected, PENDENTE_SEM_BANCO: 'Banco indisponivel' };
    if (name.startsWith('@/')) return load(path.join(root, 'src', name.slice(2)));
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name));
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(customRequire, module, module.exports);
  return module.exports;
}
async function run() {
  process.env.SESSION_SECRET = 'test-only-session-secret-not-a-real-credential';
  const auth = load(path.join(root, 'src/lib/auth/acoes.ts'));
  const session = load(path.join(root, 'src/lib/auth/sessao.ts'));
  const password = load(path.join(root, 'src/lib/auth/senha.ts'));
  const guard = load(path.join(root, 'src/lib/auth/guardas.ts'));
  user.passwordHash = password.hashSenha('test-password');
  const login = () => auth.entrar({ email: user.email, senha: 'test-password' });
  assert.equal((await login()).ok, true);
  const token = jar.get(session.COOKIE_SESSAO);
  assert.equal(sessions[0].tokenHash, session.hashTokenOpaco(token));
  assert.equal((await auth.usuarioAtual()).id, user.id);
  assert.equal((await guard.sessaoAtual()).papel, 'admin');
  assert.equal((await guard.exigirPapel('cliente')).usuarioId, user.id, 'admin may access own customer account');
  user.isActive = false;
  assert.equal(await guard.sessaoAtual(), null);
  user.isActive = true;
  user.role = 'cliente';
  assert.equal((await guard.sessaoAtual()).papel, 'cliente');
  await assert.rejects(() => guard.exigirPapel('admin'), /redirect:\/conta/);
  await auth.sair();
  assert.equal(jar.has(session.COOKIE_SESSAO), false);
  jar.set(session.COOKIE_SESSAO, token);
  assert.equal(await auth.usuarioAtual(), null, 'copied cookie must fail after logout');
  await login();
  const token2 = jar.get(session.COOKIE_SESSAO);
  assert.notEqual(token2, token, 'same-second logins require independent tokens');
  await login();
  const token3 = jar.get(session.COOKIE_SESSAO);
  await auth.encerrarTodasAsSessoes();
  for (const previous of [token2, token3]) { jar.set(session.COOKIE_SESSAO, previous); assert.equal(await auth.usuarioAtual(), null); }
  jar.clear(); failCreate = true;
  assert.equal((await login()).ok, false);
  assert.equal(jar.size, 0, 'no cookie if session persistence fails');
  const oldUser = user;
  const registration = await auth.cadastrar({ nome: 'Novo nome', email: 'new@example.test', senha: 'test-password' });
  assert.equal(registration.ok, false);
  assert.equal(user.id, oldUser.id, 'registration transaction rolls back on session failure');
  failCreate = false; failRead = true;
  const failed = await login();
  assert.equal(failed.ok, false);
  assert.equal(failed.motivo.includes('private-database-url'), false);
  failRead = false;
  assert.equal((await auth.entrar({ email: user.email, senha: 'x'.repeat(1025) })).ok, false);
  assert.equal((await auth.cadastrar({ nome: {}, email: user.email, senha: 'test-password' })).ok, false);
  const created = await auth.cadastrar({ nome: 'Novo nome', email: 'new@example.test', senha: 'test-password' });
  assert.equal(created.ok, true);
  assert.equal((await auth.usuarioAtual()).papel, 'cliente');
  await auth.entrar({ email: user.email, senha: 'test-password', manterConectado: false });
  assert.equal(cookieAttributes.get(session.COOKIE_SESSAO).expires, undefined);
  await login();
  assert.ok(cookieAttributes.get(session.COOKIE_SESSAO).expires instanceof Date);
  const customerData = load(path.join(root, 'src/lib/cliente/data.ts'));
  const realAccount = await customerData.getConta();
  assert.equal(realAccount.source, 'database');
  assert.equal(realAccount.data.id, user.id);
  assert.equal(realAccount.data.email, user.email);
  connected = false;
  assert.equal((await login()).ok, false);
  assert.equal(await auth.usuarioAtual(), null);
  jar.clear();
  process.env.NODE_ENV = 'production';
  await assert.rejects(() => guard.exigirPapel('admin'), /redirect:\/entrar/);
  await assert.rejects(() => guard.exigirPapel('cliente'), /redirect:\/entrar/);
  assert.equal((await customerData.getConta()).data.id, 'nao-autenticado');
  process.env.NODE_ENV = 'development';
  assert.equal((await guard.exigirPapel('admin')).demo, true);
  console.log('PASS: auth actions, cookie hash, unique sessions, active account/current role, logout/all-session revocation, failed writes, transaction rollback, safe errors, invalid payloads and no-database refusal. No live database used.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
