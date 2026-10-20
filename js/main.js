// Bucle principal, pantallas (título, lobby online, selección, pelea, resultado).
const Game = {
  screen: 'title', canvas: null, ctx: null, acc: 0, last: 0, menuIdx: 0, level: 2, mode: '1p',
  sel: { cur: [0, 1], done: [false, false], t: 0 }, st: null, seed: 0, vsT: 0, online: false, netInfo: '',
  VERSION: '0.9.10', VS_FRAMES: 300, // 5 s de pantalla VS con los controles
  CONTROLS: [['Mover', 'A / D', '← / →'], ['Saltar', 'W', '↑'], ['Agacharse', 'S', '↓'], ['Golpe ligero', 'J', 'Num 1  (B)'], ['Golpe fuerte', 'K', 'Num 2  (N)'], ['Patada', 'L  (o I)', 'Num 3  (M)'], ['Especial', 'U', 'Num 5  (.)'], ['Overdrive (medidor 100 %)', 'O', 'Num 6  (/)'], ['Burst · Lysis Cancel', 'H', 'Num 0  (Shift der.)'], ['Dash', 'doble toque A/D', 'doble toque ←/→'], ['Bloquear', 'mantener atrás', 'mantener atrás'], ['Pausa', 'Enter', 'Enter'], ['Lanzador / Barrida', 'S + K  /  S + L', '↓ + Num2  /  ↓ + Num3'], ['LITHO RUSH (embestida)', 'D, D + K', '→, → + Num2'], ['PROTON SHOT (bola de ácido)', 'S, D + J  (↓↘→)', '↓, → + Num1']],
  MENU: [['1 JUGADOR vs CPU', '1p'], ['2 JUGADORES (mismo teclado)', '2p'], ['ENTRENAMIENTO (muñeco quieto)', 'train'], ['ONLINE sin servidor (WebRTC, código de sala)', 'peer'], ['ONLINE con servidor WebSocket (tu Ubuntu)', 'ws'], ['NIVEL CPU: ', 'level']],

  init() {
    this.canvas = document.getElementById('game'); this.ctx = this.canvas.getContext('2d');
    this.labLogo = new Image(); this.labLogo.src = 'img/logoMEL.svg';
    Input.init(); this.resize(); window.addEventListener('resize', () => this.resize());
    const unlock = () => { Audio.init(); Audio.resume(); if (!Audio.music.on && this.screen === 'title') Audio.playMusic('menu', 3); };
    window.addEventListener('keydown', unlock); window.addEventListener('pointerdown', unlock);
    this.canvas.addEventListener('click', e => this.click(e));
    document.getElementById('btn-host').onclick = () => { const code = Net.code(); document.getElementById('room-code').textContent = code; Net.hostPeer(code); };
    document.getElementById('btn-join').onclick = () => { const code = document.getElementById('join-code').value.trim().toUpperCase(); if (code.length === 4) Net.joinPeer(code); };
    document.getElementById('btn-ws').onclick = () => { const url = document.getElementById('ws-url').value.trim(); const room = document.getElementById('ws-room').value.trim() || 'sala1'; Net.connectWS(url, room); };
    document.getElementById('btn-back').onclick = () => { Net.close(); this.goTitle(); };
    Net.onStatus = s => { document.getElementById('net-status').textContent = s; if (Net.connected && this.screen === 'lobby') this.goSelect(true); };
    Net.onMessage = d => this.onNet(d);
    document.getElementById('vol').oninput = e => Audio.setVolume(parseFloat(e.target.value));
    requestAnimationFrame(t => this.loop(t));
  },
  // Resolución nativa: el lienzo se dibuja al tamaño real en pantalla × devicePixelRatio (nítido en retina / 4K); la lógica sigue en 960×540.
  resize() {
    const s = Math.min(window.innerWidth / 960, (window.innerHeight - 10) / 540), cw = Math.floor(960 * s), ch = Math.floor(540 * s);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.canvas.style.width = cw + 'px'; this.canvas.style.height = ch + 'px';
    this.canvas.width = Math.round(cw * dpr); this.canvas.height = Math.round(ch * dpr);
    this.scale = [this.canvas.width / 960, this.canvas.height / 540];
  },
  overlay(id, show) { document.getElementById(id).style.display = show ? 'block' : 'none'; },

  loop(t) {
    const dt = Math.min(0.1, (t - this.last) / 1000); this.last = t; this.acc += dt;
    let steps = 0;
    while (this.acc >= 1 / 60 && steps < 4) { this.acc -= 1 / 60; this.update(); steps++; }
    this.render(); requestAnimationFrame(tt => this.loop(tt));
  },

  // ---------- título ----------
  goTitle() { this.screen = 'title'; this.online = false; this.overlay('lobby', false); if (Audio.ctx) Audio.playMusic('menu', 3); Input.flush(); },
  updateTitle() {
    const n = this.MENU.length;
    if (Input.once('ArrowUp') || Input.once('KeyW')) { this.menuIdx = (this.menuIdx + n - 1) % n; Audio.sfx('move'); }
    if (Input.once('ArrowDown') || Input.once('KeyS')) { this.menuIdx = (this.menuIdx + 1) % n; Audio.sfx('move'); }
    if (Input.once('ArrowLeft') || Input.once('ArrowRight') || Input.once('KeyA') || Input.once('KeyD')) { if (this.MENU[this.menuIdx][1] === 'level') { this.level = this.level % 3 + 1; Audio.sfx('move'); } }
    if (Input.once('Enter') || Input.once('KeyJ') || Input.once('Space')) this.chooseMenu(this.MENU[this.menuIdx][1]);
  },
  chooseMenu(m) {
    Audio.sfx('select');
    if (m === 'level') { this.level = this.level % 3 + 1; return; }
    this.mode = m;
    if (m === 'peer' || m === 'ws') { this.screen = 'lobby'; this.overlay('lobby', true); this.overlay('lobby-peer', m === 'peer'); this.overlay('lobby-ws', m === 'ws'); document.getElementById('net-status').textContent = ''; return; }
    this.goSelect(false);
  },
  click(e) {
    const r = this.canvas.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 960, y = (e.clientY - r.top) / r.height * 540;
    if (this.screen === 'title') { const i = Math.floor((y - 300) / 31); if (i >= 0 && i < this.MENU.length) { this.menuIdx = i; this.chooseMenu(this.MENU[i][1]); } }
    else if (this.screen === 'select') { const g = this.gridAt(x, y); if (g >= 0 && !this.sel.done[0]) { this.sel.cur[0] = g; this.confirmSel(0); } }
    else if (this.screen === 'result') this.afterResult(true);
  },

  // ---------- selección ----------
  goSelect(online) {
    this.online = online; this.screen = 'select'; this.overlay('lobby', false);
    this.sel = { cur: [0, 12], done: [false, false], t: 0, remote: null }; Input.flush();
    if (Audio.ctx && !Audio.music.on) Audio.playMusic('menu', 3);
  },
  gridAt(x, y) { const col = Math.floor((x - 30) / 100), row = Math.floor((y - 120) / 100); if (col < 0 || col > 8 || row < 0 || row > 1) return -1; const i = row * 9 + col; return i < ROSTER.length ? i : -1; },
  moveCursor(p, dx, dy) { let i = this.sel.cur[p]; let col = i % 9, row = Math.floor(i / 9); col = (col + dx + 9) % 9; row = (row + dy + 2) % 2; let j = row * 9 + col; if (j >= ROSTER.length) j = dy ? (row === 1 ? 0 * 9 + col : ROSTER.length - 1) : (dx > 0 ? row * 9 : ROSTER.length - 1); this.sel.cur[p] = Math.min(j, ROSTER.length - 1); Audio.sfx('move'); },
  confirmSel(p) { if (this.sel.done[p]) return; this.sel.done[p] = true; Audio.lick(ROSTER[this.sel.cur[p]].lick, 52); if (this.online) Net.send({ t: 'sel', i: this.sel.cur[p], done: true }); },
  updateSelect() {
    this.sel.t++;
    if (Input.once('Escape')) { Net.close(); this.goTitle(); return; }
    const local = this.online ? [Net.side] : this.mode === '2p' ? [0, 1] : this.mode === 'train' ? (this.sel.done[0] ? [1] : [0]) : [0];
    for (const p of local) {
      const keys = (!this.online && p === 1 && this.mode !== 'train') ? ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ['Numpad1', 'KeyB', 'NumpadEnter']] : ['KeyA', 'KeyD', 'KeyW', 'KeyS', ['KeyJ', 'Enter', 'Space']];
      if (!this.sel.done[p]) {
        if (Input.once(keys[0])) this.moveCursor(p, -1, 0); if (Input.once(keys[1])) this.moveCursor(p, 1, 0);
        if (Input.once(keys[2])) this.moveCursor(p, 0, -1); if (Input.once(keys[3])) this.moveCursor(p, 0, 1);
        if (keys[4].some(k => Input.once(k))) this.confirmSel(p);
        if (this.online && this.sel.t % 6 === 0) Net.send({ t: 'sel', i: this.sel.cur[p], done: false });
      } else if (keys[4].some(k => Input.once(k)) && this.mode === '1p' && this.sel.done[1]) { /* nada */ }
    }
    if (this.mode === '1p' && this.sel.done[0] && !this.sel.done[1]) { if (this.sel.t % 4 === 0) this.sel.cur[1] = Math.floor(Math.random() * ROSTER.length); if (!this.sel.cpuT) this.sel.cpuT = this.sel.t + 60; if (this.sel.t >= this.sel.cpuT) { this.sel.done[1] = true; Audio.lick(ROSTER[this.sel.cur[1]].lick, 52); } }
    if (this.sel.done[0] && this.sel.done[1]) {
      if (!this.sel.goT) this.sel.goT = this.sel.t + 40;
      if (this.sel.t >= this.sel.goT) {
        if (this.online) { if (Net.side === 0) { const seed = (Date.now() & 0x7fffffff) >>> 0; const delay = Math.max(2, Math.min(8, Math.ceil(Net.rtt / 2 / 16.7) + 1)); Net.send({ t: 'start', seed, delay, ids: [ROSTER[this.sel.cur[0]].id, ROSTER[this.sel.cur[1]].id] }); this.startFight(seed, [ROSTER[this.sel.cur[0]].id, ROSTER[this.sel.cur[1]].id], delay); } }
        else this.startFight((Date.now() & 0x7fffffff) >>> 0, [ROSTER[this.sel.cur[0]].id, ROSTER[this.sel.cur[1]].id], 0);
      }
    }
  },
  onNet(d) {
    if (d.t === 'sel') { const p = 1 - Net.side; this.sel.cur[p] = d.i; if (d.done) { if (!this.sel.done[p]) Audio.lick(ROSTER[d.i].lick, 52); this.sel.done[p] = true; } }
    else if (d.t === 'start') { this.sel.done = [true, true]; this.startFight(d.seed, d.ids, d.delay); }
    else if (d.t === 'i') { Lockstep.onRemote(d.f, d.b); }
    else if (d.t === 'rematch') { this.goSelect(true); }
  },

  // ---------- pelea ----------
  startFight(seed, ids, delay) {
    const rng = RNG.make(seed); const stage = rng.int(STAGES.length);
    this.seed = seed; this.st = Engine.newState(seed, stage, ids, { rounds: 3, training: this.mode === 'train' });
    this.dummy = 0;
    Render.reset(); Particles.reset(STAGES[stage].particles);
    if (this.online) Lockstep.start(Net.side, delay);
    this.screen = 'vs'; this.vsT = 0; this.paused = false; Input.flush();
    Audio.stopMusic();
  },
  updateFight() {
    if (!this.online && (Input.once('Enter') || Input.once('NumpadEnter'))) { this.paused = !this.paused; Audio.sfx('select'); Input.flush(); if (this.paused) Audio.musicBus && (Audio.musicBus.gain.value = 0.15); else Audio.musicBus && (Audio.musicBus.gain.value = Audio.musicVol); }
    if (this.paused) { if (Input.once('Escape')) { this.paused = false; Audio.musicBus && (Audio.musicBus.gain.value = Audio.musicVol); this.goTitle(); } return; }
    if (!this.online && Input.once('Escape')) { this.goTitle(); return; }
    if (this.mode === 'train') {
      if (Input.once('KeyT')) { this.dummy = (this.dummy + 1) % 3; Audio.sfx('select'); }
      if (Input.once('KeyR')) { Engine.resetRound(this.st); this.st.phase = 'fight'; Render.reset(); }
      if (Input.once('KeyM')) this.hideMoves = !this.hideMoves;
    }
    const st = this.st;
    if (st.phase === 'end') {
      if (st.endByKO && st.winner >= 0) { this.screen = 'finish'; Fatality.start(st); Audio.stopMusic(); Input.flush(); return; }
      this.screen = 'result'; this.resultT = 0; Audio.playMusic('win', 5); Input.flush(); return;
    }
    let bits;
    if (this.online) {
      const r = Lockstep.tick(Input.read(0)); this.netInfo = 'ping ' + Math.round(Net.rtt) + ' ms · retraso ' + Lockstep.delay + ' f' + (Lockstep.stalled > 5 ? ' · esperando…' : '');
      if (!r) return; bits = r;
    } else bits = [Input.read(0), this.mode === '2p' ? Input.read(1) : this.mode === 'train' ? (this.dummy === 0 ? 0 : this.dummy === 1 ? (st.f[1].face > 0 ? BTN.L : BTN.R) : CPU.decide(st, 1, this.level)) : CPU.decide(st, 1, this.level)];
    Engine.step(st, bits[0], bits[1]); Render.consume(st);
    for (const f of st.f) if (f.st === 'jump' && f.t === 1) Audio.sfx('jump');
  },
  afterResult(rematch) {
    if (this.online) { Net.send({ t: 'rematch' }); this.goSelect(true); }
    else if (rematch) this.goSelect(false); else this.goTitle();
  },

  update() {
    if (this.screen === 'title') this.updateTitle();
    else if (this.screen === 'select') this.updateSelect();
    else if (this.screen === 'vs') { this.vsT++; if (this.vsT === 1) Audio.sfx('round'); if (this.vsT > (this.mode === 'train' ? 90 : this.VS_FRAMES) || (this.vsT > 60 && (Input.once('Enter') || Input.once('Space')))) { this.screen = 'fight'; Audio.playMusic(STAGES[this.st.stage], this.seed); } }
    else if (this.screen === 'fight') this.updateFight();
    else if (this.screen === 'finish') { Fatality.update(); if (Fatality.done) { this.screen = 'result'; this.resultT = 0; Render.banner = { text: this.st.f[this.st.winner].id + ' WINS', sub: ROSTER_BY_ID[this.st.f[this.st.winner].id].name + ' · ' + Fatality.fat.name, t: 99999, col: '#ffd34d', y: 130 }; Audio.playMusic('win', 5); Input.flush(); } }
    else if (this.screen === 'result') { this.resultT++; if (this.resultT > 30 && (Input.once('Enter') || Input.once('KeyJ') || Input.once('Space'))) this.afterResult(true); if (Input.once('Escape')) { Net.close(); this.goTitle(); } }
  },

  // ---------- dibujo de pantallas ----------
  render() {
    const ctx = this.ctx; ctx.setTransform(this.scale[0], 0, 0, this.scale[1], 0, 0); ctx.clearRect(0, 0, 960, 540);
    if (this.screen === 'title' || this.screen === 'lobby') this.drawTitle(ctx);
    else if (this.screen === 'select') this.drawSelect(ctx);
    else if (this.screen === 'vs') this.drawVS(ctx);
    else if (this.screen === 'finish') { Render.draw(ctx, this.st, { hideFighters: true }); Fatality.draw(ctx); }
    else if (this.screen === 'fight' || this.screen === 'result') { Render.draw(ctx, this.st, { netInfo: this.online ? this.netInfo : '', training: this.mode === 'train' ? { dummy: this.dummy, hideMoves: this.hideMoves } : null, hideFighters: this.screen === 'result' && this.st.endByKO && this.st.winner >= 0 });
      if (this.screen === 'result' && this.st.endByKO && this.st.winner >= 0) Fatality.draw(ctx); if (this.screen === 'result') this.drawResult(ctx); if (this.paused && this.screen === 'fight') this.drawPause(ctx); }
  },
  logo(ctx, y, scale = 1) {
    ctx.save(); ctx.translate(480, y); ctx.scale(scale, scale); ctx.textAlign = 'center';
    ctx.font = 'italic bold 78px Impact, Arial Black, Arial'; ctx.lineWidth = 10; ctx.strokeStyle = '#1a1018'; ctx.strokeText('ACID GEAR', 0, 0);
    const g = ctx.createLinearGradient(0, -60, 0, 10); g.addColorStop(0, '#fff176'); g.addColorStop(0.5, '#ff8c1a'); g.addColorStop(1, '#c2185b'); ctx.fillStyle = g; ctx.fillText('ACID GEAR', 0, 0);
    ctx.font = 'bold 26px Impact, Arial Black, Arial'; ctx.lineWidth = 6; ctx.strokeText('XTREME LITHO-STRIKE', 0, 36); ctx.fillStyle = '#b9ff3c'; ctx.fillText('XTREME LITHO-STRIKE', 0, 36);
    ctx.restore();
  },
  drawTitle(ctx) {
    const t = Render.t++;
    const g = ctx.createLinearGradient(0, 0, 0, 540); g.addColorStop(0, '#1a0a2e'); g.addColorStop(1, '#3a1020'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 540);
    // burbujas ácidas de fondo
    ctx.fillStyle = 'rgba(185,255,60,0.12)'; for (let i = 0; i < 30; i++) { const x = (i * 97) % 960, y = 540 - ((t * (0.5 + (i % 5) * 0.3) + i * 60) % 600); ctx.beginPath(); ctx.arc(x, y, 6 + (i % 7) * 4, 0, 7); ctx.fill(); }
    // dos luchadores de muestra
    const a = Engine.newFighter(ROSTER[(Math.floor(t / 300)) % ROSTER.length].id, 0), b = Engine.newFighter(ROSTER[(Math.floor(t / 300) + 9) % ROSTER.length].id, 1); b.face = -1;
    a.st = 'idle'; b.st = 'idle'; a.t = b.t = t; FighterDraw.draw(ctx, a, t, 150, 470, 1.1); FighterDraw.draw(ctx, b, t, 810, 470, 1.1);
    this.logo(ctx, 150, 1);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ccc'; ctx.font = '13px Arial'; ctx.fillText('17 taxa de la clase Acidithiobacillia · 20 escenarios extremófilos', 480, 215);
    if (this.labLogo && this.labLogo.complete && this.labLogo.naturalWidth) { const lw = 270, lh = lw * this.labLogo.naturalHeight / this.labLogo.naturalWidth; ctx.drawImage(this.labLogo, 16, 14, lw, lh); }
    for (let i = 0; i < this.MENU.length; i++) {
      const sel = i === this.menuIdx; ctx.fillStyle = sel ? '#ffd34d' : '#fff'; ctx.font = (sel ? 'bold ' : '') + '20px Arial';
      let txt = this.MENU[i][0]; if (this.MENU[i][1] === 'level') txt += ['FÁCIL', 'NORMAL', 'DIFÍCIL'][this.level - 1] + '  (←/→)';
      ctx.fillText((sel ? '▶ ' : '') + txt, 480, 320 + i * 31);
    }
    ctx.fillStyle = '#888'; ctx.font = '12px Arial'; ctx.fillText('W/S o ↑/↓ para elegir · Enter para confirmar · 3 rounds de 2:00 · v' + this.VERSION, 480, 520);
    if (this.screen === 'lobby') { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 960, 540); }
  },
  drawSelect(ctx) {
    const t = Render.t++;
    const g = ctx.createLinearGradient(0, 0, 960, 540); g.addColorStop(0, '#12082a'); g.addColorStop(1, '#2a0a1a'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 540);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffd34d'; ctx.font = 'italic bold 30px Impact, Arial Black, Arial'; ctx.fillText('ELIGE TU TAXÓN', 480, 48);
    ctx.fillStyle = '#aaa'; ctx.font = '12px Arial'; ctx.fillText(this.online ? 'Tú eres el jugador ' + (Net.side + 1) + ' · WASD mueve · J confirma · ping ' + Math.round(Net.rtt) + ' ms' : this.mode === 'train' ? (this.sel.done[0] ? 'Ahora elige al MUÑECO (WASD + J)' : 'Elige TU personaje (WASD + J) · luego el muñeco') : 'P1: WASD + J   ·   P2: flechas + Numpad1 (o B)   ·   Esc vuelve', 480, 70);
    // grilla 9x2
    for (let i = 0; i < ROSTER.length; i++) {
      const r = ROSTER[i], col = i % 9, row = Math.floor(i / 9), x = 30 + col * 100, y = 120 + row * 100;
      ctx.fillStyle = CLADES[r.clade].col; ctx.globalAlpha = 0.35; ctx.fillRect(x, y, 92, 90); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 3; ctx.strokeRect(x, y, 92, 90);
      const f = Engine.newFighter(r.id, 0); f.st = 'idle'; f.t = t;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, 92, 90); ctx.clip(); FighterDraw.draw(ctx, f, t + i * 7, x + 46, y + 88, 0.5); ctx.restore();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText(r.id, x + 46, y + 18);
      for (let p = 0; p < 2; p++) if (this.sel.cur[p] === i) { ctx.strokeStyle = p === 0 ? '#3af' : '#f55'; ctx.lineWidth = 4; ctx.strokeRect(x - 3 + p * 2, y - 3 + p * 2, 98 - p * 4, 96 - p * 4); ctx.fillStyle = p === 0 ? '#3af' : '#f55'; ctx.font = 'bold 12px Arial'; ctx.fillText(p === 0 ? 'P1' : 'P2', x + 14 + p * 64, y + 84); }
    }
    // fichas compactas (izquierda P1, derecha P2) + gráfico de araña al centro
    for (let p = 0; p < 2; p++) {
      const r = ROSTER[this.sel.cur[p]], left = p === 0;
      const f = Engine.newFighter(r.id, p); f.st = this.sel.done[p] ? 'attack' : 'idle'; f.move = 'HP'; f.t = this.sel.done[p] ? 10 : t; f.face = left ? 1 : -1;
      FighterDraw.draw(ctx, f, t, left ? 90 : 870, 515, 0.8);
      ctx.textAlign = left ? 'left' : 'right'; const tx = left ? 165 : 795;
      ctx.fillStyle = CLADES[r.clade].col; ctx.font = 'bold 30px Arial'; ctx.fillText(r.id, tx, 358);
      ctx.fillStyle = '#fff'; ctx.font = 'italic 15px Arial'; ctx.fillText(r.name, tx, 378);
      // clado (punto de color) + arquetipo
      ctx.fillStyle = CLADES[r.clade].col; ctx.beginPath(); ctx.arc(left ? tx + 6 : tx - 6, 395, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#ccc'; ctx.font = '12px Arial'; ctx.fillText(r.arch, left ? tx + 18 : tx - 18, 399);
      // especial / overdrive con símbolos
      ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 13px Arial'; ctx.fillText('★ ' + r.special.name, tx, 424); ctx.fillStyle = '#888'; ctx.font = '10px Arial'; ctx.fillText('especial · U', tx, 437);
      ctx.fillStyle = '#ff4df0'; ctx.font = 'bold 13px Arial'; ctx.fillText('◆ ' + r.od.name, tx, 458); ctx.fillStyle = '#888'; ctx.font = '10px Arial'; ctx.fillText('overdrive · O', tx, 471);
      // icono del tipo de especial
      const icon = { proj: '●→', slowproj: '❄→', upper: '↑!', column: '▲▲', grab: '✊', drain: '✊♥', aura: '◎', teleport: '≈', rain: '☂', wall: '▣', wave: '〰', absorb: '⊕', beam: '═►', steam: '♨' }[r.special.kind] || '•';
      ctx.fillStyle = '#9ff'; ctx.font = '13px Arial'; ctx.fillText(icon + '  ' + { proj: 'proyectil', slowproj: 'proyectil que ralentiza', upper: 'antiaéreo', column: 'columna', grab: 'agarre', drain: 'agarre que cura', aura: 'aura de daño', teleport: 'teletransporte', rain: 'lluvia', wall: 'trampa', wave: 'ola', absorb: 'contra / absorbe', beam: 'rayo', steam: 'puño pesado' }[r.special.kind], tx, 492);
      if (this.sel.done[p]) { ctx.fillStyle = '#b9ff3c'; ctx.font = 'bold 14px Arial'; ctx.fillText('¡LISTO!', tx, 518); }
    }
    this.drawRadar(ctx, 480, 428, 70);
  },
  // Gráfico de araña: todas las líneas de los 17 taxa en tenue, el seleccionado por P1 (azul) y P2 (rojo) destacados
  RADAR_AXES: ['VIDA', 'VELOCIDAD', 'SALTO', 'PODER', 'DEFENSA', 'ALCANCE'],
  radarVals(r) { const S = r.stats; const reach = { proj: 0.9, slowproj: 0.9, beam: 1.0, column: 0.8, rain: 0.85, wave: 0.9, wall: 0.6, teleport: 0.7, upper: 0.3, grab: 0.2, drain: 0.2, aura: 0.35, absorb: 0.3, steam: 0.4 }[r.special.kind] || 0.5;
    return [(S.hp - 850) / 400, (S.spd - 0.7) / 0.6, (S.jmp - 0.75) / 0.55, (S.pow - 0.85) / 0.55, (S.def - 0.85) / 0.4, reach].map(v => Math.max(0.08, Math.min(1, v))); },
  drawRadar(ctx, cx, cy, R) {
    const n = 6, ang = i => -Math.PI / 2 + i * Math.PI * 2 / n;
    ctx.save(); ctx.lineWidth = 1;
    for (let k = 1; k <= 4; k++) { ctx.strokeStyle = 'rgba(255,255,255,' + (k === 4 ? 0.35 : 0.12) + ')'; ctx.beginPath(); for (let i = 0; i <= n; i++) ctx.lineTo(cx + Math.cos(ang(i)) * R * k / 4, cy + Math.sin(ang(i)) * R * k / 4); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang(i)) * R, cy + Math.sin(ang(i)) * R); ctx.stroke(); }
    const poly = (vals) => { ctx.beginPath(); for (let i = 0; i <= n; i++) { const v = vals[i % n]; ctx.lineTo(cx + Math.cos(ang(i)) * R * v, cy + Math.sin(ang(i)) * R * v); } };
    for (const r of ROSTER) { if (r === ROSTER[this.sel.cur[0]] || r === ROSTER[this.sel.cur[1]]) continue; ctx.strokeStyle = CLADES[r.clade].col; ctx.globalAlpha = 0.22; ctx.lineWidth = 1; poly(this.radarVals(r)); ctx.stroke(); }
    ctx.globalAlpha = 1;
    [[1, '#f55', 'rgba(255,85,85,0.28)'], [0, '#3af', 'rgba(51,170,255,0.3)']].forEach(([p, col, fill]) => { const r = ROSTER[this.sel.cur[p]]; poly(this.radarVals(r)); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); });
    ctx.fillStyle = '#ddd'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
    this.RADAR_AXES.forEach((a, i) => { const x = cx + Math.cos(ang(i)) * (R + 18), y = cy + Math.sin(ang(i)) * (R + 16) + 4; ctx.fillText(a, x, y); });
    ctx.font = '10px Arial'; ctx.fillStyle = '#3af'; ctx.textAlign = 'right'; ctx.fillText('■ P1 ' + ROSTER[this.sel.cur[0]].id, cx - 60, cy + R + 36); ctx.fillStyle = '#f55'; ctx.textAlign = 'left'; ctx.fillText('■ P2 ' + ROSTER[this.sel.cur[1]].id, cx + 60, cy + R + 36);
    ctx.fillStyle = '#777'; ctx.textAlign = 'center'; ctx.fillText('líneas tenues: los otros 15 taxa (color = clado)', cx, cy - R - 26);
    ctx.restore();
  },
  wrap(ctx, text, x, y, w, lh) { const words = text.split(' '); let line = ''; for (const wd of words) { const test = line + wd + ' '; if (ctx.measureText(test).width > w && line) { ctx.fillText(line, x, y); line = wd + ' '; y += lh; } else line = test; } ctx.fillText(line, x, y); },
  drawVS(ctx) {
    const st = this.st, stage = STAGES[st.stage], t = this.vsT;
    StageDraw.draw(ctx, stage, 270, Render.t++); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, 960, 540);
    const k = Math.min(1, t / 20);
    for (let p = 0; p < 2; p++) { const f = Engine.newFighter(st.f[p].id, p); f.st = 'attack'; f.move = p ? 'K' : 'HP'; f.t = 10; f.face = p ? -1 : 1; FighterDraw.draw(ctx, f, t, p ? 960 - 120 * k : 120 * k, 400, 1.0); }
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 26px Arial'; ctx.fillText(ROSTER_BY_ID[st.f[0].id].id, 120, 60); ctx.fillText(ROSTER_BY_ID[st.f[1].id].id, 840, 60);
    ctx.fillStyle = '#ffd34d'; ctx.font = 'italic bold 64px Impact, Arial Black, Arial'; ctx.lineWidth = 6; ctx.strokeStyle = '#1a1018'; ctx.strokeText('VS', 480, 70); ctx.fillText('VS', 480, 70);
    // tabla de controles
    const two = this.mode === '2p', x0 = 200, w = 560, y0 = 92, rows = this.CONTROLS, rh = 20;
    ctx.fillStyle = 'rgba(10,5,20,0.85)'; ctx.fillRect(x0, y0, w, rows.length * rh + 52); ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, w, rows.length * rh + 52);
    ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#ffd34d'; ctx.textAlign = 'left'; ctx.fillText('CONTROLES', x0 + 14, y0 + 20);
    ctx.textAlign = 'center'; ctx.fillStyle = '#3af'; ctx.fillText(this.online ? 'TÚ (teclado)' : 'JUGADOR 1', x0 + (two ? 300 : 400), y0 + 20);
    if (two) { ctx.fillStyle = '#f55'; ctx.fillText('JUGADOR 2', x0 + 460, y0 + 20); }
    ctx.font = '13px Arial';
    rows.forEach((r, i) => {
      const y = y0 + 40 + i * rh; if (i % 2) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x0 + 2, y - 14, w - 4, rh); }
      ctx.textAlign = 'left'; ctx.fillStyle = '#ddd'; ctx.fillText(r[0], x0 + 14, y);
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Arial'; ctx.fillText(r[1], x0 + (two ? 300 : 400), y); if (two) ctx.fillText(r[2], x0 + 460, y); ctx.font = '13px Arial';
    });
    ctx.textAlign = 'center'; ctx.fillStyle = '#aaa'; ctx.font = '11px Arial'; ctx.fillText('Los golpes se encadenan: ligero → fuerte → patada → especial → overdrive. También funciona gamepad.', 480, y0 + rows.length * rh + 44);
    // escenario y cuenta regresiva
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(180, 436, 600, 64);
    ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 18px Arial'; ctx.fillText(stage.name + '  ·  ' + stage.place, 480, 460);
    ctx.fillStyle = '#eee'; ctx.font = '14px Arial'; ctx.fillText('pH ' + stage.ph + '  ·  ' + stage.temp, 480, 482);
    const left = Math.ceil((this.VS_FRAMES - t) / 60);
    ctx.fillStyle = '#ff6a2a'; ctx.font = 'italic bold 22px Impact, Arial Black, Arial'; ctx.fillText('LA PELEA EMPIEZA EN ' + Math.max(0, left) + (t > 60 ? '   ·   Enter para saltar' : ''), 480, 526);
  },
  drawPause(ctx) {
    const st = this.st; ctx.fillStyle = 'rgba(5,2,12,0.82)'; ctx.fillRect(0, 0, 960, 540);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffd34d'; ctx.font = 'italic bold 44px Impact, Arial Black, Arial'; ctx.fillText('PAUSA', 480, 52);
    ctx.fillStyle = '#aaa'; ctx.font = '12px Arial'; ctx.fillText('Enter: seguir   ·   Esc: salir al título', 480, 72);
    const cols = [{ x: 30, w: 440, col: '#3af', side: 0, keys: ['A / D', 'W', 'S', 'J', 'K', 'L  (o I)', 'U', 'O', 'H', 'D, D + K', 'S, D + J', 'A, A  /  D, D', 'S + K  /  S + L', 'W tras K / L / S+K'] },
                  { x: 490, w: 440, col: '#f55', side: 1, keys: ['← / →', '↑', '↓', 'Num 1  (B)', 'Num 2  (N)', 'Num 3  (M)', 'Num 5  (.)', 'Num 6  (/)', 'Num 0  (Shift der.)', '→, → + Num2', '↓, → + Num1', '←, ←  /  →, →', '↓ + Num2  /  ↓ + Num3', '↑ tras Num2 / Num3'] }];
    const names = ['Mover', 'Saltar', 'Agacharse', 'Golpe ligero', 'Golpe fuerte', 'Patada', 'Especial', 'Overdrive (medidor 100 %)', 'Burst / Lysis Cancel', 'LITHO RUSH', 'PROTON SHOT', 'Dash atrás / adelante', 'Lanzador / Barrida', 'Jump cancel'];
    for (const c of cols) {
      const f = st.f[c.side], r = ROSTER_BY_ID[f.id], who = c.side === 0 ? (this.mode === '2p' ? 'JUGADOR 1' : 'TÚ') : (this.mode === '2p' ? 'JUGADOR 2' : this.mode === 'train' ? 'MUÑECO' : 'CPU');
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(c.x, 86, c.w, 440); ctx.strokeStyle = c.col; ctx.lineWidth = 2; ctx.strokeRect(c.x, 86, c.w, 440);
      ctx.textAlign = 'left'; ctx.fillStyle = c.col; ctx.font = 'bold 16px Arial'; ctx.fillText(who + ' · ' + r.id + ' ' + r.name, c.x + 12, 108);
      const sx = c.side === 0 ? c.x + 60 : c.x + c.w - 60; const fg = Engine.newFighter(r.id, c.side); fg.st = 'idle'; fg.t = Render.t; fg.face = c.side === 0 ? 1 : -1;
      ctx.save(); ctx.beginPath(); ctx.rect(c.x, 110, c.w, 110); ctx.clip(); FighterDraw.draw(ctx, fg, Render.t, sx, 215, 0.6); ctx.restore();
      ctx.font = '12px Arial';
      names.forEach((n, i) => { const y = 136 + i * 20, tx = c.side === 0 ? c.x + 130 : c.x + 14; if (i % 2) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(c.x + 2, y - 13, c.w - 4, 20); }
        ctx.fillStyle = '#ddd'; ctx.font = '12px Arial'; ctx.fillText(n, tx, y); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.fillText(c.keys[i], tx + 160, y); });
      const y0 = 136 + names.length * 20 + 6; ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 12px Arial'; ctx.fillText('ESPECIAL: ' + r.special.name, c.x + 14, y0); ctx.fillStyle = '#ff4df0'; ctx.fillText('OVERDRIVE: ' + r.od.name, c.x + 14, y0 + 18);
      ctx.fillStyle = '#9ff'; ctx.font = '11px Arial';
      this.wrap(ctx, 'COMBOS: ligero → ligero → fuerte → patada → especial → overdrive. Salto + golpe = overhead. Tras fuerte/patada/lanzador: W y seguir en el aire. El daño baja 10 % por golpe (mín. 35 %). Burst: 1 por round. Lysis Cancel: 50 % del medidor.', c.x + 14, y0 + 36, c.w - 28, 14);
    }
  },
  drawResult(ctx) {
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 330, 960, 60);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Arial'; ctx.fillText(this.online ? 'Enter: revancha (volver a elegir)   ·   Esc: salir' : 'Enter: volver a elegir personaje   ·   Esc: título', 480, 366);
  }
};
window.addEventListener('load', () => Game.init());
