// ===== Le Verbe Souverain · v9 =====
// Studio dans la page (un seul bouton), analyse du corps sur l'appareil (MediaPipe),
// grille d'évaluation en six critères, vidéothèque annotée, comparaison avant/après,
// export vidéo et fiche PDF, coaching local quand l'IA de Claude n'est pas disponible,
// application installable et utilisable hors ligne.
(function () {
"use strict";
const V9 = window.V9 = { v: "9.0" };
const BASE = new URL(".", location.href).href;
const IN_FRAME = (() => { try { return window.top !== window.self; } catch (e) { return true; } })();
const isFile = location.protocol === "file:";
S.v9 = S.v9 || { take: null, cmp: [], cmpMode: false, list: null, usage: null };
const pctx = n => Math.round(n * 100) + " %";
const r1 = v => Math.round(v * 10) / 10;
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const sd = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) * (v - m)))); };
const med = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const dateFR = t => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const hourFR = t => new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// ---------- Bibliothèque de transcription embarquée (fonctionne hors ligne) ----------
ASR.LIB = new URL("lib/transformers.min.js", location.href).href;
const _asrTr = ASR.transcribe.bind(ASR);
ASR.transcribeTS = async function (pcm16k, onStage) {
  const p = await this.load(); onStage && onStage("Transcription de votre parole…");
  try {
    const out = await p(pcm16k, { language: "french", task: "transcribe", chunk_length_s: 30, stride_length_s: 5, return_timestamps: true });
    const chunks = (out && out.chunks || []).map(c => ({ a: Number(c.timestamp && c.timestamp[0]) || 0, b: Number(c.timestamp && c.timestamp[1]) || 0, t: String(c.text || "").trim() })).filter(c => c.t);
    return { text: String((out && out.text) || "").replace(/\s+/g, " ").trim(), chunks };
  } catch (e) { return { text: await _asrTr(pcm16k, onStage), chunks: [] }; }
};

// =====================================================================
// 1. LE STUDIO DANS LA PAGE
// =====================================================================
const camAllowedHere = () => {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return false;
  try { const fp = document.permissionsPolicy || document.featurePolicy; if (fp && fp.allowsFeature && (!fp.allowsFeature("camera") || !fp.allowsFeature("microphone"))) return false; } catch (e) { }
  return true;
};
V9.camAllowedHere = camAllowedHere; V9.IN_FRAME = IN_FRAME; V9.Pip = null;
const _popupOpen = Studio.open.bind(Studio), _popupPaint = Studio.paint.bind(Studio);
Studio.inPage = false;
Studio.ok = function () {
  try {
    if (this.state !== "on" || !this.stream) return false;
    if (!this.stream.getTracks().some(t => t.readyState === "live")) return false;
    return this.inPage || !!(this.w && !this.w.closed);
  } catch (e) { return false; }
};
Studio.open = async function () {
  if (this.ok()) return true;
  if (camAllowedHere()) {
    this.state = "ask"; render();
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } })
        .catch(e => { if (e && e.name === "NotAllowedError") throw e; return navigator.mediaDevices.getUserMedia({ audio: true, video: false }); });
      this.stream = s; this.inPage = true; this.w = null; this.state = "on"; this.err = "";
      clearInterval(this.watch); this.watch = setInterval(() => { if (this.state === "on" && !this.ok()) { this.state = "off"; this.stream = null; this.rec = null; Pip.hide(); render(); } }, 1500);
      if (ASR_PREF() === "1" && ASR.state === "idle") setTimeout(() => ASR.load().catch(() => { }), 1500);
      setTimeout(() => Body.load().catch(() => { }), 600);
      Pip.show(); toast(s.getVideoTracks().length ? "Caméra et micro prêts." : "Micro prêt (aucune caméra trouvée).");
      render(); return true;
    } catch (e) {
      // Dans l'aperçu de Claude, la page n'a pas le droit d'ouvrir la caméra : on passe par la petite fenêtre.
      if (!IN_FRAME) { this.state = "err"; this.err = e && e.name === "NotAllowedError" ? "Accès refusé. Cliquez sur l’icône de caméra dans la barre d’adresse, choisissez « Autoriser », puis réessayez." : "Caméra ou micro introuvable : vérifiez qu’ils sont branchés et libres."; render(); return false; }
    }
  }
  this.inPage = false;
  const ok = await _popupOpen();
  if (ok) setTimeout(() => Body.load().catch(() => { }), 600);
  return ok;
};
Studio.paint = function () { if (this.inPage) Pip.paint(); else _popupPaint(); };
Studio.start = function (kind) {
  if (!this.ok()) return false; if (this.rec) return true;
  const W = this.inPage ? window : this.w, hasV = this.stream.getVideoTracks().length > 0, video = kind === "video" && hasV;
  const st = video ? this.stream : new W.MediaStream(this.stream.getAudioTracks());
  const types = video ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4;codecs=avc1,mp4a", "video/mp4"] : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  const mt = types.find(t => { try { return W.MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || "";
  try { this.rec = new W.MediaRecorder(st, mt ? { mimeType: mt, videoBitsPerSecond: 1500000, audioBitsPerSecond: 96000 } : {}); } catch (e) { this.rec = null; return false; }
  this.chunks = []; this.kind = video ? "video" : "audio";
  this.rec.ondataavailable = e => { if (e.data && e.data.size) this.chunks.push(e.data); };
  this.rec.start(500); this.t0 = Date.now();
  clearInterval(this.ptm); this.ptm = setInterval(() => this.paint(), 500); this.paint();
  return true;
};
Studio.shut = function () {
  try { this.stream && this.stream.getTracks().forEach(t => t.stop()); } catch (e) { }
  try { if (this.w && !this.w.closed) this.w.close(); } catch (e) { }
  this.stream = null; this.state = "off"; this.inPage = false; this.rec = null; Pip.hide(); render();
};

// Petite vignette de la caméra, en bas à droite
const Pip = {
  el: null, min: false,
  show() {
    if (!Studio.inPage || !Studio.stream || !Studio.stream.getVideoTracks().length) return;
    if (!this.el) {
      const d = document.createElement("div"); d.id = "v9-pip"; d.setAttribute("aria-label", "Aperçu de la caméra");
      d.innerHTML = '<video muted playsinline autoplay></video><span class="pip-st"></span><button class="pip-x" data-act="v9-pip-min" aria-label="Réduire ou agrandir l’aperçu">–</button><button class="pip-off" data-act="v9-cam-off" aria-label="Couper la caméra et le micro">⏻</button>';
      document.body.appendChild(d); this.el = d;
    }
    const v = this.el.querySelector("video"); if (v.srcObject !== Studio.stream) v.srcObject = Studio.stream;
    this.el.hidden = false; this.paint();
  },
  hide() { if (this.el) { this.el.hidden = true; const v = this.el.querySelector("video"); if (v) v.srcObject = null; } },
  paint() {
    if (!this.el) return; const st = this.el.querySelector(".pip-st");
    this.el.classList.toggle("min", this.min); this.el.classList.toggle("rec", !!Studio.rec);
    this.el.hidden = !!RecStage.on || !Studio.ok() || S.route !== "seance";
    if (st) st.textContent = Studio.rec ? "● " + fmtSec(Studio.secs()) : "Caméra";
  }
};

