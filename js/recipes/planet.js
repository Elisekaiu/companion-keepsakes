// Tiny Imaginary Planet — recipe v1.
// Two halves that never collide: GROUND (what the world stands on) and SKY (what surrounds it).
// Each side also places one WONDER from a shared list (both appear; the same pick becomes an "echo").
// Every visible element of the finished world comes from exactly one sealed pick, a resonance between
// two sealed picks (named in the reveal), or the round seed (exact positions only).

export const id = 'planet';
export const version = 1;
export const code = 'planet1';
export const title = 'Tiny Imaginary Planet';
export const tagline = 'A small world that does not need to obey anything but the two of you.';
export const noun = 'a tiny planet';
export const waitingLine = 'half of this world is still dark';
export const renderer = 'planet3d';      // js/render/<renderer>.js
export const backdropSlot = 'sky';       // the pick that sets the scene's backdrop during the reveal
export const wishTitle = n => n === 2 ? 'Two sealed lines remain' : 'One sealed line remains';

export const halves = {
  ground: {
    title: 'Ground',
    blurb: 'what the world stands on: land, water, what grows, who lives there',
    slots: ['land', 'water', 'growth', 'dwelling'],
    line: { label: 'A secret buried here', hint: 'one sentence hidden in the ground; found by digging after the reveal' }
  },
  sky: {
    title: 'Sky',
    blurb: 'what surrounds it: light, moons, what drifts in the air, who visits',
    slots: ['sky', 'moon', 'air', 'visitor'],
    line: { label: 'The one rule of this world', hint: 'one law this planet obeys, e.g. "Rain falls upward on birthdays"' }
  }
};
export const shared = ['wonder'];

const o = (n, id, name, meaning, extra = {}) => ({ n, id, name, meaning, ...extra });

