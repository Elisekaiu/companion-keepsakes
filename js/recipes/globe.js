// Memory Snow Globe — recipe v1.
// A real or half-real moment under glass. The moment itself is named up front (the shared "what it is for" line),
// so two blind halves still build the same memory:
//   MOMENT   — where it was, the hour and its light, and the weather inside the glass;
//   KEEPSAKE — the base, the glass, and a finishing touch.
// Each side also places one small thing inside (both appear; the same pick becomes a pair).

import { joinWords, cap, enOf, zhOf } from './util.js';

export const id = 'globe';
export const version = 1;
export const code = 'globe1';
export const title = 'Memory Snow Globe';
export const tagline = 'A moment, kept under glass. Shake it and it happens again.';
export const noun = 'a snow globe';
export const soloOrder = ['place', 'hour', 'weather', 'base', 'glass', 'finish', 'object', 'object#2'];
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
const zn = (slot, o) => zh.slots[slot].options[o.id][0];
const either = (p, id) => p.objectH.id === id || p.objectA.id === id;
const DARKISH = new Set(['blue', 'night']);
// Named meetings. m = the moment side's name, k = the keepsake side's name (both '' in solo).
const RESONANCES = [
  { id: 'snow-cabin', when: p => p.weather.id === 'snow' && p.place.id === 'cabin', flag: 'snowRoof',
    say: (m) => `Snow on ${enOf(m)}cabin roof, and the window still lit.`, zh: (m) => `雪落在${zhOf(m)}小木屋屋顶上，窗户还亮着。` },
  { id: 'snowman-snow', when: p => p.weather.id === 'snow' && either(p, 'snowman'), say: () => 'The snowman finally has snow to stand in.', zh: () => '小雪人终于有雪可以站了。' },
  { id: 'rain-umbrella', when: p => p.weather.id === 'rain' && either(p, 'umbrella'), say: () => 'It rained, and someone had brought the umbrella.', zh: () => '下雨了，刚好有人带了伞。' },
  { id: 'lantern-dark', when: p => DARKISH.has(p.hour.id) && either(p, 'lantern'), flag: 'lanternGlow', say: () => 'The paper lantern is brighter now that it is dark.', zh: () => '天黑了，纸灯笼就更亮了。' },
  { id: 'boat-water', when: p => either(p, 'boat') && ['pier', 'seaside'].includes(p.place.id), say: () => 'The paper boat found water.', zh: () => '纸船找到了水。' },
  { id: 'cups-window', when: p => either(p, 'cups') && ['window', 'bookshop', 'cabin'].includes(p.place.id), say: () => 'Two cups, still warm, by the window.', zh: () => '两杯茶，还温着，就在窗边。' },
  { id: 'key-record', when: p => p.finish.id === 'key' && either(p, 'record'),
    say: (m, k) => `${cap(enOf(k))}wind-up key and the record player: wind it, and it plays that song.`, zh: (m, k) => `${zhOf(k)}发条钥匙和唱片机：拧一拧，它就放起那首歌。` },
  { id: 'gold-golden', when: p => p.weather.id === 'gold' && p.hour.id === 'golden', say: () => 'Golden dust in the golden hour: everything is gold.', zh: () => '金色时刻里的金色微尘：一切都是金色的。' },
  { id: 'stars-roof', when: p => p.weather.id === 'stars' && (p.place.id === 'rooftop' || p.hour.id === 'night'), say: () => 'Falling stars, and nobody else looking up.', zh: () => '星星在落，而没有别人抬头。' },
  { id: 'petals-garden', when: p => p.weather.id === 'petals' && ['garden', 'bench'].includes(p.place.id), say: (m) => `The petals are falling from ${enOf(m)}tree.`, zh: (m) => `花瓣从${zhOf(m)}树上落下来。` },
  { id: 'fireflies-dusk', when: p => p.weather.id === 'fireflies' && DARKISH.has(p.hour.id), say: () => 'The fireflies came out right on time.', zh: () => '萤火虫准时出来了。' },
  { id: 'bicycle-street', when: p => either(p, 'bicycle') && ['street', 'platform'].includes(p.place.id), say: () => 'A bicycle leaning there, as if someone missed the last train and rode home.', zh: () => '一辆自行车靠在那里，好像有人错过了末班车，骑车回了家。' },
  { id: 'flowers-bouquet', when: p => p.finish.id === 'flowers' && either(p, 'bouquet'), say: () => 'Flowers outside the glass and flowers inside it.', zh: () => '玻璃外有花，玻璃里也有花。' }
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
  if (echo) resonances.push(ctx.solo
    ? { id: 'echo', text: `${p.objectH.name}, placed twice. There are two of them now.`, zh: `${zn('object', p.objectH)}放了两次。现在有两个了。` }
    : { id: 'echo', text: `You both placed ${low(p.objectH)} without knowing. There are two of them now.`, zh: `你们不约而同地放进了${zn('object', p.objectH)}。现在有两个了。` });
  const flags = {};
  const mn = ctx.solo ? '' : Mo.name, kn = ctx.solo ? '' : Ke.name;
  for (const r of RESONANCES) if (r.when(p)) { if (r.flag) flags[r.flag] = true; resonances.push({ id: r.id, text: r.say(mn, kn, p), zh: r.zh(mn, kn, p) }); }

  const first = ctx.order === 'ai-first' ? a : h, second = first === h ? a : h;
  const words = [first, second].map(x => ({ text: x.word || '', by: x === h ? 'human' : 'ai' })).filter(w => w.text);
  const hour = p.hour;
  return {
    recipe: code,
    title: joinWords(words.map(w => w.text)) || 'An unnamed moment',
    words,
    halves: { moment: by.moment, keepsake: by.keepsake },
    picks: Object.fromEntries(['place', 'hour', 'weather', 'base', 'glass', 'finish'].map(slot => [slot, { ...p[slot], by: by[halfOfSlot(slot)] }])),
    objects: [{ ...p.objectH, by: 'human' }, { ...p.objectA, by: 'ai' }],
    echo,
    palette: { bg: hour.bg, dark: !!hour.dark, ink: hour.dark ? '#E6E3FF' : '#5B5470', light: hour.light, amb: hour.amb, lamps: !!hour.lamps, base: p.base.color },
    flags,
    resonances,
    lines: [
      { key: 'moment', half: 'moment', label: halves.moment.line.label, text: Mo.line || '', by: by.moment },
      { key: 'engraving', half: 'keepsake', label: halves.keepsake.line.label, text: Ke.line || '', by: by.keepsake }
    ],
    ledger: [
      ...halves.moment.slots.map(slot => ({ slot, id: p[slot].id, title: slots[slot].title, name: p[slot].name, meaning: p[slot].meaning, by: by.moment })),
      ...halves.keepsake.slots.map(slot => ({ slot, id: p[slot].id, title: slots[slot].title, name: p[slot].name, meaning: p[slot].meaning, by: by.keepsake })),
      { slot: 'object', id: p.objectH.id, pick: 'object-human', title: 'Placed inside', name: p.objectH.name, meaning: p.objectH.meaning, by: 'human' },
      { slot: 'object', id: p.objectA.id, pick: 'object-ai', title: 'Placed inside', name: p.objectA.name, meaning: p.objectA.meaning, by: 'ai' }
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

/* ------------------------------------------------------------------ 中文 */
export const zh = {
  title: '记忆雪花球', noun: '一个雪花球', tagline: '把一个瞬间放进玻璃里。摇一摇，它就又发生一次。',
  hand: 'a memory under glass',
  card: '先说好是哪一刻，再一人填一半。把它放进玻璃里，摇一摇，它就又发生一次。',
  cardSolo: '把一个真实的瞬间放进玻璃里：在哪里、几点、下着什么。摇一摇，它就又发生一次。',
  halves: {
    moment: { title: '那一刻', blurb: '在哪里、几点、什么样的光，以及玻璃里落下的东西', line: { label: '那时正在发生什么', hint: '一句话，写下你记得的那一刻' } },
    keepsake: { title: '纪念品', blurb: '它立在什么底座上、玻璃的形状，以及最后的一点装饰', line: { label: '刻在底座上的话', hint: '一句短短的话，会刻在名字和日期下面' } }
  },
  sharedBlurb: '再各放一件小东西进去', waitingLine: '玻璃里，还空着',
  themeName: '那一刻', themePrompt: { label: '这是哪一刻？（推荐写下来）', placeholder: '比如：那天我们错过了末班车，一路走回家' },
  themePromptSolo: { label: '这是哪一刻？（可以不填）', placeholder: '比如：第一次一个人去看海' },
  pairTitle: '放进去的东西', pairLede: '你们各放一件小东西进去。如果放了一样的，就会有两个。', pairLedeSolo: '放两件小东西进去。',
  echoText: '你们不约而同地放了同一样东西。',
  wishTitle: n => n === 2 ? '还有两句话，封在底座下面' : '还有一句话，封在底座下面',
  text: { word: { label: '名字里的一个词', hint: '两个词合在一起，就是它的名字，会刻在底座上' }, wish: { label: '一句藏起来的话', hint: '可以不写；它会封在底座下面，直到最后' } },
  slots: {
    place: { title: '地点', prompt: '那是在哪里？', options: { cabin: ['森林里的小木屋', '一个可以回来的温暖地方'], street: ['路灯下的街道', '慢慢走回家'], seaside: ['海边的房子', '整夜都是海的声音'], platform: ['火车站台', '到达，或是送别'], bench: ['树下的长椅', '坐在一起，话不多'], rooftop: ['挂着小灯的屋顶', '城市上面，只有我们'], bookshop: ['小书店', '偶然遇见的一个下午'], pier: ['湖边栈桥和小船', '安静的水，长长的谈话'], garden: ['花园的门', '种下的东西，在等着'], window: ['窗边的座位', '一起看天气'] } },
    hour: { title: '时刻', prompt: '那是几点？光是什么样的？', options: { dawn: ['清晨', '一天还没决定好'], afternoon: ['慢悠悠的午后', '哪里都不用去'], golden: ['金色时刻', '一切短暂地变成金色'], blue: ['蓝调时刻', '灯一盏盏亮起来'], night: ['深夜', '世界睡了，除了我们'] } },
    weather: { title: '玻璃里', prompt: '摇一摇，会落下什么？', options: { snow: ['初雪', '一切安静又崭新'], rain: ['细雨', '待在屋里，或者不介意淋雨'], petals: ['樱花花瓣', '那是春天，或者感觉像'], leaves: ['秋天的落叶', '一个季节在转身'], fireflies: ['萤火虫', '互相回应的小光'], stars: ['坠落的星星', '够许好几个愿'], gold: ['金色微尘', '那天的光，被留下了'], bubbles: ['泡泡', '难得的轻盈'] } },
    base: { title: '底座', prompt: '它立在什么上面？', options: { walnut: ['胡桃木', '温暖，经得起时间'], marble: ['白色大理石', '安静而清凉'], brass: ['黄铜', '已经像一件传家宝'], porcelain: ['描金边的瓷', '精致，被小心收着'], oak: ['浅色橡木', '简单，像一个星期天'], lacquer: ['夜蓝色漆', '深夜长谈的颜色'] } },
    glass: { title: '玻璃', prompt: '玻璃是什么形状？', options: { sphere: ['经典的圆球', '一直以来的样子'], dome: ['钟形罩', '被好好陈列着'], drop: ['高高的泪滴', '一个停留了很久的瞬间'], orb: ['底座上的小圆球', '小小的，被高高托起'] } },
    finish: { title: '最后的装饰', prompt: '还要加一点什么吗？', options: { none: ['就这样', '这样就够了'], bow: ['一个缎带蝴蝶结', '是礼物，不是买来的'], pearls: ['一圈珍珠', '边缘上的耐心'], band: ['一道细细的金边', '一个安静的承诺'], flowers: ['压花', '那天留下来的东西'], key: ['上发条的钥匙', '它会放一首只有我们知道的歌'] } },
    object: { title: '放进去的东西', prompt: '放一件小东西进去。', options: { umbrella: ['一把撑开的伞', '伞下站得下两个人'], cups: ['两杯茶', '适合聊天的晚上'], letter: ['一封封好的信', '留到以后的话'], bicycle: ['一辆自行车', '绕远路回家'], cat: ['睡着的猫', '没有什么急事'], lantern: ['纸灯笼', '被带着走的光'], snowman: ['小雪人', '一起堆的'], books: ['一摞书', '一起读过的故事'], boat: ['纸船', '带着一个愿望出发'], bouquet: ['一小束花', '没有任何理由'], record: ['唱片机', '我们的歌'] } }
  }
};
