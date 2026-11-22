// Testes de aceite (QA) da feature 001-server-time-ptbr-red.
// Cobrem US1..US3, FR-001..FR-008 e SC-001..SC-005 de specs/001-server-time-ptbr-red/spec.md,
// e o contrato contracts/home-page.md. Usam apenas node:test, sem dependências novas,
// porta efêmera (app.listen(0)) e relógio fixado com mock.timers (apenas Date).

const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../../app');

const PTBR = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/;
const FALLBACK = 'indisponível';

// Instantes de referência (UTC) com valor esperado em America/Sao_Paulo.
// Brasil sem horário de verão desde 2019 (UTC-3); em 2018 havia horário de verão (UTC-2 em parte do ano).
const REFERENCIAS = [
  { utc: '2026-11-22T15:30:00Z', esperado: '22/11/2026 12:30:00', rotulo: 'exemplo da spec (US1 cenário 2)' },
  { utc: '2026-01-01T01:00:00Z', esperado: '31/12/2025 22:00:00', rotulo: 'virada de ano (spec, edge cases)' },
  { utc: '2026-11-22T02:59:59Z', esperado: '21/11/2026 23:59:59', rotulo: 'virada de dia, último segundo do dia anterior' },
  { utc: '2026-11-22T03:00:00Z', esperado: '22/11/2026 00:00:00', rotulo: 'meia-noite em 24 h (00, não 24)' },
  { utc: '2026-03-05T12:07:02Z', esperado: '05/03/2026 09:07:02', rotulo: 'zeros à esquerda (spec, edge cases)' },
  { utc: '2018-02-18T01:59:59Z', esperado: '17/02/2018 23:59:59', rotulo: 'com horário de verão (UTC-2) até a transição' },
  { utc: '2018-02-18T02:00:00Z', esperado: '17/02/2018 23:00:00', rotulo: 'fim do horário de verão de 2018' },
  { utc: '2018-11-04T03:00:00Z', esperado: '04/11/2018 01:00:00', rotulo: 'início do horário de verão de 2018 (salto 00:00 para 01:00)' },
  { utc: '1970-01-01T00:00:00Z', esperado: '31/12/1969 21:00:00', rotulo: 'época Unix (valor-limite, antes de 1970 em São Paulo)' },
];

async function comServidor(fn) {
  const server = app.listen(0);
  try {
    return await fn(server.address().port);
  } finally {
    server.close();
  }
}

async function getHome(port) {
  const res = await fetch(`http://127.0.0.1:${port}/`);
  const html = await res.text();
  const match = html.match(/<span id="server-time"[^>]*>([^<]*)<\/span>/);
  return {
    status: res.status,
    contentType: res.headers.get('content-type') || '',
    html,
    value: match ? match[1] : null,
  };
}

function congelarEm(t, iso) {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse(iso) });
}

async function comTZ(tz, fn) {
  const anterior = process.env.TZ;
  process.env.TZ = tz;
  try {
    return await fn();
  } finally {
    if (anterior === undefined) delete process.env.TZ;
    else process.env.TZ = anterior;
  }
}

// --- US1 / FR-001 / FR-002 / SC-001 / SC-002 -------------------------------------------

test('US1 / FR-001: GET / responde 200 HTML e exibe data pt-BR no instante fixado', async (t) => {
  congelarEm(t, '2026-11-22T15:30:00Z');
  await comServidor(async (port) => {
    const r = await getHome(port);
    assert.strictEqual(r.status, 200);
    assert.match(r.contentType, /^text\/html/);
    assert.strictEqual(r.value, '22/11/2026 12:30:00');
    assert.match(r.value, PTBR);
  });
});

test('US1 / SC-002: conversão para America/Sao_Paulo em instantes de referência (virada, zeros, DST)', async (t) => {
  congelarEm(t, REFERENCIAS[0].utc);
  await comServidor(async (port) => {
    for (const ref of REFERENCIAS) {
      t.mock.timers.setTime(Date.parse(ref.utc));
      const r = await getHome(port);
      assert.strictEqual(r.value, ref.esperado, `${ref.rotulo} (${ref.utc})`);
    }
  });
});

