#!/usr/bin/env node
// Fábrica de Software Agêntica — hook PreToolUse do Claude Code.
// Aplica as permissões de cada papel (o equivalente ao bloco `permission` do opencode).
// Entrada: JSON no stdin (tool_name, tool_input, agent_type, cwd).
// Saída: JSON com permissionDecision "deny" ou "ask"; sem saída = segue o fluxo normal.

const path = require('path');

const GIT_SUB = [
  /\bgit\s+commit\b/, /\bgit\s+push\b/, /\bgit\s+merge\b/, /\bgit\s+rebase\b/,
  /\bgit\s+reset\b/, /\bgit\s+stash\b/, /\bgit\s+switch\s+(-c|--create)\b/,
  /\bgit\s+checkout\s+-b\b/, /(^|[\s;&|("'\/\\])gh(\.exe)?["']?\s/,
];

// Regras por papel. edit: null = pode editar qualquer arquivo.
const ROLES = {
  'fabrica-orquestrador': {
    edit: ['specs/*/state.json', 'specs/*/notes/**'],
    bashDeny: [
      /\bgit\s+push\b.*\s(--force|-f)\b/, /\bgit\s+push\b.*--force-with-lease/,
      /\bgit\s+rebase\b/, /\bgit\s+reset\s+--hard\b/,
      /\bgh(\.exe)?["']?\s+pr\s+merge\b/,
    ],
  },
  'fabrica-analista-requisitos': { edit: ['specs/**'], bashDeny: GIT_SUB },
  'fabrica-arquiteto': { edit: ['specs/**', 'CLAUDE.md', 'AGENTS.md'], bashDeny: GIT_SUB },
  'fabrica-criador-tarefas': { edit: ['specs/*/tasks.md', 'specs/*/notes/**'], bashDeny: GIT_SUB },
  'fabrica-desenvolvedor': { edit: null, bashDeny: GIT_SUB },
  'fabrica-revisor-codigo': { edit: ['specs/*/review-report.md', 'specs/*/notes/**'], bashDeny: GIT_SUB },
  'fabrica-qa': { edit: null, bashDeny: GIT_SUB },
};

const EDIT_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);

function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') { re += '.*'; i++; }
    else if (c === '*') re += '[^/]*';
    else re += c.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$', 'i');
}

function relative(file, root) {
  const norm = (p) => String(p || '').replace(/\\/g, '/').replace(/\/+$/, '');
  const f = norm(file), r = norm(root);
  if (r && f.toLowerCase().startsWith(r.toLowerCase() + '/')) return f.slice(r.length + 1);
  if (!/^([a-z]:)?\//i.test(f)) return f.replace(/^\.\//, '');
  return null; // fora do projeto
}

function decide(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason },
  }));
  process.exit(0);
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};
  const role = input.agent_type || '';

  // Checkpoint 1: chamar o Arquiteto sempre pede confirmação do humano (antes era `ask` no opencode).
  if (tool === 'Agent' || tool === 'Task') {
    const target = ti.subagent_type || '';
    if (target === 'fabrica-arquiteto') {
      decide('ask', 'Fábrica: acionar o Arquiteto exige que o humano tenha aprovado a spec (Checkpoint 1). Confirme.');
    }
    if (role === 'fabrica-orquestrador' && target && !target.startsWith('fabrica-')) {
      decide('deny', `Fábrica: o orquestrador só aciona os subagentes da fábrica (fabrica-*), não "${target}".`);
    }
    process.exit(0);
  }

  const rules = ROLES[role];
  if (!rules) process.exit(0); // sessão comum (fora da fábrica): sem restrições extras

  if (tool === 'Bash') {
    const cmd = String(ti.command || '');
    const hit = rules.bashDeny.find((re) => re.test(cmd));
    if (hit) decide('deny', `Fábrica: o papel ${role} não pode executar este comando (regra ${hit}). Commits, push, PR e branches são do orquestrador.`);
    process.exit(0);
  }

  if (EDIT_TOOLS.has(tool) && rules.edit) {
    const file = ti.file_path || ti.notebook_path || ti.path;
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    const rel = relative(file, root);
    const ok = rel !== null && rules.edit.some((g) => globToRegex(g).test(rel));
    if (!ok) decide('deny', `Fábrica: o papel ${role} só pode editar ${rules.edit.join(', ')}. Arquivo negado: ${rel ?? file}.`);
  }
  process.exit(0);
});
