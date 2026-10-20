// Dibujo vectorial de los luchadores (bacilos humanizados estilo cel-shading con contorno grueso).
// Origen en los pies; se dibuja mirando a la derecha y se refleja según f.face.
const FighterDraw = {
  // ---- poses ----
  pose(f, tGlobal) {
    const t = f.t, s = f.st, m = f.move;
    // valores: body dy, tilt (rad), brazos [hombro, codo] (rad, 0 = colgando, + = adelante), piernas [cadera, rodilla], expr
    const P = { dy: 0, tilt: 0, fa: [0.5, 0.9], ba: [0.3, 1.2], fl: [0.25, 0.2], bl: [-0.25, 0.2], expr: 'idle', scaleY: 1, lie: false, glow: 0 };
    const sw = Math.sin(tGlobal * 0.08);
    if (s === 'idle') { P.dy = sw * 2.5; P.fa = [0.6 + sw * 0.05, 1.1]; P.ba = [0.35, 1.3]; }
    else if (s === 'walk') { const k = Math.sin(t * 0.28); P.fl = [k * 0.6, Math.max(0, -k) * 0.8]; P.bl = [-k * 0.6, Math.max(0, k) * 0.8]; P.fa = [0.5 - k * 0.3, 1.0]; P.ba = [0.3 + k * 0.3, 1.1]; P.dy = Math.abs(k) * 2; }
    else if (s === 'crouch') { P.dy = 38; P.fl = [0.9, 1.6]; P.bl = [-0.9, 1.6]; P.fa = [0.7, 1.4]; P.ba = [0.4, 1.4]; }
    else if (s === 'jump') { P.fl = [0.6, 1.2]; P.bl = [-0.3, 1.0]; P.fa = [2.4, 0.3]; P.ba = [1.5, 0.5]; }
    else if (s === 'dash') { P.tilt = 0.35 * Math.sign(f.vx * f.face); P.fl = [1.0, 0.3]; P.bl = [-0.9, 0.6]; P.fa = [1.2, 0.4]; P.ba = [-0.6, 0.6]; }
    else if (s === 'block') { P.fa = [1.1, 2.2]; P.ba = [1.0, 2.4]; P.tilt = -0.08; P.expr = 'block'; if (f.crouch) { P.dy = 38; P.fl = [0.9, 1.6]; P.bl = [-0.9, 1.6]; } }
    else if (s === 'hit') { P.tilt = -0.3; P.fa = [-0.8, 0.6]; P.ba = [-1.0, 0.4]; P.fl = [0.1, 0.4]; P.bl = [-0.5, 0.5]; P.expr = 'hurt'; P.dy = -2; }
    else if (s === 'launched') { P.tilt = -0.9 - Math.min(0.6, t * 0.02); P.fa = [-1.5, 0.3]; P.ba = [2.0, 0.3]; P.fl = [1.2, 0.8]; P.bl = [0.4, 1.4]; P.expr = 'hurt'; }
    else if (s === 'down' || s === 'ko') { P.lie = true; P.expr = s === 'ko' ? 'ko' : 'hurt'; }
    else if (s === 'dizzy') { const w = Math.sin(tGlobal * 0.12); P.tilt = w * 0.18; P.dy = 6; P.fa = [-0.5 + w * 0.2, 0.3]; P.ba = [-0.6 - w * 0.2, 0.3]; P.fl = [0.3, 0.5]; P.bl = [-0.3, 0.5]; P.expr = 'dizzy'; }
    else if (s === 'victory') { const w = Math.sin(tGlobal * 0.15); P.fa = [3.0 + w * 0.1, 0.1]; P.ba = [2.8 - w * 0.1, 0.1]; P.dy = Math.abs(w) * 4; P.expr = 'attack'; }
    else if (s === 'grabbed') { P.dy = -30; P.tilt = 0.4; P.fa = [-1.2, 0.5]; P.ba = [-1.4, 0.5]; P.fl = [0.6, 1.2]; P.bl = [-0.2, 1.3]; P.expr = 'hurt'; }
    else if (s === 'grab') { P.fa = [1.6, 0.2]; P.ba = [1.4, 0.3]; P.tilt = 0.15; P.expr = 'attack'; if (t > 30) { P.fa = [2.6, 0.2]; P.ba = [2.4, 0.3]; } }
    else if (s === 'attack') {
      P.expr = 'attack';
      const prog = (st, a) => Math.min(1, Math.max(0, (t - st) / Math.max(1, a))); // 0→1 durante el arranque
      const M = MOVES[m];
      if (M) {
        const k = t < M.s ? t / M.s : t < M.s + M.a ? 1 : Math.max(0, 1 - (t - M.s - M.a) / M.r);
        if (m === 'LP') { P.fa = [1.6 * k, 0.1]; P.ba = [0.3, 1.3]; P.tilt = 0.1 * k; }
        else if (m === 'MP') { P.fa = [1.7 * k, 0.1]; P.ba = [1.4 * k, 0.6]; P.tilt = 0.18 * k; }
        else if (m === 'HP') { P.fa = [-1.2 + 3.0 * k, 0.1]; P.ba = [0.8, 1.2]; P.tilt = -0.25 + 0.55 * k; P.fl = [0.5 * k, 0.2]; P.bl = [-0.4, 0.3]; }
        else if (m === 'K') { P.fl = [1.6 * k, 0.1]; P.bl = [-0.3, 0.4]; P.fa = [-0.6, 1.0]; P.ba = [1.2, 0.6]; P.tilt = -0.2 * k; }
        else if (m === 'cK') { P.dy = 34; P.fl = [1.2, 0.0]; P.bl = [-0.9, 1.6]; P.tilt = 0.4 * k; P.fa = [0.8, 1.2]; P.ba = [-0.8, 0.8]; }
        else if (m === 'cHP') { P.fa = [3.1 * k, 0.05]; P.ba = [0.2, 1.2]; P.dy = 20 * (1 - k); P.fl = [0.6, 0.8 * (1 - k)]; P.bl = [-0.5, 0.6]; }
        else if (m === 'jLP') { P.fa = [1.4 * k - 0.4, 0.2]; P.ba = [1.8, 0.4]; P.fl = [0.6, 1.2]; P.bl = [-0.3, 1.0]; }
        else if (m === 'jHP') { P.fa = [0.3 - 1.6 * k, 0.6]; P.ba = [2.0, 0.4]; P.fl = [0.8, 1.2]; P.bl = [-0.2, 1.1]; P.tilt = 0.4 * k; }
        else if (m === 'jK') { P.fl = [1.2 * k - 0.3, 0.1]; P.bl = [-0.6, 1.4]; P.fa = [-0.5, 1.0]; P.ba = [1.6, 0.5]; }
        else if (m === 'RUSH') { P.fa = [1.5, 0.1]; P.ba = [-1.0, 0.8]; P.tilt = 0.45; P.fl = [-0.6, 0.6]; P.bl = [0.9, 0.2]; P.glow = 0.5; P.expr = 'shout'; }
        else if (m === 'SHOT') { P.fa = [1.7 * k, 0.4 - 0.3 * k]; P.ba = [1.5 * k, 0.5]; P.tilt = 0.15 * k; P.glow = 0.3; }
        else if (m === 'BURST') { P.fa = [2.4, 0.1]; P.ba = [2.4, 0.1]; P.fl = [0.7, 0.3]; P.bl = [-0.7, 0.3]; P.glow = 1; P.expr = 'shout'; }
      } else { // especial / overdrive
        const T = f.spT || [10, 5, 20]; const k = Math.min(1, t / T[0]); const kind = f.sp ? f.sp.kind : 'proj';
        P.glow = m === 'OD' ? 1 : 0.5; P.expr = 'shout';
        if (kind === 'upper') { P.fa = [3.1, 0.05]; P.ba = [0.3, 1.3]; P.fl = [0.9, 1.3]; P.bl = [-0.4, 0.8]; P.tilt = 0.1; }
        else if (kind === 'grab' || kind === 'drain') { P.fa = [1.8 * k, 0.2]; P.ba = [1.6 * k, 0.3]; }
        else if (kind === 'absorb') { P.fa = [1.3, 2.0]; P.ba = [1.1, 2.2]; P.tilt = -0.1; P.expr = 'block'; }
        else if (kind === 'steam') { P.fa = [-1.5 + 3.2 * k, 0.1]; P.ba = [1.0, 1.2]; P.tilt = -0.3 + 0.7 * k; P.fl = [0.6 * k, 0.2]; }
        else if (kind === 'beam') { P.fa = [1.6, 0.05]; P.ba = [1.6, 0.05]; P.tilt = -0.1; }
        else if (kind === 'aura') { P.fa = [-0.8, 1.6]; P.ba = [-0.8, 1.6]; P.tilt = -0.15; }
        else { P.fa = [2.6 * k, 0.6 - 0.5 * k]; P.ba = [0.9 * k, 1.0]; P.tilt = 0.25 * k; }
      }
    }
    return P;
  },

  // ---- dibujo principal ----
  draw(ctx, f, tGlobal, screenX, screenY, scale = 1, over) {
    const r = over ? Object.assign({}, ROSTER_BY_ID[f.id], over) : ROSTER_BY_ID[f.id], P = this.pose(f, tGlobal), sh = r.shape;
    ctx.save(); ctx.translate(screenX, screenY); ctx.scale(f.face * scale, scale);
    if (f.inv > 0 && (Math.floor(tGlobal / 2) % 2)) ctx.globalAlpha = 0.6;
    if (P.lie) { ctx.translate(-10, 0); ctx.rotate(-Math.PI / 2 + 0.1); ctx.translate(0, 28); }
    const BW = 54 * sh.w, BH = 80 * sh.h, hipY = -60 * sh.h + P.dy, topY = hipY - BH; // cápsula entre hipY y topY
    ctx.translate(0, hipY); ctx.rotate(-P.tilt); ctx.translate(0, -hipY);
    const dark = r.c2, outline = '#1a1018', skin = r.c1;
    const limb = (x0, y0, a1, a2, L1, L2, col, w) => {
      const x1 = x0 + Math.sin(a1) * L1, y1 = y0 + Math.cos(a1) * L1;
      const x2 = x1 + Math.sin(a1 + a2) * L2, y2 = y1 + Math.cos(a1 + a2) * L2;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = outline; ctx.lineWidth = w + 5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      return [x2, y2];
    };
    // piernas: ángulo cadera (+ = adelante), rodilla (+ = flexión hacia atrás)
    const legL = 32 * sh.h, legL2 = 30 * sh.h;
    const leg = (hipA, kneeA, col) => { const end = limb(0, hipY + 6, hipA, -kneeA, legL, legL2, col, 13); ctx.fillStyle = outline; ctx.beginPath(); ctx.ellipse(end[0] + 6, end[1] + 2, 16, 8, 0, 0, 7); ctx.fill(); ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(end[0] + 6, end[1] + 1, 13, 6, 0, 0, 7); ctx.fill(); };
    leg(P.bl[0], P.bl[1], dark); // pierna trasera
    // flagelo (cola-látigo) desde la base trasera de la cápsula
    ctx.strokeStyle = outline; ctx.lineWidth = 7; this.flagellum(ctx, -BW / 2 + 4, hipY - 10, tGlobal, f, r); ctx.strokeStyle = r.c2; ctx.lineWidth = 4; this.flagellum(ctx, -BW / 2 + 4, hipY - 10, tGlobal, f, r);
    // brazo trasero
    const shY = topY + 26, armL = 30 * sh.h, armL2 = 28 * sh.h;
    const arm = (a, col) => { const end = limb(0, shY, a[0], a[1], armL, armL2, col, 12); ctx.fillStyle = outline; ctx.beginPath(); ctx.arc(end[0], end[1], 11, 0, 7); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(end[0], end[1], 8.5, 0, 7); ctx.fill(); };
    arm(P.ba, dark);
    // cuerpo (cápsula)
    ctx.save();
    if (P.glow > 0 || f.auraT > 0) { ctx.shadowColor = f.sp ? f.sp.color : r.c3; ctx.shadowBlur = 30 * Math.max(P.glow, f.auraT > 0 ? 1 : 0); }
    this.capsule(ctx, -BW / 2, topY, BW, BH, BW / 2, outline, 0); ctx.shadowBlur = 0;
    const g = ctx.createLinearGradient(-BW / 2, 0, BW / 2, 0); g.addColorStop(0, dark); g.addColorStop(0.3, dark); g.addColorStop(0.31, skin); g.addColorStop(1, skin);
    this.capsule(ctx, -BW / 2 + 4, topY + 4, BW - 8, BH - 8, BW / 2 - 4, g, 0);
    // brillo cel
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(BW / 4, topY + 14, BW / 6, 8, -0.3, 0, 7); ctx.fill();
    this.accessories(ctx, r, sh, BW, BH, topY, tGlobal);
    this.face(ctx, r, P.expr, BW, topY, tGlobal);
    ctx.restore();
    // brazo y pierna delanteros
    arm(P.fa, skin);
    leg(P.fl[0], P.fl[1], skin);
    ctx.restore();
  },
  capsule(ctx, x, y, w, h, rr, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.lineTo(x + w - rr, y); ctx.arc(x + w - rr, y + rr, rr, -Math.PI / 2, 0); ctx.lineTo(x + w, y + h - rr); ctx.arc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2); ctx.lineTo(x + rr, y + h); ctx.arc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI); ctx.lineTo(x, y + rr); ctx.arc(x + rr, y + rr, rr, Math.PI, Math.PI * 1.5); ctx.fill(); },
  flagellum(ctx, x0, y0, t, f, r) {
    ctx.beginPath(); ctx.moveTo(x0, y0);
    const n = 9, len = r.clade === 'dual' ? 60 : 75, speed = f.st === 'attack' ? 0.5 : 0.18, amp = f.st === 'attack' ? 14 : 8;
    for (let i = 1; i <= n; i++) { const u = i / n; ctx.lineTo(x0 - u * len, y0 + Math.sin(t * speed + u * 6) * amp * u + u * u * 20); }
    ctx.stroke();
  },
  face(ctx, r, expr, BW, topY, t) {
    const ex = BW * 0.12, ey = topY + 24, eyeW = BW * 0.17, eyeH = 11;
    const eye = (x) => {
      if (expr === 'dizzy') { ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let a = 0; a < 12; a += 0.4) ctx.lineTo(x + Math.cos(a + t * 0.3) * a * 0.9, ey + Math.sin(a + t * 0.3) * a * 0.9); ctx.stroke(); return; }
      if (expr === 'ko') { ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 6, ey - 6); ctx.lineTo(x + 6, ey + 6); ctx.moveTo(x + 6, ey - 6); ctx.lineTo(x - 6, ey + 6); ctx.stroke(); return; }
      ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.ellipse(x, ey, eyeW + 2, eyeH + 2 + (expr === 'hurt' ? 4 : 0), 0, 0, 7); ctx.fill();
      ctx.fillStyle = r.eye; ctx.beginPath(); ctx.ellipse(x, ey, eyeW, eyeH + (expr === 'hurt' ? 4 : 0), 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#1a1018'; ctx.beginPath(); ctx.ellipse(x + (expr === 'hurt' ? 0 : 4), ey + 1, 4.5, expr === 'hurt' ? 7 : 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 6, ey - 3, 2, 0, 7); ctx.fill();
    };
    eye(ex - BW * 0.2); eye(ex + BW * 0.14);
    // cejas (enojadas)
    ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    const angry = expr === 'attack' || expr === 'shout' || expr === 'block';
    ctx.beginPath(); ctx.moveTo(ex - BW * 0.35, ey - 16 - (angry ? 2 : 6)); ctx.lineTo(ex - BW * 0.08, ey - 14 - (angry ? 8 : 4)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex + BW * 0.02, ey - 14 - (angry ? 8 : 4)); ctx.lineTo(ex + BW * 0.3, ey - 16 - (angry ? 1 : 6)); ctx.stroke();
    // boca
    const my = ey + 24; ctx.fillStyle = '#1a1018';
    if (expr === 'shout' || expr === 'hurt') { ctx.beginPath(); ctx.ellipse(ex, my + 2, 9, expr === 'shout' ? 12 : 8, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#e04050'; ctx.beginPath(); ctx.ellipse(ex, my + 6, 5, 4, 0, 0, 7); ctx.fill(); }
    else if (expr === 'attack') { ctx.fillRect(ex - 12, my - 3, 26, 8); ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) ctx.fillRect(ex - 10 + i * 6, my - 2, 4, 3); }
    else if (expr === 'block') { ctx.fillRect(ex - 8, my - 1, 18, 4); }
    else if (expr === 'ko' || expr === 'dizzy') { ctx.beginPath(); ctx.arc(ex, my + 6, 7, Math.PI, 0); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(ex - 10, my - 2); ctx.quadraticCurveTo(ex + 2, my + 10, ex + 14, my - 4); ctx.lineWidth = 3; ctx.strokeStyle = '#1a1018'; ctx.stroke(); }
  },
  accessories(ctx, r, sh, BW, BH, topY, t) {
    const botY = topY + BH;
    if (sh.cracks) { ctx.strokeStyle = 'rgba(60,20,0,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-BW / 4, botY - 20); ctx.lineTo(-BW / 8, botY - 36); ctx.lineTo(-BW / 5, botY - 48); ctx.moveTo(BW / 6, botY - 12); ctx.lineTo(BW / 4, botY - 30); ctx.stroke(); ctx.fillStyle = 'rgba(255,170,60,0.5)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-BW / 3 + i * 11, botY - 10 - (i % 2) * 8, 3, 0, 7); ctx.fill(); } }
    if (sh.crystals) { ctx.fillStyle = '#f5e03a'; ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const x = -BW / 2 + 6 + i * 9; ctx.beginPath(); ctx.moveTo(x, topY + 8); ctx.lineTo(x + 5, topY - 12 - i * 3); ctx.lineTo(x + 10, topY + 8); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
    if (sh.lava) { ctx.strokeStyle = r.c3; ctx.lineWidth = 3; ctx.shadowColor = r.c3; ctx.shadowBlur = 8 + Math.sin(t * 0.2) * 4; ctx.beginPath(); ctx.moveTo(-BW / 3, botY - 10); ctx.lineTo(-BW / 6, botY - 30); ctx.lineTo(-BW / 4, botY - 50); ctx.lineTo(0, botY - 62); ctx.moveTo(BW / 5, botY - 8); ctx.lineTo(BW / 7, botY - 28); ctx.stroke(); ctx.shadowBlur = 0; }
    if (sh.frost) { ctx.fillStyle = '#e8f8ff'; ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { const x = -BW / 2 + 4 + i * 8, y = topY + 2 - (i % 2) * 6; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x + 3, y - 8); ctx.lineTo(x + 6, y + 6); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
    if (sh.bands) { ctx.fillStyle = 'rgba(40,10,70,0.55)'; for (let i = 0; i < 3; i++) ctx.fillRect(-BW / 2 + 4, botY - 16 - i * 14, BW - 8, 6); }
    if (sh.blocks) { ctx.fillStyle = '#bdbdbd'; ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 2; ctx.fillRect(-BW / 2 - 4, topY + 30, 14, 12); ctx.strokeRect(-BW / 2 - 4, topY + 30, 14, 12); ctx.fillRect(BW / 2 - 10, botY - 30, 14, 12); ctx.strokeRect(BW / 2 - 10, botY - 30, 14, 12); }
    if (sh.heat) { ctx.fillStyle = 'rgba(255,120,40,0.7)'; for (let i = 0; i < 3; i++) { const x = -12 + i * 12, h = 14 + Math.sin(t * 0.3 + i) * 5; ctx.beginPath(); ctx.moveTo(x - 5, topY + 4); ctx.lineTo(x, topY - h); ctx.lineTo(x + 5, topY + 4); ctx.fill(); } }
    if (sh.steam) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-BW / 2 - 6 + i * 14, topY - 6 - ((t * 0.5 + i * 13) % 30), 9 + i * 2, 0, 7); ctx.fill(); } }
  }
};
