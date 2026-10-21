# ACID GEAR: XTREME LITHO-STRIKE — instructivo

Juego de pelea 2D estilo Guilty Gear entre los 17 taxa de la clase *Acidithiobacillia* (Fig. 3A de Moya-Beltrán et al. 2021, ISME J 15:3221). Página web estática: corre en GitHub Pages sin ningún servidor, incluso el modo online de 2 jugadores.

Versión 0.9.15 (oct 2026). Carpeta: `/Users/issotta/proyectos/acidgear`.

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

La selección de personaje dura como máximo 30 segundos (contador arriba a la derecha): al llegar a 0 se confirma la casilla donde esté el cursor.

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
| Especial | ↓ ↘ → + K (abajo, adelante, fuerte) | ↓ → + Numpad 2 | ↓↘→ + B / ○ |
| Overdrive (medidor al 100 %) | ↓ ↘ → + O | ↓ → + Numpad 6 | ↓↘→ + RT |
| Burst de biofilm / Lysis Cancel | H | Numpad 0 (o Shift der.) | LB |

**Enter pausa** la pelea (local): la pantalla de pausa muestra las teclas, el especial, el Overdrive y los combos de los dos jugadores; Esc desde la pausa vuelve al título. Online y 1 jugador siempre usan los controles del jugador 1; en los menús y la selección de personaje de 1 jugador, entrenamiento y online sirven tanto WASD + J como flechas + Enter. En 2 jugadores, P1 elige con WASD + J y P2 con flechas + Numpad 1 (o B). Doble toque adelante/atrás = dash. Abajo + K (fuerte) = lanzador (antiaéreo). Abajo + L (patada) = barrida (baja). Golpes en el aire = overhead (hay que bloquear de pie). Bloqueo: mantener atrás; abajo+atrás bloquea bajos.

Sistemas estilo GG: los golpes se cancelan en cadena ligero → ligero → fuerte → patada → Especial (↓↘→ + K) → Overdrive (↓↘→ + O) (gatling). Los especiales y el Overdrive ya no salen con un solo botón: siempre llevan el cuarto de círculo adelante. Tras un fuerte, una patada o el lanzador (S+K) puedes saltar (W) y seguir el combo en el aire con J/K/L (jump cancel). El contador muestra los golpes y el daño acumulado. El **Gradiente de protones** (medidor) sube al pegar, bloquear y acercarse; al 100 % habilita el Overdrive (O). **Lysis Cancel** (H durante tu propio ataque, cuesta 50 %) cancela cualquier golpe. **Burst de biofilm** (H mientras te pegan, 1 por round) empuja al rival. Combos con escalado de daño.

Formato: 3 rounds de 2:00, gana el que llega a 2. Escenario al azar entre 20 (aparece el lugar, pH y temperatura).

## 6. Los 17 personajes, sus poderes y la biología real detrás

| Sigla | Taxón | Especial (↓↘→ + K) | Overdrive (↓↘→ + O) | Base biológica del poder |
|---|---|---|---|---|
| AFE | *A. ferrooxidans* | Rusticyanin Wave (proyectil) | Biolixiviación Total (rayo) | Oxida Fe²⁺ con rusticianina y cadena de transporte de electrones (Cyc2, rus): su "onda" es literalmente electrones de hierro; la biolixiviación disuelve minerales. |
| AFG | *'A. ferruginosus'* CF3 | Ferruginous Slam (agarre con armadura) | Óxido Total | Hierro-oxidante; "ferruginosus" = herrumbroso. Los precipitados de hierro (jarosita/óxidos) son su armadura. |
| AFD | *A. ferridurans* | Ferric Reduction (absorbe proyectiles y cura, contraataca) | Hydrogen Grab (ola que atrae) | Reduce Fe³⁺ en anaerobiosis (usa el hierro como aceptor de electrones) y oxida H₂ con hidrogenasas del grupo 1: "absorbe electrones" y se alimenta de hidrógeno. |
| AFP | *A. ferriphilus* | Iron Hunger (agarre que drena vida) | Ferriphilus Crush | "Amante del hierro"; crecimiento lento y sin oxidasas *bd*: por eso es lento y pesado, y se alimenta drenando. |
| AFV | *A. ferrivorans* | Permafrost Shield (proyectil que ralentiza) | Era Glacial | Psicrotolerante: crece a 4 °C en minas boreales (Noruega, Canadá). El frío es su arma. |
| AFN | *A. ferrianus* | pH 1.8 Hammer (uppercut invulnerable) | Hammer del Protón (3 golpes) | pH óptimo de 1,8, uno de los más bajos del clado; rama basal del clado dual: el "martillo de protones" es su acidez récord. |
| ATH | *A. thiooxidans* | Sulfuric Rain (lluvia sobre el rival) | Tormenta de H₂SO₄ | Oxida azufre elemental a ácido sulfúrico y tolera pH 0,5: literalmente hace llover H₂SO₄ (es el responsable de la corrosión biogénica). |
| ASU | *'A. sulfurivorans'* RW2 | Stream Current (proyectil bajo) + doble salto | Crecida Ferruginosa | Aislado de un arroyo ácido ferruginoso en Gales: pelea con la corriente del arroyo. |
| ACO | *A. concretivorus* | Concrete Crumble (bloque que explota) | Colapso de Alcantarilla | Aislado de hormigón corroído de alcantarillas (ex *Thiobacillus concretivorus*): el que se come el hormigón. |
| AMO | *'A. montserratensis'* GG1-14 | Pyroclastic Flow (ola de ceniza) | Soufrière Hills | Aislado en la isla volcánica de Montserrat (volcán Soufrière Hills, erupciones con flujos piroclásticos). |
| AMA | *'A. marinus'* SH | Tidal Salt Wave (ola que empuja) | Tsunami Salino | Aislado de agua de mar, halotolerante: único acidófilo del clado adaptado a la sal. |
| FCA | *F. caldus* | Thermal Burst (aura de 45 °C) | Tanque BIOX | Termófilo moderado (óptimo 45 °C), azufre-oxidante dominante en tanques agitados de biooxidación (BIOX): quema por temperatura. |
| ICO | *'I. copahuensis'* | Erupción Copahue (columna de fumarola) | Géiser del Río Agrio | Especie descrita a partir de ≥6 aislados del volcán Copahue (y Vulcano, Italia); termotolerante de sistemas geotermales. |
| IYE | Ca. *I. yellowstonensis* | Geyser Strike (géiser bajo el rival) | Old Faithful | MAG de una laguna hidrotermal ácida de Yellowstone: géiseres. |
| ITA | Ca. *I. taiwanensis* | Hot Spring Mist (teletransporte + tajo) | Niebla de Beitou | MAG de una termal ácida de Taiwán (zona de Beitou): la niebla de las termales. |
| AMS | *'Am. sulfuriphilus'* | Nitrogenase Nova (rayo que neutraliza proyectiles) | N₂→NH₃ Overload | Fija N₂ (nitrogenasa NifHDK), crece de pH 3 a 7 (el más tolerante: "neutraliza" ácido) y tiene una variante propia de ATP sintasa. |
| TTP | *T. tepidarius* | Roman Bath Steam (puño de vapor) | cbb₃ Overload (3 golpes) | Neutrófilo de 40–45 °C aislado de los Baños Romanos de Bath (UK); la única del grupo con oxidasa *cbb₃*; familia hermana (Thermithiobacillaceae): el "jefe" externo. |

