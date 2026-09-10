const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const dataDirectory = path.join(root, 'data');
const storePath = path.join(dataDirectory, 'store.local.json');
const adminToken = process.env.ADMIN_TOKEN;
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png'
};

function readStore() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  if (!fs.existsSync(storePath)) fs.copyFileSync(path.join(dataDirectory, 'store.json'), storePath);
  return JSON.parse(fs.readFileSync(storePath, 'utf8'));
}

function writeStore(store) {
  fs.writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`);
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => { body += chunk; if (body.length > 1024 * 1024) reject(new Error('Request too large')); });
    request.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); } });
    request.on('error', reject);
  });
}

function isAdmin(request) {
  return Boolean(adminToken) && request.headers['x-admin-token'] === adminToken;
}

async function handleApi(request, response, pathname) {
  if (pathname === '/api/health' && request.method === 'GET') return sendJson(response, 200, { ok: true });
  if (!pathname.startsWith('/api/admin/')) return sendJson(response, 404, { error: 'API route not found' });
  if (!adminToken) return sendJson(response, 503, { error: 'ADMIN_TOKEN is not configured' });
  if (!isAdmin(request)) return sendJson(response, 401, { error: 'Unauthorized' });
  const store = readStore();

  if (pathname === '/api/admin/summary' && request.method === 'GET') {
    return sendJson(response, 200, { pending: store.deposits.filter(item => item.status === 'На проверке'), accruals: store.accruals.slice(0, 50), balances: store.balances });
  }
  if (pathname === '/api/admin/accrual' && request.method === 'POST') {
    const body = await readBody(request);
    const user = String(body.user || '').trim();
    const amount = Number(body.amount);
    const reason = String(body.reason || 'Ручное начисление').trim().slice(0, 200);
    if (!/^@[a-zA-Z0-9_]{3,32}$/.test(user) || !Number.isSafeInteger(amount) || amount < 1 || amount > 1000000000) return sendJson(response, 400, { error: 'Invalid user or amount' });
    store.balances[user] = (store.balances[user] || 0) + amount;
    store.accruals.unshift({ id: `acc_${Date.now()}`, user, amount, reason, createdAt: new Date().toISOString() });
    writeStore(store);
    return sendJson(response, 201, { ok: true, balance: store.balances[user] });
  }
  const approveMatch = pathname.match(/^\/api\/admin\/deposits\/([^/]+)\/approve$/);
  if (approveMatch && request.method === 'POST') {
    const item = store.deposits.find(deposit => deposit.id === approveMatch[1]);
    if (!item) return sendJson(response, 404, { error: 'Deposit not found' });
    if (item.status !== 'На проверке') return sendJson(response, 409, { error: 'Deposit already processed' });
    item.status = 'Подтверждено';
    item.updatedAt = new Date().toISOString();
    writeStore(store);
    return sendJson(response, 200, { ok: true, deposit: item });
  }
  return sendJson(response, 404, { error: 'API route not found' });
}

const server = http.createServer(async (request, response) => {
  const requestedPath = decodeURIComponent(request.url.split('?')[0]);
  if (requestedPath.startsWith('/api/')) {
    try { return await handleApi(request, response, requestedPath); } catch (error) { return sendJson(response, 400, { error: error.message }); }
  }
  const relativePath = requestedPath === '/' ? '/index.html' : requestedPath;
  const filePath = path.resolve(root, `.${relativePath}`);

  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, { 'Content-Type': contentTypes[extension] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
});

const port = Number(process.env.PORT) || 8080;
server.listen(port, '0.0.0.0', () => {
  console.log(`Klifgram Depot running at http://localhost:${port}`);
});
