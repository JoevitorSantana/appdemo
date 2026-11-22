# Quickstart: validação da feature

Pré-requisitos: Node.js 18+ (testado em v24), `npm install` já executado. Contrato em [contracts/home-page.md](./contracts/home-page.md); regras em [data-model.md](./data-model.md).

## 1. Testes automatizados

```bash
npm test
TZ=Asia/Tokyo npm test      # PowerShell: $env:TZ='Asia/Tokyo'; npm test
```

Esperado: todos passam (unitários em `test/unit/`, aceite em `test/acceptance/`, teste existente `test/app.test.js`), inclusive com fuso do ambiente diferente (SC-002).

## 2. Verificação manual ponta a ponta

```bash
npm start                   # http://localhost:3000 (ou PORT)
```

Abrir a página e conferir:

1. O valor segue `dd/mm/aaaa hh:mm:ss` e coincide com o horário de Brasília (US1, SC-001, SC-002).
2. Somente o valor está em vermelho; título e rótulo em cor padrão (US2, SC-003).
3. Aguardar 10 s: o valor não muda; recarregar mostra novo valor (US3, SC-004).
4. Em outro fuso: `TZ=Asia/Tokyo npm start`; o valor continua em horário de Brasília (FR-002).

## 3. Verificação por linha de comando

```bash
curl -s http://localhost:3000/ | grep 'id="server-time"'
```

Esperado: `<span id="server-time" class="server-time">22/11/2026 12:30:00</span>` (valor conforme o instante).
