// Lê a versão e a entrada mais recente do changelog do www/index.html
// e escreve as notas da Release (notas.md) + a versão (para o GitHub Actions).
const fs = require('fs');
const html = fs.readFileSync('www/index.html', 'utf8');
const ver = (html.match(/const APP_VER='([0-9.]+)'/) || [])[1];
if (!ver) { console.error('APP_VER não encontrado em www/index.html'); process.exit(1); }
let notes = `Versão ${ver}`;
const start = html.indexOf('const CHANGELOG=');
if (start >= 0) {
  const from = html.indexOf('[', start);
  let depth = 0, end = -1;
  for (let i = from; i < html.length; i++) {
    const c = html[i];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  try {
    const log = Function('return ' + html.slice(from, end + 1))();
    const e = log.find(x => x.v === ver) || log[0];
    if (e) notes = `**${e.t}**\n` + e.items.map(i => `- ${i}`).join('\n');
  } catch (err) { console.error('Changelog não lido:', err.message); }
}
fs.writeFileSync('notas.md', notes + '\n');
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `versao=${ver}\n`);
console.log('Versão', ver); console.log(notes);
