// Motor de pelea determinista. step(state, bits1, bits2) avanza exactamente un frame (60 Hz).
// Nada aquí usa Math.random ni el reloj: así dos navegadores con los mismos inputs dan la misma pelea (lockstep).
const ARENA_W = 1500, GRAV = 0.8, ROUND_FRAMES = 120 * 60, MAX_METER = 100;

const MOVES = {
  LP:  { s: 3,  a: 3, r: 8,  dmg: 30, hs: 18, bs: 8,  kb: 3, box: [20, 80, 60, 34], adv: 6, chain: ['LP', 'HP', 'K', 'cHP', 'cK', 'SP', 'OD'] },
  HP:  { s: 9,  a: 5, r: 18, dmg: 90, hs: 26, bs: 14, kb: 9, box: [25, 60, 90, 55], adv: 16, chain: ['K', 'cK', 'SP', 'OD'], jc: true },
  K:   { s: 7,  a: 5, r: 15, dmg: 70, hs: 24, bs: 12, kb: 7, box: [25, 20, 95, 45], adv: 18, chain: ['SP', 'OD'], jc: true },
  cK:  { s: 9,  a: 5, r: 20, dmg: 60, hs: 20, bs: 12, kb: 4, box: [20, 0, 100, 30], adv: 12, low: true, knockdown: true, chain: ['SP', 'OD'] },
  cHP: { s: 8,  a: 5, r: 22, dmg: 80, hs: 24, bs: 14, kb: 2, box: [10, 50, 60, 110], adv: 8, launch: true, chain: ['SP', 'OD'], jc: true },
  jLP: { s: 5,  a: 8, r: 8,  dmg: 45, hs: 14, bs: 8,  kb: 3, box: [10, -10, 70, 60], air: true, overhead: true, chain: ['jHP', 'jK'] },
  jHP: { s: 8,  a: 8, r: 10, dmg: 80, hs: 20, bs: 12, kb: 6, box: [10, -20, 80, 80], air: true, overhead: true, chain: ['jK'] },
  jK:  { s: 7,  a: 8, r: 10, dmg: 70, hs: 18, bs: 12, kb: 8, box: [20, -10, 90, 50], air: true, overhead: true, chain: [] },
  BURST: { s: 4, a: 8, r: 12, dmg: 0, hs: 30, bs: 0, kb: 22, box: [-90, 0, 180, 170], chain: [] },
  // Movimientos de comando (iguales para todos): → → + K = LITHO RUSH (embestida con armadura); ↓ ↘ → + J = PROTON SHOT (bola de ácido)
  RUSH: { s: 6, a: 10, r: 18, dmg: 110, hs: 26, bs: 16, kb: 16, box: [10, 30, 110, 110], knockdown: true, lunge: 11, armor: true, chain: ['SP', 'OD'] },
  SHOT: { s: 8, a: 1, r: 20, dmg: 0, hs: 0, bs: 0, kb: 0, box: [0, 0, 0, 0], shot: true, chain: ['SP', 'OD'] }
};

