// ===== Le Verbe Souverain · v11 =====
// Se voir en parlant : miroir permanent (colonne latérale sur ordinateur, aperçu sur les cartes de prise
// sur téléphone). Test réel du micro : niveau sonore, phrase d'essai transcrite, choix de la caméra et du micro.
// Accueil recentré sur la séance du jour.
(function () {
"use strict";
const V9 = window.V9;
const camOK = () => V9.camAllowedHere();
const WIDE = () => window.matchMedia("(min-width: 1024px)").matches;
const pref = { get: k => { try { return localStorage.getItem("vs1:" + k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem("vs1:" + k, v || ""); } catch (e) { } } };

// =====================================================================
// 1. STUDIO : périphériques choisis, niveau du micro
// =====================================================================
Studio.devices = async function () {
  try { const L = await navigator.mediaDevices.enumerateDevices(); return { cams: L.filter(d => d.kind === "videoinput"), mics: L.filter(d => d.kind === "audioinput") }; } catch (e) { return { cams: [], mics: [] }; }
};
Studio.constraints = function () {
  const cam = pref.get("cam"), mic = pref.get("mic");
  return {
    audio: Object.assign({ echoCancellation: true, noiseSuppression: true, autoGainControl: true }, mic ? { deviceId: { exact: mic } } : {}),
    video: Object.assign({ width: { ideal: 1280 }, height: { ideal: 720 } }, cam ? { deviceId: { exact: cam } } : { facingMode: "user" })
  };
};
Studio.vu = { ctx: null, an: null, buf: null, src: null };
Studio.listen = function () {
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC || !this.stream || !this.stream.getAudioTracks().length) return;
    const V = this.vu; if (!V.ctx) { V.ctx = new AC(); V.an = V.ctx.createAnalyser(); V.an.fftSize = 1024; V.buf = new Float32Array(V.an.fftSize); }
    if (V.src) { try { V.src.disconnect(); } catch (e) { } }
    V.src = V.ctx.createMediaStreamSource(new MediaStream(this.stream.getAudioTracks())); V.src.connect(V.an);
    if (V.ctx.state === "suspended") V.ctx.resume().catch(() => { });
  } catch (e) { }
};
Studio.level = function () {
  const V = this.vu; if (!V.an || !this.ok()) return 0;
  V.an.getFloatTimeDomainData(V.buf); let s = 0; for (let i = 0; i < V.buf.length; i++) s += V.buf[i] * V.buf[i];
  const rms = Math.sqrt(s / V.buf.length); return clamp(Math.log10(1 + rms * 30) / 1.5, 0, 1);
};
const _open11 = Studio.open.bind(Studio);
Studio.open = async function () {
  if (this.ok()) return true;
  if (!camOK()) return _open11();
  this.state = "ask"; render();
  try {
    const c = this.constraints();
    const s = await navigator.mediaDevices.getUserMedia(c).catch(async e => {
      if (e && e.name === "NotAllowedError") throw e;
      // périphérique mémorisé absent : on reprend ceux par défaut
      pref.set("cam", ""); pref.set("mic", "");
      return navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: "user" } }).catch(() => navigator.mediaDevices.getUserMedia({ audio: true, video: false }));
    });
    this.stream = s; this.inPage = true; this.w = null; this.state = "on"; this.err = "";
    clearInterval(this.watch); this.watch = setInterval(() => { if (this.state === "on" && !this.ok()) { this.state = "off"; this.stream = null; this.rec = null; V9.Pip.hide(); render(); } }, 1500);
    this.listen();
    if (ASR_PREF() === "1" && ASR.state === "idle") setTimeout(() => ASR.load().catch(() => { }), 1500);
    setTimeout(() => V9.Body.load().catch(() => { }), 600);
    V9.Pip.show(); render(); return true;
  } catch (e) {
    this.state = "err"; this.err = e && e.name === "NotAllowedError" ? "Accès refusé. Cliquez sur l’icône de caméra dans la barre d’adresse, choisissez « Autoriser », puis réessayez." : "Caméra ou micro introuvable : vérifiez qu’ils sont branchés et libres, puis réessayez.";
    render(); return false;
  }
};
Studio.restart = async function () { try { this.stream && this.stream.getTracks().forEach(t => t.stop()); } catch (e) { } this.stream = null; this.state = "off"; return this.open(); };

