// ===== Le Verbe Souverain · v14 =====
// Une séance simple, à la manière d'une leçon courte :
// 1. Chaque étape : une icône, un titre, une ligne. Le détail est replié dans « Plus d'aide ».
// 2. Le bouton principal est toujours en bas de l'écran, sans défiler.
// 3. Plus de compte à rebours : « Démarrer » lance tout de suite.
// 4. Respiration : vidéo « Technique 4-4-8 » (3 min 30). Puis réveil du visage (1 min 30).
// 5. Une seule phrase parlée par étape, et un seul son à la fois.
(function () {
"use strict";
const V9 = window.V9, X = window.V12C;
S.v14 = S.v14 || {};
const inPack = c => !!(c && c.info && c.info.pack && c.info.pack.track);
const cur = () => { const c = S.cur; if (!inPack(c)) return null; const cs = buildCards(c); return { c, cs, i: clamp(c.card || 0, 0, cs.length - 1), cd: cs[clamp(c.card || 0, 0, cs.length - 1)] }; };
const hush = () => { try { Voice.stop(); } catch (e) { } try { speechSynthesis.cancel(); } catch (e) { } };
const talk = (t, onend) => { if (!t || !VOICE_ON()) { if (onend) onend(); return; } TTS.speak(t, 1, onend); };
const chime = () => { try { beep(1, 784); setTimeout(() => beep(1, 1175), 140); } catch (e) { } };
const done14 = t => '<div class="v12-done">✓ ' + esc(t) + '<span>Évaluation au débrief, en fin de séance.</span></div>';

// =====================================================================
// 1. LES VIDÉOS DE PRÉPARATION
// =====================================================================
const VID = {
  souffle: { id: "FZZPXR_5s_c", end: 210, total: 210, t: "Respirer", cap: "Respiration anti-stress 4-4-8 · Respire avec Tom & Inga · 3 min 30" },
  visage: { id: "4b4CwMHhU4I", end: 14, total: 90, t: "Réveiller le visage", cap: "Massage du visage · Mélissa B · puis échauffement guidé · 1 min 30", short: true }
};
const FACE = [
  ["👐", "Massez vos joues", "Petits cercles du bout des doigts, des pommettes à la mâchoire."],
  ["😮", "Relâchez la mâchoire", "Ouvrez grand la bouche, comme un bâillement. Trois fois."],
  ["💨", "Faites vibrer les lèvres", "Lèvres détendues : « brrrr », comme un cheval."],
  ["👅", "Promenez la langue", "Faites le tour de vos dents, bouche fermée. Puis dans l’autre sens."],
  ["😁", "Sourire, puis « O »", "Grand sourire, puis bouche en « O ». Alternez."]
];
const toSec = s => { const m = String(s || "").match(/(\d+):(\d{2})/); return m ? Number(m[1]) * 60 + Number(m[2]) : 0; };

// Le lecteur YouTube, plein écran, hors de la page (aucun rafraîchissement ne le coupe)
const YTM = {
  on: false, k: null, p: null, el: null, iv: null, api: null, acc: 0, last: 0, playing: false, failed: false, phase: "yt", stepI: -1, o: null,
  loadApi() {
    if (window.YT && YT.Player) return Promise.resolve();
    if (this.api) return this.api;
    this.api = new Promise((res, rej) => {
      const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { try { prev && prev(); } catch (e) { } res(); };
      const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.async = true;
      s.onerror = () => { this.api = null; rej(new Error("api")); }; document.head.appendChild(s);
      setTimeout(() => { if (!(window.YT && YT.Player)) { this.api = null; rej(new Error("timeout")); } }, 9000);
    });
    return this.api;
  },
  opts(k) {
    const c = S.cur;
    if (k === "video") { const v = X.videoFor(WEEK.n, c.info.pack.d), end = Math.min(toSec(v.to) || v.min * 60, 150); return { id: v.id, start: 0, end, total: end, t: "Vidéo de maître", cap: v.t + " · " + v.who }; }
    return Object.assign({ start: 0 }, VID[k]);
  },
  start(k) {
    this.close(true); hush(); V9.Flow && V9.Flow.cancel();
    const o = this.opts(k); this.o = o; this.k = k; this.on = true; this.acc = 0; this.last = performance.now(); this.playing = false; this.failed = false; this.phase = "yt"; this.stepI = -1;
    const el = document.createElement("div"); el.id = "v14-media"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    el.innerHTML = '<div class="v14-m-in"><div class="v14-m-top"><b>' + esc(o.t) + '</b><span id="v14-m-t">' + fmtSec(o.total) + '</span></div>' +
      '<div class="v14-m-vid' + (o.short ? " short" : "") + '" id="v14-m-vid"><div id="v14-yt"></div></div>' +
      '<div class="v14-m-step" id="v14-m-step" hidden></div>' +
      '<div class="v14-m-bar"><i id="v14-m-bar"></i></div><p class="v14-m-hint" id="v14-m-hint">' + esc(o.cap) + '</p>' +
      '<div class="v14-m-btns"><button class="btn v14-cta" data-act="v14-m-done">J’ai terminé</button><button class="btn ghost" data-act="v14-m-stop">Arrêter</button></div></div>';
    document.body.appendChild(el); this.el = el;
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(w => { this.wake = w; }).catch(() => { }); } catch (e) { }
    if (navigator.onLine === false) { this.fail(); return; }
    this.loadApi().then(() => {
      if (!this.on || this.o !== o) return;
      this.p = new YT.Player("v14-yt", {
        width: "100%", height: "100%", videoId: o.id,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, start: o.start || 0, end: o.end, fs: 0, hl: "fr", cc_load_policy: 0 },
        events: {
          onReady: e => { try { e.target.setVolume(100); e.target.playVideo(); } catch (_) { } },
          onStateChange: e => { this.playing = e.data === 1; if (this.playing && !this.bodyAsked) { this.bodyAsked = true; setTimeout(() => { try { if (V9.Body.state !== "ready") V9.Body.load(true).catch(() => { }); } catch (_) { } }, 4000); } if (e.data === 0) this.ytEnded(); },
          onError: () => this.fail()
        }
      });
    }).catch(() => this.fail());
    clearInterval(this.iv); this.iv = setInterval(() => this.tick(), 250);
  },
  tick() {
    if (!this.on) return;
    const now = performance.now(), dt = (now - this.last) / 1000; this.last = now;
    const o = this.o, counting = this.phase !== "yt" || this.playing;
    if (counting) this.acc += dt;
    const hint = $("#v14-m-hint");
    if (this.phase === "yt" && !this.playing && this.acc === 0 && hint && !this.failed && performance.now() - (this.t0 || (this.t0 = now)) > 4000) hint.textContent = "Touchez la vidéo pour la lancer.";
    if (this.phase === "yt" && this.playing && hint && hint.textContent !== o.cap) hint.textContent = o.cap;
    const left = Math.max(0, o.total - this.acc), t = $("#v14-m-t"), bar = $("#v14-m-bar");
    if (t) t.textContent = fmtSec(Math.ceil(left)); if (bar) bar.style.width = Math.min(100, this.acc / o.total * 100) + "%";
    if (this.k === "visage") {
      if (this.phase === "yt" && this.acc >= o.end + 1) this.ytEnded();
      if (this.phase === "steps") { const per = (o.total - this.stepAt) / FACE.length, i = Math.min(FACE.length - 1, Math.floor((this.acc - this.stepAt) / per)); if (i !== this.stepI) this.showStep(i); }
    }
    if (this.acc >= o.total) this.finish(true);
  },
  ytEnded() {
    if (this.k !== "visage") { this.finish(true); return; }
    if (this.phase !== "yt") return;
    this.phase = "steps"; this.stepAt = this.acc; this.killPlayer();
    const v = $("#v14-m-vid"); if (v) v.hidden = true;
  },
  showStep(i) {
    this.stepI = i; const s = FACE[i], el = $("#v14-m-step"); if (!el) return;
    el.hidden = false; el.innerHTML = '<div class="v14-m-emo">' + s[0] + '</div><div class="v14-m-n">' + (i + 1) + ' / ' + FACE.length + '</div><h3>' + esc(s[1]) + '</h3><p>' + esc(s[2]) + '</p>';
    const h = $("#v14-m-hint"); if (h) h.textContent = "Échauffement du visage, devant la caméra ou un miroir.";
    beep(1, 880); talk(s[1] + ". " + s[2]);
  },
  fail() {
    if (!this.on) return; this.failed = true; this.killPlayer();
    if (this.k === "visage") { if (this.phase === "yt") { this.phase = "steps"; this.stepAt = this.acc; const v = $("#v14-m-vid"); if (v) v.hidden = true; } return; }
    if (this.k === "souffle") { this.close(); toast("Vidéo indisponible : respiration guidée à la place."); R("souffle").coh = true; saveSess(); render(); setTimeout(() => { S.v13.cohUser = true; Coh.start(8); render(); }, 300); return; }
    const v = X.videoFor(WEEK.n, S.cur.info.pack.d), box = $("#v14-m-vid");
    if (box) box.innerHTML = '<a class="v14-m-link" href="https://www.youtube.com/watch?v=' + v.id + '" target="_blank" rel="noopener">▶ Ouvrir la vidéo sur YouTube</a>';
    const h = $("#v14-m-hint"); if (h) h.textContent = "La vidéo ne s’affiche pas ici. Ouvrez-la, puis revenez et touchez « J’ai terminé ».";
    this.playing = true;
  },
  killPlayer() { try { this.p && this.p.destroy(); } catch (e) { } this.p = null; this.playing = false; },
  close(silent) {
    clearInterval(this.iv); this.killPlayer(); hush();
    if (this.el) this.el.remove(); this.el = null; this.on = false;
    try { this.wake && this.wake.release(); } catch (e) { } this.wake = null; this.t0 = 0;
  },
  finish(ok) {
    const k = this.k; this.close(); if (!ok || !S.cur) return;
    if (k === "souffle") { R("souffle").breathDone = true; saveSess(); render(); chime(); V9.Flow.after(2500); }
    else if (k === "visage") { R("visage").done = true; saveSess(); render(); chime(); V9.Flow.after(2500); }
    else if (k === "video") { R("video").opened = true; saveSess(); render(); setTimeout(() => talk("Qu’en retenez-vous ? Touchez Démarrer, et dites-le en trente secondes."), 300); }
  }
};
V9.YTM = YTM;
// Préchargement discret du lecteur au début d'une séance
const warm = () => { if (navigator.onLine !== false) YTM.loadApi().catch(() => { }); };

