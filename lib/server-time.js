const FALLBACK = 'indisponível';

const formatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function formatServerTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return FALLBACK;
  }
  try {
    const p = Object.fromEntries(
      formatter.formatToParts(date).map(({ type, value }) => [type, value])
    );
    return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}:${p.second}`;
  } catch {
    return FALLBACK;
  }
}

module.exports = { formatServerTime };
