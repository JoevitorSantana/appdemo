# Relatório de revisão de código: 001-server-time-ptbr-red

- **Etapa**: E5, revisão de código (rodada 1)
- **Branch**: `001-server-time-ptbr-red`
- **Intervalo revisado**: `main...HEAD` (HEAD = `8e96284`)
- **Arquivos de código revisados**: `app.js`, `lib/server-time.js`, `views/index.ejs`, `test/unit/server-time.test.js`, `test/unit/home-route-format.test.js`, `test/unit/home-route-static.test.js`, `test/unit/index-view-style.test.js`, `README.md`, `CLAUDE.md`
- **Referências**: `.specify/memory/constitution.md` 1.0.0, `spec.md` (FR-001..FR-008, SC-001..SC-005), `plan.md`, `research.md`, `data-model.md`, `contracts/home-page.md`, `tasks.md`

## Verificações executadas

| Comando | Resultado |
|---------|-----------|
| `npm test` | saída 0; 17 testes, 17 passaram, 0 falharam |
| `TZ=Asia/Tokyo npm test` | saída 0; 17 testes, 17 passaram, 0 falharam |
| lint | não aplicável (não existe no projeto, conforme plano) |
| build/typecheck | não aplicável (não existe no projeto, conforme plano) |

## Conformidade

### Requisitos funcionais e critérios de sucesso