// =====================================================================
// 2. LE MIROIR
// =====================================================================
const mirror = (cls, label) => '<div class="v11-mir ' + (cls || "") + '"><video muted playsinline autoplay></video><div class="v11-vu"><i></i></div>' + (label ? '<span class="v11-mirl">' + esc(label) + '</span>' : "") + '</div>';
function bindMirrors() {
  const on = Studio.ok() && Studio.inPage && Studio.stream.getVideoTracks().length > 0;
  $$(".v11-mir").forEach(m => {
    const v = m.querySelector("video");
    if (!on) { m.classList.add("off"); if (v) v.srcObject = null; return; }
    m.classList.remove("off");
    if (v && v.srcObject !== Studio.stream) { v.srcObject = Studio.stream; v.play().catch(() => { }); }
  });
  V9.Pip.paint();
}
// Animation du niveau sonore
(function vuLoop() {
  const lv = Studio.level ? Studio.level() : 0;
  $$(".v11-vu i").forEach(i => { i.style.width = Math.round(lv * 100) + "%"; i.className = lv > 0.75 ? "hot" : lv > 0.12 ? "ok" : ""; });
  if (S.v11 && S.v11.micPeak !== undefined) S.v11.micPeak = Math.max(S.v11.micPeak, lv);
  requestAnimationFrame(vuLoop);
})();
// La vignette se cache quand un miroir est visible à l'écran
const _pipPaint = V9.Pip.paint.bind(V9.Pip);
V9.Pip.paint = function () {
  _pipPaint();
  if (!this.el || this.el.hidden) return;
  const vis = $$(".v11-mir:not(.off)").some(m => { const r = m.getBoundingClientRect(); return r.height > 40 && r.bottom > 0 && r.top < innerHeight; });
  if (vis || WIDE()) this.el.hidden = true;
};
V9.Pip.min = false;
window.addEventListener("scroll", () => V9.Pip.paint(), { passive: true });