Comandos comunes a todos: Litho Rush (→ → + K, embestida con armadura) y Proton Shot (↓ ↘ → + J, bola de ácido): representan el gradiente de protones que todas estas bacterias mantienen a través de la membrana para sobrevivir a pH extremo.

## 6b. Fatalities

Cuando la pelea termina por KO (no por tiempo), el perdedor queda de pie mareado con una frase al azar (**¡LÍSALO!**, **¡AUTOCLÁVALO!**, **¡CENTRIFÚGALO!**, **¡PIPETÉALO!**, **¡FÍLTRALO A 0,22 µm!**, **¡MÁNDALO AL DSMZ!**… 20 frases), el ganador camina hacia él y ejecuta solo un remate (no hay que apretar nada). La mitad de las veces es el remate propio del taxón y la otra mitad uno de laboratorio (Autoclave 121 °C, Centrífuga 13 000 × g, Pipeta P1000, Vórtex, Ultracongelador −80 °C, Luz UV 254 nm). Los remates propios: AFE Biolixiviación total (relámpagos de Fe³⁺ y se derrite) · AFG Prensa de óxido (lo aplasta) · AFD Reducción férrica (le roba los electrones y se desmorona gris) · AFP Hambre de hierro (lo drena hasta encogerlo) · AFV Cero absoluto (lo congela y lo rompe en pedazos) · AFN Martillo pH 1,8 (uppercut al cielo) · ATH Lluvia sulfúrica (lo derrite) · ASU Arrastre ferruginoso (la corriente se lo lleva) · ACO Entierro de hormigón (bloques encima) · AMO Flujo piroclástico (estatua de ceniza) · AMA Tsunami salino (se lo lleva la ola) · FCA Combustión a 45 °C (lo quema) · ICO Erupción del Copahue (columna de lava) · IYE Old Faithful (géiser) · ITA Niebla cortante (lo rebana) · AMS Nova de nitrógeno (lo vaporiza) · TTP Baño romano a presión (lo cuece al vapor hasta que revienta). El código está en `js/fatality.js`.

## 7. Música

Toda la música y los efectos se sintetizan en el navegador con Web Audio (`js/audio.js`): guitarra distorsionada, bajo, doble bombo, lead. Cada escenario tiene tonalidad, escala, tempo y **estilo** propios (`key`, `scale`, `tempo`, `style` en `js/stages.js`): *thrash* (rápido y denso: Vertiente del Agrio, Vulcano, Escondida, alcantarilla), *gallop* (galope: Río Tinto, Parys Mountain, Salto del Agrio), *doom* (lento y pesado: Richmond Mine, Talvivaara, Montserrat, solfataras), *groove* (sincopado: Bath, reactor BIOX, laboratorio, Río Agrio) y *epic* (acordes largos y lead continuo: laguna del cráter, Yellowstone, Lago Caviahue). Dentro de cada estilo, los riffs, la progresión de acordes y la batería se sortean con la semilla de cada pelea, así que nunca suena igual dos veces. El volumen está abajo a la derecha. Si quieres sumar canciones propias (como en Copahue FM), avísame y agrego una carpeta `music/` con lista `TRACKS` igual que `copahue-v8/js/radio.js`.

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
js/fatality.js     los 17 remates (cinemática final)
js/main.js         pantallas y bucle
server/server.js   servidor Node opcional (modo B)
tools/serve.py     servidor local de prueba
PLAN.md            plan de desarrollo
```

## 8b. Modo demostración

Si la pantalla de inicio queda 1 minuto sin que se toque nada, arranca sola una pelea CPU vs CPU (nivel difícil) con personajes y escenario al azar. Cualquier tecla, clic o movimiento del mouse vuelve al título.

## 9. Pendientes / ideas
- Más animaciones por personaje (ahora comparten esqueleto y poses; cambian forma, color, accesorios y poderes).
- Rollback netcode (hoy es lockstep con retraso: perfecto en LAN, jugable por Internet con ping < 80 ms).
- Modo entrenamiento y lista de movimientos en pantalla.
