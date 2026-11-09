import test from 'node:test';
import assert from 'node:assert/strict';
import { newRound, sealHuman, readAiCode, acceptAi, roundFromAi, mergeRound, invitation, revealCard, buildAiCode, status } from '../js/engine/round.js';
import { toKeepsake, fromKeepsake, validate } from '../js/engine/keepsake.js';

const draft = { picks: { silk: 2, motif: 2, cord: 1, bead1: 1, bead3: 4, bead5: 3 }, word: 'Quiet', line: 'Come home safe', why: 'Soft things for you to hold.', wish: 'I think of you on trains.' };
const sealed = () => sealHuman(newRound({ recipe: 'talisman1', names: { human: 'Mira', ai: 'Orin' } }), draft);

test('talisman: invitation is blind and names the metal half', () => {
  const r = sealed();
  const inv = invitation(r, { site: 'https://x/' });
  assert.match(inv, /Two-Person Talisman/);
  assert.match(inv, /Your half: Metal/);
  assert.match(inv, /#ai~talisman1~R=/);
  for (const leak of ['Blush', 'Crescent', 'Red cord', 'pearl', 'Quiet', 'trains']) assert.ok(!inv.includes(leak), leak);
});

test('talisman: hand-written metal half merges into an alternating strand', () => {
  const r = sealed();
  const link = `https://x/#ai~talisman1~R=${r.id}~seal=${r.human.fp}~half=metal~metal=1~charm=moon~bead2=4~bead4=2~bead6=1~word=Courage~line=I_will_keep_finding_you~why=Silver_because_it_is_honest~wish=Every_night~from=Orin`;
  const done = acceptAi(r, readAiCode(link));
  assert.equal(status(done), 'ready');
  assert.deepEqual(done.ai.chance, []);
  const spec = mergeRound(done);
  assert.equal(spec.title, 'Quiet Courage');
  assert.deepEqual(spec.strand.map(b => b.by), ['human', 'ai', 'human', 'ai', 'human', 'ai']);
  assert.deepEqual(spec.strand.map(b => b.id), ['pearl', 'moonstone', 'moonstone', 'clear', 'rose', 'pearl']);
  assert.equal(spec.echo, true);
  const ids = spec.resonances.map(x => x.id);
  for (const want of ['echo-pearl', 'echo-moonstone', 'same-moon', 'moonstone-moon', 'red-thread']) assert.ok(ids.includes(want), want);
  assert.ok(spec.resonances.find(x => x.id === 'same-moon').text.includes('Mira stitched it in silk, Orin cast it'));
  assert.equal(spec.ledger.filter(x => x.by === 'ai').length, 5);
  const doc = toKeepsake({ ...done, openedAt: new Date().toISOString() });
  assert.deepEqual(validate(doc), []);
  assert.equal(doc.contributions.ai.halfTitle, 'Metal');
  assert.equal(doc.contributions.human.picks.bead3.title, 'Bead 3');
  assert.deepEqual(mergeRound(fromKeepsake(doc)), spec);
  assert.match(revealCard(done), /Orin placed \(sealed/);
});

test('talisman: AI may seal the silk half first; the human then gets metal', () => {
  const code = buildAiCode({ recipe: 'talisman1', half: 'silk', picks: { silk: 4, motif: 6, cord: 2, bead1: 7, bead3: 7, bead5: 12 }, word: 'North', from: 'Orin' });
  const r = roundFromAi(readAiCode(code), { human: 'Mira' });
  assert.equal(r.humanHalf, 'metal');
  const r2 = sealHuman(r, { picks: { metal: 2, charm: 2, bead2: 7, bead4: 5, bead6: 11 }, word: 'Star' });
  const spec = mergeRound(r2);
  assert.equal(spec.title, 'North Star');
  assert.equal(spec.palette.dark, true);
  assert.ok(spec.resonances.some(x => x.id === 'same-star'));
});

test('talisman: README example link is valid and complete', async () => {
  const { readFileSync } = await import('node:fs');
  const readme = readFileSync(new URL('../README.en.md', import.meta.url), 'utf8');
  const ex = readme.match(/https:\/\/\S+#ai~talisman1~R=7KQD[^\s`]+/)[0];
  const r = sealHuman(newRound({ recipe: 'talisman1', id: '7KQD', names: { human: 'Mira', ai: 'Orin' } }), draft);
  const done = acceptAi({ ...r, human: { ...r.human, fp: 'M4XP2T' } }, readAiCode(ex));
  assert.deepEqual(done.ai.chance, []);
  assert.equal(done.ai.sealMatch, true);
  assert.equal(done.ai.half, 'metal');
});
