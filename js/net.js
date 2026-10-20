// Red: transporte (WebRTC vía PeerJS sin servidor, o WebSocket contra server/server.js) + lockstep determinista.
const Net = {
  mode: null, conn: null, ws: null, peer: null, side: 0, onMessage: null, onStatus: null, connected: false, rtt: 0,
  status(s) { if (this.onStatus) this.onStatus(s); },
  code() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)]; return c; },

  // ---- Modo A: WebRTC (PeerJS). Host crea la sala con un código; el invitado se conecta con él. ----
  peerOk() { if (typeof Peer === 'undefined') { this.status('No se pudo cargar PeerJS (sin Internet o CDN bloqueado). Usa el modo con servidor WebSocket.'); return false; } return true; },
  hostPeer(code) {
    if (!this.peerOk()) return;
    this.mode = 'peer'; this.side = 0; this.status('Creando sala ' + code + '…');
    this.peer = new Peer('acidgear-' + code, { debug: 0 });
    this.peer.on('open', () => this.status('Sala ' + code + ' lista. Esperando al rival… (dale el código)'));
    this.peer.on('connection', c => { this.conn = c; this.bindPeer(c); });
    this.peer.on('error', e => this.status('Error PeerJS: ' + e.type + (e.type === 'unavailable-id' ? ' (código en uso, prueba otro)' : '')));
  },
  joinPeer(code) {
    if (!this.peerOk()) return;
    this.mode = 'peer'; this.side = 1; this.status('Conectando a la sala ' + code + '…');
    this.peer = new Peer(undefined, { debug: 0 });
    this.peer.on('open', () => { const c = this.peer.connect('acidgear-' + code, { reliable: true, serialization: 'json' }); this.conn = c; this.bindPeer(c); });
    this.peer.on('error', e => this.status('Error PeerJS: ' + e.type + (e.type === 'peer-unavailable' ? ' (no existe esa sala)' : '')));
  },
  bindPeer(c) {
    c.on('open', () => { this.connected = true; this.status('¡Conectado por WebRTC! Elijan personaje.'); this.pingLoop(); });
    c.on('data', d => this.recv(d));
    c.on('close', () => { this.connected = false; this.status('El rival se desconectó.'); });
    c.on('error', e => this.status('Error de conexión: ' + e));
  },

  // ---- Modo B: WebSocket contra tu servidor Ubuntu (server/server.js) ----
  connectWS(url, room) {
    this.mode = 'ws'; this.status('Conectando a ' + url + '…');
    try { this.ws = new WebSocket(url); } catch (e) { this.status('URL inválida: ' + e.message); return; }
    this.ws.onopen = () => { this.ws.send(JSON.stringify({ t: 'join', room })); };
    this.ws.onmessage = ev => { const d = JSON.parse(ev.data);
      if (d.t === 'joined') { this.side = d.side; this.status('En la sala "' + room + '" como jugador ' + (d.side + 1) + '. ' + (d.peers === 2 ? '' : 'Esperando al rival…')); }
      else if (d.t === 'ready') { this.connected = true; this.status('¡Conectado por WebSocket! Elijan personaje.'); this.pingLoop(); }
      else if (d.t === 'full') this.status('La sala ya tiene 2 jugadores.');
      else if (d.t === 'left') { this.connected = false; this.status('El rival se desconectó.'); }
      else this.recv(d); };
    this.ws.onerror = () => this.status('No se pudo conectar a ' + url + ' (¿servidor encendido? ¿wss:// si la página es https?)');
    this.ws.onclose = () => { if (this.connected) this.status('Conexión cerrada.'); this.connected = false; };
  },

  send(obj) {
    if (this.mode === 'peer' && this.conn && this.conn.open) this.conn.send(obj);
    else if (this.mode === 'ws' && this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj));
  },
  recv(d) {
    if (d.t === 'p') { this.send({ t: 'q', ts: d.ts }); return; }
    if (d.t === 'q') { this.rtt = performance.now() - d.ts; return; }
    if (this.onMessage) this.onMessage(d);
  },
  pingLoop() { clearInterval(this._ping); this._ping = setInterval(() => this.send({ t: 'p', ts: performance.now() }), 1000); },
  close() { clearInterval(this._ping); if (this.conn) this.conn.close(); if (this.peer) this.peer.destroy(); if (this.ws) this.ws.close(); this.conn = this.peer = this.ws = null; this.connected = false; this.mode = null; }
};

// Lockstep con retraso de entrada: cada jugador manda sólo sus bits; el frame f se simula cuando están los dos inputs.
const Lockstep = {
  delay: 3, frame: 0, inputs: [{}, {}], side: 0, stalled: 0,
  start(side, delay) { this.side = side; this.delay = delay; this.frame = 0; this.inputs = [{}, {}]; this.stalled = 0; for (let i = 0; i < delay; i++) { this.inputs[0][i] = 0; this.inputs[1][i] = 0; } },
  // Devuelve [bits0, bits1] para el frame actual, o null si falta el input remoto (hay que esperar).
  tick(localBits) {
    const f = this.frame + this.delay;
    if (this.inputs[this.side][f] === undefined) { this.inputs[this.side][f] = localBits; Net.send({ t: 'i', f, b: localBits }); }
    const a = this.inputs[0][this.frame], b = this.inputs[1][this.frame];
    if (a === undefined || b === undefined) { this.stalled++; if (this.stalled % 30 === 0) Net.send({ t: 'i', f, b: localBits }); return null; }
    this.stalled = 0; this.frame++;
    delete this.inputs[0][this.frame - 60]; delete this.inputs[1][this.frame - 60];
    return [a, b];
  },
  onRemote(f, b) { if (this.inputs[1 - this.side][f] === undefined) this.inputs[1 - this.side][f] = b; }
};