V9.Pip = Pip;
// ---------- La scène d'enregistrement : un bouton, compte à rebours, cadrage guidé ----------
const RecStage = {
  on: false, id: null, budget: 0, phase: "", t0: 0, tm: null, el: null, samples: [], thumbs: [], checks: {},
  async open(id, budget, title) {
    if (this.on) return;
    if (!Studio.ok()) { const ok = await Studio.open(); if (!ok) { if (IS_MOBILE) { const inp = document.querySelector('input[data-media="' + id + '"]'); if (inp) inp.click(); } return; } }
    Music.stop(); Voice.stop();
    Object.assign(this, { on: true, id, budget: budget || 120, title: title || "", phase: "check", t0: Date.now(), samples: [], thumbs: [], checks: {}, beeped: false });
    const hasV = Studio.stream.getVideoTracks().length > 0;
    let el = $("#v9-stage"); if (!el) { el = document.createElement("div"); el.id = "v9-stage"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Enregistrement"); document.body.appendChild(el); }
    el.innerHTML = '<div class="rs-in">' +
      '<div class="rs-top"><b>' + esc(this.title || "Ma prise") + '</b><span>Temps visé ' + fmtSec(this.budget) + '</span></div>' +
      '<div class="rs-cam">' + (hasV ? '<video id="rs-v" muted playsinline autoplay></video><svg class="rs-guide land" viewBox="0 0 160 90" aria-hidden="true"><ellipse cx="80" cy="33" rx="13" ry="17"/><path d="M44 90 C 48 66, 62 58, 80 58 C 98 58, 112 66, 116 90"/></svg><svg class="rs-guide port" viewBox="0 0 90 120" aria-hidden="true"><ellipse cx="45" cy="40" rx="15" ry="20"/><path d="M6 120 C 10 84, 26 72, 45 72 C 64 72, 80 84, 84 120"/></svg>' : '<div class="rs-audio">Micro seul : la voix sera évaluée, pas le corps.</div>') +
      '<div class="rs-count" id="rs-count" hidden></div><div class="rs-rec" id="rs-rec" hidden>● REC <b id="rs-t">0:00</b></div><div class="rs-gaze" id="rs-gaze" hidden></div></div>' +
      '<ul class="rs-checks" id="rs-checks"></ul>' +
      '<div class="rs-bar"><i id="rs-bar"></i></div>' +
      '<div class="rs-btns" id="rs-btns"></div></div>';
    el.hidden = false; this.el = el; Pip.paint();
    const v = $("#rs-v"); if (v) { try { v.srcObject = Studio.stream; await v.play().catch(() => { }); } catch (e) { } }
    this.drawBtns(); Body.load().catch(() => { });
    clearInterval(this.tm); this.tm = setInterval(() => this.tick(), 200);
    this.loop();
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(w => { this.wake = w; }).catch(() => { }); } catch (e) { }
    // Un seul bouton : le compte à rebours part de lui-même
    setTimeout(() => { if (this.on && this.phase === "check") this.countdown(); }, 1800);
  },
  drawBtns() {
    const b = $("#rs-btns"); if (!b) return;
    if (this.phase === "rec") b.innerHTML = '<button class="btn wide big-act recording" data-act="v9-rec-stop">■ Terminer</button>';
    else if (this.phase === "count") b.innerHTML = '<button class="btn ghost wide" data-act="v9-rec-cancel">Annuler</button>';
    else b.innerHTML = '<button class="btn wide big-act" data-act="v9-rec-go">● Commencer maintenant</button><button class="btn ghost wide" data-act="v9-rec-cancel">Annuler</button>';
  },
  countdown() {
    if (!this.on || this.phase === "rec" || this.phase === "count") return;
    this.phase = "count"; this.drawBtns(); const c = $("#rs-count"); let n = 3;
    const step = () => {
      if (!this.on || this.phase !== "count") return;
      if (n === 0) { if (c) c.hidden = true; this.begin(); return; }
      if (c) { c.hidden = false; c.textContent = n; c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); }
      beep(1, n === 1 ? 880 : 660); n--; setTimeout(step, 1000);
    };
    step();
  },
  begin() {
    if (!Studio.start("video")) { toast("L’enregistrement n’a pas démarré. Réessayez."); this.close(); return; }
    S.recSlot = "v:" + this.id; S.recMax = 0; this.phase = "rec"; this.t0 = Date.now(); this.samples = []; this.thumbs = [];
    const rr = $("#rs-rec"); if (rr) rr.hidden = false; this.drawBtns(); beep(1, 1046);
  },
  tick() {
    if (!this.on) return;
    if (this.phase === "rec") {
      const s = Studio.secs(), t = $("#rs-t"), bar = $("#rs-bar");
      if (t) t.textContent = fmtSec(s) + " / " + fmtSec(this.budget);
      if (bar) { bar.style.width = Math.min(100, s / this.budget * 100) + "%"; bar.className = s > this.budget ? "over" : s > this.budget * 0.85 ? "near" : ""; }
      if (s >= this.budget && !this.beeped) { this.beeped = true; beep(2, 784); }
      if (s >= this.budget + 20) this.stop();
    }
    this.drawChecks();
  },
  drawChecks() {
    const ul = $("#rs-checks"); if (!ul) return; const k = this.checks;
    if (!Studio.stream || !Studio.stream.getVideoTracks().length) { ul.innerHTML = ""; return; }
    if (Body.state !== "ready") { ul.innerHTML = '<li class="wait">' + (Body.state === "error" ? "Analyse du corps indisponible sur cet appareil : la voix sera évaluée." : "Préparation de l’analyse du corps…") + '</li>'; return; }
    const it = (ok, good, bad) => '<li class="' + (ok ? "ok" : "ko") + '">' + (ok ? "✓ " : "• ") + esc(ok ? good : bad) + '</li>';
    ul.innerHTML = it(k.face, "Visage détecté", "Placez votre visage dans l’ovale") +
      (k.face ? it(k.center, "Bien centré", k.cx < 0.5 ? "Décalez-vous vers la droite de l’image" : "Décalez-vous vers la gauche de l’image") : "") +
      (k.face ? it(k.dist, "Bonne distance", k.fw > 0.34 ? "Reculez : on doit voir vos épaules et vos mains" : "Rapprochez-vous un peu") : "") +
      it(k.light, "Lumière suffisante", "Trop sombre : tournez-vous vers une fenêtre ou une lampe");
    const g = $("#rs-gaze"); if (g) { g.hidden = this.phase !== "rec" || !k.face; g.className = "rs-gaze " + (k.gaze ? "on" : "off"); g.textContent = k.gaze ? "Regard caméra" : "Revenez à l’objectif"; }
  },
  async loop() {
    const v = $("#rs-v"); if (!v) return;
    const cv = document.createElement("canvas"); cv.width = 32; cv.height = 18; const cx = cv.getContext("2d", { willReadFrequently: true });
    let last = 0, lastThumb = -9;
    const frame = async () => {
      if (!this.on) return;
      const now = performance.now();
      if (now - last >= 140 && v.readyState >= 2) {
        last = now;
        try { cx.drawImage(v, 0, 0, 32, 18); const d = cx.getImageData(0, 0, 32, 18).data; let L = 0; for (let i = 0; i < d.length; i += 4) L += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; this.checks.light = L / (d.length / 4) > 55; } catch (e) { }
        const smp = Body.state === "ready" ? Body.sample(v, now) : null;
        if (smp) {
          Object.assign(this.checks, { face: smp.face, cx: smp.cx, fw: smp.fw, center: smp.face && smp.cx > 0.3 && smp.cx < 0.7, dist: smp.face && smp.fw > 0.11 && smp.fw < 0.34, gaze: smp.gazeRaw });
          if (this.phase === "rec") { smp.t = Studio.secs(); this.samples.push(smp); }
        }
        if (this.phase === "rec") { const s = Studio.secs(); if (s - lastThumb > 20 || (this.thumbs.length === 0 && s > 1.5)) { lastThumb = s; const th = snap(v, 320); if (th) this.thumbs.push({ t: s, url: th }); } }
      }
      (v.requestVideoFrameCallback ? v.requestVideoFrameCallback(frame) : requestAnimationFrame(frame));
    };
    frame();
  },
  async stop() {
    if (this.phase !== "rec") { this.close(); return; }
    this.phase = "done"; beep(2, 1046);
    const take = { samples: this.samples.slice(), thumbs: this.thumbs.slice(), budget: this.budget, title: this.title };
    this.close(true);
    const slot = S.recSlot; S.recSlot = null; S.recMax = 0;
    const file = await Studio.stop(); render();
    if (!file || !slot) return;
    V9.pendingLive = { id: slot.slice(2), take };
    await runMedia(slot.slice(2), file);
  },
  close(keepRec) {
    this.on = false; clearInterval(this.tm);
    if (!keepRec && Studio.rec) { Studio.stop(true); S.recSlot = null; }
    try { if (this.wake) this.wake.release(); } catch (e) { } this.wake = null;
    const el = $("#v9-stage"); if (el) { const v = el.querySelector("video"); if (v) v.srcObject = null; el.hidden = true; el.innerHTML = ""; }
    Pip.paint();
  }
};
V9.RecStage = RecStage;
function snap(v, w) {
  try { const h = Math.round(w * (v.videoHeight || 9) / (v.videoWidth || 16)); const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(v, 0, 0, w, h); return c.toDataURL("image/jpeg", 0.72); } catch (e) { return null; }
}

// =====================================================================
// 2. L'ANALYSE DU CORPS (MediaPipe, entièrement sur l'appareil)
// =====================================================================
const Body = {
  state: "idle", face: null, pose: null, loading: null, lastTs: 0,
  load() {
    if (this.state === "ready") return Promise.resolve(true);
    if (this.loading) return this.loading;
    if (isFile) { this.state = "error"; return Promise.reject(new Error("file")); }
    this.state = "loading";
    this.loading = (async () => {
      const mp = await import(new URL("lib/mp/vision_bundle.mjs", location.href).href);
      const fs = await mp.FilesetResolver.forVisionTasks(new URL("lib/mp/wasm", location.href).href);
      const mk = async (Cls, path, extra, gpu) => Cls.createFromOptions(fs, Object.assign({ baseOptions: { modelAssetPath: new URL(path, location.href).href, delegate: gpu ? "GPU" : "CPU" }, runningMode: "VIDEO" }, extra));
      const both = async gpu => {
        this.face = await mk(mp.FaceLandmarker, "lib/mp/face.wasm", { numFaces: 1, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true }, gpu);
        this.pose = await mk(mp.PoseLandmarker, "lib/mp/pose.wasm", { numPoses: 1 }, gpu);
      };
      try { await both(true); } catch (e) { await both(false); }
      this.state = "ready"; return true;
    })().catch(e => { this.state = "error"; this.loading = null; console.warn("Body", e); throw e; });
    return this.loading;
  },
  // Une image : visage (orientation, regard, expressivité) et posture (épaules, mains)
  sample(v, ts) {
    if (this.state !== "ready") return null;
    ts = Math.max(this.lastTs + 1, Math.round(ts)); this.lastTs = ts;
    const o = { face: false, gazeRaw: false };
    try {
      const f = this.face.detectForVideo(v, ts);
      if (f && f.faceLandmarks && f.faceLandmarks.length) {
        const L = f.faceLandmarks[0]; let x0 = 1, x1 = 0; for (const p of L) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; }
        o.face = true; o.cx = (x0 + x1) / 2; o.fw = x1 - x0; o.nose = { x: L[1].x, y: L[1].y };
        const M = f.facialTransformationMatrixes && f.facialTransformationMatrixes[0] && f.facialTransformationMatrixes[0].data;
        if (M) { o.yaw = Math.asin(clamp(-M[2], -1, 1)) * 57.3; o.pitch = Math.atan2(M[6], M[10]) * 57.3; }
        const B = {}; ((f.faceBlendshapes && f.faceBlendshapes[0] && f.faceBlendshapes[0].categories) || []).forEach(c => B[c.categoryName] = c.score);
        o.look = Math.max(B.eyeLookOutLeft || 0, B.eyeLookOutRight || 0, B.eyeLookInLeft || 0, B.eyeLookInRight || 0, B.eyeLookUpLeft || 0, B.eyeLookUpRight || 0, B.eyeLookDownLeft || 0, B.eyeLookDownRight || 0);
        o.blink = Math.min(B.eyeBlinkLeft || 0, B.eyeBlinkRight || 0) > 0.5;
        o.expr = (B.browInnerUp || 0) + ((B.browOuterUpLeft || 0) + (B.browOuterUpRight || 0)) / 2 + ((B.mouthSmileLeft || 0) + (B.mouthSmileRight || 0)) / 2 + ((B.browDownLeft || 0) + (B.browDownRight || 0)) / 4;
        o.smile = ((B.mouthSmileLeft || 0) + (B.mouthSmileRight || 0)) / 2;
        o.gazeRaw = (o.yaw === undefined || Math.abs(o.yaw) < 20) && (o.pitch === undefined || Math.abs(o.pitch) < 22) && (o.look < 0.55 || o.blink);
      }
    } catch (e) { }
    try {
      const p = this.pose.detectForVideo(v, ts + 0.5);
      if (p && p.landmarks && p.landmarks.length) {
        const L = p.landmarks[0], ls = L[11], rs = L[12];
        if (ls && rs && (ls.visibility || 0) > 0.5 && (rs.visibility || 0) > 0.5) {
          o.sh = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2, w: Math.hypot(ls.x - rs.x, ls.y - rs.y), tilt: Math.atan2(rs.y - ls.y, rs.x - ls.x) * 57.3 };
          if (o.sh.tilt > 90) o.sh.tilt -= 180; if (o.sh.tilt < -90) o.sh.tilt += 180;
          o.wr = [L[15], L[16]].map(w => w && (w.visibility || 0) > 0.5 && w.y < 1 ? { x: w.x, y: w.y } : null);
        }
      }
    } catch (e) { }
    return o;
  },
  // Analyse a posteriori d'une vidéo importée (lecture accélérée, environ 3 images par seconde)
  async analyzeFile(url, onProg) {
    await this.load();
    const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
    await once(v, "loadedmetadata");
    let dur = v.duration; if (!isFinite(dur) || dur <= 0) { v.currentTime = 1e7; await once(v, "seeked").catch(() => { }); dur = v.duration; }
    if (!isFinite(dur) || dur <= 0) throw new Error("duree");
    const step = Math.max(0.33, dur / 240), out = [], thumbs = [];
    for (let t = 0.2, i = 0; t < dur - 0.1; t += step, i++) {
      v.currentTime = t; await once(v, "seeked");
      const s = this.sample(v, this.lastTs + 34 + i); if (s) { s.t = t; out.push(s); }
      if (!thumbs.length && t > 1) { const th = snap(v, 320); if (th) thumbs.push({ t, url: th }); }
      if (onProg && i % 6 === 0) onProg(t / dur);
    }
    if (!thumbs.length) { const th = snap(v, 320); if (th) thumbs.push({ t: 0, url: th }); }
    v.removeAttribute("src"); v.load();
    return { samples: out, thumbs, dur };
  }
};
V9.Body = Body;

