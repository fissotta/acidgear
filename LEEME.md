# ACID GEAR: XTREME LITHO-STRIKE — instructivo

Juego de pelea 2D estilo Guilty Gear entre los 17 taxa de la clase *Acidithiobacillia* (Fig. 3A de Moya-Beltrán et al. 2021, ISME J 15:3221). Página web estática: corre en GitHub Pages sin ningún servidor, incluso el modo online de 2 jugadores.

Versión 0.9.5 (oct 2026). Carpeta: `/Users/issotta/proyectos/acidgear`.

---

## 1. Probarlo en tu computador (1 minuto)

```
cd /Users/issotta/proyectos/acidgear
python3 tools/serve.py          # → http://localhost:8000
```
Abre esa dirección en Chrome, Edge, Firefox o Safari. (No abras `index.html` con doble clic: por seguridad los navegadores bloquean partes del juego con `file://`.)

## 2. Publicarlo en GitHub Pages (sin servidor, gratis)

```
cd /Users/issotta/proyectos/acidgear
git init
git add .
git commit -m "ACID GEAR v0.9.0"
git branch -M main
git remote add origin https://github.com/fissotta/acidgear.git     # crea antes el repo vacío en GitHub
git push -u origin main
```
Luego en GitHub: **Settings → Pages → Branch: main / (root) → Save**. En 1–2 minutos queda en
`https://fissotta.github.io/acidgear/` (si tu usuario es otro, cambia `fissotta`).

Para actualizar después de cambiar algo: `git add . && git commit -m "cambio" && git push`.

## 3. ¿Se puede jugar online SIN mi desktop? — Sí

Elige **ONLINE sin servidor (WebRTC, código de sala)** en el título:

1. Un jugador aprieta **CREAR SALA** y le pasa al otro el código de 4 letras (por WhatsApp, lo que sea).
2. El otro escribe el código y aprieta **UNIRSE**.
3. Al conectar, los dos eligen personaje y empieza la pelea.

Cómo funciona: los navegadores se conectan **directo entre ellos** (WebRTC). Sólo para encontrarse usan el servidor público gratuito de PeerJS (`0.peerjs.com`), que no ve la partida. Funciona desde GitHub Pages, en la misma red del lab o por Internet. Lo único que intercambian son los botones apretados (unos bytes por frame): los dos navegadores simulan exactamente la misma pelea (lockstep determinista) con un retraso de 2–8 frames que se ajusta solo según el ping (se muestra abajo a la derecha).

Limitaciones: si uno de los dos está detrás de un NAT muy cerrado (algunas redes corporativas/universitarias o 4G), WebRTC no logra conectar y el estado se queda en "conectando". Ahí sirve el modo B.

## 4. Modo B: tu Ubuntu como servidor (LAN del laboratorio o Internet)

Sirve para la red local (no necesita Internet) y como respaldo cuando WebRTC no conecta. El servidor es un relay: recibe los inputs de un jugador y se los pasa al otro; además sirve el juego mismo.

### Instalar en el Ubuntu
```
sudo apt install -y nodejs npm          # Node 18 o superior
cd ~/acidgear/server                     # copia la carpeta acidgear completa al Ubuntu
npm install
node server.js                           # puerto 8787 (o: node server.js 9000)
```
Verás algo como:
```
ACID GEAR server en el puerto 8787
Juego:      http://192.168.1.50:8787/
WebSocket:  ws://192.168.1.50:8787
```
Para que quede corriendo siempre: `sudo npm i -g pm2 && pm2 start server.js --name acidgear && pm2 save && pm2 startup`.

### Jugar en la LAN
Los dos abren `http://IP-del-ubuntu:8787/` (el juego lo sirve el mismo servidor; no hace falta GitHub), eligen **ONLINE con servidor WebSocket**, escriben `ws://IP-del-ubuntu:8787` y el mismo nombre de sala (ej. `sala1`) y aprietan CONECTAR. El primero en entrar es el jugador 1.