test('US1 / FR-002 / SC-002: valor não muda com TZ do processo (Asia/Tokyo, America/New_York, UTC)', async (t) => {
  const instante = '2026-11-22T15:30:00Z';
  // Sanidade: o TZ alterado de fato muda a hora local do processo, senão o teste não discrimina.
  const hora = (tz) => comTZ(tz, () =>
    new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .format(Date.parse(instante)));
  assert.strictEqual(await hora('Asia/Tokyo'), '00:30');
  assert.strictEqual(await hora('America/New_York'), '10:30');

  congelarEm(t, instante);
  await comServidor(async (port) => {
    for (const tz of ['Asia/Tokyo', 'America/New_York', 'UTC', 'Asia/Kolkata']) {
      const r = await comTZ(tz, () => getHome(port));
      assert.strictEqual(r.value, '22/11/2026 12:30:00', `TZ=${tz}`);
    }
  });
});

test('US1 / FR-002 / SC-002: com TZ=Asia/Tokyo a virada de dia continua no horário de São Paulo', async (t) => {
  congelarEm(t, '2026-01-01T01:00:00Z');
  await comServidor(async (port) => {
    const r = await comTZ('Asia/Tokyo', () => getHome(port));
    assert.strictEqual(r.value, '31/12/2025 22:00:00');
  });
});

test('US1 / FR-001: sem mock, a rota exibe uma data válida e não o fallback indisponível', async () => {
  await comServidor(async (port) => {
    const r = await getHome(port);
    assert.strictEqual(r.status, 200);
    assert.notStrictEqual(r.value, FALLBACK);
    assert.match(r.value, PTBR);
  });
});

// --- FR-008 -----------------------------------------------------------------------------

test('FR-008: a página nunca exibe "Invalid Date" nem texto técnico ISO', async (t) => {
  congelarEm(t, REFERENCIAS[0].utc);
  await comServidor(async (port) => {
    for (const ref of REFERENCIAS) {
      t.mock.timers.setTime(Date.parse(ref.utc));
      const r = await getHome(port);
      assert.doesNotMatch(r.html, /Invalid Date/);
      assert.doesNotMatch(r.html, /T\d{2}:\d{2}:\d{2}/, 'não deve exibir ISO UTC');
      assert.doesNotMatch(r.html, /GMT|UTC/);
    }
  });
});

// --- FR-005 / FR-006 / US3 / SC-004 ----------------------------------------------------

test('US3 / FR-006: cada carregamento exibe o instante daquele carregamento', async (t) => {
  congelarEm(t, '2026-11-22T15:30:00Z');
  await comServidor(async (port) => {
    const primeiro = await getHome(port);
    assert.strictEqual(primeiro.value, '22/11/2026 12:30:00');

    t.mock.timers.tick(15_000); // 15 s depois, novo carregamento
    const segundo = await getHome(port);
    assert.strictEqual(segundo.value, '22/11/2026 12:30:15');
  });
});

