#!/usr/bin/env node
// Prints the AI-facing menus, generated from the recipe data so docs never drift.
//   node tools/menu.mjs              -> markdown (English) for every recipe
//   node tools/menu.mjs --readme     -> rewrite menu sections in README.md / README.en.md (English)
//                                       and README.zh.md (Chinese); regenerate MENU.txt / MENU.en.txt / MENU.zh.txt
import { readFileSync, writeFileSync } from 'node:fs';
import { recipes } from '../js/recipes/index.js';
import { loc } from '../js/recipes/loc.js';
import { SITE_URL } from '../js/config.js';

const ZH_INTRO = {
  planet1: '这个世界不必遵守现实。',
  talisman1: '一个精致的小挂饰：龙虾扣、一串六颗珠子、挂在丝绸小袋旁边的吊坠。做「丝绸」的一方放第 1、3、5 颗珠子，做「金属」的一方放第 2、4、6 颗，所以珠串上你们是交替的。两边选了同一颗珠子，它会闪一下。少而用心的颜色，往往比六种不同的颜色更好看。如果你知道对方（或你自己）的生日月份，生日石会是很私人的选择。',
  globe1: '一个真实的、或半真半假的瞬间，放在玻璃里。如果对方告诉过你是哪一刻，请像在和对方一起回忆那样去选。每一方还会各放一样小东西进去（`object`）。'
};

function md(R, lang) {
  const L = loc(R, lang), zh = lang === 'zh';
  const out = [];
  if (zh) out.push(`#### ${L.title} \`${R.code}\`\n\n${ZH_INTRO[R.code] || ''}\n`);
  const printed = new Map();
  const table = slot => {
    const S = R.slots[slot];
    const grouped = S.options.some(o => o.group);
    const head = zh ? `| 编号 | ${grouped ? '珠子' : L.slotTitle(slot)} | 含义 |${grouped ? ' 类别 |' : ''} id |\n|---|---|---|${grouped ? '---|' : ''}---|`
      : `| # | ${grouped ? 'Bead' : S.title} | Meaning |${grouped ? ' Kind |' : ''}\n|---|---|---|${grouped ? '---|' : ''}`;
    const rows = S.options.map(o => {
      const z = L.opt(slot, o);
      const kind = grouped ? (o.month ? (zh ? `${L.month(o.month)}生日石` : `${o.month} birthstone`) : (zh ? L.group(o.group) : o.group.toLowerCase())) : null;
      return zh ? `| ${o.n} | ${z.name} | ${z.meaning} |${grouped ? ` ${kind} |` : ''} \`${o.id}\` |` : `| ${o.n} | ${o.name} | ${o.meaning} |${grouped ? ` ${kind} |` : ''}`;
    });
    return `**\`${slot}\`** — ${zh ? L.slotPrompt(slot) : S.prompt}\n\n${head}\n${rows.join('\n')}\n`;
  };
  for (const half of Object.keys(R.halves)) {
    out.push(zh ? `##### 如果你做「${L.halfTitle(half)}」 \`half=${half}\` —— ${L.halfBlurb(half)}\n` : `##### If your half is **${half}** — ${R.halves[half].blurb}\n`);
    for (const slot of R.halves[half].slots) {
      const same = printed.get(R.slots[slot].options);
      if (same) { out.push(`**\`${slot}\`** — ${zh ? L.slotPrompt(slot) + `用和 \`${same}\` 一样的表。` : R.slots[slot].prompt + ` Same table as \`${same}\`.`}\n`); continue; }
      printed.set(R.slots[slot].options, slot);
      out.push(table(slot));
    }
    out.push(zh ? `- \`line\` —— **${L.lineLabel(half)}**：${L.lineHint(half)}。\n` : `- \`line\` — **${R.halves[half].line.label}**: ${R.halves[half].line.hint}.\n`);
  }
  for (const slot of R.shared) {
    out.push(zh ? `##### 两边都要放的：${L.slotTitle(slot)} \`${slot}\`\n` : `##### Both halves also place one **${slot}**\n`);
    out.push(table(slot));
    if (slot === 'wonder') out.push(zh ? '如果你们选了同一件奇物，它会出现两次，打开时也会说你们不约而同地选了它。\n' : 'If both of you pick the same wonder, it stands twice and the reveal says you chose it without knowing.\n');
  }
  return out.join('\n');
}
function text(R, lang) {
  const L = loc(R, lang), zh = lang === 'zh';
  const lines = [`[${zh ? '纪念品工坊' : 'Companion Keepsakes'} · ${L.title} · ${R.code}]`, `${zh ? '链接' : 'Link'}: ${SITE_URL}#ai~${R.code}~half=<${Object.keys(R.halves).join('|')}>~<slot>=<number>~...~word=<...>~line=<...>~why=<...>~wish=<...>~from=<...>`];
  for (const half of Object.keys(R.halves)) {
    lines.push(zh ? `「${L.halfTitle(half)}」half=${half}（${L.halfBlurb(half)}）；line = ${L.lineLabel(half)}` : `${half.toUpperCase()} half (${R.halves[half].blurb}); line = ${R.halves[half].line.label}`);
    const seen = new Set();
    for (const slot of R.halves[half].slots) {
      if (seen.has(R.slots[slot].options)) { lines.push(`  ${slot}: ${zh ? '同上' : 'same numbers as above'}`); continue; }
      seen.add(R.slots[slot].options);
      lines.push(`  ${slot}: ` + R.slots[slot].options.map(o => `${o.n} ${zh ? L.opt(slot, o).name : o.name}`).join(' · '));
    }
  }
  for (const slot of R.shared) lines.push(`${zh ? '两边都放' : 'BOTH'}: ${slot}: ` + R.slots[slot].options.map(o => `${o.n} ${zh ? L.opt(slot, o).name : o.name}`).join(' · '));
  return lines.join('\n') + '\n';
}
const all = Object.values(recipes);
const plain = lang => (lang === 'zh' ? '文字里的空格写成 _；不要用 ~ # %。整段写在一行。选项写编号。\n\n' : 'In text use _ for spaces; never use ~ # %. One line. Numbers below.\n\n') + all.map(R => text(R, lang)).join('\n');
function fill(file, lang) {
  const f = new URL('../' + file, import.meta.url);
  let s = readFileSync(f, 'utf8');
  for (const R of all) {
    const a = `<!-- MENU:${R.code} -->`, b = `<!-- /MENU:${R.code} -->`;
    const i = s.indexOf(a), j = s.indexOf(b);
    if (i < 0 || j < 0) throw new Error(`markers missing for ${R.code} in ${file}`);
    s = s.slice(0, i + a.length) + '\n' + md(R, lang) + '\n' + s.slice(j);
  }
  writeFileSync(f, s);
}
if (process.argv[2] === '--readme') {
  fill('README.zh.md', 'zh'); fill('README.md', 'en'); fill('README.en.md', 'en');
  writeFileSync(new URL('../MENU.zh.txt', import.meta.url), plain('zh'));
  writeFileSync(new URL('../MENU.txt', import.meta.url), plain('en'));
  writeFileSync(new URL('../MENU.en.txt', import.meta.url), plain('en'));
  console.log('README.zh.md, README.md, README.en.md and all MENU files updated');
} else process.stdout.write(all.map(R => md(R, 'en')).join('\n'));
