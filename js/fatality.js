// Fatalities: al terminar la pelea por KO, el perdedor queda de pie mareado ("¡LÍSALO!") y el ganador ejecuta
// automáticamente su remate propio. Cinemática sólo visual (no toca el estado del motor), por eso es igual en online.
const Fatality = {
  t: 0, done: false, W: null, L: null, fat: null, parts: [], off: null, offCtx: null, shots: [],
  DIZZY: 110, ACT0: 175, ACT1: 345, END: 430,

  // ---- remates por personaje: name, pose del ganador y función que dibuja al perdedor durante el remate (k: 0→1) ----
  FATS: {
    AFE: { name: 'BIOLIXIVIACIÓN TOTAL', pose: ['attack', 'SP'], loser: (F, k) => { F.lightning(k); if (k < 0.5) F.drawL({ tint: k * 4 % 1 < 0.5 ? null : { c1: '#fff', c2: '#ddd', c3: '#fff' } }); else F.drawL({ melt: (k - 0.5) * 2, drips: '#e8641b' }); } },
    AFG: { name: 'PRENSA DE ÓXIDO', pose: ['grab', null], loser: (F, k) => { const n = Math.floor(k * 4); const sq = k < 0.85 ? 1 - 0.18 * n - (k * 4 % 1 > 0.8 ? 0.1 : 0) : 0.12; if (k * 4 % 1 < 0.08 && k < 0.85) F.shake(); F.drawL({ sy: sq, sx: 1 + (1 - sq) * 0.8, tint: { c1: '#9c4a12', c2: '#5a2a08' } }); if (k > 0.85) F.sparks(F.L.x, 20, '#c9571a', 6); } },
    AFD: { name: 'REDUCCIÓN FÉRRICA', pose: ['attack', 'SP'], loser: (F, k) => { F.ring(k, '#ffe08a'); const g = Math.min(1, k * 1.6); F.drawL({ tint: { c1: F.mix(F.rL.c1, '#777', g), c2: F.mix(F.rL.c2, '#444', g), c3: '#999', eye: '#bbb' }, pieces: k > 0.7 ? (k - 0.7) / 0.3 : 0, crumble: true }); } },
    AFP: { name: 'HAMBRE DE HIERRO', pose: ['grab', null], loser: (F, k) => { F.drain(k, F.rL.c1); const sc = 1 - 0.7 * Math.min(1, k * 1.3); F.drawL({ sx: sc, sy: sc, tint: { c1: F.mix(F.rL.c1, '#3a2a1a', k), c2: '#2a1a0a' } }); F.W.grow = 1 + 0.25 * Math.min(1, k * 1.3); } },
    AFV: { name: 'CERO ABSOLUTO', pose: ['attack', 'SP'], loser: (F, k) => { if (k < 0.55) { F.frost(k / 0.55); F.drawL({ tint: { c1: F.mix(F.rL.c1, '#bfe9ff', k / 0.55), c2: F.mix(F.rL.c2, '#6fb8e0', k / 0.55), c3: '#fff', eye: '#dff' } }); } else { if (k < 0.58) F.shake(); F.drawL({ tint: { c1: '#bfe9ff', c2: '#6fb8e0', c3: '#fff' }, pieces: (k - 0.55) / 0.45, shatter: true }); } } },
    AFN: { name: 'MARTILLO pH 1,8', pose: ['attack', 'SP'], loser: (F, k) => { if (k < 0.2) F.drawL({ tint: null }); else { const u = (k - 0.2) / 0.8; F.drawL({ dy: -u * u * 900, dx: F.dir * u * 120, rot: u * 9, sx: 1 - u * 0.6, sy: 1 - u * 0.6 }); if (u > 0.9) F.twinkle(F.L.x + F.dir * 120, 520); } } },
    ATH: { name: 'LLUVIA SULFÚRICA', pose: ['attack', 'SP'], loser: (F, k) => { F.rain(k, '#b9ff3c'); F.drawL({ melt: Math.min(1, k * 1.2), drips: '#b9ff3c', tint: { c1: F.mix(F.rL.c1, '#b9ff3c', k * 0.6) } }); } },
    ASU: { name: 'ARRASTRE FERRUGINOSO', pose: ['attack', 'SP'], loser: (F, k) => { F.wave(k, '#9bd8ff'); const u = Math.max(0, (k - 0.25) / 0.75); F.drawL({ dx: F.dir * u * 700, dy: -Math.sin(u * 6) * 30, rot: u * 12 }); } },
    ACO: { name: 'ENTIERRO DE HORMIGÓN', pose: ['attack', 'SP'], loser: (F, k) => { F.drawL({ tint: null, dy: 0 }); F.blocks(k); if (k > 0.9) F.sparks(F.L.x, 60, '#ccc', 3); } },
    AMO: { name: 'FLUJO PIROCLÁSTICO', pose: ['attack', 'SP'], loser: (F, k) => { F.ash(k); const g = Math.min(1, k * 1.5); F.drawL({ tint: { c1: F.mix(F.rL.c1, '#6a6a6a', g), c2: F.mix(F.rL.c2, '#3a3a3a', g), c3: '#888', eye: '#999' }, pieces: k > 0.75 ? (k - 0.75) / 0.25 : 0, crumble: true }); } },
    AMA: { name: 'TSUNAMI SALINO', pose: ['attack', 'SP'], loser: (F, k) => { F.wave(k, '#e8fbff', 1.6); const u = Math.max(0, (k - 0.3) / 0.7); F.drawL({ dx: F.dir * u * 800, dy: -u * 120, rot: -u * 8, tint: { c1: F.mix(F.rL.c1, '#fff', u), c2: F.mix(F.rL.c2, '#ddd', u) } }); } },
    FCA: { name: 'COMBUSTIÓN A 45 °C', pose: ['attack', 'SP'], loser: (F, k) => { F.fire(k); const g = Math.min(1, k * 1.4); F.drawL({ tint: { c1: F.mix(F.rL.c1, '#1a1010', g), c2: F.mix(F.rL.c2, '#000', g), c3: '#ff6b2b', eye: '#f80' }, pieces: k > 0.8 ? (k - 0.8) / 0.2 : 0, crumble: true }); } },
    ICO: { name: 'ERUPCIÓN DEL COPAHUE', pose: ['attack', 'SP'], loser: (F, k) => { F.column(k, '#ffcc3a', '#ff5a2a'); const u = Math.max(0, (k - 0.3) / 0.7); F.drawL({ dy: -u * u * 700, rot: u * 7, tint: { c1: F.mix(F.rL.c1, '#ff5a2a', u), c2: F.mix(F.rL.c2, '#8a1c23', u) } }); } },
    IYE: { name: 'OLD FAITHFUL', pose: ['attack', 'SP'], loser: (F, k) => { F.column(k, '#bff4ff', '#fff'); const u = Math.max(0, (k - 0.3) / 0.7); F.drawL({ dy: -u * u * 700, rot: -u * 5, sx: 1 - u * 0.4, sy: 1 - u * 0.4 }); } },
    ITA: { name: 'NIEBLA CORTANTE', pose: ['attack', 'SP'], loser: (F, k) => { F.slashes(k); F.drawL(k < 0.6 ? { tint: null } : { pieces: (k - 0.6) / 0.4, slices: true }); } },
    AMS: { name: 'NOVA DE NITRÓGENO', pose: ['attack', 'SP'], loser: (F, k) => { F.beam(k, '#c9ff5e'); const u = Math.max(0, (k - 0.35) / 0.65); F.drawL({ alpha: 1 - u, tint: { c1: F.mix(F.rL.c1, '#fff', Math.min(1, k * 2)), c2: F.mix(F.rL.c2, '#c9ff5e', Math.min(1, k * 2)) } }); if (u > 0) F.sparks(F.L.x + (Math.random() - 0.5) * 60, 40 + Math.random() * 100, '#c9ff5e', 1); } },
    TTP: { name: 'BAÑO ROMANO A PRESIÓN', pose: ['attack', 'SP'], loser: (F, k) => { F.steam(k); const u = Math.min(1, k * 1.3); F.drawL(k < 0.85 ? { sx: 1 + u * 0.5, sy: 1 + u * 0.35, tint: { c1: F.mix(F.rL.c1, '#ff5a3a', u), c2: F.mix(F.rL.c2, '#b01a1a', u) } } : { alpha: 0 }); if (k >= 0.85 && k < 0.9) { F.shake(); F.sparks(F.L.x, 80, '#fff', 8); } } }
  },

  start(st) {
    const w = st.winner, l = 1 - w;
    this.W = { id: st.f[w].id, x: st.f[w].x, y: 0, face: st.f[l].x >= st.f[w].x ? 1 : -1, st: 'idle', t: 0, grow: 1, inv: 0 };
    this.L = { id: st.f[l].id, x: st.f[l].x, y: 0, face: -this.W.face, st: 'dizzy', t: 0, inv: 0 };
    this.rW = ROSTER_BY_ID[this.W.id]; this.rL = ROSTER_BY_ID[this.L.id]; this.dir = this.W.face;
    this.L.x = Math.max(120, Math.min(ARENA_W - 120, this.L.x)); this.fat = this.FATS[this.W.id];
    this.t = 0; this.done = false; this.parts = []; this.shots = []; this.shakeT = 0;
    if (!this.off) { this.off = document.createElement('canvas'); this.off.width = 360; this.off.height = 300; this.offCtx = this.off.getContext('2d'); }
    Render.banner = { text: '¡LÍSALO!', sub: 'FATALITY', t: 100, col: '#ff3b3b', y: 130 }; Audio.sfx('round');
  },
  update() {
    this.t++; const t = this.t;
    if (t === this.DIZZY) { this.W.st = 'walk'; }
    if (t > this.DIZZY && t < this.ACT0) { const target = this.L.x - this.dir * 115; if (Math.abs(this.W.x - target) > 5) { this.W.x += Math.sign(target - this.W.x) * 5; this.W.st = 'walk'; this.W.t = t; } else this.W.st = 'idle'; }
    if (t === this.ACT0) { const [s, m] = this.fat.pose; this.W.st = s; this.W.move = m; this.W.t = 0; this.W.sp = this.rW.special; this.W.spT = [14, 60, 400]; Audio.sfx('od'); }
    if (t > this.ACT0 && t < this.ACT1) { this.W.t = Math.min(this.W.t + 1, 14); }
    if (t === this.ACT0 + 40) Audio.sfx('ko');
    if (t === this.ACT1) { this.W.st = 'victory'; this.W.t = 0; Render.banner = { text: 'FATALITY', sub: this.rW.id + ' · ' + this.fat.name, t: 99999, col: '#ff3b3b', y: 130 }; Audio.sfx('explode'); }
    if (t >= this.END) this.done = true;
    this.parts = this.parts.filter(p => p.life > 0); for (const p of this.parts) { p.x += p.vx; p.y += p.vy; p.vy -= 0.25; p.life--; }
  },
  // ---- helpers de dibujo ----
  mix(a, b, k) { const h = c => { if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }; const A = h(a), B = h(b); k = Math.max(0, Math.min(1, k)); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); },
  shake() { Render.shakeExtra = 10; },
  sparks(x, y, col, n) { for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 6, life: 30 + Math.random() * 20, col, r: 3 + Math.random() * 4 }); },
  // dibuja al perdedor con efectos: tint (colores), alpha, sx/sy, rot, dx/dy, melt (0→1 se derrite de arriba abajo), pieces (0→1 se rompe en trozos)
  drawL(o) {
    const ctx = this.ctx, L = this.L, X = Render.sx(L.x), Y = Render.sy(0);
    if (o.alpha === 0) return;
    if (o.pieces > 0) { this.drawPieces(o); return; }
    ctx.save(); ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    ctx.translate(X + (o.dx || 0), Y + (o.dy || 0)); ctx.rotate((o.rot || 0) * this.dir); ctx.scale(o.sx || 1, o.sy || 1);
    if (o.melt > 0) { const h = 190 * (1 - o.melt); ctx.beginPath(); ctx.rect(-150, -h, 300, h + 5); ctx.clip(); ctx.translate(0, 190 * o.melt * 0.9); }
    FighterDraw.draw(ctx, L, this.t, 0, 0, 1, o.tint || null);
    ctx.restore();
    if (o.melt > 0) { ctx.fillStyle = o.drips || this.rL.c1; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(X, Y + 4, 30 + o.melt * 60, 8 + o.melt * 8, 0, 0, 7); ctx.fill(); for (let i = 0; i < 6; i++) { const dx = (i - 2.5) * 14, hh = 190 * (1 - o.melt); ctx.fillRect(X + dx, Y - hh - 10, 5, 14 + ((this.t * 3 + i * 17) % 40)); } ctx.globalAlpha = 1; }
  },
  drawPieces(o) {
    const oc = this.offCtx, L = this.L; oc.clearRect(0, 0, 360, 300);
    FighterDraw.draw(oc, L, this.t, 180, 290, 1, o.tint || null);
    const X = Render.sx(L.x), Y = Render.sy(0), k = o.pieces, ctx = this.ctx;
    const rows = o.slices ? 3 : 5, cols = o.slices ? 1 : 2, pw = 360 / cols, ph = 300 / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, s = Math.sin(i * 12.9898) * 43758.5453, h = s - Math.floor(s);
      const vx = (c === 0 ? -1 : 1) * (0.5 + h) * 120 * k + (o.slices ? (r - 1) * 60 * k : 0), vy = o.crumble ? 200 * k * k : -(120 * h * k) + 350 * k * k, rot = (h - 0.5) * 3 * k;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k * (o.crumble ? 1.1 : 0.7));
      ctx.translate(X + vx, Y - 290 + r * ph + ph / 2 + vy); ctx.rotate(rot); ctx.scale(this.dir, 1);
      ctx.drawImage(this.off, c * pw, r * ph, pw, ph, -180 + c * pw, -ph / 2, pw, ph); ctx.restore();
    }
    if (o.shatter && k < 0.3) for (let i = 0; i < 2; i++) this.sparks(L.x + (Math.random() - 0.5) * 60, 40 + Math.random() * 120, '#dff6ff', 2);
  },
  lightning(k) { const ctx = this.ctx, X = Render.sx(this.L.x), Y = Render.sy(0); if (k > 0.5) return; ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.shadowColor = '#fff'; ctx.shadowBlur = 20; for (let b = 0; b < 3; b++) { ctx.beginPath(); let x = Render.sx(this.W.x) + this.dir * 40, y = Y - 100; ctx.moveTo(x, y); for (let i = 0; i < 8; i++) { x += (X - x) / (8 - i); y += (Math.random() - 0.5) * 50; ctx.lineTo(x, y); } ctx.stroke(); } ctx.shadowBlur = 0; },
  ring(k, col) { const ctx = this.ctx; ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.globalAlpha = 0.6; for (let i = 0; i < 3; i++) { const r = ((k * 400 + i * 80) % 240); ctx.beginPath(); ctx.arc(Render.sx(this.W.x), Render.sy(80), 240 - r, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; },
  drain(k, col) { const ctx = this.ctx; ctx.fillStyle = col; for (let i = 0; i < 8; i++) { const u = (k * 3 + i / 8) % 1; ctx.globalAlpha = 0.8 * (1 - u); ctx.beginPath(); ctx.arc(Render.sx(this.L.x + (this.W.x - this.L.x) * u), Render.sy(80 + Math.sin(u * 9 + i) * 25), 7, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; },
  frost(k) { const ctx = this.ctx, X = Render.sx(this.L.x), Y = Render.sy(0); ctx.fillStyle = 'rgba(220,245,255,0.8)'; for (let i = 0; i < 12 * k; i++) { const a = i * 0.9, r = 40 + (i % 4) * 25; ctx.beginPath(); ctx.moveTo(X + Math.cos(a) * r, Y - 80 + Math.sin(a) * r); ctx.lineTo(X + Math.cos(a + 0.2) * (r + 18), Y - 80 + Math.sin(a + 0.2) * (r + 18)); ctx.lineTo(X + Math.cos(a + 0.4) * r, Y - 80 + Math.sin(a + 0.4) * r); ctx.fill(); } },
  twinkle(x, y) { const ctx = this.ctx; ctx.fillStyle = '#fff'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 4 : 14; ctx.lineTo(Render.sx(x) + Math.cos(i * 0.785) * r, Render.sy(y) + Math.sin(i * 0.785) * r); } ctx.fill(); },
  rain(k, col) { const ctx = this.ctx, X = Render.sx(this.L.x); ctx.fillStyle = col; for (let i = 0; i < 30; i++) { const x = X + ((i * 37) % 160) - 80, y = ((this.t * 9 + i * 53) % 460); ctx.fillRect(x, y, 3, 16); } ctx.fillStyle = 'rgba(185,255,60,0.25)'; ctx.fillRect(X - 110, 0, 220, Render.GY); },
  wave(k, col, big = 1) { const ctx = this.ctx, x = Render.sx(this.W.x + this.dir * (60 + k * 900)), h = 220 * big; ctx.fillStyle = col; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.moveTo(x - this.dir * 160, Render.GY); ctx.quadraticCurveTo(x - this.dir * 100, Render.GY - h, x + this.dir * 60, Render.GY - h * 0.9); ctx.quadraticCurveTo(x + this.dir * 70, Render.GY - h * 0.4, x + this.dir * 40, Render.GY); ctx.fill(); ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(x - this.dir * 40 + (i - 4) * 16, Render.GY - h * 0.85 + Math.sin(this.t * 0.3 + i) * 10, 10, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; },
  blocks(k) { const ctx = this.ctx, X = Render.sx(this.L.x), Y = Render.sy(0); const n = Math.min(9, Math.floor(k * 12)); for (let i = 0; i < n; i++) { const s = Math.sin(i * 7.7) * 100, h = s - Math.floor(s); const fall = Math.min(1, (k * 12 - i) / 1.5), gy = Y - 20 - (i % 3) * 56 - Math.floor(i / 3) * 0, x = X - 75 + (i % 3) * 50 + (h - 0.5) * 10, y = gy - (1 - fall) * 600; ctx.fillStyle = '#bdbdbd'; ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 3; ctx.fillRect(x, y - 56 + Math.floor(i / 3) * 0, 52, 56); ctx.strokeRect(x, y - 56, 52, 56); } if (n >= 9) { ctx.strokeStyle = '#7a4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X - 40, Y - 150); ctx.lineTo(X - 10, Y - 100); ctx.lineTo(X - 30, Y - 50); ctx.stroke(); } },
  ash(k) { const ctx = this.ctx; ctx.fillStyle = 'rgba(90,90,90,0.75)'; const front = Render.sx(this.W.x + this.dir * (80 + k * 700)); for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(front - this.dir * (i * 55), Render.GY - 40 - (i % 4) * 50 - Math.sin(this.t * 0.2 + i) * 10, 50 + (i % 3) * 15, 0, 7); ctx.fill(); } },
  fire(k) { const ctx = this.ctx, X = Render.sx(this.L.x), Y = Render.sy(0); for (let i = 0; i < 16; i++) { const u = ((this.t * 0.04 + i * 0.13) % 1); ctx.fillStyle = i % 2 ? 'rgba(255,107,43,0.8)' : 'rgba(255,200,60,0.8)'; ctx.beginPath(); ctx.ellipse(X + (i - 8) * 9 + Math.sin(u * 9) * 8, Y - u * 230, 16 * (1 - u) + 4, 26 * (1 - u) + 6, 0, 0, 7); ctx.fill(); } },
  column(k, c1, c2) { const ctx = this.ctx, X = Render.sx(this.L.x), h = k < 0.3 ? k / 0.3 * 400 : 400 * Math.max(0, 1 - (k - 0.3) / 0.7 * 0.5); ctx.fillStyle = c1; ctx.shadowColor = c1; ctx.shadowBlur = 30; ctx.fillRect(X - 45, Render.GY - h, 90, h); ctx.shadowBlur = 0; ctx.fillStyle = c2; for (let i = 0; i < 8; i++) ctx.fillRect(X - 40 + i * 11, Render.GY - h + ((this.t * 9 + i * 50) % Math.max(1, h)), 5, 24); },
  slashes(k) { const ctx = this.ctx, X = Render.sx(this.L.x), Y = Render.sy(80); if (k > 0.6) return; const n = Math.floor(k / 0.6 * 6); for (let i = 0; i < n; i++) { ctx.strokeStyle = '#ffe6e6'; ctx.lineWidth = 6; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.moveTo(X - 70, Y - 60 + i * 25); ctx.lineTo(X + 70, Y + 20 - i * 25); ctx.stroke(); } ctx.globalAlpha = 1; const w = Render.sx(this.W.x); this.W.x = this.L.x + (Math.floor(k * 10) % 2 ? 1 : -1) * 110; this.W.face = this.L.x >= this.W.x ? 1 : -1; },
  beam(k, col) { const ctx = this.ctx, x0 = Render.sx(this.W.x + this.dir * 40), len = this.dir * 1200, w = 40 + Math.sin(this.t * 0.5) * 8 + (k < 0.2 ? k * 200 : 40); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 40; ctx.globalAlpha = 0.85; ctx.fillRect(Math.min(x0, x0 + len), Render.sy(100) - w / 2, Math.abs(len), w); ctx.fillStyle = '#fff'; ctx.fillRect(Math.min(x0, x0 + len), Render.sy(100) - w / 6, Math.abs(len), w / 3); ctx.globalAlpha = 1; ctx.shadowBlur = 0; },
  steam(k) { const ctx = this.ctx, X = Render.sx(this.L.x), Y = Render.sy(0); ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 14; i++) { const u = ((this.t * 0.03 + i * 0.07) % 1); ctx.beginPath(); ctx.arc(X + (i - 7) * 18 + Math.sin(u * 6 + i) * 12, Y - 20 - u * 260, 14 + u * 22, 0, 7); ctx.fill(); } },

  draw(ctx) {
    this.ctx = ctx; const t = this.t;
    for (const f of [this.W, this.L]) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(Render.sx(f.x), Render.GY + 4, 40, 9, 0, 0, 7); ctx.fill(); }
    // perdedor
    if (t < this.ACT0) { FighterDraw.draw(ctx, this.L, t, Render.sx(this.L.x), Render.sy(0), 1); // mareado, con estrellitas
      ctx.fillStyle = '#ffd34d'; for (let i = 0; i < 4; i++) { const a = t * 0.08 + i * 1.57; ctx.beginPath(); const cx = Render.sx(this.L.x) + Math.cos(a) * 38, cy = Render.sy(170) + Math.sin(a) * 10; for (let j = 0; j < 10; j++) { const r = j % 2 ? 3 : 7; ctx.lineTo(cx + Math.cos(j * 0.628) * r, cy + Math.sin(j * 0.628) * r); } ctx.fill(); } }
    else { const k = Math.min(1, (t - this.ACT0) / (this.ACT1 - this.ACT0)); this.fat.loser(this, t >= this.ACT1 ? 1 : k); }
    // ganador
    ctx.save(); ctx.translate(Render.sx(this.W.x), Render.sy(0)); ctx.scale(this.W.grow || 1, this.W.grow || 1); FighterDraw.draw(ctx, this.W, t, 0, 0, 1); ctx.restore();
    // partículas
    for (const p of this.parts) { ctx.globalAlpha = Math.min(1, p.life / 20); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(Render.sx(p.x), Render.sy(p.y), p.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
  }
};
