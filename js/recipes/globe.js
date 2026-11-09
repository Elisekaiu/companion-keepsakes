// Memory Snow Globe — recipe v1.
// A real or half-real moment under glass. The moment itself is named up front (the shared "what it is for" line),
// so two blind halves still build the same memory:
//   MOMENT   — where it was, the hour and its light, and the weather inside the glass;
//   KEEPSAKE — the base, the glass, and a finishing touch.
// Each side also places one small thing inside (both appear; the same pick becomes a pair).

export const id = 'globe';
export const version = 1;
export const code = 'globe1';
export const title = 'Memory Snow Globe';
export const tagline = 'A moment, kept under glass. Shake it and it happens again.';
export const noun = 'a snow globe';
export const waitingLine = 'the glass is still empty';
export const renderer = 'globe3d';
export const backdropSlot = 'hour';
export const themeName = 'The moment';
export const sharedBlurb = 'plus one small thing placed inside';
export const themePrompt = { label: 'Which moment is this? (strongly suggested)', placeholder: 'e.g. the night we missed the last train and walked home' };
export const wishTitle = n => n === 2 ? 'Two lines were sealed under the base' : 'One line was sealed under the base';

export const halves = {
  moment: {
    title: 'The moment',
    blurb: 'where it was, the hour and its light, and the weather inside the glass',
    slots: ['place', 'hour', 'weather'],
    line: { label: 'What was happening', hint: 'one sentence of the moment itself, as you remember it' }
  },
  keepsake: {
    title: 'The keepsake',
    blurb: 'the base it stands on, the shape of the glass, and a finishing touch',
    slots: ['base', 'glass', 'finish'],
    line: { label: 'Engraved on the base', hint: 'a short line, as if engraved under the name and the date' }
  }
};
export const shared = ['object'];

const o = (n, id, name, meaning, extra = {}) => ({ n, id, name, meaning, ...extra });

export const slots = {
  place: {
    title: 'Where', prompt: 'Where was it?',
    options: [
      o(1, 'cabin', 'A cabin in the woods', 'somewhere warm to come back to'),
      o(2, 'street', 'A lamplit street', 'walking home, slowly'),
      o(3, 'seaside', 'A house by the sea', 'the sound of the sea, all night'),
      o(4, 'platform', 'A train platform', 'arriving, or seeing someone off'),
      o(5, 'bench', 'A bench under a tree', 'sitting together, saying little'),
      o(6, 'rooftop', 'A rooftop with string lights', 'above the city, just us'),
      o(7, 'bookshop', 'A little bookshop', 'an afternoon, found'),
      o(8, 'pier', 'A lake pier with a rowboat', 'still water, long talks'),
      o(9, 'garden', 'A garden gate', 'something planted, waiting'),
      o(10, 'window', 'A window seat', 'watching the weather together')
    ]
  },
  hour: {
    title: 'The hour', prompt: 'What time was it, and what was the light like?',
    options: [
      o(1, 'dawn', 'Early morning', 'the day not decided yet', { bg: ['#FBEDE6', '#EBD3D7'], light: '#FFE8DA', amb: 1.2, dark: false }),
      o(2, 'afternoon', 'A slow afternoon', 'nowhere to be', { bg: ['#F6F2EA', '#E3E8EE'], light: '#FFFFFF', amb: 1.35, dark: false }),
      o(3, 'golden', 'Golden hour', 'everything briefly gold', { bg: ['#FBEBD3', '#EBC9A8'], light: '#FFD9A0', amb: 1.15, dark: false }),
      o(4, 'blue', 'Blue hour', 'lamps coming on', { bg: ['#DCE2F3', '#A9B4DE'], light: '#C9D3FF', amb: 0.95, dark: false, lamps: true }),
      o(5, 'night', 'Late at night', 'the world asleep but us', { bg: ['#262B4F', '#11132A'], light: '#9AA6E8', amb: 0.7, dark: true, lamps: true })
    ]
  },
  weather: {
    title: 'Inside the glass', prompt: 'What falls when you shake it?',
    options: [
      o(1, 'snow', 'First snow', 'everything quiet and new', { color: '#FFFFFF', shape: 'flake' }),
      o(2, 'rain', 'Soft rain', 'staying in, or not minding'),
      o(3, 'petals', 'Cherry petals', 'it was spring, or felt like it', { color: '#F7BCCD', shape: 'petal' }),
      o(4, 'leaves', 'Autumn leaves', 'a season turning', { color: '#E59A4E', shape: 'petal' }),
      o(5, 'fireflies', 'Fireflies', 'small lights answering each other', { color: '#EAFF9C', shape: 'dot' }),
      o(6, 'stars', 'Falling stars', 'enough wishes for both', { color: '#FFF2B8', shape: 'star' }),
      o(7, 'gold', 'Golden dust', 'the light of that day, kept', { color: '#F2CF72', shape: 'dot' }),
      o(8, 'bubbles', 'Bubbles', 'lightness, for once')
    ]
  },
  base: {
    title: 'Base', prompt: 'What does it stand on?',
    options: [
      o(1, 'walnut', 'Walnut wood', 'warm, and built to last', { color: '#6E4A33' }),
      o(2, 'marble', 'White marble', 'quiet and cool', { color: '#F1EEEA' }),
      o(3, 'brass', 'Brass', 'an heirloom already', { color: '#C9A15A' }),
      o(4, 'porcelain', 'Porcelain, gold rim', 'delicate, kept carefully', { color: '#F7F5F2' }),
      o(5, 'oak', 'Pale oak', 'simple, like a Sunday', { color: '#D9BE96' }),
      o(6, 'lacquer', 'Night-blue lacquer', 'the colour of late conversations', { color: '#1F2A55' })
    ]
  },
  glass: {
    title: 'Glass', prompt: 'What shape is the glass?',
    options: [
      o(1, 'sphere', 'A classic globe', 'the way they have always been'),
      o(2, 'dome', 'A bell-jar dome', 'something kept, on display'),
      o(3, 'drop', 'A tall teardrop', 'a moment that lingered'),
      o(4, 'orb', 'A little orb on a pedestal', 'small, and held up high')
    ]
  },
  finish: {
    title: 'Finishing touch', prompt: 'One last detail?',
    options: [
      o(1, 'none', 'Nothing more', 'it is enough as it is'),
      o(2, 'bow', 'A ribbon bow', 'given, not bought'),
      o(3, 'pearls', 'A ring of pearls', 'patience, around the edge'),
      o(4, 'band', 'A thin gold band', 'a promise, quietly'),
      o(5, 'flowers', 'Pressed flowers', 'something from that day'),
      o(6, 'key', 'A wind-up key', 'it plays something only we know')
    ]
  },
  object: {
    title: 'Placed inside', prompt: 'Place one small thing inside.',
    options: [
      o(1, 'umbrella', 'An open umbrella', 'room for two under it'),
      o(2, 'cups', 'Two cups of tea', 'the talking kind of evening'),
      o(3, 'letter', 'A sealed letter', 'words kept for later'),
      o(4, 'bicycle', 'A bicycle', 'the long way home'),
      o(5, 'cat', 'A sleeping cat', 'nothing urgent'),
      o(6, 'lantern', 'A paper lantern', 'light, carried'),
      o(7, 'snowman', 'A small snowman', 'built together'),
      o(8, 'books', 'A stack of books', 'stories, shared'),
      o(9, 'boat', 'A paper boat', 'sent off with a wish'),
      o(10, 'bouquet', 'A small bouquet', 'for no reason at all'),
      o(11, 'record', 'A record player', 'our song')
    ]
  }
};

