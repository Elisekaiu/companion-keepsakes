import test from 'node:test';
import assert from 'node:assert/strict';
import { newRound, sealHuman, readAiCode, acceptAi, roundFromAi, mergeRound, invitation, revealCard, buildAiCode, status } from '../js/engine/round.js';
import { toLink, fromLink, toKeepsake, fromKeepsake, validate } from '../js/engine/keepsake.js';
import { parseTilde } from '../js/engine/codec.js';

const SITE = 'https://example.github.io/companion-keepsakes/';
const humanDraft = { picks: { land: 6, water: 3, growth: 5, dwelling: 2, wonder: 4 }, word: 'Lantern', line: 'Under the lighthouse: the first thing you ever said to me.', why: 'I wanted somewhere that glows back.', wish: 'Stay a while.' };

function sealed() {
  return sealHuman(newRound({ names: { human: 'Mira', ai: 'Orin' }, theme: 'a place for late nights' }), humanDraft);
}

test('human seal locks and fingerprints', () => {
  const r = sealed();
  assert.equal(status(r), 'waiting-ai');
  assert.match(r.human.fp, /^[2-9A-Z]{6}$/);
  assert.throws(() => sealHuman(r, humanDraft), /already sealed/);
});

test('invitation never leaks human choices', () => {
  const r = sealed();
  const inv = invitation(r, { site: SITE });
  for (const leak of ['Lantern', 'lighthouse', 'glows back', 'Stay a while', 'moss', 'River']) assert.ok(!inv.includes(leak), 'leaked ' + leak);
  assert.ok(inv.includes(r.human.fp) && inv.includes(r.id));
});

test('hand-written AI link is accepted, merged, locked', () => {
  const r = sealed();
  const hand = `${SITE}#ai~planet1~R=${r.id}~seal=${r.human.fp}~half=sky~sky=6~moon=2~air=4~visitor=1~wonder=4~word=Hollow~line=Rain_falls_upward_on_birthdays~why=Because_you_stay_up_late~wish=I_was_here_too~from=Orin`;
  const p = readAiCode(hand);
  assert.ok(p.ok);
  const r2 = acceptAi(r, p);
  assert.equal(status(r2), 'ready');
  assert.equal(r2.ai.sealMatch, true);
  assert.deepEqual(r2.ai.chance, []);
  const spec = mergeRound(r2);
  assert.equal(spec.title, 'Lantern Hollow');
  assert.equal(spec.picks.land.by, 'human');
  assert.equal(spec.picks.sky.by, 'ai');
  assert.equal(spec.echo, true, 'both chose the bridge');
  assert.ok(spec.flags.glowGrowth && spec.flags.glowLand && spec.flags.glowRiver && spec.flags.beam);
  assert.equal(spec.lines.find(l => l.key === 'rule').text, 'Rain falls upward on birthdays');
  // A second, different half for the same round is refused; the identical one is a no-op.
  assert.equal(acceptAi(r2, p), r2);
  const other = readAiCode(hand.replace('sky=6', 'sky=2'));
  assert.throws(() => acceptAi(r2, other), /already sealed/);
});

test('names as well as numbers, percent-encoded links, missing picks left to the stars', () => {
  const r = sealed();
  const enc = SITE + '#' + encodeURIComponent(`ai~planet1~R=${r.id}~seal=${r.human.fp}~sky=aurora~moon=twin_moons~air=fireflies~wonder=door~why=雨天也要发光`);
  const r2 = acceptAi(r, readAiCode(enc));
  assert.equal(r2.ai.picks.sky, 6);
  assert.equal(r2.ai.picks.moon, 2);
  assert.deepEqual(r2.ai.chance, ['visitor']);
  assert.equal(r2.ai.why, '雨天也要发光');
});

test('wrong round is refused', () => {
  const r = sealed();
  assert.throws(() => acceptAi(r, readAiCode(`ai~planet1~R=ZZZZ~sky=1`)), /round ZZZZ/);
});

test('AI-first round: the AI seals before the human chooses', () => {
  const code = buildAiCode({ half: 'sky', picks: { sky: 5, moon: 3, air: 6, visitor: 2, wonder: 1 }, word: 'Quiet', from: 'Orin' });
  const r = roundFromAi(readAiCode(code), { human: 'Mira' });
  assert.equal(status(r), 'waiting-human');
  assert.equal(r.humanHalf, 'ground');
  const r2 = sealHuman(r, humanDraft);
  assert.equal(status(r2), 'ready');
  assert.equal(mergeRound(r2).title, 'Quiet Lantern');
});

test('keepsake link and document round-trip', () => {
  const r = sealed();
  const code = buildAiCode({ round: r.id, seal: r.human.fp, half: 'sky', picks: { sky: 2, moon: 1, air: 1, visitor: 5, wonder: 7 }, word: 'Morning', why: 'Light, plain.', from: 'Orin' });
  const done = { ...acceptAi(r, readAiCode(code)), openedAt: new Date().toISOString(), keptAt: new Date().toISOString() };
  const back = fromLink(toLink(done, SITE));
  assert.deepEqual(mergeRound(back), mergeRound(done));
  const doc = toKeepsake(done);
  assert.deepEqual(validate(doc), []);
  assert.deepEqual(mergeRound(fromKeepsake(JSON.stringify(doc))), mergeRound(done));
  assert.equal(doc.contributions.ai.picks.visitor.name, 'A flock of birds');
  assert.equal(doc.provenance.sealMatches, true);
  const card = revealCard(done);
  assert.ok(card.includes('Orin placed') && card.includes('Clear noon'));
});

test('parseTilde: first value wins, unknown text survives', () => {
  const t = parseTilde('<https://x/#ai~planet1~sky=1~sky=5~note=hi>');
  assert.equal(t.fields.sky, '1');
  assert.equal(t.fields.note, 'hi');
});

test('README example link is valid and complete (protocol docs never drift)', async () => {
  const { readFileSync } = await import('node:fs');
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const ex = readme.match(/https:\/\/\S+#ai~planet1~R=88DX[^\s`]+/)[0];
  const r = sealHuman(newRound({ id: '88DX', names: { human: 'Mira', ai: 'Orin' } }), humanDraft);
  const done = acceptAi({ ...r, human: { ...r.human, fp: 'R3HH5X' } }, readAiCode(ex));
  assert.deepEqual(done.ai.chance, []);
  assert.equal(done.ai.sealMatch, true);
  assert.equal(done.ai.line, 'Rain falls upward on birthdays');
  assert.equal(done.ai.why, 'Because you stay up late, and the sky should too');
});

test('markdown-wrapped and chat-mangled links still read', () => {
  const r = sealed();
  const md = `My half is sealed. [Open my half](<https://x.io/#ai~planet1~R=${r.id}~seal=${r.human.fp}~sky=1~moon=1~air=1~visitor=1~wonder=1~word=Dew>)`;
  const m = md.match(/ai~[^\s)>\]"']+/)[0];
  assert.equal(acceptAi(r, readAiCode(m)).ai.word, 'Dew');
});
