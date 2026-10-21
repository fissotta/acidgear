// Música y efectos 100 % sintetizados con Web Audio (sin archivos). Metal procedural estilo Guilty Gear:
// guitarra = 2 sierras desafinadas → distorsión (waveshaper) → filtro; bajo, batería con doble bombo, lead en la escala del escenario.
const Audio = {
  ctx: null, master: null, music: { on: false, timer: null }, vol: 0.5, musicVol: 0.6,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = this.vol;
    const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6;
    this.master.connect(comp); comp.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = this.musicVol; this.musicBus.connect(this.master);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
    // cadena de guitarra compartida
    const ws = this.ctx.createWaveShaper(); const n = 1024, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; curve[i] = Math.tanh(x * 6) * 0.8; }
    ws.curve = curve; ws.oversample = '2x';
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 0.8;
    const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 90;
    const gg = this.ctx.createGain(); gg.gain.value = 0.35;
    ws.connect(lp); lp.connect(hp); hp.connect(gg); gg.connect(this.musicBus); this.gtrIn = ws;
    const cws = this.ctx.createWaveShaper(); const cc = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; cc[i] = Math.tanh(x * 1.5); } cws.curve = cc;
    const clp = this.ctx.createBiquadFilter(); clp.type = 'lowpass'; clp.frequency.value = 3200; const cg = this.ctx.createGain(); cg.gain.value = 0.25;
    cws.connect(clp); clp.connect(cg); cg.connect(this.musicBus); this.cleanIn = cws;
    this.noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  setVolume(v) { this.vol = v; if (this.master) this.master.gain.value = v; },

  // ---- voces ----
  note(midi) { return 440 * Math.pow(2, (midi - 69) / 12); },
  gtr(midi, t, dur, clean, vel = 1) {
    const c = this.ctx, dest = clean ? this.cleanIn : this.gtrIn;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.005); g.gain.setValueAtTime(vel, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.001, t + dur); g.connect(dest);
    [-7, 7].forEach(det => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = this.note(midi); o.detune.value = det; o.connect(g); o.start(t); o.stop(t + dur + 0.02); });
  },
  chord(midi, t, dur, vel) { this.gtr(midi, t, dur, false, vel); this.gtr(midi + 7, t, dur, false, vel * 0.8); this.gtr(midi + 12, t, dur, false, vel * 0.5); },
  bass(midi, t, dur) {
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'square'; o.frequency.value = this.note(midi - 12); o2.type = 'sawtooth'; o2.frequency.value = this.note(midi - 12); o2.detune.value = 4;
    f.type = 'lowpass'; f.frequency.value = 500; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(this.musicBus); o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur);
  },
  kick(t, vel = 1) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.09); g.gain.setValueAtTime(vel * 0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16); o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + 0.2); this.noise(t, 0.02, 3000, 'lowpass', vel * 0.4, this.musicBus); },
  snare(t, vel = 1) { this.noise(t, 0.14, 1600, 'bandpass', vel * 0.6, this.musicBus); const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(120, t + 0.06); g.gain.setValueAtTime(vel * 0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1); o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + 0.12); },
  hat(t, open) { this.noise(t, open ? 0.18 : 0.04, 8000, 'highpass', 0.22, this.musicBus); },
  crash(t) { this.noise(t, 1.2, 5000, 'highpass', 0.35, this.musicBus); },
  noise(t, dur, freq, type, vel, dest) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = type === 'bandpass' ? 1.2 : 0.7;
    const g = c.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(f); f.connect(g); g.connect(dest || this.sfxBus); s.start(t); s.stop(t + dur + 0.02);
  },

  // ---- compositor ----
  SCALES: { minor: [0, 2, 3, 5, 7, 8, 10], phrygian: [0, 1, 3, 5, 7, 8, 10] },
  KEYS: { E: 40, F: 41, G: 43, A: 45, B: 47, C: 48, D: 50 },
  // Estilos: thrash (rápido, denso), gallop (galope a lo Iron Maiden), doom (lento y pesado), groove (sincopado), epic (lead siempre, acordes largos)
  compose(seed, st) {
    const rng = RNG.make(seed * 7919 + 13), sc = this.SCALES[st.scale || 'minor'], root = this.KEYS[st.key || 'E'];
    const style = st.style || ['thrash', 'gallop', 'doom', 'groove', 'epic'][rng.int(5)];
    const dens = { thrash: 0.15, gallop: 0.1, doom: 0.45, groove: 0.35, epic: 0.25 }[style];
    const riff = () => { const r = []; for (let i = 0; i < 16; i++) { const v = rng.next();
      if (style === 'gallop') { r.push(i % 4 === 3 ? (rng.next() < 0.6 ? sc[rng.int(sc.length)] : 0) : 0); continue; }
      if (style === 'groove' && (i === 2 || i === 6 || i === 10 || i === 13)) { r.push(-1); continue; }
      r.push(v < dens ? -1 : v < dens + 0.4 ? 0 : sc[rng.int(sc.length)] + (rng.next() < 0.2 ? 12 : 0)); } r[0] = 0; return r; }; // 0 = raíz (palm mute), -1 = silencio
    const lead = () => { const r = []; let cur = 7; for (let i = 0; i < 16; i++) { if (rng.next() < (style === 'epic' ? 0.2 : 0.35)) { r.push(-1); continue; } cur = Math.max(0, Math.min(13, cur + rng.int(5) - 2)); const deg = sc[cur % 7] + 12 * Math.floor(cur / 7); r.push(deg); } return r; };
    const progs = [[0, 0, 3, 7], [0, 0, 5, 8], [0, 3, 5, 3], [0, 8, 7, 5], [0, 0, 1, 0], [0, 5, 3, 1]];
    const prog = progs[rng.int(progs.length)];
    const tempo = Math.round((st.tempo || 180) * { thrash: 1.05, gallop: 1.0, doom: 0.62, groove: 0.85, epic: 0.9 }[style]);
    return { root, sc, riffA: riff(), riffB: riff(), riffC: riff(), leadA: lead(), leadB: lead(), prog, tempo, clean: !!st.clean, drumVar: rng.int(3), style, variant: rng.int(1000) };
  },
  playMusic(stageOrMenu, seed = 1) {
    this.init(); this.stopMusic();
    const st = stageOrMenu === 'menu' ? { key: 'A', scale: 'minor', tempo: 150, clean: true } : stageOrMenu === 'win' ? { key: 'D', scale: 'minor', tempo: 120, clean: true } : stageOrMenu;
    const song = this.compose(seed, st), c = this.ctx; song.menu = stageOrMenu === 'menu' || stageOrMenu === 'win';
    const sixteenth = 60 / song.tempo / 4; let step = 0, next = c.currentTime + 0.1;
    this.music.on = true;
    const tick = () => {
      if (!this.music.on) return;
      while (next < c.currentTime + 0.15) { this.playStep(song, step, next, sixteenth); step++; next += sixteenth; }
      this.music.timer = setTimeout(tick, 40);
    };
    tick();
  },
  playStep(song, step, t, dt) {
    const bar = Math.floor(step / 16), i = step % 16, section = Math.floor(bar / 4) % 4, chordOff = song.prog[bar % 4];
    const riff = section === 3 ? song.riffC : section % 2 ? song.riffB : song.riffA, lead = song.style === 'epic' ? (section % 2 ? song.leadB : song.leadA) : section === 1 ? song.leadA : section === 3 ? song.leadB : null;
    const n = riff[i], root = song.root + chordOff, sty = song.style;
    if (song.menu) { // versión limpia (menú / victoria): arpegios
      const arp = [0, 7, 12, 3, 7, 12, 15, 12][i % 8]; if (i % 2 === 0) this.gtr(root + arp + 12, t, dt * 2.5, true, 0.5);
      if (i === 0 || i === 8) this.bass(root, t, dt * 7); if (i % 4 === 0) this.kick(t, 0.5); if (i === 4 || i === 12) this.snare(t, 0.4); if (i % 2) this.hat(t, false);
      return;
    }
    const sus = sty === 'doom' ? 2.2 : sty === 'epic' ? 1.4 : 1;
    if (n === 0) this.chord(root, t, dt * 0.8 * sus, 0.9);            // palm mute en la raíz
    else if (n > 0) this.chord(root + n, t, dt * 1.6 * sus, 1.0);     // nota del riff
    if (sty === 'epic' && i === 0) this.chord(root, t, dt * 14, 0.5);  // acorde sostenido de fondo
    if (i % 4 === 0 || n > 0) this.bass(root + (n > 0 ? n : 0), t, dt * 1.5 * sus);
    if (sty === 'groove' && (i === 3 || i === 11)) this.bass(root + 7, t, dt * 1.2);
    if (lead && lead[i] >= 0) this.gtr(root + 24 + lead[i], t, dt * 1.9, false, 0.55);
    // batería según estilo
    if (sty === 'doom') { if (i === 0 || i === 8) this.kick(t, 1); if (i === 4 || i === 12) this.snare(t, 1); if (i % 4 === 0) this.hat(t, true); if (i === 0 && bar % 2 === 0) this.crash(t); return; }
    if (sty === 'groove') { if ([0, 3, 6, 10].includes(i)) this.kick(t, 1); if (i === 4 || i === 12) this.snare(t, 1); if (i === 14) this.snare(t, 0.5); if (i % 2 === 0) this.hat(t, i === 14); if (i === 0 && bar % 4 === 0) this.crash(t); return; }
    const dbl = sty === 'thrash' ? true : sty === 'gallop' ? (i % 4 !== 2) : song.drumVar === 0 ? (i % 2 === 0) : song.drumVar === 1 ? (i % 4 !== 3) : true;
    if (dbl) this.kick(t, i % 4 === 0 ? 1 : 0.7);
    if (i === 4 || i === 12) this.snare(t, 1); if (sty === 'thrash' && (i === 2 || i === 6 || i === 10 || i === 14) && section >= 2) this.snare(t, 0.9);
    if (section === 3 && i === 14) this.snare(t, 0.7);
    this.hat(t, i === 14);
    if (i === 0 && bar % 4 === 0) this.crash(t);
  },
  stopMusic() { this.music.on = false; if (this.music.timer) clearTimeout(this.music.timer); },
  lick(notes, root = 52) { this.init(); const c = this.ctx; let t = c.currentTime + 0.02; notes.forEach((n, i) => { this.gtr(root + n, t, 0.16, false, 0.9); t += 0.11; }); },

  // ---- efectos ----
  sfx(name, p = {}) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime;
    const sweep = (f0, f1, dur, type, vel) => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + dur); };
    switch (name) {
      case 'hit': { const s = p.str || 1; this.noise(t, 0.08 + s * 0.04, 900 - s * 150, 'lowpass', 0.8); sweep(180 - s * 30, 50, 0.12 + s * 0.05, 'square', 0.5); break; }
      case 'block': this.noise(t, 0.05, 2500, 'bandpass', 0.5); sweep(900, 400, 0.05, 'square', 0.25); break;
      case 'whoosh': this.noise(t, 0.12, 1200, 'bandpass', 0.35); break;
      case 'special': sweep(200, 1400, 0.3, 'sawtooth', 0.4); this.noise(t, 0.3, 3000, 'highpass', 0.3); break;
      case 'od': sweep(80, 2000, 0.8, 'sawtooth', 0.6); this.noise(t, 0.8, 600, 'lowpass', 0.8); sweep(50, 30, 0.9, 'sine', 0.8); break;
      case 'ko': sweep(600, 40, 1.2, 'sawtooth', 0.7); this.noise(t, 1.0, 400, 'lowpass', 0.9); break;
      case 'burst': sweep(300, 2500, 0.4, 'square', 0.5); this.noise(t, 0.5, 2000, 'highpass', 0.6); break;
      case 'jump': sweep(300, 700, 0.12, 'sine', 0.25); break;
      case 'select': sweep(600, 1200, 0.08, 'square', 0.3); break;
      case 'move': sweep(400, 500, 0.05, 'square', 0.2); break;
      case 'round': sweep(100, 60, 0.5, 'sawtooth', 0.6); this.crash(t); break;
      case 'absorb': sweep(200, 1000, 0.25, 'sine', 0.4); break;
      case 'explode': this.noise(t, 0.5, 500, 'lowpass', 1.0); sweep(120, 30, 0.5, 'square', 0.6); break;
      case 'teleport': sweep(1500, 200, 0.2, 'sine', 0.4); this.noise(t, 0.3, 4000, 'highpass', 0.3); break;
    }
  }
};