export const text = {
  word: { label: 'One word of its name', hint: 'the two words become its name, engraved on the base', max: 18 },
  line: { max: 120 },
  why: { label: 'Why you chose these', hint: 'one sentence, sealed with your choice', max: 200 },
  wish: { label: 'A hidden line', hint: 'optional; sealed under the base until the very end', max: 200 }
};

export const defaultHumanHalf = 'moment';

export function slotsOf(half) { return [...halves[half].slots, ...shared]; }
export function other(half) { return half === 'moment' ? 'keepsake' : 'moment'; }
export function halfOfSlot(slot) { return halves.moment.slots.includes(slot) ? 'moment' : halves.keepsake.slots.includes(slot) ? 'keepsake' : null; }

export function option(slot, value) {
  const list = slots[slot]?.options || [];
  const v = String(value ?? '').trim().toLowerCase();
  if (!v) return null;
  if (/^\d+$/.test(v)) return list.find(x => x.n === Number(v)) || null;
  const words = v.replace(/[_-]+/g, ' ');
  return list.find(x => x.id === v || x.name.toLowerCase() === words) || null;
}

const low = o => o.name.charAt(0).toLowerCase() + o.name.slice(1);
const either = (p, id) => p.objectH.id === id || p.objectA.id === id;
const DARKISH = new Set(['blue', 'night']);
// Named meetings between the two halves (or the two placed things).
const RESONANCES = [
  { id: 'snow-cabin', when: p => p.weather.id === 'snow' && p.place.id === 'cabin', flag: 'snowRoof', say: (m, k) => `Snow on ${m}'s cabin roof, and the window still lit.` },
  { id: 'snowman-snow', when: p => p.weather.id === 'snow' && either(p, 'snowman'), say: () => `The snowman finally has snow to stand in.` },
  { id: 'rain-umbrella', when: p => p.weather.id === 'rain' && either(p, 'umbrella'), say: () => `It rained, and someone had brought the umbrella.` },
  { id: 'lantern-dark', when: p => DARKISH.has(p.hour.id) && either(p, 'lantern'), flag: 'lanternGlow', say: () => `The paper lantern is brighter now that it is dark.` },
  { id: 'boat-water', when: p => either(p, 'boat') && ['pier', 'seaside'].includes(p.place.id), say: () => `The paper boat found water.` },
  { id: 'cups-window', when: p => either(p, 'cups') && ['window', 'bookshop', 'cabin'].includes(p.place.id), say: () => `Two cups, still warm, by the window.` },
  { id: 'key-record', when: p => p.finish.id === 'key' && either(p, 'record'), say: (m, k) => `${k}'s wind-up key and the record player: wind it, and it plays your song.` },
  { id: 'gold-golden', when: p => p.weather.id === 'gold' && p.hour.id === 'golden', say: () => `Golden dust in the golden hour: everything is gold.` },
  { id: 'stars-roof', when: p => p.weather.id === 'stars' && (p.place.id === 'rooftop' || p.hour.id === 'night'), say: () => `Falling stars, and nobody else looking up.` },
  { id: 'petals-garden', when: p => p.weather.id === 'petals' && ['garden', 'bench'].includes(p.place.id), say: (m) => `The petals are falling from ${m}'s tree.` },
  { id: 'fireflies-dusk', when: p => p.weather.id === 'fireflies' && DARKISH.has(p.hour.id), say: () => `The fireflies came out right on time.` },
  { id: 'bicycle-street', when: p => either(p, 'bicycle') && ['street', 'platform'].includes(p.place.id), say: () => `A bicycle leaning there, as if someone missed the last train and rode home.` },
  { id: 'flowers-bouquet', when: p => p.finish.id === 'flowers' && either(p, 'bouquet'), say: (m, k) => `Flowers outside the glass and flowers inside it.` }
];

