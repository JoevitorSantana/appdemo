# Contrato de interface: página inicial `GET /`

Interface externa única afetada (HTML renderizado no servidor).

## Requisição

`GET /` sem parâmetros.

## Resposta

- Status `200`, `Content-Type: text/html`.
- Corpo contém exatamente um elemento `<span id="server-time" class="server-time">VALOR</span>` dentro do parágrafo `Data/hora do servidor: <span ...>`.
- `VALOR` (escapado por `<%= %>`):
  - normal: `dd/mm/aaaa hh:mm:ss`, regex `^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$`, horário de `America/Sao_Paulo`, 24 h (FR-001, FR-002);
  - falha (não esperada): literal `indisponível` (FR-008).
- O `<head>` contém `<style>` com a regra `.server-time { color: #CC0000; }` (FR-003). Nenhuma outra regra define vermelho; título, rótulo e demais textos mantêm a cor padrão (FR-004).
- Sem `<script>`: valor fixo por carregamento (FR-005).
- O id `server-time` é estável (FR-007).

## Interface interna testável

`lib/server-time.js` exporta `formatServerTime(date: Date): string` (pura; retorna o texto acima ou `indisponível`).
