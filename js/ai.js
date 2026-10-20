// CPU: máquina de decisiones simple con 3 niveles. Usa el RNG del estado (determinista).
const CPU = {
  decide(st, side, level = 2) {
    const me = st.f[side], opp = st.f[1 - side], rng = st.rng;
    if (!st.ai) st.ai = [{ bits: 0, until: 0 }, { bits: 0, until: 0 }];
    const plan = st.ai[side];
    const fwd = opp.x > me.x ? BTN.R : BTN.L, back = opp.x > me.x ? BTN.L : BTN.R;
    const dist = Math.abs(opp.x - me.x), r = ROSTER_BY_ID[me.id], kind = r.special.kind;
    const react = [0.25, 0.5, 0.8][level - 1];
    // reflejos: bloquear cuando el rival ataca cerca
    if (opp.st === 'attack' && dist < 160 && me.y === 0 && rng.next() < react) {
      const low = opp.move === 'cK' || (opp.sp && opp.sp.low); const ov = MOVES[opp.move] && MOVES[opp.move].overhead;
      return back | (low && !ov ? BTN.D : 0);
    }
    if ((me.st === 'hit' || me.st === 'launched') && me.burst && me.combo >= 3 && rng.next() < react * 0.3) return BTN.BURST;
    if (plan.combo && plan.combo.length) { const c = plan.combo.shift(); const m = { D: BTN.D, DF: BTN.D | fwd, F: fwd, LP: BTN.LP, N: 0 }[c]; plan.bits = m; plan.until = st.frame + 3; return m; }
    if (st.frame < plan.until) return plan.bits;
    // nuevo plan
    let bits = 0, dur = 6 + rng.int(10);
    const roll = rng.next();
    if (me.st === 'attack' && me.hitDone) { // gatling
      const nxt = { LP: BTN.HP, HP: BTN.K, K: BTN.SP }[me.move] || 0; bits = nxt || (rng.next() < 0.5 ? BTN.SP : 0); dur = 2;
    } else if (me.meter >= 100 && dist < 240 && rng.next() < react * 0.5) { bits = BTN.OD; dur = 2; }
    else if (dist < 95) {
      if (roll < 0.22) bits = BTN.LP; else if (roll < 0.42) bits = BTN.HP; else if (roll < 0.55) bits = BTN.K;
      else if (roll < 0.63) bits = BTN.D | BTN.K; else if (roll < 0.7) bits = BTN.D | BTN.HP;
      else if (roll < 0.78 && (kind === 'grab' || kind === 'drain' || kind === 'upper' || kind === 'aura' || kind === 'steam')) bits = BTN.SP;
      else if (roll < 0.88) bits = back; else bits = fwd | BTN.U;
      dur = bits & (BTN.LP | BTN.HP | BTN.K | BTN.SP) ? 2 : dur;
    } else if (dist < 260) {
      if (roll < 0.45) bits = fwd; else if (roll < 0.6) bits = fwd | BTN.U; else if (roll < 0.75 && kind !== 'grab' && kind !== 'drain') bits = BTN.SP;
      else if (roll < 0.85) bits = BTN.K; else if (roll < 0.92) { plan.combo = ['D', 'DF', 'F', 'LP']; } else bits = back;
      if (bits === BTN.SP || bits === BTN.K) dur = 2;
    } else {
      if (roll < 0.5 && ['proj', 'slowproj', 'column', 'rain', 'wave', 'beam', 'wall', 'teleport'].includes(kind)) { bits = BTN.SP; dur = 2; }
      else if (roll < 0.9) bits = fwd; else bits = fwd | BTN.U;
    }
    // esquivar proyectiles enemigos: saltar
    for (const p of st.proj) if (p.owner !== side && (p.kind === 'ball' || p.kind === 'wave') && Math.abs(p.x - me.x) < 150 && rng.next() < react * 0.6) { bits = BTN.U | fwd; dur = 3; }
    plan.bits = bits; plan.until = st.frame + dur;
    return bits;
  }
};
