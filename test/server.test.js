import assert from "node:assert/strict";
import { test } from "node:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { get } from "node:http";
import { createServer } from "node:net";

test("URLs inválidas não encerram o servidor e caminhos externos são recusados", async () => {
  const reservation = createServer().listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, ["scripts/serve.js"], {
    env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"]
  });
  try {
    await Promise.race([
      once(child.stdout, "data"),
      once(child, "exit").then(() => { throw new Error("Servidor encerrou antes de iniciar"); }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000).unref())
    ]);
    const request = path => new Promise((resolve, reject) => {
      get({ host: "127.0.0.1", port, path }, res => { res.resume(); res.on("end", () => resolve(res.statusCode)); }).on("error", reject);
    });
    assert.equal(await request("/%ZZ"), 400);
    assert.equal(await request("/%00"), 400);
    assert.equal(await request("/..%2fpackage.json"), 404);
    assert.equal(await request("/"), 200);
    assert.equal(await request("/styles.css"), 200);
  } finally {
    child.kill();
    await once(child, "exit");
  }
});

