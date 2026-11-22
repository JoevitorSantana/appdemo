# Implementation Plan: Data/hora do servidor em pt-BR, vermelha, fuso de São Paulo

**Branch**: `001-server-time-ptbr-red` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-server-time-ptbr-red/spec.md`

## Summary

A rota `GET /` passa a enviar ao template `views/index.ejs` o texto da data/hora já formatado em pt-BR (`dd/mm/aaaa hh:mm:ss`, 24 h) no fuso `America/Sao_Paulo`, em vez do ISO UTC atual (FR-001, FR-002, US1). A formatação fica em uma função pura e pequena, `formatServerTime(date)`, baseada em `Intl.DateTimeFormat` nativo do Node (sem novas dependências), com fallback seguro que nunca emite "Invalid Date" (FR-008). O `<span id="server-time">` é preservado (FR-007) e recebe uma classe CSS com vermelho `#CC0000`, definida em um `<style>` inline do template, restrita ao valor (FR-003, FR-004, US2). O valor é calculado uma única vez por requisição no servidor e não há JavaScript no cliente, logo não há atualização automática (FR-005, FR-006, US3). Decisões detalhadas em [research.md](./research.md).

## Technical Context

**Language/Version**: Node.js (ambiente atual v24.13.0; `Intl` com ICU completo e tzdata embutidos), JavaScript CommonJS

**Primary Dependencies**: Express 4.21 e EJS 3.1 (já existentes); nenhuma dependência nova

**Storage**: N/A

**Testing**: `node --test` (runner nativo, constituição II); testes unitários em `test/unit/`, testes de aceite HTTP (QA) em `test/acceptance/`; o teste existente `test/app.test.js` é mantido

**Target Platform**: Servidor Node.js, página HTML renderizada no servidor

**Project Type**: web-service (Express + EJS, projeto único)

**Performance Goals**: não aplicável (uma formatação por requisição, custo desprezível)

**Constraints**: sem novas dependências; sem JS no cliente; `app.js` continua exportando `app` sem iniciar servidor ao ser importado; saída escapada com `<%= %>`; resultado independente do fuso do SO (`TZ`) e do navegador

**Scale/Scope**: uma página, um valor exibido

**Comandos de verificação** (critério de avanço do orquestrador):

- Teste (obrigatório): `npm test` (equivale a `node --test`; descobre `test/**/*.test.js`). Cobertura: a constituição não exige verificação de cobertura; nenhum comando de cobertura é definido.
- Teste com fuso do ambiente alterado (verifica SC-002/FR-002): `TZ=Asia/Tokyo npm test` (em PowerShell: `$env:TZ='Asia/Tokyo'; npm test`)
- Lint: não existe no projeto; nenhum será adicionado (princípio I, YAGNI). Comando: não aplicável.
- Build/typecheck: não existe (JavaScript puro, sem transpilação). Comando: não aplicável.
- Gate de execução (constituição, portões de qualidade): `npm start` sobe sem erro (verificação manual descrita em [quickstart.md](./quickstart.md)).

**Variáveis de ambiente**: somente `PORT` (já existente, opcional, padrão 3000). Esta feature não adiciona variáveis nem configuração sensível. Os testes usam `app.listen(0)` e não dependem de `PORT`.

**Banco de dados / migrações**: N/A.

**Diretórios de testes**: unitários (Desenvolvedor) em `test/unit/`; aceite (QA) em `test/acceptance/`.

**Rastreabilidade** (decisão técnica -> requisito):

| Decisão | Requisitos / histórias |
|---------|------------------------|
| `formatServerTime` com `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hourCycle: 'h23', ... })` montando `dd/mm/aaaa hh:mm:ss` por `formatToParts` | FR-001, FR-002, SC-001, SC-002, US1 |
| Fallback `indisponível` (texto fixo) quando data inválida ou `Intl` lançar erro | FR-008 |
| Classe `.server-time` em `<style>` inline, `color: #CC0000`, só no `<span>` | FR-003, FR-004, SC-003, US2 |
| Valor calculado na rota, sem script no cliente | FR-005, FR-006, SC-004, US3 |
| `id="server-time"` e `<%= %>` preservados | FR-007 |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Resultado |
|-----------|-----------|-----------|
| I. Simplicidade Primeiro | Usa `Intl` nativo; sem dependências; um módulo pequeno com uma função; sem JS no cliente | Passa |
| II. Teste Primeiro (NON-NEGOTIABLE) | Tarefas devem escrever testes unitários e de aceite antes e vê-los falhar (Red) antes de implementar; runner `node --test` | Passa (condição para as tarefas) |
| III. Aplicação Testável | `app.js` continua exportando `app`, sem listen no import; testes usam porta efêmera; formatação testável como função pura | Passa |
| IV. Renderização no Servidor com EJS | Formatação feita na rota/módulo, template só exibe `serverTime` com `<%= %>` | Passa |
| V. Rastreabilidade | Plano mapeia decisões a FR/SC/US; tarefas devem citar os IDs | Passa |
| Restrições Técnicas | Node/Express/EJS; sem segredos; README a atualizar (comportamento visível mudou) | Passa (README entra nas tarefas) |

Pós-design (Fase 1): reavaliado, sem alterações; nenhuma violação, `Complexity Tracking` vazio.

## Project Structure

### Documentation (this feature)

```text
specs/001-server-time-ptbr-red/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── home-page.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app.js                      # alterar: rota GET / usa formatServerTime(new Date())
lib/
└── server-time.js          # novo: formatServerTime(date) -> string pt-BR / fallback
views/
└── index.ejs               # alterar: <style> inline e class="server-time" no span#server-time
test/
├── app.test.js             # existente, mantido
├── unit/                   # testes unitários (Desenvolvedor): formatServerTime
└── acceptance/             # testes de aceite HTTP (QA): formato, cor, estrutura, id
README.md                   # alterar: documentar exibição pt-BR/São Paulo/vermelho
CLAUDE.md                   # contexto do agente (update-agent-context)
```

**Structure Decision**: projeto único Express + EJS já existente. Adiciona-se apenas `lib/server-time.js` para isolar a formatação como função pura testável por instante de referência (SC-002) sem depender do relógio; `app.js` e o template mudam minimamente.

## Complexity Tracking

Sem violações da constituição; nada a justificar.
