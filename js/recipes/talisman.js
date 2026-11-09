// Two-Person Talisman — recipe v1.
// A refined bag charm: a silver (or gold) clasp, a strand of six beads, a hanging charm, and a small silk pouch.
// Two halves that never collide: SILK (the pouch, its stitched motif, the cord, beads 1·3·5) and
// METAL (the finish, the charm, beads 2·4·6). On the strand the two of you alternate, bead by bead.
// Both hidden lines are folded inside the pouch and come out last ("untie the pouch").

export const id = 'talisman';
export const version = 1;
export const code = 'talisman1';
export const title = 'Two-Person Talisman';
export const tagline = 'A small charm to carry: one bead each, in turn, and a pouch for two wishes.';
export const noun = 'a talisman';
export const waitingLine = 'half of the strand is still unstrung';
export const renderer = 'talisman3d';
export const backdropSlot = 'silk';
export const wishTitle = n => 'Untie the pouch';

export const halves = {
  silk: {
    title: 'Silk',
    blurb: 'the soft part: the silk pouch, the motif stitched on it, its cord, and beads 1, 3 and 5',
    slots: ['silk', 'motif', 'cord', 'bead1', 'bead3', 'bead5'],
    line: { label: 'Stitched on the pouch', hint: 'a short blessing, as if embroidered on the silk' }
  },
  metal: {
    title: 'Metal',
    blurb: 'the hard part: the metal, the charm that hangs beside the pouch, and beads 2, 4 and 6',
    slots: ['metal', 'charm', 'bead2', 'bead4', 'bead6'],
    line: { label: 'Engraved on the back of the charm', hint: 'one sentence: what this talisman promises' }
  }
};
export const shared = [];

const o = (n, id, name, meaning, extra = {}) => ({ n, id, name, meaning, ...extra });

