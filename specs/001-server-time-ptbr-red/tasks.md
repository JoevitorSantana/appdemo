---

description: "Task list: Data/hora do servidor em pt-BR, vermelha, fuso de São Paulo"
---

# Tasks: Data/hora do servidor em pt-BR, vermelha, fuso de São Paulo

**Input**: Design documents from `/specs/001-server-time-ptbr-red/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/home-page.md, quickstart.md, `.specify/memory/constitution.md`

**Tests**: Incluídas tarefas de teste unitário (Red) porque o princípio II da constituição (Teste Primeiro, NON-NEGOTIABLE) exige testes escritos e vistos falhar antes da implementação. Os testes de aceite HTTP em `test/acceptance/` são do QA e ficam fora destas tarefas. O teste existente `test/app.test.js` é mantido sem alterações.

**Organization**: Tarefas agrupadas por história de usuário (US1 P1, US2 P2, US3 P3).

**Comandos de verificação**: `npm test`; `TZ=Asia/Tokyo npm test` (PowerShell: `$env:TZ='Asia/Tokyo'; npm test`). Lint e build: não aplicáveis.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história de usuário da spec (US1, US2, US3)

## Path Conventions

Projeto único Express + EJS na raiz: `app.js`, `lib/`, `views/`, `test/unit/`, `README.md`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Estrutura de diretórios para o novo código e os testes

- [X] T001 [P] Criar o diretório `lib/` na raiz para receber `lib/server-time.js` (arquivo criado em T006); nenhuma dependência nova em `package.json`
- [X] T002 [P] Criar o diretório `test/unit/` (os testes unitários da feature ficam aqui; manter `test/app.test.js` intacto)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Garantir base verde antes das mudanças

**CRITICAL**: Nenhuma história começa antes desta fase

- [X] T003 Executar `npm test` e confirmar que o teste existente `test/app.test.js` passa (linha de base), sem modificar `app.js` nem `views/index.ejs`

**Checkpoint**: Base verde; histórias podem começar

---

## Phase 3: User Story 1 - Data/hora em pt-BR e fuso America/Sao_Paulo (Priority: P1) MVP

**Goal**: A página inicial exibe a data/hora do servidor como `dd/mm/aaaa hh:mm:ss` (24 h) no fuso America/Sao_Paulo, independente do `TZ` do ambiente (FR-001, FR-002, FR-007, FR-008; SC-001, SC-002).

**Independent Test**: `npm test` e `TZ=Asia/Tokyo npm test` passam; `curl -s http://localhost:3000/ | grep 'id="server-time"'` mostra o valor no padrão pt-BR no horário de Brasília.

### Tests for User Story 1 (Red: escrever e ver FALHAR antes de implementar)

- [ ] T004 [P] [US1] Criar `test/unit/server-time.test.js` (`node:test`) cobrindo `formatServerTime` de `lib/server-time.js`: 2026-11-22T15:30:00Z -> `22/11/2026 12:30:00`; virada de dia/ano (2026-01-01T01:00:00Z -> `31/12/2025 22:00:00`); zeros à esquerda (ex.: `05/03/2026 09:07:02`); instantes com e sem horário de verão conforme regras do fuso; formato casa com `^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$`; resultado idêntico com `process.env.TZ` alterado; `new Date(NaN)` e entrada não-Date retornam `indisponível` e nunca contêm "Invalid Date" (FR-008). Campo `serverTime` conforme `data-model.md` Data/hora do servidor.texto exibido (serverTime). Rodar `npm test` e confirmar que falha (módulo ausente)
- [ ] T005 [P] [US1] Criar `test/unit/home-route-format.test.js` que importa `app` de `app.js`, sobe em `app.listen(0)`, faz `GET /` e verifica status 200, presença de `id="server-time"` e que o texto do span casa com a regex de `data-model.md` Data/hora do servidor.texto exibido (serverTime) ou é `indisponível`. Rodar `npm test` e confirmar que falha (hoje exibe ISO UTC)

### Implementation for User Story 1

- [ ] T006 [US1] Implementar e exportar `formatServerTime(date)` em `lib/server-time.js` (CommonJS): `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hourCycle: 'h23', ... })` montando `dd/mm/aaaa hh:mm:ss` via `formatToParts`; fallback `indisponível` para data inválida ou erro de `Intl`; campo `serverTime` conforme `data-model.md` Data/hora do servidor.texto exibido (serverTime); sem novas dependências (depende de T004)
- [ ] T007 [US1] Alterar a rota `GET /` em `app.js` para importar `formatServerTime` de `./lib/server-time` e enviar `serverTime: formatServerTime(new Date())` ao template `views/index.ejs`; manter `module.exports = app` e sem `listen` no import (depende de T006, T005)
- [ ] T008 [US1] Rodar `npm test` e `TZ=Asia/Tokyo npm test` e confirmar que T004, T005 e `test/app.test.js` passam (Green)

**Checkpoint**: US1 funcional e testável sozinha (MVP)

---

## Phase 4: User Story 2 - Destacar a data/hora em vermelho (Priority: P2)

**Goal**: O valor da data/hora aparece em vermelho `#CC0000`, sem afetar título e rótulo (FR-003, FR-004, FR-007; SC-003).

**Independent Test**: Página renderizada contém `<span id="server-time" class="server-time">` e `<style>` com `.server-time { color: #CC0000; }`, sem outra regra de cor vermelha.

