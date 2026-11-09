// Companion Keepsakes — the playable flow.
// choose -> seal (hold) -> hand the invitation to your companion -> their link arrives ("something was added")
// -> Open Together -> reveal, one sealed pick at a time -> explore -> keep it on the shelf.
import { newRound, sealHuman, readAiCode, acceptAi, roundFromAi, status, mergeRound, invitation, revealCard } from '../engine/round.js';
import { toLink, fromLink, toKeepsake } from '../engine/keepsake.js';
import { softDecode, toB64url, fromB64url } from '../engine/codec.js';
import { recipeByCode } from '../recipes/index.js';
import { store } from './store.js';
import { PROTOCOL_URL, SITE_URL } from '../config.js';

const app = document.getElementById('app');
const stageHost = document.getElementById('stage');
const params = new URLSearchParams(location.search);
const EMBED = params.get('embed');               // "view" (read-only, e.g. inside a cabinet) or "play"
const HOST = safeOrigin(params.get('host'));     // a parent page that wants the keepsake when it is kept
const here = () => location.origin + location.pathname;
// Hosts may prefill the two names (e.g. ?you=Mira&companion=Orin); the person can still change them.
{ const you = (params.get('you') || '').slice(0, 24), comp = (params.get('companion') || '').slice(0, 24); const n = store.names();
  if (you && !n.human) store.setNames({ human: you }); if (comp && !n.ai) store.setNames({ ai: comp }); }
const site = () => (location.protocol.startsWith('http') && !/localhost|127\.0\.0\.1/.test(location.host)) ? here() : SITE_URL;

/* ------------------------------------------------------------------ tiny DOM helpers */
function h(tag, attrs = {}, ...kids) {
  const [name, ...cls] = tag.split('.');
  const n = document.createElement(name || 'div');
  if (cls.length) n.className = cls.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'on') for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn);
    else if (k === 'class') n.className += ' ' + v;
    else if (k === 'style') n.style.cssText = v;
    else if (k === 'html') n.innerHTML = v; // only for our own static markup
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(3)) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(String(k)));
  return n;
}
function put(node, ...kids) { node.append(...kids.flat(3).filter(k => k != null && k !== false)); return node; }
function screen(...kids) { document.querySelectorAll('.sheet').forEach(x => x.remove()); const s = h('section.screen', {}, ...kids); app.replaceChildren(s); window.scrollTo(0, 0); return s; }
function toast(msg) { const t = h('div.toast', { role: 'status' }, msg); document.body.append(t); setTimeout(() => t.remove(), 2400); }
async function copy(text, done = 'Copied') {
  try { await navigator.clipboard.writeText(text); toast(done); }
  catch { const ta = h('textarea', { style: 'position:fixed;opacity:0' }); ta.value = text; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast(done); }
}
function safeOrigin(s) { try { const u = new URL(s); return /^https?:$/.test(u.protocol) ? u.origin : null; } catch { return null; } }
const fmtDate = iso => { const d = new Date(iso); return Number.isFinite(d.getTime()) ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''; };
const setHash = (hash) => history.replaceState(null, '', location.pathname + location.search + hash);
const names = () => { const n = store.names(); return { human: n.human || 'You', ai: n.ai || 'your companion' }; };

/* ------------------------------------------------------------------ hold-to-confirm */
function holdButton(label, { ms = 1100, side = '', onDone }) {
  const C = 2 * Math.PI * 64;
  const b = h('button.hold', { type: 'button', class: side, 'aria-label': label + ' (press and hold)' },
    h('span', { html: `<svg viewBox="0 0 132 132"><circle class="track" cx="66" cy="66" r="64"/><circle class="fill" cx="66" cy="66" r="64"/></svg>` }).firstChild,
    h('span.face', {}, label));
  const fill = b.querySelector('circle.fill');
  fill.style.strokeDasharray = C; fill.style.strokeDashoffset = C;
  let t0 = 0, raf = 0, done = false;
  const tick = () => { const k = Math.min(1, (performance.now() - t0) / ms); fill.style.strokeDashoffset = C * (1 - k); if (k >= 1) { finish(); return; } raf = requestAnimationFrame(tick); };
  const start = e => { if (done) return; e.preventDefault(); t0 = performance.now(); b.classList.add('is-holding'); navigator.vibrate?.(8); raf = requestAnimationFrame(tick); };
  const stop = () => { if (done) return; cancelAnimationFrame(raf); b.classList.remove('is-holding'); fill.style.strokeDashoffset = C; };
  const finish = () => { done = true; cancelAnimationFrame(raf); navigator.vibrate?.([12, 40, 18]); onDone(); };
  b.addEventListener('pointerdown', start); b.addEventListener('pointerup', stop); b.addEventListener('pointerleave', stop); b.addEventListener('pointercancel', stop);
  b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); } }); // keyboard: no hold needed
  b.addEventListener('contextmenu', e => e.preventDefault());
  return b;
}

/* ------------------------------------------------------------------ wax seal */
function wax(fp, who, side, { stamp = false, size = 120 } = {}) {
  const pts = [];
  for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2, r = 46 + (i % 2 ? 3 : 0) + Math.sin(i * 1.7) * 1.4; pts.push((50 + Math.cos(a) * r).toFixed(1) + ',' + (50 + Math.sin(a) * r).toFixed(1)); }
  const svg = `<svg viewBox="0 0 100 100"><defs><radialGradient id="wg${fp}${side}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><polygon points="${pts.join(' ')}" fill="var(--wax)"/><circle cx="50" cy="50" r="33" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.2"/><circle cx="50" cy="50" r="29" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1"/><polygon points="${pts.join(' ')}" fill="url(#wg${fp}${side})"/></svg>`;
  return h('div.wax', { class: side + (stamp ? ' stamp' : ''), style: `--s:${size}px` }, h('span', { html: svg }).firstChild, h('span.fp', {}, fp, h('small', {}, who)));
}

