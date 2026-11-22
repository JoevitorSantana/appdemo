# Relatório de QA: 001-server-time-ptbr-red

- **Etapa**: E6, teste e aceite
- **Branch**: `001-server-time-ptbr-red` (`git branch --show-current` confirmado antes da execução)
- **Referências**: `spec.md` (US1..US3, FR-001..FR-008, SC-001..SC-005), `plan.md`, `research.md`, `contracts/home-page.md`, `tasks.md`, `review-report.md` (E5), `quickstart.md`, `.specify/memory/constitution.md`
- **Parecer final**: **aprovado com ressalvas**. Não há defeito Crítico, Alto ou bloqueante. Há um defeito Baixo na aplicação (D-01) e um defeito Baixo em teste do Desenvolvedor (D-02), ambos não bloqueantes.

## 1. Plano de testes

### 1.1 Estratégia

- Testes de aceite HTTP em `test/acceptance/`, com `node:test` e sem dependências novas.
- Cada teste sobe o app com `app.listen(0)` (porta efêmera) e fecha o servidor ao final.
- O instante de referência é fixado com `t.mock.timers.enable({ apis: ['Date'] })`. Assim `new Date()` da rota fica determinístico.
- Fuso do processo alterado em tempo de execução com `process.env.TZ`, restaurado ao final de cada teste.
- Execução completa com o fuso do ambiente padrão e com `TZ=Asia/Tokyo`.
- Escopo: testes unitários (`test/unit/`, do Desenvolvedor) e o teste existente `test/app.test.js` foram executados como regressão, mas não foram alterados.

### 1.2 Casos de teste e rastreabilidade

| # | Caso de teste (arquivo `test/acceptance/server-time.acceptance.test.js`) | Requisitos | Histórias | Tipo |
|---|---------------------------------------------------------------------------|------------|-----------|------|
| 1 | GET / responde 200, `text/html`, valor `22/11/2026 12:30:00` para 2026-11-22T15:30:00Z | FR-001, FR-002, SC-001 | US1 (cenário 1 e 2) | Fluxo principal |
| 2 | Conversão para São Paulo em 9 instantes: exemplo da spec, virada de ano, virada de dia no último segundo, meia-noite (`00`, não `24`), zeros à esquerda, horário de verão de 2018 (antes, na transição e início), época Unix | FR-001, FR-002, SC-002 | US1 | Valores-limite, edge cases |
| 3 | TZ do processo em Asia/Tokyo, America/New_York, UTC e Asia/Kolkata não altera o valor (com verificação de sanidade de que o TZ muda a hora local) | FR-002, SC-002 | US1 (cenário 3) | Fuso do ambiente |
| 4 | Virada de ano com `TZ=Asia/Tokyo` mantém o horário de São Paulo (`31/12/2025 22:00:00`) | FR-002, SC-002 | US1 | Fuso e virada |
| 5 | Sem mock, a rota exibe data válida e não o fallback `indisponível` | FR-001, FR-008 | US1 | Caminho normal real |
| 6 | Nunca aparece "Invalid Date", texto ISO (`T hh:mm:ss`), GMT ou UTC na página, em todos os instantes da tabela | FR-008 | US1 | Exceção / entrada inválida |
| 7 | Cada carregamento mostra o instante daquele carregamento (12:30:00, depois 12:30:15 após 15 s) | FR-006 | US3 (cenário 2) | Fluxo alternativo |
| 8 | Sem `<script>`, `setInterval`, `setTimeout`, `meta refresh` nem preload | FR-005, SC-004 | US3 (cenário 1) | Não funcional |
| 9 | Valor do HTML já entregue não muda com o passar do tempo (snapshot, 30 s simulados) | FR-005, SC-004 | US3 (cenário 1) | Não funcional |
| 10 | `.server-time { color: #CC0000; }` declarado no `<style>` | FR-003 | US2 (cenário 1) | Visual |
| 11 | Exatamente uma declaração `color`, nenhum `style=` inline, classe só no span, `#CC0000` uma vez | FR-004, SC-003 | US2 (cenário 2) | Visual, restrição de escopo |
| 12 | `<h1>appdemo</h1>` e rótulo "Data/hora do servidor:" fora do span vermelho | FR-004 | US2 (cenário 2) | Visual |
| 13 | Exatamente um `id="server-time"` com a marcação do contrato `<span id="server-time" class="server-time">VALOR</span>` | FR-007 | Contrato | Estrutura |
| 14 | Rótulo, `lang="pt-br"` e id estáveis entre dois carregamentos (2026 e 2027) | FR-007, SC-005 (parcial) | US1 | Estrutura |
| 15 | Instante máximo do `Date` (8.64e15): sem fallback, sem "Invalid" | FR-008 | US1 | Valor-limite |

