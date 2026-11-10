// ===== Le Verbe Souverain · v10 =====
// 1. Une nouvelle semaine se prépare toute seule dès que la précédente est terminée (semaines 2 à 12),
//    d'après la banque de contenus et vos résultats (priorité de la semaine).
// 2. Séance complète : 30 minutes au plus. Séance express : 10 minutes au plus. Analyses comprises.
// 3. Chaque étape dit pourquoi elle vient maintenant et ce qui suit : un fil continu.
// 4. Un seul geste pour démarrer : « Séance du jour » ouvre aussi la caméra et le micro.
(function () {
"use strict";
const V9 = window.V9 || {};
const camOK = () => (V9.camAllowedHere ? V9.camAllowedHere() : false);
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const first = t => { const m = String(t || "").match(/^.*?[.!?](\s|$)/); return (m ? m[0] : String(t || "")).trim(); };
const TRACKS = ["ouvrir", "argumenter", "raconter", "negocier", "improviser"];
const IMGS = ["silence", "gestes", "ecoute", "reseau", "arene"];

// =====================================================================
// 1. LA SEMAINE AUTOMATIQUE
// =====================================================================
const W1 = { t: WEEK.t, goal: WEEK.goal, sessions: WEEK.sessions.slice() };
const T1 = Object.assign({}, TECH_SHORT), P1 = Object.assign({}, PRISE_SHORT);
const OPEN = {
  conv: "Bonjour. On m’a dit que vous vouliez me voir. J’ai cinq minutes : je vous écoute.",
  nego: "Je vous écoute, mais je vous préviens : ma position est arrêtée et je ne vois pas ce qui pourrait la changer."
};
const PUSH = {
  conv: ["Je ne suis pas sûr de bien voir où vous voulez en venir.", "Concrètement, qu’est-ce que cela change pour moi ?", "Je dois partir dans une minute. Que retenez-vous de notre échange ?"],
  nego: ["Je comprends vos arguments, mais ma décision est prise. Que proposez-vous de concret ?", "Je ne peux rien céder de plus. Où êtes-vous prêt à bouger, vous ?", "Si j’accepte, quelle garantie me donnez-vous ?"]
};
function genWeek(n) {
  const W = WEEKS[clamp(n, 1, 12) - 1];
  const wk = d => W.mots.slice((d - 1) * 3, d * 3);
  const dire = d => [W.dires[d - 1][0], W.dires[d - 1][1]];
  const q = d => ({ ctx: W.questions[d - 1][0], text: W.questions[d - 1][1] });
  const tem = Math.min(W.arene.duree || 120, n === 12 ? 240 : 180);
  const S5 = [
    { t: "Ouvrir : " + W.fig.t.charAt(0).toLowerCase() + W.fig.t.slice(1), tech: { t: W.fig.t, line: first(W.fig.l), a: ["H", W.fig.l], ex: ["V", W.fig.ex] },
      fil: W.sujets[0], prise: { t: "Une minute pour ouvrir", target: 60, dims: ["confiance", "leadership", "pensee", "verbal", "vocab"], a: ["H", "Une minute sur ce sujet : " + W.sujets[0] + " Employez " + W.fig.t.toLowerCase() + " dès la première phrase."] }, x: W.fig.x },
    { t: "Argumenter : " + W.struct.t.charAt(0).toLowerCase() + W.struct.t.slice(1), tech: { t: W.struct.t, line: first(W.struct.l), a: ["H", W.struct.l], ex: ["V", "Exemple de charpente : " + (W.struct.champs || []).join(", ") + "."] },
      fil: W.sujets[1], prise: { t: "Votre argumentation", target: 90, dims: ["pensee", "persuasion", "verbal", "vocab"], a: ["H", "Une minute trente sur : " + W.sujets[1] + " Suivez la charpente : " + W.struct.t + "."] } },
    { t: "Raconter : une histoire qui prouve", tech: { t: "L’histoire en cinq temps", line: "Situation, déclencheur, obstacle, votre choix, une seule leçon.", a: ["H", "Cinq temps : la situation, le déclencheur, l’obstacle, votre choix, puis une seule leçon. Astuce de mémoire : " + W.memo.t + ". " + first(W.memo.l)], ex: ["V", W.ecoute && W.ecoute.txt ? first(W.ecoute.txt) + " " + first(W.ecoute.txt.slice(first(W.ecoute.txt).length)) : W.dires[2][0]] },
      fil: "Racontez une histoire vraie qui illustre : « " + W.dires[2][0] + " »", prise: { t: "Votre histoire en une minute trente", target: 90, dims: ["recit", "emotion", "verbal", "confiance"], a: ["H", "Racontez en une minute trente une histoire vraie qui illustre ce dire : " + W.dires[2][0] + " Cinq temps, une seule leçon à la fin."] } },
    { t: "Relation : " + W.rel.t.charAt(0).toLowerCase() + W.rel.t.slice(1), tech: { t: W.rel.t, line: first(W.rel.l), a: ["H", W.rel.l], ex: ["V", OPEN[W.rel.type] || OPEN.conv] },
      fil: W.rel.objectif, nego: { role: W.rel.role, contexte: W.rel.role.charAt(0).toUpperCase() + W.rel.role.slice(1) + ".", objectif: W.rel.objectif, open: ["V", OPEN[W.rel.type] || OPEN.conv], push: PUSH[W.rel.type] || PUSH.conv, type: W.rel.type },
      prise: { t: W.rel.t, target: 120, dims: ["nego", "persuasion", "emotion"], a: ["H", "Votre objectif : " + W.rel.objectif + " Écoutez, puis répondez en une seule prise."] } },
    { t: "L’arène : " + W.arene.t.charAt(0).toLowerCase() + W.arene.t.slice(1), temoin: true, tech: { t: "Ouvrir et finir", line: "Première phrase préparée. Dernière phrase préparée. Puis silence.", a: ["H", "Préparez votre première phrase mot à mot, puis votre dernière. Entre les deux, faites confiance à votre charpente. Et après la dernière phrase : silence."], ex: ["V", W.dires[4][0]] },
      fil: W.arene.consigne, prise: { t: W.arene.t, target: tem, dims: ["leadership", "confiance", "pensee", "verbal", "corps"], a: ["H", W.arene.consigne] } }
  ];
  return {
    n, t: W.t, goal: W.but, gen: true,
    sessions: S5.map((x, i) => Object.assign({ d: i + 1, yt: [], track: TRACKS[i], img: IMGS[i], words: wk(i + 1), dire: dire(i + 1), vire: [0, 1], q: q(i + 1), _gen: true }, x))
  };
}
V9.genWeek = genWeek;
const weekOf = n => clamp(Math.ceil(clamp(n, 1, TOTAL) / 5), 1, 12);
function applyWeek(n) {
  if (n === 1) { Object.assign(WEEK, { n: 1, t: W1.t, goal: W1.goal, sessions: W1.sessions.slice(), gen: false }); Object.assign(TECH_SHORT, T1); Object.assign(PRISE_SHORT, P1); return; }
  const g = genWeek(n); Object.assign(WEEK, g);
  g.sessions.forEach(s => { TECH_SHORT[s.d] = s.tech.line; PRISE_SHORT[s.d] = s.prise.t + "."; s.words.forEach(w => { if (!WORD_IX[w[0]]) WORD_IX[w[0]] = { m: w[0], def: w[1], ex: w[2], w: n - 1 }; }); });
}
function syncWeek() {
  if (S.cur) return false;
  const n = weekOf(nextSession()); if (WEEK.n === n) return false;
  const prev = WEEK.n; applyWeek(n);
  if (S.ready && n > prev) { weekFocus(n).then(() => { if (S.route === "home") render(); }); toast("Semaine " + n + " prête : « " + WEEK.t + " »."); }
  return true;
}
// Une séance d'une autre semaine (rouverte depuis le parcours) reçoit aussi son contenu
const _si10 = sessionInfo;
sessionInfo = function (n) {
  const info = _si10(n); if (info.pack || n < 1 || n > TOTAL) return info;
  const wn = weekOf(n), P = wn === 1 ? W1.sessions[(n - 1) % 5] : genWeek(wn).sessions[(n - 1) % 5];
  info.pack = P; info.mots = P.words; info.dire = [P.dire[0], P.dire[1], ""]; info.direId = "k:" + P.dire[0].slice(0, 60);
  info.sujet = P.fil; info.question = [P.q.ctx, P.q.text];
  return info;
};

// ---------- La priorité de la semaine, tirée de vos fiches ----------
const DRILL_OF = { ancrage: "ancrage", regard: "regard", parasites: "relais", diction: "metronome", structure: "prep", pathos: "intensites" };
async function weekFocus(n) {
  try {
    const L = (await V9.Takes.list()).filter(t => t.grid && t.grid.g).slice(0, 12); if (L.length < 2) return null;
    const avg = {}; Object.keys(V9.CRIT).forEach(k => { const v = L.filter(t => t.grid.g[k]).map(t => t.grid.g[k].s); if (v.length >= 2) avg[k] = mean(v); });
    const ks = Object.keys(avg).sort((a, b) => avg[a] - avg[b]); if (!ks.length) return null;
    const k = ks[0]; S.profile.v10 = { week: n, focus: k, avg: Math.round(avg[k] * 10) / 10, at: Date.now() };
    const D = DRILLS7[DRILL_OF[k]]; if (D) v7().rx = { drill: DRILL_OF[k], cause: "Votre moyenne en " + V9.CRIT[k].t.toLowerCase() + " est de " + comma(S.profile.v10.avg) + " sur 5 sur vos dernières prises.", dim: D.dim };
    saveProfile(); return k;
  } catch (e) { return null; }
}
const focusLine = () => { const f = S.profile.v10; return f && f.focus && V9.CRIT && V9.CRIT[f.focus] ? V9.CRIT[f.focus].t + " (" + comma(f.avg) + "/5 en moyenne)" : ""; };

// ---------- Voix : les semaines générées sont lues par la synthèse vocale du téléphone ----------
const GEN_CLIP = /^(s[1-5]-(tech|ex|prise|dire|q|w[0-2])|nego[1-5])$/;
const curPack = () => (S.cur && S.cur.info && S.cur.info.pack) || (WEEK.sessions && WEEK.sessions[(nextSession() - 1) % 5]) || null;
function clipText(id) {
  const P = curPack(); if (!P || !P._gen) return null;
  if (id.startsWith("nego")) return P.nego ? P.nego.open[1] + " " + P.nego.push.join(" ") : null;
  const k = id.split("-")[1];
  if (k === "tech") return P.tech.t + ". " + P.tech.a[1];
  if (k === "ex") return P.tech.ex[1];
  if (k === "prise") return P.prise.a[1];
  if (k === "dire") return P.dire[0] + " " + P.dire[1] + ".";
  if (k === "q") return P.q.text;
  if (k[0] === "w") { const w = P.words[Number(k.slice(1))]; return w ? w[0] + ". " + w[1] + " Exemple : " + w[2] : null; }
  return null;
}
const _vhas = Voice.has, _vplay = Voice.play.bind(Voice);
Voice.has = id => GEN_CLIP.test(id) && curPack() && curPack()._gen ? TTS.ok : _vhas(id);
Voice.play = function (id, rate = 1, onend) {
  if (GEN_CLIP.test(id) && curPack() && curPack()._gen) {
    const txt = clipText(id); if (!txt || !TTS.ok) return false;
    this.stop(); const me = { id, tts: true }; this.cur = me; markAud();
    TTS.speak(txt, Math.min(1.05, rate), () => { if (this.cur === me) { this.cur = null; markAud(); if (onend) onend(); } });
    return true;
  }
  return _vplay(id, rate, onend);
};

// =====================================================================
// 2. LE TEMPS : 30 minutes au plus, 10 en express, analyses comprises
// =====================================================================
const PLAN = {
  full: { studio: 20, meteo: 15, souffle: [110, "cyc", 10], forge: [220, "n", 8], rappel: 60, mots3: 100, empan: 100, capsule: 120, prescrit: 120, prise1: 210, prise2: 180, sim: 360, roulette: 180, question: 150, bilan: 60 },
  express: { studio: 20, meteo: 10, souffle: [50, "cyc", 4], forge: [100, "n", 4], prise1: 150, question: 120, bilan: 40 }
};
const _bc10 = buildCards;
buildCards = function (c) {
  const C = _bc10(c), P = c.info && c.info.pack; if (!P || !P.track) return C;
  const T = c.express ? PLAN.express : PLAN.full;
  let out = C.filter(x => !(x.k === "studio" && camOK()));
  out.forEach(x => {
    const v = T[x.k];
    if (Array.isArray(v)) { x.sec = v[0]; x[v[1]] = v[2]; if (x.k === "forge") x.t = "La Forge · " + v[2] + " phrases"; }
    else if (typeof v === "number") x.sec = v;
    if (x.k === "modele") x.sec = Math.min(150, (MODELES[P.d] ? MODELES[P.d].dur : 90) + 30);
    if (x.k === "prise1" && !c.express) x.sec = Math.min(330, Math.max(210, (P.prise.target || 60) + 120));
    if (x.k === "roulette" && (P.prise.target || 0) > 180) x.opt = true;
  });
  return out;
};
// En express, la prise dure une minute au plus
const _sbox10 = speechBox;
speechBox = function (id, o) {
  const c = S.cur;
  if (c && c.express && o && o.target) { o = Object.assign({}, o, { target: Math.min(60, o.target) }); const r = R(id); if (r.budget > 60) r.budget = 60; }
  return _sbox10(id, o);
};
const remSec = (cards, from) => cards.slice(from).reduce((a, x) => a + x.sec, 0);
// Gardien du temps : rien ne dépasse, même pendant les analyses
setInterval(() => {
  const c = S.cur; if (!c || S.route !== "seance" || c.bilan || !c.info || !c.info.pack || !c.info.pack.track) return;
  const cards = buildCards(c), cur = c.card || 0, total = budgetSec(c), el = elapsedMs(c) / 1000;
  const bi = cards.findIndex(x => x.k === "bilan"), qi = cards.findIndex(x => x.k === "question"); if (bi < 0) return;
  const bs = cards[bi].sec, qs = qi >= 0 ? cards[qi].sec : 0;
  const recording = (V9.RecStage && V9.RecStage.on) || Studio.rec || Run.on;
  if (el >= total - 5 && recording) { if (V9.RecStage && V9.RecStage.on) V9.RecStage.stop(); else if (Run.on) Run.next(); return; }
  if (recording) return;
  if (cur < bi && el >= total - bs) { toast("Il reste " + Math.max(1, Math.round((total - el) / 60)) + " minute : place au bilan."); cardGo(bi); return; }
  if (qi >= 0 && cur < qi && el >= total - bs - qs) { toast("Pour tenir le temps, on passe directement à la question piège."); cardGo(qi); }
}, 1000);
// « Encore une minute » seulement s'il reste de la marge
window.addEventListener("click", e => {
  const b = e.target.closest('[data-act="stay"]'); if (!b) return;
  const c = S.cur; if (!c) return;
  const cards = buildCards(c), need = remSec(cards, (c.card || 0) + 1), left = budgetSec(c) - elapsedMs(c) / 1000;
  if (left - need < 75) { e.preventDefault(); e.stopImmediatePropagation(); toast("Plus de marge aujourd’hui : on avance pour tenir les " + Math.round(budgetSec(c) / 60) + " minutes."); }
}, true);
// Les transcriptions passent l'une après l'autre (deux prises rapprochées ne se gênent pas)
let asrQ = Promise.resolve();
["transcribe", "transcribeTS"].forEach(k => { const f = ASR[k] && ASR[k].bind(ASR); if (!f) return; ASR[k] = (...a) => { const p = asrQ.then(() => f(...a)); asrQ = p.catch(() => { }); return p; }; });

// =====================================================================
// 3. LE FIL DE LA SÉANCE : pourquoi maintenant, et ce qui suit
// =====================================================================
function bridge(k, c) {
  const P = c.info.pack, words = P.words.map(w => w[0]).join(", "), f = S.profile.v10;
  const g = (R("impro") || {}).grid;
  const B = {
    studio: "Ouvrez la caméra une fois : toute la séance s’en sert.",
    meteo: "Votre trac maintenant : on le remesurera à la fin pour voir le chemin parcouru.",
    souffle: "Une voix posée part du ventre : ce souffle portera votre prise filmée.",
    forge: "La voix est chaude, on affûte l’articulation : chaque syllabe nette compte pour la diction.",
    rappel: "Se rappeler avant d’apprendre : c’est l’effort de rappel qui grave la mémoire.",
    mots3: "Trois mots à placer tout à l’heure dans votre prise : " + words + ". La transcription vérifiera.",
    empan: "Votre mémoire de travail portera votre plan sans notes.",
    modele: "Voir un maître le faire, puis le refaire vous-même dans la prise.",
    capsule: "Nourrir le fond : une idée à réutiliser face à votre interlocuteur.",
    prescrit: "Exercice ciblé sur votre point faible, juste avant la prise" + (f && f.focus ? " : " + V9.CRIT[f.focus].t.toLowerCase() + "." : "."),
    prise1: "Le cœur de la séance : tout ce qui précède sert cette prise. Technique du jour : " + P.tech.t + ".",
    prise2: g && g.weak ? "Même sujet, un seul conseil à appliquer : " + V9.CRIT[g.weak].t.toLowerCase() + ". C’est là que l’on progresse." : "Même sujet, un seul conseil à appliquer : c’est là que l’on progresse.",
    sim: "Appliquez la technique du jour face à un interlocuteur exigeant.",
    roulette: "Improviser vite, pour que le discours témoin coule ensuite.",
    question: "L’arène : garder le calme et la structure sous la pression.",
    bilan: "On mesure, on compare au début, on fixe la priorité de demain."
  };
  return B[k] || "";
}
function itinerary(c) {
  const cards = buildCards(c), P = c.info.pack, blocks = [];
  cards.forEach(x => { const b = BLOCKS[x.B] || ""; const last = blocks[blocks.length - 1]; if (last && last.b === b) { last.sec += x.sec; last.n.push(x.t); } else blocks.push({ b, sec: x.sec, n: [x.t] }); });
  const tot = cards.reduce((a, x) => a + x.sec, 0), fl = focusLine();
  return '<div class="v10-iti"><div class="eyebrow">Aujourd’hui · ' + Math.round(budgetSec(c) / 60) + ' minutes au plus</div><p class="v10-goal"><b>' + esc(P.t) + '</b><br>' + esc(P.tech.t) + ' · ' + esc(P.tech.line) + '</p>' +
    (fl ? '<p class="small"><b>Priorité de la semaine :</b> ' + esc(fl) + '</p>' : "") +
    '<ol>' + blocks.map(x => '<li><span>' + esc(x.b) + '</span><em>' + Math.max(1, Math.round(x.sec / 60)) + ' min</em><small>' + esc(x.n.join(" · ")) + '</small></li>').join("") + '</ol>' +
    '<p class="small muted">Prévu : ' + Math.round(tot / 60) + ' minutes d’exercices, le reste pour les analyses. Tout s’enchaîne seul.</p></div>';
}
const _vs10 = viewSession;
viewSession = function () {
  const c = S.cur; let h = _vs10();
  if (!c || c.bilan || !c.info || !c.info.pack || !c.info.pack.track) return h;
  const cards = buildCards(c), i = clamp(c.card || 0, 0, cards.length - 1), cd = cards[i], nx = cards[i + 1];
  const br = bridge(cd.k, c), extra = (cd.k === "meteo" || (i === 0 && cd.k !== "meteo")) ? itinerary(c) : "";
  h = h.replace(/(<div class="cardx[^"]*" data-k="[^"]*">)/, "$1" + (br ? '<p class="v10-bridge">' + esc(br) + '</p>' : "") + extra);
  if (nx) h = h.replace('data-act="cnext">Suivant</button>', 'data-act="cnext"><span class="v10-nx">Suivant · ' + esc(nx.t) + '</span></button>');
  if (cd.k === "prise1") { const f = S.profile.v10; if (f && f.focus) h = h.replace('<div class="mots-defi">', '<div class="tip v10-focus"><span>Dans cette prise, votre priorité</span><b>' + esc(V9.CRIT[f.focus].t) + ' : ' + esc(focusTip(f.focus)) + '</b></div><div class="mots-defi">'); }
  return h;
};
const focusTip = k => ({ ancrage: "pieds immobiles, seules les mains bougent.", regard: "finissez chaque phrase dans l’objectif.", parasites: "chaque « euh » devient un silence.", diction: "finissez chaque syllabe finale.", structure: "annoncez trois parties, puis une chute.", pathos: "une phrase douce, puis une phrase portée." })[k] || "";

// La négociation hors ligne suit la semaine en cours
const _sim10 = CARD.sim;
CARD.sim = function (c, info) {
  const N = info.pack.nego;
  if (coachOn() || !N || !N.push) return _sim10(c, info);
  let h = _sim10(c, info);
  // remplace les relances de la semaine 1 par celles de la situation du jour
  return h.replace(/<div class="chat">[\s\S]*?<\/div>(?=<div class="cx-aud">)/, '<div class="chat"><div class="bub them">' + esc(N.open[1]) + '</div>' + N.push.map(x => '<div class="bub them">' + esc(x) + '</div>').join("") + '</div>');
};

// =====================================================================
// 4. UN SEUL GESTE : « Séance du jour » ouvre aussi la caméra et le micro
// =====================================================================
const _start10 = startSession;
startSession = async function (n, express) {
  syncWeek();
  const p = (camOK() && !Studio.ok()) ? Studio.open().catch(() => false) : null;
  await _start10(n, express);
  if (p) p.then(() => render());
};
// Le temps ne court pas quand on quitte la séance pour la vidéothèque
window.addEventListener("click", e => {
  const b = e.target.closest('[data-act="v9-open"],[data-act="go"]'); if (!b) return;
  const c = S.cur; if (c && S.route === "seance" && typeof bankTime === "function") { bankTime(c); c.resumeAt = 0; saveSess(); }
}, true);
window.addEventListener("click", e => {
  const b = e.target.closest('[data-act="v9-back"]'); if (!b) return;
  const c = S.cur; if (c && S.v9 && S.v9.back === "seance" && !S.v9.take && !S.v9.cmpView) { c.resumeAt = Date.now(); }
}, false);

// =====================================================================
// 5. ACCUEIL ET PARCOURS : la semaine se renouvelle d'elle-même
// =====================================================================
const _home10 = viewHome;
viewHome = function () {
  syncWeek();
  let h = _home10();
  const fl = focusLine();
  if (fl) h = h.replace('<p class="muted">' + esc(WEEK.goal) + '</p>', '<p class="muted">' + esc(WEEK.goal) + '</p><p class="small v10-wf"><b>Priorité de la semaine :</b> ' + esc(fl) + '</p>');
  if (nextSession() >= TOTAL && S.profile.done.includes(TOTAL)) h = h.replace('<section class="card week-hero">', '<section class="card"><p><b>Les douze semaines sont terminées.</b> Reprenez la semaine de votre choix dans le Parcours : vos fiches vous diront où vous en êtes.</p></section><section class="card week-hero">');
  return h;
};
const _path10 = viewPath;
viewPath = function () {
  syncWeek();
  return _path10().replace("Chaque dimanche, la semaine suivante est préparée d’après vos résultats : nouvelles photos, nouveaux audios, nouveaux sujets.", "Dès que vous terminez les cinq séances, la semaine suivante se prépare toute seule : nouveaux mots, nouveaux sujets, nouvelle technique, et une priorité tirée de vos fiches. Douze semaines au total.") +
    '<section class="card"><div class="eyebrow">Les douze semaines</div><ol class="v10-weeks">' + WEEKS.map((W, i) => '<li class="' + (i + 1 < WEEK.n ? "done" : i + 1 === WEEK.n ? "now" : "") + '"><b>' + (i + 1) + '</b><span>' + esc(W.t) + '</span></li>').join("") + '</ol></section>';
};
// Après la clôture d'une séance, la semaine suivante peut s'ouvrir
const _close10 = closeSession;
closeSession = async function () { const r = await _close10(); setTimeout(() => { if (!S.cur && syncWeek()) render(); }, 400); return r; };

applyWeek(weekOf(nextSession()));
const wait = setInterval(() => { if (S.ready) { clearInterval(wait); if (syncWeek() || true) { if (!S.profile.v10 || S.profile.v10.week !== WEEK.n) weekFocus(WEEK.n).then(k => { if (k && S.route === "home") render(); }); render(); } } }, 300);
V9.syncWeek = syncWeek; V9.applyWeek = applyWeek; V9.PLAN = PLAN;
render();
})();