// Synthèse des images : regard, ancrage, gestes, expressivité, événements datés
function bodySummary(samples) {
  const n = samples.length; if (n < 8) return null;
  const F = samples.filter(s => s.face), P = samples.filter(s => s.sh);
  const out = { n, facePct: F.length / n };
  if (F.length >= 6) {
    const yaws = F.filter(s => s.yaw !== undefined).map(s => s.yaw), pits = F.filter(s => s.pitch !== undefined).map(s => s.pitch);
    const my = med(yaws), mp = med(pits);
    samples.forEach(s => { s.gaze = !!(s.face && (s.yaw === undefined || (Math.abs(s.yaw - my) < 14 && Math.abs(s.yaw) < 24)) && (s.pitch === undefined || (Math.abs(s.pitch - mp) < 13)) && (s.look < 0.55 || s.blink)); });
    out.gazePct = samples.filter(s => s.gaze).length / n;
    const ex = F.map(s => s.expr || 0); out.exprSD = sd(ex); out.smile = mean(F.map(s => s.smile || 0));
  }
  if (P.length >= 6) {
    const w = med(P.map(s => s.sh.w)) || 0.3;
    const xs = P.map(s => s.sh.x), ys = P.map(s => s.sh.y);
    out.sway = Math.sqrt(sd(xs) ** 2 + (sd(ys) * 0.6) ** 2) / w;
    out.tilt = mean(P.map(s => Math.abs(s.sh.tilt)));
    const hv = P.filter(s => s.wr && s.wr.some(Boolean)); out.handsPct = hv.length / P.length;
    let mv = [], prev = null;
    P.forEach(s => { if (prev && s.wr && prev.wr) { const dt = Math.max(0.05, s.t - prev.t); let m = 0, k = 0; [0, 1].forEach(j => { if (s.wr[j] && prev.wr[j]) { m += Math.hypot(s.wr[j].x - prev.wr[j].x, s.wr[j].y - prev.wr[j].y) / w / dt; k++; } }); if (k) mv.push(m / k); } prev = s; });
    out.gestAct = mv.length ? med(mv) : 0; out.gestHi = mv.length ? mv.filter(x => x > 1.2).length / mv.length : 0;
    out.w = w; out.cx = med(xs);
  }
  // Événements datés
  const ev = [];
  const spans = (pred, minD, type, lab) => {
    let a = null;
    samples.forEach((s, i) => {
      const on = pred(s), last = i === samples.length - 1;
      if (on && a === null) a = s.t;
      if ((!on || last) && a !== null) { const b = on ? s.t : samples[Math.max(0, i - 1)].t; if (b - a >= minD) ev.push({ t: a, d: r1(b - a), type, lab }); a = null; }
    });
  };
  if (out.gazePct !== undefined) spans(s => s.face && !s.gaze, 1.5, "regard", "Regard hors caméra");
  spans(s => !s.face, 1.5, "cadre", "Visage hors cadre");
  if (out.sway !== undefined) spans(s => s.sh && Math.abs(s.sh.x - out.cx) > 0.2 * out.w, 1, "ancrage", "Balancement du buste");
  let lastTouch = -9;
  samples.forEach(s => { if (s.nose && s.wr && s.sh && s.wr.some(w => w && Math.hypot(w.x - s.nose.x, w.y - s.nose.y) < 0.45 * s.sh.w) && s.t - lastTouch > 3) { lastTouch = s.t; ev.push({ t: s.t, d: 0, type: "visage", lab: "Main au visage" }); } });
  out.events = ev;
  return out;
}

// ---------- Événements de la voix : silences d'orateur et « euh » probables, datés ----------
function voiceEvents(x, sr) {
  const hop = Math.round(sr * 0.02), win = hop * 2, nF = Math.max(0, Math.floor((x.length - win) / hop)); if (nF < 25) return [];
  const db = new Float32Array(nF);
  for (let f = 0; f < nF; f++) { let s = 0; const o = f * hop; for (let i = 0; i < win; i++) { const v = x[o + i]; s += v * v; } db[f] = 10 * Math.log10(s / win + 1e-12); }
  const q = (a, p) => { const s = Array.from(a).sort((m, n) => m - n); return s[Math.floor(p * (s.length - 1))]; };
  const floor = q(db, 0.1), top = q(db, 0.95), thr = floor + Math.max(6, (top - floor) * 0.3);
  const sp = new Uint8Array(nF); for (let f = 0; f < nF; f++) sp[f] = db[f] > thr ? 1 : 0;
  const runs = () => { const r = []; let s = 0; for (let f = 1; f <= nF; f++) if (f === nF || sp[f] !== sp[s]) { r.push([s, f, sp[s]]); s = f; } return r; };
  runs().forEach(([a, b, v]) => { if (!v && b - a < 8 && a > 0 && b < nF) for (let f = a; f < b; f++) sp[f] = 1; });
  runs().forEach(([a, b, v]) => { if (v && b - a < 4) for (let f = a; f < b; f++) sp[f] = 0; });
  const first = sp.indexOf(1), last = sp.lastIndexOf(1); if (first < 0) return [];
  const R = runs(), ev = [];
  R.forEach(([a, b, v], i) => {
    if (!v && a > first && b <= last && (b - a) * 0.02 >= 1.2) ev.push({ t: r1(a * 0.02), d: r1((b - a) * 0.02), type: "silence", lab: "Silence d’orateur" });
    if (v && b - a >= 13 && b - a <= 60) {
      const pre = R[i - 1], post = R[i + 1];
      const iso = (pre && !pre[2] && pre[1] - pre[0] >= 10) || (post && !post[2] && post[1] - post[0] >= 10);
      if (!iso) return;
      const e = []; for (let f = a; f < b; f++) e.push(db[f]);
      if (sd(e) < 2.5) ev.push({ t: r1(a * 0.02), d: r1((b - a) * 0.02), type: "euh", lab: "« euh » probable" });
    }
  });
  return ev;
}

// ---------- Les tics de langage dans la transcription ----------
const TICS = [["euh", /\b(euh+|heu+|hum+|bah|ben)\b/g], ["du coup", /\bdu coup\b/g], ["en fait", /\ben fait\b/g], ["voilà", /\bvoil[aà]\b/g], ["genre", /\bgenre\b/g], ["quoi", /\bquoi\s*[.,!?]/g], ["donc", /\bdonc\b/g], ["en gros", /\ben gros\b/g], ["vraiment", /\bvraiment\b/g]];
function ticsIn(text, chunks) {
  const t = String(text || "").toLowerCase(), found = {}, ev = [];
  TICS.forEach(([k, re]) => { const m = t.match(re); if (m) found[k] = m.length; });
  // « donc » et « vraiment » ne comptent qu'à partir de trois emplois : ce sont aussi des mots utiles.
  ["donc", "vraiment"].forEach(k => { if (found[k] && found[k] < 3) delete found[k]; else if (found[k]) found[k] -= 2; });
  (chunks || []).forEach(c => { const lc = c.t.toLowerCase(); TICS.forEach(([k, re]) => { if (found[k] && lc.match(new RegExp(re.source))) ev.push({ t: r1(c.a), d: 0, type: "tic", lab: "Tic : « " + k + " »" }); }); });
  return { found, n: Object.values(found).reduce((a, b) => a + b, 0), ev };
}

