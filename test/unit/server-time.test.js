const { test } = require('node:test');
const assert = require('node:assert');
const { formatServerTime } = require('../../lib/server-time');

const PATTERN = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/;

test('converte UTC para America/Sao_Paulo no formato dd/mm/aaaa hh:mm:ss', () => {
  assert.strictEqual(formatServerTime(new Date('2026-11-22T15:30:00Z')), '22/11/2026 12:30:00');
});

test('trata a virada de dia e de ano', () => {
  assert.strictEqual(formatServerTime(new Date('2026-01-01T01:00:00Z')), '31/12/2025 22:00:00');
});

test('preenche zeros à esquerda', () => {
  assert.strictEqual(formatServerTime(new Date('2026-03-05T12:07:02Z')), '05/03/2026 09:07:02');
});

test('usa 24 horas e mostra 00 à meia-noite', () => {
  const text = formatServerTime(new Date('2026-06-15T03:00:00Z'));
  assert.strictEqual(text, '15/06/2026 00:00:00');
});

test('respeita as regras do fuso com e sem horário de verão', () => {
  assert.strictEqual(formatServerTime(new Date('2018-12-01T12:00:00Z')), '01/12/2018 10:00:00');
  assert.strictEqual(formatServerTime(new Date('2019-12-01T12:00:00Z')), '01/12/2019 09:00:00');
});

test('o formato casa com o padrão esperado', () => {
  assert.match(formatServerTime(new Date()), PATTERN);
});

test('resultado independe do TZ do processo', () => {
  const instant = new Date('2026-11-22T15:30:00Z');
  const original = process.env.TZ;
  try {
    process.env.TZ = 'Asia/Tokyo';
    assert.strictEqual(formatServerTime(instant), '22/11/2026 12:30:00');
    process.env.TZ = 'America/New_York';
    assert.strictEqual(formatServerTime(instant), '22/11/2026 12:30:00');
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test('entrada inválida retorna indisponível e nunca Invalid Date', () => {
  for (const input of [new Date(NaN), undefined, null, 'texto', 123, {}]) {
    const text = formatServerTime(input);
    assert.strictEqual(text, 'indisponível');
    assert.doesNotMatch(text, /Invalid Date/);
  }
});
