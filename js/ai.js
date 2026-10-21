// CPU: máquina de decisiones simple con 3 niveles. Usa el RNG del estado (determinista).
const CPU = {
  decide(st, side, level = 2) {
    const me = st.f[side], opp = st.f[1 - side], rng = st.rng;
    if (!st.ai) st.ai = [{ bits: 0, until: 0 }, { bits: 0, until: 0 }];
    const plan = st.ai[side];
    const fwd = opp.x > me.x ? BTN.R : BTN.L, back = opp.x > me.x ? BTN.L : BTN.R;
    const dist = Math.abs(opp.x - me.x), r = ROSTER_BY_ID[me.id], kind = r.special.kind;
    // nivel 1 FÁCIL: casi no bloquea, ataca poco y lento · 2 NORMAL: moderado · 3 DIFÍCIL: el antiguo "normal"
    const react = [0.06, 0.18, 0.5][level - 1], aggro = [0.25, 0.6, 1.0][level - 1], slowMul = [2.4, 1.5, 1.0][level - 1];
    const spCool = [300, 180, 70][level - 1]; // frames mínimos entre especiales (para que no repita el mismo ataque sin parar)
    const canSP = st.frame - (plan.lastSP || 0) > spCool;
    // reflejos: bloquear cuando el rival ataca cerca
    if (opp.st === 'attack' && dist < 160 && me.y === 0 && rng.next() < react) {
      const low = opp.move === 'cK' || (opp.sp && opp.sp.low); const ov = MOVES[opp.move] && MOVES[opp.move].overhead;
      return back | (low && !ov ? BTN.D : 0);
    }
    if ((me.st === 'hit' || me.st === 'launched') && me.burst && me.combo >= 3 && rng.next() < react * 0.3) return BTN.BURST;
    if (plan.combo && plan.combo.length) { const c = plan.combo.shift(); const m = { D: BTN.D, DF: BTN.D | fwd, F: fwd, LP: BTN.LP, HP: BTN.HP, OD: BTN.OD, N: 0 }[c]; plan.bits = m; plan.until = st.frame + 3; return m; }
    if (st.frame < plan.until) return plan.bits;
    if (plan.rest && st.frame < plan.rest && me.st !== 'attack') { plan.bits = 0; plan.until = st.frame + 4; return 0; }
    // nuevo plan
    let bits = 0, dur = Math.round((6 + rng.int(10)) * slowMul);
    const roll = rng.next();
    if (me.st === 'attack' && me.hitDone && rng.next() < aggro) { // gatling
      const nxt = { LP: BTN.HP, HP: BTN.K }[me.move] || 0; bits = nxt; dur = 2; if (me.move === 'K' && canSP) { plan.combo = ['D', 'DF', 'F', 'HP']; plan.lastSP = st.frame; }
    } else if (me.meter >= 100 && dist < 240 && canSP && rng.next() < react * 0.5) { plan.combo = ['D', 'DF', 'F', 'OD']; plan.lastSP = st.frame + 120; }
    else if (dist < 95 && rng.next() > aggro) { bits = rng.next() < 0.5 ? back : 0; }
    else if (dist < 95) {
      if (roll < 0.22) bits = BTN.LP; else if (roll < 0.42) bits = BTN.HP; else if (roll < 0.55) bits = BTN.K;
      else if (roll < 0.63) bits = BTN.D | BTN.K; else if (roll < 0.7) bits = BTN.D | BTN.HP;
      else if (roll < 0.78 && canSP && (kind === 'grab' || kind === 'drain' || kind === 'upper' || kind === 'aura' || kind === 'steam')) { plan.combo = ['D', 'DF', 'F', 'HP']; plan.lastSP = st.frame; }
      else if (roll < 0.88) bits = back; else bits = fwd | BTN.U;
      dur = bits & (BTN.LP | BTN.HP | BTN.K) ? 2 : dur;
    } else if (dist < 260 && rng.next() > aggro) { bits = fwd; }
    else if (dist < 260) {
      if (roll < 0.45) bits = fwd; else if (roll < 0.6) bits = fwd | BTN.U; else if (roll < 0.75 && canSP && kind !== 'grab' && kind !== 'drain') { plan.combo = ['D', 'DF', 'F', 'HP']; plan.lastSP = st.frame; }
      else if (roll < 0.85) bits = BTN.K; else if (roll < 0.92) { plan.combo = ['D', 'DF', 'F', 'LP']; } else bits = back;
      if (bits === BTN.K) dur = 2;
    } else {
      if (roll < 0.5 * aggro && canSP && ['proj', 'slowproj', 'column', 'rain', 'wave', 'beam', 'wall', 'teleport'].includes(kind)) { plan.combo = ['D', 'DF', 'F', 'HP']; plan.lastSP = st.frame; }
      else if (roll < 0.9) bits = fwd; else bits = fwd | BTN.U;
    }
    // esquivar proyectiles enemigos: saltar
    for (const p of st.proj) if (p.owner !== side && (p.kind === 'ball' || p.kind === 'wave') && Math.abs(p.x - me.x) < 150 && rng.next() < react * 0.6) { bits = BTN.U | fwd; dur = 3; }
    // tras atacar, en fácil/normal se queda un momento sin hacer nada (deja espacio para que el jugador ataque)
    if (level < 3 && ((bits & (BTN.LP | BTN.HP | BTN.K)) || plan.combo) && rng.next() < 0.5) { plan.rest = st.frame + (level === 1 ? 70 : 40); }
    plan.bits = bits; plan.until = st.frame + dur;
    return bits;
  }
};