export const slots = {
  land: {
    title: 'Land', prompt: 'What is the ground made of?',
    options: [
      o(1, 'meadow', 'Soft meadow', 'a place to lie down and do nothing', { colors: ['#9EC891', '#86B97F', '#C4DFA6'] }),
      o(2, 'flowers', 'Flower field', 'every small kindness grows here', { colors: ['#AFD39C', '#98C58E', '#D2E7B3'], dots: ['#F6B8C8', '#FFFFFF', '#F8DE7E', '#C9B6F0'] }),
      o(3, 'dunes', 'Honey dunes', 'warm, patient, never in a hurry', { colors: ['#EDCD98', '#E0B67E', '#F6E0B7'] }),
      o(4, 'snow', 'First snow', 'quiet, clean, a new page', { colors: ['#E8EEF7', '#D3DFEF', '#FFFFFF'] }),
      o(5, 'crystal', 'Crystal plain', 'things that are clear and kept', { colors: ['#CEC3EE', '#B4A6E2', '#E8E0FB'], shards: '#E4DAFF' }),
      o(6, 'moss', 'Glowing moss', 'light that comes from below', { colors: ['#5FAE9C', '#3F8A86', '#B4E6C8'], glow: '#9CF5D8' }),
      o(7, 'autumn', 'Amber woods', 'a season that keeps its warmth', { colors: ['#E7B07B', '#D58F5D', '#F2CC98'] }),
      o(8, 'cloud', 'Cloudstone', 'ground soft enough to fall into', { colors: ['#F2ECF6', '#E2D8EE', '#FFFFFF'] })
    ]
  },
  water: {
    title: 'Water', prompt: 'Where does the water go?',
    options: [
      o(1, 'sea', 'One round sea', 'somewhere to look out at', { level: 0.012, color: '#8CC4E6' }),
      o(2, 'lakes', 'Small lakes', 'little mirrors', { level: -0.022, color: '#93CBE8' }),
      o(3, 'river', 'River of light', 'a path that glows', { color: '#BDF1FF' }),
      o(4, 'frozen', 'Frozen lake', 'a moment held still', { level: -0.012, color: '#DCEFFB' }),
      o(5, 'floating', 'Floating ponds', 'water that forgot to fall', { color: '#9ED3F0' }),
      o(6, 'springs', 'Warm springs', 'rest, with steam rising', { level: -0.03, color: '#A8DCE0' }),
      o(7, 'none', 'No water', 'dry and quiet; the sky is enough')
    ]
  },
  growth: {
    title: 'What grows', prompt: 'What grows there?',
    options: [
      o(1, 'round', 'Round trees', 'shade for a long afternoon'),
      o(2, 'pines', 'Little pines', 'things that stay green'),
      o(3, 'mushrooms', 'Giant mushrooms', 'small things, grown enormous'),
      o(4, 'crystaltrees', 'Crystal trees', 'growth you can see through'),
      o(5, 'lanterns', 'Lantern flowers', 'small lights left on for someone'),
      o(6, 'puffs', 'Candyfloss trees', 'sweetness, unapologetic'),
      o(7, 'reeds', 'Tall grass and reeds', 'listening to the wind')
    ]
  },
  dwelling: {
    title: 'Dwelling', prompt: 'Who, or what, lives there?',
    options: [
      o(1, 'cottage', 'Cottage', 'a home with the window lit'),
      o(2, 'lighthouse', 'Lighthouse', 'so the way back is always visible'),
      o(3, 'observatory', 'Observatory', 'someone watching the sky for you'),
      o(4, 'greenhouse', 'Glass greenhouse', 'tending something slowly'),
      o(5, 'shrine', 'Small shrine', 'a place to leave wishes'),
      o(6, 'tower', 'Castle tower', 'a story with a keep'),
      o(7, 'windmill', 'Windmill', 'turning, steadily, every day'),
      o(8, 'train', 'Little train', 'always coming back around')
    ]
  },
  sky: {
    title: 'Sky', prompt: 'What light is this world under?',
    options: [
      o(1, 'dawn', 'Pink dawn', 'the start of something', { bg: ['#FCEBE3', '#F3C8CB'], light: '#FFF0E6', ink: '#7A5F7E', tint: '#F7B9B0', amount: 0.07 }),
      o(2, 'noon', 'Clear noon', 'nothing hidden', { bg: ['#EEF6FB', '#CBE3F3'], light: '#FFFFFF', ink: '#4F6A8C', tint: '#FFFFFF', amount: 0 }),
      o(3, 'sunset', 'Long sunset', "the hour you don't want to end", { bg: ['#FBE2C4', '#E7A5AE'], light: '#FFE6D2', ink: '#80566A', tint: '#F4A27E', amount: 0.08 }),
      o(4, 'bluehour', 'Blue hour', 'soft, in between', { bg: ['#D9DCF4', '#9AA3DA'], light: '#E6E9FF', ink: '#3E4787', tint: '#A4AEE8', amount: 0.12 }),
      o(5, 'night', 'Starry night', 'awake together', { bg: ['#262B57', '#0F1332'], light: '#DCE0FF', ink: '#E6E3FF', tint: '#7F88D0', amount: 0.16, dark: true }),
      o(6, 'aurora', 'Aurora night', 'a sky that dances', { bg: ['#1C3248', '#0B1428'], light: '#E2F6F0', ink: '#DDF8F0', tint: '#7CC8BC', amount: 0.14, dark: true }),
      o(7, 'eclipse', 'Eclipse', 'rare, and both of you there to see it', { bg: ['#2C2238', '#120E1C'], light: '#F8E6CC', ink: '#F4E3C8', tint: '#A88AB8', amount: 0.16, dark: true })
    ]
  },
  moon: {
    title: 'Moons', prompt: 'What circles it?',
    options: [
      o(1, 'one', 'One small moon', 'company'),
      o(2, 'twin', 'Twin moons', 'two of a kind'),
      o(3, 'rings', 'Rings', 'a promise that goes all the way around'),
      o(4, 'ringmoon', 'Rings and a moon', 'a promise, and company'),
      o(5, 'comet', 'A passing comet', 'a once-in-a-lifetime visit'),
      o(6, 'crescent', 'A close crescent', 'a smile in the sky'),
      o(7, 'sun2', 'A tiny second sun', 'warmth from an unexpected side')
    ]
  },
  air: {
    title: 'In the air', prompt: 'What drifts through the air?',
    options: [
      o(1, 'clouds', 'Drifting clouds', 'slow afternoons'),
      o(2, 'snow', 'Snowfall', 'quiet, falling'),
      o(3, 'petals', 'Falling petals', 'something gentle, all the time'),
      o(4, 'fireflies', 'Fireflies', 'little lights that answer each other'),
      o(5, 'rainbow', 'A rainbow', 'after the rain'),
      o(6, 'meteors', 'Meteor shower', 'enough wishes for everyone'),
      o(7, 'bubbles', 'Soap bubbles', 'play'),
      o(8, 'rain', 'Soft rain', 'staying in together')
    ]
  },
  visitor: {
    title: 'Visitor', prompt: 'Who comes to visit?',
    options: [
      o(1, 'whale', 'Floating whale', 'something large and gentle keeps watch'),
      o(2, 'cranes', 'Paper cranes', 'wishes, folded and flying'),
      o(3, 'jelly', 'Lantern jellyfish', 'drifting light'),
      o(4, 'koi', 'Sky koi', 'luck that swims through air'),
      o(5, 'birds', 'A flock of birds', 'coming home'),
      o(6, 'balloon', 'Hot-air balloon', 'someone is on their way'),
      o(7, 'fox', 'A sleeping fox', 'safe enough to sleep')
    ]
  },
  wonder: {
    title: 'Wonder', prompt: 'Place one impossible thing.',
    options: [
      o(1, 'island', 'Floating island', 'a place apart, just for us'),
      o(2, 'spire', 'Crystal spire', 'a clear, tall promise'),
      o(3, 'road', 'Glowing road', 'the way we walked'),
      o(4, 'bridge', 'Bridge into the sky', 'reaching across'),
      o(5, 'lighttree', 'Tree of lights', 'every light a memory'),
      o(6, 'upfall', 'Upward waterfall', 'the impossible, made ordinary'),
      o(7, 'arch', 'Stone archway', 'a doorway to somewhere'),
      o(8, 'door', 'A door standing alone', "open it and you're here")
    ]
  }
};