// =====================================================================
// 3. LA GRILLE : six critères notés de 1 à 5, avec une mesure et un conseil
// =====================================================================
const CRIT = {
  ancrage: { t: "Ancrage", q: "Stabilité et verticalité", icon: "▮" },
  diction: { t: "Diction", q: "Netteté et débit", icon: "◆" },
  regard: { t: "Regard", q: "Contact avec l’objectif", icon: "◉" },
  parasites: { t: "Mots parasites", q: "Silence habité à la place des « euh »", icon: "✕" },
  structure: { t: "Structure", q: "Plan annoncé, enchaînements, chute", icon: "≡" },
  pathos: { t: "Expressivité", q: "Voix, visage et gestes au service de l’émotion", icon: "♥" }
};
V9.CRIT = CRIT;
const TIPS = {
  ancrage: ["Pieds à la largeur du bassin, poids sur les deux jambes. Avant de parler, poussez le sol trois secondes : le tronc reste immobile, seules les mains bougent.", "L’ancrage tient presque tout le temps. Repérez sur la ligne du temps le moment où le buste part : c’est souvent une phrase difficile. Respirez avant elle.", "Ancrage de statue : gardez-le et travaillez maintenant l’amplitude des gestes."],
  diction: ["Exercice du crayon : une minute de lecture avec un crayon entre les dents, puis sans. Les consonnes P, T, K doivent claquer en fin de mot.", "Diction correcte. Ralentissez sur les mots-clés et finissez chaque syllabe finale : c’est là que se perd la netteté.", "Diction nette et débit maîtrisé. Variez maintenant la vitesse : lent pour l’essentiel, plus vif pour les transitions."],
  regard: ["Parlez à l’objectif, pas à votre image à l’écran. Collez une pastille juste à côté de la caméra et revenez-y à la fin de chaque phrase.", "Le regard revient bien, mais fuit pendant la réflexion. Pensez en silence en regardant l’objectif, puis parlez.", "Regard soutenu : l’auditoire se sent inclus. Gardez-le aussi dans les silences."],
  parasites: ["Chaque « euh » devient un silence : bouche fermée, une inspiration, puis la phrase. Entraînez-vous à la question piège en vous l’interdisant.", "Quelques tics subsistent. Repérez-les sur la ligne du temps : ils arrivent presque toujours au début d’une nouvelle idée.", "Parole coiffée : vos silences sont habités. Osez-en un plus long avant la phrase clé."],
  structure: ["Annoncez votre plan dès la deuxième phrase : « D’abord…, ensuite…, enfin… ». Terminez par une chute courte que l’on puisse répéter.", "Le plan se devine. Rendez-le audible : numérotez vos parties et liez-les par « en outre », « néanmoins », « dès lors ».", "Architecture claire et chute présente. Travaillez maintenant l’ouverture : une image ou un chiffre dans la première phrase."],
  pathos: ["Changez de couleur vocale : plus grave et plus lent pour la confidence, plus fort pour l’indignation. Laissez le visage et les mains suivre.", "L’émotion passe par moments. Marquez un contraste net entre deux passages : une phrase très douce, puis une phrase portée.", "Voix et visage vivants. Gardez cette palette et ajoutez un geste fort sur la phrase clé."]
};
const band = s => s <= 2 ? 0 : s <= 3 ? 1 : 2;
const sc5 = v => clamp(Math.round(v), 1, 5);
const CONNECT = ["en outre", "de surcroit", "par ailleurs", "eu egard", "en raison de", "attendu que", "neanmoins", "toutefois", "en revanche", "en depit de", "quoique", "nonobstant", "partant", "des lors", "par consequent", "c'est pourquoi", "ainsi", "cependant", "pourtant", "or ", "car ", "parce que", "puisque", "certes", "en effet", "autrement dit", "par exemple", "d'une part", "d'autre part"];
function gradeTake(o) {
  const A = o.A && !o.A.silent ? o.A : null, B = o.B, text = o.text || "", words = text.split(/\s+/).filter(Boolean).length;
  const dur = o.dur || (A && A.dur) || 0, min = Math.max(0.25, ((A && A.active) || dur) / 60);
  const g = {};
  // Ancrage
  if (B && B.sway !== undefined) {
    let s = B.sway < 0.035 ? 5 : B.sway < 0.06 ? 4 : B.sway < 0.09 ? 3 : B.sway < 0.13 ? 2 : 1; if (B.tilt > 7) s--;
    g.ancrage = { s: sc5(s), m: "Balancement du buste : " + Math.round(B.sway * 100) + " % de la largeur des épaules ; inclinaison moyenne " + Math.round(B.tilt) + "°." };
  }
  // Diction
  if (A) {
    let s = 3; const sylText = text ? syllEst(text) : 0, clar = text && A.syll ? Math.min(1.2, sylText / A.syll) : null;
    if (A.sps >= 3.5 && A.sps <= 5.6) s++; else if (A.sps > 6.2 || (A.sps && A.sps < 3)) s--;
    if (clar !== null && words >= 8) { if (clar >= 0.85) s++; else if (clar < 0.6) s--; }
    if (A.dyn < 5) s -= 0.5;
    g.diction = { s: sc5(s), m: "Débit " + comma(A.sps) + " syllabes par seconde (repère 3,5 à 5,6)" + (clar !== null && words >= 8 ? " ; " + Math.min(100, Math.round(clar * 100)) + " % des syllabes reconnues par la transcription" : "") + "." };
  }
  // Regard
  if (B && B.gazePct !== undefined) {
    const p = B.gazePct, s = p >= 0.85 ? 5 : p >= 0.7 ? 4 : p >= 0.55 ? 3 : p >= 0.4 ? 2 : 1, nOff = (B.events || []).filter(e => e.type === "regard").length;
    g.regard = { s, m: "Regard vers l’objectif " + pctx(p) + " du temps ; " + nOff + " fuite" + (nOff > 1 ? "s" : "") + " de plus de 1,5 s." };
  }
  // Mots parasites
  if (A) {
    const tic = o.tics || { n: 0, found: {} }, nEuh = A.hes || 0, per = (nEuh + tic.n) / min;
    let s = per < 1 ? 5 : per < 2 ? 4 : per < 4 ? 3 : per < 6 ? 2 : 1; if (s < 5 && A.longP >= 2) s += 0.5;
    const tl = Object.entries(tic.found).map(([k, v]) => "« " + k + " » ×" + v).join(", ");
    g.parasites = { s: sc5(s), m: nEuh + " « euh » probable" + (nEuh > 1 ? "s" : "") + (tl ? ", tics : " + tl : "") + " ; soit " + comma(r1(per)) + " par minute ; " + (A.longP || 0) + " silence" + ((A.longP || 0) > 1 ? "s" : "") + " d’orateur." };
  }
  // Structure
  if (words >= 25) {
    const t = norm(text);
    const st1 = /\b(d'abord|tout d'abord|premierement|en premier lieu|premier point|commencons)/.test(t), st2 = /\b(ensuite|deuxiemement|en second lieu|second point|deuxieme point|puis)\b/.test(t), st3 = /\b(enfin|troisiemement|en dernier lieu|dernier point|troisieme point)\b/.test(t);
    const concl = /\b(en conclusion|pour conclure|en somme|en definitive|au fond|bref|retenez|je vous propose|je vous demande|voila pourquoi|c'est pourquoi)/.test(t);
    const div = CONNECT.filter(k => t.includes(k)), steps = [st1, st2, st3].filter(Boolean).length;
    const tv = o.budget ? Math.abs(dur - o.budget) / o.budget : null;
    const sentences = (text.match(/[.!?]+/g) || []).length;
    const pts = (sentences >= 4 ? 0.5 : 0) + (steps >= 3 ? 1.5 : steps === 2 ? 1 : steps === 1 ? 0.5 : 0) + (concl ? 1 : 0) + (div.length >= 4 ? 1 : div.length >= 2 ? 0.5 : 0) + (tv === null ? 0.5 : tv <= 0.15 ? 1 : tv <= 0.3 ? 0.5 : 0);
    g.structure = { s: sc5(1.5 + pts), m: "Étapes annoncées : " + steps + " sur 3 ; chute " + (concl ? "présente" : "absente") + " ; " + div.length + " connecteur" + (div.length > 1 ? "s" : "") + " logique" + (div.length > 1 ? "s" : "") + (div.length ? " (" + div.slice(0, 4).map(x => x.trim().replace("neanmoins", "néanmoins").replace("des lors", "dès lors").replace("de surcroit", "de surcroît").replace("eu egard", "eu égard").replace("en depit de", "en dépit de").replace("par consequent", "par conséquent")).join(", ") + ")" : "") + (tv !== null ? " ; durée " + fmtSec(dur) + " pour " + fmtSec(o.budget) + " visées" : "") + "." };
  }
  // Expressivité (pathos)
  const parts = [], lab = [];
  if (A && A.pitched >= 15) { parts.push(clamp((A.range - 2.5) / 8, 0, 1)); lab.push("intonation " + comma(A.range) + " demi-tons"); }
  if (A) { parts.push(clamp((A.dyn - 3) / 9, 0, 1)); lab.push(comma(A.dyn) + " dB d’écart de volume"); }
  if (B && B.exprSD !== undefined) { parts.push(clamp(B.exprSD / 0.12, 0, 1)); lab.push("visage " + (B.exprSD > 0.09 ? "très mobile" : B.exprSD > 0.05 ? "mobile" : "peu mobile")); }
  if (B && B.handsPct !== undefined) { parts.push(clamp(B.handsPct * 0.6 + Math.min(1, B.gestAct / 0.8) * 0.4, 0, 1)); lab.push("mains visibles " + pctx(B.handsPct) + " du temps"); }
  if (parts.length >= 2) { const m = lab.join(" ; "); g.pathos = { s: sc5(1 + 4 * mean(parts)), m: m.charAt(0).toUpperCase() + m.slice(1) + "." }; }
  Object.keys(g).forEach(k => { g[k].c = TIPS[k][band(g[k].s)]; });
  const vals = Object.values(g).map(x => x.s), glob = vals.length ? r1(mean(vals)) : null;
  const order = Object.entries(g).sort((a, b) => a[1].s - b[1].s);
  return { g, glob, weak: order.length ? order[0][0] : null, strong: order.length ? order[order.length - 1][0] : null, at: Date.now() };
}
V9.gradeTake = gradeTake;

// ---------- Rendu de la fiche d'évaluation ----------
function gridCard(G, opts) {
  opts = opts || {};
  if (!G || !G.glob) return "";
  const ks = Object.keys(CRIT).filter(k => G.g[k]);
  let h = '<div class="v9-grid"><div class="v9-glob"><b>' + comma(G.glob) + '</b><span>/ 5</span><em>' + esc(G.glob >= 4.3 ? "Parole souveraine" : G.glob >= 3.5 ? "Solide, à affiner" : G.glob >= 2.6 ? "En construction" : "Les fondations d’abord") + '</em></div>';
  h += '<ul class="v9-crit">' + ks.map(k => { const x = G.g[k]; return '<li class="s' + x.s + '"><div class="v9-ch"><span>' + esc(CRIT[k].t) + '</span><b>' + x.s + '/5</b></div><div class="v9-bar"><i style="width:' + (x.s * 20) + '%"></i></div>' + (opts.compact ? "" : '<p class="v9-m">' + esc(x.m) + '</p>') + '</li>'; }).join("") + '</ul>';
  const miss = Object.keys(CRIT).filter(k => !G.g[k]);
  if (miss.length && !opts.compact) h += '<p class="small muted">Non mesuré cette fois : ' + esc(miss.map(k => CRIT[k].t.toLowerCase()).join(", ")) + (miss.some(k => ["ancrage", "regard"].includes(k)) ? " (il faut voir le buste et le visage)" : "") + (miss.includes("structure") ? " (il faut au moins 25 mots transcrits)" : "") + '.</p>';
  if (G.weak && !opts.compact) h += '<div class="tip"><span>Priorité · ' + esc(CRIT[G.weak].t) + '</span><b>' + esc(G.g[G.weak].c) + '</b></div>';
  if (G.strong && G.strong !== G.weak && !opts.compact) h += '<p class="small good-line">Point fort : ' + esc(CRIT[G.strong].t.toLowerCase()) + ' (' + G.g[G.strong].s + '/5).</p>';
  return h + '</div>';
}
V9.gridCard = gridCard;

// =====================================================================
// 4. LA VIDÉOTHÈQUE (IndexedDB, sur cet appareil)
// =====================================================================
const Takes = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      let rq; try { rq = indexedDB.open("vs-takes", 1); } catch (e) { rej(e); return; }
      rq.onupgradeneeded = () => { const d = rq.result; if (!d.objectStoreNames.contains("meta")) d.createObjectStore("meta", { keyPath: "id" }); if (!d.objectStoreNames.contains("blob")) d.createObjectStore("blob", { keyPath: "id" }); };
      rq.onsuccess = () => { this.db = rq.result; res(this.db); }; rq.onerror = () => rej(rq.error);
    });
  },
  async tx(store, mode, fn) { const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction(store, mode), s = t.objectStore(store); const r = fn(s); t.oncomplete = () => res(r && r.result !== undefined ? r.result : r); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); },
  async save(meta, blob) {
    await this.tx("blob", "readwrite", s => s.put({ id: meta.id, blob }));
    await this.tx("meta", "readwrite", s => s.put(meta));
    S.v9.list = null; try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
  },
  async put(meta) { await this.tx("meta", "readwrite", s => s.put(meta)); S.v9.list = null; },
  async list() { const d = await this.open(); return new Promise((res, rej) => { const out = [], c = d.transaction("meta").objectStore("meta").openCursor(); c.onsuccess = () => { const k = c.result; if (k) { out.push(k.value); k.continue(); } else res(out.sort((a, b) => b.at - a.at)); }; c.onerror = () => rej(c.error); }); },
  async get(id) { const d = await this.open(); return new Promise((res, rej) => { const r = d.transaction("meta").objectStore("meta").get(id); r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error); }); },
  async blob(id) { const d = await this.open(); return new Promise((res, rej) => { const r = d.transaction("blob").objectStore("blob").get(id); r.onsuccess = () => res(r.result ? r.result.blob : null); r.onerror = () => rej(r.error); }); },
  async del(id, keepMeta) { await this.tx("blob", "readwrite", s => s.delete(id)); if (keepMeta) { const m = await this.get(id); if (m) { m.noVideo = true; await this.put(m); } } else await this.tx("meta", "readwrite", s => s.delete(id)); S.v9.list = null; }
};
V9.Takes = Takes;
async function refreshList() {
  try { S.v9.list = await Takes.list(); } catch (e) { S.v9.list = []; S.v9.dbErr = true; }
  try { if (navigator.storage && navigator.storage.estimate) S.v9.usage = await navigator.storage.estimate(); } catch (e) { }
  if (S.route === "videos") render();
}

