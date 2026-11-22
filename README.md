# appdemo

Aplicação Express + EJS usada para demonstrar a Fábrica de Software Agêntica.

## Página inicial

A página inicial exibe a data e hora do servidor:

- formato pt-BR `dd/mm/aaaa hh:mm:ss`;
- fuso fixo America/Sao_Paulo (horário de Brasília), independente do fuso do ambiente;
- valor em vermelho (título e rótulo mantêm a cor padrão);
- sem atualização automática: o valor muda apenas ao recarregar a página.

## Uso

```bash
npm install
npm start   # http://localhost:3000 (ou a porta definida em PORT)
```

## Testes

```bash
npm test
TZ=Asia/Tokyo npm test   # PowerShell: $env:TZ='Asia/Tokyo'; npm test
```