/* ------------------------------------------------------------------ router */
async function route() {
  const raw = softDecode(location.hash.slice(1));
  stageHost.classList.add('hidden');
  if (raw.startsWith('ai~')) return handleAi(raw);
  if (raw.startsWith('k=')) { const r = fromLink(raw); return r ? explore(r, { visiting: true }) : home('That keepsake link could not be read. It may have been cut off.'); }
  if (raw.startsWith('m=')) return importMine(raw.slice(2));
  if (raw.startsWith('r=')) { const r = store.round(raw.slice(2)); return r ? resume(r) : home('That round is not in this browser.'); }
  if (raw === 'shelf') return shelf();
  if (raw === 'new') return home();
  if (raw.startsWith('new=')) return chooseHalf(raw.slice(4));
  return home();
}
window.addEventListener('hashchange', route);

function resume(r) {
  setHash('#r=' + r.id);
  const st = status(r);
  if (st === 'choosing' || st === 'waiting-human') return choose(r);
  if (st === 'waiting-ai') return waiting(r);
  if (st === 'ready') return arrived(r);
  return explore(r);
}

/* ------------------------------------------------------------------ home */
function home(error) {
  setHash('');
  const n = store.names();
  const nameIn = (k, label, ph) => h('div.field', {}, h('label', { for: 'n-' + k }, label),
    h('input.input', { id: 'n-' + k, value: n[k] || '', placeholder: ph, maxlength: 24, on: { change: e => store.setNames({ [k]: e.target.value.trim() }) } }));
  const pending = store.rounds().filter(r => !r.openedAt);
  const kept = store.shelf().length;
  const paste = h('input.input', { placeholder: 'Paste a link or code from your companion', 'aria-label': 'Companion link' });
  screen(
    h('div.brand', {}, h('b', {}, 'Companion Keepsakes'), h('span.hand', { style: 'color:var(--ink-3)' }, 'made by two')),
    h('h1.display', {}, 'Make something ', h('em', {}, 'together'), '.'),
    h('p.lede', {}, 'You choose half and seal it. Your companion chooses the other half by reading, not by looking at your screen. Neither of you sees the other’s choices until you open it together.'),
    error ? h('p.warn', {}, error) : null,
    h('div.names', {}, nameIn('human', 'You', 'Your name'), nameIn('ai', 'Your companion', 'Their name')),
    h('div.recipes', {},
      h('button.recipe', { type: 'button', on: { click: () => { location.hash = 'new=planet1'; } } },
        h('span.art', { html: planetArt() }), h('span', {}, h('h3', {}, 'Tiny Imaginary Planet'), h('p', {}, 'A small world that obeys only the two of you. You take the ground or the sky.'))),
      h('button.recipe', { type: 'button', on: { click: () => { location.hash = 'new=talisman1'; } } },
        h('span.art', { html: charmArt() }), h('span', {}, h('h3', {}, 'Two-Person Talisman'), h('p', {}, 'A small charm to carry. One bead each, in turn, and a silk pouch for two wishes.'))),
      h('div.recipe', { 'aria-disabled': 'true' }, h('span.art', { html: globeArt() }), h('span', {}, h('h3', {}, 'Memory Snow Globe'), h('p', {}, 'A real moment, kept under glass.')), h('span.tag', {}, 'in the workshop'))
    ),
    h('div.stack', {},
      h('div.row', {}, paste, h('button.btn.small', { type: 'button', on: { click: () => takeCode(paste.value) } }, 'Open')),
      h('div.row', {}, h('button.btn.ghost.small', { type: 'button', on: { click: () => { location.hash = 'shelf'; } } }, `Your shelf${kept ? ' · ' + kept : ''}`))
    ),
    pending.length ? h('div.pending', {}, h('div.eyebrow', {}, 'In progress'), h('ul', {}, pending.map(r => h('li', {},
      h('span', {}, h('b', {}, 'Round ' + r.id), ' · ', ({ choosing: 'choosing', 'waiting-human': `${r.names.ai} sealed; your turn`, 'waiting-ai': `waiting for ${r.names.ai}`, ready: 'ready to open' })[status(r)]),
      h('button.btn.small', { type: 'button', on: { click: () => resume(r) } }, 'Open'))))) : null
  );
}

function takeCode(text) {
  const t = softDecode(String(text || ''));
  const ai = t.match(/ai~[^\s)>\]"']+/);
  if (ai) return handleAi(ai[0]);
  const k = t.match(/k=[A-Za-z0-9_-]+/);
  if (k) { const r = fromLink(k[0]); if (r) return explore(r, { visiting: true }); }
  toast('No companion code found in that text.');
}

/* ------------------------------------------------------------------ choosing */
function chooseHalf(code = 'planet1') {
  const R = recipeByCode(code) || recipeByCode('planet1');
  const n = names();
  const what = R.code === 'talisman1' ? 'this talisman' : 'this world';
  screen(
    h('div.eyebrow', {}, R.title),
    h('h1.display', {}, 'Which half is ', h('em', {}, 'yours'), '?'),
    h('p.lede', {}, `${n.ai} will make the other half without seeing yours.`),
    h('div.options', { style: 'grid-template-columns:1fr' }, Object.keys(R.halves).map(half => h('button.opt', { type: 'button', class: 'human', on: { click: () => start(half) } },
      h('b', { style: 'font-size:26px' }, R.halves[half].title), h('span', {}, R.halves[half].blurb + (R.shared.includes('wonder') ? ', plus one wonder' : ''))))),
    h('div.field', {}, h('label', { for: 'theme' }, `What is ${what} for? (optional)`), h('input.input', { id: 'theme', maxlength: 140, placeholder: R.code === 'talisman1' ? 'e.g. for the long trip in March' : 'e.g. for the nights we stay up talking' }), h('small', {}, `${n.ai} will see this line — it is the only thing you share before the reveal.`)),
    h('div.dock', {}, h('div.inner', {}, h('button.btn.ghost', { type: 'button', on: { click: () => home() } }, 'Back')))
  );
  function start(half) {
    const r = newRound({ recipe: R.code, humanHalf: half, theme: document.getElementById('theme').value, names: names() });
    store.saveRound(r);
    choose(r);
  }
}

