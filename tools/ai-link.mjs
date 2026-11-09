#!/usr/bin/env node
// For companions (or people) who can run code: build and check a sealed half.
//   node tools/ai-link.mjs --round 7Q3K --seal R3HH5X --half sky --sky 6 --moon 2 --air 4 --visitor 1 --wonder 3 \
//        --word Hollow --line "Rain falls upward on birthdays" --why "..." --wish "..." --from Orin
// Prints the link, and what the page will read from it. No network, no state.
import { buildAiCode, readAiCode, acceptAi, newRound } from '../js/engine/round.js';
import { recipeByCode } from '../js/recipes/index.js';
import { SITE_URL } from '../js/config.js';

const a = {};
for (let i = 2; i < process.argv.length; i += 2) a[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
const R = recipeByCode(a.recipe || 'planet1');
const half = a.half || 'sky';
const picks = Object.fromEntries(R.slotsOf(half).filter(s => a[s]).map(s => [s, a[s]]));
const code = buildAiCode({ recipe: R.code, round: a.round, seal: a.seal, half, picks, word: a.word, line: a.line, why: a.why, wish: a.wish, from: a.from });
const link = (a.site || SITE_URL) + '#' + code;
const parsed = readAiCode(link);
const probe = acceptAi(newRound({ recipe: R.code, humanHalf: R.other(half), id: parsed.roundId || 'TEST' }), parsed);
console.log(link + '\n');
for (const s of R.slotsOf(half)) console.log(`${s.padEnd(8)} ${R.option(s, probe.ai.picks[s]).name}${probe.ai.chance.includes(s) ? '   (missing: left to the stars)' : ''}`);
for (const w of probe.ai.warnings) console.log('note: ' + w);