// The bead table. Numbers are permanent (links made earlier must keep reading the same bead);
// new beads are only ever appended. `group` and `month` arrange the menu; `shape`/`mat` drive the renderer.
const G1 = 'Birthstones', G2 = 'Soft & warm', G3 = 'Stones that catch light', G4 = 'Earth stones';
const BEADS = [
  // Birthstones, January to December
  o(9, 'garnet', 'Garnet', 'devotion', { group: G1, month: 'January', shape: 'facet', mat: 'glass', color: '#B8323F' }),
  o(6, 'amethyst', 'Amethyst', 'a quiet mind', { group: G1, month: 'February', shape: 'facet', mat: 'glass', color: '#9473D6' }),
  o(5, 'aqua', 'Aquamarine', 'a calm crossing', { group: G1, month: 'March', shape: 'facet', mat: 'glass', color: '#74BEE0' }),
  o(29, 'herkimer', 'Herkimer diamond', 'still clear under pressure', { group: G1, month: 'April', shape: 'herkimer', mat: 'glass', color: '#F7FAFF' }),
  o(15, 'emerald', 'Emerald', 'love that keeps renewing', { group: G1, month: 'May', shape: 'facet', mat: 'glass', color: '#1F9D6B' }),
  o(1, 'pearl', 'Freshwater pearl', 'patience, made slowly', { group: G1, month: 'June', shape: 'pearl', mat: 'pearl', color: '#F3ECE2' }),
  o(4, 'moonstone', 'Moonstone', 'for the nights apart', { group: G1, month: 'June', shape: 'round', mat: 'moon', color: '#E6ECF6' }),
  o(13, 'ruby', 'Ruby', 'a brave heart', { group: G1, month: 'July', shape: 'bicone', mat: 'glass', color: '#C21E3A' }),
  o(17, 'peridot', 'Peridot', 'light after a hard time', { group: G1, month: 'August', shape: 'facet', mat: 'glass', color: '#9CC64A' }),
  o(14, 'sapphire', 'Sapphire', 'faithfulness', { group: G1, month: 'September', shape: 'bicone', mat: 'glass', color: '#2747A8' }),
  o(16, 'opal', 'Opal', 'every colour at once', { group: G1, month: 'October', shape: 'round', mat: 'opal', color: '#F3EFF4' }),
  o(7, 'citrine', 'Citrine', 'small daily joys', { group: G1, month: 'November', shape: 'facet', mat: 'glass', color: '#EDB940' }),
  o(18, 'turquoise', 'Turquoise', 'a safe journey', { group: G1, month: 'December', shape: 'round', mat: 'veined', color: '#3EB7B0' }),
  o(27, 'tanzanite', 'Tanzanite', 'rare, and found once', { group: G1, month: 'December', shape: 'bicone', mat: 'glass', color: '#5B4FC9' }),
  // Soft & warm
  o(28, 'baroque', 'Baroque pearl', 'beautiful because it is uneven', { group: G2, shape: 'baroque', mat: 'pearl', color: '#F1E8DE' }),
  o(31, 'shell', 'Mother-of-pearl', 'a home you can carry', { group: G2, shape: 'disc', mat: 'shell', color: '#F4EEF0' }),
  o(20, 'amber', 'Amber', 'a moment kept warm', { group: G2, shape: 'round', mat: 'amber', color: '#E08A1E' }),
  o(3, 'rose', 'Rose quartz', 'tenderness', { group: G2, shape: 'round', mat: 'stone', color: '#F2C6CF' }),
  o(30, 'morganite', 'Morganite', 'love, without fear', { group: G2, shape: 'bicone', mat: 'glass', color: '#F0B2A6' }),
  o(11, 'frost', 'Frosted glass', 'a soft, quiet light', { group: G2, shape: 'round', mat: 'frost', color: '#EEF2F8' }),
  // Stones that catch light
  o(19, 'labradorite', 'Labradorite', 'a flash of light when you least expect it', { group: G3, shape: 'round', mat: 'labra', color: '#5E6670' }),
  o(24, 'sunstone', 'Sunstone', 'warmth on a cold day', { group: G3, shape: 'round', mat: 'glitter', color: '#E8925A' }),
  o(2, 'clear', 'Clear crystal', 'nothing hidden between us', { group: G3, shape: 'facet', mat: 'glass', color: '#F4F8FF' }),
  o(25, 'fluorite', 'Fluorite', 'a clear head', { group: G3, shape: 'facet', mat: 'banded', bands: ['#B9A2E8', '#E9F3F0', '#8FD1B4', '#C9B9F2'], color: '#C6B8EE' }),
  o(10, 'smoky', 'Smoky quartz', 'holding the hard days', { group: G3, shape: 'facet', mat: 'glass', color: '#86766A' }),
  // Earth stones
  o(8, 'jade', 'Pale jade', 'growing, steadily', { group: G4, shape: 'round', mat: 'stone', color: '#B9DDB9' }),
  o(12, 'lapis', 'Lapis', 'the truth, told kindly', { group: G4, shape: 'round', mat: 'glitter', color: '#34509C' }),
  o(21, 'tiger', "Tiger's eye", 'steady courage', { group: G4, shape: 'round', mat: 'banded', bands: ['#5C3612', '#B8792A', '#E2B154', '#8A5420'], color: '#B8792A' }),
  o(23, 'malachite', 'Malachite', 'change, gently', { group: G4, shape: 'round', mat: 'banded', bands: ['#0E5A3A', '#2F9E6A', '#7ED3A2', '#1B7A4C'], color: '#2F9E6A' }),
  o(26, 'aventurine', 'Green aventurine', 'a little luck', { group: G4, shape: 'round', mat: 'glitter', color: '#5FA36A' }),
  o(22, 'onyx', 'Black onyx', 'strength, quietly', { group: G4, shape: 'round', mat: 'onyx', color: '#17161C' })
];
const beadSlot = k => ({ title: `Bead ${k}`, prompt: `Bead ${k} of 6 on the strand.`, options: BEADS, grouped: true });