export const text = {
  word: { label: 'One word of its name', hint: 'the two words become the world\'s name', max: 24 },
  line: { max: 140 },
  why: { label: 'Why you chose these', hint: 'one sentence, sealed with your choice', max: 200 },
  wish: { label: 'A hidden line', hint: 'optional; stays sealed until the very end', max: 200 }
};

export const defaultHumanHalf = 'ground';

/** Slots that belong to a half, including the shared wonder. */
export function slotsOf(half) {
  return [...halves[half].slots, ...shared];
}

export function other(half) { return half === 'ground' ? 'sky' : 'ground'; }

export function option(slot, value) {
  const list = slots[slot]?.options || [];
  const v = String(value ?? '').trim().toLowerCase();
  if (!v) return null;
  if (/^\d+$/.test(v)) return list.find(x => x.n === Number(v)) || null;
  const words = v.replace(/[_-]+/g, ' ');
  return list.find(x => x.id === v || x.name.toLowerCase() === words) || null;
}

/* ------------------------------------------------------------------ merge */

const DARK = new Set(['night', 'aurora', 'eclipse']);

// Resonances: named interactions between two sealed picks. They add an effect the renderer uses
// and a caption the reveal shows. They never replace either side's choice.
const RESONANCES = [
  { id: 'lantern-night', flag: 'glowGrowth', when: p => p.growth.id === 'lanterns' && DARK.has(p.sky.id),
    say: (g, s, p) => `${g}'s lantern flowers lit up under ${s}'s ${low(p.sky)}.` },
  { id: 'moss-night', flag: 'glowLand', when: p => p.land.id === 'moss' && DARK.has(p.sky.id),
    say: (g, s) => `The moss ${g} laid down began to glow once ${s} brought the dark.` },
  { id: 'river-night', flag: 'glowRiver', when: p => p.water.id === 'river' && DARK.has(p.sky.id),
    say: (g, s, p) => `${g}'s river of light is brightest under ${s}'s ${low(p.sky)}.` },
  { id: 'aurora-ice', flag: 'reflect', when: p => p.sky.id === 'aurora' && (p.water.id === 'frozen' || p.land.id === 'snow'),
    say: (g, s) => `${s}'s aurora is reflected in the ice ${g} made.` },
  { id: 'fireflies-lanterns', flag: 'glowGrowth', when: p => p.air.id === 'fireflies' && p.growth.id === 'lanterns',
    say: (g, s) => `${s}'s fireflies and ${g}'s lantern flowers keep answering each other.` },
  { id: 'lighthouse-dark', flag: 'beam', when: p => p.dwelling.id === 'lighthouse' && DARK.has(p.sky.id),
    say: (g, s) => `In ${s}'s dark, ${g}'s lighthouse turned its beam on.` },
  { id: 'observatory-comet', flag: 'aim', when: p => p.dwelling.id === 'observatory' && p.moon.id === 'comet',
    say: (g, s) => `${g}'s observatory was pointed at ${s}'s comet all along.` },
  { id: 'cranes-shrine', flag: 'perch', when: p => p.visitor.id === 'cranes' && p.dwelling.id === 'shrine',
    say: (g, s) => `${s}'s paper cranes come to rest at ${g}'s shrine.` },
  { id: 'rainbow-water', flag: 'rainbowWater', when: p => p.air.id === 'rainbow' && ['sea', 'lakes', 'springs', 'floating'].includes(p.water.id),
    say: (g, s) => `${s}'s rainbow ends in ${g}'s water.` },
  { id: 'snow-dunes', flag: 'snowcap', when: p => p.air.id === 'snow' && p.land.id === 'dunes',
    say: (g, s) => `${s}'s snow settles on ${g}'s warm dunes, and somehow does not melt.` },
  { id: 'whale-sea', flag: 'whaleLow', when: p => p.visitor.id === 'whale' && p.water.id === 'sea',
    say: (g, s) => `${s}'s whale swims low, its shadow crossing ${g}'s sea.` },
  { id: 'fox-home', flag: 'foxHome', when: p => p.visitor.id === 'fox' && ['cottage', 'greenhouse', 'shrine'].includes(p.dwelling.id),
    say: (g, s, p) => `${s}'s fox curled up by ${g}'s ${low(p.dwelling)}.` }
];
const low = o => o.name.toLowerCase();