function choose(round) {
  const R = recipeByCode(round.recipe);
  const half = round.humanHalf;
  const slots = R.slotsOf(half);
  const draft = round.draft || { picks: {}, word: '', line: '', why: '', wish: '' };
  const steps = [...slots, 'words', 'review'];
  let i = Math.min(round.step || 0, steps.length - 1);
  const save = () => store.saveRound({ ...round, draft, step: i });
  setHash('#r=' + round.id);

  function render() {
    const step = steps[i];
    const bar = h('div.steps', { class: 'human' }, steps.map((_, k) => h('i', { class: k <= i ? 'on' : '' })));
    const head = h('div', {},
      h('div.eyebrow', {}, `Your half · ${R.halves[half].title} · Round ${round.id}`), bar,
      round.ai ? h('p.note', {}, `${round.ai.name} has already sealed the ${R.halves[round.ai.half].title.toLowerCase()}. Their choices stay hidden until you open it together.`) : null);
    const back = h('button.btn.ghost', { type: 'button', on: { click: () => { if (i === 0) { round.ai ? home() : chooseHalf(round.recipe); return; } i--; save(); render(); } } }, 'Back');
    if (slots.includes(step)) {
      const S = R.slots[step];
      const next = h('button.btn.primary', { type: 'button', disabled: !draft.picks[step], on: { click: () => { i++; save(); render(); } } }, 'Next');
      screen(head,
        h('h1.display', {}, S.prompt),
        step === 'wonder' ? h('p.lede', {}, 'Both of you place one wonder. If you both choose the same one, it stands twice.') : null,
        h('div.options', { class: 'human' }, S.options.map(o => h('button.opt', {
          type: 'button', 'aria-pressed': String(draft.picks[step] === o.n),
          on: { click: e => { draft.picks[step] = o.n; save(); e.currentTarget.parentNode.querySelectorAll('.opt').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); next.disabled = false; navigator.vibrate?.(5); } }
        }, swatch(step, o), h('span.num', {}, o.n), h('b', {}, o.name), h('span', {}, o.meaning)))),
        h('div.dock', {}, h('div.inner', {}, back, next)));
    } else if (step === 'words') {
      const f = (key, label, hint, max, area) => h('div.field', {}, h('label', { for: 'f-' + key }, label),
        h(area ? 'textarea.input' : 'input.input', { id: 'f-' + key, maxlength: max, value: area ? null : draft[key], on: { input: e => { draft[key] = e.target.value; save(); } } }, area ? draft[key] : null),
        hint ? h('small', {}, hint) : null);
      screen(head,
        h('h1.display', {}, 'Say it ', h('em', {}, 'now'), ', while it is true.'),
        h('p.lede', {}, 'These are sealed with your choices. You will not be able to change them after.'),
        h('div.stack', {},
          f('word', R.text.word.label, R.text.word.hint, R.text.word.max),
          f('line', R.halves[half].line.label, R.halves[half].line.hint, R.text.line.max, true),
          f('why', R.text.why.label, R.text.why.hint, R.text.why.max, true),
          f('wish', R.text.wish.label, R.text.wish.hint, R.text.wish.max, true)),
        h('div.dock', {}, h('div.inner', {}, back, h('button.btn.primary', { type: 'button', on: { click: () => { i++; save(); render(); } } }, 'Review'))));
    } else {
      const rows = slots.map(s => { const o = R.option(s, draft.picks[s]); return h('div', {}, h('dt', {}, R.slots[s].title), h('dd', {}, h('b', {}, o.name), h('span', {}, o.meaning))); });
      const words = [['Name word', draft.word], [R.halves[half].line.label, draft.line], ['Why', draft.why], ['Hidden line', draft.wish ? '••• sealed' : '']]
        .filter(([, v]) => v).map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v)));
      screen(head,
        h('h1.display', {}, 'Your half'),
        h('dl.ledger', {}, rows, words),
        h('div.hold-wrap', { class: 'human' }, holdButton('Hold to seal', { side: 'human', onDone: () => seal() }), h('small', {}, 'Once sealed, it stays exactly like this.')),
        h('div.dock', {}, h('div.inner', {}, back, h('span'))));
    }
  }
  function seal() {
    try {
      let r = sealHuman(round, draft);
      delete r.draft; delete r.step;
      store.saveRound(r);
      r.ai ? arrived(r, { justSealed: true }) : waiting(r, { justSealed: true });
    } catch (e) { toast(e.message); }
  }
  render();
}

function swatch(slot, o) {
  const cols = o.colors || o.bg || (o.color ? [o.color] : null);
  if (!cols) return null;
  return h('span.sw', {}, cols.slice(0, 3).map(c => h('i', { style: 'background:' + c })));
}