export const slots = {
  silk: {
    title: 'Silk', prompt: 'What silk is the pouch made of?',
    options: [
      o(1, 'ivory', 'Ivory silk', 'a clean beginning', { color: '#F1E9DC', bg: ['#FBF7F0', '#EDE4D6'] }),
      o(2, 'blush', 'Blush pink', 'warmth, a little shy', { color: '#EBB9C2', bg: ['#FCF1F2', '#F0DADF'] }),
      o(3, 'lilac', 'Lilac', 'dreaming', { color: '#C6B5E6', bg: ['#F5F1FB', '#E3DCF1'] }),
      o(4, 'indigo', 'Deep indigo', 'depth, and night', { color: '#2F3A78', bg: ['#262B4F', '#121530'], dark: true }),
      o(5, 'sage', 'Sage', 'rest', { color: '#AFC5A6', bg: ['#F3F6EF', '#DFE7D9'] }),
      o(6, 'vermilion', 'Vermilion', 'protection, the old way', { color: '#C8463B', bg: ['#FBF2EE', '#EED9D2'] }),
      o(7, 'sky', 'Pale sky', 'open air', { color: '#B7D3EE', bg: ['#F1F7FC', '#DCE8F4'] })
    ]
  },
  motif: {
    title: 'Stitched motif', prompt: 'What is stitched on the pouch?',
    options: [
      o(1, 'plain', 'Plain silk', 'some things are better unsaid'),
      o(2, 'crescent', 'Crescent', 'a light for the dark hours'),
      o(3, 'blossom', 'Plum blossom', 'the first flower, in the cold'),
      o(4, 'wave', 'Wave', 'going out, and coming back'),
      o(5, 'crane', 'Crane', 'a long life, together'),
      o(6, 'star', 'Star', 'a fixed point to find')
    ]
  },
  cord: {
    title: 'Cord', prompt: 'What cord ties the pouch?',
    options: [
      o(1, 'red', 'Red cord', 'the red thread between two people', { color: '#B8343A' }),
      o(2, 'gold', 'Gold cord', 'something worth keeping', { color: '#D3A94F' }),
      o(3, 'white', 'White cord', 'a promise kept simply', { color: '#F4F1EA' }),
      o(4, 'navy', 'Navy cord', 'steady, like the night', { color: '#2C3566' }),
      o(5, 'pink', 'Pink cord', 'fondness', { color: '#E9A3B5' }),
      o(6, 'moss', 'Moss cord', 'roots', { color: '#6F8B5E' })
    ]
  },
  metal: {
    title: 'Metal', prompt: 'What is the metal?',
    options: [
      o(1, 'silver', 'Bright silver', 'clear, and plain', { color: '#D9DCE2', ink: '#5F6475' }),
      o(2, 'gold', 'Soft gold', 'a warmth that lasts', { color: '#E6C27A', ink: '#7A5E2A' }),
      o(3, 'rose', 'Rose gold', 'tenderness that wears well', { color: '#E9B39E', ink: '#7C4E45' }),
      o(4, 'brass', 'Antique brass', 'as if it was always there', { color: '#B8975E', ink: '#5E4A2A' })
    ]
  },
  charm: {
    title: 'Charm', prompt: 'What hangs beside the pouch?',
    options: [
      o(1, 'moon', 'Crescent moon', "I'm here at night too", { mat: 'metal' }),
      o(2, 'star', 'Star', 'something to steer by', { mat: 'metal' }),
      o(3, 'heart', 'Heart', 'plainly said', { mat: 'metal' }),
      o(4, 'butterfly', 'Glass butterfly', 'changing, and staying', { mat: 'glass', color: '#EAF2FF' }),
      o(5, 'key', 'Little key', 'you have one', { mat: 'metal' }),
      o(6, 'bell', 'Small bell', 'so I hear you coming', { mat: 'metal' }),
      o(7, 'flower', 'White flower', 'something that keeps opening', { mat: 'frost', color: '#FBFBFD' }),
      o(8, 'leaf', 'Green leaf', 'new things', { mat: 'glass', color: '#9FCB8E' }),
      o(9, 'cherry', 'Cherries', 'a pair, always', { mat: 'glass', color: '#C8283A' })
    ]
  },
  bead1: beadSlot(1), bead2: beadSlot(2), bead3: beadSlot(3), bead4: beadSlot(4), bead5: beadSlot(5), bead6: beadSlot(6)
};

