// Round — one co-creation: human half + AI half -> merge -> reveal -> keepsake.
// Pure functions over plain objects (no DOM, no storage), so Node tests and the browser share them.
//
// Invariants:
//  - a sealed half is never edited or regenerated; a second, different AI half for the same round is refused;
//  - the human's choices never appear in anything sent to the AI before the reveal;
//  - the human seal fingerprint is shown to the AI, and the AI echoes it, so the reveal can show the
//    human half was fixed before the AI chose (light commit/reveal: mystery, not security).

import { parseTilde, buildTilde, readText, writeText, hash53, toCode, randomCode, normCode, canonical, rngFor } from './codec.js';
import { recipes, recipeByCode } from '../recipes/index.js';

export const PROTOCOL = 'ckp/1';

const clip = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return [...s].slice(0, n).join(''); };

export function newRound({ recipe = 'planet1', humanHalf, theme = '', names = {}, id } = {}) {
  const R = recipeByCode(recipe);
  if (!R) throw new Error('unknown recipe ' + recipe);
  return {
    id: id || randomCode(4),
    recipe: R.code,
    humanHalf: humanHalf || R.defaultHumanHalf,
    theme: clip(theme, 140),
    names: { human: clip(names.human || 'You', 24), ai: clip(names.ai || 'Companion', 24) },
    order: 'human-first',
    createdAt: new Date().toISOString(),
    human: null,
    ai: null,
    openedAt: null,
    keptAt: null
  };
}

/** Clean a half's draft into the canonical sealed shape (picks stored as option numbers). */
function cleanHalf(R, half, draft, { fillChance = false, seed = '' } = {}) {
  const picks = {}, chance = [], missing = [];
  for (const slot of R.slotsOf(half)) {
    let opt = R.option(slot, draft.picks?.[slot]);
    if (!opt) {
      if (!fillChance) { missing.push(slot); continue; }
      const list = R.slots[slot].options;
      opt = list[Math.floor(rngFor(seed, half, slot)() * list.length)];
      chance.push(slot);
    }
    picks[slot] = opt.n;
  }
  const T = R.text;
  return {
    half,
    picks,
    chance,
    missing,
    word: clip(draft.word, T.word.max),
    line: clip(draft.line, T.line.max),
    why: clip(draft.why, T.why.max),
    wish: clip(draft.wish, T.wish.max)
  };
}

export function fingerprint(round, sealed) {
  const body = canonical({ R: round.id, c: round.recipe, h: sealed.half, p: sealed.picks, w: sealed.word, l: sealed.line, y: sealed.why, x: sealed.wish, s: sealed.salt });
  return toCode(hash53(body), 6);
}

/** Seal the human half. Returns a new round; throws if already sealed or incomplete. */
export function sealHuman(round, draft) {
  if (round.human) throw new Error('Your half is already sealed. A sealed choice stays as it is.');
  const R = recipeByCode(round.recipe);
  const c = cleanHalf(R, round.humanHalf, draft);
  if (c.missing.length) throw new Error('Still to choose: ' + c.missing.map(s => R.slots[s].title).join(', '));
  delete c.missing;
  const sealed = { ...c, name: round.names.human, salt: randomCode(8), sealedAt: new Date().toISOString() };
  sealed.fp = fingerprint(round, sealed);
  return { ...round, human: sealed };
}

/**
 * Read an AI half from a link / tilde code. Returns {ok, half, warnings, error, roundId}.
 * Lenient on purpose: a missing or unknown pick is "left to the stars" (seeded), and said so in the reveal.
 */
export function readAiCode(raw) {
  const t = parseTilde(raw);
  if (!t || t.role !== 'ai') return { ok: false, error: 'This does not look like a companion\'s sealed half (it should start with ai~).' };
  const R = recipeByCode(t.recipe);
  if (!R) return { ok: false, error: 'Unknown game "' + t.recipe + '".' };
  const f = t.fields;
  const half = (f.half || '').toLowerCase() in R.halves ? f.half.toLowerCase() : null;
  const roundId = f.r ? normCode(f.r) : null;
  const echoed = f.seal ? normCode(f.seal) : null;
  const code = String(raw).trim();
  return { ok: true, recipe: R.code, half, roundId, echoed, fields: f, code: code.slice(code.indexOf('ai~') >= 0 ? code.indexOf('ai~') : 0) };
}