// =====================================================================
// 3. LA PRÉPARATION DU STUDIO : son, caméra, micro, périphériques
// =====================================================================
S.v11 = S.v11 || { devs: null, micPeak: undefined, micHeard: "", micBusy: false };
const T = () => (S.profile.tech = S.profile.tech || {});
const techDone = () => { const t = T(); return !!(t.voice && t.cam && t.mic); };
async function loadDevs() { S.v11.devs = await Studio.devices(); render(); }
function prepCard(open) {
  const t = T(), ok = Studio.ok(), d = S.v11.devs;
  let h = '<section class="card v11-prep"><div class="row-between"><div><div class="eyebrow">' + (techDone() ? "Studio vérifié" : "Votre studio, une minute") + '</div><h3>' + (ok ? "Vous vous voyez : c’est bon signe" : "Son, caméra, micro") + '</h3></div>' + (techDone() && !open ? '<button class="btn ghost sm" data-act="v11-prep-open">Régler</button>' : "") + '</div>';
  if (techDone() && !open) return h + '</section>';
  // Son
  h += '<div class="v11-row"><span>' + (t.voice ? "✓ " : "1. ") + 'Le son</span>' + (t.voice ? '<em>entendu</em>' : S.techAsk ? '<div class="row-wrap"><button class="btn sm" data-act="tech-voice" data-v="1">J’entends</button><button class="btn ghost sm" data-act="tech-voice" data-v="0">Rien</button></div>' : '<button class="btn sm" data-act="tech-play">Écouter un extrait</button>') + '</div>';
  // Caméra
  h += '<div class="v11-row"><span>' + (t.cam ? "✓ " : "2. ") + 'La caméra</span>' + (ok ? '<em>allumée</em>' : '<button class="btn sm" data-act="v11-cam">Allumer</button>') + '</div>';
  if (ok) h += mirror("prep", "Placez-vous : visage au centre, épaules visibles, lumière devant vous");
  else if (Studio.state === "err") h += '<p class="small warn-line">' + esc(Studio.err) + '</p>';
  // Micro
  h += '<div class="v11-row"><span>' + (t.mic ? "✓ " : "3. ") + 'Le micro</span>' + (ok ? (S.v11.micBusy ? '<em>j’écoute…</em>' : '<button class="btn sm" data-act="v11-mic" id="v11-mictest">' + (t.mic ? "Revérifier" : "Vérifier") + '</button>') : '<em>après la caméra</em>') + '</div>';
  if (ok && !t.mic && !S.v11.micBusy) h += '<p class="small muted">Parlez : la barre sous l’image doit bouger. Puis touchez « Vérifier » et dites : « Le verbe est souverain ».</p>';
  if (S.v11.micHeard) h += '<p class="small"><b>J’ai entendu :</b> « ' + esc(S.v11.micHeard) + ' »</p>';
  // Périphériques
  if (ok && d && (d.cams.length > 1 || d.mics.length > 1)) {
    h += '<div class="v11-devs">' + (d.cams.length > 1 ? '<label>Caméra<select data-dev="cam">' + d.cams.map((c, i) => '<option value="' + esc(c.deviceId) + '"' + (pref.get("cam") === c.deviceId ? " selected" : "") + '>' + esc(c.label || "Caméra " + (i + 1)) + '</option>').join("") + '</select></label>' : "") +
      (d.mics.length > 1 ? '<label>Micro<select data-dev="mic">' + d.mics.map((c, i) => '<option value="' + esc(c.deviceId) + '"' + (pref.get("mic") === c.deviceId ? " selected" : "") + '>' + esc(c.label || "Micro " + (i + 1)) + '</option>').join("") + '</select></label>' : "") + '</div>';
  }
  if (ok && !d) loadDevs();
  if (ok) h += '<div class="row-wrap v11-prep-acts">' + (techDone() ? '<button class="btn sm" data-act="v11-prep-close">Fermer</button>' : "") + '<button class="link small" data-act="v9-cam-off">Couper la caméra</button></div>';
  return h + '</section>';
}
async function micTest() {
  if (!Studio.ok() || S.v11.micBusy) return;
  S.v11.micBusy = true; S.v11.micPeak = 0; S.v11.micHeard = ""; render();
  if (!Studio.start("audio")) { S.v11.micBusy = false; toast("L’enregistrement n’a pas démarré."); render(); return; }
  beep(1, 880); await sleep(4000); const file = await Studio.stop();
  const peak = S.v11.micPeak; S.v11.micPeak = undefined;
  let heard = "";
  if (file && peak > 0.08) { try { const H = await hear(file); heard = H.text || ""; } catch (e) { } }
  S.v11.micBusy = false;
  if (peak <= 0.08) { toast("Je n’ai rien entendu : vérifiez le micro choisi, ou parlez plus près."); S.v11.micHeard = ""; }
  else { T().mic = true; S.v11.micHeard = heard || "(du son, mais la transcription n’est pas encore prête : c’est normal au premier essai)"; saveProfile(); toast("Micro vérifié."); }
  render();
}
window.addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
  switch (b.dataset.act) {
    case "v11-cam": stop(); { const ok = await Studio.open(); if (ok) { T().cam = true; saveProfile(); loadDevs(); } render(); } break;
    case "v11-mic": stop(); await micTest(); break;
    case "v11-prep-open": stop(); S.v11.open = true; render(); break;
    case "v11-prep-close": stop(); S.v11.open = false; render(); break;
    case "tech-voice": setTimeout(render, 0); break;
  }
}, true);
document.addEventListener("change", async e => {
  const el = e.target; if (!el.dataset || !el.dataset.dev) return;
  pref.set(el.dataset.dev, el.value); T().mic = false; await Studio.restart(); render(); toast(el.dataset.dev === "cam" ? "Caméra changée." : "Micro changé : revérifiez-le.");
});

