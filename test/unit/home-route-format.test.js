const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../../app');

test('GET / exibe a data/hora em pt-BR dentro de span#server-time', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    const match = html.match(/<span id="server-time"[^>]*>([^<]*)<\/span>/);
    assert.ok(match, 'span#server-time ausente');
    assert.match(match[1], /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}|indisponível)$/);
  } finally {
    server.close();
  }
});