/** Attach the AI half to a round (human-first) or start a round from it (ai-first). */
export function acceptAi(round, parsed) {
  if (!parsed?.ok) throw new Error(parsed?.error || 'Unreadable code.');
  if (round.recipe !== parsed.recipe) throw new Error('This half belongs to a different game.');
  if (parsed.roundId && parsed.roundId !== round.id) throw new Error(`This half belongs to round ${parsed.roundId}, not ${round.id}.`);
  const R = recipeByCode(round.recipe);
  const half = round.human ? R.other(round.humanHalf) : (parsed.half || R.other(round.humanHalf));
  if (round.ai) {
    if (round.ai.code === parsed.code) return round;
    throw new Error(`${round.names.ai}'s half for this round is already sealed. It is kept exactly as it was first sent.`);
  }
  const f = parsed.fields;
  const draft = { picks: {}, word: readText(f.word), line: readText(f.line), why: readText(f.why), wish: readText(f.wish) };
  for (const slot of R.slotsOf(half)) draft.picks[slot] = f[slot] != null ? readText(f[slot]) : '';
  const c = cleanHalf(R, half, draft, { fillChance: true, seed: round.id + parsed.code });
  delete c.missing;
  const warnings = [];
  if (parsed.half && parsed.half !== half) warnings.push(`It chose the ${parsed.half} half, but that half was already yours; its picks were read as ${half}.`);
  if (c.chance.length) warnings.push(`Left to the stars: ${c.chance.map(s => R.slots[s].title).join(', ')}.`);
  const sealMatch = round.human ? (parsed.echoed ? parsed.echoed === round.human.fp : null) : null;
  if (round.human && parsed.echoed && !sealMatch) warnings.push('The seal it echoed does not match yours — it may have been typed by hand. The round still opens.');
  const name = clip(readText(f.from) || round.names.ai, 24);
  const ai = { ...c, name, code: parsed.code, echoed: parsed.echoed, sealMatch, sealedAt: new Date().toISOString(), warnings };
  ai.fp = toCode(hash53(parsed.code), 6);
  const order = round.human ? 'human-first' : 'ai-first';
  return { ...round, humanHalf: R.other(half), ai, order, names: { ...round.names, ai: name } };
}

/** A round started by an AI link (no local round with that id). */
export function roundFromAi(parsed, names = {}) {
  const R = recipeByCode(parsed.recipe);
  const id = parsed.roundId || toCode(hash53(parsed.code), 4);
  const aiHalf = parsed.half || R.other(R.defaultHumanHalf);
  const round = newRound({ recipe: parsed.recipe, humanHalf: R.other(aiHalf), names, id });
  return acceptAi(round, parsed);
}

export function status(round) {
  if (round.keptAt) return 'kept';
  if (round.openedAt) return 'opened';
  if (round.human && round.ai) return 'ready';
  if (round.human) return 'waiting-ai';
  if (round.ai) return 'waiting-human';
  return 'choosing';
}

/** Expand a sealed half (numbers) to option objects for merging and display. */
export function expand(R, sealed) {
  const picks = {};
  for (const [slot, n] of Object.entries(sealed.picks)) picks[slot] = R.option(slot, n);
  return { ...sealed, picks };
}

export function mergeRound(round) {
  const R = recipeByCode(round.recipe);
  return R.merge(expand(R, round.human), expand(R, round.ai), { order: round.order, seed: round.id });
}

/* ------------------------------------------------------------------ handoff text */

/** What the human pastes to the AI. Contains no human choices. */
export function invitation(round, { site, repo } = {}) {
  const R = recipeByCode(round.recipe);
  const aiHalf = R.other(round.humanHalf);
  const lines = [
    `Let's make a ${R.title} together — Companion Keepsakes, round ${round.id}.`,
    `My half (${R.halves[round.humanHalf].title}) is sealed: ${round.human ? round.human.fp : '(not sealed yet)'}. You can't see it, and I can't see yours until we open it together.`,
    `Your half: ${R.halves[aiHalf].title} — ${R.halves[aiHalf].blurb}${R.shared.length ? ', plus one ' + R.shared.join(' and one ') : ''}.`,
    round.theme ? `What it is for: ${round.theme}` : null,
    `How to play: read "For AI Companions" in ${repo || 'the project README'}, then reply with one sentence and a link that starts with ${site || '<site>'}#ai~${round.recipe}~R=${round.id}~seal=${round.human ? round.human.fp : ''}~half=${aiHalf}~ …`,
    `Once you send it, your half is sealed too — please don't change it later.`
  ];
  return lines.filter(Boolean).join('\n');
}

/** After the reveal: a plain-text record for the AI, so it can remember its locked choices. */
export function revealCard(round) {
  const R = recipeByCode(round.recipe);
  const spec = mergeRound(round);
  const placed = who => spec.ledger.filter(x => x.by === who).map(x => `${x.title}: ${x.name}`).join('; ');
  const name = who => who === 'human' ? round.names.human : round.names.ai;
  return [
    `We opened round ${round.id} together: "${spec.title}" (${R.title}).`,
    `${round.names.human} placed — ${placed('human')}.`,
    `${round.names.ai} placed (sealed, keep these as they are) — ${placed('ai')}.`,
    ...spec.lines.filter(l => l.text).map(l => `${l.label} (${name(l.by)}): ${l.text}`),
    spec.resonances.length ? `What happened between them: ${spec.resonances.map(r => r.text).join(' ')}` : null,
    round.human.why ? `${round.names.human}'s reason: ${round.human.why}` : null,
    round.ai.why ? `${round.names.ai}'s reason: ${round.ai.why}` : null,
    round.human.wish ? `${round.names.human}'s hidden line: ${round.human.wish}` : null,
    round.ai.wish ? `${round.names.ai}'s hidden line: ${round.ai.wish}` : null
  ].filter(Boolean).join('\n');
}

/** Build an AI tilde code from structured picks (used by tools/ and tests; an AI may also write it by hand). */
export function buildAiCode({ recipe = 'planet1', round, seal, half, picks = {}, word, line, why, wish, from }) {
  return buildTilde('ai', recipe, {
    R: round, seal, half,
    ...Object.fromEntries(Object.entries(picks).map(([k, v]) => [k, writeText(v)])),
    word: writeText(word), line: writeText(line), why: writeText(why), wish: writeText(wish), from: writeText(from)
  });
}

export { recipes };
