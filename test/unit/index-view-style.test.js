const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const ejs = require('ejs');

const viewPath = path.join(__dirname, '..', '..', 'views', 'index.ejs');
const SAMPLE = '22/11/2026 12:30:00';

const render = (serverTime = SAMPLE) => ejs.renderFile(viewPath, { serverTime });

test('span do valor tem id server-time e classe server-time', async () => {
  const html = await render();
  assert.match(html, /<span id="server-time" class="server-time">22\/11\/2026 12:30:00<\/span>/);
});

test('style define .server-time com color #CC0000', async () => {
  const html = await render();
  const style = html.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(style, 'bloco <style> ausente');
  assert.match(style[1], /\.server-time\s*\{\s*color:\s*#CC0000;\s*\}/);
});

test('nenhuma outra regra define vermelho', async () => {
  const html = await render();
  const style = html.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(style, 'bloco <style> ausente');
  const colorRules = style[1].match(/color\s*:/gi) || [];
  assert.strictEqual(colorRules.length, 1);
  assert.doesNotMatch(html.replace(/<style>[\s\S]*?<\/style>/, ''), /#CC0000|red/i);
});

test('titulo e rotulo ficam fora do span vermelho', async () => {
  const html = await render();
  const span = html.match(/<span id="server-time"[^>]*>[\s\S]*?<\/span>/)[0];
  assert.ok(!span.includes('appdemo'));
  assert.ok(!span.includes('Data/hora do servidor'));
  assert.match(html, /<h1>appdemo<\/h1>/);
  assert.match(html, /Data\/hora do servidor:\s*<span/);
});

test('valor e escapado', async () => {
  const html = await render('<b>x</b>');
  assert.ok(!html.includes('<b>x</b>'));
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
});
