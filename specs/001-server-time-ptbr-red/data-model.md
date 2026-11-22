# Data Model: Data/hora do servidor

Não há persistência. Única entidade conceitual (spec, Key Entities):

## Data/hora do servidor

| Campo | Tipo | Origem | Regras |
|-------|------|--------|--------|
| instante | `Date` | `new Date()` na rota `GET /`, uma vez por requisição | Instante da geração da página, não o relógio do navegador (FR-006) |
| texto exibido (`serverTime`) | string | `formatServerTime(instante)` | Formato `dd/mm/aaaa hh:mm:ss`, 24 h, fuso `America/Sao_Paulo`, dois dígitos em dia/mês/hora/minuto/segundo, quatro no ano (FR-001, FR-002) |

Regras de validação / transição:

- Instante inválido (`NaN`) ou falha do `Intl`: `serverTime = "indisponível"` (FR-008); nunca "Invalid Date".
- Sem estados nem transições: o valor é imutável após a renderização (FR-005); não é armazenado nem editável pelo visitante.
- Sem relacionamentos.