const Engine = {
  newState(seed, stageIdx, ids, opts) {
    const st = { frame: 0, rng: RNG.make(seed), seed, stage: stageIdx, round: 1, wins: [0, 0], timer: ROUND_FRAMES,
      phase: 'intro', phaseT: 0, f: [], proj: [], events: [], shake: 0, winner: -1, rounds: (opts && opts.rounds) || 3, training: !!(opts && opts.training) };
    st.f = [this.newFighter(ids[0], 0), this.newFighter(ids[1], 1)];
    this.resetRound(st);
    return st;
  },
  newFighter(id, side) {
    const r = ROSTER_BY_ID[id];
    return { id, side, x: 0, y: 0, vx: 0, vy: 0, face: 1, hp: r.stats.hp, maxhp: r.stats.hp, meter: 0, burst: true,
      st: 'idle', t: 0, move: null, hitDone: false, hitsLeft: 0, combo: 0, slow: 0, armor: 0, inv: 0, jumps: 0,
      bits: 0, prev: 0, tapL: -99, tapR: -99, auraT: 0, absorbT: 0, grabT: 0, kd: false, crouch: false, w: 56 * r.shape.w, h: 150 * r.shape.h, wins: 0 };
  },
  resetRound(st) {
    const [a, b] = st.f;
    a.x = ARENA_W / 2 - 220; b.x = ARENA_W / 2 + 220; a.face = 1; b.face = -1;
    for (const f of st.f) { f.y = 0; f.vx = f.vy = 0; f.hp = f.maxhp; f.st = 'idle'; f.t = 0; f.move = null; f.burst = true; f.slow = 0; f.armor = 0; f.inv = 0; f.auraT = 0; f.absorbT = 0; f.combo = 0; f.kd = false; f.proj = 0; }
    st.proj = []; st.timer = ROUND_FRAMES; st.phase = 'intro'; st.phaseT = 0;
    st.events.push({ type: 'round', n: st.round });
  },

  // ---------- paso principal ----------
  step(st, bits0, bits1) {
    st.events = []; st.frame++;
    if (st.shake > 0) st.shake--;
    const [a, b] = st.f; a.prev = a.bits; b.prev = b.bits; a.bits = bits0; b.bits = bits1;
    for (const f of st.f) { const d = this.dirOf(f); if (!f.hist) f.hist = []; f.hist.push(d); if (f.hist.length > 16) f.hist.shift(); }
    if (st.phase === 'intro') { st.phaseT++; if (st.phaseT === 120) { st.phase = 'fight'; st.events.push({ type: 'fight' }); } return; }
    if (st.phase === 'end') return;
    if (st.phase === 'ko') {
      st.phaseT++; this.physicsOnly(st);
      if (st.phaseT > 150) { this.nextRound(st); }
      return;
    }
    // fight
    st.timer--;
    this.updateFighter(st, a, b); this.updateFighter(st, b, a);
    this.resolveHits(st, a, b); this.resolveHits(st, b, a);
    this.updateProjectiles(st);
    this.pushApart(a, b);
    for (const f of st.f) { f.x = Math.max(30, Math.min(ARENA_W - 30, f.x)); if (f.st !== 'attack' && f.st !== 'grab' && f.st !== 'grabbed' && f.y === 0) f.face = (st.f[1 - f.side].x >= f.x) ? 1 : -1; }
    if (st.training) {
      st.timer = ROUND_FRAMES; a.meter = MAX_METER;
      for (const f of st.f) { if (f.hp < f.maxhp) { f.lowT = (f.lowT || 0) + 1; if (f.hp <= 0 || f.lowT > 180) { f.hp = f.maxhp; f.lowT = 0; if (f.st === 'hit' || f.st === 'launched' || f.st === 'down') { f.st = 'idle'; f.t = 0; f.y = 0; f.vy = 0; } } } else f.lowT = 0; }
      return;
    }
    // KO / tiempo
    if (a.hp <= 0 || b.hp <= 0) {
      st.phase = 'ko'; st.phaseT = 0; st.shake = 20; st.endByKO = true;
      const loser = a.hp <= 0 ? a : b; loser.st = 'ko'; loser.t = 0; loser.vy = 8; loser.vx = -loser.face * 6;
      const w = a.hp <= 0 ? (b.hp <= 0 ? -1 : 1) : 0;
      if (w >= 0) st.wins[w]++; st.events.push({ type: 'ko', winner: w });
      if (a.hp <= 0 && b.hp <= 0) { a.st = 'ko'; b.st = 'ko'; }
    } else if (st.timer <= 0) {
      st.phase = 'ko'; st.phaseT = 0; st.endByKO = false;
      const w = a.hp > b.hp ? 0 : b.hp > a.hp ? 1 : -1;
      if (w >= 0) st.wins[w]++; st.events.push({ type: 'timeover', winner: w });
      for (const f of st.f) if (f.st !== 'ko') { f.st = 'idle'; f.t = 0; }
    }
  },
  nextRound(st) {
    const need = Math.ceil(st.rounds / 2);
    if (st.wins[0] >= need || st.wins[1] >= need) { st.phase = 'end'; st.winner = st.wins[0] >= need ? 0 : 1; st.events.push({ type: 'end', winner: st.winner }); return; }
    st.round++; this.resetRound(st);
  },
  physicsOnly(st) {
    for (const f of st.f) { if (f.y > 0 || f.vy > 0) { f.vy -= GRAV; f.y += f.vy; f.x += f.vx; if (f.y <= 0) { f.y = 0; f.vy = 0; f.vx = 0; } } f.t++; }
  },

  pressed(f, b) { return (f.bits & b) && !(f.prev & b); },
  // dirección relativa al frente: 'D' abajo, 'DF' abajo-adelante, 'F' adelante, 'B' atrás, 'N' neutro…
  dirOf(f) { const d = f.bits & BTN.D, u = f.bits & BTN.U, fw = f.bits & this.fwd(f), bk = f.bits & this.back(f); return d ? (fw ? 'DF' : bk ? 'DB' : 'D') : u ? 'U' : fw ? 'F' : bk ? 'B' : 'N'; },
  qcf(f) { // ↓ (↘) → en los últimos 14 frames, en ese orden
    const h = f.hist || []; let iD = -1; for (let i = h.length - 1; i >= 0 && i >= h.length - 14; i--) if (h[i] === 'D' || h[i] === 'DB') { iD = i; }
    if (iD < 0) return false; for (let i = iD + 1; i < h.length; i++) if (h[i] === 'F' || h[i] === 'DF') return true; return false;
  },
  fwd(f) { return f.face > 0 ? BTN.R : BTN.L; },
  back(f) { return f.face > 0 ? BTN.L : BTN.R; },

  startMove(st, f, name) {
    const m = MOVES[name]; f.st = 'attack'; f.move = name; f.t = 0; f.hitDone = false; f.crouch = !!(name === 'cK' || name === 'cHP');
    if (name === 'BURST') { f.burst = false; f.inv = 24; st.events.push({ type: 'burst', x: f.x, y: f.y }); }
  },
  // Ataque especial u Overdrive: arranca el estado y define sus tiempos según el tipo
  startSpecial(st, f, opp, od) {
    const r = ROSTER_BY_ID[f.id]; const sp = od ? r.od : r.special;
    const T = { proj: [12, 4, 22], slowproj: [12, 4, 22], upper: [4, 16, 24], column: [14, 1, 28], grab: [6, 4, 18], aura: [8, 1, 10], teleport: [10, 1, 6],
      rain: [12, 1, 26], wall: [14, 1, 24], wave: [16, 1, 30], absorb: [2, 40, 10], beam: [16, 6, 30], steam: [16, 6, 36], drain: [6, 4, 18] }[sp.kind];
    f.st = 'attack'; f.move = od ? 'OD' : 'SP'; f.t = 0; f.hitDone = false; f.sp = sp; f.spT = T; f.hitsLeft = sp.hits || 1; f.crouch = false;
    if (sp.armor) f.armor = T[0] + T[1];
    if (od) { f.meter = 0; f.inv = T[0] + 2; st.shake = 10; st.events.push({ type: 'od', side: f.side, name: sp.name, x: f.x }); }
    else st.events.push({ type: 'special', side: f.side, x: f.x, kind: sp.kind, color: sp.color });
  },

  updateFighter(st, f, opp) {
    const r = ROSTER_BY_ID[f.id]; const S = r.stats; f.t++;
    if (f.slow > 0) f.slow--; if (f.armor > 0) f.armor--; if (f.inv > 0) f.inv--;
    if (f.auraT > 0) { f.auraT--; if (f.auraT % 10 === 0) this.auraTick(st, f, opp); }
    if (f.meter < MAX_METER && st.frame % 30 === 0 && Math.abs(f.x - opp.x) < 220) f.meter = Math.min(MAX_METER, f.meter + 1);
    const spdMul = (f.slow > 0 ? 0.55 : 1) * S.spd;
    const bits = f.bits, air = f.y > 0 || f.vy > 0;
    const holdF = bits & this.fwd(f), holdB = bits & this.back(f), holdD = bits & BTN.D, holdU = bits & BTN.U;
    // doble toque para dash
    if (this.pressed(f, BTN.L)) { if (st.frame - f.tapL < 12 && f.st === 'idle' || st.frame - f.tapL < 12 && f.st === 'walk') f.dashReq = -1; f.tapL = st.frame; }
    if (this.pressed(f, BTN.R)) { if (st.frame - f.tapR < 12 && (f.st === 'idle' || f.st === 'walk')) f.dashReq = 1; f.tapR = st.frame; }

    // buffer de entrada (12 frames): lo que aprietes durante un golpe sale apenas se pueda cancelar
    { const w = this.wantedAttack(st, f, air, holdD); if (w) f.buf = { name: w, until: st.frame + 12 }; }
    const buffered = () => (f.buf && f.buf.until >= st.frame) ? f.buf.name : null;
    // ---- estados pasivos / de daño ----
    if (f.st === 'hit' || f.st === 'launched') {
      if (air || f.st === 'launched') { f.vy -= GRAV; f.y += f.vy; f.x += f.vx; if (f.y <= 0) { f.y = 0; f.vy = 0; f.vx = 0; f.st = 'down'; f.t = 0; f.combo = 0; } }
      else { f.x += f.vx; f.vx *= 0.7; if (f.t >= f.stun) { f.st = 'idle'; f.t = 0; f.combo = 0; } }
      // Burst de biofilm: con el botón BURST en hitstun
      if (this.pressed(f, BTN.BURST) && f.burst) { f.y = Math.max(f.y, 0); f.vx = 0; f.vy = 0; this.startMove(st, f, 'BURST'); }
      return;
    }
    if (f.st === 'block') { f.x += f.vx; f.vx *= 0.75; if (f.t >= f.stun) { f.st = 'idle'; f.t = 0; } f.crouch = !!holdD; return; }
    if (f.st === 'down') { if (f.t > 36) { f.st = 'idle'; f.t = 0; f.inv = 12; } return; }
    if (f.st === 'grabbed') { f.x = opp.x + opp.face * 60; f.y = 0; return; }
    if (f.st === 'ko') { this.physicsOnlyOne(f); return; }

    // ---- dash ----
    if (f.st === 'dash') { f.x += f.vx; if (f.vx * f.face > 0 && (this.pressed(f, BTN.HP) || buffered() === 'HP')) { f.buf = null; this.startMove(st, f, 'RUSH'); return; } if (f.t > (f.vx * f.face > 0 ? 14 : 12)) { f.st = 'idle'; f.t = 0; } return; }

    // ---- ataques ----
    if (f.st === 'attack' || f.st === 'grab') {
      if (f.st === 'grab') { if (f.t > 40) { this.grabRelease(st, f, opp); } return; }
      const m = f.move === 'SP' || f.move === 'OD' ? null : MOVES[f.move];
      const T = m ? [m.s, m.a, m.r] : f.spT; const total = T[0] + T[1] + T[2];
      // movimiento en el aire durante ataques aéreos
      if (air) { f.vy -= GRAV; f.y += f.vy; f.x += f.vx; if (f.y <= 0) { f.y = 0; f.vy = 0; f.vx = 0; if (m && m.air) { f.st = 'idle'; f.t = 0; return; } } }
      // Lysis Cancel: BURST durante un ataque con ≥50 de medidor
      if (this.pressed(f, BTN.BURST) && f.meter >= 50 && f.move !== 'BURST' && f.move !== 'OD') { f.meter -= 50; f.st = 'idle'; f.t = 0; f.auraT = 0; st.events.push({ type: 'lysis', x: f.x, y: f.y }); return; }
      // ejecución del especial al final del startup
      if (!m && f.t === T[0]) this.fireSpecial(st, f, opp);
      if (m && m.lunge && f.t >= T[0] && f.t < T[0] + T[1]) f.x += f.face * m.lunge;
      if (m && m.adv && !air && f.t <= T[0] && Math.abs(opp.x - f.x) > 70) f.x += f.face * m.adv / T[0]; // avanza un poco al golpear (los combos no se escapan)
      if (m && m.armor && f.t === 1) f.armor = T[0] + T[1];
      if (m && m.shot && f.t === T[0]) { const r = ROSTER_BY_ID[f.id]; st.proj.push({ owner: f.side, kind: 'ball', x: f.x + f.face * 50, y: 70, vx: f.face * 9, vy: 0, w: 26, h: 26, life: 110, dmg: 60 * r.stats.pow, color: r.c3, hs: 16, bs: 10, kb: 6, hitIds: {} }); st.events.push({ type: 'special', side: f.side, x: f.x, kind: 'shot' }); }
      if (!m && f.sp.kind === 'upper') { if (f.t === T[0]) { f.vy = 15; f.vx = f.face * 3; f.inv = 10; } if (f.t > T[0]) { f.vy -= GRAV; f.y += f.vy; f.x += f.vx; if (f.y <= 0) { f.y = 0; f.vy = 0; f.vx = 0; } } if (f.t >= total && f.y === 0) { f.st = 'idle'; f.t = 0; } return; }
      if (!m && f.sp.kind === 'absorb') { if (f.t > T[0] && f.t < T[0] + T[1]) f.absorbT = 2; }
      // cancel (gatling) hacia otro golpe cuando el actual conectó
      if (m && f.hitDone && f.t >= T[0] && f.t < total) {
        if (m.jc && !air && this.pressed(f, BTN.U)) { f.st = 'jump'; f.t = 0; f.vy = 15 * S.jmp; f.vx = holdF ? f.face * 4.5 * spdMul : holdB ? -f.face * 4 * spdMul : 0; f.jumps = r.id === 'ASU' ? 1 : 0; f.crouch = false; return; } // jump cancel
        const nxt = buffered();
        if (nxt && (m.chain.includes(nxt) || nxt === 'SP' || nxt === 'OD')) { f.buf = null; this.tryAttack(st, f, opp, nxt); return; }
      }
      if (f.t >= total) { f.st = 'idle'; f.t = 0; f.crouch = false; }
      return;
    }

    // ---- aire ----
    if (f.st === 'jump' || air) {
      f.vy -= GRAV; f.y += f.vy; f.x += f.vx;
      if (f.y <= 0) { if (f.vy < -6) st.events.push({ type: 'land', x: f.x, str: f.vy < -12 ? 2 : 1 }); f.y = 0; f.vy = 0; f.vx = 0; f.st = 'idle'; f.t = 0; return; }
      if (this.pressed(f, BTN.U) && f.jumps > 0) { f.jumps--; f.vy = 13 * S.jmp; f.vx = holdF ? f.face * 4 : holdB ? -f.face * 4 : 0; }
      const at = buffered(); if (at && MOVES[at] && MOVES[at].air) { f.buf = null; this.tryAttack(st, f, opp, at); }
      return;
    }

    // ---- suelo ----
    f.crouch = !!holdD;
    if (f.dashReq) { const d = f.dashReq; f.dashReq = 0; f.st = 'dash'; f.t = 0; st.events.push({ type: 'dash', x: f.x, dir: d }); f.vx = d === f.face ? 9 * spdMul * f.face : -7 * f.face; if (d !== f.face) f.inv = 6; return; }
    const at = buffered();
    if (at && !(MOVES[at] && MOVES[at].air)) { f.buf = null; this.tryAttack(st, f, opp, at); return; }
    if (this.pressed(f, BTN.U) || (holdU && f.st !== 'jump' && f.t > 2 && f.y === 0 && f.prevU === false)) {
      f.st = 'jump'; f.t = 0; f.vy = 15 * S.jmp; f.vx = holdF ? f.face * 4.5 * spdMul : holdB ? -f.face * 4 * spdMul : 0; f.jumps = r.id === 'ASU' ? 1 : 0; f.crouch = false; f.prevU = true; return;
    }
    f.prevU = !!holdU;
    if (holdD) { f.st = 'crouch'; f.t = 0; return; }
    if (holdF) { f.x += 4 * spdMul * f.face; f.st = 'walk'; }
    else if (holdB) { f.x -= 3 * spdMul * f.face; f.st = 'walk'; }
    else if (f.st !== 'idle') { f.st = 'idle'; f.t = 0; }
  },
  physicsOnlyOne(f) { if (f.y > 0 || f.vy > 0) { f.vy -= GRAV; f.y += f.vy; f.x += f.vx; if (f.y <= 0) { f.y = 0; f.vy = 0; f.vx = 0; } } },

  wantedAttack(st, f, air, holdD) {
    // Especial = ↓↘→ + fuerte (o botón B del mando con ↓↘→). Overdrive = ↓↘→ + O con el medidor lleno. Ya no salen con un solo botón.
    if (this.pressed(f, BTN.OD) && f.meter >= MAX_METER && !air && this.qcf(f)) return 'OD';
    if ((this.pressed(f, BTN.SP) || this.pressed(f, BTN.HP)) && !air && this.qcf(f)) return 'SP';
    if (air) { if (this.pressed(f, BTN.LP)) return 'jLP'; if (this.pressed(f, BTN.HP)) return 'jHP'; if (this.pressed(f, BTN.K)) return 'jK'; return null; }
    if (this.pressed(f, BTN.LP)) return this.qcf(f) ? 'SHOT' : 'LP';
    if (this.pressed(f, BTN.HP)) return holdD ? 'cHP' : 'HP';
    if (this.pressed(f, BTN.K)) return holdD ? 'cK' : 'K';
    return null;
  },
  tryAttack(st, f, opp, name) {
    if (name === 'SP') { this.startSpecial(st, f, opp, false); return; }
    if (name === 'OD') { this.startSpecial(st, f, opp, true); return; }
    this.startMove(st, f, name);
  },

  // ---------- especiales ----------
  fireSpecial(st, f, opp) {
    const sp = f.sp, od = f.move === 'OD', P = ROSTER_BY_ID[f.id].stats.pow;
    const base = { owner: f.side, dmg: sp.dmg * P / (sp.hits || 1), color: sp.color, hs: 20, bs: 12, kb: 8, hitIds: {} }; // multi-golpe: el daño total se reparte
    const add = (p) => st.proj.push(Object.assign({}, base, { hitIds: {} }, p));
    switch (sp.kind) {
      case 'proj': add({ kind: 'ball', x: f.x + f.face * 50, y: sp.low ? 20 : 80, vx: f.face * sp.speed, vy: 0, w: sp.size, h: sp.size, life: 140, low: !!sp.low }); break;
      case 'slowproj': add({ kind: 'ball', x: f.x + f.face * 50, y: 80, vx: f.face * sp.speed, vy: 0, w: sp.size, h: sp.size, life: 160, slow: sp.slow }); break;
      case 'column': { const cx = (sp.dist === -1 || sp.dist === 0) ? opp.x : f.x + f.face * sp.dist;
        add({ kind: 'column', x: cx, y: 0, vx: 0, vy: 0, w: sp.big ? 110 : 60, h: sp.big ? 320 : 240, life: od ? 40 : 26, warm: 10, hs: 28, kb: 2, launch: true }); break; }
      case 'rain': for (let i = 0; i < Math.min(sp.drops, 10); i++) add({ kind: 'drop', x: opp.x + ((i % 2 ? 1 : -1) * Math.ceil(i / 2)) * 55 + (od ? (i % 3) * 20 : 0), y: 420 + i * 30, vx: 0, vy: -9, w: 18, h: 36, life: 120, hs: 14, bs: 8, kb: 2 }); break;
      case 'wall': add({ kind: 'wall', x: f.x + f.face * (sp.big ? 170 : 130), y: 0, vx: 0, vy: 0, w: sp.big ? 110 : 70, h: sp.big ? 200 : 140, life: 100, fuse: 60, hs: 26, kb: 10, launch: true, solid: true }); break;
      case 'wave': add({ kind: 'wave', x: f.x + f.face * 60, y: 0, vx: f.face * sp.speed, vy: 0, w: 90, h: 210, life: 200, hs: 24, kb: sp.push ? 26 : 6, pull: !!sp.pull, slow: sp.slow || 0, launch: !sp.push }); break;
      case 'beam': { const len = f.face > 0 ? ARENA_W - f.x : f.x; add({ kind: 'beam', x: f.x + f.face * (len / 2 + 30), y: 60, vx: 0, vy: 0, w: len, h: 60, life: 6, hs: 26, kb: 14, launch: od });
        if (sp.neutralize || od) st.proj = st.proj.filter(p => p.owner === f.side); break; }
      case 'upper': add({ kind: 'fist', x: f.x + f.face * 30, y: 20, vx: 0, vy: 0, w: 90, h: 170, life: 16, follow: f.side, off: f.face * 30, hs: 28, kb: 5, launch: true, hits: sp.hits || 1 }); break;
      case 'aura': f.auraT = sp.dur; break;
      case 'teleport': { f.x = Math.max(40, Math.min(ARENA_W - 40, opp.x - opp.face * 70)); f.face = opp.x >= f.x ? 1 : -1;
        add({ kind: 'slash', x: f.x + f.face * 50, y: 60, vx: 0, vy: 0, w: 90, h: 120, life: 8, hs: 22, kb: 6, hits: sp.hits || 1 }); st.events.push({ type: 'teleport', x: f.x, y: f.y }); break; }
      case 'grab': case 'drain': {
        const inRange = Math.abs(opp.x - f.x) < 95 && opp.y < 40 && opp.inv <= 0 && opp.st !== 'down' && opp.st !== 'grabbed';
        if (inRange) { f.st = 'grab'; f.t = 0; opp.st = 'grabbed'; opp.t = 0; f.grabDmg = sp.dmg * P; f.grabHeal = sp.heal || 0; st.events.push({ type: 'grab', x: opp.x }); }
        break; }
      case 'absorb': f.absorbT = 40; add({ kind: 'counter', x: f.x + f.face * 40, y: 0, vx: 0, vy: 0, w: 120, h: 170, life: 40, follow: f.side, hs: 24, kb: 12, launch: true, counterOnly: true }); break;
      case 'steam': add({ kind: 'fist', x: f.x + f.face * 90, y: 40, vx: f.face * 2, vy: 0, w: 130, h: 130, life: 8, hs: 30, kb: 20, hits: sp.hits || 1, launch: true, follow: f.side, off: f.face * 90 }); break;
    }
  },
  auraTick(st, f, opp) {
    if (Math.abs(opp.x - f.x) < 120 && opp.y < 120 && opp.inv <= 0) this.applyHit(st, f, opp, { dmg: f.sp.dmg, hs: 10, bs: 6, kb: 3 }, f.x, 80, true);
  },
  grabRelease(st, f, opp) {
    f.st = 'idle'; f.t = 0;
    opp.st = 'launched'; opp.t = 0; opp.vy = 10; opp.vx = f.face * 9; opp.hp -= f.grabDmg; opp.combo = 0;
    if (f.grabHeal) f.hp = Math.min(f.maxhp, f.hp + f.grabHeal);
    f.meter = Math.min(MAX_METER, f.meter + 10); st.shake = 12;
    st.events.push({ type: 'hit', x: opp.x, y: 80, str: 3 });
  },

  // ---------- colisiones ----------
  hurtbox(f) { const h = f.crouch ? f.h * 0.62 : f.h; return [f.x - f.w / 2, f.y, f.w, h]; },
  moveBox(f) {
    if (f.st !== 'attack') return null;
    const m = MOVES[f.move]; if (!m) return null;
    if (f.t < m.s || f.t >= m.s + m.a || f.hitDone) return null;
    const [dx, dy, w, h] = m.box; const x = f.face > 0 ? f.x + dx : f.x - dx - w; return [x, f.y + dy, w, h];
  },
  overlap(a, b) { return a && b && a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1]; },
  blocking(f, opp, low, overhead) {
    if (!(f.st === 'idle' || f.st === 'walk' || f.st === 'crouch' || f.st === 'block')) return false;
    if (!(f.bits & this.back(f))) return false;
    const crouching = !!(f.bits & BTN.D);
    if (low && !crouching) return false; if (overhead && crouching) return false; return true;
  },
  resolveHits(st, atk, def) {
    const box = this.moveBox(atk); if (!box) return;
    const m = MOVES[atk.move];
    if (this.overlap(box, this.hurtbox(def))) {
      atk.hitDone = true;
      if (atk.move === 'BURST') { if (def.inv <= 0) { def.st = 'launched'; def.t = 0; def.vx = atk.face * 12; def.vy = 9; def.combo = 0; } return; }
      this.applyHit(st, atk, def, m, box[0] + box[2] / 2, box[1] + box[3] / 2, false);
    }
  },
  applyHit(st, atk, def, m, hx, hy, unblockable) {
    if (def.inv > 0) return false;
    if (def.absorbT > 0) return false;
    const low = !!m.low, overhead = !!m.overhead;
    if (!unblockable && this.blocking(def, atk, low, overhead)) {
      def.st = 'block'; def.t = 0; def.stun = m.bs || 10; def.vx = -atk.face * (m.kb || 4) * 0.8; def.crouch = !!(def.bits & BTN.D);
      def.meter = Math.min(MAX_METER, def.meter + 2); atk.meter = Math.min(MAX_METER, atk.meter + 3);
      if (atk.move === 'SP' || atk.move === 'OD' || m.chip) def.hp -= Math.max(1, Math.floor((m.dmg || 0) * 0.08));
      st.events.push({ type: 'block', x: hx, y: hy });
      return false;
    }
    const P = ROSTER_BY_ID[atk.id].stats.pow, D = ROSTER_BY_ID[def.id].stats.def;
    const scale = Math.max(0.35, 1 - def.combo * 0.1);
    const dmg = Math.floor((m.dmg || 0) * P / D * scale);
    if (def.armor > 0 && def.st === 'attack') { def.hp -= Math.floor(dmg * 0.5); def.armor = 0; st.events.push({ type: 'armor', x: hx, y: hy }); return true; }
    def.hp -= dmg; def.combo++; def.comboDmg = (def.combo === 1 ? 0 : (def.comboDmg || 0)) + dmg;
    atk.meter = Math.min(MAX_METER, atk.meter + 7); def.meter = Math.min(MAX_METER, def.meter + 4);
    if (def.st === 'attack' || def.st === 'grab') { def.auraT = 0; }
    const airborne = def.y > 0 || m.launch || (m.knockdown);
    if (m.launch) { def.st = 'launched'; def.t = 0; def.vy = 12 + (def.y > 0 ? 2 : 0); def.vx = atk.face * (m.kb || 4) * 0.5; }
    else if (m.knockdown) { def.st = 'launched'; def.t = 0; def.vy = 6; def.vx = atk.face * (m.kb || 4); }
    else if (def.y > 0) { def.st = 'launched'; def.t = 0; def.vy = 7; def.vx = atk.face * (m.kb || 4) * 0.6; }
    else { def.st = 'hit'; def.t = 0; def.stun = m.hs || 14; def.vx = atk.face * (m.kb || 4); def.crouch = false; }
    if (m.pull) def.vx = -atk.face * 10;
    if (m.slow) def.slow = Math.max(def.slow, m.slow);
    def.y = Math.max(0, def.y);
    const str = dmg > 100 ? 3 : dmg > 60 ? 2 : 1;
    st.shake = Math.max(st.shake, str * 3);
    st.events.push({ type: 'hit', x: hx, y: hy, str, side: atk.side, combo: def.combo, dmg: def.comboDmg });
    return true;
  },
  updateProjectiles(st) {
    const keep = [];
    for (const p of st.proj) {
      p.life--;
      if (p.follow !== undefined) { const o = st.f[p.follow]; p.x = o.x + (p.off || o.face * 40); }
      if (p.warm > 0) { p.warm--; keep.push(p); continue; }
      if (p.fuse !== undefined) { p.fuse--; if (p.fuse === 0) { p.exploding = 8; p.w *= 2.2; p.h *= 1.2; st.shake = 8; st.events.push({ type: 'explode', x: p.x, y: p.h / 2 }); } if (p.fuse > 0) { keep.push(p); continue; } }
      p.x += p.vx; p.y += p.vy;
      if (p.kind === 'drop' && p.y <= 0) { p.life = 0; st.events.push({ type: 'splash', x: p.x, y: 0 }); }
      const owner = st.f[p.owner], def = st.f[1 - p.owner];
      const box = [p.x - p.w / 2, p.y - (p.kind === 'ball' || p.kind === 'drop' || p.kind === 'beam' ? p.h / 2 : 0), p.w, p.h];
      // choque proyectil vs proyectil (bolas se anulan)
      for (const q of st.proj) if (q !== p && q.owner !== p.owner && (q.kind === 'ball' || q.kind === 'wave') && (p.kind === 'ball' || p.kind === 'wave')) {
        const qb = [q.x - q.w / 2, q.y - (q.kind === 'ball' ? q.h / 2 : 0), q.w, q.h];
        if (this.overlap(box, qb) && p.kind === 'ball' && q.kind !== 'wave') { p.life = 0; q.life = 0; st.events.push({ type: 'hit', x: p.x, y: p.y, str: 1 }); }
      }
      // absorción (AFD): proyectiles enemigos cerca se destruyen y curan
      if (def.absorbT > 0 && p.kind !== 'counter' && Math.abs(p.x - def.x) < 110) { p.life = 0; def.hp = Math.min(def.maxhp, def.hp + 40); def.meter = Math.min(MAX_METER, def.meter + 12); st.events.push({ type: 'absorb', x: def.x, y: 80 }); continue; }
      if (p.counterOnly) { // contraataque de AFD: pega sólo si el rival está atacando pegado
        if (!p.hitIds[0] && def.st === 'attack' && this.overlap(box, this.hurtbox(def)) && def.t > 2) { p.hitIds[0] = 1; this.applyHit(st, owner, def, p, def.x, 80, true); st.events.push({ type: 'counter', x: def.x, y: 90 }); }
        if (p.life > 0) keep.push(p); continue;
      }
      if (p.life > 0 && !p.hitIds[def.side] && this.overlap(box, this.hurtbox(def))) {
        const hit = this.applyHit(st, owner, def, p, p.x, p.y + 40, false);
        if (p.hits && p.hits > 1 && hit) { p.hits--; p.life = Math.max(p.life, 6); def.inv = 0; }
        else p.hitIds[def.side] = 1;
        if (p.kind === 'ball' || p.kind === 'drop' || p.kind === 'slash') p.life = 0;
        if (p.kind === 'wave' && !p.push) { } // la ola sigue
      }
      if (p.exploding !== undefined) { p.exploding--; if (p.exploding <= 0) p.life = 0; }
      if (p.life > 0 && p.x > -200 && p.x < ARENA_W + 200) keep.push(p);
    }
    st.proj = keep;
    for (const f of st.f) if (f.absorbT > 0) f.absorbT--;
  },
  pushApart(a, b) {
    if (a.st === 'grabbed' || b.st === 'grabbed') return;
    const d = b.x - a.x, min = (a.w + b.w) / 2 - 6;
    if (Math.abs(d) < min && Math.abs(a.y - b.y) < 140) {
      const push = (min - Math.abs(d)) / 2, s = d >= 0 ? 1 : -1;
      a.x -= push * s; b.x += push * s;
    }
  }
};
