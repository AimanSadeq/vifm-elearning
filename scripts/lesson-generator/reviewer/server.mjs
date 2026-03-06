import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8899;
const CONTENT_DIR = path.join(__dirname, '..', 'content');
const HTML_FILE = path.join(__dirname, 'index.html');

function sendJSON(res, data) {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function sendHTML(res, html) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(html);
}

function send404(res, msg = 'Not found') {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: msg }));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Serve index.html
  if (pathname === '/' || pathname === '/index.html') {
    try {
      const html = fs.readFileSync(HTML_FILE, 'utf-8');
      sendHTML(res, html);
    } catch (e) {
      send404(res, 'index.html not found');
    }
    return;
  }

  // API: list courses
  if (pathname === '/api/courses') {
    try {
      const dirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      sendJSON(res, dirs);
    } catch (e) {
      sendJSON(res, []);
    }
    return;
  }

  // API: get course modules
  const courseMatch = pathname.match(/^\/api\/course\/([^/]+)$/);
  if (courseMatch) {
    const slug = courseMatch[1];
    const courseDir = path.join(CONTENT_DIR, slug);
    if (!fs.existsSync(courseDir)) { send404(res, 'Course "' + slug + '" not found'); return; }

    const moduleFiles = fs.readdirSync(courseDir)
      .filter(f => f.match(/^module-\d+\.json$/))
      .sort();

    const modules = moduleFiles.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(courseDir, f), 'utf-8'));
      return data;
    });

    sendJSON(res, modules);
    return;
  }

  // API: get single module
  const moduleMatch = pathname.match(/^\/api\/course\/([^/]+)\/module\/(\d+)$/);
  if (moduleMatch) {
    const slug = moduleMatch[1];
    const num = moduleMatch[2];
    const filePath = path.join(CONTENT_DIR, slug, 'module-' + num + '.json');
    if (!fs.existsSync(filePath)) { send404(res, 'Module ' + num + ' not found'); return; }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    sendJSON(res, data);
    return;
  }

  send404(res);
});

server.listen(PORT, () => {
  console.log('PPTX Reviewer running at http://localhost:' + PORT);
});
