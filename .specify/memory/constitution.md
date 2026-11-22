<!--
Sync Impact Report
- Version change: (template, unversioned) → 1.0.0
- Modified principles: none renamed (all five were unfilled template placeholders)
- Added sections: Core Principles (5), Restrições Técnicas, Fluxo de Desenvolvimento, Governance
- Removed sections: none
- Deferred TODOs: none
-->
# appdemo Constitution

## Core Principles

### I. Simplicidade Primeiro
A aplicação é uma demonstração de Express + EJS e MUST permanecer simples. Novas
dependências, camadas ou abstrações MUST ser justificadas por uma necessidade concreta
da especificação; funcionalidade especulativa (YAGNI) MUST NOT ser adicionada.

### II. Teste Primeiro (NON-NEGOTIABLE)
Toda funcionalidade ou correção MUST ter testes escritos antes da implementação, usando
o runner nativo do Node (`node --test`), e esses testes MUST falhar antes de passar
(Red-Green-Refactor). `npm test` MUST passar antes de qualquer merge.

### III. Aplicação Testável
`app.js` MUST exportar a instância do Express e MUST NOT iniciar o servidor ao ser
importado (somente via `require.main === module`). Os testes MUST exercitar rotas HTTP
sem depender de porta fixa ou de estado externo.

### IV. Renderização no Servidor com EJS
Páginas MUST ser renderizadas no servidor por templates EJS em `views/`. Lógica de
negócio MUST NOT residir nos templates; dados MUST ser passados pela rota. Saída
dinâmica nos templates MUST usar escape (`<%= %>`) salvo justificativa explícita.

### V. Rastreabilidade da Especificação
Toda mudança de código MUST ser rastreável a uma especificação, plano e tarefa do Spec
Kit (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks`). Mudanças sem especificação
correspondente MUST NOT ser implementadas, exceto correções triviais documentadas no commit.

## Restrições Técnicas

- Plataforma: Node.js com Express 4 e EJS; testes com `node --test`.
- Configuração via variáveis de ambiente (ex.: `PORT`), nunca valores fixos em código
  quando variarem por ambiente.
- Segredos e credenciais MUST NOT ser versionados.
- Documentação de uso (`README.md`) MUST ser atualizada quando comandos ou comportamento
  visível ao usuário mudarem.

## Fluxo de Desenvolvimento

- Fluxo padrão: especificar → planejar → gerar tarefas → implementar → revisar → QA.
- Todo código MUST ser revisado quanto à conformidade com esta constituição antes do merge.
- Commits MUST ser pequenos, focados e com mensagens descritivas.
- Portões de qualidade: testes passando, sem erros ao executar `npm start`, README coerente.

## Governance

Esta constituição prevalece sobre outras práticas do projeto. Emendas MUST ser feitas
via `/speckit-constitution`, documentadas com justificativa e, quando alterarem
princípios existentes, incluir plano de migração para o código afetado.

Versionamento semântico: MAJOR para remoção ou redefinição incompatível de princípios;
MINOR para novo princípio/seção ou expansão material; PATCH para esclarecimentos e
correções de redação. Toda revisão de código e plano MUST verificar a conformidade;
desvios de complexidade MUST ser justificados por escrito.

**Version**: 1.0.0 | **Ratified**: 2026-11-22 | **Last Amended**: 2026-11-22
