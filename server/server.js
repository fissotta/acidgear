// ACID GEAR — servidor opcional (modo B). Sirve el juego y reenvía los inputs entre los 2 jugadores de cada sala.
// Uso:  cd server && npm install && node server.js [puerto]      (por defecto 8787)
// Luego en el juego: ONLINE con servidor WebSocket → ws://IP-de-este-equipo:8787  (o el juego mismo en http://IP:8787/)
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const PORT = parseInt(process.argv[2] || process.env.PORT || '8787', 10);
const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.md': 'text/plain; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.opus': 'audio/ogg', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
});

const wss = new WebSocketServer({ server });
const rooms = new Map(); // nombre → [ws0, ws1]
wss.on('connection', ws => {
  ws.room = null; ws.side = -1;
  ws.on('message', raw => {
    let d; try { d = JSON.parse(raw); } catch (e) { return; }
    if (d.t === 'join') {
      const name = String(d.room || 'sala1').slice(0, 32);
      const r = rooms.get(name) || []; if (r.length >= 2) { ws.send(JSON.stringify({ t: 'full' })); return; }
      ws.room = name; ws.side = r.length; r.push(ws); rooms.set(name, r);
      ws.send(JSON.stringify({ t: 'joined', side: ws.side, peers: r.length }));
      console.log(`[${name}] jugador ${ws.side + 1} entró (${r.length}/2)`);
      if (r.length === 2) r.forEach(c => c.send(JSON.stringify({ t: 'ready' })));
      return;
    }
    const r = rooms.get(ws.room); if (!r) return;
    for (const c of r) if (c !== ws && c.readyState === 1) c.send(raw.toString()); // relay al otro jugador
  });
  ws.on('close', () => {
    const r = rooms.get(ws.room); if (!r) return;
    const rest = r.filter(c => c !== ws); rooms.set(ws.room, rest); if (!rest.length) rooms.delete(ws.room);
    rest.forEach(c => c.send(JSON.stringify({ t: 'left' })));
    console.log(`[${ws.room}] jugador ${ws.side + 1} salió`);
  });
});

server.listen(PORT, () => {
  const os = require('os'); const ips = [];
  for (const ifs of Object.values(os.networkInterfaces())) for (const i of ifs) if (i.family === 'IPv4' && !i.internal) ips.push(i.address);
  console.log(`ACID GEAR server en el puerto ${PORT}`);
  console.log(`Juego:      http://${ips[0] || 'localhost'}:${PORT}/`);
  console.log(`WebSocket:  ws://${ips[0] || 'localhost'}:${PORT}`);
});