export const text = {
  word: { label: 'One word of its name', hint: 'the two words become what the talisman is called, e.g. "Quiet" + "Courage"', max: 24 },
  line: { max: 120 },
  why: { label: 'Why you chose these', hint: 'one sentence, sealed with your choice', max: 200 },
  wish: { label: 'A line for the pouch', hint: 'optional; folded inside the pouch until the very end', max: 200 }
};

export const defaultHumanHalf = 'silk';

export function slotsOf(half) { return [...halves[half].slots, ...shared]; }
export function other(half) { return half === 'silk' ? 'metal' : 'silk'; }
export function halfOfSlot(slot) { return halves.silk.slots.includes(slot) ? 'silk' : halves.metal.slots.includes(slot) ? 'metal' : null; }

export function option(slot, value) {
  const list = slots[slot]?.options || [];
  const v = String(value ?? '').trim().toLowerCase();
  if (!v) return null;
  if (/^\d+$/.test(v)) return list.find(x => x.n === Number(v)) || null;
  const words = v.replace(/[_-]+/g, ' ');
  return list.find(x => x.id === v || x.name.toLowerCase() === words) || null;
}

function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map(sh => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t));
  return '#' + c.map(x => x.toString(16).padStart(2, '0')).join('');
}

const low = s => s.charAt(0).toLowerCase() + s.slice(1);
const p_charm = p => p.charm.name.toLowerCase();
const hasBead = (p, id) => [1, 2, 3, 4, 5, 6].some(k => p['bead' + k].id === id);
// Named meetings between the two halves. Each one names both people and changes nothing they chose.
const RESONANCES = [
  { id: 'same-moon', when: p => p.motif.id === 'crescent' && p.charm.id === 'moon', say: (s, m) => `The same moon twice: ${s} stitched it in silk, ${m} cast it in metal.` },
  { id: 'same-star', when: p => p.motif.id === 'star' && p.charm.id === 'star', say: (s, m) => `The same star twice: ${s} stitched it, ${m} cast it.` },
  { id: 'moonstone-moon', when: p => p.charm.id === 'moon' && hasBead(p, 'moonstone'), say: (s, m) => `The moonstone on the strand catches the light of ${m}'s crescent.` },
  { id: 'heart-rose', when: p => p.charm.id === 'heart' && hasBead(p, 'rose'), say: (s, m) => `Rose quartz on the strand, and ${m}'s heart beside the pouch: it says the same thing twice.` },
  { id: 'star-citrine', when: p => p.charm.id === 'star' && hasBead(p, 'citrine'), say: () => `The citrine and the star keep the same small gold light.` },
  { id: 'leaf-jade', when: p => p.charm.id === 'leaf' && hasBead(p, 'jade'), say: () => `Pale jade and a green leaf: everything on it is growing.` },
  { id: 'red-thread', when: p => p.cord.id === 'red', say: (s, m) => `${s}'s red cord is the thread that holds ${m}'s charm to the pouch.` },
  { id: 'key-pouch', when: p => p.charm.id === 'key', say: (s, m) => `${m}'s little key hangs beside ${s}'s pouch, as if it opens it.` },
  { id: 'bell-pouch', when: p => p.charm.id === 'bell', say: (s, m) => `${m}'s bell rests against ${s}'s pouch; it rings softly when you walk.` },
  { id: 'crane-wave', when: p => p.motif.id === 'crane' && p.charm.id === 'butterfly', say: (s, m) => `${s}'s crane and ${m}'s butterfly: two things that fly, on one charm.` },
  { id: 'amber-sun', when: p => hasBead(p, 'amber') && hasBead(p, 'sunstone'), say: () => `Amber and sunstone: two small, kept warmths.` },
  { id: 'labradorite-moon', when: p => hasBead(p, 'labradorite') && ['moon', 'star'].includes(p.charm.id), say: (s, m, p) => `The labradorite flashes blue whenever ${m}'s ${p_charm(p)} turns.` },
  { id: 'pearls', when: p => hasBead(p, 'pearl') && hasBead(p, 'baroque'), say: () => `A round pearl and an uneven one: both pearls, both right.` },
  { id: 'gold-gold', when: p => p.cord.id === 'gold' && ['gold', 'brass'].includes(p.metal.id), say: () => `Gold cord and warm metal: it reads as one piece.` }
];