function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map(sh => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t));
  return '#' + c.map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Merge two sealed halves into a render spec.
 * h, a: { half, picks:{slot:option}, word, line, why, wish, name, chance:[] }
 */
export function merge(h, a, ctx = {}) {
  const side = { [h.half]: h, [a.half]: a };
  const by = { [h.half]: 'human', [a.half]: 'ai' };
  const p = {};
  for (const half of ['ground', 'sky']) {
    for (const slot of halves[half].slots) p[slot] = side[half].picks[slot];
  }
  const G = side.ground, S = side.sky;

  // Light merge rule: the sky tints the land, it never repaints it.
  const sky = p.sky, land = p.land;
  const landColors = land.colors.map(c => mix(c, sky.tint, sky.amount));

  const resonances = [];
  const flags = {};
  for (const r of RESONANCES) {
    if (!r.when(p)) continue;
    flags[r.flag] = true;
    resonances.push({ id: r.id, text: r.say(G.name, S.name, p) });
  }
  const echo = h.picks.wonder.id === a.picks.wonder.id;
  if (echo) resonances.unshift({ id: 'echo', text: `You both placed the same wonder without knowing it: ${h.picks.wonder.name.toLowerCase()}. It stands twice.` });

  const first = ctx.order === 'ai-first' ? a : h, second = first === h ? a : h;
  const words = [first, second].map(x => ({ text: x.word || '', by: x === h ? 'human' : 'ai' })).filter(w => w.text);
  const name = words.map(w => w.text).join(' ') || 'An unnamed world';

  return {
    recipe: code,
    title: name,
    words,
    halves: { ground: by.ground, sky: by.sky },
    picks: Object.fromEntries(Object.entries(p).map(([slot, opt]) => [slot, { ...opt, by: by[halfOfSlot(slot)] }])),
    wonders: [{ ...h.picks.wonder, by: 'human' }, { ...a.picks.wonder, by: 'ai' }],
    echo,
    palette: {
      bg: sky.bg, dark: !!sky.dark, light: sky.light, ink: sky.ink,
      land: landColors, dots: land.dots || null, glow: land.glow || null, shards: land.shards || null,
      water: p.water.color || null
    },
    flags,
    resonances,
    // Lines in reveal order. `find` names a part that must be uncovered before the line can be read.
    lines: [
      { key: 'rule', label: halves.sky.line.label, text: S.line || '', by: by.sky },
      { key: 'secret', label: halves.ground.line.label, text: G.line || '', by: by.ground, find: 'secret', findLabel: 'Turn the world and dig it up' }
    ],
    // Everything each side placed, in display order (story, reveal card, keepsake readers).
    ledger: [
      ...['ground', 'sky'].flatMap(half => [...halves[half].slots.map(slot => ({ slot, title: slots[slot].title, name: p[slot].name, meaning: p[slot].meaning, by: by[half] })),
        { slot: 'wonder', title: 'Wonder', name: side[half].picks.wonder.name, meaning: side[half].picks.wonder.meaning, by: by[half] }])
    ],
    why: { human: h.why || '', ai: a.why || '' },
    wish: { human: h.wish || '', ai: a.wish || '' },
    chance: { human: h.chance || [], ai: a.chance || [] }
  };
}

export function halfOfSlot(slot) {
  return halves.ground.slots.includes(slot) ? 'ground' : halves.sky.slots.includes(slot) ? 'sky' : null;
}

/** The reveal, in order: alternate sides, so the world is visibly built by both. */
export function revealSteps(spec) {
  const order = ['sky', 'land', 'moon', 'water', 'air', 'growth', 'visitor', 'dwelling'];
  const steps = order.map(slot => ({ kind: 'pick', slot, title: slots[slot].title, pick: spec.picks[slot], by: spec.picks[slot].by,
    focus: slot === 'dwelling' && spec.picks.dwelling.id !== 'train' ? 'dwelling' : null }));
  steps.push({ kind: 'pair', title: 'Wonders', picks: spec.wonders, echo: spec.echo, show: ['wonderH', 'wonderA'], focus: 'front',
    echoText: 'You both chose the same wonder, without knowing.' });
  for (const r of spec.resonances.filter(r => r.id !== 'echo')) steps.push({ kind: 'resonance', text: r.text });
  steps.push({ kind: 'name', words: spec.words, title: spec.title });
  steps.push({ kind: 'lines', lines: spec.lines });
  return steps;
}
