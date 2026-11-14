// ===== Le Verbe Souverain · v13 =====
// Fluidité totale : rien ne bloque, rien n'attend.
// 1. La transcription tourne sur un fil séparé : la page ne se fige plus jamais.
// 2. Toute évaluation se fait en arrière-plan, sans rien afficher ; le résultat arrive au débrief.
// 3. Chaque exercice : consigne parlée à l'arrivée, bouton « Démarrer », compte à rebours 5-0,
//    enregistreur bien visible, puis passage automatique à l'exercice suivant.
// 4. Un fil conducteur parlé relie chaque étape au sujet du jour.
// 5. Voix plus douce et naturelle (débit réglable, phrases courtes).
// 6. Mise à jour automatique de l'application, sur ordinateur et téléphone.
(function () {
"use strict";
const V9 = window.V9, X = window.V12C;
const APP_VERSION = "13.0";
V9.version = APP_VERSION;
const pref = { get: k => { try { return localStorage.getItem("vs1:" + k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem("vs1:" + k, v || ""); } catch (e) { } } };
S.v13 = S.v13 || { silent: false, onDebrief: false, cohUser: false };
const full = c => c ? [c.what, c.why, c.how, c.ex].filter(Boolean).join(" ") : "";
const IN_FRAME = V9.IN_FRAME;

// =====================================================================
// 1. TRANSCRIPTION SUR UN FIL SÉPARÉ (repli sur l'ancien moteur si besoin)
// =====================================================================
const MAIN = { load: ASR.load.bind(ASR), tr: ASR.transcribe, ts: ASR.transcribeTS };
const W = { w: null, id: 0, cb: {}, failed: false, ready: false };
const asrBase = new URL("asr/", location.href).href;
function wk() {
  if (W.w || W.failed) return W.w;
  try {
    W.w = new Worker(new URL("asr-worker.js", location.href), { type: "module" });
    W.w.onmessage = e => { const m = e.data || {}; if (m.type === "progress") { ASR.progress = m.p; return; } if (m.type === "hello") return; const f = W.cb[m.id]; if (f) { delete W.cb[m.id]; f(m); } };
    W.w.onerror = () => { W.failed = true; Object.values(W.cb).forEach(f => f({ ok: false, err: "worker" })); W.cb = {}; try { W.w.terminate(); } catch (e) { } W.w = null; };
  } catch (e) { W.failed = true; W.w = null; }
  return W.w;
}
function call(msg, transfer) {
  return new Promise((res, rej) => {
    const w = wk(); if (!w) { rej(new Error("noworker")); return; }
    const id = ++W.id; W.cb[id] = m => m.ok ? res(m.out) : rej(new Error(m.err || "asr"));
    try { w.postMessage(Object.assign({ id, base: asrBase, page: location.href, parts: ASR.PARTS, lib: ASR.LIB }, msg), transfer || []); } catch (e) { delete W.cb[id]; rej(e); }
  });
}
ASR.load = function (onProg) {
  if (this.state === "ready") return Promise.resolve(this.pipe || true);
  if (this.useMain) return MAIN.load(onProg);
  if (this._wl) return this._wl;
  this.state = "loading";
  this._wl = call({ type: "load" }).then(() => { this.state = "ready"; W.ready = true; return true; })
    .catch(() => { this._wl = null; this.useMain = true; this.state = "idle"; return MAIN.load(onProg); });
  return this._wl;
};
const OPTS = ts => ({ language: "french", task: "transcribe", chunk_length_s: 30, stride_length_s: 5, return_timestamps: !!ts });
ASR.transcribe = async function (pcm) {
  if (this.useMain) return MAIN.tr(pcm);
  try { const copy = new Float32Array(pcm); const out = await call({ type: "run", pcm: copy, opts: OPTS(false) }, [copy.buffer]); return String(out.text || "").replace(/\s+/g, " ").trim(); }
  catch (e) { this.useMain = true; return MAIN.tr(pcm); }
};
ASR.transcribeTS = async function (pcm) {
  if (this.useMain) return MAIN.ts(pcm);
  try {
    const copy = new Float32Array(pcm); const out = await call({ type: "run", pcm: copy, opts: OPTS(true) }, [copy.buffer]);
    const chunks = (out.chunks || []).map(c => ({ a: Number(c.timestamp && c.timestamp[0]) || 0, b: Number(c.timestamp && c.timestamp[1]) || 0, t: String(c.text || "").trim() })).filter(c => c.t);
    return { text: String(out.text || "").replace(/\s+/g, " ").trim(), chunks };
  } catch (e) { this.useMain = true; return MAIN.ts(pcm); }
};

// =====================================================================
// 2. ÉVALUATIONS EN ARRIÈRE-PLAN : l'écran ne montre jamais « J'écoute »
// =====================================================================
const Jobs = { n: 0, last: 0 };
let realBusy = null;
try { delete S.evalBusy; } catch (e) { }
Object.defineProperty(S, "evalBusy", {
  configurable: true,
  get() { if (!S.v13.onDebrief) return null; if (Jobs.n > 0 && Date.now() - Jobs.last < 150000) return realBusy || "analyse"; return null; },
  set(v) { if (v) { Jobs.n++; realBusy = v; } else { Jobs.n = Math.max(0, Jobs.n - 1); if (!Jobs.n) realBusy = null; } Jobs.last = Date.now(); }
});
V9.jobs = () => Jobs.n + Object.values((S.cur && S.cur.res) || {}).filter(x => x && x.media && x.media.status === "analyse").length;
// Les messages d'évaluation n'apparaissent plus pendant la séance
const _toast13 = toast;
toast = function (m) {
  if (S.route === "seance" && /^(Très court|\d+:\d{2} pour|Je n’ai pas pu|La transcription|Juste :|La réponse :|Palier franchi|Vidéothèque pleine|Micro vérifié)/.test(String(m || ""))) return;
  return _toast13(m);
};
// Plus de minuteur d'étape qui pousse dehors : c'est vous qui lancez, l'enchaînement est automatique
busy8 = function () { return true; };

// =====================================================================
// 3. LA VOIX : plus douce, plus naturelle
// =====================================================================
const NAT = /natural|neural|online|premium|enhanced|wavenet|studio|naturelle/i;
const PREF_NAMES = [/denise/i, /vivienne/i, /henri/i, /remy|rémy/i, /eloise|éloïse/i, /google.*fran/i, /hortense/i, /julie/i, /am[ée]lie/i, /audrey/i, /thomas/i, /paul/i];
const frv = () => { try { return speechSynthesis.getVoices().filter(v => /^fr/i.test(v.lang)); } catch (e) { return []; } };
TTS.pick = function () {
  const vs = frv(), want = pref.get("ttsvoice");
  const ff = vs.filter(v => /fr[-_]FR/i.test(v.lang));
  this.voice = (want && vs.find(v => v.voiceURI === want)) || ff.find(v => NAT.test(v.name)) || vs.find(v => NAT.test(v.name)) ||
    PREF_NAMES.map(re => ff.find(v => re.test(v.name)) || vs.find(v => re.test(v.name))).find(Boolean) || ff[0] || vs[0] || null;
};
try { TTS.pick(); speechSynthesis.onvoiceschanged = () => TTS.pick(); } catch (e) { }
const RATE = () => Number(pref.get("ttsrate")) || 0.92;
let keep = null;
TTS.speak = function (text, rate, onend) {
  if (S.v13.silent) { setTimeout(() => onend && onend(), 1200); return true; }
  if (!this.ok) return false;
  try {
    speechSynthesis.cancel(); if (!this.voice) this.pick();
    const clean = String(text).replace(/\s\/\s/g, ", ").replace(/[«»]/g, "").replace(/\s+/g, " ").trim();
    const parts = (clean.match(/[^.!?:;…]+[.!?:;…]+|[^.!?:;…]+$/g) || [clean]).map(s => s.trim()).filter(Boolean);
    // regrouper les fragments très courts
    const P = []; parts.forEach(s => { if (P.length && (P[P.length - 1].length < 40 || s.length < 12) && (P[P.length - 1] + " " + s).length < 220) P[P.length - 1] += " " + s; else P.push(s); });
    const r = Math.max(0.7, Math.min(1.2, (rate || 1) * RATE()));
    P.forEach((s, k) => {
      const u = new SpeechSynthesisUtterance(s); u.lang = (this.voice && this.voice.lang) || "fr-FR"; if (this.voice) u.voice = this.voice;
      u.rate = r; u.pitch = 1; u.volume = 1;
      if (k === P.length - 1) { u.onend = () => { clearInterval(keep); onend && onend(); }; u.onerror = () => { clearInterval(keep); onend && onend(); }; }
      speechSynthesis.speak(u);
    });
    // Chrome sur ordinateur coupe parfois les longues lectures : on le maintient éveillé
    clearInterval(keep); if (!IS_MOBILE) keep = setInterval(() => { if (!speechSynthesis.speaking) { clearInterval(keep); return; } speechSynthesis.pause(); speechSynthesis.resume(); }, 12000);
    return true;
  } catch (e) { return false; }
};
const speakNow = (t, onend) => { if (!VOICE_ON() || !t) { if (onend) onend(); return; } TTS.speak(t, 1, onend); };

// =====================================================================
// 4. LE FIL CONDUCTEUR : l'ordre des étapes et la transition parlée
// =====================================================================
const RANK = { studio: 0, meteo: 1, souffle: 2, forge: 3, video: 4, rappel: 5, mots3: 6, empan: 7, prescrit: 8, sim: 9, roulette: 9, prise1: 10, prise2: 11, question: 12, debrief: 13, bilan: 14 };
Object.assign(V9.PLAN.full, { souffle: [90, "cyc", 8], forge: [200, "n", 5], mots3: 100, empan: 80, prescrit: 110, prise1: 210, prise2: 150, question: 150, bilan: 40 });
Object.assign(V9.PLAN.express, { souffle: [50, "cyc", 4], forge: [100, "n", 3], prise1: 150, question: 110, bilan: 30 });
const _bc13 = buildCards;
buildCards = function (c) {
  const C = _bc13(c), P = c.info && c.info.pack; if (!P || !P.track) return C;
  C.forEach((x, i) => { x._i = i; if (x.k === "video") x.sec = Math.min(300, x.sec); if (x.k === "debrief") x.sec = c.express ? 90 : 210; if (x.k === "empan" || x.k === "rappel") x.opt = true; });
  return C.sort((a, b) => ((RANK[a.k] ?? 50) - (RANK[b.k] ?? 50)) || (a._i - b._i));
};
const EXERCISE = new Set(["souffle", "forge", "video", "rappel", "mots3", "empan", "prescrit", "sim", "roulette", "prise1", "prise2", "question"]);
function trans(k, c, i, n) {
  const P = c.info.pack, f = S.profile.v10, foc = f && f.focus && V9.CRIT[f.focus] ? V9.CRIT[f.focus].t.toLowerCase() : "", fil = P.fil;
  const T = {
    studio: "Avant de commencer, allumons la caméra et le micro.",
    meteo: "Bonjour Fidèle. Aujourd’hui : " + P.t + ". Votre sujet : " + fil + " Tout ce que nous allons faire prépare votre prise de parole sur ce sujet. D’abord, votre trac.",
    souffle: "Le calme d’abord. Un orateur posé respire bas, et sa voix suit.",
    forge: "Votre souffle est posé. On réveille maintenant l’articulation, pour que chaque mot de votre prise soit net.",
    video: "Votre voix est prête. Voyons comment un maître applique ce que vous allez faire aujourd’hui : " + P.tech.t + ".",
    rappel: "Avant les mots nouveaux, rappelons ceux que vous avez déjà appris.",
    mots3: "Vous avez vu la technique ; voici trois mots pour l’habiller. Vous les placerez dans votre prise sur : " + fil,
    empan: "Parler sans notes demande de la mémoire. Entraînons-la : c’est elle qui portera votre plan en trois points.",
    prescrit: "Avant la prise, un exercice ciblé" + (foc ? " sur votre point faible : " + foc : "") + ".",
    prise1: "Tout est prêt : le souffle, la voix, la technique et les mots. Voici votre prise de parole.",
    prise2: "Même sujet, un seul conseil en tête. C’est là que l’on progresse le plus.",
    sim: "Place à la négociation : appliquez la technique du jour face à votre interlocuteur.",
    roulette: "Improvisation : trois sujets surprise, pour que votre discours témoin coule ensuite.",
    question: "Dernière épreuve : l’arène. Une question difficile, pour garder le calme et la structure.",
    debrief: "C’est terminé. Voici votre débrief.",
    bilan: "Dernier geste : votre trac maintenant, puis votre bilan."
  };
  return "Étape " + (i + 1) + " sur " + n + ". " + (T[k] || "");
}
function consigneOf(cd, c) {
  if (cd.k === "prescrit") { const d = prescribed(c), K = X.DRILL[d]; return full(K || { what: DRILLS7[d].t, how: DRILLS7[d].line }); }
  if (cd.k === "empan") return full(X.C.empan);
  if (cd.k === "video") { const v = X.videoFor(WEEK.n, c.info.pack.d); return full(X.C.video) + " La vidéo : " + v.t + ", par " + v.who + ". Question pour votre bilan : " + v.q; }
  const t = cd.auto && V9.textOf ? V9.textOf(cd.auto) : null;
  return t || full(X.C[cd.k]) || "";
}
const _cg13 = cardGo;
cardGo = function (i, auto = true) {
  Flow.cancel();
  const c0 = S.cur; if (c0 && c0.info && c0.info.pack && c0.info.pack.track) { const cs = buildCards(c0), t = cs[clamp(i, 0, cs.length - 1)]; S.v13.onDebrief = !!(t && t.k === "debrief"); }
  _cg13(i, auto);
  const c = S.cur; if (!c || !c.info || !c.info.pack || !c.info.pack.track) return;
  const cards = buildCards(c), ci = c.card || 0, cd = cards[ci]; if (!cd) return;
  if (cd.k === "souffle" && Coh.on && !S.v13.cohUser) { Coh.stop(); render(); }
  if (!auto || cd.k === "debrief") return;
  // Transition parlée, puis la consigne ; l'exercice attend votre « Démarrer »
  setTimeout(() => {
    if (!S.cur || (S.cur.card || 0) !== ci) return;
    Voice.stop();
    const t = trans(cd.k, c, ci, cards.length) + " " + (EXERCISE.has(cd.k) ? consigneOf(cd, c) + " Quand vous êtes prêt, touchez Démarrer." : cd.k === "meteo" ? "Touchez un chiffre, de zéro à dix." : "");
    speakNow(t);
  }, 250);
};
V9.trans = trans;

// =====================================================================
// 5. L'ENCHAÎNEMENT AUTOMATIQUE APRÈS CHAQUE EXERCICE
// =====================================================================
const Flow = {
  tm: null, iv: null, el: null, i: -1, n: 0,
  after(ms) {
    const c = S.cur; if (!c || S.route !== "seance" || c.bilan) return;
    const cards = buildCards(c), i = c.card || 0, nx = cards[i + 1]; if (!nx) return;
    this.cancel(); this.i = i; this.n = c.n; this.until = Date.now() + (ms || 4000); this.next = nx.t;
    if (!this.el) { this.el = document.createElement("div"); this.el.id = "v13-flow"; this.el.setAttribute("role", "status"); document.body.appendChild(this.el); }
    this.paint(); this.el.hidden = false;
    this.iv = setInterval(() => this.paint(), 250);
    this.tm = setTimeout(() => this.go(), ms || 4000);
  },
  paint() {
    if (!this.el) return; const s = Math.max(0, Math.ceil((this.until - Date.now()) / 1000));
    this.el.innerHTML = '<div><b>✓ Terminé.</b> Suite : ' + esc(this.next) + ' dans ' + s + ' s</div><div class="row-wrap"><button class="btn sm" data-act="v13-flow-go">Continuer</button><button class="btn ghost sm" data-act="v13-flow-stay">Rester ici</button></div>';
  },
  go() {
    const c = S.cur, i = this.i; this.cancel();
    if (!c || c.n !== this.n || (c.card || 0) !== i || S.route !== "seance") return;
    if (Run.on || Studio.rec || (V9.RecStage && V9.RecStage.on) || Coh.on) return;
    cardGo(i + 1);
  },
  cancel() { clearTimeout(this.tm); clearInterval(this.iv); if (this.el) this.el.hidden = true; }
};
V9.Flow = Flow;
// Fin d'un exercice enregistré (Forge, mots, exercice ciblé, vidéo, empan, roulette)
const _fin13 = Run.finish.bind(Run);
Run.finish = async function () { const k = this.key; await _fin13(); if (k && S.cur && S.route === "seance") Flow.after(4000); };
// Fin d'une prise filmée
const RS = V9.RecStage, _rsStop13 = RS.stop.bind(RS);
RS.stop = function () { const was = this.phase === "rec"; const p = _rsStop13(); if (was && S.cur && S.route === "seance") setTimeout(() => Flow.after(5000), 600); return p; };
// La respiration guidée : lancée par vous, puis on enchaîne
Coh.finish = function () { this.stop(); if (S.cur) { R("souffle").breathDone = true; saveSess(); } S.v13.cohUser = false; render(); if (VOICE_ON()) speakNow("Très bien. Gardez ce calme."); Flow.after(4000); };

// =====================================================================
// 6. LE PROTOCOLE D'ENREGISTREMENT : compte à rebours, enregistreur visible, suite automatique
// =====================================================================
const _start13 = Run.start.bind(Run);
Run.start = function (key, segs, done, opt) { Flow.cancel(); this.hold = false; Voice.stop(); try { speechSynthesis.cancel(); } catch (e) { } return _start13(key, segs, done, opt ? Object.assign({}, opt, { brief: null }) : opt); };
const _tick13 = Run.tick.bind(Run), _draw13 = Run.draw.bind(Run);
Run.tick = function () {
  if (!this.on) return; const s = this.segs[this.i]; if (!s) return;
  if (s.kind === "pause") { const el = (Date.now() - this.t0) / 1000, left = Math.max(0, Math.ceil(3 - el)); const t = $("#v13-pause-s"); if (t) t.textContent = left; if (!this.hold && el >= 3) this.next(); return; }
  return _tick13();
};
Run.draw = function () {
  const el = $("#run"), s = this.segs[this.i]; if (!el || !s) return;
  if (s.kind === "pause") {
    el.className = "pause";
    el.innerHTML = '<div class="run-in"><div class="v13-ok">✓</div><p class="run-lab">Enregistré.</p><p class="run-txt">' + (s.last ? "Exercice terminé. On enchaîne dans " : "Prise suivante dans ") + '<b id="v13-pause-s">3</b> s.</p><div class="run-btns">' + (this.hold ? '<button class="btn" data-act="v13-run-resume">Continuer</button>' : '<button class="btn ghost" data-act="v13-run-hold">Pause</button>') + '<button class="btn ghost" data-act="run-stop">Arrêter</button></div></div>';
    return;
  }
  _draw13();
  if (s.kind === "dire") {
    const inn = el.querySelector(".run-in"); if (!inn) return;
    const mic = Studio.ok();
    const rec = document.createElement("div"); rec.className = "v13-rec" + (mic ? "" : " off");
    rec.innerHTML = mic ? '<span class="v13-dot"></span><b>Enregistrement en cours</b><div class="v11-vu v13-vu"><i></i></div><small>Parlez : la barre doit bouger.</small>' : '<b>Micro inactif</b><small>Cette prise ne sera pas évaluée. Activez le micro depuis l’accueil.</small>';
    inn.insertBefore(rec, inn.firstChild);
  }
  if (s.kind === "count") { const inn = el.querySelector(".run-in"); if (inn) { const d = document.createElement("div"); d.className = "v13-ready"; d.textContent = "L’enregistrement démarre à zéro"; inn.insertBefore(d, inn.querySelector(".run-lab")); } }
};
// La scène vidéo : pas de seconde consigne parlée, le compte à rebours part seul
const _rsOpen13 = RS.open.bind(RS);
RS.open = async function (id, budget, title) {
  Flow.cancel(); Voice.stop(); try { speechSynthesis.cancel(); } catch (e) { }
  S.v13.silent = true;
  try { return await _rsOpen13(id, budget, title); } finally { setTimeout(() => { S.v13.silent = false; }, 1500); }
};
const _rsCount13 = RS.countdown.bind(RS);
RS.countdown = function () { const br = $("#v9-stage .rs-brief"); const keepHtml = br ? br.outerHTML : ""; _rsCount13(); if (keepHtml && this.on && !$("#v9-stage .rs-brief")) { const inn = $("#v9-stage .rs-in"); if (inn) { const d = document.createElement("div"); d.innerHTML = keepHtml; inn.insertBefore(d.firstChild, inn.querySelector(".rs-cam")); } } };
const _rsBegin13 = RS.begin.bind(RS);
RS.begin = function () { _rsBegin13(); const br = $("#v9-stage .rs-brief"); if (br) br.classList.add("small"); };

// =====================================================================
// 7. LES CARTES : consigne claire, « Démarrer », jamais d'attente
// =====================================================================
const ttl = t => '<h2 class="cx-t">' + esc(t) + '</h2>';
const done = t => '<div class="v12-done">✓ ' + esc(t) + '<span>Votre évaluation vous attend au débrief, en fin de séance.</span></div>';
const consBox = k => { const c = X.C[k]; if (!c) return ""; return '<div class="v12-consigne"><div class="eyebrow">Consigne</div><p><b>' + esc(c.what) + '</b> ' + esc(c.why) + '</p><p>' + esc(c.how) + '</p>' + (c.ex ? '<p class="small muted">' + esc(c.ex) + '</p>' : "") + '</div>'; };
// L'empan : les mots défilent, puis compte à rebours et récitation enregistrée
CARD.empan = function (c) {
  const L = v7().lad, r = R("empan"), n = L.span;
  let h = ttl("L’empan de mémoire") + consBox("empan");
  if (r.phase === "show") return h + '<div class="span-n"><b>' + n + '</b><span>mots à retenir, dans l’ordre</span></div><div class="span-w" id="span-w">…</div>';
  if (r.ran) return h + done(n + " mots récités et enregistrés.");
  return h + '<div class="span-n"><b>' + n + '</b><span>mots, dans l’ordre</span></div><button class="btn wide big-act2" data-act="v13-span">▶ Démarrer</button>';
};
async function evalEmpan(seq, res) {
  const r = R("empan"), L = v7().lad; if (!res.file) return;
  S.evalBusy = "empan";
  try {
    const H = await hear(res.file, res.wins.map(w => [w[0], w[1]]));
    const got = lcsUnits(seq, toks(H.text)), k = got.filter(Boolean).length, N = seq.length, g = k === N ? 2 : k === N - 1 ? 1 : 0;
    r.t = (r.t || []).concat([{ n: N, g, got, seq }]);
    if (g === 2) { L.spanOk = (L.spanOk || 0) + 1; if (L.spanOk >= 2) { L.span = Math.min(12, L.span + 1); L.spanOk = 0; } } else if (g === 0) { L.span = Math.max(3, L.span - 1); L.spanOk = 0; } else L.spanOk = 0;
    saveProfile();
  } catch (e) { }
  S.evalBusy = null; if (S.cur) S.cur._debriefDirty = true; saveSess();
}
// Le rappel actif : on dit, on vérifie, on se note. Sans attente.
CARD.rappel = function (c) {
  const r = R("rappel"); r.g = r.g || {}; r.q = r.q || [];
  const left = r.q.filter(id => r.g[id] === undefined);
  let h = ttl("Rappel actif") + '<div class="v12-consigne"><div class="eyebrow">Consigne</div><p><b>Retrouver de mémoire.</b> L’effort de rappel est ce qui grave un mot.</p><p>Lisez l’indice, dites la réponse à voix haute, puis touchez Vérifier et notez-vous honnêtement.</p></div>';
  if (!left.length) return h + done(Object.values(r.g).filter(g => g === 2).length + " sur " + r.q.length + " retrouvés.");
  const id = left[0], s = srsCard(id) || { front: id.slice(2), back: "" }, isWord = id.startsWith("w:") || id.startsWith("b:");
  h += '<div class="eyebrow center">' + (r.q.length - left.length + 1) + ' sur ' + r.q.length + '</div><p class="big-quote">' + esc(isWord ? s.back : (typeof initials === "function" ? initials(s.front) : s.front.split(" ").map(w => w[0]).join(" "))) + '</p>';
  if (r.show === id) h += '<p class="center big-text"><b>' + esc(s.front) + '</b></p><div class="rate3"><button data-act="v13-rap" data-id="' + esc(id) + '" data-g="2">Je l’avais</button><button data-act="v13-rap" data-id="' + esc(id) + '" data-g="1">À moitié</button><button data-act="v13-rap" data-id="' + esc(id) + '" data-g="0">À revoir</button></div>';
  else h += '<button class="btn wide big-act2" data-act="v13-rap-show" data-id="' + esc(id) + '">Vérifier</button>';
  return h;
};
// En séance, une prise faite affiche simplement « Enregistré » : l'analyse se fait en arrière-plan
const _sc13 = studioCompact;
studioCompact = function (id) {
  const r = R(id);
  if (r.media && S.route === "seance" && S.cur && !S.cur.bilan && !S.v13.onDebrief) return done("Prise enregistrée (" + fmtSec(r.sec || (r.media.dur || 0)) + ").") + '<div class="row-wrap v9-acts"><button class="btn ghost sm" data-act="vrec" data-id="' + esc(id) + '">Refaire la prise</button></div>';
  return _sc13(id);
};
// Vue de séance : boutons « Démarrer », fil conducteur, rien qui ne fuite de l'évaluation
const START = /(<button class="btn wide big-act2(?: ghost)?" data-act="(?:forge8|v12-mots3|run8|roulette8|v12-video-bilan|coh8)"[^>]*>)(Commencer|Lancer la roulette|Ce que je retiens)[^<]*(<\/button>)/g;
const _vs13 = viewSession;
viewSession = function () {
  const c = S.cur; let h = _vs13();
  if (!c || c.bilan || !c.info || !c.info.pack || !c.info.pack.track) return h;
  const cards = buildCards(c), i = clamp(c.card || 0, 0, cards.length - 1), cd = cards[i];
  S.v13.onDebrief = cd.k === "debrief";
  h = h.replace(START, "$1▶ Démarrer$3").replace(/<span>Me filmer<\/span>/g, "<span>▶ Démarrer · je me filme</span>").replace(/<span>Me refilmer<\/span>/g, "<span>Refaire la prise</span>");
  h = h.replace(/<p class="v10-bridge">[\s\S]*?<\/p>/, '<p class="v10-bridge">' + esc(trans(cd.k, c, i, cards.length).replace(/^Étape \d+ sur \d+\.\s*/, "")) + '</p>');
  if (cd.k !== "debrief") {
    h = h.replace(/<details class="why"><summary>Ce que j’ai entendu<\/summary>[\s\S]*?<\/details>/g, "").replace(/<p class="time-res [^"]*">[\s\S]*?<\/p>/g, "").replace(/<div id="ai-[^"]*">[\s\S]*?<\/div><\/section>/g, "</section>");
  }
  if (cd.k === "souffle" && !Coh.on) h = h.replace(/(data-act="coh8"[^>]*>)(Commencer|Recommencer)/, "$1▶ Démarrer");
  return h;
};

// =====================================================================
// 8. ACTIONS
// =====================================================================
window.addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act, c = S.cur;
  const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
  if (["forge8", "v12-mots3", "run8", "roulette8", "v12-video-bilan", "coh8", "vrec", "pick", "studio-open", "v13-span"].includes(a)) { Flow.cancel(); Voice.stop(); try { speechSynthesis.cancel(); } catch (_) { } }
  switch (a) {
    case "coh8": S.v13.cohUser = !Coh.on; break;
    case "v13-flow-go": stop(); Flow.go(); break;
    case "v13-flow-stay": stop(); Flow.cancel(); break;
    case "v13-run-hold": stop(); Run.hold = true; Run.draw(); break;
    case "v13-run-resume": stop(); Run.hold = false; Run.next(); break;
    case "v13-span": {
      stop(); if (!c) break; const r = R("empan"), n = v7().lad.span;
      if (!Studio.ok()) await Studio.open();
      r.seq = pickN(SPAN_POOL, n, c.n * 3 + (r.t || []).length, 17).map(i => SPAN_POOL[i]); r.phase = "show"; render();
      let i = 0; const step = () => { const x = $("#span-w"); if (!x) return; if (i < r.seq.length) { x.textContent = r.seq[i]; x.classList.remove("pop"); void x.offsetWidth; x.classList.add("pop"); i++; setTimeout(step, 1500); } else { r.phase = null; r.ran = true; saveSess(); render(); const seq = r.seq.slice(); Run.start("empan", [{ kind: "dire", lab: "Récitez les mots, dans l’ordre", txt: n + " mots", sec: Math.max(12, Math.round(n * 2.4)), tag: 0 }], (k, res) => evalEmpan(seq, res), { rec: true }); } };
      setTimeout(step, 600); break;
    }
    case "v13-rap-show": { stop(); R("rappel").show = b.dataset.id; render(); break; }
    case "v13-rap": {
      stop(); const r = R("rappel"), id = b.dataset.id, g = Number(b.dataset.g); r.g = r.g || {}; r.g[id] = g; srsGrade(id, g); r.show = null; saveSess(); render();
      if (!r.q.filter(x => r.g[x] === undefined).length) Flow.after(3000);
      break;
    }
    case "suds": { if (b.dataset.k === "pre") Flow.cancel(); break; }
    case "go": case "quit": Flow.cancel(); break;
  }
}, true);
document.addEventListener("change", e => { const el = e.target; if (el.dataset && el.dataset.v13 === "ttsrate") { pref.set("ttsrate", el.value); speakNow("Voici le nouveau débit de ma voix."); } });

// Réglage du débit dans la carte « La voix du coach »
const _home13 = viewHome;
viewHome = function () {
  let h = _home13();
  if (S.v12 && S.v12.voiceOpen) { const r = String(RATE()); h = h.replace('<p class="small muted">Sur le S24', '<div class="v11-devs"><label>Débit de la voix<select data-v13="ttsrate">' + [["0.85", "Très doux"], ["0.92", "Doux (recommandé)"], ["1", "Naturel"], ["1.08", "Vif"]].map(([v, l]) => '<option value="' + v + '"' + (r === v ? " selected" : "") + '>' + l + '</option>').join("") + '</select></label></div><p class="small muted">Sur le S24'); }
  h += '<p class="v13-ver small muted center">Version ' + APP_VERSION + (navigator.serviceWorker && navigator.serviceWorker.controller ? " · mise à jour automatique active" : "") + '</p>';
  return h;
};

// =====================================================================
// 9. MISE À JOUR AUTOMATIQUE (ordinateur et téléphone)
// =====================================================================
const idle = () => !(S.cur && S.route === "seance" && !S.cur.bilan) && !Run.on && !Studio.rec && !(RS && RS.on);
if ("serviceWorker" in navigator && !IN_FRAME && !window.claude && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  const hadCtrl = !!navigator.serviceWorker.controller; let pending = false;
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(reg => {
    const check = () => { try { reg.update(); } catch (e) { } };
    setTimeout(check, 4000); setInterval(check, 20 * 60 * 1000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check(); });
    V9.checkUpdate = check;
  }).catch(() => { });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadCtrl) return; pending = true;
    const tryReload = () => { if (pending && idle()) { pending = false; location.reload(); } };
    tryReload(); setInterval(tryReload, 5000);
  });
}
// Après chaque séance : on cherche une mise à jour
const _close13 = closeSession;
closeSession = async function () { const r = await _close13(); S.v13.onDebrief = false; setTimeout(() => V9.checkUpdate && V9.checkUpdate(), 2000); return r; };

// Vignette caméra discrète sur téléphone (le miroir s'affiche en grand sur les cartes de prise)
if (V9.Pip) { V9.Pip.min = !!IS_MOBILE; }
// L'analyse du corps se charge quand vous ne regardez pas l'écran (pendant la vidéo YouTube, par exemple),
// ou à l'ouverture de la scène de prise : jamais pendant un exercice.
const B = V9.Body, realLoad = B.load.bind(B);
B.load = function (force) {
  if (this.state === "ready") return Promise.resolve(true);
  if (force || (RS && RS.on) || document.visibilityState === "hidden") return realLoad();
  return Promise.resolve(false);
};
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && B.state !== "ready" && B.state !== "loading") realLoad().catch(() => { }); });
// Si l'analyse est lente sur l'appareil, on espace les images analysées
const realSample = B.sample.bind(B); let lastS = 0, slow = 0;
B.sample = function (v, ts) { const now = performance.now(); if (slow > 3 && now - lastS < 900) return null; lastS = now; const t0 = performance.now(); const o = realSample(v, ts); const d = performance.now() - t0; slow = d > 150 ? slow + 1 : Math.max(0, slow - 1); return o; };
render();
})();
