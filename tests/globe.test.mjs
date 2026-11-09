import test from 'node:test';
import assert from 'node:assert/strict';
import { newRound, sealHuman, readAiCode, acceptAi, mergeRound, invitation, revealCard } from '../js/engine/round.js';
import { toKeepsake, fromKeepsake, validate } from '../js/engine/keepsake.js';

const draft = { picks: { place: 4, hour: 5, weather: 1, object: 1 }, word: 'Last', line: 'We missed the last train and walked.', why: 'Because the walk was the best part.', wish: 'Again, any time.' };

test('globe: the moment is shared, the choices are not', () => {
  const r = sealHuman(newRound({ recipe: 'globe1', theme: 'the night we missed the last train', names: { human: 'Mira', ai: 'Orin' } }), draft);
  const inv = invitation(r, { site: 'https://x/' });
  assert.match(inv, /The moment: the night we missed the last train/);
  assert.match(inv, /Your half: The keepsake/);
  assert.match(inv, /plus one small thing placed inside/);
  for (const leak of ['platform', 'Late at night', 'First snow', 'umbrella', 'walked']) assert.ok(!inv.toLowerCase().includes(leak.toLowerCase()), leak);
});

test('globe: hand-written keepsake half merges; objects pair; resonances', () => {
  const r = sealHuman(newRound({ recipe: 'globe1', names: { human: 'Mira', ai: 'Orin' } }), draft);
  const link = `https://x/#ai~globe1~R=${r.id}~seal=${r.human.fp}~half=keepsake~base=1~glass=1~finish=3~object=1~word=Train~line=Keep_walking_with_me~why=Walnut,_like_the_station_benches~wish=Thank_you_for_missing_it~from=Orin`;
  const done = acceptAi(r, readAiCode(link));
  assert.deepEqual(done.ai.chance, []);
  const spec = mergeRound(done);
  assert.equal(spec.title, 'Last Train');
  assert.equal(spec.echo, true);
  assert.equal(spec.picks.base.by, 'ai');
  assert.equal(spec.picks.place.by, 'human');
  assert.equal(spec.palette.dark, true);
  assert.ok(spec.resonances.some(x => x.id === 'echo'));
  assert.deepEqual(spec.ledger.filter(x => x.slot === 'object').map(x => x.pick), ['object-human', 'object-ai']);
  const doc = toKeepsake({ ...done, openedAt: new Date().toISOString() });
  assert.deepEqual(validate(doc), []);
  assert.deepEqual(mergeRound(fromKeepsake(doc)), spec);
  assert.match(revealCard(done), /Placed inside: A sealed letter|Placed inside: An open umbrella/);
});

test('globe: README example link is valid and complete', async () => {
  const { readFileSync } = await import('node:fs');
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const ex = readme.match(/https:\/\/\S+#ai~globe1~R=4PRM[^\s`]+/)[0];
  const r = sealHuman(newRound({ recipe: 'globe1', id: '4PRM', names: { human: 'Mira', ai: 'Orin' } }), draft);
  const done = acceptAi({ ...r, human: { ...r.human, fp: 'T7WQ3K' } }, readAiCode(ex));
  assert.deepEqual(done.ai.chance, []);
  assert.equal(done.ai.sealMatch, true);
  assert.equal(done.ai.half, 'keepsake');
});
