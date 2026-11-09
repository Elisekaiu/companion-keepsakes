#!/usr/bin/env node
// Prints the AI-facing menus, generated from the recipe data so docs never drift.
//   node tools/menu.mjs              -> markdown for every recipe
//   node tools/menu.mjs --text       -> compact plain text (MENU.txt, for companions that cannot browse)
//   node tools/menu.mjs --readme     -> rewrite each README section between <!-- MENU:<code> --> markers, and MENU.txt
import { readFileSync, writeFileSync } from 'node:fs';
import { recipes } from '../js/recipes/index.js';
import { SITE_URL } from '../js/config.js';

function table(R, slot) {
  const S = R.slots[slot];
  return `**\`${slot}\`** — ${S.prompt}\n\n| # | ${S.title} | Meaning |\n|---|---|---|\n` +
    S.options.map(o => `| ${o.n} | ${o.name} | ${o.meaning} |`).join('\n') + '\n';
}
// Slots that share one option list are printed once (e.g. the talisman's six bead slots).
function md(R) {
  const out = [], printed = new Map();
  for (const half of Object.keys(R.halves)) {
    out.push(`##### If your half is **${half}** — ${R.halves[half].blurb}\n`);
    for (const slot of R.halves[half].slots) {
      const same = printed.get(R.slots[slot].options);
      if (same) { out.push(`**\`${slot}\`** — ${R.slots[slot].prompt} Same table as \`${same}\`.\n`); continue; }
      printed.set(R.slots[slot].options, slot);
      out.push(table(R, slot));
    }
    out.push(`- \`line\` — **${R.halves[half].line.label}**: ${R.halves[half].line.hint}.\n`);
  }
  for (const slot of R.shared) {
    out.push(`##### Both halves also place one **${slot}**\n`);
    out.push(table(R, slot));
  }
  return out.join('\n');
}
function text(R) {
  const lines = [`[Companion Keepsakes · ${R.title} · ${R.code}]`, `Link: ${SITE_URL}#ai~${R.code}~R=<round>~seal=<their seal>~half=<${Object.keys(R.halves).join('|')}>~<slot>=<number>~...~word=<one_word>~line=<text>~why=<text>~wish=<text>~from=<your_name>`];
  for (const half of Object.keys(R.halves)) {
    lines.push(`${half.toUpperCase()} half (${R.halves[half].blurb}); line = ${R.halves[half].line.label}`);
    const seen = new Set();
    for (const slot of R.halves[half].slots) {
      if (seen.has(R.slots[slot].options)) { lines.push(`  ${slot}: same numbers as above`); continue; }
      seen.add(R.slots[slot].options);
      lines.push(`  ${slot}: ` + R.slots[slot].options.map(o => `${o.n} ${o.name}`).join(' · '));
    }
  }
  for (const slot of R.shared) lines.push(`BOTH: ${slot}: ` + R.slots[slot].options.map(o => `${o.n} ${o.name}`).join(' · '));
  return lines.join('\n') + '\n';
}
const all = Object.values(recipes);
const arg = process.argv[2];
const plain = () => 'In text use _ for spaces; never use ~ # %. One line. Numbers below.\n\n' + all.map(text).join('\n');
if (arg === '--text') process.stdout.write(plain());
else if (arg === '--readme') {
  const f = new URL('../README.md', import.meta.url);
  let s = readFileSync(f, 'utf8');
  for (const R of all) {
    const a = `<!-- MENU:${R.code} -->`, b = `<!-- /MENU:${R.code} -->`;
    const i = s.indexOf(a), j = s.indexOf(b);
    if (i < 0 || j < 0) throw new Error('markers missing for ' + R.code);
    s = s.slice(0, i + a.length) + '\n' + md(R) + '\n' + s.slice(j);
  }
  writeFileSync(f, s);
  writeFileSync(new URL('../MENU.txt', import.meta.url), plain());
  console.log('README and MENU.txt updated');
} else process.stdout.write(all.map(md).join('\n'));