Si el firewall de Ubuntu está activo: `sudo ufw allow 8787/tcp`.

### Jugar por Internet con el servidor
Opción fácil, **Tailscale** (gratis): instálalo en el Ubuntu y en el computador del otro jugador (`curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up`); los dos quedan en una LAN virtual y se usa la IP 100.x.x.x del Ubuntu igual que en la LAN.

Opción con GitHub Pages: la página es `https`, así que el navegador exige `wss://` (WebSocket cifrado). Lo más simple es un túnel de Cloudflare:
```
# en el Ubuntu, con el server corriendo
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared && chmod +x cloudflared
./cloudflared tunnel --url http://localhost:8787
```
Imprime una URL tipo `https://algo-random.trycloudflare.com`. En el juego (desde GitHub Pages) pon `wss://algo-random.trycloudflare.com` como dirección. Alternativa: abrir el puerto 8787 en el router hacia el Ubuntu y usar la IP pública, pero sólo funciona con `ws://` si el juego se abre por `http://` (es decir, servido por el mismo Ubuntu, no por GitHub Pages).

## 5. Controles

**Modo ENTRENAMIENTO** (en el menú del título): eliges tu personaje y luego el muñeco. El muñeco no se mueve (T lo cambia a *bloquea* o *CPU*), no hay tiempo ni KO, la vida se recupera sola y tu medidor está siempre al 100 % para practicar el Overdrive. R reinicia posiciones, M oculta/muestra la lista de movimientos, Esc sale.

**Movimientos de comando** (iguales para todos los personajes):
- **LITHO RUSH**: adelante, adelante + golpe fuerte (→ → + K). Embestida con armadura que derriba.
- **PROTON SHOT**: abajo, abajo-adelante, adelante + golpe ligero (↓ ↘ → + J, estilo hadouken; también vale ↓ luego →). Bola de ácido rápida.

| Acción | Jugador 1 | Jugador 2 (mismo teclado) | Gamepad |
|---|---|---|---|
| Mover / agacharse / saltar | W A S D | flechas | stick / cruceta |
| Golpe ligero (LP) | J | Numpad 1 (o B) | X / □ |
| Golpe fuerte (HP) | K | Numpad 2 (o N) | Y / △ (o RB) |
| Patada (K) | L (o I) | Numpad 3 (o M) | A / ✕ |
| Especial | U | Numpad 5 (o .) | B / ○ |
| Overdrive (medidor al 100 %) | O | Numpad 6 (o /) | RT |
| Burst de biofilm / Lysis Cancel | H | Numpad 0 (o Shift der.) | LB |

Online y 1 jugador siempre usan los controles del jugador 1. Doble toque adelante/atrás = dash. Abajo + K (fuerte) = lanzador (antiaéreo). Abajo + L (patada) = barrida (baja). Golpes en el aire = overhead (hay que bloquear de pie). Bloqueo: mantener atrás; abajo+atrás bloquea bajos.

Sistemas estilo GG: los golpes se cancelan en cadena ligero → ligero → fuerte → patada → Especial → Overdrive (gatling). Tras un fuerte, una patada o el lanzador (S+K) puedes saltar (W) y seguir el combo en el aire con J/K/L (jump cancel). El contador muestra los golpes y el daño acumulado. El **Gradiente de protones** (medidor) sube al pegar, bloquear y acercarse; al 100 % habilita el Overdrive (O). **Lysis Cancel** (H durante tu propio ataque, cuesta 50 %) cancela cualquier golpe. **Burst de biofilm** (H mientras te pegan, 1 por round) empuja al rival. Combos con escalado de daño.

Formato: 3 rounds de 2:00, gana el que llega a 2. Escenario al azar entre 20 (aparece el lugar, pH y temperatura).

## 6. Los 17 personajes y sus poderes

