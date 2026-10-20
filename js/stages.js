// 20 escenarios. Los de Copahue usan las mediciones reales de copahue-v8/data/data.js.
// Cada uno define cielo, siluetas lejanas (parallax), medio, suelo, agua y partículas.
const STAGES = [
  { id: 'CL',  name: 'Laguna del cráter', place: 'Volcán Copahue, Neuquén (AR)', ph: '0,84', temp: '45,6 °C',
    sky: ['#3a2b2b', '#c9a56a'], far: 'crater', farCol: '#5a4034', mid: 'rocks', midCol: '#7a5a3a', floor: '#8a6a40', floor2: '#5f4628',
    water: '#9fc9a8', waterY: 0.55, particles: 'steam', key: 'E', tempo: 176, scale: 'phrygian' },
  { id: 'VA2', name: 'Vertiente del Agrio 2 (caliente)', place: 'Volcán Copahue, Neuquén (AR)', ph: '2,2', temp: '45,5 °C',
    sky: ['#2a3a55', '#e0b070'], far: 'volcano', farCol: '#4a3a44', mid: 'rocks', midCol: '#8a6a3a', floor: '#a0783c', floor2: '#6e4f24',
    water: '#c9d890', waterY: 0.7, particles: 'steam', key: 'D', tempo: 184, scale: 'minor' },
  { id: 'VA1', name: 'Vertiente del Agrio 1', place: 'Volcán Copahue, Neuquén (AR)', ph: '1,8', temp: '28,4 °C',
    sky: ['#405a80', '#dcd0b0'], far: 'volcano', farCol: '#56484e', mid: 'sulfur', midCol: '#c9b43a', floor: '#b09a44', floor2: '#7a6a24',
    water: '#d8e2a0', waterY: 0.75, particles: 'steam', key: 'A', tempo: 180, scale: 'minor' },
  { id: 'RAS', name: 'Río Agrio Superior', place: 'Copahue–Caviahue, Neuquén (AR)', ph: '2,6', temp: '10,1 °C',
    sky: ['#2c4a6e', '#b8d0e0'], far: 'mountains', farCol: '#4b5a6a', mid: 'araucarias', midCol: '#2f4a2a', floor: '#6f6a50', floor2: '#4a4632',
    water: '#79b8c8', waterY: 0.6, particles: 'spray', key: 'G', tempo: 172, scale: 'minor' },
  { id: 'CC',  name: 'Cascada de la Culebra', place: 'Río Agrio, Neuquén (AR)', ph: '2,6', temp: '11,7 °C',
    sky: ['#355070', '#c8d8e8'], far: 'cliff', farCol: '#4a4a52', mid: 'waterfall', midCol: '#8fd0e0', floor: '#5a5a4a', floor2: '#3c3c30',
    water: '#8ad0e0', waterY: 0.5, particles: 'spray', key: 'B', tempo: 190, scale: 'phrygian' },
  { id: 'LC',  name: 'Lago Caviahue, brazo norte', place: 'Caviahue, Neuquén (AR)', ph: '3,1', temp: '17,2 °C',
    sky: ['#3f6aa0', '#dde8f0'], far: 'mountains', farCol: '#5f7088', mid: 'araucarias', midCol: '#355a30', floor: '#7a7a62', floor2: '#55553f',
    water: '#5aa0c8', waterY: 0.45, particles: 'none', key: 'C', tempo: 168, scale: 'minor' },
  { id: 'SA',  name: 'Salto del Agrio', place: 'Neuquén (AR)', ph: '3,6', temp: '14,7 °C',
    sky: ['#4a5a7a', '#e8d8b8'], far: 'cliff', farCol: '#6a4a3a', mid: 'waterfall', midCol: '#a0d8e8', floor: '#8a7050', floor2: '#5c4a30',
    water: '#6ab8c8', waterY: 0.5, particles: 'spray', key: 'F', tempo: 178, scale: 'minor' },
  { id: 'CHC', name: 'Campo de solfataras Chancho-Có', place: 'Copahue, Neuquén (AR)', ph: '7,0', temp: '38,9 °C',
    sky: ['#6a6a70', '#d8d0c0'], far: 'mountains', farCol: '#707078', mid: 'mudpots', midCol: '#8a8580', floor: '#9a948a', floor2: '#6a655c',
    water: '#8a8070', waterY: 0.8, particles: 'steam', key: 'E', tempo: 160, scale: 'phrygian' },
  { id: 'RT',  name: 'Río Tinto', place: 'Huelva, España', ph: '2,3', temp: '20 °C',
    sky: ['#4a3a60', '#f0b060'], far: 'mountains', farCol: '#6a4a40', mid: 'terraces', midCol: '#a04a20', floor: '#8a3a18', floor2: '#5a2410',
    water: '#b8301a', waterY: 0.6, particles: 'none', key: 'A', tempo: 182, scale: 'phrygian' },
  { id: 'IM',  name: 'Richmond Mine, Iron Mountain', place: 'California, EE.UU.', ph: '−3,6 a 1', temp: '40 °C',
    sky: ['#1a1410', '#2a1c14'], far: 'tunnel', farCol: '#3a2a20', mid: 'stalactites', midCol: '#8a5a30', floor: '#5a3a20', floor2: '#36220f',
    water: '#c04a10', waterY: 0.8, particles: 'drip', key: 'C', tempo: 196, scale: 'phrygian' },
  { id: 'YS',  name: 'Laguna ácida hidrotermal (Norris)', place: 'Yellowstone, EE.UU.', ph: '2,5', temp: '70 °C',
    sky: ['#3a5a8a', '#e8e0c8'], far: 'pines', farCol: '#2a4a3a', mid: 'geysers', midCol: '#d0c8b0', floor: '#c8c0a8', floor2: '#8a846e',
    water: '#48c8c0', waterY: 0.55, particles: 'steam', key: 'D', tempo: 174, scale: 'minor' },
  { id: 'VU',  name: 'Fumarolas de Vulcano', place: 'Islas Eolias, Italia', ph: '2,0', temp: '60 °C',
    sky: ['#2a4a7a', '#f0d090'], far: 'sea', farCol: '#2a6a9a', mid: 'sulfur', midCol: '#e0c030', floor: '#b0a060', floor2: '#7a6e3a',
    water: null, waterY: 0, particles: 'steam', key: 'B', tempo: 186, scale: 'phrygian' },
  { id: 'MS',  name: 'Soufrière Hills', place: 'Montserrat, Caribe', ph: '2,5', temp: '35 °C',
    sky: ['#4a4a4a', '#c0a080'], far: 'volcano', farCol: '#3a3a3a', mid: 'ash', midCol: '#6a6a6a', floor: '#707070', floor2: '#484848',
    water: null, waterY: 0, particles: 'ash', key: 'F', tempo: 180, scale: 'minor' },
  { id: 'BA',  name: 'Baños Romanos', place: 'Bath, Reino Unido', ph: '7,0', temp: '45 °C',
    sky: ['#3a3020', '#c0a060'], far: 'columns', farCol: '#8a7a50', mid: 'arches', midCol: '#a89868', floor: '#9a8a60', floor2: '#6a5e40',
    water: '#5a9a70', waterY: 0.6, particles: 'steam', key: 'G', tempo: 164, scale: 'minor' },
  { id: 'ES',  name: 'Pila de biolixiviación', place: 'Minera Escondida, Atacama (CL)', ph: '1,6', temp: '35 °C',
    sky: ['#2a60b0', '#f0e0c0'], far: 'desert', farCol: '#b08a50', mid: 'heap', midCol: '#8a6a40', floor: '#a08050', floor2: '#6e5630',
    water: '#3aa0d0', waterY: 0.9, particles: 'none', key: 'E', tempo: 188, scale: 'minor' },
  { id: 'TV',  name: 'Biopila boreal', place: 'Talvivaara/Terrafame, Finlandia', ph: '2,0', temp: '90 °C núcleo / −20 °C aire',
    sky: ['#102030', '#6a8aa0'], far: 'pines', farCol: '#1a2a30', mid: 'heap', midCol: '#3a3a40', floor: '#d8e0e8', floor2: '#9aa6b0',
    water: null, waterY: 0, particles: 'snow', key: 'A', tempo: 170, scale: 'minor' },
  { id: 'BX',  name: 'Reactor de tanque agitado (BIOX)', place: 'Planta de biooxidación', ph: '1,5', temp: '45 °C',
    sky: ['#202830', '#404c58'], far: 'pipes', farCol: '#304050', mid: 'tanks', midCol: '#6a7a8a', floor: '#505a64', floor2: '#333a42',
    water: '#b06a20', waterY: 0.85, particles: 'bubbles', key: 'D', tempo: 192, scale: 'phrygian' },
  { id: 'SW',  name: 'Alcantarilla de hormigón corroído', place: 'Red cloacal urbana', ph: '1,0', temp: '25 °C',
    sky: ['#101410', '#2a3028'], far: 'tunnel', farCol: '#303830', mid: 'pipesewer', midCol: '#505850', floor: '#6a6a60', floor2: '#404038',
    water: '#4a6a3a', waterY: 0.85, particles: 'drip', key: 'C', tempo: 178, scale: 'phrygian' },
  { id: 'PM',  name: 'Mina de Parys Mountain', place: 'Anglesey, Gales', ph: '2,2', temp: '10 °C',
    sky: ['#5a6a7a', '#d0d0c8'], far: 'mountains', farCol: '#6a5a50', mid: 'terraces', midCol: '#b07040', floor: '#9a6a40', floor2: '#6a4828',
    water: '#c07020', waterY: 0.7, particles: 'rain', key: 'G', tempo: 176, scale: 'minor' },
  { id: 'LAB', name: 'Laboratorio de acidófilos', place: 'Fundación Ciencia & Vida, Santiago (CL)', ph: '2,0 (medio)', temp: '30 °C (incubadora)',
    sky: ['#e8eef4', '#c8d4e0'], far: 'shelves', farCol: '#b8c4d0', mid: 'bench', midCol: '#8a9aa8', floor: '#9aa4ac', floor2: '#6a747c',
    water: null, waterY: 0, particles: 'none', key: 'B', tempo: 182, scale: 'minor' }
];

