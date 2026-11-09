#!/usr/bin/env node
// Prints the AI-facing menu for a recipe, generated from the recipe data so docs never drift.
//   node tools/menu.mjs              -> markdown tables (used in the README)
//   node tools/menu.mjs --text       -> compact plain text (MENU.txt, for companions that cannot browse)
//   node tools/menu.mjs --readme     -> rewrite the README section between the MENU markers
import { readFileSync, writeFileSync } from 'node:fs';
import * as planet from '../js/recipes/planet.js';
import { SITE_URL } from '../js/config.js';

const R = planet;
function md() {
  const out = [];
  for (const half of ['sky', 'ground']) {
    out.push(`#### If your half is **${half}** — ${R.halves[half].blurb}\n`);
    for (const slot of R.halves[half].slots) out.push(table(slot));
    out.push(`- \`line\` — **${R.halves[half].line.label}**: ${R.halves[half].line.hint}.\n`);
  }
  out.push(`#### Both halves also place one **wonder**\n`);
  out.push(table('wonder'));
  out.push('If both of you pick the same wonder, it stands twice and the reveal says you chose it without knowing.\n');
  return out.join('\n');
}
function table(slot) {
  const S = R.slots[slot];
  return `**\`${slot}\`** — ${S.prompt}\n\n| # | ${S.title} | Meaning |\n|---|---|---|\n` +
    S.options.map(o => `| ${o.n} | ${o.name} | ${o.meaning} |`).join('\n') + '\n';
}
function text() {
  const lines = [`[Companion Keepsakes · ${R.title} · ${R.code}]`, `Link: ${SITE_URL}#ai~${R.code}~R=<round>~seal=<their seal>~half=<sky|ground>~<slot>=<number>~...~wonder=<number>~word=<one_word>~line=<text>~why=<text>~wish=<text>~from=<your_name>`, 'In text use _ for spaces; never use ~ # %. One line. Numbers below.', ''];
  for (const half of ['sky', 'ground']) {
    lines.push(`${half.toUpperCase()} half (${R.halves[half].blurb}); line = ${R.halves[half].line.label}`);
    for (const slot of R.halves[half].slots) lines.push(`  ${slot}: ` + R.slots[slot].options.map(o => `${o.n} ${o.name}`).join(' · '));
  }
  lines.push('BOTH: wonder: ' + R.slots.wonder.options.map(o => `${o.n} ${o.name}`).join(' · '));
  return lines.join('\n') + '\n';
}
const arg = process.argv[2];
if (arg === '--text') process.stdout.write(text());
else if (arg === '--readme') {
  const f = new URL('../README.md', import.meta.url);
  const s = readFileSync(f, 'utf8');
  const a = '<!-- MENU:planet1 -->', b = '<!-- /MENU:planet1 -->';
  const i = s.indexOf(a), j = s.indexOf(b);
  if (i < 0 || j < 0) throw new Error('markers missing');
  writeFileSync(f, s.slice(0, i + a.length) + '\n' + md() + '\n' + s.slice(j));
  writeFileSync(new URL('../MENU.txt', import.meta.url), text());
  console.log('README and MENU.txt updated');
} else process.stdout.write(md());