/* ------------------------------------------------------------------ waiting for the companion */
function waiting(round, { justSealed = false } = {}) {
  setHash('#r=' + round.id);
  const inv = invitation(round, { site: site(), repo: PROTOCOL_URL });
  const paste = h('textarea.input', { placeholder: `Paste ${round.names.ai}’s reply or link here`, 'aria-label': 'Companion reply' });
  screen(
    h('div.eyebrow', {}, `Round ${round.id} · ${recipeByCode(round.recipe).title}`),
    h('div.seals', {}, h('figure', {}, wax(round.human.fp, round.names.human, 'human', { stamp: justSealed }), h('figcaption', { class: 'human who' }, 'sealed'))),
    h('h1.display', { style: 'text-align:center' }, 'Your half is ', h('em', {}, 'sealed'), '.'),
    h('p.lede', { style: 'text-align:center;margin-inline:auto' }, `Now it is ${round.names.ai}’s turn. Send them this invitation. It carries your seal, not your choices.`),
    h('pre.invite', {}, inv),
    h('div.row', { style: 'justify-content:center;margin:12px 0 4px' }, h('button.btn.primary', { type: 'button', on: { click: () => copy(inv, 'Invitation copied') } }, 'Copy invitation')),
    h('div.waiting', {}, h('div.orb', { 'aria-hidden': 'true' }), h('div.hand', {}, recipeByCode(round.recipe).waitingLine || 'half of it is still unmade'), h('p.note', {}, `When ${round.names.ai} replies with a link, open it here, or paste it below.`)),
    h('div.stack', {}, paste, h('button.btn', { type: 'button', on: { click: () => { const t = softDecode(paste.value), m = t.match(/ai~[^\s)>\]"']+/); m ? handleAi(m[0]) : toast('No companion code in that text.'); } } }, 'Add their half')),
    h('p.note', { style: 'margin-top:22px' }, 'Opening the link on another device? ', h('button.linkish', { type: 'button', on: { click: () => copy(here() + '#m=' + toB64url(round), 'Round link copied — open it there first') } }, 'Copy this round’s link'), '.'),
    h('div.dock', {}, h('div.inner', {}, h('button.btn.ghost', { type: 'button', on: { click: () => home() } }, 'Home')))
  );
}

function importMine(b64) {
  const r = fromB64url(b64);
  if (!r || !r.id || !r.recipe) return home('That round link could not be read.');
  const mine = store.round(r.id);
  if (!mine || (!mine.human && r.human)) store.saveRound(r);
  resume(store.round(r.id));
}

/* ------------------------------------------------------------------ a companion half arrives */
function handleAi(raw) {
  const parsed = readAiCode(raw);
  if (!parsed.ok) return home(parsed.error);
  let r = parsed.roundId ? store.round(parsed.roundId) : null;
  if (r) {
    try { r = acceptAi(r, parsed); } catch (e) { toast(e.message); return resume(r); }
    store.saveRound(r);
    setHash('#r=' + r.id);
    return status(r) === 'ready' ? arrived(r, { justArrived: true }) : resume(r);
  }
  // No local round with that id: the companion started one, or this is another device.
  const nm = store.names();
  const fresh = roundFromAi(parsed, { human: nm.human || 'You', ai: nm.ai || 'Companion' });
  const known = store.round(fresh.id);
  if (known) return resume(known);
  if (parsed.roundId && parsed.echoed) {
    // It answers a round sealed somewhere else.
    return screen(
      h('div.eyebrow', {}, `Round ${parsed.roundId}`),
      h('h1.display', {}, 'This half belongs to a round sealed ', h('em', {}, 'elsewhere'), '.'),
      h('p.lede', {}, `${fresh.names.ai} sealed their half for round ${parsed.roundId}, but your sealed half is not in this browser. Open the round on the device where you sealed it (or use its “round link”), then open this link again.`),
      h('div.row', {}, h('button.btn', { type: 'button', on: { click: () => home() } }, 'Home'),
        h('button.btn.ghost', { type: 'button', on: { click: () => { store.saveRound(fresh); choose(fresh); } } }, 'Start fresh with their half'))
    );
  }
  store.saveRound(fresh);
  setHash('#r=' + fresh.id);
  const R = recipeByCode(fresh.recipe);
  screen(
    h('div.eyebrow', {}, `Round ${fresh.id} · ${R.title}`),
    h('div.seals', {}, h('figure', {}, wax(fresh.ai.fp, fresh.names.ai, 'ai', { stamp: true }), h('figcaption', { class: 'ai who' }, 'sealed'))),
    h('h1.display', { style: 'text-align:center' }, `${fresh.names.ai} has started ${R.noun}.`),
    h('p.lede', { style: 'text-align:center;margin-inline:auto' }, `They sealed the ${R.halves[fresh.ai.half].title.toLowerCase()} before you chose anything. Choose the ${R.halves[fresh.humanHalf].title.toLowerCase()} without seeing theirs.`),
    h('div.row', { style: 'justify-content:center' }, h('button.btn.primary', { type: 'button', on: { click: () => choose(fresh) } }, 'Choose my half'))
  );
}

function arrived(round, { justSealed = false, justArrived = false } = {}) {
  setHash('#r=' + round.id);
  const ai = round.ai;
  const prov = round.order === 'ai-first'
    ? h('p.ok', {}, `${round.names.ai} sealed first; you chose without seeing it.`)
    : ai.sealMatch ? h('p.ok', {}, `${round.names.ai} answered your seal ${round.human.fp}: your half was fixed before they chose.`)
      : h('p.note', {}, `${round.names.ai} did not echo your seal; your half was still sealed before their link arrived.`);
  screen(
    h('div.eyebrow', { style: 'text-align:center' }, `Round ${round.id}`),
    h('div.seals', {},
      h('figure', {}, wax(round.human.fp, round.names.human, 'human', { stamp: justSealed, size: 104 }), h('figcaption', { class: 'human who' }, 'you')),
      h('figure', {}, wax(ai.fp, round.names.ai, 'ai', { stamp: justArrived, size: 104 }), h('figcaption', { class: 'ai who' }, round.names.ai))),
    h('h1.display', { style: 'text-align:center' }, justArrived ? 'Something was added.' : 'Both halves are sealed.'),
    h('p.lede', { style: 'text-align:center;margin-inline:auto' }, 'Ready to open together.'),
    h('div', { style: 'text-align:center' }, prov, ...(ai.warnings || []).map(w => h('p.note', {}, w))),
    h('div.hold-wrap', {}, holdButton('Open Together', { side: 'ai', ms: 1300, onDone: () => reveal(round) }), h('small', {}, 'Best opened with them, in the same conversation.')),
    h('div.dock', {}, h('div.inner', {}, h('button.btn.ghost', { type: 'button', on: { click: () => home() } }, 'Later')))
  );
}

/* ------------------------------------------------------------------ the stage (lazy: three.js loads only when needed) */
let stage = null;
const renderers = {};
async function getStage() {
  if (!stage) { const { createStage } = await import('../render/stage.js'); stage = createStage(stageHost); }
  stageHost.classList.remove('hidden');
  stage.resume();
  return stage;
}
/** Build a recipe's 3D object with its own renderer module (js/render/<recipe.renderer>.js). */
async function buildWorld(st, R, spec, seed) {
  const mod = renderers[R.renderer] ||= await import('../render/' + R.renderer + '.js');
  return mod.build(spec, seed, { renderer: st.renderer });
}

/* ------------------------------------------------------------------ reveal */
async function reveal(round) {
  const R = recipeByCode(round.recipe);
  const spec = mergeRound(round);
  app.replaceChildren();
  const st = await getStage();
  const p = await buildWorld(st, R, spec, round.id);
  st.setWorld(p);
  st.autoSpin = 0.1;
  st.backdrop(['#F3EEE8', '#E2D9CF'], false, round.id, '#8C8499');
  stageHost.querySelector('.stage-ornament').style.opacity = '0';
  p.prepareReveal();

  const top = h('div.over.top-bar', {}, h('div.title-plate', {}, h('div.eyebrow', {}, `Opening round ${round.id}`)),
    h('button.iconbtn', { type: 'button', 'aria-label': 'Skip to the end', on: { click: () => finish() } }, '»'));
  const cap = h('div.over.caption');
  app.replaceChildren(top, cap);
  const steps = R.revealSteps(spec);
  const extra = [];
  if (spec.why.human || spec.why.ai) extra.push({ kind: 'why' });
  if (spec.wish.human || spec.wish.ai) extra.push({ kind: 'wishes' });
  const all = [...steps, ...extra];
  let i = -1, busy = false, ended = false;

  const sideOf = by => by === 'human' ? 'human' : 'ai';
  const nameOf = by => by === 'human' ? round.names.human : round.names.ai;
  const dots = () => h('div.dots', {}, all.map((_, k) => h('i', { class: k <= i ? 'on' : '' })));
  const nextBtn = (label = 'Next') => h('button.btn.small.primary', { type: 'button', on: { click: () => advance() } }, label);
  const outBack = k2 => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k2 - 1, 3) + c1 * Math.pow(k2 - 1, 2); };

  // A renderer may reveal a slot its own way; otherwise its parts grow into place.
  function show(slot, delay = 0) {
    if (p.reveal?.(slot, (d, fn, e, dl = 0) => st.tween(d, fn, e, dl + delay))) return;
    (p.parts[slot] || []).forEach((o, k) => {
      const target = o.scale.clone(), from = o.position.length() > 0.5 ? 0.001 : 0.6;
      o.scale.copy(target).multiplyScalar(from);
      o.visible = true;
      st.tween(0.9, e => o.scale.copy(target).multiplyScalar(from + (1 - from) * e), outBack, delay + k * 0.08);
    });
  }
  const focus = name => { if (name && p.spots?.[name]) return st.focus(p.spots[name], 1.1); };
  function setDark(on) { [top, cap].forEach(n => n.classList.toggle('on-dark', on)); }

  async function play(s) {
    const card = h('div.card');
    if (s.kind === 'pick') {
      if (s.slot === R.backdropSlot) { st.backdrop(spec.palette.bg, spec.palette.dark, round.id, spec.palette.ink); stageHost.querySelector('.stage-ornament').style.opacity = '1'; setDark(spec.palette.dark); }
      show(s.slot);
      focus(s.focus);
      const chance = (spec.chance[s.by] || []).includes(s.slot);
      card.classList.add(sideOf(s.by));
      put(card, h('div.by', {}, h('i'), `${nameOf(s.by)} placed · ${s.title}`), h('h2', {}, s.pick.name), h('div.meaning', {}, s.pick.meaning), chance ? h('div.note', {}, 'left to the stars') : null);
    } else if (s.kind === 'pair') {
      (s.show || []).forEach((slot, k) => show(slot, k * 0.35));
      focus(s.focus);
      put(card, h('div.by', {}, h('i'), s.title),
        h('div.pair', {}, s.picks.map(w => h('div', { class: sideOf(w.by) }, h('div.by', {}, h('i'), nameOf(w.by)), h('b', {}, w.name), h('span.meaning', { style: 'font-size:15px' }, w.meaning)))),
        s.echo ? h('p.hand', { style: 'margin:10px 0 0;color:var(--gold)' }, s.echoText || 'You both chose the same, without knowing.') : null);
    } else if (s.kind === 'resonance') {
      put(card, h('div.by', {}, h('i', { style: 'background:var(--gold)' }), 'Something new happened'), h('div.meaning', { style: 'margin-top:8px;font-size:19px;color:var(--ink)' }, s.text));
    } else if (s.kind === 'name') {
      put(card, h('div.by', {}, h('i'), 'Its name'), h('h2', {}, s.words.length ? s.words.map((w, k) => [k ? ' ' : '', h('span', { class: sideOf(w.by), style: 'border-bottom:2px solid var(--side)' }, w.text)]) : s.title),
        h('div.note', {}, s.words.map(w => `${nameOf(w.by)}: “${w.text}”`).join(' · ')));
    } else if (s.kind === 'lines') {
      const shown = s.lines.filter(l => l.text);
      if (!shown.length) return advance();
      shown.forEach((l, k) => {
        const box = h('div', { class: sideOf(l.by), style: k ? 'margin-top:10px' : '' }, h('div.by', {}, h('i'), `${l.label} · ${nameOf(l.by)}`));
        if (l.find) {
          // This line is hidden in the object: uncover it first.
          const find = h('button.btn.small', { type: 'button', on: { click: async () => { show(l.find); await focus(l.find); find.replaceWith(h('p.quote', {}, l.text)); } } }, l.findLabel || 'Find it');
          box.append(find);
          st.onPick = what => { if (what === l.find && find.isConnected) find.click(); };
        } else box.append(h('p.quote', {}, l.text));
        put(card, box);
      });
    } else if (s.kind === 'why') {
      put(card, h('div.by', {}, h('i'), 'Why, in their own words'), h('div.pair', {},
        ['human', 'ai'].filter(k => spec.why[k]).map(k => h('div', { class: k }, h('div.by', {}, h('i'), nameOf(k)), h('span.meaning', { style: 'color:var(--ink)' }, spec.why[k])))));
    } else if (s.kind === 'wishes') {
      const env = k => {
        const e = h('button.envelope', { type: 'button', class: k, on: { click: () => { e.classList.add('open'); navigator.vibrate?.(10); } } }, h('span.dot'), h('div.text', {}, spec.wish[k]), h('small', {}, `from ${nameOf(k)}`));
        return e;
      };
      const n = ['human', 'ai'].filter(k => spec.wish[k]);
      p.reveal?.('wishes', (d, fn, e, dl) => st.tween(d, fn, e, dl));
      put(card, h('div.by', {}, h('i'), R.wishTitle ? R.wishTitle(n.length) : 'Sealed lines'), h('div.envelopes', {}, n.map(env)));
    }
    put(card, h('div.next', {}, dots(), i === all.length - 1 ? nextBtn('Done') : nextBtn()));
    cap.replaceChildren(card);
  }
  async function advance() {
    if (busy || ended) return;
    i++;
    if (i >= all.length) return finish();
    busy = true; setTimeout(() => { busy = false; }, 450);
    play(all[i]);
  }
  function finish() {
    if (ended) return; ended = true;
    p.revealAll(); // whatever was not shown yet appears at once
    st.backdrop(spec.palette.bg, spec.palette.dark, round.id, spec.palette.ink);
    stageHost.querySelector('.stage-ornament').style.opacity = '1';
    const r = { ...round, openedAt: round.openedAt || new Date().toISOString() };
    if (store.round(r.id)) store.saveRound(r);
    explore(r, { keepWorld: true });
  }
  advance();
}

/* ------------------------------------------------------------------ explore + keep */
async function explore(round, { keepWorld = false, visiting = false } = {}) {
  const R = recipeByCode(round.recipe);
  const spec = mergeRound(round);
  const st = await getStage();
  if (!keepWorld) {
    const p = await buildWorld(st, R, spec, round.id);
    p.revealAll();
    st.setWorld(p);
    st.backdrop(spec.palette.bg, spec.palette.dark, round.id, spec.palette.ink);
    stageHost.querySelector('.stage-ornament').style.opacity = '1';
  }
  st.autoSpin = 0.12;
  const hidden = spec.lines.find(l => l.find && l.text);
  st.onPick = what => { if (hidden && what === hidden.find) toast('“' + hidden.text + '”'); };
  const doc = () => toKeepsake(round);
  const id = `${round.recipe}-${round.id}-${round.human.fp}`;
  setHash(toLink(round).slice(toLink(round).indexOf('#')));
  const sideOf = by => by === 'human' ? 'human' : 'ai';
  const top = h('div.over.top-bar', {},
    h('div.title-plate', {},
      h('div.eyebrow', {}, `${R.title} · Round ${round.id}`),
      h('h1', {}, spec.words.length ? spec.words.map((w, k) => [k ? ' ' : '', h('span.w', { class: sideOf(w.by) }, w.text)]) : spec.title),
      h('p', {}, `${round.names.human} & ${round.names.ai} · ${fmtDate(round.openedAt || round.ai.sealedAt)}`)),
    EMBED === 'view' ? null : h('button.iconbtn', { type: 'button', 'aria-label': 'Home', on: { click: () => { stageHost.classList.add('hidden'); stage?.pause(); home(); } } }, '✕'));
  // With a host listening, "keep" always hands the piece to the host, even if it is already on this browser's shelf.
  const kept = () => !HOST && store.onShelf(id);
  const keepBtn = h('button.btn', { type: 'button', class: kept() ? '' : 'primary', on: { click: () => keepSheet() } }, kept() ? 'On your shelf' : 'Keep this');
  const bar = h('div.over.toolbar', {}, h('div.inner', {},
    h('button.btn', { type: 'button', on: { click: () => storySheet(round, spec) } }, 'Story'),
    EMBED === 'view' ? null : keepBtn,
    h('button.btn', { type: 'button', on: { click: () => share() } }, 'Share'),
    h('button.btn', { type: 'button', 'aria-label': 'More', on: { click: () => moreSheet() } }, '…')));
  const hint = h('div.hint', {}, 'turn it with your finger');
  [top, bar].forEach(n => n.classList.toggle('on-dark', spec.palette.dark));
  hint.style.color = spec.palette.dark ? '#C9C3DE' : '';
  app.replaceChildren(top, hint, bar);
  setTimeout(() => hint.remove(), 4200);

  async function share() {
    const url = toLink(round, site());
    const text = `${spec.title} — ${R.noun} ${round.names.human} and ${round.names.ai} made together.`;
    if (navigator.share) { try { await navigator.share({ title: spec.title, text, url }); return; } catch { } }
    copy(url, 'Link copied — anyone with it can open this world');
  }

  function keepSheet() {
    const plaque = h('div.plaque', {}, h('b', {}, spec.title), h('span', {}, `${round.names.human} & ${round.names.ai} · ${fmtDate(new Date().toISOString())}`));
    const already = kept();
    const panel = sheet(h('div.eyebrow', {}, 'The cabinet'), h('h2', {}, already ? 'It is already on your shelf.' : 'Keep this one?'),
      h('p.note', {}, HOST ? 'It goes into your cabinet, with both halves, both seals and every sealed line.' : 'It goes on the shelf in this browser, with both halves, both seals and every sealed line. Nothing is uploaded.'),
      plaque,
      already ? null : h('div.hold-wrap', {}, holdButton('Place on the shelf', { ms: 1000, onDone: () => place() })));
    async function place() {
      plaque.classList.add('engrave');
      const r = { ...round, keptAt: new Date().toISOString() };
      round.keptAt = r.keptAt;
      const thumb = await thumbnail(st);
      const d = toKeepsake(r);
      store.keep({ id, title: spec.title, recipe: round.recipe, keptAt: r.keptAt, link: d.link, thumb, doc: d, names: round.names, dark: spec.palette.dark, bg: spec.palette.bg });
      if (store.round(r.id)) store.saveRound(r);
      if (HOST && window.parent !== window) window.parent.postMessage({ type: 'companion-keepsake', action: 'keep', keepsake: { ...d, display: { ...d.display, thumbnail: thumb } } }, HOST);
      if (!HOST) { keepBtn.textContent = 'On your shelf'; keepBtn.classList.remove('primary'); }
      setTimeout(() => { panel.close(); toast('Placed on your shelf'); }, 1300);
    }
  }

  function moreSheet() {
    const s = sheet(h('h2', {}, 'Take it with you'), h('div.stack', {},
      h('button.btn', { type: 'button', on: { click: () => { s.close(); postcard(st, round, spec); } } }, 'Save a postcard image'),
      h('button.btn', { type: 'button', on: { click: () => copy(revealCard(round), `Copied — paste it to ${round.names.ai} so they remember`) } }, `Tell ${round.names.ai} what we made`),
      h('button.btn', { type: 'button', on: { click: () => download(`${spec.title.replace(/[^\w\- ]+/g, '').trim() || 'keepsake'}.keepsake.json`, JSON.stringify(doc(), null, 2), 'application/json') } }, 'Download keepsake file (JSON)'),
      h('button.btn', { type: 'button', on: { click: () => copy(toLink(round, site()), 'Keepsake link copied') } }, 'Copy keepsake link'),
      EMBED ? null : h('button.btn.ghost', { type: 'button', on: { click: () => { s.close(); stageHost.classList.add('hidden'); stage?.pause(); location.hash = 'shelf'; } } }, 'Open the shelf')));
  }
}

function storySheet(round, spec) {
  const R = recipeByCode(round.recipe);
  const col = (who) => {
    const half = who === 'human' ? round.human : round.ai;
    const items = spec.ledger.filter(x => x.by === who).map(x => h('div.story-item', {}, h('dt', {}, x.title), h('dd', {}, h('b', {}, x.name), h('span', {}, x.meaning))));
    if (half.word) items.push(h('div.story-item', {}, h('dt', {}, 'Name word'), h('dd', {}, h('b', {}, half.word))));
    const line = spec.lines.find(l => l.by === who) || {};
    return h('div', { class: who }, h('h3', {}, `${who === 'human' ? round.names.human : round.names.ai} added · ${R.halves[half.half].title}`),
      h('div.story-col', {}, items),
      line.text ? h('div', {}, h('div.eyebrow', { style: 'margin-top:12px' }, line.label), h('p.quote', {}, line.text)) : null,
      half.why ? h('div', {}, h('div.eyebrow', { style: 'margin-top:12px' }, 'Why'), h('p.quote', {}, half.why)) : null,
      half.wish ? h('div', {}, h('div.eyebrow', { style: 'margin-top:12px' }, 'Hidden line'), h('p.quote', {}, half.wish)) : null);
  };
  const t = d => d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  sheet(
    h('div.eyebrow', {}, `${R.title} · Round ${round.id}`),
    h('h2', {}, spec.title),
    round.theme ? h('p.meaning', {}, round.theme) : null,
    col('human'), col('ai'),
    spec.resonances.length ? h('div', {}, h('h3', {}, 'Between them'), spec.resonances.map(r => h('p.meaning', {}, r.text))) : null,
    h('h3', {}, 'Seals'),
    h('p.prov', {},
      `${round.names.human} sealed ${round.human.fp} at ${t(round.human.sealedAt)}. `,
      `${round.names.ai} sealed ${round.ai.fp} at ${t(round.ai.sealedAt)}`,
      round.order === 'ai-first' ? `, before ${round.names.human} chose. ` : round.ai.sealMatch ? `, answering seal ${round.human.fp}. ` : '. ',
      'Nothing in this world was regenerated: every part is one of these sealed picks, or a named meeting of two of them.'),
    round.ai.code ? h('details', {}, h('summary', { class: 'prov' }, `${round.names.ai}’s sealed code, as sent`), h('pre.invite', {}, round.ai.code)) : null
  );
}

function sheet(...kids) {
  const panel = h('div.panel', { role: 'dialog', 'aria-modal': 'true' }, ...kids);
  const s = h('div.sheet', { on: { click: e => { if (e.target === s) close(); } } }, panel);
  const close = () => { s.remove(); document.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc);
  document.body.append(s);
  return { close, panel };
}

function download(name, text, type) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.append(a); a.click(); a.remove();
}

async function thumbnail(st) {
  const png = st.capture(360, 360, { object: true });
  return new Promise(res => {
    const img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 240; c.getContext('2d').drawImage(img, 0, 0, 240, 240); res(c.toDataURL('image/webp', 0.86)); };
    img.onerror = () => res(null);
    img.src = png;
  });
}

async function postcard(st, round, spec) {
  const W = 1200, H = 1560, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(W / 2, 620, 80, W / 2, 620, 900);
  grad.addColorStop(0, spec.palette.bg[0]); grad.addColorStop(1, spec.palette.bg[1]);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  // ornament
  const svg = stageHost.querySelector('.stage-ornament');
  try {
    const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));
    const im = await loadImg(src); g.drawImage(im, 40, 60, W - 80, W - 80);
  } catch { }
  const shot = await loadImg(st.capture(1100, 1100)); g.drawImage(shot, 50, 70, 1100, 1100);
  await document.fonts?.ready;
  const ink = spec.palette.dark ? '#F2EFFA' : '#2E2A3C', ink2 = spec.palette.dark ? '#C9C3DE' : '#6A6379';
  g.textAlign = 'center'; g.fillStyle = ink;
  g.font = '500 78px "Cormorant Garamond", Georgia, serif'; g.fillText(spec.title, W / 2, 1250);
  g.font = '500 24px "DM Sans", sans-serif'; g.fillStyle = ink2;
  g.fillText(`${round.names.human.toUpperCase()}  &  ${round.names.ai.toUpperCase()}   ·   ${fmtDate(round.openedAt || new Date()).toUpperCase()}`, W / 2, 1306);
  const shown = spec.lines.find(l => l.text && !l.find);
  if (shown) { g.font = 'italic 400 38px "Cormorant Garamond", Georgia, serif'; g.fillStyle = ink; wrap(g, '“' + shown.text + '”', W / 2, 1390, 940, 46); }
  g.font = '500 30px Caveat, cursive'; g.fillStyle = ink2; g.fillText(`${recipeByCode(round.recipe).noun} we made together`, W / 2, 1510);
  c.toBlob(b => { const a = h('a', { href: URL.createObjectURL(b), download: `${spec.title}.png` }); document.body.append(a); a.click(); a.remove(); }, 'image/png');
}
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function wrap(g, text, x, y, max, lh) {
  const words = text.split(/(\s+)/); let line = '';
  for (const w of words) { const test = line + w; if (g.measureText(test).width > max && line.trim()) { g.fillText(line.trim(), x, y); y += lh; line = w.trimStart(); } else line = test; }
  if (line.trim()) g.fillText(line.trim(), x, y);
}

