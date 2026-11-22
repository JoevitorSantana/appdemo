# Feature Specification: Data/hora do servidor em pt-BR, vermelha, fuso de São Paulo

**Feature Branch**: `001-server-time-ptbr-red`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "No frontend a data/hora do servidor deve aparecer no formato pt-br e em cor vermelha. Não precisa ser atualizada e deve usar a timezone America/Sao_Paulo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a data/hora do servidor no padrão brasileiro e em fuso de São Paulo (Priority: P1)

Ao abrir a página inicial, o visitante vê a data e a hora do servidor escritas no padrão brasileiro (pt-BR) e convertidas para o horário de Brasília (fuso America/Sao_Paulo), independentemente do fuso em que o servidor ou o navegador estejam configurados.

**Why this priority**: É o núcleo da demanda: hoje a data/hora aparece em formato técnico, difícil de ler e sem fuso local. Corrigir isso entrega o valor principal.

**Independent Test**: Pode ser testada integralmente carregando a página inicial e conferindo que o texto exibido segue o padrão pt-BR e corresponde ao horário de America/Sao_Paulo do instante da requisição.

**Acceptance Scenarios**:

1. **Given** que o servidor está no ar, **When** o visitante abre a página inicial, **Then** a data/hora do servidor é exibida no padrão pt-BR (dia/mês/ano e hora:minuto:segundo, 24 horas).
2. **Given** um instante de referência em UTC (por exemplo, 2026-11-22 15:30:00 UTC), **When** a página é carregada nesse instante, **Then** o valor exibido é o horário de America/Sao_Paulo correspondente (22/11/2026 12:30:00).
3. **Given** que o servidor opera com fuso diferente de America/Sao_Paulo, **When** o visitante abre a página, **Then** o valor exibido continua sendo o horário de America/Sao_Paulo.

---

### User Story 2 - Destacar a data/hora em vermelho (Priority: P2)

O visitante vê o texto da data/hora do servidor em cor vermelha, distinguindo-o do restante da página.

**Why this priority**: Requisito visual explícito da demanda; complementa a legibilidade da P1, mas não altera o conteúdo informado.

**Independent Test**: Pode ser testada carregando a página e verificando que o elemento que contém a data/hora do servidor é apresentado em vermelho, enquanto o restante do texto mantém a cor padrão.

**Acceptance Scenarios**:

1. **Given** que a página inicial foi carregada, **When** o visitante observa a data/hora do servidor, **Then** o valor é exibido em cor vermelha.
2. **Given** que a página inicial foi carregada, **When** o visitante observa o restante da página (título e rótulo "Data/hora do servidor:"), **Then** esses textos não são afetados pela cor vermelha.

---

### User Story 3 - Valor fixo por carregamento (Priority: P3)

O valor exibido é definido uma única vez a cada carregamento da página e não muda sozinho enquanto a página permanece aberta.

**Why this priority**: Registra de forma testável a decisão de "não precisa ser atualizada", evitando que se espere ou se implemente atualização contínua.

**Independent Test**: Pode ser testada abrindo a página, aguardando alguns segundos e conferindo que o valor exibido permanece idêntico; recarregar a página exibe um novo valor.

**Acceptance Scenarios**:

1. **Given** que a página foi carregada e exibe uma data/hora, **When** o visitante a mantém aberta por pelo menos 10 segundos sem interagir, **Then** o valor exibido não muda.
2. **Given** que a página foi carregada, **When** o visitante recarrega a página, **Then** é exibida a data/hora do servidor correspondente ao novo carregamento.

---

### Edge Cases