export function merge(h, a, ctx = {}) {
  const side = { [h.half]: h, [a.half]: a };
  const by = { [h.half]: 'human', [a.half]: 'ai' };
  const p = {};
  for (const half of ['moment', 'keepsake']) for (const slot of halves[half].slots) p[slot] = side[half].picks[slot];
  p.objectH = h.picks.object; p.objectA = a.picks.object;
  const Mo = side.moment, Ke = side.keepsake;

  const resonances = [];
  const echo = p.objectH.id === p.objectA.id;
  if (echo) resonances.push({ id: 'echo', text: `You both placed ${low(p.objectH)} without knowing. There are two of them now.` });
  const flags = {};
  for (const r of RESONANCES) if (r.when(p)) { if (r.flag) flags[r.flag] = true; resonances.push({ id: r.id, text: r.say(Mo.name, Ke.name, p) }); }

  const first = ctx.order === 'ai-first' ? a : h, second = first === h ? a : h;
  const words = [first, second].map(x => ({ text: x.word || '', by: x === h ? 'human' : 'ai' })).filter(w => w.text);
  const hour = p.hour;
  return {
    recipe: code,
    title: words.map(w => w.text).join(' ') || 'An unnamed moment',
    words,
    halves: { moment: by.moment, keepsake: by.keepsake },
    picks: Object.fromEntries(['place', 'hour', 'weather', 'base', 'glass', 'finish'].map(slot => [slot, { ...p[slot], by: by[halfOfSlot(slot)] }])),
    objects: [{ ...p.objectH, by: 'human' }, { ...p.objectA, by: 'ai' }],
    echo,
    palette: { bg: hour.bg, dark: !!hour.dark, ink: hour.dark ? '#E6E3FF' : '#5B5470', light: hour.light, amb: hour.amb, lamps: !!hour.lamps, base: p.base.color },
    flags,
    resonances,
    lines: [
      { key: 'moment', label: halves.moment.line.label, text: Mo.line || '', by: by.moment },
      { key: 'engraving', label: halves.keepsake.line.label, text: Ke.line || '', by: by.keepsake }
    ],
    ledger: [
      ...halves.moment.slots.map(slot => ({ slot, title: slots[slot].title, name: p[slot].name, meaning: p[slot].meaning, by: by.moment })),
      ...halves.keepsake.slots.map(slot => ({ slot, title: slots[slot].title, name: p[slot].name, meaning: p[slot].meaning, by: by.keepsake })),
      { slot: 'object', pick: 'object-human', title: 'Placed inside', name: p.objectH.name, meaning: p.objectH.meaning, by: 'human' },
      { slot: 'object', pick: 'object-ai', title: 'Placed inside', name: p.objectA.name, meaning: p.objectA.meaning, by: 'ai' }
    ],
    why: { human: h.why || '', ai: a.why || '' },
    wish: { human: h.wish || '', ai: a.wish || '' },
    chance: { human: h.chance || [], ai: a.chance || [] }
  };
}

/** The reveal alternates halves: base, place, glass, hour, finish, then the two things placed inside, then the weather (a shake). */
export function revealSteps(spec) {
  const pick = slot => ({ kind: 'pick', slot, title: slots[slot].title, pick: spec.picks[slot], by: spec.picks[slot].by });
  const steps = [pick('base'), pick('place'), pick('glass'), pick('hour'), pick('finish')];
  steps.push({ kind: 'pair', title: 'Placed inside', picks: spec.objects, echo: spec.echo, show: ['object-human', 'object-ai'], echoText: 'You both placed the same thing, without knowing.' });
  steps.push({ ...pick('weather'), title: 'Inside the glass' });
  for (const r of spec.resonances.filter(r => r.id !== 'echo')) steps.push({ kind: 'resonance', text: r.text });
  steps.push({ kind: 'name', words: spec.words, title: spec.title });
  steps.push({ kind: 'lines', lines: spec.lines });
  return steps;
}