// =====================================================================
// 2. LES ÉTAPES : une icône, un titre, une ligne, une phrase parlée
// =====================================================================
const SH = {
  studio: ["🎥", "Caméra et micro", "Autorisez-les une fois, pour être évalué."],
  meteo: ["🌡️", "Votre trac", "De 0 à 10. Une seule touche."],
  souffle: ["🌬️", "Respirer", "Suivez la vidéo : inspirez 4, bloquez 4, soufflez 8."],
  visage: ["🙂", "Réveiller le visage", "Massez, étirez, souriez. Une minute trente."],
  forge: ["🔨", "Articuler", "Chaque phrase trois fois : lent, normal, rapide."],
  video: ["🎬", "Voir un maître", "Regardez, puis dites ce que vous retenez."],
  rappel: ["🧠", "Se souvenir", "Retrouvez le mot, puis vérifiez."],
  mots3: ["📖", "Trois mots nouveaux", "Écoutez chaque mot, puis faites-en une phrase."],
  empan: ["🔢", "Mémoire", "Retenez les mots, puis récitez-les dans l’ordre."],
  prise1: ["🎤", "Votre prise de parole", "Lisez le sujet. Suivez les 4 étapes. Parlez à la caméra."],
  prise2: ["🔁", "Deuxième prise", "Même sujet, un seul conseil en tête."],
  question: ["⚡", "Question piège", "Respirez 3 secondes, puis répondez en 3 points."],
  sim: ["🤝", "Négociation", "Lisez la situation, puis répondez en 2 minutes."],
  roulette: ["🎲", "Improvisation", "Trois sujets surprise. Idée d’abord, puis 3 points."],
  debrief: ["🧭", "Votre débrief", "Écoutez votre coach : erreurs, corrections, suite."],
  bilan: ["🏁", "Le bilan", "Votre trac maintenant, puis votre progrès."]
};
const SAY = {
  studio: "Activez la caméra et le micro.",
  meteo: "Votre trac, de zéro à dix ?",
  souffle: "On respire avec la vidéo, trois minutes trente. Touchez Démarrer.",
  visage: "On réveille le visage. Touchez Démarrer.",
  forge: "Chaque phrase trois fois : lentement, normalement, puis vite. Touchez Démarrer.",
  video: "Regardez la vidéo, puis dites ce que vous retenez.",
  rappel: "Retrouvez chaque mot de mémoire.",
  mots3: "Trois mots nouveaux. Faites une phrase avec chacun. Touchez Démarrer.",
  empan: "Retenez les mots, puis récitez-les dans l’ordre. Touchez Démarrer.",
  sim: "Négociation. Lisez la situation, puis touchez Démarrer.",
  roulette: "Trois sujets surprise. Touchez Démarrer.",
  bilan: "Votre trac maintenant, de zéro à dix ?"
};
// Les exercices ciblés, en une ligne et un exemple
const DR = {
  relais: ["Parlez une minute. À chaque « euh » : silence, puis reprenez.", "« Notre projet couvre trois communes… » (silence) « …et chacune a son comité. »"],
  avant: ["Pour chaque question : votre idée en une phrase, d’abord.", "« Il faut financer les champs. Pourquoi ? Trois raisons… »"],
  metronome: ["À chaque bip : une phrase courte, puis respirez.", "Bip. « La coopérative a doublé ses rendements. » Respiration."],
  intensites: ["La même phrase trois fois : murmure, normal, tribune.", "Le son vient du ventre. On ne crie pas."],
  ancrage: ["Pieds fixes, mains actives. Parlez 45 secondes.", "Comptez vos trois points sur les doigts, à hauteur de poitrine."],
  regard: ["Finissez chaque phrase les yeux dans la caméra.", "« Ce que je vous propose… » (regard) « …tient en un mot : confiance. »"],
  ouvertures: ["Commencez votre sujet trois fois : par une question, un chiffre, puis une image.", "« Savez-vous combien coûte un puits à sec ? » · « Six kilomètres chaque matin. » · « Une calebasse vide sur une tête d’enfant. »"],
  prep: ["Position, raison, exemple, position. En 45 secondes.", "« Investissons dans les semences locales. Elles résistent à la sécheresse. À Kaffrine, elles ont tenu. Oui, investissons. »"],
  entonnoir: ["Votre sujet en 60 secondes, puis en 30, puis en 10.", "En 10 secondes : « Nous aidons trois communes à se nourrir. »"],
  motimpose: ["Parlez 45 secondes en plaçant les trois mots affichés.", "« Mon exorde sera sobre, et mon aplomb fera le reste. »"],
  recit5: ["Une histoire en 5 temps. Chaque temps s’affiche à l’écran.", "Situation, déclencheur, obstacle, votre choix, la leçon."],
  objections: ["Répondez : « Certes… Cependant… C’est pourquoi… »", "« Certes, ça coûte. Cependant, ça dure vingt ans. C’est pourquoi nous formons. »"],
  interets: ["Ne proposez rien : posez une question ouverte.", "« Qu’est-ce qui vous inquiète le plus dans ce calendrier ? »"],
  recadrage: ["Respirez, dites « Je suis enthousiaste », puis votre première phrase.", "« Je suis enthousiaste. Bonjour à tous… »"],
  palais: ["Rangez vos 3 idées dans 3 pièces de votre maison, puis récitez.", "Entrée : la terre. Salon : l’eau. Cuisine : la confiance."],
  rapide: ["Une question. Trois secondes. Puis répondez.", "« Le marché, c’est la bourse du village. Trois preuves… »"],
  humour: ["Racontez une erreur vraie en 30 secondes, avec sa leçon.", "« Depuis, je commence toujours par la monnaie. »"],
  ecoute: ["Redites les trois faits, dans l’ordre, sans rien ajouter.", "« Deux cent quarante femmes, trois saisons, rendements doublés. »"]
};
const HINT = {
  "Ouvrez par une question": "Ex. : « Savez-vous combien coûte un puits à sec ? »",
  "Ouvrez par un chiffre": "Ex. : « Six kilomètres. Chaque matin. »",
  "Ouvrez par une image": "Ex. : « Une calebasse vide, sur une tête d’enfant. »",
  "Situation": "Où ? Quand ? Qui ?", "Déclencheur": "Ce qui arrive, soudain.", "Obstacle": "Ce qui bloque.", "Votre choix": "Ce que vous décidez.", "La leçon": "Une phrase à retenir.",
  "En 60 secondes": "Tout l’essentiel.", "En 30 secondes": "Deux idées.", "En 10 secondes": "Une seule phrase.",
  "Récitez le plan": "Entrée, salon, cuisine : une idée par pièce.", "Encore, plus vite": "Même plan, plus vite."
};
function info14(cd, c) {
  const P = c.info.pack;
  if (cd.k === "prescrit") { const id = prescribed(c), D = DRILLS7[id], d = DR[id]; return ["🎯", D ? D.t : "Exercice ciblé", d ? d[0] : (D ? D.line : "")]; }
  if (cd.k === "video") { const v = X.videoFor(WEEK.n, P.d); return ["🎬", "Voir un maître", v.t + " · " + v.who]; }
  return SH[cd.k] || ["•", cd.t || "", ""];
}
function questionOf(c) { try { const L = v7().lad, cd = buildCards(c).find(x => x.k === "question"), q = cd && QBANK[L.q][cd.qi]; return q ? q[1] : ""; } catch (e) { return ""; } }
function sayOf(cd, c) {
  const P = c.info.pack;
  if (cd.k === "prescrit") { const id = prescribed(c), D = DRILLS7[id], d = DR[id]; return (D ? D.t + ". " : "") + (d ? d[0] : "") + " Touchez Démarrer."; }
  if (cd.k === "prise1") return "Votre prise de parole. Le sujet : " + String(P.fil || "").replace(/[«»]/g, "") + " Touchez Démarrer.";
  if (cd.k === "prise2") return "Deuxième prise, même sujet. Appliquez le conseil affiché. Touchez Démarrer.";
  if (cd.k === "question") { const q = questionOf(c); return "Question piège. " + (q ? q + " " : "") + "Respirez, puis répondez en trois points. Touchez Démarrer."; }
  if (cd.k === "video") { const r = R("video"); return r.opened ? "Qu’en retenez-vous ? Touchez Démarrer." : SAY.video + " Touchez Regarder."; }
  return SAY[cd.k] || "";
}
V9.sayOf = () => { const x = cur(); return x ? sayOf(x.cd, x.c) : ""; };
const fr = t => esc(t).replace(/ ([:;?!»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
const lead = (cd, c) => { const [ic, t, l] = info14(cd, c); return '<div class="v14-lead"><div class="v14-ic" aria-hidden="true">' + ic + '</div><h2 class="v14-t">' + esc(t) + '</h2>' + (l ? '<p class="v14-l">' + esc(l) + '</p>' : "") + '<button class="v14-spk" data-act="v14-say" aria-label="Réécouter la consigne">🔊</button></div>'; };

// La voix : la longue transition de la v13 est remplacée par une phrase courte ; un seul son à la fois
const _speak14 = TTS.speak;
TTS.speak = function (text, rate, onend) {
  if (S.v13 && S.v13.silent) { setTimeout(() => onend && onend(), 150); return true; }
  if (/^Étape \d+ sur \d+\./.test(String(text || ""))) { const x = cur(); text = x ? sayOf(x.cd, x.c) : ""; if (!text) { if (onend) onend(); return true; } }
  if (YTM.on && YTM.phase === "yt") { if (onend) setTimeout(onend, 100); return true; }
  return _speak14.call(TTS, text, rate, onend);
};
// Pas de musique de fond pendant la séance : la voix et les vidéos suffisent
if (window.Music && Music.play) { const _mp = Music.play.bind(Music); Music.play = function () { if (S.route === "seance") return; return _mp.apply(Music, arguments); }; }
// Fin de la respiration de secours : un son, pas de phrase
Coh.finish = function () { this.stop(); if (S.cur) { const r = R("souffle"); r.breathDone = true; saveSess(); } S.v13.cohUser = false; render(); chime(); V9.Flow.after(2500); };

// =====================================================================
// 3. LE PARCOURS : visage après le souffle, durées tenues
// =====================================================================
Object.assign(V9.PLAN.full, { souffle: [210, "cyc", 8], forge: [160, "n", 4] });
Object.assign(V9.PLAN.express, { souffle: [210, "cyc", 8] });
const _bc14 = buildCards;
buildCards = function (c) {
  let C = _bc14(c); if (!inPack(c)) return C;
  if (c.express) C = C.filter(x => x.k !== "forge" && x.k !== "question");
  C.forEach(x => { if (x.k === "souffle") x.sec = 215; if (x.k === "video") x.sec = Math.min(180, x.sec); });
  const si = C.findIndex(x => x.k === "souffle");
  if (si >= 0 && !C.some(x => x.k === "visage")) C.splice(si + 1, 0, { k: "visage", B: "A", act: 1, sec: 90, t: "Réveil du visage" });
  return C;
};

// =====================================================================
// 4. LES CARTES
// =====================================================================
const thumb = (id, k, cap, short) => '<button class="v14-thumb' + (short ? " short" : "") + '" data-act="v14-yt" data-k="' + k + '" aria-label="Lancer la vidéo">' + (navigator.onLine !== false ? '<img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()">' : "") + '<span>▶</span></button><p class="v14-cap">' + esc(cap) + '</p>';
const _souffle14 = CARD.souffle;
CARD.souffle = function (c, info, cd) {
  if (!inPack(c)) return _souffle14(c, info, cd);
  const r = R("souffle");
  if (Coh.on || r.coh) return _souffle14(c, info, cd);
  let h = thumb(VID.souffle.id, "souffle", VID.souffle.cap);
  return h + (r.breathDone ? done14("Respiration faite. Gardez ce calme.").replace('<span>Évaluation au débrief, en fin de séance.</span>', "") + '<button class="btn ghost sm" data-act="v14-yt" data-k="souffle">Recommencer</button>' : '<button class="btn wide big-act2 v14-prim" data-act="v14-yt" data-k="souffle">Démarrer</button>');
};
CARD.visage = function (c) {
  const r = R("visage");
  let h = thumb(VID.visage.id, "visage", VID.visage.cap, true) + '<ol class="v14-face">' + FACE.map(s => '<li><span>' + s[0] + '</span>' + esc(s[1]) + '</li>').join("") + '</ol>';
  return h + (r.done ? done14("Visage réveillé.").replace('<span>Évaluation au débrief, en fin de séance.</span>', "") + '<button class="btn ghost sm" data-act="v14-yt" data-k="visage">Recommencer</button>' : '<button class="btn wide big-act2 v14-prim" data-act="v14-yt" data-k="visage">Démarrer</button>');
};
const _video14 = CARD.video;
CARD.video = function (c, info) {
  if (!inPack(c)) return _video14(c, info);
  const v = X.videoFor(WEEK.n, info.pack.d), r = R("video");
  let h = thumb(v.id, "video", v.t + " · " + v.who + " · 2 min 30 au plus") + '<div class="filrouge"><span>Après la vidéo</span><b>' + esc(v.q) + '</b></div>';
  if (r.ran) return h + done14("Ce que vous retenez est enregistré.") + '<button class="btn ghost sm" data-act="v12-video-bilan">Refaire</button>';
  return h + (r.opened ? '<button class="btn wide big-act2 v14-prim" data-act="v12-video-bilan">Démarrer · ce que je retiens</button>' : '<button class="btn wide big-act2 v14-prim" data-act="v14-yt" data-k="video">Regarder la vidéo</button>');
};
// Les exercices ciblés : le sujet et un exemple, bien visibles
const _presc14 = CARD.prescrit;
CARD.prescrit = function (c, info, cd) {
  const h = _presc14(c, info, cd); if (!inPack(c)) return h;
  const id = prescribed(c), d = DR[id];
  const add = '<div class="filrouge"><span>Votre sujet</span><b>' + esc(info.pack.fil) + '</b></div>' + (d ? '<p class="v14-ex"><span>Exemple</span>' + esc(d[1]) + '</p>' : "");
  return add + h;
};
// Chaque étape d'un exercice ciblé affiche un repère et le sujet
const _ds14 = drillSegs;
drillSegs = function (c, id) {
  const out = _ds14(c, id), fil = c && c.info && c.info.pack ? c.info.pack.fil : "";
  return out.map(s => { const o = Object.assign({}, s), h = HINT[o.lab]; if (h && !o.txt) o.txt = h; if (o.kind === "prep" && !o.txt && fil) o.txt = "Sujet : " + fil; return o; });
};

// =====================================================================
// 5. LA MISE EN PAGE : un écran, un bouton en bas
// =====================================================================
const STRUCT = track => '<div class="v14-struct"><div class="v14-steps">' + [["1", "Accroche"], ["2", "Annonce"], ["3", "Trois points"], ["4", "Chute"]].map(s => '<span><b>' + s[0] + '</b>' + s[1] + '</span>').join("") + '</div><details class="v14-more"><summary>Voir un exemple</summary><p>' + esc(X.STRUCTURE.ex[track] || X.STRUCTURE.ex.ouvrir) + '</p></details></div>';
const _vs14 = viewSession;
viewSession = function () {
  let h = _vs14(); const x = cur(); if (!x || x.c.bilan) return h;
  h = h.replace(/<div class="v12-replay">[\s\S]*?<\/div>(?=<div class="cardx)/, "").replace(/<p class="v10-bridge">[\s\S]*?<\/p>/g, "");
  if (x.cd.k !== "blk" && x.cd.k !== "fin") h = h.replace(/(<div class="cardx[^"]*" data-k="[^"]*">)/, "$1" + lead(x.cd, x.c));
  h = h.replace(/<details class="v12-struct" open>[\s\S]*?<\/details><\/details>/, STRUCT(x.c.info.pack.track));
  return h;
};
function tidy() {
  const x = S.route === "seance" ? cur() : null, on = !!(x && !x.c.bilan);
  document.body.classList.toggle("v14s", on);
  if (!on) return;
  const main = $("#main"), cx = main && main.querySelector(".cardx"), nav = main && main.querySelector(".cx-nav"); if (!cx || !nav) return;
  // Le détail rejoint « Plus d'aide »
  const extra = [...cx.querySelectorAll(":scope > .v12-consigne, :scope > .tip, :scope > .cx-aud, :scope > .drill-tag, :scope > .why")];
  if (extra.length && !cx.querySelector(":scope > details.v14-help")) { const d = document.createElement("details"); d.className = "v14-more v14-help"; d.innerHTML = "<summary>Plus d’aide</summary>"; extra.forEach(e => d.appendChild(e)); cx.appendChild(d); }
  // Le programme du jour se replie sous l'échelle du trac
  const iti = cx.querySelector(":scope > .v10-iti");
  if (iti) { const d = document.createElement("details"); d.className = "v14-more v14-iti"; d.innerHTML = "<summary>Le programme du jour</summary>"; d.appendChild(iti); cx.appendChild(d); }
  // Le bouton principal descend dans la barre du bas
  const done = !!cx.querySelector(".v12-done");
  const prim = cx.querySelector(".v14-prim") || cx.querySelector(".sbox2 .big-act") || cx.querySelector('[data-act="v13-span"], [data-act="v13-rap-show"]') || cx.querySelector(".big-act2");
  const redo = prim && !prim.dataset.keep && /Recommencer|Refaire|Relancer|refilmer/i.test(prim.textContent);
  nav.classList.remove("flow"); nav.classList.add("v14-bar");
  const next = nav.querySelector('[data-act="cnext"]'), prev = nav.querySelector('[data-act="cprev"]');
  if (prim && !done && !redo && !Coh.on) {
    if (x.cd.k !== "studio" && x.cd.k !== "rappel" && !prim.dataset.keep) {
      const sp = prim.querySelector("span:last-child"), tgt = sp && prim.querySelector("svg") ? sp : prim;
      const t = tgt.textContent.replace(/^[▶\s]+/, "").trim();
      tgt.textContent = /je me filme/i.test(t) ? "Démarrer" : /ce que je retiens|Regarder/i.test(t) ? t : "Démarrer";
    }
    prim.className = "btn v14-cta" + (prim.dataset.act === "studio-open" || prim.dataset.act === "vrec" ? " film" : "");
    nav.innerHTML = ""; const sk = document.createElement("button"); sk.className = "btn ghost v14-skip"; sk.dataset.act = "cnext"; sk.textContent = "Passer"; sk.setAttribute("aria-label", "Passer cette étape");
    nav.appendChild(sk); nav.appendChild(prim);
  } else {
    if (next) { next.className = "btn v14-cta"; next.innerHTML = x.cd.k === "debrief" ? "Voir mon bilan" : x.i >= x.cs.length - 1 ? "Terminer" : "Continuer"; }
    if (prev) prev.classList.add("v14-skip");
  }
}
const _render14 = render;
render = function () { const r = _render14.apply(this, arguments); try { tidy(); } catch (e) { console.warn(e); } return r; };

// =====================================================================
// 6. LE RYTHME : plus de compte à rebours, enchaînement court et félicitations
// =====================================================================
// Exercices enregistrés : on passe directement à l'enregistrement
const _enter14 = Run.enter.bind(Run);
Run.enter = function () { const s = this.segs[this.i]; if (s && s.kind === "count") { beep(1, 1046); this.i++; return this.enter(); } return _enter14(); };
const _tick14 = Run.tick.bind(Run);
Run.tick = function () {
  if (!this.on) return; const s = this.segs[this.i];
  if (s && s.kind === "pause") { const el = (Date.now() - this.t0) / 1000, left = Math.max(0, Math.ceil(2 - el)); const t = $("#v13-pause-s"); if (t) t.textContent = left; if (!this.hold && el >= 2) this.next(); return; }
  return _tick14();
};
const _draw14 = Run.draw.bind(Run);
Run.draw = function () { _draw14(); const t = $("#v13-pause-s"); if (t && t.textContent === "3") t.textContent = "2"; };
// Prise filmée : l'enregistrement démarre dès l'ouverture, la consigne reste affichée en petit
const RS = V9.RecStage;
RS.countdown = function () { if (!this.on || this.phase === "rec") return; try { speechSynthesis.cancel(); } catch (e) { } this.begin(); };
// Pendant l'enregistrement : le sujet et les 4 étapes, sous l'image
const _rsBegin14 = RS.begin.bind(RS);
RS.begin = function () {
  _rsBegin14();
  const c = S.cur, inn = $("#v9-stage .rs-in"); if (!inPack(c) || !inn || inn.querySelector(".v14-rs")) return;
  const P = c.info.pack, subj = this.id === "question" ? questionOf(c) : this.id === "nego" && P.nego ? P.nego.objectif : P.fil;
  const d = document.createElement("div"); d.className = "v14-rs";
  d.innerHTML = (subj ? '<p><b>Sujet</b> ' + esc(subj) + '</p>' : "") + '<div class="v14-steps mini">' + [["1", "Accroche"], ["2", "Annonce"], ["3", "3 points"], ["4", "Chute"]].map(x => '<span><b>' + x[0] + '</b>' + x[1] + '</span>').join("") + '</div>';
  const ref = inn.querySelector("#rs-checks"); inn.insertBefore(d, ref || null);
};
// L'enchaînement : un panneau de réussite en bas, la suite en 2,5 secondes
const F = V9.Flow, _after14 = F.after.bind(F), _go14 = F.go.bind(F);
F.after = function () { if (YTM.on) return; chime(); return _after14(2500); };
F.go = function () { if (YTM.on) return; return _go14(); };
F.paint = function () {
  if (!this.el) return; const s = Math.max(0, Math.ceil((this.until - Date.now()) / 1000));
  this.el.className = "v14-sheet";
  this.el.innerHTML = '<div class="v14-sheet-in"><div class="v14-ok"><span>✓</span><div><b>Bien joué !</b><small>Suite : ' + esc(this.next) + '</small></div></div><div class="v14-sheet-btns"><button class="btn v14-cta ok" data-act="v13-flow-go">Continuer' + (s ? " · " + s : "") + '</button><button class="link small" data-act="v13-flow-stay">Rester ici</button></div></div>';
};

// =====================================================================
// 7. ACTIONS
// =====================================================================
window.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act, stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
  switch (a) {
    case "v14-yt": stop(); if (S.cur) YTM.start(b.dataset.k); break;
    case "v14-m-done": stop(); YTM.finish(true); break;
    case "v14-m-stop": stop(); YTM.close(); render(); break;
    case "v14-say": { stop(); hush(); const x = cur(); if (x) talk(sayOf(x.cd, x.c)); break; }
    case "go": case "quit": if (YTM.on) YTM.close(); break;
  }
}, true);
// Une séance qui commence : on prépare le lecteur vidéo
const _ss14 = startSession;
startSession = async function () { const r = await _ss14.apply(this, arguments); warm(); return r; };

// =====================================================================
// 8. LA VOIX NATURELLE : conseil adapté à l'appareil
// =====================================================================
const NAT = /natural|neural|online|premium|enhanced|wavenet|studio|naturelle/i;
function voiceTip() {
  const ua = navigator.userAgent || "", v = TTS.voice, nat = v && NAT.test(v.name);
  if (/Windows/i.test(ua) && !/Edg\//.test(ua)) return "Pour une voix vraiment naturelle sur ordinateur, ouvrez et installez l’application avec Microsoft Edge : ses voix « Vivienne » et « Denise » sont les plus humaines.";
  if (/Windows/i.test(ua) && !nat) return "Dans Edge, choisissez une voix « Online (Natural) » : Vivienne, Denise ou Henri.";
  if (/Android/i.test(ua)) return "Sur le S24 : Paramètres › Gestion globale › Langue › Synthèse vocale › moteur Google, puis installez la voix Français (France) en haute qualité.";
  return "";
}
V9.voiceTip = voiceTip;
const _home14 = viewHome;
viewHome = function () {
  let h = _home14();
  const tip = voiceTip();
  if (tip && S.v12 && S.v12.voiceOpen) h = h.replace(/<p class="small muted">Sur le S24[^<]*<\/p>/, '<p class="small v14-vtip">' + esc(tip) + '</p>');
  return h;
};
render();
})();