// =====================================================================
// 5. L'ANALYSE D'UNE PRISE : voix, transcription datée, corps, grille, archivage
// =====================================================================
const _runMedia8 = runMedia;
runMedia = async function (id, file) {
  const live = V9.pendingLive && V9.pendingLive.id === id ? V9.pendingLive.take : null; V9.pendingLive = null;
  const c = ctx(), r = R(id); freeze(id); S.pickHelp = null; if (S.pick) S.pick.done = true;
  const m = Media.set(id, file), box = (c.boxes && c.boxes[id]) || {}, budget = live ? live.budget : budgetOf(id, box);
  r.media = { kind: m.kind, status: "analyse", at: Date.now(), size: file.size, msg: "Prise reçue (" + Math.max(1, Math.round(file.size / 1e6)) + " Mo). J’écoute votre voix…" };
  r.grid = null; r.ai = null; render();
  const prog = t => { const el = $("#mp-" + id); if (el) el.textContent = t; r.media.msg = t; };
  let pcm8 = null, events = [];
  if (file.size < 6e8) { try { pcm8 = await decodeToMono(file); r.media.audio = analyzePCM(pcm8, 8000); events = events.concat(voiceEvents(pcm8, 8000)); } catch (e) { r.media.audioErr = true; } } else r.media.audioErr = true;
  // Le corps
  let B = null, thumbs = live ? live.thumbs : [];
  if (m.kind === "video") {
    if (live && live.samples.length >= 8) B = bodySummary(live.samples);
    else {
      try { prog("J’observe votre posture, votre regard et vos gestes…"); const x = await Body.analyzeFile(m.url, p => prog("J’observe votre corps… " + Math.round(p * 100) + " %")); B = bodySummary(x.samples); if (!thumbs.length) thumbs = x.thumbs; if (x.dur) r.media.dur = x.dur; }
      catch (e) { r.media.videoErr = true; }
    }
    if (B) {
      r.media.body = Object.assign({}, B, { events: undefined }); events = events.concat(B.events);
      // Indice de mouvement compatible avec le diagnostic et les tableaux de progrès
      if (B.sway !== undefined) r.media.motion = { index: Math.round(clamp((B.gestAct || 0) * 40 + B.sway * 300, 0, 100)), agit: Math.round(clamp((B.sway - 0.03) / 0.12 * 100, 0, 100)), head: Math.round(clamp(100 - (B.events || []).filter(e => e.type === "ancrage").length * 12, 0, 100)), tl: [] };
    }
    if (coachOn() && Media.get(id) === m) { try { const v = await analyzeVideo(m.url, Math.max(1, Math.min(6, S.imgMax || 6)), p => prog("Images pour le coach… " + Math.round(p * 100) + " %")); m.frames = v.frames; r.media.motion = v.motion; if (!r.media.dur) r.media.dur = v.dur; } catch (e) { } }
  }
  if (!r.media.dur && r.media.audio && !r.media.audio.silent) r.media.dur = r.media.audio.dur;
  if (r.media.dur) r.sec = Math.round(r.media.dur);
  // La transcription datée
  let chunks = [];
  if (ASR_PREF() !== "0" && r.media.audio && !r.media.audio.silent && file.size < 6e8 && !isFile) {
    try {
      if (ASR.state !== "ready") await ASR.load(p => prog("Préparation de la transcription (une seule fois)… " + Math.round(p * 100) + " %"));
      prog("Je transcris votre parole…");
      const pcm16 = await decodeToMono(file, 16000); const out = await ASR.transcribeTS(pcm16);
      if (out.text) r.text = out.text; chunks = out.chunks;
    } catch (e) { toast("La transcription n’a pas abouti : j’évalue la voix et le corps."); }
  }
  const tics = ticsIn(r.text, chunks); events = events.concat(tics.ev);
  r.grid = gradeTake({ A: r.media.audio, B, text: r.text, tics, dur: r.media.dur || r.sec, budget });
  r.media.status = "ok"; delete r.media.msg; saveSess(); render();
  const vv = timeVerdict(r.sec, budget); if (vv) toast(vv.t);
  // Archivage dans la vidéothèque
  try {
    const tid = "t" + Date.now().toString(36);
    const meta = { id: tid, at: Date.now(), n: c && c.n || 0, slot: id, title: box.kind ? box.kind.charAt(0).toUpperCase() + box.kind.slice(1) : (live && live.title) || "Prise libre", sujet: box.consigne ? String(box.consigne).split(" Technique du jour")[0].slice(0, 220) : "", dur: r.media.dur || r.sec || 0, budget, mime: file.type, size: file.size, kind: m.kind, grid: r.grid, events: events.sort((a, b) => a.t - b.t), text: r.text || "", chunks, thumb: thumbs[0] ? thumbs[0].url : null, audio: r.media.audio ? { dur: r.media.audio.dur, sps: r.media.audio.sps, range: r.media.audio.range, dyn: r.media.audio.dyn, hes: r.media.audio.hes, longP: r.media.audio.longP } : null, body: r.media.body || null };
    await Takes.save(meta, file); r.takeId = tid; saveSess(); render();
  } catch (e) { r.saveErr = true; toast("Vidéothèque pleine ou indisponible : la prise n’a pas été archivée."); }
  if (coachOn() && r.media && r.media.status === "ok" && !r.ai) autoCoach(id);
};

// Fiche compacte sous chaque prise
const _studioCompact8 = studioCompact;
studioCompact = function (id) {
  const r = R(id), md = r.media; if (!md) return "";
  if (md.status === "analyse") return '<div class="analysing"><span class="pulse"></span><span id="mp-' + id + '">' + esc(md.msg || "Analyse en cours…") + '</span></div>';
  if (!r.grid) return _studioCompact8(id);
  const mm = Media.get(id);
  let h = mm && mm.kind === "video" ? '<video class="preview" src="' + mm.url + '" controls playsinline preload="metadata"></video>' : "";
  h += gridCard(r.grid);
  h += '<div class="row-wrap v9-acts">' + (r.takeId ? '<button class="btn sm" data-act="v9-open" data-id="' + r.takeId + '">Revoir avec annotations</button>' : "") + '<button class="btn ghost sm" data-act="vrec" data-id="' + id + '">Refaire la prise</button>' + (mm ? '<button class="link small" data-act="media-del" data-id="' + id + '">Effacer de la séance</button>' : "") + '</div>';
  return h;
};

// =====================================================================
// 6. LE BOUTON UNIQUE : partout où l'on filme, la scène d'enregistrement s'ouvre
// =====================================================================
window.addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act, c = S.cur;
  const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
  const sure = msg => { if (b.dataset.armed && Date.now() - Number(b.dataset.armed) < 5000) return true; b.dataset.armed = Date.now(); b.dataset.label = b.dataset.label || b.textContent; b.textContent = msg; b.classList.add("armed"); setTimeout(() => { if (document.body.contains(b)) { b.textContent = b.dataset.label; b.classList.remove("armed"); delete b.dataset.armed; } }, 5000); return false; };
  switch (a) {
    case "vrec": { stop(); const id = b.dataset.id, box = c && c.boxes && c.boxes[id]; if (Studio.rec) return; await RecStage.open(id, budgetOf(id, box), box && box.kind ? box.kind.charAt(0).toUpperCase() + box.kind.slice(1) : "Ma prise"); break; }
    case "pick": {
      // « Me filmer » ouvre la scène ; « choisir une vidéo » reste un import de fichier.
      if (b.classList.contains("big-act") && camAllowedHere() && !(IS_MOBILE && IN_FRAME) && b.dataset.id !== "tech") { stop(); const id = b.dataset.id, box = c && c.boxes && c.boxes[id]; await RecStage.open(id, budgetOf(id, box), box && box.kind ? box.kind : "Ma prise"); break; }
      if (b.dataset.id === "tech" && camAllowedHere()) { stop(); const ok = await Studio.open(); if (ok) { S.profile.tech = S.profile.tech || {}; S.profile.tech.cam = true; saveProfile(); toast("Caméra et micro prêts."); render(); } break; }
      break;
    }
    case "studio-open": {
      // Dans une prise de parole, « ouvrir le studio » lance directement la scène : un seul bouton.
      const sb = b.closest(".sbox2"), sid = sb && sb.id && sb.id.startsWith("sbx-") ? sb.id.slice(4) : null;
      if (sid) { stop(); const box = c && c.boxes && c.boxes[sid]; await RecStage.open(sid, budgetOf(sid, box), box && box.kind ? box.kind.charAt(0).toUpperCase() + box.kind.slice(1) : "Ma prise"); break; }
      if (camAllowedHere()) { stop(); await Studio.open(); }
      break;
    }
    case "v9-rec-go": stop(); RecStage.countdown(); break;
    case "v9-rec-stop": stop(); await RecStage.stop(); break;
    case "v9-rec-cancel": stop(); RecStage.close(); toast("Prise annulée."); break;
    case "v9-pip-min": stop(); Pip.min = !Pip.min; Pip.paint(); break;
    case "v9-cam-off": stop(); Studio.shut(); toast("Caméra et micro coupés."); break;
    case "v9-open": stop(); S.v9.take = b.dataset.id; S.v9.cmpMode = false; if (S.route === "seance" && c) saveSess(true); S.v9.back = S.route; S.route = "videos"; render(); break;
    case "v9-back": stop(); if (S.v9.take || S.v9.cmpView) { S.v9.take = null; S.v9.cmpView = null; render(); } else { S.route = S.v9.back || "home"; render(); } break;
    case "v9-cmp-mode": stop(); S.v9.cmpMode = !S.v9.cmpMode; S.v9.cmp = []; render(); break;
    case "v9-cmp-pick": { stop(); const id = b.dataset.id, k = S.v9.cmp.indexOf(id); if (k >= 0) S.v9.cmp.splice(k, 1); else { S.v9.cmp.push(id); if (S.v9.cmp.length > 2) S.v9.cmp.shift(); } if (S.v9.cmp.length === 2) { S.v9.cmpView = S.v9.cmp.slice(); S.v9.cmpMode = false; S.v9.cmp = []; } render(); break; }
    case "v9-avap": { stop(); const L = (S.v9.list || []).filter(t => !t.noVideo && t.grid && t.grid.glob); if (L.length >= 2) { S.v9.cmpView = [L[L.length - 1].id, L[0].id]; render(); } break; }
    case "v9-seek": { stop(); const v = $("#v9-v" + (b.dataset.k || "")); if (v) { try { v.currentTime = Math.max(0, Number(b.dataset.t) - 1); v.play().catch(() => { }); } catch (_) { } } break; }
    case "v9-fav": { stop(); const m = await Takes.get(b.dataset.id); if (m) { m.fav = !m.fav; await Takes.put(m); await refreshList(); } break; }
    case "v9-del": { stop(); if (!sure("Touchez encore pour supprimer définitivement")) return; await Takes.del(b.dataset.id); S.v9.take = null; await refreshList(); toast("Prise supprimée."); break; }
    case "v9-del-video": { stop(); if (!sure("Touchez encore pour confirmer")) return; await Takes.del(b.dataset.id, true); await refreshList(); toast("Vidéo supprimée, fiche conservée."); break; }
    case "v9-dl-video": stop(); await exportVideo(b.dataset.id); break;
    case "v9-dl-pdf": stop(); await exportPDF(b.dataset.id); break;
    case "v9-share": stop(); await shareTake(b.dataset.id); break;
    case "v9-sync": { stop(); const vs = $$(".v9-cmp video"); const playing = vs.some(v => !v.paused); vs.forEach(v => { try { if (playing) v.pause(); else { v.currentTime = 0; v.play().catch(() => { }); } } catch (_) { } }); break; }
    case "v9-lighten": { stop(); if (!sure("Touchez encore : les vidéos de plus de 30 jours partent, les fiches restent")) return; await lighten(); break; }
    case "v9-install": stop(); if (V9.installEvt) { V9.installEvt.prompt(); V9.installEvt = null; render(); } break;
    case "go": if (b.dataset.r === "videos") { S.v9.take = null; S.v9.cmpView = null; S.v9.back = null; } if (S.route === "videos" && b.dataset.r !== "videos") revokeAll(); break;
  }
}, true);

