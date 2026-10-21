// Render de la pelea: escenario, luchadores, proyectiles, efectos y HUD. Sólo lee el estado; nunca lo modifica.
const Render = {
  W: 960, H: 540, GY: 440, fx: [], texts: [], flash: 0, camX: 0, t: 0, banner: null,
  reset() { this.fx = []; this.texts = []; this.flash = 0; this.banner = null; },
  // Convierte eventos del motor en efectos visuales y sonidos
  consume(st) {
    for (const e of st.events) {
      if (e.type === 'hit') { this.spark(e.x, e.y, e.str || 1, e.str >= 3 ? '#ffd34d' : e.str === 2 ? '#ffb070' : '#fff'); if (e.str >= 2) this.rays(e.x, e.y, e.str); Audio.sfx('hit', { str: e.str }); if (e.combo >= 2) this.combo = { side: e.side, n: e.combo, dmg: e.dmg, t: 90, pop: 10 }; }
      else if (e.type === 'block') { this.spark(e.x, e.y, 1, '#6cf'); Audio.sfx('block'); }
      else if (e.type === 'special') { Audio.sfx('special'); this.ring(e.x, 80, e.color || '#fff'); this.flashCol = { col: e.color || '#fff', t: 8 }; for (let i = 0; i < 10; i++) this.fx.push({ x: e.x + (Math.random() - 0.5) * 60, y: 20 + Math.random() * 140, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, t: 20 + Math.random() * 15, col: e.color || '#fff', r: 3 }); }
      else if (e.type === 'dash') { for (let i = 0; i < 8; i++) this.fx.push({ x: e.x - e.dir * 20, y: 4 + Math.random() * 10, vx: -e.dir * (1 + Math.random() * 3), vy: 0.5 + Math.random(), t: 18 + Math.random() * 10, col: 'rgba(230,220,200,0.8)', r: 5 + Math.random() * 5, dust: true }); }
      else if (e.type === 'land') { for (let i = 0; i < 6 * e.str; i++) this.fx.push({ x: e.x, y: 2, vx: (Math.random() - 0.5) * 6 * e.str, vy: 0.5 + Math.random() * 1.5, t: 16 + Math.random() * 10, col: 'rgba(230,220,200,0.75)', r: 4 + Math.random() * 5, dust: true }); if (e.str > 1) Audio.sfx('block'); }
      else if (e.type === 'od') { this.flash = 14; this.banner = { text: e.name, sub: ROSTER_BY_ID[st.f[e.side].id].id + ' — OVERDRIVE', t: 110, col: ROSTER_BY_ID[st.f[e.side].id].c3 }; Audio.sfx('od'); }
      else if (e.type === 'ko') { this.banner = { text: e.winner === -1 ? 'DOBLE K.O.' : 'K.O.', sub: '', t: 150, col: '#ff3b3b' }; this.flash = 10; Audio.sfx('ko'); }
      else if (e.type === 'timeover') { this.banner = { text: 'TIME OVER', sub: e.winner === -1 ? 'EMPATE' : 'GANA ' + st.f[e.winner].id, t: 150, col: '#ffd34d' }; Audio.sfx('ko'); }
      else if (e.type === 'round') { this.banner = { text: 'ROUND ' + e.n, sub: 'LITHO-STRIKE', t: 110, col: '#ffd34d', fight: true }; Audio.sfx('round'); }
      else if (e.type === 'fight') { this.banner = { text: 'FIGHT!', sub: '', t: 45, col: '#ff6a2a' }; }
      else if (e.type === 'burst') { this.ring(e.x, e.y + 80, '#9ff'); Audio.sfx('burst'); }
      else if (e.type === 'lysis') { this.ring(e.x, e.y + 80, '#f6f'); Audio.sfx('absorb'); }
      else if (e.type === 'explode') { this.spark(e.x, e.y, 3, '#ddd'); Audio.sfx('explode'); }
      else if (e.type === 'absorb') { this.ring(e.x, e.y, '#ffe08a'); Audio.sfx('absorb'); }
      else if (e.type === 'counter') { this.spark(e.x, e.y, 3, '#ffe08a'); this.texts.push({ x: e.x, y: e.y + 60, s: 'COUNTER', t: 50, col: '#ffe08a' }); }
      else if (e.type === 'teleport') { this.ring(e.x, e.y + 80, '#fdd'); Audio.sfx('teleport'); }
      else if (e.type === 'grab') { Audio.sfx('whoosh'); }
      else if (e.type === 'armor') { this.texts.push({ x: e.x, y: e.y + 40, s: 'ARMOR', t: 40, col: '#fa5' }); Audio.sfx('block'); }
      else if (e.type === 'end') { this.banner = { text: st.f[e.winner].id + ' WINS', sub: ROSTER_BY_ID[st.f[e.winner].id].name, t: 99999, col: '#ffd34d' }; }
    }
  },
  spark(x, y, n, col) { for (let i = 0; i < 6 + n * 5; i++) { const a = Math.random() * 6.28, v = 2 + Math.random() * (3 + n * 2); this.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 14 + Math.random() * 10, col, r: 2 + n }); } this.fx.push({ x, y, vx: 0, vy: 0, t: 8, col: '#fff', r: 10 + n * 10, star: true }); },
  rays(x, y, n) { this.fx.push({ x, y, vx: 0, vy: 0, t: 10, col: '#fff', rays: true, r: 20 + n * 15 }); },
  ring(x, y, col) { this.fx.push({ x, y, vx: 0, vy: 0, t: 24, col, ring: true, r: 10 }); },

  sx(x) { return x - this.camX; }, sy(y) { return this.GY - y; },
  draw(ctx, st, opts) {
    const W = this.W, H = this.H; this.t++;
    const [a, b] = st.f; const stage = STAGES[st.stage];
    let cx = (a.x + b.x) / 2; cx = Math.max(W / 2, Math.min(ARENA_W - W / 2, cx)); this.camX = cx - W / 2;
    let shx = 0, shy = 0; const shk = st.shake + (this.shakeExtra || 0); if (this.shakeExtra > 0) this.shakeExtra--; if (shk > 0) { shx = (Math.random() - 0.5) * shk; shy = (Math.random() - 0.5) * shk; }
    ctx.save(); ctx.translate(shx, shy);
    StageDraw.draw(ctx, stage, this.camX, this.t);
    Particles.update(W, H, this.GY); Particles.draw(ctx);
    // sombras
    for (const f of (opts && opts.hideFighters ? [] : st.f)) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(this.sx(f.x), this.GY + 4, Math.max(8, 40 - f.y * 0.05), 9, 0, 0, 7); ctx.fill(); }
    // proyectiles detrás
    for (const p of st.proj) if (p.kind === 'column' || p.kind === 'wall' || p.kind === 'wave') this.proj(ctx, p);
    // luchadores (el que ataca va adelante)
    const order = a.st === 'attack' ? [b, a] : [a, b];
    for (const f of (opts && opts.hideFighters ? [] : order)) {
      if (f.auraT > 0) { ctx.fillStyle = ROSTER_BY_ID[f.id].special.color; ctx.globalAlpha = 0.25 + Math.sin(this.t * 0.4) * 0.1; ctx.beginPath(); ctx.arc(this.sx(f.x), this.sy(f.y + 80), 120, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      if (f.slow > 0) { ctx.fillStyle = 'rgba(180,230,255,0.35)'; ctx.beginPath(); ctx.arc(this.sx(f.x), this.sy(f.y + 75), 60, 0, 7); ctx.fill(); }
      FighterDraw.draw(ctx, f, this.t, this.sx(f.x), this.sy(f.y));
      if (f.absorbT > 0) { ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.sx(f.x), this.sy(f.y + 80), 100 + Math.sin(this.t) * 4, 0, 7); ctx.stroke(); }
    }
    if (opts && opts.hideFighters) st.proj.length = 0;
    for (const p of st.proj) if (!(p.kind === 'column' || p.kind === 'wall' || p.kind === 'wave')) this.proj(ctx, p);
    // efectos
    this.fx = this.fx.filter(e => e.t > 0);
    for (const e of this.fx) {
      e.t--; e.x += e.vx; e.y += e.vy; e.vy -= 0.1; ctx.fillStyle = e.col;
      if (e.ring) { ctx.strokeStyle = e.col; ctx.lineWidth = 6; ctx.globalAlpha = e.t / 24; ctx.beginPath(); ctx.arc(this.sx(e.x), this.sy(e.y), e.r + (24 - e.t) * 8, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      else if (e.rays) { ctx.strokeStyle = e.col; ctx.lineWidth = 3; ctx.globalAlpha = e.t / 10; for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.3; ctx.beginPath(); ctx.moveTo(this.sx(e.x) + Math.cos(a) * e.r * 0.5, this.sy(e.y) + Math.sin(a) * e.r * 0.5); ctx.lineTo(this.sx(e.x) + Math.cos(a) * e.r * (1 + (10 - e.t) * 0.25), this.sy(e.y) + Math.sin(a) * e.r * (1 + (10 - e.t) * 0.25)); ctx.stroke(); } ctx.globalAlpha = 1; }
      else if (e.star) { ctx.globalAlpha = e.t / 8; ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? e.r * 0.4 : e.r; ctx.lineTo(this.sx(e.x) + Math.cos(i * 0.785) * r, this.sy(e.y) + Math.sin(i * 0.785) * r); } ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
      else if (e.dust) { e.vy -= 0.08; ctx.globalAlpha = Math.min(1, e.t / 20) * 0.8; ctx.beginPath(); ctx.arc(this.sx(e.x), this.sy(e.y), e.r * (1 + (28 - e.t) * 0.03), 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      else { ctx.beginPath(); ctx.arc(this.sx(e.x), this.sy(e.y), Math.max(0.1, e.r * (e.t / 20)), 0, 7); ctx.fill(); }
    }
    ctx.restore();
    if (this.flash > 0) { this.flash--; ctx.fillStyle = `rgba(255,255,255,${this.flash / 20})`; ctx.fillRect(0, 0, W, H); }
    if (this.flashCol && this.flashCol.t > 0) { this.flashCol.t--; ctx.globalAlpha = this.flashCol.t / 30; ctx.fillStyle = this.flashCol.col; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    // cinemática de Overdrive: durante el arranque se oscurece todo menos el que lo ejecuta
    for (const f of st.f) if (f.st === 'attack' && f.move === 'OD' && f.spT && f.t < f.spT[0] + 4) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(shx, shy); FighterDraw.draw(ctx, f, this.t, this.sx(f.x), this.sy(f.y), 1.08); ctx.restore(); ctx.strokeStyle = ROSTER_BY_ID[f.id].c3; ctx.lineWidth = 6; ctx.globalAlpha = 0.6; for (let i = 0; i < 12; i++) { const a = i * 0.52 + this.t * 0.1; ctx.beginPath(); ctx.moveTo(this.sx(f.x) + Math.cos(a) * 90, this.sy(f.y + 80) + Math.sin(a) * 90); ctx.lineTo(this.sx(f.x) + Math.cos(a) * 600, this.sy(f.y + 80) + Math.sin(a) * 600); ctx.stroke(); } ctx.globalAlpha = 1; }
    this.hud(ctx, st, stage, opts);
  },
  proj(ctx, p) {
    const x = this.sx(p.x), c = p.color; ctx.save();
    if (p.kind === 'ball') { ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(x, this.sy(p.y), p.w / 2, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - p.vx, this.sy(p.y), p.w / 5, 0, 7); ctx.fill(); for (let i = 1; i < 4; i++) { ctx.globalAlpha = 0.3 / i; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x - p.vx * i * 3, this.sy(p.y), p.w / 2, 0, 7); ctx.fill(); } }
    else if (p.kind === 'drop') { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, this.sy(p.y), p.w / 2, p.h / 2, 0, 0, 7); ctx.fill(); }
    else if (p.kind === 'column') { const h = p.warm > 0 ? 20 : p.h; ctx.globalAlpha = p.warm > 0 ? 0.5 : 0.85; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 30; ctx.fillRect(x - p.w / 2, this.sy(h), p.w, h); ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5; for (let i = 0; i < 5; i++) ctx.fillRect(x - p.w / 2 + 6 + i * (p.w / 5), this.sy(h) + ((this.t * 7 + i * 40) % h), 4, 18); }
    else if (p.kind === 'wall') { ctx.fillStyle = p.exploding !== undefined ? '#fff' : '#bdbdbd'; ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 3; ctx.fillRect(x - p.w / 2, this.sy(p.h), p.w, p.h); ctx.strokeRect(x - p.w / 2, this.sy(p.h), p.w, p.h); ctx.strokeStyle = 'rgba(120,200,80,0.8)'; ctx.beginPath(); ctx.moveTo(x - p.w / 3, this.sy(p.h)); ctx.lineTo(x - p.w / 6, this.sy(p.h * 0.6)); ctx.lineTo(x, this.sy(p.h * 0.3)); ctx.stroke(); }
    else if (p.kind === 'wave') { ctx.globalAlpha = 0.75; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - p.w / 2, this.GY); ctx.quadraticCurveTo(x - p.w / 2, this.sy(p.h), x + p.w / 2 * Math.sign(p.vx), this.sy(p.h * 0.9)); ctx.quadraticCurveTo(x + p.w / 2, this.sy(p.h * 0.4), x + p.w / 2, this.GY); ctx.fill(); ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.4; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + (i - 3) * 14, this.sy(p.h * 0.85) + Math.sin(this.t * 0.3 + i) * 8, 8, 0, 7); ctx.fill(); } }
    else if (p.kind === 'beam') { ctx.globalAlpha = 0.9; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 40; ctx.fillRect(x - p.w / 2, this.sy(p.y + p.h / 2), p.w, p.h); ctx.fillStyle = '#fff'; ctx.fillRect(x - p.w / 2, this.sy(p.y + p.h / 6), p.w, p.h / 3); }
    else if (p.kind === 'slash') { ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.globalAlpha = p.life / 8; ctx.beginPath(); ctx.arc(x, this.sy(p.y), p.w / 2, -1, 1); ctx.stroke(); }
    else if (p.kind === 'fist') { ctx.fillStyle = c; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(x, this.sy(p.y + p.h / 2), p.w / 2, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + Math.cos(i) * p.w / 2, this.sy(p.y + p.h / 2) + Math.sin(i) * p.h / 2, 14, 0, 7); ctx.fill(); } }
    else if (p.kind === 'counter') { /* invisible */ }
    ctx.restore();
  },
  hud(ctx, st, stage, opts) {
    const W = this.W; const [a, b] = st.f;
    ctx.save(); ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    const bar = (f, left) => {
      const x = left ? 40 : W - 40 - 380, hp = Math.max(0, f.hp / f.maxhp), r = ROSTER_BY_ID[f.id];
      ctx.fillStyle = '#1a1018'; ctx.fillRect(x - 3, 22, 386, 26);
      ctx.fillStyle = '#5a1020'; ctx.fillRect(x, 25, 380, 20);
      const gx = left ? x + 380 - 380 * hp : x; ctx.fillStyle = hp > 0.3 ? '#ffd34d' : '#ff5a3a'; ctx.fillRect(gx, 25, 380 * hp, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(gx, 25, 380 * hp, 6);
      ctx.fillStyle = '#fff'; ctx.textAlign = left ? 'left' : 'right'; ctx.font = 'bold 18px Arial';
      ctx.fillText(r.id + '  ' + r.name, left ? x : x + 380, 66);
      // rounds ganados
      for (let i = 0; i < Math.ceil(st.rounds / 2); i++) { ctx.fillStyle = st.wins[f.side] > i ? '#ff6a2a' : '#333'; ctx.beginPath(); ctx.arc(left ? x + 395 + i * 18 : x - 15 - i * 18, 35, 6, 0, 7); ctx.fill(); }
      // medidor (gradiente de protones) y burst
      const my = this.H - 34, mx = left ? 40 : W - 40 - 240;
      ctx.fillStyle = '#1a1018'; ctx.fillRect(mx - 2, my - 2, 244, 16);
      ctx.fillStyle = f.meter >= 100 ? '#ff4df0' : '#3af'; ctx.fillRect(left ? mx : mx + 240 - 240 * f.meter / 100, my, 240 * f.meter / 100, 12);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Arial'; ctx.fillText(f.meter >= 100 ? 'OVERDRIVE LISTO (↓↘→ + O)' : 'GRADIENTE DE PROTONES ' + Math.floor(f.meter) + '%', left ? mx : mx + 240, my - 6);
      ctx.fillStyle = f.burst ? '#9ff' : '#333'; ctx.beginPath(); ctx.arc(left ? mx + 256 : mx - 16, my + 6, 8, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '9px Arial'; ctx.textAlign = 'center'; ctx.fillText('BURST', left ? mx + 256 : mx - 16, my + 24);
    };
    bar(a, true); bar(b, false);
    // tiempo
    ctx.textAlign = 'center'; ctx.fillStyle = '#1a1018'; ctx.fillRect(W / 2 - 44, 14, 88, 46);
    ctx.fillStyle = st.timer < 600 ? '#ff5a3a' : '#fff'; ctx.font = 'bold 34px Arial'; ctx.fillText(Math.ceil(Math.max(0, st.timer) / 60), W / 2, 50);
    // cartel del escenario
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(40, 80, 400, 44);
    ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 13px Arial'; ctx.fillText(stage.name.toUpperCase(), 48, 97);
    ctx.fillStyle = '#eee'; ctx.font = '12px Arial'; ctx.fillText(stage.place + '   ·   pH ' + stage.ph + '   ·   ' + stage.temp, 48, 115);
    // combo
    if (this.combo && this.combo.t > 0) { this.combo.t--; const x = this.combo.side === 0 ? 60 : W - 60; ctx.textAlign = this.combo.side === 0 ? 'left' : 'right'; const pop = this.combo.pop > 0 ? this.combo.pop-- : 0; ctx.fillStyle = this.combo.n >= 8 ? '#ff4df0' : this.combo.n >= 5 ? '#ffd34d' : '#ff6a2a'; ctx.font = 'italic bold ' + (34 + pop) + 'px Impact, Arial Black, Arial'; ctx.fillText(this.combo.n + ' HITS', x, 190); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.fillText('COMBO DE BIOLIXIVIACIÓN · ' + this.combo.dmg + ' DAÑO', x, 206); }
    // textos flotantes
    this.texts = this.texts.filter(t => t.t > 0); for (const t of this.texts) { t.t--; t.y += 1; ctx.textAlign = 'center'; ctx.fillStyle = t.col; ctx.font = 'bold 22px Arial'; ctx.fillText(t.s, this.sx(t.x), this.sy(t.y)); }
    // banner central
    if (this.banner && this.banner.t > 0) {
      const bn = this.banner; bn.t--; ctx.textAlign = 'center';
      const k = Math.min(1, (bn.fight ? 110 - bn.t : 30) / 12); ctx.globalAlpha = bn.t < 15 ? bn.t / 15 : 1;
      const by = bn.y || 200; ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, by, W, 110);
      ctx.fillStyle = bn.col; ctx.font = 'italic bold ' + Math.floor(56 * (0.6 + 0.4 * k)) + 'px Impact, Arial Black, Arial'; ctx.shadowColor = '#000'; ctx.shadowBlur = 12; ctx.fillText(bn.text, W / 2, by + 62);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.fillText(bn.sub, W / 2, by + 92); ctx.globalAlpha = 1;
    }
    if (opts && opts.training) {
      const tr = opts.training; ctx.textAlign = 'center'; ctx.fillStyle = '#1a1018'; ctx.fillRect(W / 2 - 44, 14, 88, 46); ctx.fillStyle = '#b9ff3c'; ctx.font = 'bold 13px Arial'; ctx.fillText('ENTRENA-', W / 2, 32); ctx.fillText('MIENTO', W / 2, 48);
      ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '12px Arial';
      ctx.fillText('T: muñeco = ' + ['QUIETO', 'BLOQUEA', 'CPU'][tr.dummy] + '   ·   R: reiniciar posiciones   ·   M: ' + (tr.hideMoves ? 'mostrar' : 'ocultar') + ' lista   ·   Esc: salir', 40, 140);
      if (!tr.hideMoves) {
        const me = ROSTER_BY_ID[st.f[0].id];
        const L = [['LISTA DE MOVIMIENTOS', ''], ['J', 'golpe ligero'], ['K', 'golpe fuerte'], ['L / I', 'patada'], ['S + K', 'lanzador (antiaéreo)'], ['S + L', 'barrida'], ['salto + J/K/L', 'golpes aéreos (overhead)'],
          ['D, D + K', 'LITHO RUSH (embestida con armadura)'], ['S, D + J', 'PROTON SHOT (bola de ácido)'], ['S, D + K', 'ESPECIAL: ' + me.special.name], ['S, D + O (medidor 100 %)', 'OVERDRIVE: ' + me.od.name], ['H en tu ataque', 'Lysis Cancel'], ['H al recibir golpes', 'Burst de biofilm'], ['A, A / D, D', 'dash atrás / adelante'], ['', 'cadena: J → J → K → L → especial → overdrive'], ['W tras K / L / S+K', 'jump cancel: sigue en el aire con J/K/L']];
        const x = W - 40 - 330, y = 150; ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x, y, 330, L.length * 17 + 12);
        L.forEach((r, i) => { const yy = y + 18 + i * 17; ctx.fillStyle = i === 0 ? '#ffd34d' : '#9ff'; ctx.font = i === 0 ? 'bold 12px Arial' : 'bold 12px Arial'; ctx.fillText(r[0], x + 10, yy); ctx.fillStyle = '#eee'; ctx.font = '12px Arial'; ctx.fillText(r[1], x + 130, yy); });
      }
    }
    if (opts && opts.netInfo) { ctx.textAlign = 'right'; ctx.fillStyle = '#9f9'; ctx.font = '11px monospace'; ctx.fillText(opts.netInfo, W - 40, this.H - 48); }
    ctx.restore();
  }
};
