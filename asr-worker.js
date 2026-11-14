// Le Verbe Souverain : transcription en arrière-plan (fil séparé).
// La page reste fluide pendant que Whisper écoute vos enregistrements.
let T = null, pipe = null, loading = null, cfg = null;
const CACHE = "vs-asr-v1", q = [];
let busy = false, patched = false;

function targets() {
  const b = cfg.base;
  return { [b + "ort-wasm-simd-threaded.jsep.wasm"]: "ort.wasm", [b + "wb/onnx/encoder_model_quantized.onnx"]: "enc.onnx", [b + "wb/onnx/decoder_model_merged_quantized.onnx"]: "dec.onnx" };
}
async function cacheGet(k) { try { const c = await caches.open(CACHE); const r = await c.match(k); return r ? await r.arrayBuffer() : null; } catch (e) { return null; } }
async function cachePut(k, buf, type) { try { const c = await caches.open(CACHE); await c.put(k, new Response(buf, { headers: { "Content-Type": type } })); } catch (e) { } }
function patchFetch() {
  if (patched) return; patched = true;
  const orig = self.fetch.bind(self), Tg = targets();
  const total = Object.values(cfg.parts).reduce((a, p) => a + p.size, 0); let loaded = 0;
  self.fetch = async function (input, init) {
    const url = new URL(typeof input === "string" ? input : input.url, cfg.base).href, name = Tg[url];
    if (!name) return orig(input, init);
    const type = name.endsWith("wasm") ? "application/wasm" : "application/octet-stream";
    let buf = await cacheGet(url);
    if (!buf) {
      const P = cfg.parts[name], chunks = [];
      for (const p of P.parts) {
        const r = await orig(new URL(p, cfg.page).href); if (!r.ok) throw new Error("part " + p);
        const b = new Uint8Array(await r.arrayBuffer()); chunks.push(b); loaded += b.byteLength; self.postMessage({ type: "progress", p: Math.min(1, loaded / total) });
      }
      const out = new Uint8Array(P.size); let o = 0; chunks.forEach(c => { out.set(c, o); o += c.byteLength; });
      buf = out.buffer; cachePut(url, buf, type);
    } else { loaded += buf.byteLength; self.postMessage({ type: "progress", p: Math.min(1, loaded / total) }); }
    return new Response(buf, { status: 200, headers: { "Content-Type": type, "Content-Length": String(buf.byteLength) } });
  };
}
function load(m) {
  if (pipe) return Promise.resolve(pipe);
  if (loading) return loading;
  cfg = { base: m.base, page: m.page, parts: m.parts, lib: m.lib };
  loading = (async () => {
    patchFetch();
    T = await import(cfg.lib);
    T.env.allowRemoteModels = false; T.env.allowLocalModels = true;
    T.env.localModelPath = cfg.base; T.env.useBrowserCache = false;
    T.env.backends.onnx.wasm.wasmPaths = cfg.base;
    T.env.backends.onnx.wasm.numThreads = 1; T.env.backends.onnx.wasm.proxy = false;
    pipe = await T.pipeline("automatic-speech-recognition", "wb", { dtype: "q8", device: "wasm" });
    return pipe;
  })().catch(e => { loading = null; throw e; });
  return loading;
}
async function pump() {
  if (busy) return; busy = true;
  while (q.length) {
    const m = q.shift();
    try {
      if (m.type === "load") { await load(m); self.postMessage({ id: m.id, ok: true }); }
      else if (m.type === "run") {
        const p = await load(m);
        const out = await p(m.pcm, m.opts);
        self.postMessage({ id: m.id, ok: true, out: { text: String((out && out.text) || ""), chunks: ((out && out.chunks) || []).map(c => ({ timestamp: c.timestamp, text: c.text })) } });
      }
    } catch (e) { self.postMessage({ id: m.id, ok: false, err: String((e && e.message) || e) }); }
  }
  busy = false;
}
self.onmessage = e => { q.push(e.data); pump(); };
self.postMessage({ type: "hello" });