Cobertura de requisitos: FR-001..FR-008 cobertos por testes automatizados. SC-001..SC-004 cobertos. SC-005 (leitura pelo visitante na primeira tentativa) não é automatizável; ficou coberto de forma indireta por FR-001, FR-002 e FR-004, e a verificação humana está registrada na seção 5.

### 1.3 Testes existentes reaproveitados

- `test/app.test.js` (existente, mantido).
- `test/unit/server-time.test.js`, `test/unit/home-route-format.test.js`, `test/unit/home-route-static.test.js`, `test/unit/index-view-style.test.js` (do Desenvolvedor, não alterados).

## 2. Execução

Ambiente: Windows 11, Node.js v24.13.0, branch `001-server-time-ptbr-red`.

| Comando | Código de saída | Total | Aprovados | Reprovados |
|---------|-----------------|-------|-----------|------------|
| `node --test test/acceptance/server-time.acceptance.test.js` | 0 | 15 | 15 | 0 |
| `npm test` | 0 | 32 (17 existentes + 15 de aceite) | 32 | 0 |
| `TZ=Asia/Tokyo npm test` | 0 | 32 (17 existentes + 15 de aceite) | 32 | 0 |
| Smoke: `PORT=3917 node app.js` + `curl -s http://127.0.0.1:3917/` | 0 | 1 | 1 | 0 |
| Smoke: `TZ=Asia/Tokyo PORT=3918 node app.js` + `curl` | 0 | 1 | 1 | 0 |

Observações da execução:

- A primeira execução dos testes de aceite teve 4 falhas, todas de preparação do próprio teste. Duas chamadas de `setTime` ocorreram antes de `enable` do relógio, e a regex de ano de 4 dígitos foi aplicada ao caso limite de ano 275760 (que levou à observação D-01). As correções estão no arquivo final. Não houve alteração de código de produção.
- Smoke no relógio real (04:14:40 UTC) exibiu `22/11/2026 01:14:40` tanto com fuso padrão quanto com `TZ=Asia/Tokyo`, conferindo com o horário de Brasília.
- Cobertura: o plano não define comando de cobertura (`plan.md`, seção Comandos de verificação), e a constituição não a exige. Não foi medida.

## 3. Verificação de requisitos não funcionais

- **Desempenho**: uma formatação por requisição, com `Intl.DateTimeFormat` criado uma vez no carregamento do módulo. Não há carga testada. Sem risco identificado.
- **Segurança básica**: sem entrada do usuário na rota. O único valor dinâmico passa por `<%= %>` (escape). Nenhum segredo nem dependência nova.
- **Usabilidade e acessibilidade**: o contraste de `#CC0000` sobre fundo branco é aproximadamente 5,9:1, o que atende a leitura. A spec não exige razão de contraste formal. O `lang="pt-br"` está presente.

## 4. Defeitos

### D-01: ano com 6 dígitos no instante máximo do Date

