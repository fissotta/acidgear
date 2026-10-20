// Entrada: teclado (2 jugadores) y gamepads → máscara de bits por frame.
const BTN = { L: 1, R: 2, U: 4, D: 8, LP: 16, MP: 32, HP: 64, K: 128, SP: 256, OD: 512, BURST: 1024, START: 2048 };

const KEYMAPS = [
  { // Jugador 1
    KeyA: BTN.L, KeyD: BTN.R, KeyW: BTN.U, KeyS: BTN.D,
    KeyJ: BTN.LP, KeyK: BTN.HP, KeyL: BTN.K, KeyI: BTN.K, KeyU: BTN.SP, KeyO: BTN.OD, KeyH: BTN.BURST,
    Enter: BTN.START
  },
  { // Jugador 2
    ArrowLeft: BTN.L, ArrowRight: BTN.R, ArrowUp: BTN.U, ArrowDown: BTN.D,
    Numpad1: BTN.LP, Numpad2: BTN.HP, Numpad3: BTN.K, Numpad4: BTN.K, Numpad5: BTN.SP, Numpad6: BTN.OD, Numpad0: BTN.BURST,
    // alternativa sin teclado numérico
    KeyB: BTN.LP, KeyN: BTN.HP, KeyM: BTN.K, Comma: BTN.K, Period: BTN.SP, Slash: BTN.OD, ShiftRight: BTN.BURST,
    NumpadEnter: BTN.START
  }
];

const Input = {
  down: {},
  pressedOnce: {},
  latched: {},
  init() {
    window.addEventListener('keydown', e => {
      if (!this.down[e.code]) { this.pressedOnce[e.code] = true; this.latched[e.code] = true; } // la tecla cuenta al menos un frame aunque se suelte enseguida
      this.down[e.code] = true;
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.down[e.code] = false; });
    window.addEventListener('blur', () => { this.down = {}; });
  },
  // Lee el estado actual del jugador p (0 ó 1)
  read(p) {
    let bits = 0;
    const map = KEYMAPS[p];
    for (const k in map) if (this.down[k] || this.latched[k]) bits |= map[k];
    for (const k in map) this.latched[k] = false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && pads[p];
    if (gp) {
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (ax < -0.5 || (gp.buttons[14] && gp.buttons[14].pressed)) bits |= BTN.L;
      if (ax > 0.5 || (gp.buttons[15] && gp.buttons[15].pressed)) bits |= BTN.R;
      if (ay < -0.5 || (gp.buttons[12] && gp.buttons[12].pressed)) bits |= BTN.U;
      if (ay > 0.5 || (gp.buttons[13] && gp.buttons[13].pressed)) bits |= BTN.D;
      const b = i => gp.buttons[i] && gp.buttons[i].pressed;
      if (b(2)) bits |= BTN.LP;   // X / cuadrado
      if (b(3) || b(5)) bits |= BTN.HP;   // Y / triángulo o RB
      if (b(0)) bits |= BTN.K;    // A / cruz
      if (b(1)) bits |= BTN.SP;   // B / círculo
      if (b(7)) bits |= BTN.OD;   // RT
      if (b(4)) bits |= BTN.BURST;// LB
      if (b(9)) bits |= BTN.START;
    }
    return bits;
  },
  // Pulsación única de una tecla (para menús)
  once(code) { const v = !!this.pressedOnce[code]; this.pressedOnce[code] = false; return v; },
  flush() { this.pressedOnce = {}; }
};
