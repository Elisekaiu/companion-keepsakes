import test from 'node:test';
import assert from 'node:assert/strict';
import { newRound, sealSolo, status, mergeRound, invitation, revealCard } from '../js/engine/round.js';
import { toLink, fromLink, toKeepsake, fromKeepsake, validate } from '../js/engine/keepsake.js';
import { recipes } from '../js/recipes/index.js';
import { loc } from '../js/recipes/loc.js';

const soloPicks = {
  planet1: { sky: 6, land: 6, water: 3, growth: 5, dwelling: 2, moon: 2, air: 4, visitor: 1, wonder: 4, 'wonder#2': 4 },
  talisman1: { metal: 2, silk: 3, motif: 2, cord: 1, bead1: 1, bead2: 4, bead3: 13, bead4: 4, bead5: 3, bead6: 1, charm: 1 },
  globe1: { place: 4, hour: 5, weather: 1, base: 1, glass: 1, finish: 3, object: 1, 'object#2': 2 }
};

for (const code of Object.keys(soloPicks)) {
  test(`solo ${code}: one person makes all of it, and it keeps`, () => {
    const R = recipes[code];
    const r = sealSolo(newRound({ recipe: code, mode: 'solo', names: { human: '小林' } }), {
      picks: soloPicks[code], name: '灯火山谷', lines: Object.fromEntries(Object.keys(R.halves).map(h => [h, 'a line for ' + h])), why: '给自己', wish: '慢慢来'
    });
    assert.equal(status(r), 'ready');
    assert.equal(r.order, 'solo');
    const spec = mergeRound(r);
    assert.equal(spec.title, '灯火山谷');
    for (const res of spec.resonances) {
      assert.ok(!res.text.includes('小林') && !res.zh.includes('小林'), 'solo meetings carry no names: ' + res.zh);
      assert.ok(res.zh && res.zh.length > 3);
    }
    const opened = { ...r, openedAt: new Date().toISOString(), plaque: { name: '那年冬天', date: '二〇二四年冬' } };
    const back = fromLink(toLink(opened, 'https://x/'));
    assert.equal(back.mode, 'solo');
    assert.deepEqual(back.plaque, { name: '那年冬天', date: '二〇二四年冬' });
    assert.deepEqual(mergeRound(back), spec);
    const doc = toKeepsake(opened);
    assert.deepEqual(validate(doc), []);
    assert.equal(doc.mode, 'solo');
    assert.equal(fromKeepsake(doc).plaque.name, '那年冬天');
  });
}

test('solo: a missing pick is refused (nothing left to the stars when you make it yourself)', () => {
  assert.throws(() => sealSolo(newRound({ recipe: 'globe1', mode: 'solo' }), { picks: { place: 1 } }), /Still to choose/);
});

test('every option has Chinese, and the Chinese invitation and card read', () => {
  for (const R of Object.values(recipes)) {
    const L = loc(R, 'zh');
    for (const [slot, S] of Object.entries(R.slots)) for (const o of S.options) {
      const z = L.opt(slot, o);
      assert.ok(z.name !== o.name || /^[A-Z]/.test(o.name) === false, `${R.code}.${slot}.${o.id} has no Chinese`);
      assert.match(z.name + z.meaning, /[一-鿿]/, `${R.code}.${slot}.${o.id}`);
    }
  }
});

test('Chinese README: the AI-goes-first example opens a round with nothing left to chance', async () => {
  const { readFileSync } = await import('node:fs');
  const { readAiCode, roundFromAi } = await import('../js/engine/round.js');
  const readme = readFileSync(new URL('../README.zh.md', import.meta.url), 'utf8');
  const ex = readme.match(/https:\/\/\S+#ai~planet1~half=sky[^\s`]+/)[0];
  const r = roundFromAi(readAiCode(ex), { human: '小林' });
  assert.equal(r.order, 'ai-first');
  assert.equal(r.humanHalf, 'ground');
  assert.deepEqual(r.ai.chance, []);
  assert.equal(r.ai.name, '小澄');
  assert.equal(r.ai.line, '每个生日，雨都会往上落');
});

test('a companion going first can name the moment of a snow globe', async () => {
  const { readAiCode, roundFromAi } = await import('../js/engine/round.js');
  const r = roundFromAi(readAiCode('ai~globe1~half=keepsake~base=1~glass=1~finish=3~object=2~moment=那天我们错过了末班车~from=小澄'), {});
  assert.equal(r.theme, '那天我们错过了末班车');
  assert.equal(r.humanHalf, 'moment');
});