/* ------------------------------------------------------------------ shelf */
function shelf() {
  stageHost.classList.add('hidden'); stage?.pause();
  const items = store.shelf();
  const rows = [];
  for (let k = 0; k < items.length; k += 3) rows.push(items.slice(k, k + 3));
  screen(
    h('div.eyebrow', {}, 'Companion Keepsakes'),
    h('h1.display', {}, 'The ', h('em', {}, 'shelf')),
    h('p.lede', {}, 'Things you made together and chose to keep. They live in this browser; download a keepsake file to keep one anywhere.'),
    items.length ? h('div.shelf', {}, rows.map(row => h('div.shelf-row', {}, row.map(it => h('button.curio', { type: 'button', on: { click: () => { const r = fromLink(it.link); if (r) explore({ ...r, keptAt: it.keptAt }); } } },
      it.thumb ? h('img', { src: it.thumb, alt: it.title }) : h('span.art', { html: planetArt(), style: 'width:100%;aspect-ratio:1;display:grid;place-items:center' }),
      h('span.label', {}, it.title), h('span.when', {}, fmtDate(it.keptAt))))))) : h('p.empty', {}, 'Nothing kept yet. The first one will sit right here.'),
    h('div.dock', {}, h('div.inner', {}, h('button.btn.ghost', { type: 'button', on: { click: () => home() } }, 'Home'), h('button.btn', { type: 'button', on: { click: () => home() } }, 'Make another')))
  );
}