// =====================================================================
// 7. LES VUES : liste, relecture annotée, comparaison
// =====================================================================
const EVC = { regard: ["Regard", "#C98418"], cadre: ["Hors cadre", "#8A6FB0"], ancrage: ["Ancrage", "#283A9A"], visage: ["Main au visage", "#AD2A20"], euh: ["« euh »", "#D2462E"], tic: ["Tic de langage", "#D2462E"], silence: ["Silence d’orateur", "#23714A"] };
let urls = {};
function revokeAll() { Object.values(urls).forEach(u => { try { URL.revokeObjectURL(u); } catch (e) { } }); urls = {}; }
async function blobUrl(id) {
  if (urls[id]) return urls[id];
  const b = await Takes.blob(id); if (!b) return null; urls[id] = URL.createObjectURL(b); return urls[id];
}
function fixDuration(v, known) {
  // Les vidéos du navigateur n'annoncent pas toujours leur durée : on la force pour pouvoir naviguer.
  v.addEventListener("loadedmetadata", () => { if (!isFinite(v.duration)) { const back = () => { v.removeEventListener("durationchange", back); try { v.currentTime = 0; } catch (e) { } }; v.addEventListener("durationchange", back); try { v.currentTime = 1e7; } catch (e) { } } }, { once: true });
}
function timeline(t, k) {
  const dur = Math.max(1, t.dur || 1), ev = (t.events || []).filter(e => e.t <= dur + 1);
  const types = Object.keys(EVC).filter(x => ev.some(e => e.type === x));
  let h = '<div class="v9-tl" data-dur="' + dur + '" data-k="' + (k || "") + '"><div class="v9-track">' + ev.map(e => '<button class="v9-mk" style="left:' + clamp(e.t / dur * 100, 0, 100).toFixed(2) + '%;' + (e.d > 0.8 ? "width:" + clamp(e.d / dur * 100, 0.8, 100).toFixed(2) + "%;" : "") + 'background:' + EVC[e.type][1] + '" data-act="v9-seek" data-k="' + (k || "") + '" data-t="' + e.t + '" title="' + esc(e.lab + " · " + fmtSec(e.t)) + '" aria-label="' + esc(e.lab + " à " + fmtSec(e.t)) + '"></button>').join("") + '<i class="v9-head" id="v9-head' + (k || "") + '"></i></div>';
  h += '<div class="v9-scale"><span>0:00</span><span>' + fmtSec(dur / 2) + '</span><span>' + fmtSec(dur) + '</span></div>';
  if (types.length) h += '<ul class="v9-leg">' + types.map(x => '<li><i style="background:' + EVC[x][1] + '"></i>' + esc(EVC[x][0]) + ' · ' + ev.filter(e => e.type === x).length + '</li>').join("") + '</ul>';
  else h += '<p class="small muted">Aucun événement repéré sur cette prise.</p>';
  return h + '</div>';
}
function scoreSpark(L) {
  const P = L.filter(t => t.grid && t.grid.glob).slice().reverse(); if (P.length < 2) return "";
  const W = 320, H = 90, x = i => 14 + i * (W - 28) / (P.length - 1), y = v => H - 14 - (v - 1) / 4 * (H - 28);
  const pts = P.map((t, i) => x(i).toFixed(1) + "," + y(t.grid.glob).toFixed(1)).join(" ");
  return '<svg class="v9-spark" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Note globale de ' + comma(P[0].grid.glob) + ' à ' + comma(P[P.length - 1].grid.glob) + ' sur ' + P.length + ' prises">' +
    [1, 3, 5].map(v => '<line x1="10" x2="' + (W - 10) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="g"/>').join("") +
    '<polyline points="' + pts + '"/>' + P.map((t, i) => '<circle cx="' + x(i) + '" cy="' + y(t.grid.glob) + '" r="3.2"/>').join("") +
    '<text x="' + x(0) + '" y="' + (y(P[0].grid.glob) - 8) + '" text-anchor="start">' + comma(P[0].grid.glob) + '</text><text x="' + x(P.length - 1) + '" y="' + (y(P[P.length - 1].grid.glob) - 8) + '" text-anchor="end">' + comma(P[P.length - 1].grid.glob) + '</text></svg>';
}
function viewVideos() {
  const L = S.v9.list;
  if (L === null) { refreshList(); return '<header class="top"><div class="brand">La Vidéothèque</div></header><section class="card"><p class="muted">Ouverture de vos prises…</p></section>'; }
  if (S.v9.take) return viewTake(S.v9.take);
  if (S.v9.cmpView) return viewCompare(S.v9.cmpView);
  const u = S.v9.usage, used = u && u.usage ? Math.round(u.usage / 1e6) : null, quota = u && u.quota ? Math.round(u.quota / 1e6) : null;
  let h = '<header class="top"><div class="brand">La Vidéothèque</div><div class="date">' + (L.length ? L.length + " prise" + (L.length > 1 ? "s" : "") : "Aucune prise") + (used !== null ? ' · ' + used + ' Mo' : "") + '</div></header>';
  if (S.v9.back) h += '<button class="link" data-act="v9-back">‹ Revenir à la séance</button>';
  if (!L.length) return h + '<section class="card center"><div class="v9-empty" aria-hidden="true">' + CAM + '</div><h2>Vos prises arriveront ici</h2><p class="muted">Chaque fois que vous vous filmez dans une séance, la vidéo, sa fiche d’évaluation et ses annotations sont rangées ici, sur cet appareil seulement. Vous pourrez la revoir, la comparer à vos débuts et l’exporter.</p><button class="btn" data-act="go" data-r="home">Aller à la séance du jour</button></section>' + installCard();
  const G = L.filter(t => t.grid && t.grid.glob);
  if (G.length >= 2) h += '<section class="card"><div class="eyebrow">Votre progression · note globale</div>' + scoreSpark(L) + '<button class="btn wide" data-act="v9-avap"' + (L.filter(t => !t.noVideo && t.grid && t.grid.glob).length >= 2 ? "" : " disabled") + '>Avant / après : première et dernière prise</button></section>';
  h += '<div class="row-between v9-tools"><button class="chip' + (S.v9.cmpMode ? " on" : "") + '" data-act="v9-cmp-mode">' + (S.v9.cmpMode ? "Choisissez deux prises… (" + S.v9.cmp.length + "/2)" : "Comparer deux prises") + '</button></div>';
  h += '<ul class="v9-list">' + L.map(t => {
    const sel = S.v9.cmp.includes(t.id);
    return '<li><button class="card v9-item' + (sel ? " sel" : "") + '" data-act="' + (S.v9.cmpMode ? "v9-cmp-pick" : "v9-open") + '" data-id="' + t.id + '"' + (S.v9.cmpMode && t.noVideo ? " disabled" : "") + '>' +
      '<div class="v9-th">' + (t.thumb ? '<img src="' + t.thumb + '" alt="" loading="lazy">' : '<span>' + (t.kind === "audio" ? "♪" : "▶") + '</span>') + '<em>' + fmtSec(t.dur) + '</em></div>' +
      '<div class="v9-meta"><b>' + esc(t.title) + (t.fav ? " ★" : "") + '</b><span>' + esc(dateFR(t.at)) + ' · ' + esc(hourFR(t.at)) + (t.n ? ' · séance ' + t.n : "") + (t.noVideo ? " · fiche seule" : "") + '</span>' +
      (t.grid && t.grid.glob ? '<div class="v9-mini">' + Object.keys(CRIT).map(k => t.grid.g[k] ? '<i class="s' + t.grid.g[k].s + '" title="' + esc(CRIT[k].t + " " + t.grid.g[k].s + "/5") + '"></i>' : '<i class="na"></i>').join("") + '</div>' : "") + '</div>' +
      (t.grid && t.grid.glob ? '<div class="v9-note">' + comma(t.grid.glob) + '</div>' : "") + '</button></li>';
  }).join("") + '</ul>';
  if (quota && used / quota > 0.6) h += '<section class="card warn-card"><p><b>Espace bientôt plein</b> (' + used + ' Mo sur ' + quota + ').</p><button class="btn sm" data-act="v9-lighten">Alléger : garder seulement les fiches des prises de plus de 30 jours (sauf favoris et première prise)</button></section>';
  else if (L.length > 6) h += '<p class="small muted center"><button class="link small" data-act="v9-lighten">Alléger la vidéothèque</button> · les fiches restent, seules les vidéos anciennes partent.</p>';
  return h + installCard();
}
function viewTake(id) {
  const t = (S.v9.list || []).find(x => x.id === id);
  if (!t) return '<header class="top"><div class="brand">Prise introuvable</div></header><button class="btn" data-act="v9-back">Retour</button>';
  let h = '<header class="sess-top"><button class="icon-btn" data-act="v9-back" aria-label="Retour">' + ICON.close + '</button><div class="sess-title"><b>' + esc(t.title) + '</b><span>' + esc(dateFR(t.at)) + ' · ' + fmtSec(t.dur) + '</span></div><button class="icon-btn" data-act="v9-fav" data-id="' + t.id + '" aria-label="' + (t.fav ? "Retirer des favoris" : "Ajouter aux favoris") + '">' + (t.fav ? "★" : "☆") + '</button></header>';
  if (t.sujet) h += '<div class="filrouge"><span>Sujet</span><b>' + esc(t.sujet) + '</b></div>';
  h += t.noVideo ? '<section class="card"><p class="muted">La vidéo a été supprimée pour gagner de la place. La fiche reste.</p></section>' : '<div class="v9-player">' + (t.kind === "audio" ? '<audio id="v9-v" controls preload="metadata"></audio>' : '<video id="v9-v" controls playsinline preload="metadata"></video>') + '</div>';
  h += '<section class="card"><div class="eyebrow">La prise, annotée</div>' + timeline(t) + '</section>';
  const evs = (t.events || []).filter(e => e.type !== "silence").slice(0, 40);
  if (evs.length) h += '<details class="why"><summary>Les ' + evs.length + ' moments à revoir</summary><ul class="v9-evl">' + evs.map(e => '<li><button class="link" data-act="v9-seek" data-t="' + e.t + '">' + fmtSec(e.t) + '</button><i style="background:' + EVC[e.type][1] + '"></i>' + esc(e.lab) + (e.d ? ' · ' + comma(e.d) + ' s' : "") + '</li>').join("") + '</ul></details>';
  h += '<section class="card"><div class="eyebrow">Mon évaluation</div>' + gridCard(t.grid) + '</section>';
  if (t.text) h += '<details class="why"><summary>La transcription</summary><p class="transcript">' + esc(t.text) + '</p></details>';
  h += '<section class="card"><div class="eyebrow">Garder, partager</div><div class="v9-share">' +
    (t.noVideo ? "" : '<button class="btn" data-act="v9-dl-video" data-id="' + t.id + '">Télécharger la vidéo</button>') +
    '<button class="btn" data-act="v9-dl-pdf" data-id="' + t.id + '">Fiche PDF</button>' +
    '<button class="btn ghost" data-act="v9-share" data-id="' + t.id + '">Envoyer à un mentor</button></div>' +
    '<div class="row-wrap v9-danger">' + (t.noVideo ? "" : '<button class="link small" data-act="v9-del-video" data-id="' + t.id + '">Supprimer la vidéo, garder la fiche</button>') + '<button class="link small" data-act="v9-del" data-id="' + t.id + '">Supprimer la prise</button></div></section>';
  setTimeout(() => bindPlayer(t, ""), 0);
  return h;
}
function viewCompare(ids) {
  const L = S.v9.list || [], A = L.find(x => x.id === ids[0]), B = L.find(x => x.id === ids[1]);
  if (!A || !B) { S.v9.cmpView = null; return viewVideos(); }
  const [P, Q] = A.at <= B.at ? [A, B] : [B, A];
  let h = '<header class="sess-top"><button class="icon-btn" data-act="v9-back" aria-label="Retour">' + ICON.close + '</button><div class="sess-title"><b>Avant / après</b><span>' + esc(dateFR(P.at)) + ' → ' + esc(dateFR(Q.at)) + '</span></div><span></span></header>';
  h += '<div class="v9-cmp">' + [P, Q].map((t, i) => '<figure><figcaption>' + (i ? "Après" : "Avant") + ' · ' + esc(dateFR(t.at)) + '</figcaption>' + (t.noVideo ? '<div class="v9-novid">Vidéo supprimée</div>' : t.kind === "audio" ? '<audio id="v9-v' + i + '" controls></audio>' : '<video id="v9-v' + i + '" controls playsinline' + (i ? '' : ' muted') + ' preload="metadata"></video>') + timeline(t, String(i)) + '</figure>').join("") + '</div>';
  h += '<button class="btn wide" data-act="v9-sync">Lire les deux en même temps</button><p class="small muted center">Le son de la première est coupé pour ne pas superposer les voix.</p>';
  h += '<section class="card"><div class="eyebrow">Critère par critère</div><table class="v9-tab"><thead><tr><th>Critère</th><th>Avant</th><th>Après</th><th>Écart</th></tr></thead><tbody>' +
    Object.keys(CRIT).map(k => { const a = P.grid && P.grid.g[k], b = Q.grid && Q.grid.g[k], d = a && b ? b.s - a.s : null; return '<tr><td>' + esc(CRIT[k].t) + '</td><td>' + (a ? a.s : "·") + '</td><td>' + (b ? b.s : "·") + '</td><td class="' + (d > 0 ? "up" : d < 0 ? "down" : "") + '">' + (d === null ? "·" : d > 0 ? "+" + d : d) + '</td></tr>'; }).join("") +
    '<tr class="tot"><td>Note globale</td><td>' + (P.grid && P.grid.glob ? comma(P.grid.glob) : "·") + '</td><td>' + (Q.grid && Q.grid.glob ? comma(Q.grid.glob) : "·") + '</td><td>' + (P.grid && Q.grid && P.grid.glob && Q.grid.glob ? (Q.grid.glob - P.grid.glob >= 0 ? "+" : "") + comma(r1(Q.grid.glob - P.grid.glob)) : "·") + '</td></tr></tbody></table>' + cmpVerdict(P, Q) + '</section>';
  setTimeout(() => { bindPlayer(P, "0"); bindPlayer(Q, "1"); }, 0);
  return h;
}
function cmpVerdict(P, Q) {
  if (!P.grid || !Q.grid) return "";
  const d = Object.keys(CRIT).filter(k => P.grid.g[k] && Q.grid.g[k]).map(k => [k, Q.grid.g[k].s - P.grid.g[k].s]).sort((a, b) => b[1] - a[1]);
  if (!d.length) return "";
  const up = d.filter(x => x[1] > 0), dn = d.filter(x => x[1] < 0);
  return '<p class="small">' + (up.length ? "Progrès net en " + up.slice(0, 2).map(x => CRIT[x[0]].t.toLowerCase()).join(" et ") + ". " : "Pas encore de progrès mesurable : c’est normal sur deux prises proches. ") + (dn.length ? "À surveiller : " + CRIT[dn[dn.length - 1][0]].t.toLowerCase() + "." : "") + '</p>';
}
async function bindPlayer(t, k) {
  const v = $("#v9-v" + k); if (!v || t.noVideo) return;
  const u = await blobUrl(t.id); if (!u || !document.body.contains(v)) return;
  if (t.kind !== "audio") fixDuration(v, t.dur);
  v.src = u;
  const head = $("#v9-head" + k), dur = Math.max(1, t.dur || 1);
  v.addEventListener("timeupdate", () => { if (head) head.style.left = clamp(v.currentTime / dur * 100, 0, 100) + "%"; });
}
function installCard() {
  if (!V9.installEvt) return "";
  return '<section class="card"><div class="eyebrow">Sur ce téléphone</div><p>Installez Le Verbe Souverain comme une application : icône sur l’écran d’accueil, fonctionnement sans Internet.</p><button class="btn" data-act="v9-install">Installer l’application</button></section>';
}
async function lighten() {
  const L = await Takes.list(), old = Date.now() - 30 * 864e5, first = L[L.length - 1];
  const del = L.filter(t => !t.noVideo && !t.fav && t.at < old && (!first || t.id !== first.id));
  if (!del.length) { toast("Rien à alléger : aucune vidéo de plus de 30 jours hors favoris."); return; }
  for (const t of del) await Takes.del(t.id, true);
  await refreshList(); toast("Vidéothèque allégée.");
}

// =====================================================================
// 8. EXPORTER ET PARTAGER
// =====================================================================
const slug = s => norm(s || "prise").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "prise";
const fileBase = t => "verbe-souverain-" + new Date(t.at).toISOString().slice(0, 10) + "-" + slug(t.title);
async function saveFile(name, blob) {
  try {
    if (window.claude && window.claude.use) {
      const d = await Promise.race([window.claude.use("downloads"), sleep(2500).then(() => null)]);
      if (d) { await d.save({ filename: name, data: blob }); toast("Fichier enregistré : " + name); return true; }
    }
  } catch (e) { if (e && e.code === "declined") return false; }
  const a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
  toast("Téléchargement lancé : " + name); return true;
}
async function exportVideo(id) {
  const t = await Takes.get(id), b = await Takes.blob(id); if (!t || !b) { toast("Vidéo introuvable."); return; }
  const ext = (t.mime || b.type || "").includes("mp4") ? "mp4" : "webm";
  await saveFile(fileBase(t) + "." + ext, b);
}
let pdfLib = null;
function loadPDF() {
  if (window.jspdf) return Promise.resolve(window.jspdf);
  if (pdfLib) return pdfLib;
  pdfLib = new Promise((res, rej) => { const s = document.createElement("script"); s.src = new URL("lib/jspdf.umd.min.js", location.href).href; s.onload = () => res(window.jspdf); s.onerror = () => { pdfLib = null; rej(new Error("pdf")); }; document.head.appendChild(s); });
  return pdfLib;
}
// Le PDF n'accepte que les caractères latins courants : on remplace les autres.
const pdfSafe = s => String(s || "").replace(/[  ]/g, " ").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/→/g, "->").replace(/[✓✗•◆◉▮≡♥★☆]/g, "").replace(/[^\x00-\xFF‘’“”…Œœ–—€]/g, "");
async function buildPDF(t) {
  const { jsPDF } = await loadPDF();
  const doc = new jsPDF({ unit: "mm", format: "a4" }), W = 210, M = 20, TW = W - 2 * M; let y = M;
  const font = (st, sz) => { doc.setFont("times", st); doc.setFontSize(sz); };
  const need = h => { if (y + h > 297 - M) { doc.addPage(); y = M; } };
  const para = (txt, sz, st, just) => { font(st || "normal", sz || 12); const lines = doc.splitTextToSize(pdfSafe(txt), TW); const lh = (sz || 12) * 0.3528 * 1.15; lines.forEach((ln, i) => { need(lh); doc.text(ln, M, y, just && i < lines.length - 1 ? { align: "justify", maxWidth: TW } : undefined); y += lh; }); };
  doc.setTextColor(0, 0, 0);
  font("bold", 18); doc.text("Le Verbe Souverain", M, y + 2); y += 9;
  font("normal", 12); doc.text(pdfSafe("Fiche d'évaluation d'une prise de parole"), M, y); y += 6;
  doc.setDrawColor(40, 58, 154); doc.setLineWidth(0.6); doc.line(M, y, W - M, y); y += 7;
  para(t.title + " · " + dateFR(t.at) + " à " + hourFR(t.at) + " · durée " + fmtSec(t.dur) + (t.budget ? " pour " + fmtSec(t.budget) + " visées" : ""), 12, "bold");
  if (t.sujet) { y += 1; para("Sujet : " + t.sujet, 12, "normal", true); }
  if (t.thumb) { try { need(52); doc.addImage(t.thumb, "JPEG", M, y + 2, 80, 45); y += 50; } catch (e) { } }
  y += 3;
  if (t.grid && t.grid.glob) {
    font("bold", 14); need(10); doc.text(pdfSafe("Note globale : " + comma(t.grid.glob) + " / 5"), M, y); y += 8;
    // Tableau des critères
    const cw = [42, 16, TW - 58]; need(9);
    doc.setFillColor(225, 229, 247); doc.rect(M, y - 5, TW, 8, "F"); font("bold", 11);
    doc.text(pdfSafe("Critère"), M + 2, y); doc.text("Note", M + cw[0] + 2, y); doc.text("Mesure", M + cw[0] + cw[1] + 2, y); y += 6;
    Object.keys(CRIT).forEach(k => {
      const x = t.grid.g[k]; font("normal", 11);
      const ml = doc.splitTextToSize(pdfSafe(x ? x.m : "Non mesuré sur cette prise."), cw[2] - 4), hh = Math.max(1, ml.length) * 4.7 + 2.5;
      need(hh); doc.setDrawColor(210, 214, 228); doc.setLineWidth(0.2); doc.line(M, y - 4.2, W - M, y - 4.2);
      font("bold", 11); doc.text(pdfSafe(CRIT[k].t), M + 2, y); doc.text(x ? x.s + " / 5" : "-", M + cw[0] + 2, y);
      font("normal", 11); ml.forEach((ln, i) => doc.text(ln, M + cw[0] + cw[1] + 2, y + i * 4.7)); y += hh;
    });
    y += 4;
    if (t.grid.weak) { font("bold", 13); need(8); doc.text(pdfSafe("Priorité : " + CRIT[t.grid.weak].t), M, y); y += 6; para(t.grid.g[t.grid.weak].c, 12, "normal", true); y += 2; }
    if (t.grid.strong && t.grid.strong !== t.grid.weak) { para("Point fort : " + CRIT[t.grid.strong].t.toLowerCase() + " (" + t.grid.g[t.grid.strong].s + "/5).", 12, "italic"); y += 2; }
  }
  const ev = (t.events || []).filter(e => e.type !== "silence");
  if (ev.length) { y += 2; font("bold", 13); need(8); doc.text(pdfSafe("Moments à revoir"), M, y); y += 6; para(ev.slice(0, 24).map(e => fmtSec(e.t) + " " + e.lab).join(" ; ") + (ev.length > 24 ? " ; …" : "") + ".", 11, "normal", true); }
  const sil = (t.events || []).filter(e => e.type === "silence").length; if (sil) para(sil + " silence" + (sil > 1 ? "s" : "") + " d'orateur (plus de 1,2 s) : c'est un atout.", 11, "italic");
  if (t.text) { y += 3; font("bold", 13); need(8); doc.text("Transcription", M, y); y += 6; para(t.text.slice(0, 3500) + (t.text.length > 3500 ? " […]" : ""), 11, "normal", true); }
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); font("normal", 10); doc.setTextColor(60, 60, 60); doc.text(pdfSafe("Mesures automatiques réalisées sur l'appareil · page " + i + " sur " + pages), M, 297 - 10); }
  return doc.output("blob");
}
async function exportPDF(id) {
  const t = await Takes.get(id); if (!t) return;
  try { const b = await buildPDF(t); await saveFile(fileBase(t) + ".pdf", b); } catch (e) { console.error(e); toast("La fiche PDF n’a pas pu être créée."); }
}
async function shareTake(id) {
  const t = await Takes.get(id); if (!t) return;
  let pdf = null; try { pdf = await buildPDF(t); } catch (e) { }
  const vb = t.noVideo ? null : await Takes.blob(id), ext = (t.mime || "").includes("mp4") ? "mp4" : "webm";
  const files = []; if (vb) files.push(new File([vb], fileBase(t) + "." + ext, { type: vb.type || "video/" + ext })); if (pdf) files.push(new File([pdf], fileBase(t) + ".pdf", { type: "application/pdf" }));
  const msg = "Ma prise de parole du " + dateFR(t.at) + (t.grid && t.grid.glob ? " (note " + comma(t.grid.glob) + "/5)" : "") + ". Votre regard m’aiderait : que dois-je corriger en priorité ?";
  try { if (navigator.canShare && files.length && navigator.canShare({ files })) { await navigator.share({ files, title: "Le Verbe Souverain", text: msg }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  toast("Partage direct indisponible ici : je télécharge la vidéo et la fiche, à joindre à votre message.");
  for (const f of files) await saveFile(f.name, f);
  try { await navigator.clipboard.writeText(msg); toast("Message pour votre mentor copié."); } catch (e) { }
}

// =====================================================================
// 9. AUTONOMIE : la négociation sans IA, mesures dans le bilan
// =====================================================================
const NEGO_PUSH = ["Je comprends vos arguments, mais la décision du siège est prise. Que proposez-vous concrètement ?", "Nous ne pouvons rien ajouter au budget cette année. Où êtes-vous prêt à couper ?", "Si je vous accorde un délai, quelle garantie me donnez-vous sur les résultats ?"];
function negoCheck(text, objectif) {
  const t = norm(text || "");
  const keys = norm(objectif || "").replace(/[^a-z ]/g, " ").split(/\s+/).filter(w => w.length >= 7).slice(0, 8);
  const obj = keys.length ? new RegExp("(essentiel|priorit|" + keys.map(w => w.slice(0, 6)).join("|") + ")") : /(essentiel|priorit|objectif)/;
  const C = [
    ["Reconnaître la contrainte", /(je comprends|j'entends|vous avez raison|je mesure|c'est legitime|votre contrainte|la pression)/],
    ["Question ouverte", /(comment |pourquoi|qu'est-ce qui|quels? |quelles? |dans quelle mesure|qu'attend|de quoi)/],
    ["Reformuler", /(si je comprends bien|autrement dit|vous dites que|si je vous suis|en d'autres termes)/],
    ["Proposer des options", /(et si|nous pourrions|je propose|une option|plusieurs options|alternative|echelonn|cofinanc|report|delai|realloc|phase)/],
    ["Défendre votre objectif", obj],
    ["Préserver la relation", /(ensemble|partenariat|merci|confiance|nous partageons|notre objectif commun)/]
  ];
  const got = C.map(([l, re]) => [l, re.test(t)]), n = got.filter(x => x[1]).length;
  return { got, s: clamp(Math.round(1 + n * 4 / 6), 1, 5) };
}
const _sim = CARD.sim;
CARD.sim = function (c, info) {
  if (coachOn()) return _sim(c, info);
  const P = info.pack, N = P.nego, r = R("nego");
  let h = photo("reseau", "Négociation") + ttl("La négociation") + '<div class="filrouge"><span>Situation</span><b>' + esc(N.contexte) + '</b></div><div class="tip"><span>Votre objectif</span><b>' + esc(N.objectif) + '</b></div>';
  h += '<div class="chat"><div class="bub them">' + esc(N.open && N.open[1] || "") + '</div>' + NEGO_PUSH.map(x => '<div class="bub them">' + esc(x) + '</div>').join("") + '</div>';
  h += '<div class="cx-aud">' + audBtn("nego" + P.d, "Écouter votre interlocutrice", true) + '</div>';
  h += '<p class="small muted">Répondez-lui en une seule prise de deux minutes : reconnaître sa contrainte, poser une question ouverte, reformuler, proposer au moins deux options, défendre votre objectif, préserver la relation.</p>';
  h += speechBox("nego", { kind: "négociation filmée", consigne: N.contexte + " Objectif : " + N.objectif, target: 120 });
  const rr = R("nego");
  if (rr.text && rr.text.split(/\s+/).length >= 15) { const k = negoCheck(rr.text, N.objectif); rr.nego = k.s; h += '<div class="coach"><div class="coach-h">Les gestes du négociateur · ' + k.s + '/5</div><ul class="v9-check">' + k.got.map(([l, ok]) => '<li class="' + (ok ? "ok" : "ko") + '">' + (ok ? "✓ " : "✗ ") + esc(l) + '</li>').join("") + '</ul></div>'; }
  return h;
};
const _gather9 = gatherObs;
gatherObs = function (c) {
  const O = _gather9(c), add = (k, v, w) => { if (DIMS[k] && v >= 1 && v <= 5) O.push({ k, v, w, src: "mesure" }); };
  Object.values(c.res || {}).forEach(x => {
    if (!x || !x.grid || !x.grid.g) return; const g = x.grid.g, m = ks => { const v = ks.filter(k => g[k]).map(k => g[k].s); return v.length ? mean(v) : 0; };
    add("corps", m(["ancrage", "regard", "pathos"]), 1); add("verbal", m(["diction", "parasites"]), 1); add("pensee", m(["structure"]), 0.8); add("confiance", m(["regard", "ancrage"]), 0.6);
  });
  if (c.res && c.res.nego && c.res.nego.nego) add("nego", c.res.nego.nego, 1);
  return O;
};

// =====================================================================
// 10. NAVIGATION, RENDU, INSTALLATION HORS LIGNE
// =====================================================================
(function addNav() {
  const nav = $("#nav .in"); if (!nav || nav.querySelector('[data-r="videos"]')) return;
  const b = document.createElement("button"); b.dataset.act = "go"; b.dataset.r = "videos";
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10.5 5-3v9l-5-3z"/></svg><span>Vidéos</span>';
  const prog = nav.querySelector('[data-r="prog"]'); nav.insertBefore(b, prog ? prog.nextSibling : null);
})();
const _render8 = render;
render = function () {
  if (S.route === "videos") {
    const main = $("#main"), nav = $("#nav"); let h = "";
    try { h = viewVideos(); } catch (e) { console.error(e); h = '<section class="card"><p>La vidéothèque n’a pas pu s’afficher.</p><button class="btn" data-act="go" data-r="home">Accueil</button></section>'; }
    const key = "videos:" + (S.v9.take || "") + ":" + (S.v9.cmpView || []).join(",");
    main.innerHTML = h; nav.hidden = !!(S.v9.take || S.v9.cmpView);
    $$("#nav button").forEach(b => b.classList.toggle("on", b.dataset.r === "videos"));
    if (V9.lastKey !== key) { window.scrollTo(0, 0); V9.lastKey = key; }
    Pip.paint(); return;
  }
  V9.lastKey = null; _render8(); Pip.paint();
};
// Accueil : accès direct à la vidéothèque et état du mode autonome
const _home9 = viewHome;
viewHome = function () {
  let h = _home9();
  const L = S.v9.list; if (L === null && !S.v9.loadingList) { S.v9.loadingList = true; refreshList().then(() => { S.v9.loadingList = false; if (S.route === "home") render(); }); }
  if (L && L.length) {
    const last = L[0];
    h += '<section class="card"><div class="row-between"><div><div class="eyebrow">Dernière prise</div><h3>' + esc(last.title) + '</h3><p class="small muted">' + esc(dateFR(last.at)) + (last.grid && last.grid.glob ? ' · ' + comma(last.grid.glob) + '/5' : "") + '</p></div><button class="btn sm" data-act="v9-open" data-id="' + last.id + '">Revoir</button></div></section>';
  }
  h += installCard();
  if (isFile) h += '<section class="card warn-card"><p><b>Ouverte comme simple fichier</b>, l’application ne peut pas charger la transcription ni l’analyse du corps. Ouvrez-la depuis son adresse en ligne ou installée.</p></section>';
  return h;
};
// Libellé du bouton de prise : une seule action, « Me filmer »
const _sbox9 = speechBox;
speechBox = function (id, o) { return _sbox9(id, o).replace(/<span>Ouvrir le studio pour me filmer<\/span>/, "<span>Me filmer</span>").replace(/<span>Ouvrir le studio pour me filmer/, "<span>Me filmer"); };
// La carte « studio » décrit le studio réellement disponible
CARD.studio = function () {
  const ok = Studio.ok(), inPage = camAllowedHere();
  return '<div class="meteo-ic" aria-hidden="true">' + ILL.target() + '</div>' + ttl(ok ? "Studio prêt" : "Votre studio") +
    line(ok ? (Studio.inPage ? "Caméra et micro actifs. L’aperçu reste en bas à droite." : "Caméra et micro actifs. Gardez la petite fenêtre ouverte.") : inPage ? "La caméra et le micro s’ouvrent dans la page. Autorisez-les une fois : le navigateur s’en souviendra." : "Une petite fenêtre tiendra la caméra et le micro. Autorisez-les une fois.") +
    (ok ? big("cnext", "Commencer la séance") : '<button class="btn wide big-act2" data-act="studio-open">Ouvrir la caméra et le micro</button>' + studioHelp() + '<p class="small muted center">Sans caméra, la séance fonctionne, mais je ne peux évaluer ni la voix ni le corps.</p>');
};
// La scène d'enregistrement suspend le passage automatique à l'étape suivante
const _busy8 = busy8;
busy8 = function (c) { return RecStage.on || _busy8(c); };

// Application installable, hors ligne
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); V9.installEvt = e; if (S.route === "home" || S.route === "videos") render(); });
if ("serviceWorker" in navigator && !IN_FRAME && !window.claude && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => { }); });
}
render();
})();
