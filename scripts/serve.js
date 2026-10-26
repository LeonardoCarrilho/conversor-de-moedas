/**
 * Servidor estático mínimo para desenvolvimento, sem dependências externas.
 * Uso: npm start (ou node scripts/serve.js)
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const raiz = resolve(import.meta.dirname, "..");
const porta = Number(process.env.PORT) || 4174;

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const caminho = normalize(join(raiz, url === "/" ? "index.html" : url));

  if (!caminho.startsWith(raiz) || !existsSync(caminho) || statSync(caminho).isDirectory()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404 — arquivo não encontrado");
    return;
  }

  res.writeHead(200, {
    "content-type": tipos[extname(caminho)] ?? "application/octet-stream",
    "cache-control": "no-cache",
  });
  createReadStream(caminho).pipe(res);
}).listen(porta, () => {
  console.log(`Câmbio Hoje disponível em http://localhost:${porta}`);
});