test('US3 / FR-005 / SC-004: a página não tem mecanismo de atualização automática', async (t) => {
  congelarEm(t, '2026-11-22T15:30:00Z');
  await comServidor(async (port) => {
    const r = await getHome(port);
    assert.doesNotMatch(r.html, /<script/i);
    assert.doesNotMatch(r.html, /setInterval|setTimeout/);
    assert.doesNotMatch(r.html, /<meta\s+http-equiv="?refresh"?/i);
    assert.doesNotMatch(r.html, /<link[^>]+rel="?preload/i);
  });
});

test('US3 / FR-005 / SC-004: valor exibido permanece igual enquanto a página está aberta (snapshot)', async (t) => {
  congelarEm(t, '2026-11-22T15:30:00Z');
  await comServidor(async (port) => {
    const aberta = await getHome(port); // HTML já recebido pelo navegador
    t.mock.timers.tick(10_000); // 10 s sem interação
    t.mock.timers.tick(20_000); // mais 20 s
    // Sem script no cliente, nada no HTML recebido muda com o tempo do navegador.
    assert.strictEqual(aberta.value, '22/11/2026 12:30:00');
    assert.doesNotMatch(aberta.html, /<script/i);
  });
});

// --- FR-003 / FR-004 / US2 / SC-003 ----------------------------------------------------

test('US2 / FR-003: o valor usa classe com cor vermelha #CC0000 declarada em <style>', async (t) => {
  congelarEm(t, '2026-11-22T15:30:00Z');
  await comServidor(async (port) => {
    const r = await getHome(port);
    assert.match(r.html, /<style>[\s\S]*?\.server-time\s*\{\s*color:\s*#CC0000;?\s*\}[\s\S]*?<\/style>/);
  });
});

test('US2 / FR-004 / SC-003: vermelho restrito ao valor (única declaração de cor, sem style inline)', async (t) => {
  congelarEm(t, '2026-11-22T15:30:00Z');
  await comServidor(async (port) => {
    const r = await getHome(port);
    const declaracoesDeCor = r.html.match(/(?:^|[;{\s"'])color\s*:/gi) || [];
    assert.strictEqual(declaracoesDeCor.length, 1, 'deve existir exatamente uma declaração color');
    assert.doesNotMatch(r.html, /\sstyle\s*=/i, 'nenhum elemento com atributo style inline');
    assert.strictEqual((r.html.match(/class="server-time"/g) || []).length, 1, 'só o span tem a classe');
    assert.strictEqual((r.html.match(/#CC0000/gi) || []).length, 1, 'cor vermelha definida uma única vez');
  });
});

test('US2 / FR-004: título e rótulo ficam fora do span vermelho', async (t) => {
  congelarEm(t, '2026-11-22T15:30:00Z');
  await comServidor(async (port) => {
    const r = await getHome(port);
    assert.match(r.html, /<h1>appdemo<\/h1>/);
    assert.match(r.html, /<p>Data\/hora do servidor: <span id="server-time" class="server-time">22\/11\/2026 12:30:00<\/span><\/p>/);
    const dentroDoSpan = r.html.match(/<span id="server-time"[^>]*>([\s\S]*?)<\/span>/)[1];
    assert.doesNotMatch(dentroDoSpan, /Data\/hora|appdemo/);
  });
});

// --- FR-007 / contrato home-page.md ----------------------------------------------------

test('FR-007: exatamente um elemento id="server-time" com o contrato de marcação', async (t) => {
  congelarEm(t, '2026-11-22T15:30:00Z');
  await comServidor(async (port) => {
    const r = await getHome(port);
    assert.strictEqual((r.html.match(/id="server-time"/g) || []).length, 1);
    assert.match(
      r.html,
      /<span id="server-time" class="server-time">22\/11\/2026 12:30:00<\/span>/,
    );
  });
});

test('FR-007 / SC-005: rótulo "Data/hora do servidor:" e id estáveis entre carregamentos', async (t) => {
  congelarEm(t, '2026-11-22T15:30:00Z');
  await comServidor(async (port) => {
    const a = await getHome(port);
    t.mock.timers.setTime(Date.parse('2027-07-01T00:00:00Z'));
    const b = await getHome(port);
    for (const r of [a, b]) {
      assert.match(r.html, /Data\/hora do servidor: <span id="server-time"/);
      assert.match(r.html, /<html lang="pt-br">/);
    }
  });
});

test('FR-008 / valor-limite: instante máximo do Date não gera "Invalid Date" nem fallback', async (t) => {
  // Observação registrada em qa-report.md (Baixa): nesse extremo o ano tem 6 dígitos (ex.: 12/09/275760),
  // fora do \d{4} de FR-001. Aqui se verifica apenas o que FR-008 exige: nada inválido e nada de fallback.
  t.mock.timers.enable({ apis: ['Date'], now: 8.64e15 });
  await comServidor(async (port) => {
    const r = await getHome(port);
    assert.strictEqual(r.status, 200);
    assert.notStrictEqual(r.value, FALLBACK);
    assert.doesNotMatch(r.value, /Invalid/);
    assert.match(r.value, /^\d{2}\/\d{2}\/\d+ \d{2}:\d{2}:\d{2}$/);
  });
});