- **Severidade**: Baixa (não bloqueante)
- **Requisito afetado**: FR-001 (ano com quatro dígitos)
- **Passos para reproduzir**: com o relógio em `8.64e15` ms (limite do `Date`, 2026 em diante, ano 275760), fazer `GET /`.
- **Resultado esperado**: data no padrão `dd/mm/aaaa hh:mm:ss`, ou fallback não técnico; nunca "Invalid Date" (FR-008).
- **Resultado obtido**: `12/09/275760 21:00:00`. Sem "Invalid Date" e sem fallback, mas o ano tem 6 dígitos, fora do `\d{4}` de FR-001.
- **Impacto**: nulo na prática, porque o servidor não alcança esse instante. Registrado para decisão do orquestrador e do humano. O teste 15 verifica apenas o que FR-008 exige.

### D-02: asserção frágil de "vermelho" em teste do Desenvolvedor (herdada de E5, B-01)

- **Severidade**: Baixa (não bloqueante; defeito de teste, não de produção)
- **Requisito afetado**: FR-004 (verificação automatizada)
- **Local**: `test/unit/index-view-style.test.js:30`, `assert.doesNotMatch(html.replace(/<style>[\s\S]*?<\/style>/, ''), /#CC0000|red/i)`
- **Passos para reproduzir**: qualquer texto de página com a sequência "red" (por exemplo, "required") faz essa asserção falhar, mesmo sem regressão de cor. Confirmado com `ejs.render` e o regex: o texto "required" dispara o match.
- **Resultado esperado**: o teste só falha se houver declaração de cor vermelha fora de `<style>`.
- **Resultado obtido**: falso positivo para qualquer palavra que contenha "red".
- **Sugestão**: usar `\bred\b` ou verificar `style="...color"`. Ação do Desenvolvedor, conforme a regra de não alterar testes dele pelo QA.

## 5. Verificação humana pendente

- **SC-005** (visitante lê dia, mês, ano e hora de Brasília na primeira tentativa): depende de leitura humana. O item 1 do `quickstart.md` cobre essa verificação. O QA não a automatizou, por ser critério subjetivo.

## 6. Pendências herdadas da E5 (`review-report.md`)

| Item E5 | Situação na E6 |
|---------|----------------|
| B-01 (regex de "red" frágil) | Permanece; registrado como D-02 |
| B-02 (teste de TZ pouco discriminante) | Mitigado: os testes 3 e 4 de aceite alteram `process.env.TZ` e verificam a sanidade do fuso |
| B-03 (evidência de Red não rastreável pelo git) | Fora do escopo da E6; sem alteração |
| S-01 (ramo `catch` do `formatServerTime` sem teste) | Permanece aberto. Não coberto pelos testes de aceite, que operam pelo HTTP. Sugestão de teste unitário com `mock.method` em `Intl.DateTimeFormat.prototype.formatToParts` |
| S-02 (conversão com instante fixo pela rota) | Resolvido pelos testes de aceite 2 a 4 e 7 |
| S-03 (títulos de teste sem acentuação) | Permanece; cosmético |

## 7. Arquivos criados ou alterados nesta etapa

- `C:\GITRepos\appdemo\test\acceptance\server-time.acceptance.test.js` (criado; teste de aceite com 15 casos)
- `C:\GITRepos\appdemo\specs\001-server-time-ptbr-red\qa-report.md` (criado; este relatório)

Nenhum arquivo de produção, teste do Desenvolvedor ou artefato do Spec Kit foi alterado.

## 8. Parecer

**Aprovado com ressalvas.**

O código atende a FR-001 a FR-008 e aos critérios SC-001 a SC-004, verificados por 15 testes de aceite e pela suíte existente, com 32 de 32 aprovados em `npm test` e em `TZ=Asia/Tokyo npm test`. Não há defeito Crítico, Alto ou bloqueante.

Ressalvas não bloqueantes para a descrição do PR:

1. D-01 (Baixa): ano com 6 dígitos no limite do `Date`, fora de FR-001.
2. D-02 (Baixa): asserção frágil de cor em teste do Desenvolvedor, a corrigir por ele.
3. SC-005 depende de verificação humana (item 1 do `quickstart.md`).
4. S-01 da E5 segue sem teste do ramo `catch`.
