# Research: Data/hora do servidor em pt-BR, vermelha, fuso de São Paulo

Nenhum `NEEDS CLARIFICATION` restante. Requisitos ratificados não foram reabertos.

## D1. Mecanismo de formatação e fuso

- **Decision**: `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })`, montando a string por `formatToParts` como `dd/mm/aaaa hh:mm:ss`.
- **Rationale**: nativo do Node (sem dependência, princípio I); aplica as regras vigentes do fuso (horário de verão, virada de dia) independentemente de `TZ` do SO. Verificado em Node 24: `2026-11-22T15:30:00Z` -> `22/11/2026 12:30:00`; `2026-01-01T01:00:00Z` -> `31/12/2025 22:00:00`. A saída direta de `format()` em pt-BR traz vírgula (`22/11/2026, 12:30:00`), por isso a montagem por partes com separador de espaço (FR-001). `hourCycle: 'h23'` evita `24:00:00` à meia-noite.
- **Alternatives**: `toLocaleString('pt-BR', {timeZone})` (mesmo motor, mas vírgula e menor controle); `date-fns-tz`/`luxon`/`moment-timezone` (nova dependência sem necessidade, viola I); deslocamento fixo UTC-3 manual (erra em períodos de horário de verão, viola FR-002/SC-002).

## D2. Disponibilidade do fuso (dependência da spec)

- **Decision**: confiar no ICU/tzdata embutidos no Node (builds oficiais incluem ICU completo). Um teste unitário com instantes de referência valida que `America/Sao_Paulo` é conhecido; se faltar, o teste falha cedo (Red/Green), e em runtime o fallback D4 atua.
- **Rationale**: dispensa configuração; verificação automatizada cobre a dependência.
- **Alternatives**: instalar pacote de tzdata (dependência extra); exigir `TZ` no ambiente (contradiz FR-002).

## D3. Tom do vermelho (decisão técnica pendente)

- **Decision**: `#CC0000` aplicado à classe `.server-time` no `<span id="server-time">`.
- **Rationale**: vermelho puro, claramente identificável como vermelho; contraste de cerca de 5,9:1 sobre fundo branco (atende WCAG AA para texto normal), cobrindo a premissa de legibilidade sem tornar formal um requisito de acessibilidade.
- **Alternatives**: `red` / `#FF0000` (contraste ~4,0:1, abaixo de AA); `#B00020` (contraste maior, mas tende a vinho/marrom e fica menos "claramente vermelho"); estilo inline `style=` no span (misturaria apresentação no markup; classe com `<style>` é equivalente e mais legível).

## D4. Comportamento em falha de formatação (decisão técnica pendente)

- **Decision**: `formatServerTime` captura erros (`RangeError` de `Intl`, data inválida via `Number.isNaN(date.getTime())`) e devolve o texto fixo `indisponível`. O span `#server-time` continua presente, com o texto amigável (em vermelho, pois é o valor do campo); nunca aparece "Invalid Date" nem texto técnico.
- **Rationale**: atende FR-008 e FR-007 (id preservado, página responde 200); mensagem curta e em pt-BR; sem logging especulativo.
- **Alternatives**: span vazio (usuário não entende a ausência); responder 500 (quebra o comportamento atual da página); exibir ISO UTC como reserva (texto técnico e fuso errado, proíbe FR-008/FR-002).

## D5. Onde aplicar a formatação e a cor

- **Decision**: formatação em `lib/server-time.js` (função pura que recebe `Date`), chamada na rota `GET /` (`serverTime: formatServerTime(new Date())`); o template apenas imprime com `<%= %>`. Cor em `<style>` inline no `<head>` de `views/index.ejs`.
- **Rationale**: princípio IV (sem lógica no template) e III/II (função pura testável por instante de referência, sem relógio nem porta). `<style>` inline evita criar diretório estático e middleware `express.static` (princípio I).
- **Alternatives**: formatar no template (viola IV); funções em `app.js` (dificulta importação isolada e mistura responsabilidades, embora aceitável); arquivo CSS estático (exige `express.static`, complexidade desnecessária).

## D6. Sem atualização automática

- **Decision**: nenhum JavaScript no cliente; valor calculado uma vez por requisição no servidor.
- **Rationale**: FR-005/FR-006/SC-004; HTML estático por carregamento.
- **Alternatives**: `setInterval` no cliente (proibido pela spec).

## D7. Estratégia de testes (Teste Primeiro)

- **Decision**: (a) unitários em `test/unit/server-time.test.js`: instantes de referência (15:30Z -> `12:30:00`; virada de ano; zeros à esquerda; períodos com e sem horário de verão, ex.: janeiro e julho; entrada inválida -> `indisponível`), executados também com `TZ` diferente; (b) aceite em `test/acceptance/` via `app.listen(0)`: texto do span casa `^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$`, classe/regra de cor vermelha presente só no valor, rótulo fora do span, `id="server-time"` mantido, ausência de `<script>`. Relógio controlado com `mock.timers` (`Date` mockado) do `node:test` para fixar o instante na rota.
- **Rationale**: runner nativo (II); não depende de porta fixa (III).
- **Alternatives**: bibliotecas de teste/browser headless (dependências sem necessidade; a cor é verificável pelo CSS e pela classe no HTML).

## D7b. Comandos de verificação

`npm test` (obrigatório), `TZ=Asia/Tokyo npm test` (robustez a fuso); lint e build/typecheck inexistentes e não serão criados (princípio I). Sem verificação de cobertura (a constituição não exige).