- Horário de verão: o fuso America/Sao_Paulo pode ter ou não deslocamento sazonal conforme as regras vigentes na data; o valor exibido deve sempre refletir a regra vigente do fuso para o instante exibido, sem ajuste manual.
- Virada de dia/mês/ano: quando o horário de America/Sao_Paulo cai em outro dia que o UTC (ex.: 01:00 UTC de 1º de janeiro é 22:00 de 31 de dezembro em São Paulo), a data exibida deve ser a de São Paulo.
- Zeros à esquerda: dia, mês, hora, minuto e segundo menores que 10 aparecem com dois dígitos (ex.: 05/03/2026 09:07:02).
- Fuso do servidor ou do navegador diferente de America/Sao_Paulo: não deve alterar o valor exibido.
- Falha ao obter ou formatar a data/hora: a página não deve exibir texto técnico ou inválido (como "Invalid Date"); o comportamento exato nesse caso está registrado nas Assumptions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir, na página inicial, a data/hora do servidor no padrão pt-BR: dia/mês/ano com dois dígitos para dia e mês e quatro para o ano, seguido de hora:minuto:segundo em formato 24 horas (ex.: 22/11/2026 12:30:00).
- **FR-002**: O sistema MUST apresentar a data/hora convertida para o fuso America/Sao_Paulo, independentemente do fuso configurado no servidor ou no navegador do visitante.
- **FR-003**: O sistema MUST apresentar o valor da data/hora do servidor em cor vermelha, de modo que seja visualmente identificável como vermelho.
- **FR-004**: O sistema MUST restringir a cor vermelha ao valor da data/hora; o rótulo "Data/hora do servidor:" e o restante da página mantêm a cor padrão.
- **FR-005**: O sistema MUST definir o valor exibido uma única vez por carregamento da página, sem atualização automática enquanto a página permanece aberta.
- **FR-006**: O sistema MUST exibir, a cada novo carregamento da página, a data/hora do servidor correspondente ao instante daquele carregamento.
- **FR-007**: O sistema MUST manter o elemento que contém a data/hora identificável como "server-time", preservando o comportamento atual da página inicial (resposta bem-sucedida e valor visível).
- **FR-008**: O sistema MUST NOT exibir texto inválido ou técnico (ex.: "Invalid Date") no lugar da data/hora.

### Key Entities *(include if feature involves data)*

- **Data/hora do servidor**: instante em que a página inicial é gerada pelo servidor, apresentado ao visitante como texto formatado em pt-BR no fuso America/Sao_Paulo. Não é armazenado nem alterado pelo visitante.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos carregamentos da página inicial, a data/hora exibida segue o padrão pt-BR `dd/mm/aaaa hh:mm:ss` (24 horas).
- **SC-002**: Para instantes de referência conhecidos (incluindo virada de dia/mês/ano e períodos com e sem horário de verão), o valor exibido coincide com o horário de America/Sao_Paulo em 100% dos casos testados, qualquer que seja o fuso do ambiente de execução.
- **SC-003**: O valor da data/hora aparece em vermelho em 100% dos carregamentos, e nenhum outro texto da página fica vermelho por causa desta funcionalidade.
- **SC-004**: Com a página aberta por 10 segundos ou mais, o valor exibido permanece inalterado em 100% das observações.
- **SC-005**: Um visitante lê a data/hora do servidor corretamente (dia, mês, ano e hora de Brasília) na primeira tentativa, sem precisar converter fuso ou formato.

## Assumptions

- Escopo: somente a página inicial atual, que já exibe a data/hora do servidor; não há outras páginas nem novos campos.
- Decisões ratificadas pelo humano: formato pt-BR, cor vermelha, sem atualização automática (valor exibido uma vez por carregamento) e fuso America/Sao_Paulo.
- "Formato pt-BR" é interpretado como o padrão brasileiro de data e hora: `dd/mm/aaaa hh:mm:ss`, com hora em 24 horas, sem indicação de fuso no texto. Caso se deseje outro nível de detalhe (por exemplo, sem segundos ou com nome do mês), isso deve ser tratado em uma nova rodada de esclarecimento.
- "Vermelha" é interpretado como um vermelho legível sobre o fundo claro padrão da página; o tom exato (código de cor) é definido na etapa de planejamento e não é critério de aceite desta especificação além de ser claramente identificável como vermelho.
- "Data/hora do servidor" refere-se ao instante em que o servidor gera a página, não ao relógio do navegador do visitante.
- Em caso de falha ao formatar a data/hora (situação não esperada), considera-se aceitável não exibir valor algum ou exibir mensagem amigável, desde que nunca apareça texto técnico ou inválido; o tratamento detalhado fica para o planejamento.
- Acessibilidade: o contraste do vermelho com o fundo padrão deve ser suficiente para leitura; requisitos formais de acessibilidade (ex.: razão de contraste) não foram solicitados e ficam fora do escopo.
- Dependência: o ambiente de execução precisa conhecer as regras do fuso America/Sao_Paulo; a verificação dessa disponibilidade é responsabilidade do planejamento.