/* ------------------------------------------------------------------ small art */
function planetArt() {
  return `<svg viewBox="0 0 92 92" width="92" height="92" aria-hidden="true"><circle cx="46" cy="46" r="44" fill="#E6EEF4"/><circle cx="46" cy="47" r="22" fill="#A9CF9A" stroke="#2E2A3C" stroke-width="1.4"/><path d="M32 52c6-3 9 2 14 0s6-6 12-4" fill="none" stroke="#8CC4E6" stroke-width="5" stroke-linecap="round"/><ellipse cx="46" cy="47" rx="36" ry="10" fill="none" stroke="#C4607A" stroke-width="1.4" transform="rotate(-16 46 47)" stroke-dasharray="2 3"/><circle cx="74" cy="30" r="4" fill="#F2CF5B"/><path d="M20 22l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#69C8D8"/></svg>`;
}
function globeArt() {
  return `<svg viewBox="0 0 92 92" width="92" height="92" aria-hidden="true"><circle cx="46" cy="46" r="44" fill="#F1ECF4"/><circle cx="46" cy="40" r="22" fill="#fff" fill-opacity=".7" stroke="#2E2A3C" stroke-width="1.4"/><path d="M28 58h36l-4 10H32z" fill="#D9BFA0" stroke="#2E2A3C" stroke-width="1.4"/><circle cx="40" cy="36" r="1.6" fill="#9AA"/><circle cx="52" cy="30" r="1.3" fill="#9AA"/><circle cx="48" cy="44" r="1.5" fill="#9AA"/><path d="M38 52c3-6 13-6 16 0" fill="#B7D4C2"/></svg>`;
}
function charmArt() {
  return `<svg viewBox="0 0 92 92" width="92" height="92" aria-hidden="true"><circle cx="46" cy="46" r="44" fill="#F6ECEE"/><path d="M46 10v8" stroke="#8E8A99" stroke-width="2"/><circle cx="46" cy="22" r="4" fill="none" stroke="#8E8A99" stroke-width="2"/><circle cx="46" cy="31" r="4.5" fill="#F4F0EA" stroke="#2E2A3C"/><circle cx="46" cy="41" r="5" fill="#C9D8F2" stroke="#2E2A3C"/><circle cx="46" cy="51" r="4.5" fill="#F6C9D6" stroke="#2E2A3C"/><path d="M38 60h16l-2 16H40z" fill="#E7B9C4" stroke="#2E2A3C"/><path d="M42 60l4-4 4 4" fill="none" stroke="#2E2A3C"/></svg>`;
}

route();
