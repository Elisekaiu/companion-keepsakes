import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readAiCode, roundFromGift, newRound, sealSolo, drawAll, mergeRound, status, revealCard } from '../js/engine/round.js';
import { toLink, fromLink, toKeepsake, validate } from '../js/engine/keepsake.js';
import { recipes } from '../js/recipes/index.js';
import { loc } from '../js/recipes/loc.js';

const readme = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const giftLinks = text => [...text.matchAll(/https:\/\/\S+#(ai~\w+~half=all~[^\s`]+)/g)].map(m => m[1]);

for (const file of ['README.md', 'README.en.md']) {
  test(`gift: every example in ${file} is complete, and reads back the same every time`, () => {
    const links = giftLinks(readme(file));
    assert.deepEqual(links.map(l => l.split('~')[1]).sort(), ['globe1', 'planet1', 'talisman1']);
    for (const code of links) {
      const parsed = readAiCode(code);
      assert.ok(parsed.ok && parsed.gift, code);
      const r = roundFromGift(parsed, { human: 'Mira', ai: 'Companion' });
      const R = recipes[r.recipe];
      assert.equal(r.mode, 'gift'); assert.equal(r.order, 'gift');
      assert.equal(status(r), 'ready');
      assert.deepEqual(r.human.chance, [], 'nothing left to chance in ' + r.recipe);
      assert.deepEqual(r.ai.chance, [], 'nothing left to chance in ' + r.recipe);
      assert.ok(r.ai.warnings.length === 0);
      assert.notEqual(r.names.ai, 'Companion', 'from= names the maker');
      const spec = mergeRound(r);
      assert.equal(spec.title, r.human.word);
      for (const half of Object.keys(R.halves)) assert.ok(spec.lines.find(l => l.half === half)?.text, 'line for ' + half);
      for (const res of spec.resonances) assert.ok(!res.text.includes(r.names.ai), 'a gift tells its meetings without names');
      // the same code always gives the same thing: never re-chosen
      const again = roundFromGift(readAiCode(code), { human: 'Someone else' });
      assert.equal(again.id, r.id);
      assert.deepEqual(mergeRound(again).ledger, spec.ledger);
      // a kept gift reopens as a gift
      const opened = { ...r, openedAt: new Date().toISOString() };
      const back = fromLink(toLink(opened));
      assert.equal(back.mode, 'gift'); assert.equal(back.order, 'gift');
      assert.deepEqual(mergeRound(back).ledger, spec.ledger);
      const doc = toKeepsake(opened);
      assert.equal(doc.mode, 'gift');
      assert.deepEqual(validate(doc), []);
      assert.ok(revealCard(opened, 'zh').includes(spec.title));
    }
  });
}

test('gift: the planet second wonder is read from wonder2, and line keys may be named', () => {
  const p = readAiCode('ai~planet1~half=all~sky=1~land=1~water=1~growth=1~dwelling=1~moon=1~air=1~visitor=1~wonder=2~wonder2=8~name=x~rule=Only_one_rule~secret=deep_down');
  const r = roundFromGift(p, {});
  assert.equal(recipes.planet1.option('wonder', r.human.picks.wonder).id, 'spire');
  assert.equal(recipes.planet1.option('wonder', r.ai.picks.wonder).id, 'door');
  const spec = mergeRound(r);
  assert.equal(spec.lines.find(l => l.key === 'rule').text, 'Only one rule');
  assert.equal(spec.lines.find(l => l.key === 'secret').text, 'deep down');
});

test('gift: missing picks are left to the stars and said so', () => {
  const r = roundFromGift(readAiCode('ai~globe1~half=all~place=2~name=Walk'), {});
  assert.ok(r.ai.warnings[0].startsWith('Left to the stars'));
  assert.ok(r.human.chance.includes('hour'));
  assert.ok(r.ai.chance.includes('base'));
  assert.ok(mergeRound(r).title === 'Walk');
});

for (const code of Object.keys(recipes)) {
  test(`lucky ${code}: drawn first, kept-as-drawn parts are marked, changed parts are not`, () => {
    const R = recipes[code];
    const d = drawAll(code, 'SEED1');
    assert.deepEqual(Object.keys(d.picks).sort(), [...R.soloOrder].sort());
    assert.deepEqual(drawAll(code, 'SEED1').picks, d.picks, 'a draw is replayable from its seed');
    const changed = R.soloOrder[0];
    const draft = { picks: { ...d.picks, [changed]: 1 }, drawn: d.drawn.filter(k => k !== changed), lines: {}, name: '' };
    const r = sealSolo(newRound({ recipe: code, mode: 'solo' }), draft);
    assert.equal(r.lucky, true);
    const spec = mergeRound(r);
    const marked = [...spec.chance.human.map(s => 'h:' + s), ...spec.chance.ai.map(s => 'a:' + s)];
    assert.equal(marked.length, R.soloOrder.length - 1, 'every part but the changed one was drawn');
    const slot = changed.replace(/#\d$/, '');
    const half = R.halfOfSlot(slot);
    assert.ok(!(half === r.human.half ? spec.chance.human : spec.chance.ai).includes(slot) || R.shared.includes(slot));
    // the drawn marks survive a keepsake link
    const back = fromLink(toLink({ ...r, openedAt: new Date().toISOString() }));
    assert.deepEqual(mergeRound(back).chance, spec.chance);
  });
}

for (const [code, R] of Object.entries(recipes)) {
  test(`${code}: option numbers are permanent (exactly 1..N, none reused) and every option has its Chinese name`, () => {
    const seen = new Set();
    for (const [slot, S] of Object.entries(R.slots)) {
      if (seen.has(S.options)) continue; seen.add(S.options);
      // (a menu may be shown grouped, e.g. the talisman beads, so only the set of numbers is fixed)
      assert.deepEqual(S.options.map(o => o.n).sort((x, y) => x - y), S.options.map((_, i) => i + 1), `${slot}: numbers 1..N`);
      assert.equal(new Set(S.options.map(o => o.id)).size, S.options.length, `${slot}: ids are unique`);
      for (const o of S.options) assert.notEqual(loc(R, 'zh').opt(slot, o).name, o.name, `${slot}.${o.id} has a Chinese name`);
    }
  });
}

test('older links still read the same picks after options were appended', () => {
  // numbers from before this version must keep meaning what they meant
  const P = recipes.planet1, G = recipes.globe1;
  assert.equal(P.option('wonder', 8).id, 'door');
  assert.equal(P.option('land', 8).id, 'cloud');
  assert.equal(P.option('sky', 7).id, 'eclipse');
  assert.equal(G.option('object', 11).id, 'record');
  assert.equal(G.option('place', 10).id, 'window');
  assert.equal(G.option('hour', 5).id, 'night');
});

test('solo rounds without a lucky draw record nothing as chance', () => {
  const r = sealSolo(newRound({ recipe: 'globe1', mode: 'solo' }), { picks: drawAll('globe1', 'x').picks, lines: {} });
  assert.equal(r.lucky, undefined);
  assert.deepEqual(r.human.chance, []); assert.deepEqual(r.ai.chance, []);
});
