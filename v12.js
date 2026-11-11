// ===== Le Verbe Souverain · v12 =====
// 1. Voix du coach : la voix française de l'appareil (naturelle), avec choix de la voix.
// 2. Consignes complètes, parlées à chaque exercice, réécoutables.
// 3. Protocole de chaque exercice enregistré : consigne, compte à rebours 5-0, enregistrement, « Continuer ».
// 4. Évaluation différée : un débrief parlé de trois à cinq minutes, avant le bilan.
// 5. La charpente du discours rappelée, avec exemple, avant chaque prise de parole.
// 6. Vidéos de maîtres en français, suivies d'un bilan parlé de trente secondes.
(function () {
"use strict";
const V9 = window.V9, X = window.V12C;
const pref = { get: k => { try { return localStorage.getItem("vs1:" + k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem("vs1:" + k, v || ""); } catch (e) { } } };
S.v12 = S.v12 || { speaking: null, debriefBusy: false, showGrids: false };
const pack = () => (S.cur && S.cur.info && S.cur.info.pack) || null;
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const r1 = v => Math.round(v * 10) / 10;

// =====================================================================
// 1. LA VOIX DU COACH
// =====================================================================
const FR_PREF = [/google.*fran/i, /hortense/i, /julie/i, /paul/i, /denise/i, /henri/i, /thomas/i, /am[ée]lie/i, /audrey/i, /aur[ée]lie/i, /fr[-_]FR/i, /^fr/i];
const frVoices = () => { try { return speechSynthesis.getVoices().filter(v => /^fr/i.test(v.lang)); } catch (e) { return []; } };
TTS.pick = function () {
  try {
    const vs = frVoices(); const want = pref.get("ttsvoice");
    this.voice = (want && vs.find(v => v.voiceURI === want)) || FR_PREF.map(re => vs.find(v => re.test(v.name) || re.test(v.lang))).find(Boolean) || vs[0] || null;
  } catch (e) { }
};
if (TTS.ok) { try { TTS.pick(); speechSynthesis.onvoiceschanged = () => { TTS.pick(); }; } catch (e) { } }
const ttsReady = () => TTS.ok && (TTS.voice || frVoices().length > 0);
const voiceMode = () => pref.get("voicemode") || (ttsReady() ? "tts" : "mp3");
// Dire un texte, avec garde-fou : si le moteur ne répond pas, on continue quand même.
function say(text, onend, rate) {
  if (!text) { if (onend) onend(); return false; }
  const est = ttsReady() ? Math.min(60000, 1500 + String(text).length * 62) : 6000;
  let done = false; const fin = () => { if (done) return; done = true; clearTimeout(tm); S.v12.speaking = null; markAud && markAud(); if (onend) onend(); };
  const tm = setTimeout(fin, est + 2500);
  if (!TTS.ok || !ttsReady()) { setTimeout(fin, est); return false; }
  S.v12.speaking = text;
  const ok = TTS.speak(String(text).replace(/\s\/\s/g, ", "), rate || 1, fin);
  if (!ok) setTimeout(fin, 300);
  return ok;
}
// Lecture longue, par phrases, avec pause et reprise
const Reader = {
  q: [], i: 0, on: false, paused: false, onend: null,
  start(text, onend) {
    this.stop(); this.onend = onend || null;
    this.q = String(text).replace(/\s+/g, " ").match(/[^.!?…]+[.!?…]+["»]?\s*|[^.!?…]+$/g) || [text];
    // regrouper en morceaux d'environ 220 caractères
    const chunks = []; let cur = "";
    this.q.forEach(s => { if ((cur + s).length > 220 && cur) { chunks.push(cur.trim()); cur = s; } else cur += s; }); if (cur.trim()) chunks.push(cur.trim());
    this.q = chunks; this.i = 0; this.on = true; this.paused = false; this.next();
  },
  next() {
    if (!this.on || this.paused) return;
    if (this.i >= this.q.length) { this.on = false; S.v12.reading = false; if (this.onend) this.onend(); paintReader(); return; }
    S.v12.reading = true; paintReader();
    const t = this.q[this.i++]; say(t, () => this.next(), 1);
  },
  pause() { this.paused = true; try { speechSynthesis.cancel(); } catch (e) { } paintReader(); },
  resume() { if (!this.on) return; this.paused = false; this.i = Math.max(0, this.i - 1); this.next(); },
  stop() { this.on = false; this.paused = false; this.q = []; try { speechSynthesis.cancel(); } catch (e) { } S.v12.reading = false; paintReader(); }
};
function paintReader() { $$("[data-reader]").forEach(b => { b.textContent = Reader.on ? (Reader.paused ? "Reprendre" : "Pause") : "Réécouter"; b.dataset.act = Reader.on ? (Reader.paused ? "v12-resume" : "v12-pause") : "v12-replay"; }); }

// Le texte de chaque consigne audio
const full = c => c ? [c.what, c.why, c.how, c.ex].filter(Boolean).join(" ") : "";
function structureSay(track) { return X.STRUCTURE.say + " " + (X.STRUCTURE.ex[track] || X.STRUCTURE.ex.ouvrir); }
function textOf(id) {
  const P = pack(), W = WEEK;
  let m;
  if ((m = id.match(/^c8-(\w+)$/))) {
    const k = m[1];
    if (k === "prescrit" && S.cur) { const d = prescribed(S.cur); return full(X.C.prescrit) + " " + full(X.DRILL[d] || { what: DRILLS7[d].t, how: DRILLS7[d].line }); }
    if (X.C[k]) return full(X.C[k]);
    if (typeof SHORT !== "undefined" && SHORT[k]) return SHORT[k];
  }
  if ((m = id.match(/^c-(\w+)$/)) && W.common && W.common[m[1]]) return W.common[m[1]][1];
  if ((m = id.match(/^x(\d+)$/))) return VIRE10[Number(m[1])] || null;
  if ((m = id.match(/^t(\d+)$/))) return TOPICS[Number(m[1])] || null;
  if ((m = id.match(/^q(\d)-(\d+)$/))) { const q = QBANK[Number(m[1])] && QBANK[Number(m[1])][Number(m[2])]; return q ? q[0] + ". " + q[1] : null; }
  if ((m = id.match(/^v(\d+)f?$/)) && W.vire && W.vire[Number(m[1])]) return W.vire[Number(m[1])][1];
  if ((m = id.match(/^d-(\w+)$/))) { const D = X.DRILL[m[1]]; return D ? full(D) : (DRILLS7[m[1]] ? DRILLS7[m[1]].a : null); }
  if ((m = id.match(/^cap(\d)$/))) { const cp = CAPSULES[(Number(m[1]) - 1) % CAPSULES.length]; return cp ? cp.t + ". " + cp.txt : null; }
  if ((m = id.match(/^m(\d)$/))) { const M = MODELES[Number(m[1])]; return M ? M.t + ". " + M.why + " " + M.obs + " À retenir : " + M.keep : null; }
  if ((m = id.match(/^s(\d)-(\w+)$/))) {
    const d = Number(m[1]), k = m[2], Q = (P && P.d === d) ? P : (W.sessions && W.sessions[d - 1]); if (!Q) return null;
    if (k === "tech") return Q.tech.t + ". " + (Q.tech.a ? Q.tech.a[1] : Q.tech.line);
    if (k === "ex") return Q.tech.ex ? Q.tech.ex[1] : null;
    if (k === "prise") return (Q.prise.a ? Q.prise.a[1] : Q.fil) + " " + structureSay(Q.track);
    if (k === "dire") return Q.dire[0] + " " + Q.dire[1] + ".";
    if (k === "q") return Q.q.ctx + ". " + Q.q.text + " " + X.C.question.how;
    if ((m = k.match(/^w(\d)$/))) { const w = Q.words[Number(m[1])]; return w ? w[0] + ". " + w[1] + " Exemple : " + w[2] : null; }
  }
  if ((m = id.match(/^nego(\d)$/))) { const Q = (P && P.d === Number(m[1])) ? P : W.sessions[Number(m[1]) - 1]; return Q && Q.nego ? Q.nego.open[1] + " " + (Q.nego.push || []).join(" ") : null; }
  return null;
}
V9.textOf = textOf;
const _vplay12 = Voice.play.bind(Voice), _vhas12 = Voice.has;
Voice.has = id => (voiceMode() === "tts" && ttsReady() && !!textOf(id)) || _vhas12(id);
Voice.play = function (id, rate = 1, onend) {
  if (voiceMode() === "tts" && ttsReady()) {
    const t = textOf(id);
    if (t) { this.stop(); const me = { id, tts: true }; this.cur = me; markAud(); say(t, () => { if (this.cur === me) { this.cur = null; markAud(); if (onend) onend(); } }, Math.min(1.05, rate)); return true; }
  }
  return _vplay12(id, rate, onend);
};
const _vstop12 = Voice.stop.bind(Voice);
Voice.stop = function (keepTts) { _vstop12(keepTts); if (!keepTts) { try { speechSynthesis.cancel(); } catch (e) { } } };

// Réglage de la voix (accueil)
function voiceCard() {
  const vs = frVoices(), cur = TTS.voice ? TTS.voice.voiceURI : "", mode = voiceMode();
  let h = '<section class="card v12-voice"><div class="row-between"><div><div class="eyebrow">La voix du coach</div><h3>' + (mode === "tts" ? (TTS.voice ? esc(TTS.voice.name.replace(/Microsoft |Google /, "")) : "Voix de l’appareil") : "Voix enregistrée") + '</h3></div><button class="btn ghost sm" data-act="v12-voice-test">Écouter</button></div>';
  if (S.v12.voiceOpen) {
    h += '<div class="v11-devs"><label>Source<select data-v12="voicemode"><option value="tts"' + (mode === "tts" ? " selected" : "") + '>Voix française de l’appareil (naturelle)</option><option value="mp3"' + (mode === "mp3" ? " selected" : "") + '>Voix enregistrée</option></select></label>' +
      (vs.length ? '<label>Voix<select data-v12="ttsvoice">' + vs.map(v => '<option value="' + esc(v.voiceURI) + '"' + (v.voiceURI === cur ? " selected" : "") + '>' + esc(v.name) + ' (' + esc(v.lang) + ')</option>').join("") + '</select></label>' : '<p class="small muted">Aucune voix française trouvée sur cet appareil : la voix enregistrée sera utilisée. Sur Android, installez « Synthèse vocale Google » et la voix français.</p>') + '</div>' +
      '<p class="small muted">Sur le S24, la meilleure voix est en général « Google français ». Sur Windows, « Hortense » ou « Julie ».</p><button class="link small" data-act="v12-voice-close">Fermer</button>';
  } else h += '<button class="link small" data-act="v12-voice-open">Changer la voix</button>';
  return h + '</section>';
}

// =====================================================================
// 2. LE PROTOCOLE DES EXERCICES ENREGISTRÉS (moteur Run enrichi)
// =====================================================================
const _runStart = Run.start.bind(Run), _runDraw = Run.draw.bind(Run), _runTick = Run.tick.bind(Run), _runEnter = Run.enter.bind(Run), _runNext = Run.next.bind(Run);
function protocol(segs, brief) {
  const out = [];
  if (brief) out.push({ kind: "consigne", lab: brief.t || "Consigne", txt: brief.text, say: brief.say || brief.text, sec: 1e9 });
  segs.forEach((s, i) => {
    if (s.kind === "dire") { out.push({ kind: "count", lab: s.lab, txt: s.txt, sec: 5 }); out.push(s); const last = i === segs.length - 1; out.push({ kind: "pause", lab: last ? "Enregistré." : "Enregistré. Continuez quand vous êtes prêt.", sec: 1e9, last }); }
    else out.push(s);
  });
  return out;
}
Run.start = function (key, segs, done, opt) {
  const brief = opt && opt.brief; const seq = protocol(segs, brief);
  _runStart(key, seq, done, opt);
};
Run.enter = function () {
  const s = this.segs[this.i]; if (!s) return;
  if (s.kind === "consigne") { this.t0 = Date.now(); this.lastPulse = 0; this.draw(); Voice.stop(); const me = s; say(s.say, () => { if (this.on && this.segs[this.i] === me) setTimeout(() => { if (this.on && this.segs[this.i] === me) this.next(); }, 600); }); return; }
  if (s.kind === "count") { this.t0 = Date.now(); this.lastPulse = -1; this.draw(); return; }
  if (s.kind === "pause") { this.closeWin(); this.t0 = Date.now(); this.draw(); beep(2, 1046); return; }
  _runEnter();
};
Run.tick = function () {
  if (!this.on) return; const s = this.segs[this.i]; if (!s) return;
  if (s.kind === "pause" || s.kind === "consigne") return;
  if (s.kind === "count") {
    const el = (Date.now() - this.t0) / 1000, n = Math.ceil(5 - el);
    const t = $("#run-t"); if (t && n !== this.lastPulse) { this.lastPulse = n; t.textContent = Math.max(0, n); t.classList.remove("pop"); void t.offsetWidth; t.classList.add("pop"); beep(1, n <= 1 ? 880 : 660); }
    if (el >= 5) this.next();
    return;
  }
  _runTick();
};
Run.draw = function () {
  const el = $("#run"), s = this.segs[this.i]; if (!el || !s) return;
  const n = this.segs.filter(x => x.kind === "dire").length, k = this.segs.slice(0, this.i + 1).filter(x => x.kind === "dire").length;
  el.className = s.kind;
  const prog = n > 1 ? ' · prise ' + Math.min(n, Math.max(1, k)) + ' sur ' + n : "";
  let h = '<div class="run-in">';
  if (s.kind === "consigne") {
    h += '<div class="run-top">Consigne</div><h2 class="run-lab">' + esc(s.lab) + '</h2><p class="v12-cons">' + esc(s.txt) + '</p>' +
      '<div class="run-btns"><button class="btn" data-act="run-next">Commencer maintenant</button><button class="btn ghost" data-act="v12-run-replay">Réécouter</button><button class="btn ghost" data-act="run-stop">Arrêter</button></div><p class="small muted">Le compte à rebours part de lui-même à la fin de la consigne.</p>';
  } else if (s.kind === "count") {
    h += '<div class="run-top">Préparez-vous' + prog + '</div><div class="run-t pop" id="run-t">5</div><p class="run-lab">' + esc(s.lab) + '</p>' + (s.txt ? '<p class="run-txt">' + esc(s.txt) + '</p>' : "") + '<div class="run-btns"><button class="btn ghost" data-act="run-stop">Arrêter</button></div>';
  } else if (s.kind === "pause") {
    h += '<div class="run-top ok">✓ ' + esc(s.lab) + '</div><p class="v12-cons">' + (s.last ? "Dernière prise terminée. L’évaluation vous attend au débrief, en fin de séance." : "Reprenez votre souffle. La prise suivante démarre quand vous touchez Continuer.") + '</p>' +
      '<div class="run-btns"><button class="btn" data-act="run-next">' + (s.last ? "Terminer" : "Continuer") + '</button><button class="btn ghost" data-act="run-stop">Arrêter</button></div>';
  } else if (s.kind === "dire") {
    h += '<div class="run-top"><span class="rec-dot">● enregistrement</span>' + prog + '</div><div class="run-t" id="run-t">' + Math.ceil(s.sec) + '</div><p class="run-lab">' + esc(s.lab) + '</p>' + (s.txt ? '<p class="run-txt">' + esc(s.txt) + '</p>' : "") +
      '<div class="run-btns"><button class="btn" data-act="run-next">J’ai terminé</button><button class="btn ghost" data-act="run-stop">Arrêter</button></div>';
  } else { _runDraw(); return; }
  el.innerHTML = h + '</div>';
};

// La Forge, réorganisée : écouter, compte à rebours, trois répétitions dans une seule prise, continuer
forgeSegs = function (ids) {
  const out = [];
  ids.forEach((i, k) => {
    const t = VIRE10[i], s = Math.max(4, syllEst(t));
    out.push({ kind: "ecoute", lab: t, txt: "Phrase " + (k + 1) + " sur " + ids.length + " · écoutez", aud: "x" + i, waitAud: true, sec: 12 });
    out.push({ kind: "dire", lab: t, txt: "Trois fois : lentement, normalement, puis vite et net", sec: Math.round(s * 0.95 + 7), tag: i });
  });
  return out;
};
// Trois mots : une seule séquence enregistrée, un mot à la fois
function mots3Segs(P) {
  const out = [];
  P.words.forEach((w, i) => {
    out.push({ kind: "ecoute", lab: w[0], txt: w[1], aud: "s" + P.d + "-w" + i, waitAud: true, sec: 14 });
    out.push({ kind: "dire", lab: w[0], txt: "Une phrase complète avec ce mot, dans votre contexte", sec: 14, tag: i });
  });
  return out;
}
async function evalMots3(P, res) {
  const r = R("mots3"); r.m = r.m || {}; r.ran = true;
  if (!res.file) { r.noEval = true; saveSess(); render(); return; }
  S.evalBusy = "mots3"; render();
  try {
    for (let i = 0; i < P.words.length; i++) {
      const w = res.wins.find(x => x[2] === i); if (!w) continue;
      const H = await hear(res.file, [[w[0], w[1]]]);
      r.m[i] = { text: H.text, ok: vocabUsed(H.text, [P.words[i][0]]).length > 0, com: "", best: "" }; srsAdd("w:" + P.words[i][0], "w");
    }
  } catch (e) { r.noEval = true; }
  S.evalBusy = null; saveSess(); render();
}

// =====================================================================
// 3. LES CARTES : consigne parlée, bouton Réécouter, évaluation différée
// =====================================================================
const line = t => '<p class="cx-l">' + esc(t) + '</p>', ttl = t => '<h2 class="cx-t">' + esc(t) + '</h2>';
const done = (t) => '<div class="v12-done">✓ ' + esc(t) + '<span>Évaluation au débrief, en fin de séance.</span></div>';
const consBox = (k, extra) => { const c = X.C[k]; if (!c) return ""; return '<div class="v12-consigne"><div class="eyebrow">Consigne</div><p><b>' + esc(c.what) + '</b> ' + esc(c.why) + '</p><p>' + esc(c.how) + (extra ? " " + esc(extra) : "") + '</p>' + (c.ex ? '<p class="small muted">' + esc(c.ex) + '</p>' : "") + '</div>'; };
const brief = (k, extra) => { const c = X.C[k]; return { t: c.what, text: c.how + (extra ? " " + extra : "") + (c.ex ? " " + c.ex : ""), say: full(c) + (extra ? " " + extra : "") }; };

CARD.forge = function (c, info, cd) {
  const ids = vireOfDay(info.pack.d).slice(0, cd.n), r = R("forge");
  let h = ttl("La Forge") + consBox("forge");
  if (S.evalBusy === "forge") return h + '<div class="analysing"><span class="pulse"></span>J’écoute votre Forge…</div>';
  if (r.acc != null || r.ran) h += done("Forge enregistrée : " + ids.length + " phrases.");
  else h += '<ol class="vire-list">' + ids.map(i => '<li>' + esc(VIRE10[i]) + '</li>').join("") + '</ol>';
  h += '<button class="btn wide big-act2" data-act="forge8" data-n="' + cd.n + '">' + (r.ran || r.acc != null ? "Recommencer" : "Commencer") + ' · ' + fmtSec(forgeSegs(ids).reduce((a, s) => a + (s.kind === "ecoute" ? 6 : s.sec + 8), 0)) + '</button>';
  if (!Studio.ok()) h += '<p class="center small muted">Activez la caméra et le micro pour que je vous évalue.</p>';
  return h;
};
CARD.mots3 = function (c, info) {
  const P = info.pack, r = R("mots3"); r.m = r.m || {};
  let h = ttl("Trois mots nouveaux") + consBox("mots3") + '<ul class="mots3">' + P.words.map((w, i) => '<li><div><b>' + esc(w[0]) + '</b><span>' + esc(w[1]) + '</span><em class="small muted">' + esc(w[2]) + '</em>' + (r.m[i] && r.ran ? '<p class="m-res ok">✓ enregistré</p>' : "") + '</div><div class="m-act">' + audBtn("s" + P.d + "-w" + i, "Écouter") + '</div></li>').join("") + '</ul>';
  if (S.evalBusy === "mots3") return h + '<div class="analysing"><span class="pulse"></span>Je vérifie vos phrases…</div>';
  if (r.ran) h += done("Trois phrases enregistrées.");
  h += '<button class="btn wide big-act2" data-act="v12-mots3">' + (r.ran ? "Recommencer" : "Commencer · 3 phrases") + '</button>';
  return h;
};
const _presc = CARD.prescrit;
CARD.prescrit = function (c, info, cd) {
  const id = prescribed(c), D = DRILLS7[id], K = X.DRILL[id], r = R("prescrit"), rx = v7().rx;
  let h = ttl(D.t) + '<div class="drill-tag">' + esc(DIMS[D.dim].t) + '</div>' + (rx && rx.drill === id && rx.cause ? '<div class="tip"><span>Pourquoi cet exercice</span><b>' + esc(rx.cause) + '</b></div>' : "");
  if (K) h += '<div class="v12-consigne"><div class="eyebrow">Consigne</div><p><b>' + esc(K.what) + '</b> ' + esc(K.why) + '</p><p>' + esc(K.how) + '</p><p class="small muted">' + esc(K.ex) + '</p></div>';
  if (S.evalBusy === "prescrit") return h + '<div class="analysing"><span class="pulse"></span>J’écoute…</div>';
  if (r.ran) h += done("Exercice enregistré.");
  h += '<button class="btn wide big-act2" data-act="run8" data-slot="prescrit" data-id="' + id + '">' + (r.ran ? "Recommencer" : "Commencer") + ' · ' + fmtSec(drillSegs(c, id).reduce((a, s) => a + s.sec + (s.kind === "dire" ? 8 : 0), 0)) + '</button>';
  return h;
};
CARD.roulette = function (c) {
  const L = v7().lad, lv = IMPRO_LV[L.impro - 1], r = R("roulette"), tp = pickN(TOPICS, 3, c.n, 5);
  let h = photo("arene", "Improvisation") + ttl("La roulette · palier " + L.impro + " / 5") + consBox("roulette", lv.prep + " secondes de préparation, " + lv.speak + " secondes de parole, trois sujets.");
  if (S.evalBusy === "roulette") return h + '<div class="analysing"><span class="pulse"></span>J’écoute vos trois prises…</div>';
  if (r.ran) h += done("Trois improvisations enregistrées.") + '<ul class="plain small">' + tp.map(i => '<li>' + esc(TOPICS[i]) + '</li>').join("") + '</ul>';
  return h + '<button class="btn wide big-act2" data-act="roulette8">' + (r.ran ? "Relancer" : "Lancer la roulette") + '</button>';
};
// Vidéo de maître, en français, puis bilan parlé de trente secondes
CARD.video = function (c, info) {
  const v = X.videoFor(WEEK.n, info.pack.d), r = R("video"), online = navigator.onLine !== false;
  let h = '<div class="eyebrow center">Vidéo de maître · ' + esc(v.who) + '</div>' + ttl(v.t) + consBox("video");
  h += '<a class="v12-video" href="https://www.youtube.com/watch?v=' + v.id + '" target="_blank" rel="noopener" data-act="v12-video-open">' + (online ? '<img src="https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg" alt="" loading="lazy">' : '<div class="v12-novid">Vidéo en ligne</div>') + '<span>▶ Regarder sur YouTube · ' + v.min + ' min' + (v.to ? ' · jusqu’à ' + esc(v.to) : "") + '</span></a>';
  h += '<div class="tip"><span>Pourquoi cette vidéo</span><b>' + esc(v.why) + '</b></div><p class="small"><b>Question pour votre bilan :</b> ' + esc(v.q) + '</p>';
  if (S.evalBusy === "video") return h + '<div class="analysing"><span class="pulse"></span>J’écoute votre bilan…</div>';
  if (r.ran) h += done("Bilan de trente secondes enregistré.");
  h += '<button class="btn wide big-act2" data-act="v12-video-bilan">' + (r.ran ? "Refaire mon bilan" : "Ce que je retiens · 30 secondes") + '</button>' + (!r.opened && !r.ran ? '<p class="center small muted">Regardez d’abord la vidéo, puis revenez ici.</p>' : "");
  return h;
};
// Débrief parlé
CARD.debrief = function (c) {
  const busy = Object.values(c.res || {}).some(x => x && x.media && x.media.status === "analyse") || S.evalBusy;
  let h = ttl("Le débrief de votre coach") + consBox("debrief");
  if (busy) return h + '<div class="analysing"><span class="pulse"></span>J’achève les analyses de vos prises…</div>';
  const D = debriefOf(c);
  h += '<div class="v12-debrief"><div class="row-wrap"><button class="btn" data-reader data-act="' + (Reader.on ? (Reader.paused ? "v12-resume" : "v12-pause") : "v12-replay") + '">' + (Reader.on ? (Reader.paused ? "Reprendre" : "Pause") : "Réécouter") + '</button><span class="small muted">' + Math.max(2, Math.round(D.text.length / 850)) + ' à ' + Math.max(3, Math.round(D.text.length / 600)) + ' min</span></div>' +
    D.parts.map(p => '<section><div class="eyebrow">' + esc(p.t) + '</div><p>' + esc(p.text) + '</p>' + (p.grid ? V9.gridCard(p.grid, { compact: true }) : "") + '</section>').join("") + '</div>';
  h += '<div class="row-wrap"><button class="btn ghost sm" data-act="go" data-r="videos">Revoir mes prises annotées</button></div>';
  return h;
};
// Évaluation différée : en séance, la fiche détaillée attend le débrief
const _sc12 = studioCompact;
studioCompact = function (id) {
  const r = R(id), md = r.media;
  if (md && md.status === "ok" && r.grid && S.route === "seance" && S.cur && !S.cur.bilan && !S.v12.showGrids) {
    const cards = buildCards(S.cur), k = cards[S.cur.card] && cards[S.cur.card].k;
    if (k !== "debrief") return done("Prise enregistrée et archivée (" + fmtSec(r.sec || 0) + ").") + '<div class="row-wrap v9-acts"><button class="btn ghost sm" data-act="vrec" data-id="' + id + '">Refaire la prise</button></div>';
  }
  return _sc12(id);
};

// =====================================================================
// 4. LE DÉBRIEF : erreurs, points faibles, correction, marche à suivre
// =====================================================================
const CR = () => V9.CRIT, TIP = { ancrage: ["Pieds à la largeur du bassin, poids sur les deux jambes ; poussez le sol avant de parler.", "Repérez le moment où le buste part : respirez avant la phrase difficile.", "Gardez cet ancrage et augmentez l’amplitude des gestes."], diction: ["Une minute de lecture avec un crayon entre les dents, puis sans : les consonnes finales doivent claquer.", "Finissez chaque syllabe finale ; ralentissez sur les mots-clés.", "Variez la vitesse : lent pour l’essentiel, vif pour les transitions."], regard: ["Parlez à l’objectif, pas à votre image : une pastille à côté de la caméra.", "Pensez en regardant l’objectif, puis parlez.", "Gardez le regard aussi dans les silences."], parasites: ["Chaque « euh » devient un silence : bouche fermée, inspiration, puis la phrase.", "Vos tics arrivent au début des idées : préparez la première phrase de chaque point.", "Osez un silence plus long avant la phrase clé."], structure: ["Annoncez le plan dès la deuxième phrase : d’abord, ensuite, enfin. Terminez par une chute courte.", "Numérotez vos parties et liez-les : en outre, néanmoins, dès lors.", "Travaillez l’ouverture : une image ou un chiffre dans la première phrase."], pathos: ["Changez de couleur vocale : grave et lent pour la confidence, porté pour l’indignation.", "Marquez un contraste net entre deux passages.", "Ajoutez un geste fort sur la phrase clé."] };
const band = s => s <= 2 ? 0 : s <= 3 ? 1 : 2;
const TAKES = [["impro", "votre prise de parole"], ["prise2", "votre deuxième prise"], ["question", "votre réponse à la question piège"], ["nego", "votre négociation"]];
function debriefOf(c) {
  if (c._debrief && c._debrief.at && !c._debriefDirty) return c._debrief;
  const r = c.res || {}, P = c.info.pack, parts = [];
  const add = (t, text, grid) => parts.push({ t, text, grid });
  add("Ouverture", "Débrief de la séance " + c.n + ", " + P.t + ". Voici ce que j’ai mesuré, ce qui est à corriger, et comment.");
  // Forge
  if (r.forge && r.forge.acc != null) {
    const a = Math.round(r.forge.acc * 100), weak = (r.forge.weak || []).map(i => VIRE10[i]);
    add("La voix et la diction", "Forge : " + a + " % de mots nets et complets. " + (a >= 85 ? "Articulation solide." : a >= 65 ? "Articulation correcte, mais des consonnes finales sont avalées." : "Articulation à travailler : beaucoup de syllabes se perdent, surtout en vitesse.") + (weak.length ? " Phrases à reprendre : " + weak.join(" ; ") + "." : "") + (r.forge.miss && r.forge.miss.length ? " Mots déformés : " + r.forge.miss.join(", ") + "." : "") + " Correction : reprenez la phrase la plus faible, lentement, en exagérant les consonnes, puis accélérez par paliers.");
  } else if (r.forge && r.forge.noEval) add("La voix et la diction", "Forge faite sans enregistrement : je n’ai pas pu mesurer la diction aujourd’hui.");
  // Mots
  if (r.mots3 && r.mots3.m && Object.keys(r.mots3.m).length) {
    const used = P.words.filter((w, i) => r.mots3.m[i] && r.mots3.m[i].ok).map(w => w[0]), miss = P.words.filter((w, i) => !(r.mots3.m[i] && r.mots3.m[i].ok)).map(w => w[0]);
    const inTake = vocabUsed([r.impro, r.prise2, r.question].map(x => x && x.text || "").join(" "), P.words.map(w => w[0]));
    add("Les mots", (used.length ? "Mots employés dans une phrase : " + used.join(", ") + ". " : "") + (miss.length ? "Je n’ai pas entendu : " + miss.join(", ") + ". Redites-les ce soir, chacun dans une phrase. " : "") + (inTake.length ? "Dans vos prises, vous avez placé : " + inTake.join(", ") + ". C’est ainsi que le lexique s’installe." : "Aucun mot du jour dans vos prises : demain, placez-en un dans la première minute."));
  }
  // Mémoire
  if (r.empan && r.empan.t && r.empan.t.length) { const last = r.empan.t[r.empan.t.length - 1]; add("La mémoire", "Empan : " + last.n + " mots, " + ["plusieurs erreurs", "une erreur", "sans faute"][last.g] + ". " + (last.g === 2 ? "Le palier monte après deux essais parfaits." : "Astuce : reliez les mots en une histoire absurde et visuelle, un lieu par mot.")); }
  // Vidéo
  if (r.video && r.video.text) add("La vidéo de maître", "Ce que vous avez retenu : « " + r.video.text.slice(0, 260) + " ». " + (r.video.text.split(/\s+/).length < 12 ? "Bilan court : la prochaine fois, une idée et une application concrète." : "Bon réflexe : une idée vue, une application dite."));
  // Prises
  const weakAll = {};
  TAKES.forEach(([k, label]) => {
    const x = r[k]; if (!x || !x.grid || !x.grid.g) return;
    const g = x.grid.g, order = Object.keys(g).sort((a, b) => g[a].s - g[b].s), w1 = order[0], w2 = order[1], best = order[order.length - 1];
    order.slice(0, 2).forEach(k2 => { weakAll[k2] = (weakAll[k2] || 0) + (5 - g[k2].s); });
    const tics = x.media && x.media.audio ? (x.media.audio.hes || 0) : 0;
    let t = "Note globale " + comma(x.grid.glob) + " sur 5" + (x.sec && x.budget ? ", durée " + fmtSec(x.sec) + " pour " + fmtSec(x.budget) + " visées" : "") + ". ";
    t += "Point fort : " + CR()[best].t.toLowerCase() + ", " + g[best].s + " sur 5. ";
    t += "À corriger en priorité : " + CR()[w1].t.toLowerCase() + ", " + g[w1].s + " sur 5. " + g[w1].m + " Correction : " + TIP[w1][band(g[w1].s)] + " ";
    if (w2 && g[w2].s <= 3) t += "Ensuite : " + CR()[w2].t.toLowerCase() + ", " + g[w2].s + " sur 5. " + TIP[w2][band(g[w2].s)];
    add(label.charAt(0).toUpperCase() + label.slice(1), t, x.grid);
  });
  if (r.prescrit && r.prescrit.ev) { const ev = r.prescrit.ev, sc = ev.scores ? Object.values(ev.scores)[0] : null; add("L’exercice ciblé", (sc ? "Réussite " + sc + " sur 5. " : "") + (ev.verdict || "") + (ev.conseil ? " " + ev.conseil : "")); }
  if (r.roulette && r.roulette.ev) add("L’improvisation", (r.roulette.ev.verdict || "Trois sujets improvisés.") + (r.roulette.ev.conseil ? " " + r.roulette.ev.conseil : " Idée maîtresse d’abord, trois points, chute : vérifiez-le à la réécoute."));
  // Priorité
  const ks = Object.keys(weakAll).sort((a, b) => weakAll[b] - weakAll[a]);
  if (ks.length) add("Votre priorité pour demain", "Un seul objectif : " + CR()[ks[0]].t.toLowerCase() + ". " + TIP[ks[0]][0] + " Je vous le rappellerai avant votre prochaine prise, et votre exercice ciblé le travaillera.");
  else add("Votre priorité pour demain", "Aucune prise filmée aujourd’hui : demain, filmez au moins la prise principale pour que je puisse mesurer les six critères.");
  add("Pour finir", "Vous avez tenu la séance. La maîtrise vient de la répétition mesurée : même heure demain. Vos prises annotées sont dans la vidéothèque.");
  const D = { parts, text: parts.map(p => p.t + ". " + p.text).join(" "), at: Date.now() };
  c._debrief = D; c._debriefDirty = false; return D;
}
V9.debriefOf = debriefOf;

// =====================================================================
// 5. LA SÉANCE : cartes, durées, charpente, gardien du temps
// =====================================================================
Object.assign(V9.PLAN.full, { souffle: [100, "cyc", 9], forge: [200, "n", 6], mots3: 110, empan: 90, prescrit: 110, prise1: 210, prise2: 150, question: 150, bilan: 45 });
Object.assign(V9.PLAN.express, { forge: [100, "n", 3], prise1: 150, question: 110, bilan: 30 });
STEP_OF.video = 3; STEP_OF.debrief = 6;
const _bc12 = buildCards;
buildCards = function (c) {
  const C = _bc12(c), P = c.info && c.info.pack; if (!P || !P.track) return C;
  const out = [];
  C.forEach(x => {
    if (x.k === "modele" || x.k === "capsule") { const v = X.videoFor(WEEK.n, P.d); out.push(Object.assign({}, x, { k: "video", t: "Vidéo · " + v.who.split(",")[0], auto: "c8-video", sec: Math.min(300, (v.to ? Number(v.to.split(":")[0]) * 60 + Number(v.to.split(":")[1] || 0) : v.min * 60)) + 60 })); return; }
    if (x.k === "bilan") out.push({ k: "debrief", B: "G", act: 4, sec: c.express ? 120 : 240, auto: "c8-debrief", t: "Le débrief" });
    out.push(x);
  });
  return out;
};
// Charpente rappelée, avec exemple, sur chaque carte de prise de parole
const STRUCT_HTML = track => '<details class="v12-struct" open><summary><span class="eyebrow">' + esc(X.STRUCTURE.t) + '</span><button class="btn ghost sm" data-act="v12-say-struct" data-track="' + esc(track) + '">Écouter</button></summary><ol>' + X.STRUCTURE.steps.map(s => '<li><b>' + esc(s[0]) + '</b> ' + esc(s[1]) + '</li>').join("") + '</ol><p class="small">' + esc(X.STRUCTURE.ex[track] || X.STRUCTURE.ex.ouvrir) + '</p></details>';
const _vs12 = viewSession;
viewSession = function () {
  const c = S.cur; let h = _vs12();
  if (!c || c.bilan || !c.info || !c.info.pack || !c.info.pack.track) return h;
  const cards = buildCards(c), cd = cards[clamp(c.card || 0, 0, cards.length - 1)];
  // bouton Réécouter la consigne
  const replay = cd.auto || (cd.k === "prise1" ? "s" + c.info.pack.d + "-prise" : cd.k === "question" ? "q" : "");
  if (replay) h = h.replace('<div class="cardx', '<div class="v12-replay"><button class="btn ghost sm" data-act="v12-replay-card" data-id="' + esc(replay) + '" data-k="' + cd.k + '">🔊 Réécouter la consigne</button></div><div class="cardx');
  if (["prise1", "prise2", "question", "sim", "roulette"].includes(cd.k)) h = h.replace('<section class="sbox2"', STRUCT_HTML(c.info.pack.track) + '<section class="sbox2"');
  if (cd.k === "prise1") h = h.replace('<div class="filrouge">', consBox("prise1").replace("v12-consigne", "v12-consigne compact") + '<div class="filrouge">');
  if (cd.k === "prise2") h = h.replace('<div class="tip">', consBox("prise2").replace("v12-consigne", "v12-consigne compact") + '<div class="tip">');
  if (cd.k === "question" && !h.includes("v12-consigne")) h = h.replace('<div class="cx-aud">', consBox("question") + '<div class="cx-aud">');
  return h;
};
// Gardien du temps : le débrief et le bilan sont toujours tenus
setInterval(() => {
  const c = S.cur; if (!c || S.route !== "seance" || c.bilan || !c.info || !c.info.pack || !c.info.pack.track) return;
  const cards = buildCards(c), cur = c.card || 0, total = budgetSec(c), el = elapsedMs(c) / 1000;
  const di = cards.findIndex(x => x.k === "debrief"), bi = cards.findIndex(x => x.k === "bilan"), qi = cards.findIndex(x => x.k === "question");
  if (di < 0 || bi < 0) return;
  const ds = cards[di].sec, bs = cards[bi].sec, qs = qi >= 0 ? cards[qi].sec : 0;
  const recording = (V9.RecStage && V9.RecStage.on) || Studio.rec || Run.on; if (recording) return;
  if (cur < di && el >= total - bs - ds) { toast("Pour tenir le temps : place au débrief."); cardGo(di); return; }
  if (qi >= 0 && cur < qi && el >= total - bs - ds - qs) { toast("Pour tenir le temps, on passe à la question piège."); cardGo(qi); }
}, 1000);
// Entrée dans une carte : consigne complète parlée ; débrief lu
const _cg12 = cardGo;
cardGo = function (i, auto = true) {
  Reader.stop();
  _cg12(i, auto);
  const c = S.cur; if (!c || !c.info || !c.info.pack || !c.info.pack.track) return;
  const cd = buildCards(c)[c.card]; if (!cd) return;
  if (cd.k === "debrief") { setTimeout(() => { const busy = Object.values(c.res || {}).some(x => x && x.media && x.media.status === "analyse") || S.evalBusy; if (!busy && VOICE_ON()) { Voice.stop(); Reader.start(debriefOf(c).text); } else if (busy) waitDebrief(c); }, 400); }
};
function waitDebrief(c) { const t = setInterval(() => { const busy = Object.values(c.res || {}).some(x => x && x.media && x.media.status === "analyse") || S.evalBusy; if (!busy) { clearInterval(t); c._debriefDirty = true; render(); if (VOICE_ON()) Reader.start(debriefOf(c).text); } }, 1000); }
// Toute nouvelle analyse rend le débrief à refaire
const _rm12 = runMedia;
runMedia = async function (id, file) { await _rm12(id, file); if (S.cur) S.cur._debriefDirty = true; };

// =====================================================================
// 6. LA SCÈNE VIDÉO : consigne et charpente parlées, puis compte à rebours de cinq
// =====================================================================
const RS = V9.RecStage, _rsOpen = RS.open.bind(RS), _rsBtns = RS.drawBtns.bind(RS);
function briefFor(id) {
  const P = pack(); if (!P) return null;
  if (id === "impro") return { t: P.prise.t, text: P.fil + " Technique du jour : " + P.tech.t + ". " + P.tech.line, say: (P.prise.a ? P.prise.a[1] : P.fil) + " " + structureSay(P.track) + " Au top, parlez à l’objectif." };
  if (id === "prise2") { const g = (R("impro") || {}).grid, w = g && g.weak ? V9.CRIT[g.weak].t.toLowerCase() : null; return { t: "Deuxième prise", text: P.fil + (w ? " Un seul conseil : " + w + "." : ""), say: X.C.prise2.how + (w ? " Votre conseil : " + w + ". " + TIP[g.weak][band(g.g[g.weak].s)] : "") + " Même charpente : accroche, annonce, trois points, chute." }; }
  if (id === "question") { const L = v7().lad, cd = buildCards(S.cur).find(x => x.k === "question"), q = cd && QBANK[L.q][cd.qi]; return q ? { t: "La question piège", text: q[0] + " : « " + q[1] + " »", say: "Question, contexte " + q[0] + ". " + q[1] + " " + X.C.question.how + " " + X.C.question.ex } : null; }
  if (id === "nego") return P.nego ? { t: "La négociation", text: P.nego.contexte + " Objectif : " + P.nego.objectif, say: X.C.sim.how + " Votre objectif : " + P.nego.objectif + " " + structureSay("negocier") } : null;
  return null;
}
RS.open = async function (id, budget, title) {
  const ok = await _rsOpen(id, budget, title); if (!ok) return ok;
  const b = briefFor(id); if (!b) return ok;
  this.phase = "brief"; this.brief = b;
  const inn = $("#v9-stage .rs-in"); if (inn && !inn.querySelector(".rs-brief")) { const d = document.createElement("div"); d.className = "rs-brief"; d.innerHTML = '<div class="eyebrow">Consigne</div><b>' + esc(b.t) + '</b><p>' + esc(b.text) + '</p><p class="small">' + esc(X.STRUCTURE.steps.map(s => s[0]).join(" · ")) + '</p>'; inn.insertBefore(d, inn.querySelector(".rs-cam")); }
  this.drawBtns();
  const me = b; Voice.stop(); say(b.say, () => { if (this.on && this.phase === "brief" && this.brief === me) this.countdown(); });
  return ok;
};
RS.drawBtns = function () {
  if (this.phase !== "brief") return _rsBtns();
  const b = $("#rs-btns"); if (b) b.innerHTML = '<button class="btn wide big-act" data-act="v9-rec-go">● Commencer maintenant</button><div class="row-wrap"><button class="btn ghost" data-act="v12-rs-replay">Réécouter</button><button class="btn ghost" data-act="v9-rec-cancel">Annuler</button></div>';
};
RS.countdown = function () {
  if (!this.on || this.phase === "rec" || this.phase === "count") return;
  try { speechSynthesis.cancel(); } catch (e) { }
  const br = $("#v9-stage .rs-brief"); if (br) br.remove();
  this.phase = "count"; this.drawBtns(); const c = $("#rs-count"); let n = 5;
  const step = () => {
    if (!this.on || this.phase !== "count") return;
    if (n === 0) { if (c) c.hidden = true; this.begin(); return; }
    if (c) { c.hidden = false; c.textContent = n; c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); }
    beep(1, n === 1 ? 880 : 660); n--; setTimeout(step, 1000);
  };
  step();
};

// =====================================================================
// 7. ACTIONS
// =====================================================================
window.addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act, c = S.cur;
  const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
  switch (a) {
    case "forge8": { stop(); const n = Number(b.dataset.n) || 6, ids = vireOfDay(c.info.pack.d).slice(0, n); const r = R("forge"); r.acc = null; r.noEval = false; r.ran = true; if (!Studio.ok()) { await Studio.open(); } Run.start("forge", forgeSegs(ids), (k, res) => evalForge(ids, res), { rec: true, brief: brief("forge") }); break; }
    case "v12-mots3": { stop(); const P = c.info.pack; if (!Studio.ok()) await Studio.open(); R("mots3").ran = true; Run.start("mots3", mots3Segs(P), (k, res) => evalMots3(P, res), { rec: true, brief: brief("mots3") }); break; }
    case "run8": { stop(); const slot = b.dataset.slot, id = b.dataset.id; R(slot).ev = null; R(slot).ran = true; if (!Studio.ok()) await Studio.open(); const K = X.DRILL[id]; Run.start(slot, drillSegs(c, id), (k, res) => evalDrill(slot, id, res), { rec: true, brief: K ? { t: K.what, text: K.how + " " + K.ex, say: full(K) } : null }); break; }
    case "roulette8": { stop(); const L = v7().lad, lv = IMPRO_LV[L.impro - 1], tp = pickN(TOPICS, 3, c.n, 5), w = knownWords7(3); R("roulette").ev = null; R("roulette").ran = true; if (!Studio.ok()) await Studio.open();
      const segs = []; tp.forEach((ti, j) => { segs.push({ lab: TOPICS[ti], sec: lv.prep, kind: "prep", txt: lv.c && w[j] ? "Mot imposé : " + w[j] : "Idée maîtresse d’abord, trois points, chute", aud: "t" + ti }); segs.push({ lab: TOPICS[ti], sec: lv.speak, kind: "dire", txt: lv.c && w[j] ? "Mot imposé : " + w[j] : "Idée maîtresse d’abord", tag: j }); });
      Run.start("roulette", segs, (k, res) => evalRoulette(tp, res), { rec: true, brief: brief("roulette", lv.prep + " secondes de préparation, " + lv.speak + " secondes de parole.") }); break; }
    case "v12-video-open": { R("video").opened = true; saveSess(); break; }
    case "v12-video-bilan": { stop(); const v = X.videoFor(WEEK.n, c.info.pack.d); if (!Studio.ok()) await Studio.open(); R("video").ran = true; Run.start("video", [{ kind: "dire", lab: "Ce que je retiens", txt: v.q, sec: 30, tag: 0 }], async (k, res) => { const r = R("video"); if (!res.file) return; S.evalBusy = "video"; render(); try { const H = await hear(res.file, res.wins.map(w => [w[0], w[1]])); r.text = H.text; } catch (e) { } S.evalBusy = null; if (S.cur) S.cur._debriefDirty = true; saveSess(); render(); }, { rec: true, brief: { t: "Votre bilan vidéo", text: v.q, say: "Dites en trente secondes ce que vous retenez, et comment vous l’appliquerez tout à l’heure. " + v.q } }); break; }
    case "v12-run-replay": { stop(); const s = Run.segs[Run.i]; if (s && s.say) { Voice.stop(); say(s.say, () => { if (Run.on && Run.segs[Run.i] === s) setTimeout(() => { if (Run.on && Run.segs[Run.i] === s) Run.next(); }, 600); }); } break; }
    case "v12-rs-replay": { stop(); if (RS.brief) { Voice.stop(); const me = RS.brief; say(me.say, () => { if (RS.on && RS.phase === "brief" && RS.brief === me) RS.countdown(); }); } break; }
    case "v12-replay-card": { stop(); const k = b.dataset.k, id = b.dataset.id; Voice.stop(); Reader.stop(); if (k === "question") { const br = briefFor("question"); if (br) say(br.say); } else if (k === "prise1") { const br = briefFor("impro"); if (br) say(br.say); } else if (k === "debrief" && c) Reader.start(debriefOf(c).text); else if (!Voice.play(id)) { const t = textOf(id) || (X.C[k] ? full(X.C[k]) : ""); if (t) say(t); } break; }
    case "v12-say-struct": { stop(); Voice.stop(); say(structureSay(b.dataset.track)); break; }
    case "v12-replay": { stop(); if (c) { Voice.stop(); Reader.start(debriefOf(c).text); } break; }
    case "v12-pause": stop(); Reader.pause(); break;
    case "v12-resume": stop(); Reader.resume(); break;
    case "v12-voice-open": stop(); S.v12.voiceOpen = true; render(); break;
    case "v12-voice-close": stop(); S.v12.voiceOpen = false; render(); break;
    case "v12-voice-test": { stop(); Voice.stop(); TTS.pick(); say("Bonjour. Je suis votre coach. Trente minutes, pas une de plus. Chaque minute a un but et une mesure."); break; }
    case "go": case "quit": case "close": Reader.stop(); break;
  }
}, true);
document.addEventListener("change", e => {
  const el = e.target; if (!el.dataset || !el.dataset.v12) return;
  pref.set(el.dataset.v12, el.value); TTS.pick(); render(); if (el.dataset.v12 === "ttsvoice") say("Voici ma voix. Elle lira vos consignes et votre débrief.");
});
window.addEventListener("pagehide", () => Reader.stop());

// Accueil : réglage de la voix, sous le studio
const _home12 = viewHome;
viewHome = function () { const h = _home12(); const k = h.includes('<section class="card diag-cta">') ? '<section class="card diag-cta">' : '<section class="v11-stats">'; return h.replace(k, voiceCard() + k); };
// Ressources : la bibliothèque
const _lib12 = viewLib;
viewLib = function () {
  let h = _lib12();
  h = h.replace('</nav>', '<button role="tab" aria-selected="' + (S.libTab === "biblio") + '" data-act="libtab" data-tab="biblio" class="' + (S.libTab === "biblio" ? "on" : "") + '">Bibliothèque</button></nav>');
  if (S.libTab === "biblio") {
    const body = '<section class="card"><p>Les meilleures ressources, d’Aristote aux coachs d’aujourd’hui. Chaque séance en applique une part ; lisez une entrée par semaine.</p></section>' +
      X.BIBLIO.map(g => '<section class="card"><div class="eyebrow">' + esc(g.k) + '</div><ul class="v12-biblio">' + g.items.map(it => '<li><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></li>').join("") + '</ul></section>').join("") +
      '<section class="card"><div class="eyebrow">Les vidéos du parcours</div><ul class="v12-biblio">' + X.VIDEOS.map(v => '<li><a href="https://www.youtube.com/watch?v=' + v.id + '" target="_blank" rel="noopener"><b>' + esc(v.t) + '</b></a><span>' + esc(v.who) + ' · ' + v.min + ' min · ' + esc(v.why) + '</span></li>').join("") + '</ul></section>';
    h = h.slice(0, h.indexOf('</nav>') + 6) + body;
  }
  return h;
};
render();
})();
