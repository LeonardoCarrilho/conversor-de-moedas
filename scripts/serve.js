/**
 * Servidor estático mínimo para desenvolvimento, sem dependências externas.
 * Uso: npm start (ou node scripts/serve.js)
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, relative, isAbsolute } from "node:path";

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
  let url;
  try {
    url = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (url.includes("\0")) throw new URIError("Invalid path");
  } catch {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    res.end("400 — endereço inválido");
    return;
  }
  const caminho = normalize(join(raiz, url === "/" ? "index.html" : url));

  const relativo = relative(raiz, caminho);
  const publico = /^(index\.html|styles\.css|(?:src|assets)\/[a-zA-Z0-9_./-]+)$/.test(relativo.replaceAll("\\", "/")) && !relativo.split(/[\\/]/).some(part => part.startsWith("."));
  if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405, { Allow: "GET, HEAD" }); return res.end(); }
  if (!publico || relativo.startsWith("..") || isAbsolute(relativo) || !existsSync(caminho) || statSync(caminho).isDirectory()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404 — arquivo não encontrado");
    return;
  }

  res.writeHead(200, {
    "content-type": tipos[extname(caminho)] ?? "application/octet-stream",
    "cache-control": "no-cache",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "x-frame-options": "DENY",
  });
  const stream = createReadStream(caminho);
  stream.on("error", () => res.destroy());
  stream.pipe(res);
}).listen(porta, "127.0.0.1", () => {
  console.log(`Câmbio Hoje disponível em http://localhost:${porta}`);
});
