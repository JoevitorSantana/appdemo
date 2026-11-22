const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../app');

test('GET / responde 200 e exibe a data/hora do servidor', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.match(html, /id="server-time"/);
  } finally {
    server.close();
  }
});
