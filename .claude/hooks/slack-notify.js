#!/usr/bin/env node
// Fábrica de Software Agêntica — hook SubagentStop do Claude Code.
// Cada subagente da fábrica, ao terminar, registra no Slack: papel, feature/branch,
// STATUS, PARECER e PRÓXIMO (lidos do bloco de status da última mensagem).
// Webhook: variável SLACK_WEBHOOK_URL (definida em .claude/settings.local.json → "env").
// Nunca bloqueia o fluxo: qualquer falha é só registrada e o hook sai com 0.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LABELS = {
  'fabrica-analista-requisitos': ':memo: Analista de Requisitos (E1)',
  'fabrica-arquiteto': ':building_construction: Arquiteto (E2)',
  'fabrica-criador-tarefas': ':clipboard: Criador de Tarefas (E3)',
  'fabrica-desenvolvedor': ':hammer_and_wrench: Desenvolvedor (E4)',
  'fabrica-revisor-codigo': ':mag: Revisor de Código (E5)',
  'fabrica-qa': ':test_tube: QA (E6)',
};
const ICON = { DONE: ':white_check_mark:', BLOCKED: ':no_entry:', NEEDS_CLARIFICATION: ':question:', HUMAN_REVIEW_REQUIRED: ':raising_hand:' };

function field(text, name) {
  const m = text.match(new RegExp('^\\s*[*`]*' + name + '[*`]*\\s*:\\s*(.+)$', 'mi'));
  return m ? m[1].replace(/[*`]/g, '').trim() : null;
}

function log(root, line) {
  try { fs.appendFileSync(path.join(root, '.claude', 'fabrica-slack.log'), `${new Date().toISOString()} ${line}\n`); } catch {}
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', async () => {
  let input = {};
  try { input = JSON.parse(raw); } catch {}
  const agent = input.agent_type || 'subagente';
  if (!agent.startsWith('fabrica-')) process.exit(0);

  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const last = String(input.last_assistant_message || '');
  const status = field(last, 'STATUS') || 'sem bloco de status';
  const parecer = field(last, 'PARECER');
  const proximo = field(last, 'PRÓXIMO') || field(last, 'PROXIMO');
  const bloqueios = field(last, 'BLOQUEIOS');
  let branch = '?';
  try { branch = execSync('git branch --show-current', { cwd: root, encoding: 'utf8' }).trim(); } catch {}

  const statusKey = status.split(/[\s|]/)[0].toUpperCase();
  const lines = [
    `${ICON[statusKey] || ':information_source:'} *${LABELS[agent] || agent}* finalizou a tarefa`,
    `*Feature/branch:* \`${branch}\``,
    `*Status:* ${status}`,
  ];
  if (parecer) lines.push(`*Parecer:* ${parecer}`);
  if (bloqueios && !/^nenhum/i.test(bloqueios)) lines.push(`*Bloqueios:* ${bloqueios}`);
  if (proximo) lines.push(`*Próximo:* ${proximo}`);
  const text = lines.join('\n');

  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    log(root, `[sem SLACK_WEBHOOK_URL] ${text.replace(/\n/g, ' | ')}`);
    process.stderr.write('Fábrica: SLACK_WEBHOOK_URL não definida; registro gravado em .claude/fabrica-slack.log\n');
    process.exit(0);
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(8000),
    });
    log(root, `[slack ${res.status}] ${agent} ${status}`);
  } catch (e) {
    log(root, `[erro slack] ${agent} ${status}: ${e.message}`);
  }
  process.exit(0);
});