| Sigla | Taxón | Especial (U) | Overdrive (O) |
|---|---|---|---|
| AFE | *A. ferrooxidans* | Rusticyanin Wave (proyectil) | Biolixiviación Total (rayo) |
| AFG | *'A. ferruginosus'* | Ferruginous Slam (agarre con armadura) | Óxido Total |
| AFD | *A. ferridurans* | Ferric Reduction (absorbe proyectiles y cura, contraataca) | Hydrogen Grab (ola que atrae) |
| AFP | *A. ferriphilus* | Iron Hunger (agarre que drena vida) | Ferriphilus Crush |
| AFV | *A. ferrivorans* | Permafrost Shield (proyectil que ralentiza) | Era Glacial |
| AFN | *A. ferrianus* | pH 1.8 Hammer (uppercut invulnerable) | Hammer del Protón (3 golpes) |
| ATH | *A. thiooxidans* | Sulfuric Rain (lluvia sobre el rival) | Tormenta de H₂SO₄ |
| ASU | *'A. sulfurivorans'* | Stream Current (proyectil bajo) + doble salto | Crecida Ferruginosa |
| ACO | *A. concretivorus* | Concrete Crumble (bloque que explota) | Colapso de Alcantarilla |
| AMO | *'A. montserratensis'* | Pyroclastic Flow (ola de ceniza) | Soufrière Hills |
| AMA | *'A. marinus'* | Tidal Salt Wave (ola que empuja a la esquina) | Tsunami Salino |
| FCA | *F. caldus* | Thermal Burst (aura de 45 °C) | Tanque BIOX |
| ICO | *'I. copahuensis'* | Erupción Copahue (columna de fumarola) | Géiser del Río Agrio |
| IYE | Ca. *I. yellowstonensis* | Geyser Strike (géiser bajo el rival) | Old Faithful |
| ITA | Ca. *I. taiwanensis* | Hot Spring Mist (teletransporte + tajo) | Niebla de Beitou (4 golpes) |
| AMS | *'Am. sulfuriphilus'* | Nitrogenase Nova (rayo que neutraliza proyectiles) | N₂→NH₃ Overload |
| TTP | *T. tepidarius* | Roman Bath Steam (puño de vapor) | cbb₃ Overload (3 golpes) |

## 7. Música

Toda la música y los efectos se sintetizan en el navegador con Web Audio (`js/audio.js`): guitarra distorsionada, bajo, doble bombo, lead. Cada escenario tiene tonalidad, escala y tempo propios (campo `key`, `scale`, `tempo` en `js/stages.js`) y el riff se genera con la semilla de la partida. El volumen está abajo a la derecha. Si quieres sumar canciones propias (como en Copahue FM), avísame y agrego una carpeta `music/` con lista `TRACKS` igual que `copahue-v8/js/radio.js`.

## 8. Estructura

```
img/logoMEL.svg    logo del laboratorio (pantalla de inicio)
index.html         pantalla única (título, lobby online, selección, VS, pelea, resultado)
js/rng.js          RNG determinista
js/input.js        teclado (2 jugadores) y gamepad → bits
js/roster.js       los 17 taxa: colores, forma, stats, especial, overdrive, ficha
js/stages.js       20 escenarios (lugar, pH, T, dibujo con parallax, partículas)
js/engine.js       motor de pelea determinista (paso fijo a 60 Hz)
js/draw.js         dibujo vectorial de las bacterias humanizadas (poses, cara, flagelo)
js/audio.js        música metal procedural y efectos
js/ai.js           CPU (3 niveles)
js/net.js          WebRTC (PeerJS) / WebSocket + lockstep
js/render.js       escena, proyectiles, efectos, HUD
js/main.js         pantallas y bucle
server/server.js   servidor Node opcional (modo B)
tools/serve.py     servidor local de prueba
PLAN.md            plan de desarrollo
```

## 9. Pendientes / ideas
- Más animaciones por personaje (ahora comparten esqueleto y poses; cambian forma, color, accesorios y poderes).
- Rollback netcode (hoy es lockstep con retraso: perfecto en LAN, jugable por Internet con ping < 80 ms).
- Modo entrenamiento y lista de movimientos en pantalla.
