const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../../app');

const PTBR = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchHome = async (port) => {
  const res = await fetch(`http://127.0.0.1:${port}/`);
  const html = await res.text();
  const match = html.match(/<span id="server-time"[^>]*>([^<]*)<\/span>/);
  return { html, value: match && match[1] };
};

test('GET / não contém script, setInterval nem refresh automático', async () => {
  const server = app.listen(0);
  try {
    const { html } = await fetchHome(server.address().port);
    assert.doesNotMatch(html, /<script/i);
    assert.doesNotMatch(html, /setInterval/);
    assert.doesNotMatch(html, /<meta\s+http-equiv="refresh"/i);
  } finally {
    server.close();
  }
});

test('requisições sucessivas retornam valores calculados em cada requisição', async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const first = await fetchHome(port);
    await sleep(1100);
    const second = await fetchHome(port);
    assert.match(first.value, PTBR);
    assert.match(second.value, PTBR);
    assert.notStrictEqual(first.value, second.value);
  } finally {
    server.close();
  }
});