| Item | Situação | Evidência |
|------|----------|-----------|
| FR-001 formato `dd/mm/aaaa hh:mm:ss`, 24 h | Atende | `lib/server-time.js:3-13,22` (`formatToParts`, `hourCycle: 'h23'`, separador espaço); testes em `server-time.test.js:7-22` |
| FR-002 fuso America/Sao_Paulo independente do ambiente | Atende | `timeZone: 'America/Sao_Paulo'` explícito; teste com `process.env.TZ` alterado e execução `TZ=Asia/Tokyo npm test` verde |
| FR-003 valor em vermelho (#CC0000) | Atende | `views/index.ejs:6-8,12`; `index-view-style.test.js:16-21` |
| FR-004 vermelho restrito ao valor | Atende | única regra de cor no `<style>`, aplicada só à classe do span; `index-view-style.test.js:23-39` |
| FR-005 sem atualização automática | Atende | nenhum `<script>` nem `meta refresh`; `home-route-static.test.js:15-25` |
| FR-006 novo valor por carregamento | Atende | `new Date()` dentro do handler (`app.js:10`); `home-route-static.test.js:27-40` |
| FR-007 `id="server-time"` preservado, 200 | Atende | `views/index.ejs:12`; `test/app.test.js` e `home-route-format.test.js` |
| FR-008 nunca "Invalid Date" | Atende | guarda `instanceof Date`/`NaN` e `try/catch` com fallback `indisponível` (`lib/server-time.js:15-25`); teste `server-time.test.js:47-53` |
| SC-001..SC-004 | Atendidos pelos testes acima | SC-002 coberto com virada de ano e períodos com/sem horário de verão (2018 e 2019) |
| SC-005 | Atendido pelo formato e fuso; validação de leitura humana fica para o QA | |

### Constituição

| Princípio | Situação | Observação |
|-----------|----------|------------|
| I. Simplicidade | Atende | `Intl` nativo, um módulo com uma função; `package.json` sem dependências novas; `<style>` inline sem `express.static` |
| II. Teste primeiro | Atende (ver B-03) | testes com `node --test`; `tasks.md` registra as execuções Red/Green |
| III. Aplicação testável | Atende | `app.js` exporta `app`, `listen` só sob `require.main === module`; testes usam `app.listen(0)` |
| IV. EJS no servidor, escape | Atende | template só imprime `<%= serverTime %>` (escapado, com teste de escape `index-view-style.test.js:41-45`); formatação fora do template |
| V. Rastreabilidade | Atende | mudanças mapeadas a T001..T017 e FR/US; commits por história |
| Restrições técnicas | Atende | sem segredos; `.env` no `.gitignore`; README atualizado; `PORT` continua via ambiente |

`Complexity Tracking` vazio e nenhuma violação encontrada. Segurança: sem entrada do usuário na rota; único dado dinâmico é escapado; sem XSS, injeção ou exposição de dados. Desempenho: `Intl.DateTimeFormat` instanciado uma vez no carregamento do módulo e reutilizado; custo por requisição desprezível. Migrações/banco: não aplicável.

## Apontamentos (ordenados por severidade)

Nenhum apontamento Crítico, Alto ou Médio. Nenhum apontamento é bloqueante.

### B-01 Baixo (não bloqueante): asserção frágil de "red" no HTML

- **Arquivo/linha**: `test/unit/index-view-style.test.js:30`
- **Problema**: `assert.doesNotMatch(html.replace(/<style>[\s\S]*?<\/style>/, ''), /#CC0000|red/i)` falha para qualquer palavra que contenha a sequência "red" (ex.: "required", "credenciais", "Fred"). Uma mudança futura e legítima de texto ou markup quebraria o teste sem regressão real de cor (falso negativo).
- **Impacto**: manutenção; não afeta o comportamento atual.
- **Correção sugerida**: restringir a busca a declarações de cor fora do `<style>`, por exemplo `/style\s*=\s*"[^"]*color/i` (estilo inline com cor) e `/#CC0000|\bred\b/i` com fronteira de palavra; ou verificar apenas que nenhum elemento além do span possui `class="server-time"` ou atributo `style`.

### B-02 Baixo (não bloqueante): teste de "independe do TZ do processo" pouco discriminante

- **Arquivo/linha**: `test/unit/server-time.test.js:34-45`
- **Problema**: como o formatter tem `timeZone` explícito, alterar `process.env.TZ` em tempo de execução não exercita nenhum caminho de código diferente; o teste passaria mesmo que o Node não reaplicasse o `TZ` alterado. A garantia real de FR-002/SC-002 vem da execução `TZ=Asia/Tokyo npm test`, que está documentada no plano e no README.
- **Impacto**: baixo; cobertura efetiva de FR-002 existe pela execução com `TZ` externo.
- **Correção sugerida**: manter o teste, mas acrescentar no mesmo teste uma verificação de sanidade de que o `TZ` foi de fato aplicado (ex.: `assert.notStrictEqual(new Date(instant).getHours(), 12)` após definir `Asia/Tokyo`), para que ele não seja um falso positivo silencioso. Opcional.

### B-03 Baixo (não bloqueante): evidência de Red não rastreável pelo histórico git

- **Arquivo/linha**: commit `814737b` (`lib/server-time.js`, `app.js` e testes de US1 no mesmo commit); `5b940be` (idem para US2)
- **Problema**: testes e implementação de cada história foram commitados juntos, então a fase Red (constituição II) só é evidenciada pelo registro em `tasks.md` (T004, T005, T009, T012), não pelo histórico. Não há indício de violação, apenas ausência de evidência verificável.
- **Impacto**: auditabilidade do princípio II.
- **Correção sugerida**: nenhuma alteração de código necessária. Para próximas features, registrar a saída da execução Red (ex.: em `specs/<feature>/notes/e4-evidencia-red.md`) ou commitar os testes antes da implementação.

### S-01 Sugestão: ramo `catch` do fallback sem teste

- **Arquivo/linha**: `lib/server-time.js:23-25`
- **Problema**: o fallback por exceção de `Intl` não é exercitado (só o ramo de data inválida é testado). Na prática é difícil provocar erro com `Date` válido, e o ramo é defensivo conforme research D4.
- **Correção sugerida**: opcional; pode ser coberto com `mock.method(Intl.DateTimeFormat.prototype, 'formatToParts', () => { throw new RangeError(); })` do `node:test`. Não obrigatório.

### S-02 Sugestão: plano previa `mock.timers` para fixar o instante na rota

- **Arquivo/linha**: `test/unit/home-route-format.test.js:14` (referência: `research.md` D7)
- **Problema**: o teste HTTP verifica apenas o padrão do texto (ou `indisponível`), não um instante fixo convertido. A conversão exata é coberta nos testes unitários de `formatServerTime`, então não há lacuna funcional; a aceitação com instante fixo pela rota é escopo dos testes de aceite do QA (`test/acceptance/`).
- **Correção sugerida**: nenhuma ação do Desenvolvedor; QA pode usar `mock.timers.enable({ apis: ['Date'], now: ... })` nos testes de aceite. Observação adicional: a regex do teste aceita `indisponível`, o que é correto pelo contrato, mas o QA deve garantir que o caminho normal produza data, não o fallback.

### S-03 Sugestão: títulos de teste sem acentuação

- **Arquivo/linha**: `test/unit/index-view-style.test.js:32,41` ("titulo e rotulo", "valor e escapado")
- **Problema**: inconsistência com os demais títulos acentuados; puramente cosmético.
- **Correção sugerida**: "título e rótulo ficam fora do span vermelho", "valor é escapado". Opcional.

## Parecer

**Aprovado com ressalvas.** O código atende a FR-001..FR-008, aos critérios SC-001..SC-004 verificáveis em teste, ao contrato `contracts/home-page.md` e a todos os princípios da constituição, sem dependências novas e com escape EJS preservado. `npm test` e `TZ=Asia/Tokyo npm test` terminam com código 0 (17/17). Os apontamentos B-01..B-03 e S-01..S-03 não são bloqueantes e devem constar na descrição do PR.