// =====================================================================
// 4. L'ACCUEIL : la séance du jour d'abord
// =====================================================================
viewHome = function () {
  V9.syncWeek && V9.syncWeek();
  const p = S.profile, X = v7(), n = nextSession(), info = sessionInfo(n), P = info.pack, si = streakInfo();
  const cur = Store.readLocal(sessKey(n)), enCours = cur && cur.status === "en-cours" && cur.card > 0;
  const f = p.v10, fl = f && f.focus && V9.CRIT[f.focus] ? V9.CRIT[f.focus].t + " (" + comma(f.avg) + "/5)" : "";
  let h = '<header class="top"><div class="brand">Le Verbe <em>Souverain</em></div><div class="date">' + esc(new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })) + '</div></header>';
  if (IS_WV) h += wvBanner(false);
  if (P) {
    h += '<section class="card v11-hero"><div class="eyebrow">Semaine ' + WEEK.n + ' · ' + esc(WEEK.t) + '</div>' +
      '<h1>' + esc(P.t) + '</h1><p class="v11-tech"><b>' + esc(P.tech.t) + '.</b> ' + esc(P.tech.line) + '</p>' +
      '<ol class="v11-days">' + WEEK.sessions.map(s => { const sn = weekBase() + s.d, done = p.done.includes(sn), nx = sn === n; return '<li><button class="' + (done ? "done" : nx ? "next" : "") + '" data-act="start" data-n="' + sn + '" title="' + esc(s.t) + '" aria-label="' + esc("Séance " + s.d + " : " + s.t) + '">' + (done ? "✓" : s.d) + '</button></li>'; }).join("") + '</ol>' +
      '<button class="btn wide big-start" data-act="start" data-n="' + n + '">' + ICON.play + '<span>' + (enCours ? "Reprendre la séance" : "Séance du jour") + ' · 30 min</span></button>' +
      '<button class="link center-link" data-act="express" data-n="' + n + '">Journée chargée ? Séance express de 10 minutes</button>' +
      (fl ? '<p class="v11-focus"><span>Priorité de la semaine</span><b>' + esc(fl) + '</b></p>' : X.rx && DRILLS7[X.rx.drill] ? '<p class="v11-focus"><span>Prescrit aujourd’hui</span><b>' + esc(DRILLS7[X.rx.drill].t) + '</b></p>' : "") + '</section>';
  } else h += '<section class="card"><p><b>Les douze semaines sont terminées.</b> Reprenez la semaine de votre choix dans le Parcours.</p></section>';
  h += prepCard(S.v11.open);
  if (!p.diag) h += '<section class="card diag-cta"><div class="row-between"><div><div class="eyebrow">Avant de commencer</div><h3>Votre point de départ, en dix touches</h3></div><button class="btn sm" data-act="go" data-r="diag">Commencer</button></div></section>';
  const L = S.v9.list, last = L && L[0];
  h += '<section class="v11-stats"><div class="card tile"><span class="eyebrow">Série</span><b>' + si.n + '</b><small>' + (si.broken ? "à relancer" : "jours") + '</small></div>' +
    '<button class="card tile" data-act="go" data-r="prog"><span class="eyebrow">Séances</span><b>' + p.done.length + '</b><small>sur 60</small></button>' +
    (last && last.grid && last.grid.glob ? '<button class="card tile" data-act="v9-open" data-id="' + last.id + '"><span class="eyebrow">Dernière prise</span><b>' + comma(last.grid.glob) + '</b><small>sur 5</small></button>' : '<button class="card tile" data-act="go" data-r="lib" data-tab="grenier"><span class="eyebrow">Grenier</span><b>' + srsDue(99).length + '</b><small>à revoir</small></button>') + '</section>';
  if (L === null && !S.v9.loadingList) { S.v9.loadingList = true; V9.Takes.list().then(l => { S.v9.list = l; S.v9.loadingList = false; if (S.route === "home") render(); }).catch(() => { S.v9.list = []; S.v9.loadingList = false; }); }
  h += '<details class="card v11-rdv"><summary><span class="eyebrow">Votre rendez-vous quotidien</span><b>' + (X.rdv ? X.rdv.replace(":", " h ") : "à fixer") + '</b></summary><div class="rdv">' + ["06:30", "07:00", "12:30", "18:00", "20:30", "21:30"].map(t => '<button class="chip' + (X.rdv === t ? " on" : "") + '" data-act="rdv" data-v="' + t + '">' + t.replace(":", " h ") + '</button>').join("") + '</div>' +
    '<a class="btn ghost sm" href="' + calLink(X.rdv) + '" target="_blank" rel="noopener">Ajouter à Google Agenda</a><p class="small muted">Même heure, même lieu : la décision est déjà prise.</p></details>';
  if (V9.installEvt) h += '<section class="card"><div class="row-between"><div><div class="eyebrow">Sur cet appareil</div><h3>Installer l’application</h3></div><button class="btn sm" data-act="v9-install">Installer</button></div></section>';
  return h;
};