// ---------- Dibujo ----------
const StageDraw = {
  GY: 440, W: 960, H: 540,
  hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); },

  draw(ctx, st, camX, t) {
    const W = this.W, H = this.H, GY = this.GY;
    // cielo
    const g = ctx.createLinearGradient(0, 0, 0, GY);
    g.addColorStop(0, st.sky[0]); g.addColorStop(1, st.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    this.far(ctx, st, camX * 0.2, t);
    this.mid(ctx, st, camX * 0.5, t);
    // agua (franja antes del suelo)
    if (st.water) {
      const wy = GY - 40 - 60 * (1 - st.waterY);
      ctx.fillStyle = st.water; ctx.globalAlpha = 0.85;
      ctx.fillRect(0, wy, W, GY - wy);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const y = wy + 8 + i * ((GY - wy) / 6);
        ctx.beginPath();
        for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin((x - camX * 0.5) * 0.03 + t * 0.08 + i) * 2);
        ctx.stroke();
      }
    }
    // suelo
    const fg = ctx.createLinearGradient(0, GY, 0, H);
    fg.addColorStop(0, st.floor); fg.addColorStop(1, st.floor2);
    ctx.fillStyle = fg; ctx.fillRect(0, GY, W, H - GY);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();
    // textura de suelo
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 40; i++) {
      const x = ((i * 97 - camX) % (W + 100) + W + 100) % (W + 100) - 50;
      const y = GY + 10 + this.hash(i) * 80;
      ctx.fillRect(x, y, 20 + this.hash(i + 7) * 40, 3);
    }
  },

  far(ctx, st, px, t) {
    const W = this.W, GY = this.GY; ctx.fillStyle = st.farCol;
    const kind = st.far;
    if (kind === 'mountains' || kind === 'volcano' || kind === 'crater' || kind === 'desert') {
      ctx.beginPath(); ctx.moveTo(-50, GY);
      for (let x = -50; x <= W + 50; x += 30) {
        const u = (x + px) * 0.004;
        let h = 120 + Math.sin(u) * 60 + Math.sin(u * 2.7) * 30 + Math.sin(u * 7.1) * 10;
        if (kind === 'volcano' && x > 380 && x < 580) h = 250 - Math.abs(x - 480) * 0.7;
        if (kind === 'crater' && x > 200 && x < 760) h = 200 + Math.abs(x - 480) * 0.15;
        if (kind === 'desert') h = 60 + Math.sin(u) * 20;
        ctx.lineTo(x, GY - h);
      }
      ctx.lineTo(W + 50, GY); ctx.closePath(); ctx.fill();
      if (kind === 'volcano') { // fumarola del cráter
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        for (let i = 0; i < 5; i++) { const r = 18 + i * 10; ctx.beginPath(); ctx.arc(480 + Math.sin(t * 0.02 + i) * 10 + i * 8, GY - 250 - i * 30 - (t * 0.5 + i * 20) % 40, r, 0, 7); ctx.fill(); }
      }
      if (kind === 'crater') { ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(300 + i * 120, GY - 230 - ((t * 0.3 + i * 37) % 60), 30 + i * 6, 0, 7); ctx.fill(); } }
    } else if (kind === 'cliff') {
      ctx.fillRect(0, 0, W, GY);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for (let i = 0; i < 12; i++) { const x = ((i * 90 - px) % (W + 90) + W + 90) % (W + 90) - 45; ctx.fillRect(x, 0, 30, GY); }
    } else if (kind === 'tunnel') {
      ctx.fillRect(0, 0, W, GY);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 10; i++) { const x = ((i * 110 - px) % (W + 110) + W + 110) % (W + 110) - 55; ctx.beginPath(); ctx.ellipse(x, GY, 200, 300, 0, Math.PI, 0); ctx.fill(); }
    } else if (kind === 'pines') {
      ctx.beginPath(); ctx.moveTo(-50, GY);
      for (let x = -50; x <= W + 50; x += 30) ctx.lineTo(x, GY - 80 - Math.sin((x + px) * 0.005) * 40);
      ctx.lineTo(W + 50, GY); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 30; i++) { const x = ((i * 40 - px) % (W + 60) + W + 60) % (W + 60) - 30; const h = 60 + this.hash(i) * 50; ctx.beginPath(); ctx.moveTo(x, GY - 60); ctx.lineTo(x + 12, GY - 60 - h); ctx.lineTo(x + 24, GY - 60); ctx.fill(); }
    } else if (kind === 'sea') {
      ctx.fillStyle = st.farCol; ctx.fillRect(0, GY - 160, W, 160);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, GY - 150 + i * 18); ctx.lineTo(W, GY - 150 + i * 18); ctx.stroke(); }
    } else if (kind === 'columns') {
      for (let i = 0; i < 9; i++) { const x = ((i * 130 - px) % (W + 130) + W + 130) % (W + 130) - 65; ctx.fillRect(x, 60, 36, GY - 60); ctx.fillRect(x - 10, 50, 56, 16); ctx.fillRect(x - 8, GY - 20, 52, 20); }
      ctx.fillStyle = st.farCol; ctx.fillRect(0, 30, W, 30);
    } else if (kind === 'pipes') {
      ctx.fillRect(0, 0, W, GY);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 14;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 40 + i * 50); ctx.lineTo(W, 40 + i * 50); ctx.stroke(); }
      for (let i = 0; i < 8; i++) { const x = ((i * 150 - px) % (W + 150) + W + 150) % (W + 150) - 75; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GY); ctx.stroke(); }
    } else if (kind === 'shelves') {
      ctx.fillRect(0, 0, W, GY);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 4; i++) ctx.fillRect(0, 70 + i * 90, W, 8);
      for (let i = 0; i < 40; i++) {
        const x = ((i * 48 - px) % (W + 48) + W + 48) % (W + 48) - 24; const row = i % 4;
        const hue = ['#e05050', '#50a0e0', '#e0c050', '#50c080', '#c080e0'][i % 5];
        ctx.fillStyle = hue; ctx.fillRect(x, 70 + row * 90 - 40 - this.hash(i) * 20, 18, 40 + this.hash(i) * 20);
      }
    }
  },

  mid(ctx, st, px, t) {
    const W = this.W, GY = this.GY; const k = st.mid; ctx.fillStyle = st.midCol;
    const rep = (i, step, extra = 0) => ((i * step - px) % (W + step + extra) + W + step + extra) % (W + step + extra) - step / 2;
    if (k === 'rocks' || k === 'sulfur' || k === 'ash' || k === 'mudpots') {
      for (let i = 0; i < 14; i++) {
        const x = rep(i, 140); const r = 20 + this.hash(i) * 40;
        ctx.fillStyle = st.midCol; ctx.beginPath(); ctx.ellipse(x, GY - r * 0.5, r, r * 0.6, 0, 0, 7); ctx.fill();
        if (k === 'sulfur') { ctx.fillStyle = '#f5e03a'; ctx.beginPath(); ctx.moveTo(x - 10, GY - r * 0.8); ctx.lineTo(x, GY - r * 1.3); ctx.lineTo(x + 10, GY - r * 0.8); ctx.fill(); }
        if (k === 'mudpots') { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(x, GY - r - ((t + i * 20) % 50), 10 + ((t + i * 20) % 50) * 0.3, 0, 7); ctx.fill(); }
      }
    } else if (k === 'araucarias') {
      for (let i = 0; i < 9; i++) {
        const x = rep(i, 220); const h = 150 + this.hash(i) * 90;
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 5, GY - h, 10, h);
        ctx.fillStyle = st.midCol;
        for (let j = 0; j < 5; j++) { const y = GY - h + j * 25; const w = 30 + j * 12; ctx.beginPath(); ctx.moveTo(x - w, y + 18); ctx.lineTo(x, y - 6); ctx.lineTo(x + w, y + 18); ctx.closePath(); ctx.fill(); }
      }
    } else if (k === 'waterfall') {
      const x0 = ((300 - px) % (W + 400) + W + 400) % (W + 400) - 200;
      ctx.fillStyle = st.midCol; ctx.globalAlpha = 0.8; ctx.fillRect(x0, 0, 120, GY);
      ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 12; i++) ctx.fillRect(x0 + 10 + i * 9, ((t * 6 + i * 50) % (GY + 40)) - 40, 3, 40);
    } else if (k === 'terraces') {
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? st.midCol : 'rgba(0,0,0,0.25)'; ctx.fillRect(0, GY - 160 + i * 25, W, 25); }
      for (let i = 0; i < 8; i++) { const x = rep(i, 200); ctx.fillStyle = '#3a2a20'; ctx.fillRect(x, GY - 200, 14, 60); ctx.fillRect(x - 20, GY - 200, 54, 8); }
    } else if (k === 'stalactites') {
      for (let i = 0; i < 20; i++) { const x = rep(i, 60); const h = 30 + this.hash(i) * 90; ctx.beginPath(); ctx.moveTo(x - 12, 0); ctx.lineTo(x, h); ctx.lineTo(x + 12, 0); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,120,40,0.5)';
      for (let i = 0; i < 6; i++) { const x = rep(i, 200); ctx.beginPath(); ctx.arc(x, 200 + this.hash(i) * 150, 6, 0, 7); ctx.fill(); }
    } else if (k === 'geysers') {
      for (let i = 0; i < 4; i++) {
        const x = rep(i, 300); const ph = (t * 0.02 + i) % 6; const h = ph < 2 ? Math.sin(ph / 2 * Math.PI) * 220 : 0;
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 8, GY - h, 16, h);
        ctx.fillStyle = st.midCol; ctx.beginPath(); ctx.ellipse(x, GY - 6, 40, 12, 0, 0, 7); ctx.fill();
      }
    } else if (k === 'arches') {
      for (let i = 0; i < 6; i++) { const x = rep(i, 220); ctx.fillStyle = st.midCol; ctx.fillRect(x - 60, GY - 200, 120, 200); ctx.fillStyle = st.sky[0]; ctx.beginPath(); ctx.ellipse(x, GY - 120, 40, 60, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(x - 40, GY - 120, 80, 120); }
    } else if (k === 'heap') {
      ctx.beginPath(); ctx.moveTo(0, GY);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, GY - 100 - Math.abs(((x + px * 0.5) % 600) - 300) * 0.3);
      ctx.lineTo(W, GY); ctx.fill();
      ctx.strokeStyle = 'rgba(80,160,255,0.6)'; ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) { const x = rep(i, 100); ctx.beginPath(); ctx.moveTo(x, GY - 150); ctx.lineTo(x, GY - 120); ctx.stroke(); }
    } else if (k === 'tanks') {
      for (let i = 0; i < 5; i++) { const x = rep(i, 260); ctx.fillStyle = st.midCol; ctx.fillRect(x - 80, GY - 230, 160, 230); ctx.fillStyle = '#b06a20'; ctx.fillRect(x - 70, GY - 150, 140, 140); ctx.strokeStyle = '#ccd'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, GY - 260); ctx.lineTo(x, GY - 40); ctx.stroke(); ctx.save(); ctx.translate(x, GY - 90); ctx.rotate(t * 0.1); ctx.fillStyle = '#ddd'; ctx.fillRect(-40, -4, 80, 8); ctx.fillRect(-4, -40, 8, 80); ctx.restore(); }
    } else if (k === 'pipesewer') {
      ctx.fillStyle = st.midCol; ctx.fillRect(0, GY - 60, W, 20);
      for (let i = 0; i < 6; i++) { const x = rep(i, 200); ctx.beginPath(); ctx.arc(x, GY - 180, 50, 0, 7); ctx.fill(); ctx.fillStyle = '#202820'; ctx.beginPath(); ctx.arc(x, GY - 180, 36, 0, 7); ctx.fill(); ctx.fillStyle = st.midCol; }
      ctx.fillStyle = 'rgba(200,230,120,0.5)'; for (let i = 0; i < 20; i++) { const x = rep(i, 60); ctx.fillRect(x, GY - 100 - this.hash(i) * 200, 6, 14 + this.hash(i + 3) * 30); }
    } else if (k === 'bench') {
      ctx.fillStyle = st.midCol; ctx.fillRect(0, GY - 90, W, 14);
      for (let i = 0; i < 20; i++) {
        const x = rep(i, 110); const type = i % 4;
        if (type === 0) { ctx.fillStyle = '#dfe'; ctx.beginPath(); ctx.moveTo(x - 20, GY - 90); ctx.lineTo(x + 20, GY - 90); ctx.lineTo(x + 6, GY - 150); ctx.lineTo(x - 6, GY - 150); ctx.fill(); ctx.fillStyle = '#f0a030'; ctx.fillRect(x - 16, GY - 110, 32, 18); }
        else if (type === 1) { ctx.fillStyle = '#ddd'; ctx.fillRect(x - 25, GY - 170, 50, 80); ctx.fillStyle = '#4af'; ctx.fillRect(x - 15, GY - 160, 30, 10); }
        else if (type === 2) { ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.arc(x, GY - 100, 16, 0, 7); ctx.fill(); ctx.fillStyle = '#e8c070'; ctx.beginPath(); ctx.arc(x, GY - 100, 12, 0, 7); ctx.fill(); }
        else { ctx.fillStyle = '#cfe'; ctx.fillRect(x - 6, GY - 140, 12, 50); ctx.fillStyle = '#e04040'; ctx.fillRect(x - 6, GY - 110, 12, 20); }
      }
    }
  }
};