export function merge(h, a, ctx = {}) {
  const side = { [h.half]: h, [a.half]: a };
  const by = { [h.half]: 'human', [a.half]: 'ai' };
  const p = {};
  for (const half of ['silk', 'metal']) for (const slot of halves[half].slots) p[slot] = side[half].picks[slot];
  const S = side.silk, M = side.metal;

  // The strand: positions 1..6 alternate silk (odd) and metal (even).
  const strand = [1, 2, 3, 4, 5, 6].map(k => ({ pos: k, ...p['bead' + k], by: by[k % 2 ? 'silk' : 'metal'] }));

  const resonances = [];
  // Echo: the same bead chosen on both sides, without knowing.
  const silkBeads = new Set([1, 3, 5].map(k => p['bead' + k].id));
  const shared = [...new Set([2, 4, 6].map(k => p['bead' + k].id).filter(id => silkBeads.has(id)))];
  for (const id of shared) resonances.push({ id: 'echo-' + id, text: `You both chose ${low(BEADS.find(b => b.id === id).name)} without knowing; it sits on both sides of the strand.` });
  // Birthstones: if a month appears on both sides, say so.
  const months = side => new Set((side === 'silk' ? [1, 3, 5] : [2, 4, 6]).map(k => p['bead' + k].month).filter(Boolean));
  const ms = months('silk'), mm = months('metal');
  const bothMonths = [...ms].filter(m => mm.has(m));
  if (bothMonths.length) resonances.push({ id: 'month', text: `Two stones from ${bothMonths.join(' and ')} met on the strand.` });
  for (const r of RESONANCES) if (r.when(p)) resonances.push({ id: r.id, text: r.say(S.name, M.name, p) });

  const first = ctx.order === 'ai-first' ? a : h, second = first === h ? a : h;
  const words = [first, second].map(x => ({ text: x.word || '', by: x === h ? 'human' : 'ai' })).filter(w => w.text);
  const silk = p.silk, metal = p.metal;

  return {
    recipe: code,
    title: words.map(w => w.text).join(' ') || 'An unnamed charm',
    words,
    halves: { silk: by.silk, metal: by.metal },
    picks: Object.fromEntries(Object.entries(p).map(([slot, opt]) => [slot, { ...opt, by: by[halfOfSlot(slot)] }])),
    strand,
    echo: shared.length > 0,
    echoBeads: shared,
    palette: {
      bg: silk.bg, dark: !!silk.dark, ink: silk.dark ? '#E6E3FF' : mix(metal.ink, '#3A3350', 0.4),
      silk: silk.color, cord: p.cord.color, metal: metal.color, light: '#FFFFFF'
    },
    flags: {},
    resonances,
    lines: [
      { key: 'blessing', label: halves.silk.line.label, text: S.line || '', by: by.silk },
      { key: 'promise', label: halves.metal.line.label, text: M.line || '', by: by.metal }
    ],
    ledger: ['silk', 'metal'].flatMap(half => halves[half].slots.map(slot => ({ slot, title: slots[slot].title, name: p[slot].name, meaning: p[slot].meaning, by: by[half] }))),
    why: { human: h.why || '', ai: a.why || '' },
    wish: { human: h.wish || '', ai: a.wish || '' },
    chance: { human: h.chance || [], ai: a.chance || [] }
  };
}

/** The reveal: metal and silk first, then the strand bead by bead (alternating), then the charm and the pouch's details. */
export function revealSteps(spec) {
  const pick = slot => ({ kind: 'pick', slot, title: slots[slot].title, pick: spec.picks[slot], by: spec.picks[slot].by });
  const steps = [pick('metal'), pick('silk')];
  for (let k = 1; k <= 6; k++) steps.push({ ...pick('bead' + k), title: `Bead ${k}` });
  steps.push(pick('charm'), pick('motif'), pick('cord'));
  for (const r of spec.resonances) steps.push({ kind: 'resonance', text: r.text });
  steps.push({ kind: 'name', words: spec.words, title: spec.title });
  steps.push({ kind: 'lines', lines: spec.lines });
  return steps;
}