### Tests for User Story 2 (Red)

- [ ] T009 [P] [US2] Criar `test/unit/index-view-style.test.js` que renderiza `views/index.ejs` com `ejs.renderFile` (valor de exemplo em `serverTime`) e verifica: span com `id="server-time"` e `class="server-time"`; `<style>` com `.server-time` e `color: #CC0000`; nenhuma outra regra define vermelho; título e rótulo fora do span. Rodar `npm test` e confirmar que falha

### Implementation for User Story 2

- [ ] T010 [US2] Alterar `views/index.ejs`: adicionar `<style>` inline no `<head>` com `.server-time { color: #CC0000; }` e `class="server-time"` no `<span id="server-time">`, mantendo `<%= serverTime %>` escapado e o id (depende de T009)
- [ ] T011 [US2] Rodar `npm test` e confirmar que T009 e demais testes passam (Green)

**Checkpoint**: US1 e US2 funcionam de forma independente

---

## Phase 5: User Story 3 - Valor fixo por carregamento (Priority: P3)

**Goal**: O valor é calculado uma vez por requisição no servidor, sem JavaScript no cliente e sem atualização automática (FR-005, FR-006; SC-004).

**Independent Test**: HTML da página não contém `<script>`; duas requisições separadas no tempo retornam valores calculados em cada requisição.

### Tests for User Story 3 (Red)

- [ ] T012 [P] [US3] Criar `test/unit/home-route-static.test.js` que importa `app` de `app.js`, sobe em `app.listen(0)` e verifica: resposta de `GET /` não contém `<script`, `setInterval` nem `<meta http-equiv="refresh"`; duas requisições com intervalo > 1 s retornam valores distintos e cada um segue o formato pt-BR (FR-006). O teste de ausência de script pode já passar (garantia de regressão); registrar isso; o de requisições sucessivas falha até T007 estar concluído

### Implementation for User Story 3

- [ ] T013 [US3] Verificar em `app.js` que `new Date()` é avaliado dentro do handler de `GET /` (a cada requisição, não no carregamento do módulo) e em `views/index.ejs` que não há `<script>` nem refresh automático; corrigir apenas se houver desvio (depende de T007, T010, T012)
- [ ] T014 [US3] Rodar `npm test` e confirmar que T012 passa (Green)

**Checkpoint**: Todas as histórias funcionais

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T015 [P] Atualizar `README.md` documentando que a página inicial exibe a data/hora do servidor em pt-BR (`dd/mm/aaaa hh:mm:ss`), no fuso America/Sao_Paulo, em vermelho e sem atualização automática, e como rodar `npm test` e `TZ=Asia/Tokyo npm test`
- [ ] T016 Rodar `npm test` e `TZ=Asia/Tokyo npm test` completos (SC-002) e confirmar que `test/app.test.js` continua passando
- [ ] T017 Executar a validação manual de `specs/001-server-time-ptbr-red/quickstart.md` (`npm start`, conferir formato, cor, estabilidade 10 s, `TZ=Asia/Tokyo npm start`, `curl`) e conferir que não há dependências novas em `package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) -> Foundational (Phase 2) -> US1 (P1) -> US2 (P2) -> US3 (P3) -> Polish
- US2 edita `views/index.ejs` e US1 edita `app.js` e `lib/`; podem rodar em paralelo após a Foundational, mas US3 (T013) verifica o resultado de US1 e US2
- Polish depende de todas as histórias

### Within Each Story

- Teste Red (visto falhar) -> implementação -> Green (princípio II)

### Parallel Opportunities

- T001 e T002 em paralelo
- T004 e T005 em paralelo; T009 e T012 em paralelo com os testes de US1 (arquivos diferentes)
- US1 (T006, T007) e US2 (T010) em paralelo (arquivos diferentes: `lib/server-time.js`/`app.js` vs `views/index.ejs`)
- T015 em paralelo com T016

---

## Parallel Example

```bash
# Testes Red juntos:
Task: "test/unit/server-time.test.js (T004)"
Task: "test/unit/home-route-format.test.js (T005)"
Task: "test/unit/index-view-style.test.js (T009)"
Task: "test/unit/home-route-static.test.js (T012)"
```

---

## Implementation Strategy

### MVP First (US1)

1. Setup e Foundational (T001-T003)
2. US1 (T004-T008) e validar com `npm test` e `TZ=Asia/Tokyo npm test`
3. Entregar MVP: formato pt-BR e fuso de São Paulo

### Incremental Delivery

1. Adicionar US2 (vermelho) e validar
2. Adicionar US3 (valor fixo) e validar
3. Polish: README e validação do quickstart

### Rastreabilidade de cobertura

| Requisito | Tarefas |
|-----------|---------|
| FR-001, FR-002 | T004, T005, T006, T007 |
| FR-003, FR-004 | T009, T010 |
| FR-005, FR-006 | T007, T012, T013 |
| FR-007 | T005, T009, T010 |
| FR-008 | T004, T006 |
| SC-002 (qualquer TZ) | T004, T008, T016 |

---

## Notes

- [P] = arquivos diferentes, sem dependência pendente
- Testes de aceite (`test/acceptance/`) são do QA, fora desta lista
- Não adicionar dependências; não criar lint/build
- Sem commits nesta etapa