// Partículas por escenario (sólo visuales, no afectan la pelea)
const Particles = {
  list: [], kind: 'none',
  reset(kind) { this.kind = kind; this.list = []; },
  update(W, H, GY) {
    const k = this.kind; if (k === 'none') return;
    const spawn = { steam: 1, spray: 2, drip: 0.3, ash: 2, snow: 3, bubbles: 1, rain: 6 }[k] || 1;
    for (let i = 0; i < spawn; i++) if (Math.random() < 0.6) {
      const p = { x: Math.random() * W, y: GY, vx: 0, vy: 0, life: 60 + Math.random() * 60, r: 2 + Math.random() * 4 };
      if (k === 'steam') { p.vy = -1 - Math.random(); p.r = 8 + Math.random() * 14; p.life = 90; }
      if (k === 'spray') { p.vy = -2 - Math.random() * 3; p.vx = (Math.random() - 0.5) * 2; p.y = GY - 20 - Math.random() * 60; }
      if (k === 'drip' || k === 'rain') { p.y = -10; p.vy = k === 'rain' ? 9 : 4; p.r = 2; p.life = 80; }
      if (k === 'ash' || k === 'snow') { p.y = -10; p.vy = k === 'ash' ? 1 : 0.8; p.vx = (Math.random() - 0.5); p.life = 400; }
      if (k === 'bubbles') { p.y = GY - 10; p.vy = -1.5; p.r = 3 + Math.random() * 5; p.life = 50; }
      this.list.push(p);
    }
    for (const p of this.list) { p.x += p.vx + (k === 'snow' ? Math.sin(p.life * 0.1) * 0.5 : 0); p.y += p.vy; p.life--; }
    this.list = this.list.filter(p => p.life > 0 && p.y < H + 20);
  },
  draw(ctx) {
    const k = this.kind;
    const col = { steam: 'rgba(255,255,255,0.25)', spray: 'rgba(220,245,255,0.7)', drip: 'rgba(200,120,60,0.8)', ash: 'rgba(90,90,90,0.8)', snow: 'rgba(255,255,255,0.9)', bubbles: 'rgba(255,220,160,0.6)', rain: 'rgba(200,220,255,0.6)' }[k];
    if (!col) return; ctx.fillStyle = col;
    for (const p of this.list) {
      if (k === 'rain' || k === 'drip') ctx.fillRect(p.x, p.y, 2, 12);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    }
  }
};