// =====================================================================
// 5. LE MIROIR EN SÉANCE : colonne sur ordinateur, aperçu sur téléphone
// =====================================================================
const _sbox11 = speechBox;
speechBox = function (id, o) {
  let h = _sbox11(id, o);
  if (!WIDE() && Studio.ok() && Studio.inPage) h = h.replace('<div class="budget-l">', mirror("inline", "Vous, en direct") + '<div class="budget-l">');
  return h;
};
function railHTML() {
  if (!WIDE()) return "";
  const c = S.cur, on = Studio.ok() && Studio.inPage;
  let h = "";
  if (on) h += mirror("rail", S.route === "seance" ? "Vous, en direct" : "Votre studio");
  else if (camOK()) h += '<button class="v11-rail-cam" data-act="v11-cam">' + CAM + '<span>Allumer la caméra pour vous voir</span></button>';
  if (c && S.route === "seance" && c.info && c.info.pack && c.info.pack.track && !c.bilan) {
    const cards = buildCards(c), i = clamp(c.card || 0, 0, cards.length - 1);
    h += '<div class="v11-steps"><div class="eyebrow">' + esc(c.info.pack.t) + '</div><ol>' + cards.map((x, k) => '<li class="' + (k < i ? "done" : k === i ? "now" : "") + '"><span>' + esc(x.t) + '</span><em>' + Math.max(1, Math.round(x.sec / 60)) + ' min</em></li>').join("") + '</ol></div>';
  } else if (S.route === "home") {
    h += '<div class="v11-steps"><div class="eyebrow">La méthode</div><p class="small">Chaque jour, trente minutes : le corps et la voix, la mémoire et les mots, une prise filmée, une question piège, le bilan. Les mesures guident la séance suivante.</p></div>';
  }
  return h;
}
let rail = null;
function paintRail() {
  if (!rail) { rail = document.createElement("aside"); rail.id = "v11-rail"; const app = $("#app"); if (app) app.appendChild(rail); }
  const h = railHTML(); rail.hidden = !h; if (rail.innerHTML !== h) rail.innerHTML = h;
  bindMirrors();
}
const _render11 = render;
render = function () { _render11(); paintRail(); };
window.addEventListener("resize", () => { paintRail(); });
setInterval(() => { if (Studio.ok() && $$(".v11-mir video").some(v => !v.srcObject)) bindMirrors(); }, 1500);
render();
})();
