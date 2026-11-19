// ===== Le Verbe Souverain · v15 · le coach =====
// Une séance de 30 minutes : échauffement (souffle, visage, 10 virelangues × 3), trois blocs de compétence
// de 6 minutes (Apprendre, Voir, Faire, Corriger, Refaire), puis un bilan de 90 secondes.
// Dans Claude : Claude est le coach (sample), parle avec une voix naturelle (tts) et transcrit (dictation).
// Ailleurs : banques de contenu, voix de l'appareil, transcription locale et corrections par règles.
(function () {
"use strict";
const V9 = window.V9, K = window.V15C;
const APP = "15.0"; V9.version = APP;
S.v15 = S.v15 || {};
const C = { sample: null, tts: null, dict: null, ttsOff: false, dictOff: false, sampleOff: false, ttsBusy: false };
const pref = { get: k => { try { return localStorage.getItem("vs1:" + k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem("vs1:" + k, v || ""); } catch (e) { } } };
const wait = ms => new Promise(r => setTimeout(r, ms));
const inPack = c => !!(c && c.info && c.info.pack && c.info.pack.track);
const P15 = () => { const p = S.profile; p.v15 = p.v15 || { words: [], subj: [], facts: [], lvl: { mem: 8, nback: 2 }, hist: [] }; p.v15.lvl = p.v15.lvl || { mem: 8, nback: 2 }; return p.v15; };
const nWords = t => String(t || "").trim().split(/\s+/).filter(Boolean).length;
const fr = t => esc(t).replace(/ ([:;?!»])/g, " $1").replace(/« /g, "« ");
const pick = (arr, seed, salt) => arr[pickN(arr, 1, seed, salt)[0]];

// =====================================================================
// 1. LES CAPACITÉS DE CLAUDE (quand l'application s'ouvre dans Claude)
// =====================================================================
if (window.claude && window.claude.use) {
  window.claude.use("sample").then(s => { C.sample = s; render(); }).catch(() => { });
  window.claude.use("tts").then(t => { C.tts = t; if (t) { try { t.onState(({ state }) => { C.ttsBusy = state !== "idle"; }); t.onLine(({ id }) => hl(id)); } catch (e) { } } render(); }).catch(() => { });
  window.claude.use("dictation").then(d => { C.dict = d; if (d) { try { d.onFinal(({ text }) => { if (Dict.on || Dict.stopping) Dict.fin.push(text); }); d.onPartial(({ text }) => { Dict.part = text; }); } catch (e) { } } }).catch(() => { });
}
V9.C15 = C;
const coachIA = () => !!(C.sample && !C.sampleOff);

// La voix : toute parole de l'application passe par la voix Claude quand elle est disponible
const VOICES = [["buttery", "Claude · chaleureuse"], ["rounded", "Claude · ronde"], ["airy", "Claude · légère"], ["glassy", "Claude · claire"], ["device", "Voix de l’appareil"]];
const voiceName = () => pref.get("v15voice") || "buttery";
const claudeVoice = () => !!(C.tts && !C.ttsOff && voiceName() !== "device");
const SS = window.speechSynthesis;
let ttsGen = 0, batch = null;
if (SS) {
  const nSpeak = SS.speak.bind(SS), nCancel = SS.cancel.bind(SS);
  const fire = (u, ev) => { try { const f = ev === "end" ? u.onend : u.onerror; if (f) f.call(u, { type: ev }); } catch (e) { } };
  SS.speak = function (u) {
    if (!claudeVoice()) return nSpeak(u);
    if (!batch) { batch = []; queueMicrotask(flush); }
    batch.push(u);
  };
  const flush = () => {
    const us = batch; batch = null; if (!us || !us.length) return;
    const g = ++ttsGen, last = us[us.length - 1], text = us.map(u => u.text).join(" ").replace(/\s+/g, " ").trim().slice(0, 1990);
    C.tts.speak(text, { voice: voiceName(), rate: Math.max(0.8, Math.min(1.25, last.rate || 1)) })
      .then(() => { if (g === ttsGen) fire(last, "end"); })
      .catch(e => {
        if (g !== ttsGen) return;
        const code = e && e.code;
        if (code === "not_granted" || code === "unavailable") C.ttsOff = true;
        if (code === "stopped") { fire(last, "error"); return; }
        us.forEach(u => nSpeak(u)); // repli : voix de l'appareil
      });
  };
  SS.cancel = function () {
    nCancel(); const g = ++ttsGen;
    queueMicrotask(() => { if (!batch && g === ttsGen && C.tts && C.ttsBusy) C.tts.stop().catch(() => { }); });
  };
}
// Le coach parle par lignes, avec le surlignage de la ligne lue
let sayTok = 0;
function hl(id) { document.querySelectorAll(".v15-hl").forEach(e => e.classList.remove("v15-hl")); if (!id) return; const el = document.querySelector('[data-hl="' + id + '"]'); if (el) { el.classList.add("v15-hl"); try { el.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { } } }
function coachSay(lines, onend) {
  const tok = ++sayTok; lines = (lines || []).filter(l => l && l.text);
  if (!lines.length || !VOICE_ON()) { if (onend) onend(); return; }
  try { V9.Flow && V9.Flow.cancel(); } catch (e) { }
  const end = () => { if (tok === sayTok) { hl(null); if (onend) onend(); } };
  if (claudeVoice()) {
    try { SS && SS.cancel(); } catch (e) { }
    ttsGen++;
    C.tts.speak(lines.map(l => ({ text: String(l.text).slice(0, 1990), id: l.id || undefined })), { voice: voiceName() }).then(end).catch(e => { if (e && e.code === "stopped") { hl(null); return; } if (e && (e.code === "not_granted" || e.code === "unavailable")) C.ttsOff = true; device(0); });
    return;
  }
  const device = i => { if (tok !== sayTok) return; if (i >= lines.length) return end(); hl(lines[i].id); TTS.speak(lines[i].text, 1, () => setTimeout(() => device(i + 1), 120)); };
  device(0);
}
function hush() { sayTok++; hl(null); try { Voice.stop(); } catch (e) { } try { SS && SS.cancel(); } catch (e) { } }

// =====================================================================
// 2. LA TRANSCRIPTION (dictée Claude, sinon transcription locale)
// =====================================================================
const Dict = {
  on: false, stopping: false, fin: [], part: "",
  begin() {
    if (!C.dict || C.dictOff) return false;
    this.fin = []; this.part = ""; this.on = true;
    try { C.dict.start({ language: "fr-FR" }).catch(e => { this.on = false; const c = e && e.code; if (c === "not_granted" || c === "unavailable") C.dictOff = true; }); } catch (e) { this.on = false; return false; }
    return true;
  },
  async end() {
    if (!this.on) return (this.fin.join(" ") || this.part || "").trim();
    this.stopping = true;
    try { await Promise.race([C.dict.stop(), wait(5000)]); } catch (e) { }
    this.on = false; this.stopping = false;
    return (this.fin.join(" ").trim() || this.part || "").trim();
  }
};
const RS = V9.RecStage;
const pend = { run: null };
const _rstop15 = Run.stop.bind(Run);
Run.stop = function (silent, keepRec) { const was = this.on, k = String(this.key || ""); _rstop15(silent, keepRec); if (was && !keepRec && k.startsWith("v15") && pend.run) { const f = pend.run; pend.run = null; f(null); } };
const canVideo = () => V9.camAllowedHere() && Studio.ok() && Studio.stream && Studio.stream.getVideoTracks().length > 0;
// Enregistrer une réponse : vidéo, audio ou dictée seule, selon l'appareil
async function REC(o) {
  if (o.video && !Studio.ok() && V9.camAllowedHere()) { try { await Studio.open(); } catch (e) { } }
  const mode = o.video && canVideo() ? "video" : Studio.ok() ? "audio" : "dict";
  if (mode === "video") {
    const id = o.id, r = R(id); r.media = null; r.text = null; r.grid = null;
    V9.v15rs = { subj: o.subj || "", parts: o.parts || [] };
    RS._v15stop = false;
    await RS.open(id, o.sec, o.title || "Ma prise");
    while (RS.on) await wait(300);
    const dt = await Dict.end();
    // La prise arrive un peu après la fermeture de la scène : on l'attend si l'orateur a terminé
    if (RS._v15stop) { const t1 = Date.now(); while (!r.media && Date.now() - t1 < 20000) await wait(300); }
    if (!r.media) return { cancelled: true };
    const t0 = Date.now(), needBody = !!o.body;
    while (Date.now() - t0 < 120000) {
      if (r.media.status === "ok") break;
      if (nWords(dt) >= 4 && (!needBody || r.media.body)) break;
      await wait(400);
    }
    const md = r.media || {};
    return { text: nWords(dt) >= 4 ? dt : (r.text || dt || ""), m: md.audio || null, body: md.body || null, grid: r.grid || null, mode };
  }
  const segs = o.segs || [{ kind: "dire", lab: o.lab, txt: o.txt || "", sec: o.sec }];
  const res = await new Promise(ok => { pend.run = ok; Run.start("v15" + (o.id || ""), segs, (k, x) => { if (pend.run === ok) { pend.run = null; ok(x || {}); } }, { rec: mode === "audio" }); });
  const dt = await Dict.end();
  if (!res) return { cancelled: true };
  let text = dt, m = null;
  if (res.file) {
    try {
      if (nWords(dt) < 3) { const H = await hear(res.file, (res.wins || []).map(w => [w[0], w[1]])); text = H.text || dt; m = H.m; }
      else { const pcm = await decodeToMono(res.file, 8000); m = analyzePCM(pcm, 8000); }
    } catch (e) { }
  }
  return { text: text || "", m, mode };
}

// =====================================================================
// 3. LE COACH (Claude), avec un repli par règles
// =====================================================================
const PROFIL = "L’orateur est agronome et travaille dans l’humanitaire et la sécurité alimentaire au Sahel (basé à Dakar). Il prépare des entretiens d’embauche, des plaidoyers devant des bailleurs et des prises de parole publiques engagées. Il veut un coach exigeant, précis, bienveillant, qui corrige concrètement.";
async function ask(prompt, tier) {
  if (!coachIA()) throw new Error("off");
  try {
    return await Promise.race([C.sample.json(prompt, { modelTier: tier || "quick", cache: false }), wait(tier === "default" ? 150000 : 40000).then(() => { throw new Error("timeout"); })]);
  } catch (e) { if (e && e.code === "not_granted") C.sampleOff = true; throw e; }
}
const FB_SCHEMA = '{"score": entier de 0 à 10, "verdict": "une phrase", "parties": [{"n": "nom de la partie", "ok": true ou false, "note": "8 mots max"}], "force": "ce qui marche, une phrase", "corriger": "LA correction prioritaire, une phrase concrète", "dites": "une phrase modèle améliorée que l’orateur aurait pu dire, tirée de son propre discours", "dire": "ce que le coach dit à voix haute : 45 mots maximum, tutoiement interdit, chaleureux et précis"}';
async function coachFeedback(b, text, extra, second) {
  const ctx = b.spec.fbCtx(b), parts = (b.spec.parts ? b.spec.parts(b) : []).map(p => p[0]);
  const prompt = "Tu es un coach de prise de parole francophone de très haut niveau. " + PROFIL + "\n\nExercice : " + ctx + "\n" + (parts.length ? "Parties attendues, dans l’ordre : " + parts.join(", ") + ".\n" : "") + (extra ? "Mesures : " + extra + "\n" : "") + (second ? "C’est la DEUXIÈME tentative ; la correction demandée était : « " + second + " ». Dis s’il l’a appliquée.\n" : "") +
    "\nTranscription de ce qu’il a dit (reconnaissance vocale, ignore les petites fautes de transcription) :\n« " + String(text || "").slice(0, 4000) + " »\n\nÉvalue selon la méthode. Sois concret : cite ses mots. Réponds UNIQUEMENT en JSON valide, en français : " + FB_SCHEMA;
  const j = await ask(prompt, "quick");
  if (!j || typeof j !== "object") throw new Error("json");
  j.score = clamp(Math.round(Number(j.score) || 0), 0, 10);
  j.parties = Array.isArray(j.parties) ? j.parties.slice(0, 8).map(p => ({ n: String(p.n || ""), ok: !!p.ok, note: String(p.note || "") })) : [];
  ["verdict", "force", "corriger", "dites", "dire"].forEach(k => j[k] = String(j[k] || ""));
  return j;
}
// Repli sans IA : repérage des parties par leurs mots de liaison, durée, hésitations
const CUES = {
  Position: /\b(je pense|je crois|ma position|il faut|oui|non|je défends|je suis convaincu)/i, Raison: /\b(parce que|car|pourquoi|en effet|la raison)/i, Exemple: /\b(par exemple|à [A-Z]|\d|ainsi|comme)/i,
  Accroche: /\b(\d|imaginez|chaque|savez-vous|\?)/i, Problème: /\b(problème|constat|aujourd'hui|aujourd’hui|manque)/i, Causes: /\b(cause|pourquoi|d'abord|d’abord|ensuite|parce que)/i, Solution: /\b(solution|proposons|propose|réponse|nous allons)/i, Vision: /\b(imaginez|demain|dans \d|ce qui change)/i, Appel: /\b(je vous demande|je demande|votez|engagez|rejoignez|validez)/i,
  Situation: /\b(19|20)\d\d|\b(en|à|dans|ce jour|un matin|juillet|janvier)/i, Déclencheur: /\b(un jour|soudain|et puis|alors que|un matin)/i, Obstacle: /\b(problème|mais|difficile|obstacle|impossible)/i, Choix: /\b(j'ai décidé|j’ai décidé|j'ai choisi|j’ai choisi|alors j)/i, Leçon: /\b(j'ai compris|j’ai compris|leçon|depuis|retenir)/i,
  Question: /\?|faut-il|doit-on/i, Thèse: /\b(d'un côté|d’un côté|d'abord|d’abord)/i, Antithèse: /\b(certes|mais|cependant|pourtant|de l'autre|de l’autre)/i, Synthèse: /\b(en réalité|la vraie question|au fond|dépasser)/i, Conclusion: /\b(c'est pourquoi|c’est pourquoi|donc|en conclusion|voilà pourquoi)/i,
  Présent: /\b(je suis|aujourd'hui|aujourd’hui|actuellement)/i, Passé: /\b(avant|j'ai été|j’ai été|auparavant|il y a)/i, Futur: /\b(demain|je veux|ce poste|je souhaite|désormais)/i
};
function localFeedback(b, text, extra) {
  const parts = (b.spec.parts ? b.spec.parts(b) : []).map(p => p[0]), t = String(text || ""), w = nWords(t), eu = (t.match(/\b(euh|heu|hum|bah|ben)\b/gi) || []).length;
  const ps = parts.map(n => ({ n, ok: CUES[n] ? CUES[n].test(t) : w > 25, note: CUES[n] ? (CUES[n].test(t) ? "repérée" : "non repérée") : "" }));
  const okN = ps.filter(p => p.ok).length, miss = ps.find(p => !p.ok);
  const score = clamp(Math.round((parts.length ? okN / parts.length * 6 : 4) + Math.min(3, w / 40) - Math.min(3, eu / 2) + 1), 0, 10);
  const corr = !w ? "Je n’ai rien entendu : vérifiez le micro, puis parlez plus près." : miss ? (((b.spec.parts(b).find(p => p[0] === miss.n) || [])[2]) ? "Ajoutez clairement la partie « " + miss.n + " » : " + b.spec.parts(b).find(p => p[0] === miss.n)[2] : "Travaillez d’abord ce point : « " + miss.n + " ».") : eu > 2 ? "Remplacez chaque « euh » par un silence." : "Gardez cette structure et ralentissez sur la phrase clé.";
  return { score, verdict: w ? (okN === parts.length ? "La structure est là." : okN + " parties sur " + parts.length + " repérées.") : "Aucune parole détectée.", parties: ps, force: w > 30 ? "Vous avez tenu la durée." : "Vous avez osé vous lancer.", corriger: corr, dites: "", dire: (w ? "Bien. " : "") + corr, local: true };
}
async function feedback(b, text, extra, second) {
  if (coachIA() && nWords(text) >= 3) { try { return await coachFeedback(b, text, extra, second); } catch (e) { } }
  return localFeedback(b, text, extra);
}

// =====================================================================
// 4. LE CONTENU DU JOUR (préparé par Claude pendant l'échauffement)
// =====================================================================
const dayOf = c => clamp(Number(c.info.pack.d) || 1, 1, 5);
const plan = c => (c.express ? [K.WEEK_PLAN[dayOf(c)][0]] : K.WEEK_PLAN[dayOf(c)]);
function fallbackContent(c) {
  const n = c.n || 1, wk = WEEK.n || 1, P = P15(), out = {};
  plan(c).forEach(([kind, m]) => {
    if (kind === "methode") { const s = K.SUBJ[m][(wk - 1) % K.SUBJ[m].length]; out.methode = { m, sujet: s.s, guide: s.g }; }
    if (kind === "entretien") { const qi = (wk - 1) % K.ENTRETIEN.length; const E = K.ENTRETIEN[qi], m = E.m === "ppf" ? null : E.m; out.entretien = { qi, guide: m ? K.SUBJ[m][(wk) % K.SUBJ[m].length].g : ["Je suis agronome, spécialiste de la sécurité alimentaire au Sahel, et j’ai conduit des programmes auprès de milliers de familles.", "J’ai commencé sur le terrain, dans les coopératives, puis j’ai coordonné des projets avec des bailleurs internationaux.", "Aujourd’hui, je veux mettre cette double expérience au service de votre programme."] }; }
    if (kind === "vocab") { const seen = new Set(P.words.map(x => x.m)); const pool = K.WORDS.filter(x => !seen.has(x[0])); const src = pool.length >= 3 ? pool : K.WORDS; out.vocab = { mots: pickN(src, 3, n, 31).map(i => ({ m: src[i][0], def: src[i][1], ex: src[i][2] })) }; }
    if (kind === "culture") { const x = K.CULT[(wk * 2 + n) % K.CULT.length]; out.culture = { t: x.t, r: x.r, f: x.f, q: x.q, why: x.why }; }
    if (kind === "nego") { const x = K.NEGO[(wk + n) % K.NEGO.length]; out.nego = Object.assign({}, x); }
    if (kind === "corps") out.corps = { sujet: K.CORPS_SUBJ[(wk * 3 + n) % K.CORPS_SUBJ.length] };
    if (kind === "impro") out.impro = { sujets: pickN(K.IMPRO, 4, n, 7).map(i => K.IMPRO[i]) };
    if (kind === "trac") out.trac = { question: K.HOSTILE[(wk + n) % K.HOSTILE.length] };
    if (kind === "voix") out.voix = K.VOICE[(wk + n) % K.VOICE.length];
    if (kind === "memoire") out.memoire = { mots: pickN(K.NOUNS, 20, n, 13).map(i => K.NOUNS[i]) };
  });
  return out;
}
function contentPrompt(c, need) {
  const P = P15(), wk = WEEK.n || 1;
  const ask = [];
  need.forEach(([kind, m]) => {
    if (kind === "methode") ask.push('"methode": {"sujet": "un sujet de discours précis, engagé, lié à son métier ou à l’actualité africaine, différent des précédents", "guide": [' + K.M[m].parts.length + ' phrases, une par partie (' + K.M[m].parts.map(p => p[0]).join(", ") + '), qui montrent concrètement quoi dire sur CE sujet, avec des faits plausibles et prudents]}');
    if (kind === "entretien") { const qi = (wk - 1) % K.ENTRETIEN.length, E = K.ENTRETIEN[qi], parts = E.parts || K.M[E.m].parts; ask.push('"entretien": {"qi": ' + qi + ', "guide": [' + parts.length + ' phrases, une par partie (' + parts.map(p => p[0]).join(", ") + '), réponse modèle à la question « ' + E.q + ' » pour un poste de ' + K.POSTE + ']}'); }
    if (kind === "vocab") ask.push('"vocab": {"mots": [3 objets {"m": "mot français rare et fort, à connotation politique ou d’engagement (ex. : incurie, forfaiture, spoliation, abnégation)", "def": "définition exacte en une phrase", "ex": "phrase d’exemple engagée, contexte Sahel ou développement"}], à ne PAS choisir parmi : ' + P.words.map(x => x.m).slice(-60).join(", ") + '}');
    if (kind === "culture") ask.push('"culture": {"t": "un thème de culture générale (histoire, géopolitique, économie, institutions, Afrique, climat), exact et vérifiable, différent de : ' + P.facts.slice(-12).join(" ; ") + '", "r": "récit de 110 à 140 mots, factuel, sans erreur", "f": [3 faits clés courts], "q": [3 éléments ["question", ["réponse A", "réponse B", "réponse C"], index de la bonne réponse 0-2]], "why": "en quoi c’est utile à un orateur engagé du Sahel, une phrase"}');
    if (kind === "nego") ask.push('"nego": {"ctx": "situation de négociation réaliste de son métier, une phrase", "who": "l’interlocuteur", "goal": "son objectif à lui", "hidden": "l’intérêt caché de l’interlocuteur", "lines": [3 répliques de l’interlocuteur, de plus en plus ouvertes]}');
    if (kind === "corps") ask.push('"corps": {"sujet": "un sujet simple pour parler 60 secondes, différent de : ' + P.subj.slice(-10).join(" ; ") + '"}');
    if (kind === "impro") ask.push('"impro": {"sujets": [4 sujets d’improvisation d’un ou deux mots, concrets et variés]}');
    if (kind === "trac") ask.push('"trac": {"question": "une question hostile et déstabilisante qu’un journaliste, un bailleur ou un recruteur pourrait lui poser"}');
    if (kind === "voix") ask.push('"voix": {"a": "Texte d’entraînement", "x": "texte ORIGINAL de 35 à 50 mots, oratoire et engagé, annoté : « / » pause courte, « // » pause longue, *mot* pour accentuer (3 à 4 accents)"}');
  });
  if (!ask.length) return null;
  return "Tu prépares la séance n° " + c.n + " (semaine " + wk + ") d’un programme de coaching en prise de parole. " + PROFIL + " Sujets déjà traités : " + (P.subj.slice(-15).join(" ; ") || "aucun") + ".\nRéponds UNIQUEMENT en JSON valide, en français, avec exactement ces clés :\n{" + ask.join(",\n") + "}";
}
function validContent(kind, x, m) {
  try {
    if (kind === "methode") return x && typeof x.sujet === "string" && Array.isArray(x.guide) && x.guide.length === K.M[m].parts.length && x.guide.every(s => typeof s === "string" && s.length > 8);
    if (kind === "entretien") { const E = K.ENTRETIEN[x.qi]; const parts = E && (E.parts || K.M[E.m].parts); return parts && Array.isArray(x.guide) && x.guide.length === parts.length; }
    if (kind === "vocab") return x && Array.isArray(x.mots) && x.mots.length === 3 && x.mots.every(w => w.m && w.def && w.ex);
    if (kind === "culture") return x && x.t && x.r && Array.isArray(x.f) && x.f.length >= 3 && Array.isArray(x.q) && x.q.length === 3 && x.q.every(q => Array.isArray(q) && Array.isArray(q[1]) && q[1].length === 3 && q[2] >= 0 && q[2] <= 2);
    if (kind === "nego") return x && x.ctx && x.who && x.goal && Array.isArray(x.lines) && x.lines.length >= 3;
    if (kind === "corps") return x && typeof x.sujet === "string" && x.sujet.length > 5;
    if (kind === "impro") return x && Array.isArray(x.sujets) && x.sujets.length >= 3;
    if (kind === "trac") return x && typeof x.question === "string" && x.question.length > 10;
    if (kind === "voix") return x && typeof x.x === "string" && x.x.length > 40 && x.x.includes("/");
  } catch (e) { }
  return false;
}
async function prepare(c) {
  const V = c.res.v15 = c.res.v15 || {};
  if (!V.content) { V.content = fallbackContent(c); V.src = "local"; saveSess(); }
  if (!coachIA() || V.gen) return;
  const need = plan(c).filter(([k]) => !["memoire", "attention", "rappel"].includes(k));
  const pr = contentPrompt(c, need); if (!pr) return;
  V.gen = "wait";
  try {
    const j = await ask(pr, "default");
    need.forEach(([kind, m]) => {
      const x = j && j[kind]; if (!validContent(kind, x, m)) return;
      const R0 = R("b" + plan(c).findIndex(p => p[0] === kind)); if (R0 && R0.ph && R0.ph !== "learn") return; // bloc déjà commencé : on garde
      V.content[kind] = Object.assign({}, kind === "methode" ? { m } : {}, x); V.src = "claude";
    });
    V.gen = "ok";
  } catch (e) { V.gen = "fail"; }
  saveSess(); if (S.route === "seance") render();
}

// =====================================================================
// 5. LES BLOCS DE COMPÉTENCE
// =====================================================================
const cont = (c, kind) => (c.res.v15 && c.res.v15.content && c.res.v15.content[kind]) || fallbackContent(c)[kind];
const methodParts = (c, kind) => { if (kind === "entretien") { const x = cont(c, "entretien"), E = K.ENTRETIEN[x.qi]; return E.parts || K.M[E.m].parts; } return K.M[cont(c, "methode").m].parts; };
const partsBox = (parts, guide, prefix) => '<ol class="v15-plan">' + parts.map((p, i) => '<li data-hl="' + prefix + i + '"><span class="n">' + (i + 1) + '</span><div><b>' + fr(p[0]) + '</b><small>' + fr(p[1]) + ' <i>' + fr(p[2]) + '</i></small>' + (guide && guide[i] ? '<p>' + fr(guide[i]) + '</p>' : "") + '</div></li>').join("") + '</ol>';
const litBox = t => t ? '<p class="v15-lit"><span>Ce que dit la recherche</span>' + fr(t) + '</p>' : "";
const subjBox = (lab, t) => '<div class="v15-subj"><span>' + esc(lab) + '</span><b>' + fr(t) + '</b></div>';
// Chaque type de bloc : titre, contenu à apprendre, ce que dit le coach, l'exercice, l'évaluation
const SPEC = {
  methode: {
    title: c => K.M[cont(c, "methode").m].t, line: c => K.M[cont(c, "methode").m].use,
    parts: b => K.M[cont(b.c, "methode").m].parts,
    learn: b => { const x = cont(b.c, "methode"), M = K.M[x.m]; return subjBox("Votre sujet", x.sujet) + '<p class="v15-cap">Voici comment l’aborder, partie par partie :</p>' + partsBox(M.parts, x.guide, "g") + '<div class="v15-end"><span>Conclure</span>' + fr(M.end) + '</div>' + litBox(M.lit); },
    intro: b => { const x = cont(b.c, "methode"), M = K.M[x.m]; return [{ text: "Méthode du jour : " + M.t + ". " + M.long.replace(/·/g, ",") + ". " + M.use }, { text: "Votre sujet : " + x.sujet }].concat(M.parts.map((p, i) => ({ text: p[0] + ". " + x.guide[i], id: "g" + i }))).concat([{ text: M.end + " À vous : touchez Démarrer." }]); },
    rec: b => { const x = cont(b.c, "methode"), M = K.M[x.m]; return { video: true, sec: M.sec, title: M.t, subj: x.sujet, parts: M.parts.map(p => p[0]) }; },
    fbCtx: b => { const x = cont(b.c, "methode"), M = K.M[x.m]; return "discours selon la méthode « " + M.t + " » (" + M.long + ") sur le sujet : « " + x.sujet + " ». Durée visée " + M.sec + " s. Conclusion attendue : " + M.end; }
  },
  entretien: {
    title: () => "Entretien d’embauche", line: c => { const E = K.ENTRETIEN[cont(c, "entretien").qi]; return "Question : « " + E.q + " »"; },
    parts: b => methodParts(b.c, "entretien"),
    learn: b => { const x = cont(b.c, "entretien"), E = K.ENTRETIEN[x.qi], M = E.parts ? E : K.M[E.m]; return subjBox("La question du recruteur", E.q) + '<p class="v15-cap">Méthode : <b>' + fr(E.t || K.M[E.m].t) + '</b>. Réponse modèle, partie par partie :</p>' + partsBox(M.parts, x.guide, "g") + '<div class="v15-end"><span>Conclure</span>' + fr(E.end || K.M[E.m].end) + '</div>' + litBox(K.ENTRETIEN_LIT); },
    intro: b => { const x = cont(b.c, "entretien"), E = K.ENTRETIEN[x.qi], parts = E.parts || K.M[E.m].parts; return [{ text: "Entretien d’embauche. Le recruteur vous demande : " + E.q }, { text: "La bonne méthode ici : " + (E.t || K.M[E.m].t) + ". Écoutez une réponse modèle." }].concat(parts.map((p, i) => ({ text: p[0] + ". " + x.guide[i], id: "g" + i }))).concat([{ text: "À vous, avec votre parcours. Touchez Démarrer." }]); },
    rec: b => { const E = K.ENTRETIEN[cont(b.c, "entretien").qi]; return { video: true, sec: E.sec || K.M[E.m].sec, title: "Entretien", subj: E.q, parts: methodParts(b.c, "entretien").map(p => p[0]) }; },
    fbCtx: b => { const E = K.ENTRETIEN[cont(b.c, "entretien").qi]; return "réponse d’entretien d’embauche à la question « " + E.q + " », pour un poste de " + K.POSTE + ", selon la méthode « " + (E.t || K.M[E.m].t) + " ». Le recruteur attend structure, preuves chiffrées et une fin nette."; }
  },
  corps: {
    title: () => "Ancrage, gestes et regard", line: () => "Quatre réglages, puis 60 secondes sur un sujet nouveau.",
    parts: () => [["Ancrage"], ["Gestes dans le cadre"], ["Regard"], ["Structure"]],
    learn: b => '<div class="v15-imgs"><img src="img/posture.jpg" alt="Posture ancrée"><img src="img/gestes.jpg" alt="Gestes dans le cadre"></div><ol class="v15-plan">' + K.CORPS.map((s, i) => '<li data-hl="c' + i + '"><span class="n">' + (i + 1) + '</span><div><b>' + fr(s[0]) + '</b><p>' + fr(s[1]) + '</p></div></li>').join("") + '</ol>' + subjBox("Votre sujet, nouveau aujourd’hui", cont(b.c, "corps").sujet) + litBox(K.SK.corps.lit),
    intro: b => [{ text: "Corps et regard. Quatre réglages, à faire maintenant, debout devant la caméra." }].concat(K.CORPS.map((s, i) => ({ text: s[0] + ". " + s[1], id: "c" + i }))).concat([{ text: "Votre sujet : " + cont(b.c, "corps").sujet + ". Une idée maîtresse, trois points comptés sur les doigts. Touchez Démarrer." }]),
    rec: b => ({ video: true, body: true, sec: 60, title: "Corps et regard", subj: cont(b.c, "corps").sujet, parts: ["Ancrage", "Cadre", "Regard", "3 points"] }),
    fbCtx: b => "prise de parole de 60 secondes sur « " + cont(b.c, "corps").sujet + " », centrée sur le langage corporel : ancrage des pieds, gestes entre taille et épaules (compter sur les doigts, paumes ouvertes, main qui tranche), regard dans l’objectif en fin de phrase. Appuie-toi d’abord sur les mesures du corps."
  },
  trac: {
    title: () => "Question hostile", line: () => "Respirer, reconnaître, recadrer, répondre.",
    parts: () => [["Reconnaître"], ["Recadrer"], ["Répondre en 3 points"], ["Calme"]],
    learn: b => '<ol class="v15-plan">' + [["Soupir physiologique", "Deux inspirations par le nez, une longue expiration par la bouche. Deux fois."], ["« Je suis enthousiaste »", "Dites-le-vous : le trac devient de l’énergie."], ["Reconnaître", "« C’est une question légitime. » Sans vous justifier."], ["Recadrer et répondre", "« La vraie question est… » puis trois points et une phrase de fin."]].map((s, i) => '<li data-hl="t' + i + '"><span class="n">' + (i + 1) + '</span><div><b>' + fr(s[0]) + '</b><p>' + fr(s[1]) + '</p></div></li>').join("") + '</ol>' + subjBox("La question qui vous attend", cont(b.c, "trac").question) + litBox(K.SK.trac.lit),
    intro: b => [{ text: "Trac sous pression. Une question hostile va vous être posée. La méthode : un soupir physiologique, vous vous dites « je suis enthousiaste », vous reconnaissez la question, vous recadrez, puis trois points.", id: "t0" }, { text: "Exemple. « C’est une question légitime. » Silence. « La vraie question est de savoir ce que ce projet a changé. Trois faits. »", id: "t3" }, { text: "Touchez Démarrer : d’abord deux soupirs, puis la question." }],
    pre: b => ({ segs: [{ kind: "souffle", lab: "Deux inspirations par le nez, longue expiration", txt: "Soupir physiologique", sec: 14 }] }),
    rec: b => ({ video: true, sec: 45, title: "Question hostile", subj: cont(b.c, "trac").question, parts: ["Reconnaître", "Recadrer", "3 points", "Fin"], ask: cont(b.c, "trac").question }),
    fbCtx: b => "réponse de 45 secondes à une question hostile : « " + cont(b.c, "trac").question + " ». Méthode attendue : reconnaître la question sans se justifier, recadrer (« la vraie question est… »), répondre en trois points, conclure net, rester calme, aucun « euh »."
  },
  culture: {
    title: c => cont(c, "culture").t, line: () => "Écouter, retenir, vérifier, puis l’expliquer avec vos mots.",
    parts: () => [["Exactitude"], ["Structure"], ["Lien avec le Sahel"]],
    learn: b => { const x = cont(b.c, "culture"); return '<p class="v15-story" data-hl="k0">' + fr(x.r) + '</p><ul class="v15-facts">' + x.f.map(f => '<li>' + fr(f) + '</li>').join("") + '</ul><p class="v15-cap">' + fr(x.why) + '</p>' + litBox(K.SK.culture.lit); },
    intro: b => { const x = cont(b.c, "culture"); return [{ text: "Culture générale : " + x.t + "." }, { text: x.r, id: "k0" }, { text: "Trois questions pour vérifier, puis vous l’expliquerez avec vos mots." }]; },
    quiz: b => cont(b.c, "culture").q,
    rec: b => ({ video: false, sec: 45, lab: cont(b.c, "culture").t, txt: "Expliquez en 45 secondes : de quoi s’agit-il, et pourquoi c’est important pour le Sahel aujourd’hui ?" }),
    fbCtx: b => { const x = cont(b.c, "culture"); return "explication orale en 45 secondes du thème « " + x.t + " ». Les faits exacts sont : " + x.f.join(" ; ") + ". Vérifie l’exactitude, la structure (idée maîtresse, faits, lien avec le Sahel) et corrige toute erreur factuelle."; }
  },
  vocab: {
    title: () => "Trois mots qui frappent", line: () => "Des mots forts, engagés, à placer dans vos discours.",
    parts: b => cont(b.c, "vocab").mots.map(w => [w.m]),
    learn: b => '<ul class="v15-words">' + cont(b.c, "vocab").mots.map((w, i) => '<li data-hl="w' + i + '"><b>' + fr(w.m) + '</b><p>' + fr(w.def) + '</p><i>« ' + fr(w.ex) + ' »</i></li>').join("") + '</ul>' + litBox(K.SK.vocab.lit),
    intro: b => [{ text: "Vocabulaire. Trois mots forts, à charge politique, pour donner du poids à vos discours." }].concat(cont(b.c, "vocab").mots.map((w, i) => ({ text: w.m + ". " + w.def + " Par exemple : " + w.ex, id: "w" + i }))).concat([{ text: "À vous : une phrase engagée avec chaque mot. Touchez Démarrer." }]),
    rec: b => ({ video: false, segs: cont(b.c, "vocab").mots.map(w => ({ kind: "dire", lab: w.m, txt: "Une phrase engagée avec ce mot : " + w.def, sec: 16 })) }),
    redoRec: b => ({ video: false, sec: 35, lab: "Mini-tirade", txt: "35 secondes, engagé, avec les trois mots : " + cont(b.c, "vocab").mots.map(w => w.m).join(", ") }),
    fbCtx: b => "l’orateur devait employer ces mots dans des phrases engagées : " + cont(b.c, "vocab").mots.map(w => w.m + " (" + w.def + ")").join(" ; ") + ". Pour chaque mot (une partie par mot), dis s’il est employé avec le bon sens et propose une phrase plus percutante dans « dites »."
  },
  voix: {
    title: () => "Lire comme un orateur", line: () => "Pauses, accents, variations : la voix qui porte.",
    parts: () => [["Pauses"], ["Accents"], ["Débit"], ["Fidélité au texte"]],
    learn: b => { const x = cont(b.c, "voix"); return '<ol class="v15-plan">' + [["La pause", "« / » : une respiration. « // » : un vrai silence, une seconde."], ["L’accent", "Les mots en gras : plus lents, plus forts, plus graves."], ["La variation", "Montez sur la question, descendez sur la conclusion."]].map((s, i) => '<li><span class="n">' + (i + 1) + '</span><div><b>' + fr(s[0]) + '</b><p>' + fr(s[1]) + '</p></div></li>').join("") + '</ol><blockquote class="v15-text" data-hl="v0">' + voiceHtml(x.x) + '<cite>' + fr(x.a) + '</cite></blockquote>' + litBox(K.SK.voix.lit); },
    intro: b => { const x = cont(b.c, "voix"); return [{ text: "Voix et silences. Écoutez d’abord le texte, avec ses pauses et ses accents." }, { text: x.x.replace(/\/\//g, "…").replace(/\//g, ",").replace(/\*/g, ""), id: "v0" }, { text: "À vous : lisez-le en respectant chaque pause. Touchez Démarrer." }]; },
    rec: b => { const x = cont(b.c, "voix"); return { video: false, sec: 35, lab: "Lisez à voix haute", txt: x.x.replace(/\*/g, "").replace(/\/\//g, "‖") }; },
    fbCtx: b => { const x = cont(b.c, "voix"); return "lecture à voix haute du texte annoté : « " + x.x + " » (« / » pause courte, « // » pause longue, *mot* accent). Évalue les pauses, les accents, le débit et la fidélité au texte en t’appuyant sur les mesures acoustiques."; }
  },
  impro: {
    title: () => "Improvisation", line: () => "Un sujet surprise, 5 secondes, puis 40 secondes. Trois fois.",
    parts: () => [["Idée maîtresse d’abord"], ["Trois points"], ["Conclusion"]],
    learn: b => '<ol class="v15-plan">' + [["Idée maîtresse", "La première phrase dit ce que vous pensez du sujet."], ["Trois points", "Comptez-les sur les doigts : un, deux, trois."], ["La chute", "Une phrase courte. Puis silence."]].map((s, i) => '<li data-hl="i' + i + '"><span class="n">' + (i + 1) + '</span><div><b>' + fr(s[0]) + '</b><p>' + fr(s[1]) + '</p></div></li>').join("") + '</ol><div class="v15-end"><span>Exemple : « La pluie »</span>« La pluie est notre première richesse. Un : elle nourrit les champs. Deux : elle remplit les puits. Trois : elle fixe les jeunes au village. Respectons-la : stockons chaque goutte. »</div>' + litBox(K.SK.impro.lit),
    intro: () => [{ text: "Improvisation. La règle : l’idée maîtresse d’abord, trois points, une chute.", id: "i0" }, { text: "Exemple, sur la pluie. La pluie est notre première richesse. Un, elle nourrit les champs. Deux, elle remplit les puits. Trois, elle fixe les jeunes au village. Respectons-la." }, { text: "Trois sujets surprise vous attendent. Touchez Démarrer." }],
    rec: b => { const s = cont(b.c, "impro").sujets; return { video: false, segs: s.slice(0, 3).flatMap(x => [{ kind: "prep", lab: x, txt: "Idée maîtresse, puis trois points", sec: 5 }, { kind: "dire", lab: x, txt: "Idée · 1 · 2 · 3 · chute", sec: 40 }]) }; },
    redoRec: b => { const s = cont(b.c, "impro").sujets; return { video: false, segs: [{ kind: "prep", lab: s[3] || s[0], txt: "Appliquez la correction", sec: 5 }, { kind: "dire", lab: s[3] || s[0], txt: "Idée · 1 · 2 · 3 · chute", sec: 40 }] }; },
    fbCtx: b => "trois improvisations de 40 secondes sur : " + cont(b.c, "impro").sujets.slice(0, 3).join(", ") + ". Règle : idée maîtresse dans la première phrase, trois points annoncés, une chute courte."
  },
  nego: {
    title: () => "La méthode de Harvard", line: c => cont(c, "nego").ctx,
    parts: () => [["Intérêts plutôt que positions"], ["Questions ouvertes"], ["Options"], ["Relation préservée"]],
    learn: b => { const x = cont(b.c, "nego"); return subjBox("La situation", x.ctx) + '<div class="v15-subj alt"><span>Votre objectif</span><b>' + fr(x.goal) + '</b></div><ol class="v15-plan">' + [["Écouter et reconnaître", "« Je comprends votre contrainte… »"], ["Chercher l’intérêt", "Une question ouverte : « Qu’est-ce qui compte le plus pour vous ? »"], ["Proposer deux options", "« Je vois deux pistes : … ou … »"], ["Préserver la relation", "Fermeté sur le fond, douceur avec la personne."]].map((s, i) => '<li data-hl="n' + i + '"><span class="n">' + (i + 1) + '</span><div><b>' + fr(s[0]) + '</b><p>' + fr(s[1]) + '</p></div></li>').join("") + '</ol>' + litBox(K.SK.nego.lit); },
    intro: b => { const x = cont(b.c, "nego"); return [{ text: "Négociation. " + x.ctx + " Votre objectif : " + x.goal }, { text: "La méthode de Harvard, en quatre gestes : reconnaître, chercher l’intérêt par une question ouverte, proposer deux options, préserver la relation.", id: "n1" }, { text: "Je joue votre interlocuteur. Trois échanges. Touchez Démarrer." }]; },
    fbCtx: b => { const x = cont(b.c, "nego"); return "négociation en trois échanges. Situation : " + x.ctx + " Objectif de l’orateur : " + x.goal + ". Intérêt caché de l’interlocuteur : " + x.hidden + ". Dialogue complet : " + (b.r.dlg || []).map(d => (d.me ? "ORATEUR : " : "INTERLOCUTEUR : ") + d.t).join(" | ") + ". Juge selon Fisher et Ury."; }
  },
  memoire: {
    title: () => "La méthode des lieux", line: () => "Placer des mots dans votre maison, puis les retrouver.",
    learn: b => '<ol class="v15-plan">' + [["Votre maison", "Choisissez un trajet que vous connaissez par cœur : " + K.ROOMS.slice(0, 5).join(", ") + "…"], ["Une image folle", "Chaque mot devient une scène exagérée, en mouvement, à sa place."], ["Le parcours", "Pour rappeler, refaites le trajet en pensée, pièce par pièce."]].map((s, i) => '<li data-hl="m' + i + '"><span class="n">' + (i + 1) + '</span><div><b>' + fr(s[0]) + '</b><p>' + fr(s[1]) + '</p></div></li>').join("") + '</ol><div class="v15-end"><span>Exemple</span>« Baobab » à la porte d’entrée : un baobab géant bloque la porte, vous devez l’enjamber. « Pirogue » au salon : une pirogue flotte sur le tapis.</div>' + litBox(K.SK.memoire.lit),
    intro: b => [{ text: "Mémoire : la méthode des lieux, utilisée par les champions du monde de mémoire." }, { text: "Un, choisissez un trajet dans votre maison. Deux, transformez chaque mot en image folle, à sa place. Trois, pour rappeler, refaites le trajet.", id: "m1" }, { text: "Exemple : un baobab géant bloque la porte d’entrée ; une pirogue flotte sur le tapis du salon. " + P15().lvl.mem + " mots vont s’afficher. Touchez Démarrer." }]
  },
  attention: {
    title: () => "Concentration : le 2-back", line: () => "Touchez quand la case allumée est la même que deux tours avant.",
    learn: b => '<ol class="v15-plan">' + [["Regardez", "Une case s’allume, toutes les 2,5 secondes."], ["Comparez", "Est-ce la même case que " + P15().lvl.nback + " tours avant ?"], ["Touchez", "Si oui, touchez « Même case ». Sinon, ne faites rien."]].map((s, i) => '<li data-hl="a' + i + '"><span class="n">' + (i + 1) + '</span><div><b>' + fr(s[0]) + '</b><p>' + fr(s[1]) + '</p></div></li>').join("") + '</ol>' + litBox(K.SK.attention.lit),
    intro: b => [{ text: "Concentration. Une case s’allume à chaque tour. Touchez « Même case » quand elle est identique à celle d’il y a " + P15().lvl.nback + " tours. Une minute, deux manches. Touchez Démarrer." }]
  },
  rappel: {
    title: () => "Rappel de la semaine", line: () => "Retrouver de mémoire les mots et les faits de la semaine.",
    parts: () => [["Mots employés justement"], ["Structure"]],
    learn: b => litBox(K.SK.rappel.lit),
    intro: () => [{ text: "Rappel de la semaine. Retrouver de mémoire grave durablement. Quelques questions, puis 45 secondes de discours." }],
    quiz: b => rappelQuiz(b.c),
    rec: b => { const w = weekWords(b.c).slice(0, 2).map(x => x.m); return { video: false, sec: 45, lab: "Discours engagé", txt: "45 secondes sur votre engagement, avec ces mots : " + w.join(", ") }; },
    fbCtx: b => "discours de 45 secondes qui devait employer justement ces mots : " + weekWords(b.c).slice(0, 2).map(x => x.m + " (" + x.def + ")").join(" ; ") + ", avec une structure claire."
  }
};
function voiceHtml(x) { return esc(x).replace(/\*([^*]+)\*/g, "<b>$1</b>").replace(/ \/\/ /g, ' <span class="pp">‖</span> ').replace(/ \/ /g, ' <span class="p">/</span> '); }
function weekWords(c) { const P = P15(); const w = P.words.slice(-12); return w.length >= 3 ? w : K.WORDS.slice(0, 6).map(x => ({ m: x[0], def: x[1], ex: x[2] })); }
function rappelQuiz(c) {
  const ws = weekWords(c), out = [];
  pickN(ws, Math.min(3, ws.length), c.n, 5).forEach(i => { const w = ws[i], others = K.WORDS.filter(x => x[0] !== w.m); const o = pickN(others, 2, c.n + i, 9).map(j => others[j][0]); const opts = [w.m, o[0], o[1]].sort((a, b) => seeded(c.n, a.length + i) - seeded(c.n, b.length)); out.push(["Quel mot signifie : « " + w.def + " » ?", opts, opts.indexOf(w.m)]); });
  const f = P15().facts.slice(-3); if (f.length) { const t = f[f.length - 1]; const cu = K.CULT.find(x => x.t === t); if (cu) out.push(cu.q[0]); }
  out.push(["Dans PREP, que dit-on en dernier ?", ["L’exemple", "La position, plus forte", "Une question"], 1]);
  return out.slice(0, 5);
}

// L'état d'un bloc
const blk = (c, i) => { const r = R("b" + i); r.ph = r.ph || "learn"; return r; };
function specOf(cd) { return SPEC[cd.kind]; }
function bObj(c, cd) { return { c, cd, r: blk(c, cd.bi), spec: specOf(cd), kind: cd.kind }; }

// =====================================================================
// 6. LA CARTE D'UN BLOC
// =====================================================================
const PH = [["learn", "Apprendre"], ["do", "Faire"], ["fix", "Corriger"], ["redo", "Refaire"]];
const phIdx = ph => ({ learn: 0, quiz: 0, show: 0, do: 1, mem: 1, game: 1, dlg: 1, wait: 2, fix: 2, redo: 3, refix: 3, done: 4 })[ph] ?? 0;
function fbHtml(fb, text, small) {
  if (!fb) return "";
  return '<div class="v15-fb' + (small ? " small" : "") + '"><div class="v15-fb-top"><div class="v15-score s' + (fb.score >= 7 ? "hi" : fb.score >= 4 ? "mid" : "lo") + '"><b>' + fb.score + '</b><small>/10</small></div><p>' + fr(fb.verdict) + '</p></div>' +
    (fb.parties && fb.parties.length ? '<ul class="v15-check">' + fb.parties.map(p => '<li class="' + (p.ok ? "ok" : "ko") + '"><span>' + (p.ok ? "✓" : "✗") + '</span><b>' + fr(p.n) + '</b>' + (p.note ? '<small>' + fr(p.note) + '</small>' : "") + '</li>').join("") + '</ul>' : "") +
    (fb.force ? '<div class="v15-row ok"><span>Ce qui marche</span>' + fr(fb.force) + '</div>' : "") +
    (fb.corriger ? '<div class="v15-row fix"><span>À corriger</span><b>' + fr(fb.corriger) + '</b></div>' : "") +
    (fb.dites ? '<div class="v15-row say"><span>Dites plutôt</span>« ' + fr(fb.dites) + ' »</div>' : "") +
    (text ? '<details class="v15-heard"><summary>Ce que j’ai entendu</summary><p>' + esc(text) + '</p></details>' : "") +
    (fb.local ? '<p class="v15-note">Correction automatique. Ouvrez l’application dans Claude pour la correction de votre coach.</p>' : "") + '</div>';
}
function quizHtml(b, Q) {
  const ans = b.r.qa || [];
  return '<div class="v15-quiz">' + Q.map((q, i) => { const a = ans[i]; return '<div class="v15-q"><p><b>' + (i + 1) + '.</b> ' + fr(q[0]) + '</p><div class="v15-opts">' + q[1].map((o, j) => '<button class="' + (a === undefined ? "" : j === q[2] ? "good" : j === a ? "bad" : "dim") + '" data-act="v15-ans" data-q="' + i + '" data-o="' + j + '"' + (a !== undefined ? " disabled" : "") + '>' + fr(o) + '</button>').join("") + '</div></div>'; }).join("") + '</div>';
}
CARD.blk = function (c, info, cd) {
  const b = bObj(c, cd), S0 = K.SK[cd.kind === "methode" ? "methode" : cd.kind], r = b.r, ph = r.ph, sp = b.spec;
  let h = '<div class="v15-head"><div class="v15-ic">' + S0.ic + '</div><div class="v15-k">' + esc(S0.t) + '</div><h2 class="v15-t">' + fr(sp.title(c)) + '</h2><p class="v15-l">' + fr(sp.line(c)) + '</p><button class="v14-spk" data-act="v15-coach" aria-label="Réécouter le coach">🔊</button></div>';
  h += '<ol class="v15-steps">' + PH.map((p, i) => '<li class="' + (i < phIdx(ph) ? "done" : i === phIdx(ph) ? "on" : "") + (c.express && i === 3 ? " off" : "") + '">' + p[1] + '</li>').join("") + '</ol>';
  if (ph === "learn") {
    h += '<div class="v15-body">' + sp.learn(b) + '</div>';
    const Q = sp.quiz ? sp.quiz(b) : null;
    if (Q && Q.length) { const done = (r.qa || []).filter(x => x !== undefined).length >= Q.length; h += '<h3 class="v15-h3">Vérifiez</h3>' + quizHtml(b, Q); if (done) h += '<p class="v15-qres">' + (r.qa.filter((a, i) => a === Q[i][2]).length) + ' sur ' + Q.length + ' juste' + (r.qa.filter((a, i) => a === Q[i][2]).length > 1 ? "s" : "") + '.</p>'; if (!done) return h + '<button class="btn wide big-act2 v14-prim" data-keep="1" data-act="v15-coach">Écouter le coach</button>'; }
    return h + '<button class="btn wide big-act2 v14-prim" data-keep="1" data-act="v15-go">Démarrer</button>';
  }
  if (ph === "dlg") return h + dlgHtml(b);
  if (ph === "wait") return h + '<div class="v15-wait"><span class="pulse"></span><b>Votre coach vous écoute…</b><small>' + fr((sp.parts ? "Il vérifie : " + sp.parts(b).map(p => p[0]).join(", ") + "." : "Calcul de votre score.")) + '</small></div>';
  if (ph === "fix") return h + fbHtml(r.fb1, r.t1) + (c.express ? done15(r) : '<button class="btn wide big-act2 v14-prim" data-keep="1" data-act="v15-redo">Refaire en corrigeant</button>');
  if (ph === "refix" || ph === "done") return h + (r.fb2 ? '<h3 class="v15-h3">Deuxième essai</h3>' + fbHtml(r.fb2, r.t2, true) + progressLine(r) : "") + '<details class="v15-more"><summary>Premier essai</summary>' + fbHtml(r.fb1, r.t1, true) + '</details>' + done15(r);
  return h + '<div class="v15-wait"><span class="pulse"></span><b>Exercice en cours…</b></div>';
};
const done15 = r => '<div class="v12-done">✓ Bloc terminé' + (r.fb2 ? " · " + r.fb1.score + " → " + r.fb2.score + "/10" : r.fb1 ? " · " + r.fb1.score + "/10" : "") + '<span>Vous retrouverez la synthèse au bilan.</span></div>';
const progressLine = r => { const d = r.fb2.score - r.fb1.score; return '<p class="v15-prog ' + (d > 0 ? "up" : d < 0 ? "down" : "") + '">' + (d > 0 ? "+" + d + " points : la correction est passée." : d === 0 ? "Même score : gardez la correction en tête pour demain." : "Un recul de " + (-d) + " : normal quand on change une habitude.") + '</p>'; };

// =====================================================================
// 7. LE DÉROULÉ D'UN BLOC
// =====================================================================
const curBlk = () => { const c = S.cur; if (!inPack(c)) return null; const cs = buildCards(c), cd = cs[c.card || 0]; return cd && cd.k === "blk" ? bObj(c, cd) : null; };
async function runDo(b, second) {
  const sp = b.spec, r = b.r, c = b.c;
  if (sp.pre && !second) { r.ph = "do"; saveSess(); render(); await new Promise(ok => { pend.run = ok; Run.start("v15pre", sp.pre(b).segs, () => { pend.run = null; ok(1); }, {}); }); }
  const o = Object.assign({ id: "v15b" + b.cd.bi + (second ? "r" : "") }, second && sp.redoRec ? sp.redoRec(b) : sp.rec(b));
  r.ph = second ? "redo" : "do"; saveSess(); render();
  if (o.ask) { await new Promise(ok => coachSay([{ text: o.ask }], ok)); }
  const res = await REC(o);
  if (res.cancelled) { r.ph = second ? "fix" : "learn"; saveSess(); render(); return; }
  r.ph = "wait"; saveSess(); render();
  const extra = measures(res);
  const fb = await feedback(b, res.text, extra, second ? r.fb1 && r.fb1.corriger : null);
  if (second) { r.t2 = res.text; r.fb2 = fb; r.ph = "refix"; } else { r.t1 = res.text; r.fb1 = fb; r.ph = "fix"; }
  record(b, fb, second); saveSess(); render();
  coachSay([{ text: fb.dire || fb.corriger || fb.verdict }], () => { if (second || c.express) setTimeout(() => { const x = curBlk(); if (x && x.r === r) finishBlk(b); }, 2500); });
  if (c.express && !second) { r.ph = "done"; saveSess(); render(); }
}
function measures(res) {
  const a = [], m = res.m, B = res.body, g = res.grid;
  if (m && !m.silent) { a.push("durée " + Math.round(m.dur) + " s", "pauses " + m.pauses + " (dont " + m.longP + " longues)", "variation de hauteur " + m.sd + " demi-tons", "hésitations " + (m.hes || 0), "débit " + m.sps + " syllabes/s"); }
  if (B) { if (B.gazePct !== undefined) a.push("regard caméra " + Math.round(B.gazePct * (B.gazePct <= 1 ? 100 : 1)) + " %"); if (B.sway !== undefined) a.push("balancement " + (B.sway > 0.08 ? "net" : B.sway > 0.04 ? "léger" : "faible")); if (B.gestAct !== undefined) a.push("activité des gestes " + (B.gestAct > 0.6 ? "forte" : B.gestAct > 0.25 ? "moyenne" : "faible")); }
  if (g && g.g) Object.entries(g.g).forEach(([k, v]) => { if (V9.CRIT[k]) a.push(V9.CRIT[k].t + " " + v.s + "/5"); });
  return a.join(", ");
}
function record(b, fb, second) {
  const P = P15(); P.hist = (P.hist || []).concat([{ n: b.c.n, k: b.kind, s: fb.score, two: !!second, at: Date.now() }]).slice(-200); saveProfile();
}
function finishBlk(b) {
  const r = b.r; r.ph = "done"; saveSess();
  // On garde la trace pour le rappel de la semaine
  const P = P15(), c = b.c;
  if (b.kind === "vocab") cont(c, "vocab").mots.forEach(w => { if (!P.words.some(x => x.m === w.m)) P.words.push({ m: w.m, def: w.def, ex: w.ex, n: c.n }); try { srsAdd("w:" + w.m, "w", { m: w.def }); } catch (e) { } });
  if (b.kind === "culture") { const t = cont(c, "culture").t; if (!P.facts.includes(t)) P.facts.push(t); }
  if (b.kind === "methode") P.subj.push(cont(c, "methode").sujet);
  if (b.kind === "corps") P.subj.push(cont(c, "corps").sujet);
  P.words = P.words.slice(-150); P.subj = P.subj.slice(-60); P.facts = P.facts.slice(-40); saveProfile();
  render(); setTimeout(() => { const x = curBlk(); if (x && x.r === r) V9.Flow.after(2500); }, 400);
}
// Les exercices interactifs : mémoire, attention, négociation
const Game = {
  el: null, iv: null,
  open(html) { this.close(); const el = document.createElement("div"); el.id = "v15-game"; el.setAttribute("role", "dialog"); el.innerHTML = '<div class="v15-g-in">' + html + '</div>'; document.body.appendChild(el); this.el = el; return el; },
  close() { clearInterval(this.iv); clearTimeout(this.tm); if (this.el) this.el.remove(); this.el = null; }
};
async function runMemory(b, second) {
  const r = b.r, lv = P15().lvl.mem, c = b.c;
  if (!second) {
    const words = cont(c, "memoire").mots.slice(0, lv); r.seq = words; r.ph = "do"; saveSess(); render();
    const okm = await new Promise(ok => {
      const el = Game.open('<div class="v15-g-top"><b>Placez chaque mot dans une pièce</b><span id="g-n"></span></div><div class="v15-mem"><div id="g-w" class="v15-g-word"></div><div id="g-room" class="v15-g-room"></div></div><div class="v15-g-bar"><i id="g-bar"></i></div><button class="btn ghost" data-act="v15-g-stop">Arrêter</button>');
      let i = 0; const step = () => { if (!Game.el) return ok(0); if (i >= words.length) return ok(1); $("#g-w").textContent = words[i]; $("#g-room").textContent = "→ " + K.ROOMS[i % K.ROOMS.length]; $("#g-n").textContent = (i + 1) + " / " + words.length; $("#g-bar").style.width = ((i + 1) / words.length * 100) + "%"; const w = $("#g-w"); w.classList.remove("pop"); void w.offsetWidth; w.classList.add("pop"); i++; Game.tm = setTimeout(step, 4200); };
      Game.stopCb = () => ok(0); step();
    });
    Game.close(); if (!okm) { try { await Dict.end(); } catch (e) { } r.ph = "learn"; saveSess(); render(); return; }
    // Interférence : 20 secondes de calcul à voix haute
    await new Promise(ok => { pend.run = ok; Run.start("v15int", [{ kind: "prep", lab: "Comptez à voix haute : 100, 93, 86…", txt: "De 7 en 7, sans vous arrêter. Ne pensez pas aux mots.", sec: 20 }], () => { pend.run = null; ok(1); }, {}); });
  }
  r.ph = second ? "redo" : "do"; saveSess(); render();
  const res = await REC({ id: "v15mem" + (second ? "r" : ""), video: false, sec: 45, lab: second ? "Rappel différé" : "Récitez les mots, dans l’ordre", txt: "Refaites le trajet : " + K.ROOMS.slice(0, 4).join(", ") + "…" });
  if (res.cancelled) { r.ph = second ? "fix" : "learn"; saveSess(); render(); return; }
  const got = lcsUnits(r.seq, toks(res.text || "")), k = got.filter(Boolean).length, N = r.seq.length;
  const found = r.seq.filter(w => toks(res.text || "").some(t => t.slice(0, 4) === norm(w).slice(0, 4))).length;
  const score = clamp(Math.round(found / N * 10), 0, 10);
  const fb = { score, verdict: found + " mots sur " + N + " retrouvés, dont " + k + " dans l’ordre.", parties: r.seq.map(w => ({ n: w, ok: toks(res.text || "").some(t => t.slice(0, 4) === norm(w).slice(0, 4)), note: "" })), force: found >= N * 0.7 ? "Votre trajet tient : la méthode fonctionne." : "Chaque mot retrouvé est un mot gravé.", corriger: found >= N * 0.8 ? "Prochaine fois : deux mots de plus." : "Rendez les images plus folles : taille géante, mouvement, bruit, odeur.", dites: "", dire: found + " sur " + N + ". " + (found >= N * 0.8 ? "Excellent. Au prochain essai, j’augmente la difficulté." : "Pour le rappel différé, refaites le trajet lentement, pièce par pièce.") };
  if (!second) { r.t1 = res.text; r.fb1 = fb; r.ph = "fix"; } else { r.t2 = res.text; r.fb2 = fb; r.ph = "refix"; const P = P15(); if (found >= N * 0.8) P.lvl.mem = Math.min(20, P.lvl.mem + 2); else if (found < N * 0.5) P.lvl.mem = Math.max(6, P.lvl.mem - 1); saveProfile(); }
  record(b, fb, second); saveSess(); render();
  coachSay([{ text: fb.dire }], () => { if (second || c.express) setTimeout(() => { const x = curBlk(); if (x && x.r === b.r) finishBlk(b); }, 2500); });
}
async function runNback(b, second) {
  const r = b.r, n = P15().lvl.nback, T = 18 + n, c = b.c;
  r.ph = second ? "redo" : "do"; saveSess(); render();
  const seq = []; for (let i = 0; i < T; i++) { if (i >= n && seeded(c.n * 7 + (second ? 3 : 0), i) < 0.32) seq.push(seq[i - n]); else { let x; do { x = Math.floor(seeded(c.n * 11 + (second ? 5 : 0), i * 3 + seq.length) * 9) % 9; } while (i >= n && x === seq[i - n] && Math.random() < 0.9); seq.push(x); } }
  const taps = new Array(T).fill(false);
  const ok = await new Promise(done => {
    Game.open('<div class="v15-g-top"><b>Même case qu’il y a ' + n + ' tours ?</b><span id="g-n"></span></div><div class="v15-grid">' + Array.from({ length: 9 }, (_, i) => '<i data-c="' + i + '"></i>').join("") + '</div><button class="btn v14-cta" data-act="v15-nb">Même case</button><button class="btn ghost" data-act="v15-g-stop">Arrêter</button>');
    let i = -1; Game.cur = () => i; Game.tap = () => { if (i >= 0) { taps[i] = true; const bt = document.querySelector('[data-act="v15-nb"]'); if (bt) { bt.classList.add("hit"); setTimeout(() => bt.classList.remove("hit"), 200); } } };
    Game.stopCb = () => done(false);
    const step = () => { if (!Game.el) return; i++; if (i >= T) return done(true); document.querySelectorAll(".v15-grid i").forEach(e => e.className = ""); const cell = document.querySelector('.v15-grid i[data-c="' + seq[i] + '"]'); if (cell) cell.className = "on"; $("#g-n").textContent = (i + 1) + " / " + T; Game.tm = setTimeout(() => { if (cell) cell.className = ""; Game.tm = setTimeout(step, 700); }, 1800); };
    Game.tm = setTimeout(step, 800);
  });
  Game.close(); if (!ok) { r.ph = second ? "fix" : "learn"; saveSess(); render(); return; }
  let hit = 0, miss = 0, fa = 0; for (let i = n; i < T; i++) { const tgt = seq[i] === seq[i - n]; if (tgt && taps[i]) hit++; else if (tgt) miss++; else if (taps[i]) fa++; }
  const tot = hit + miss, acc = tot ? hit / tot : 1, score = clamp(Math.round((acc - fa / Math.max(1, T - n - tot)) * 10), 0, 10);
  const fb = { score, verdict: hit + " cibles trouvées sur " + tot + ", " + fa + " fausse" + (fa > 1 ? "s" : "") + " alerte" + (fa > 1 ? "s" : "") + ".", parties: [], force: hit >= tot * 0.7 ? "Votre attention tient sur la durée." : "Vous avez tenu la manche entière.", corriger: fa > 2 ? "Ne touchez que si vous êtes sûr : la précision avant la vitesse." : miss > 2 ? "Répétez-vous les deux dernières cases à voix basse." : "Prochaine manche : niveau supérieur.", dites: "", dire: hit + " sur " + tot + ". " + (score >= 8 ? "Très bien, on monte d’un niveau." : "Deuxième manche : murmurez les dernières positions.") };
  if (!second) { r.fb1 = fb; r.ph = "fix"; } else { r.fb2 = fb; r.ph = "refix"; const P = P15(); if (score >= 8) P.lvl.nback = Math.min(4, P.lvl.nback + 1); else if (score <= 3) P.lvl.nback = Math.max(1, P.lvl.nback - 1); saveProfile(); }
  record(b, fb, second); saveSess(); render();
  coachSay([{ text: fb.dire }], () => { if (second || c.express) setTimeout(() => { const x = curBlk(); if (x && x.r === b.r) finishBlk(b); }, 2500); });
}
// La négociation : trois échanges avec l'interlocuteur joué par Claude
function dlgHtml(b) {
  const r = b.r, x = cont(b.c, "nego"), D = r.dlg || [];
  return '<div class="v15-dlg">' + D.map(d => '<div class="v15-bub ' + (d.me ? "me" : "them") + '"><span>' + (d.me ? "Vous" : esc(x.who)) + '</span>' + fr(d.t) + '</div>').join("") + (r.thinking ? '<div class="v15-bub them"><span>' + esc(x.who) + '</span><i class="v15-dots"><b></b><b></b><b></b></i></div>' : "") + '</div>' +
    (!r.thinking && D.length && !D[D.length - 1].me ? '<button class="btn wide big-act2 v14-prim" data-keep="1" data-act="v15-reply">Répondre</button>' : "");
}
async function negoTurn(b) {
  const r = b.r, x = cont(b.c, "nego"); r.dlg = r.dlg || [];
  const mine = r.dlg.filter(d => d.me).length;
  if (mine >= (r.second ? 1 : 3)) { await negoFix(b); return; }
  r.thinking = true; render();
  let line = x.lines[Math.min(mine, x.lines.length - 1)];
  if (coachIA() && mine > 0) {
    try {
      const j = await ask("Tu joues " + x.who + " dans une négociation. Situation : " + x.ctx + " Ton intérêt caché : " + x.hidden + ". Tu ne cèdes que si l’orateur pose de bonnes questions ou propose des options utiles. Dialogue : " + r.dlg.map(d => (d.me ? "ORATEUR : " : "TOI : ") + d.t).join(" | ") + "\nRéponds UNIQUEMENT en JSON : {\"t\": \"ta réplique, 30 mots maximum, naturelle, en français\"}", "quick");
      if (j && j.t) line = String(j.t);
    } catch (e) { }
  }
  r.thinking = false; r.dlg.push({ t: line }); saveSess(); render();
  coachSay([{ text: line }]);
}
async function negoReply(b) {
  const r = b.r;
  const res = await REC({ id: "v15ng", video: false, sec: 30, lab: "Votre réponse", txt: (r.dlg[r.dlg.length - 1] || {}).t || "" });
  if (res.cancelled) return render();
  r.dlg.push({ me: true, t: res.text || "(silence)" }); saveSess(); render();
  negoTurn(b);
}
async function negoFix(b) {
  const r = b.r, second = !!r.second; r.ph = "wait"; saveSess(); render();
  const text = r.dlg.filter(d => d.me).map(d => d.t).join(" / ");
  const fb = await feedback(b, text, "", second ? r.fb1 && r.fb1.corriger : null);
  if (second) { r.fb2 = fb; r.t2 = text; r.ph = "refix"; } else { r.fb1 = fb; r.t1 = text; r.ph = "fix"; }
  record(b, fb, second); saveSess(); render();
  coachSay([{ text: fb.dire || fb.corriger }], () => { if (second || b.c.express) setTimeout(() => { const x = curBlk(); if (x && x.r === b.r) finishBlk(b); }, 2500); });
}

// =====================================================================
// 8. LA SÉANCE : échauffement de 9 minutes, trois blocs, bilan de 90 secondes
// =====================================================================
Object.assign(V9.PLAN.full, { forge: [250, "n", 10] });
Object.assign(V9.PLAN.express, { forge: [250, "n", 10] });
const _bc15 = buildCards;
buildCards = function (c) {
  const C0 = _bc15(c); if (!inPack(c)) return C0;
  const keep = C0.filter(x => ["studio", "meteo", "souffle", "visage", "forge"].includes(x.k));
  if (!keep.some(x => x.k === "forge")) keep.push({ k: "forge", B: "B", act: 1, sec: 250, auto: "c8-forge", t: "La Forge · 10 virelangues", n: 10 });
  keep.forEach(x => { if (x.k === "forge") { x.n = 10; x.sec = 250; x.t = "La Forge · 10 virelangues"; } if (x.k === "souffle") x.sec = c.express ? 95 : 215; if (x.k === "visage") x.sec = c.express ? 50 : 90; });
  const out = keep.slice();
  plan(c).forEach(([kind, m], bi) => { const sk = K.SK[kind]; out.push({ k: "blk", B: "E", act: 2, bi, kind, m, sec: c.express ? 150 : 360, t: sk.t.charAt(0) + sk.t.slice(1).toLowerCase() }); });
  out.push({ k: "fin", B: "F", act: 3, sec: c.express ? 45 : 90, t: "Bilan" });
  return out;
};
// En express : respiration et visage raccourcis
const _yopts = V9.YTM.opts.bind(V9.YTM);
V9.YTM.opts = function (k) { const o = _yopts(k); if (S.cur && S.cur.express) { if (k === "souffle") { o.end = 90; o.total = 90; o.cap = "Respiration 4-4-8 · 1 min 30"; } if (k === "visage") o.total = 45; } return o; };
// L'arrivée sur une carte : le coach parle
const _cg15 = cardGo;
cardGo = function (i, auto = true) {
  _cg15(i, auto);
  const c = S.cur; if (!inPack(c)) return;
  const cd = buildCards(c)[c.card || 0]; if (!cd) return;
  if (cd.k === "blk") { const b = bObj(c, cd); if (auto && b.r.ph === "learn") setTimeout(() => { const x = curBlk(); if (x && x.r === b.r && x.r.ph === "learn") coachSay(b.spec.intro(b)); }, 500); }
  if (cd.k === "fin" && auto) setTimeout(() => finCoach(c), 400);
};
// Le bilan de 90 secondes
function blockScores(c) { return plan(c).map(([kind], i) => { const r = R("b" + i); return { kind, t: K.SK[kind].t, s1: r.fb1 ? r.fb1.score : null, s2: r.fb2 ? r.fb2.score : null, corr: r.fb2 ? r.fb2.corriger : r.fb1 ? r.fb1.corriger : "" }; }); }
async function finCoach(c) {
  const V = c.res.v15 = c.res.v15 || {}; const r = R("fin");
  if (!r.sum) {
    const bs = blockScores(c), fg = R("forge"), v7r = R("v7");
    let sum = null;
    if (coachIA()) {
      try { sum = await ask("Tu es le coach. " + PROFIL + " Résultats de la séance : " + bs.map(x => x.t + " : " + (x.s1 ?? "non fait") + (x.s2 != null ? " puis " + x.s2 : "") + "/10, correction : " + x.corr).join(" ; ") + (fg.acc != null ? " ; diction (virelangues) " + Math.round(fg.acc * 100) + " %" : "") + (v7r.pre != null ? " ; trac avant " + v7r.pre + "/10" : "") + ".\nRéponds UNIQUEMENT en JSON : {\"progres\": \"ce qui a progressé, une phrase\", \"corriger\": \"la priorité à corriger, une phrase\", \"demain\": \"l’exercice précis à refaire demain, une phrase\", \"dire\": \"bilan parlé, 70 mots maximum, chaleureux, concret\"}", "quick"); } catch (e) { sum = null; }
    }
    if (!sum || !sum.dire) {
      const done = bs.filter(x => x.s1 != null), best = done.slice().sort((a, b) => (b.s2 ?? b.s1) - (a.s2 ?? a.s1))[0], worst = done.slice().sort((a, b) => (a.s2 ?? a.s1) - (b.s2 ?? b.s1))[0];
      sum = { progres: best ? best.t.toLowerCase() + " : " + (best.s2 ?? best.s1) + "/10." : "Vous avez fait l’échauffement complet.", corriger: worst && worst.corr ? worst.corr : "Remplacer chaque « euh » par un silence.", demain: worst ? "Refaire le bloc " + worst.t.toLowerCase() + " en appliquant la correction." : "Faire les trois blocs de demain." };
      sum.dire = "Bilan. Ce qui progresse : " + sum.progres + " À corriger en priorité : " + sum.corriger + " Demain : " + sum.demain;
    }
    r.sum = sum; V.sum = sum; saveSess(); render();
  }
  coachSay([{ text: r.sum.dire }]);
}
CARD.fin = function (c) {
  const r = R("fin"), v = R("v7"), bs = blockScores(c);
  let h = '<div class="v15-head"><div class="v15-ic">🏁</div><div class="v15-k">BILAN</div><h2 class="v15-t">90 secondes</h2><button class="v14-spk" data-act="v15-fin-say" aria-label="Réécouter le bilan">🔊</button></div>';
  h += '<p class="v15-cap center">Votre trac, maintenant :</p>' + sudsRow("post", v.post);
  h += '<ul class="v15-scores">' + bs.map(x => '<li><span>' + esc(x.t) + '</span><b>' + (x.s1 == null ? "—" : x.s1 + (x.s2 != null ? " → " + x.s2 : "")) + '</b></li>').join("") + (R("forge").acc != null ? '<li><span>DICTION</span><b>' + Math.round(R("forge").acc * 100) + ' %</b></li>' : "") + '</ul>';
  if (!r.sum) h += '<div class="v15-wait"><span class="pulse"></span><b>Votre coach fait le bilan…</b></div>';
  else h += '<div class="v15-sum"><div class="v15-row ok"><span>Ce qui progresse</span>' + fr(r.sum.progres) + '</div><div class="v15-row fix"><span>À corriger</span><b>' + fr(r.sum.corriger) + '</b></div><div class="v15-row say"><span>Demain</span>' + fr(r.sum.demain) + '</div></div>';
  return h + '<button class="btn wide big-act2 v14-prim" data-keep="1" data-act="close">Terminer la séance</button>';
};
// La fin de séance : rapide (bilan local), puis un écran court
const _close15 = closeSession;
closeSession = async function () { const c = S.cur; if (!inPack(c)) return _close15(); hush(); const prev = S.coach; S.coach = "off"; try { return await _close15(); } finally { S.coach = prev; } };
const _bv15 = bilanView;
bilanView = function (c, info) {
  const V = c.res && c.res.v15; if (!V || !V.sum) return _bv15(c, info);
  return '<section class="card v15-endcard"><div class="v15-k">SÉANCE TERMINÉE</div><h2 class="v15-t">Bravo.</h2><div class="v15-sum"><div class="v15-row ok"><span>Ce qui progresse</span>' + fr(V.sum.progres) + '</div><div class="v15-row fix"><span>À corriger</span><b>' + fr(V.sum.corriger) + '</b></div><div class="v15-row say"><span>Demain</span>' + fr(V.sum.demain) + '</div></div><button class="btn wide big-act2" data-act="go" data-r="home">Retour à l’accueil</button></section><details class="v15-more"><summary>Diagnostic détaillé</summary>' + _bv15(c, info) + '</details>';
};
if (typeof autoCoach === "function") { const _ac15 = autoCoach; autoCoach = function (id) { if (String(id || "").startsWith("v15")) return Promise.resolve(); return _ac15.apply(this, arguments); }; }
// La séance démarre : le coach prépare le contenu pendant l'échauffement
const _ss15 = startSession;
startSession = async function () { const r = await _ss15.apply(this, arguments); const c = S.cur; if (inPack(c)) { prepare(c); } return r; };
// Ne pas enchaîner tant qu'un bloc n'est pas fini
const F = V9.Flow, _after15 = F.after.bind(F);
F.after = function (ms) { const x = curBlk(); if (x && x.r.ph !== "done") return; const c = S.cur; if (c && inPack(c)) { const cd = buildCards(c)[c.card || 0]; if (cd && cd.k === "fin") return; } return _after15(ms); };
// Pendant un enregistrement filmé de bloc : le sujet et les parties sous l'image
const _rss15 = RS.stop.bind(RS);
RS.stop = function () { if (this.phase === "rec" && String(this.id || "").startsWith("v15")) this._v15stop = true; return _rss15.apply(this, arguments); };
const _rsb15 = RS.begin.bind(RS);
RS.begin = function () { _rsb15(); if (!String(this.id || "").startsWith("v15") || !V9.v15rs) return; const d = $("#v9-stage .v14-rs"); const x = V9.v15rs; const html = (x.subj ? '<p><b>Sujet</b> ' + esc(x.subj) + '</p>' : "") + (x.parts.length ? '<div class="v14-steps mini" style="grid-template-columns:repeat(' + Math.min(6, x.parts.length) + ',1fr)">' + x.parts.map((p, i) => '<span><b>' + (i + 1) + '</b>' + esc(p) + '</span>').join("") + '</div>' : ""); if (d) d.innerHTML = html; else { const inn = $("#v9-stage .rs-in"); if (inn) { const e = document.createElement("div"); e.className = "v14-rs"; e.innerHTML = html; inn.insertBefore(e, inn.querySelector("#rs-checks")); } } };
// Les prises de bloc ne vont pas dans la vidéothèque des séances : elles y vont, mais sans bloquer la suite
// (rien à faire : runMedia archive comme d'habitude)

// =====================================================================
// 9. ACTIONS
// =====================================================================
window.addEventListener("click", e => {
  const bt = e.target.closest("[data-act]"); if (!bt) return;
  const a = bt.dataset.act, stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
  if (a === "v15-g-stop") { stop(); const f = Game.stopCb; Game.close(); if (f) f(); return; }
  if (a === "v15-nb") { stop(); if (Game.tap) Game.tap(); return; }
  const b = curBlk();
  switch (a) {
    case "v15-coach": { stop(); hush(); if (b) coachSay(b.spec.intro(b)); break; }
    case "v15-fin-say": { stop(); hush(); const c = S.cur; if (c) finCoach(c); break; }
    case "v15-ans": { stop(); if (!b) break; const q = Number(bt.dataset.q), o = Number(bt.dataset.o); b.r.qa = b.r.qa || []; if (b.r.qa[q] !== undefined) break; b.r.qa[q] = o; const Q = b.spec.quiz(b); beep(1, o === Q[q][2] ? 1046 : 330); saveSess(); render(); break; }
    case "v15-go": {
      stop(); if (!b) break; hush();
      // La dictée doit démarrer dans le geste même de l'orateur
      if (b.kind === "memoire") { Dict.begin(); runMemory(b, false); break; }
      if (b.kind === "attention") { runNback(b, false); break; }
      if (b.kind === "trac") { runDo(b, false); break; } // la question est dite à voix haute : pas de dictée, transcription locale
      if (b.kind === "nego") { b.r.ph = "dlg"; b.r.dlg = []; b.r.second = false; saveSess(); render(); negoTurn(b); break; }
      Dict.begin(); runDo(b, false); break;
    }
    case "v15-redo": {
      stop(); if (!b) break; hush();
      if (b.kind === "memoire") { Dict.begin(); runMemory(b, true); break; }
      if (b.kind === "trac") { runDo(b, true); break; }
      if (b.kind === "attention") { runNback(b, true); break; }
      if (b.kind === "nego") { b.r.second = true; b.r.dlg = (b.r.dlg || []).filter(d => !d.me).slice(-1); b.r.ph = "dlg"; saveSess(); render(); break; }
      Dict.begin(); runDo(b, true); break;
    }
    case "v15-reply": { stop(); if (!b) break; hush(); Dict.begin(); negoReply(b); break; }
    case "v15-voice": { stop(); pref.set("v15voice", bt.dataset.v); hush(); render(); coachSay([{ text: "Voici ma voix. Je serai votre coach." }]); break; }
  }
}, true);

// =====================================================================
// 10. L'ACCUEIL : le programme de la semaine et la voix du coach
// =====================================================================
const DAYN = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const _home15 = viewHome;
viewHome = function () {
  let h = _home15();
  const today = (() => { try { const nx = typeof nextSession === "function" ? nextSession() : null; return nx && nx.d ? nx.d : 0; } catch (e) { return 0; } })();
  const wk = '<section class="card v15-week"><div class="eyebrow">Votre semaine</div><ol>' + [1, 2, 3, 4, 5].map(d => '<li class="' + (d === today ? "on" : "") + '"><b>' + DAYN[d - 1] + '</b><span>' + K.WEEK_PLAN[d].map(([k, m]) => k === "methode" ? K.M[m].t : K.SK[k].t.charAt(0) + K.SK[k].t.slice(1).toLowerCase()).join(" · ") + '</span></li>').join("") + '</ol><p class="small muted">Chaque séance : échauffement (souffle, visage, 10 virelangues × 3) puis trois blocs de 6 minutes et un bilan de 90 secondes.</p></section>';
  const vc = '<section class="card v15-voice"><div class="eyebrow">La voix du coach</div><div class="v15-vopts">' + VOICES.filter(v => v[0] === "device" || C.tts).map(v => '<button class="' + (voiceName() === v[0] || (!C.tts && v[0] === "device") ? "on" : "") + '" data-act="v15-voice" data-v="' + v[0] + '">' + esc(v[1]) + '</button>').join("") + '</div><p class="small muted">' + (C.tts ? "Voix Claude active : la plus naturelle." : esc(V9.voiceTip ? V9.voiceTip() || "Voix de l’appareil." : "Voix de l’appareil.")) + (coachIA() ? " · Coach Claude actif." : " · Pour un coach qui vous corrige vraiment, ouvrez l’application dans Claude.") + '</p></section>';
  h = h.replace(/(<p class="v13-ver[^>]*>)/, wk + vc + "$1").replace(/Version 1[34]\.0/, "Version " + APP);
  return h;
};
render();
})();
