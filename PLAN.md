# ACID GEAR: XTREME LITHO-STRIKE — Plan de desarrollo

Juego de pelea 2D estilo Guilty Gear entre bacterias de la clase *Acidithiobacillia*, basado en la Figura 3A de Moya-Beltrán et al. 2021 (ISME J 15:3221). Corre como página web estática (GitHub Pages) y permite 1 jugador vs CPU, 2 jugadores en el mismo teclado, y 2 jugadores por red (LAN o Internet).

Carpeta del proyecto: `/Users/issotta/proyectos/acidgear`

---

## 1. Roster: los 17 taxa de la Fig. 3A

Siglas exactamente como en el paper (Fig. 1D / Fig. 3A). Colores por clado iguales a la figura: naranja-amarillo = clado "fisiología dual" hierro/azufre; azul = azufre-oxidantes *Acidithiobacillus*; verde-azulado = *Fervidacidithiobacillus*; rojo-rosado = *Igneacidithiobacillus*; morado = *Ambacidithiobacillus*; gris = *Thermithiobacillus*.

| # | Sigla | Taxón | Rasgo real (fuente: paper + literatura) | Arquetipo de pelea | Poder especial (Overdrive) |
|---|---|---|---|---|---|
| 1 | **AFE** | *A. ferrooxidans* | Oxida Fe²⁺, S⁰ y H₂; fija N₂; rusticianina; el clásico de la biolixiviación | All-rounder (Sol Badguy) | **Rusticyanin Overdrive**: onda de pirita electrificada (proyectil Fe³⁺); súper: "Biolixiviación Total", el suelo se disuelve bajo el rival |
| 2 | **AFG** | *'A. ferruginosus'* CF3 | Hierro-oxidante, rico en óxidos; pangenoma pequeño | Grappler pesado (Potemkin) | **Ferruginous Slam**: armadura de herrumbre (super-armor) + agarre que aplasta |
| 3 | **AFD** | *A. ferridurans* | Reduce Fe³⁺ en anaerobiosis, oxida H₂ (hidrogenasas grupo 1) | Defensivo / counter | **Ferric Reduction**: absorbe proyectiles como aceptor de electrones y recupera vida; "Hydrogen Grab" |
| 4 | **AFP** | *A. ferriphilus* | Hierro-oxidante de crecimiento lento; carece de oxidasas *bd* | Lento, golpes enormes | **Iron Hunger**: agarre que drena vida; sus golpes rompen guardia |
| 5 | **AFV** | *A. ferrivorans* | Psicrotolerante: crece a 4 °C (minas boreales) | Zoner de control | **Permafrost Shield**: proyectil de escarcha que ralentiza al rival; escudo de hielo |
| 6 | **AFN** | *A. ferrianus* | pH óptimo 1,8 (récord); rama más basal del clado dual | Shoto clásico (Ky Kiske) | **pH 1.8 Hammer**: uppercut ácido ("Shoryuken") + bola de ácido |
| 7 | **ATH** | *A. thiooxidans* (incl. subsp. *albertensis*) | Azufre-oxidante, tolera pH 0,5; generador de ácido sulfúrico | Rushdown rápido (Chipp) | **Sulfuric Rain**: lluvia de H₂SO₄ desde arriba; dash-cancel; "Albertensis Clone" (sombra) |
| 8 | **ASU** | *'A. sulfurivorans'* RW2 | Aislado de un arroyo ácido ferruginoso en Gales | Ágil, movilidad | **Stream Current**: corriente de agua que arrastra, salto doble |
| 9 | **ACO** | *A. concretivorus* ATCC 19703 | Aislado de hormigón corroído (alcantarillas) | Setplay / trampas | **Concrete Crumble**: invoca bloques de hormigón que se corroen y explotan |
| 10 | **AMO** | *'A. montserratensis'* GG1-14 | Isla volcánica de Montserrat | Explosivo | **Pyroclastic Flow**: nube de ceniza horizontal de pantalla completa |
| 11 | **AMA** | *'A. marinus'* SH | Aislado de agua de mar; halotolerante | Golpes con knockback | **Tidal Salt Wave**: ola de salmuera que empuja al rival a la esquina |
| 12 | **FCA** | *F. caldus* | Termófilo moderado (45 °C); azufre; tanques de biolixiviación | Rushdown con fuego | **Thermal Burst**: aura de 45 °C que quema por contacto; súper "Tanque BIOX" |
| 13 | **ICO** | *'I. copahuensis'* VAN18-1 | ≥6 aislados del volcán Copahue; termotolerante; mismo oligotipo en Vulcano (Italia) | Protagonista local, equilibrado | **Erupción Copahue**: columna de fumarola vertical (anti-aire) + súper géiser del Río Agrio |
| 14 | **IYE** | Ca. *I. yellowstonensis* SpSt908 | MAG de laguna hidrotermal ácida (Yellowstone) | Zoner vertical | **Geyser Strike**: géiser que sale del suelo donde está el rival |
| 15 | **ITA** | Ca. *I. taiwanensis* UBA2486 | MAG de termal ácida (Taiwán) | Tramposo / teleport | **Hot Spring Mist**: desaparece en vapor y reaparece detrás |
| 16 | **AMS** | *'Am. sulfuriphilus'* | pH 3–7 (el más tolerante); fija N₂; ATP sintasa variante; rama basal | Técnico "balance" (Faust) | **Nitrogenase Nova**: rayo de energía N₂→NH₃; "Buffer" que neutraliza proyectiles ácidos |
| 17 | **TTP** | *T. tepidarius* DSM 3134 | Neutrófilo, 40–45 °C, Baños Romanos de Bath; única con oxidasa *cbb₃* | Jefe / outgroup (Justice) | **Roman Bath Steam**: puños de vapor a presión; súper "cbb₃ Overload" |

Humanización (estilo Guilty Gear): cuerpo de bacilo (cápsula alargada) con brazos y piernas musculosas, cara con ojos y boca expresivos, flagelo polar como cola-látigo (y en los hierro-oxidantes como "melena"), pili como pelo, membrana con brillo cel-shading y contornos gruesos. Cada clado tiene silueta distinta: los dual (naranjas) son robustos con grietas de óxido; los azufre (azules) son delgados y angulosos con cristales de S⁰ en hombros; *Igneacidithiobacillus* (rojos) tienen vetas incandescentes; AMS lleva "vendas" moradas y TTP es un gigante gris con capa de vapor.

---

## 2. Escenarios (20, elegidos al azar antes de cada combate)

Cada fondo muestra un cartel con **lugar, pH y temperatura** (los de Copahue salen de las mediciones reales de `copahue-v8/data/data.js`).

| # | Escenario | Lugar | pH | T (°C) |
|---|---|---|---|---|
| 1 | Laguna del cráter | Volcán Copahue, Neuquén (AR) | 0,84 | 45,6 |
| 2 | Vertiente del Agrio 2 (caliente) | Copahue | 2,2 | 45,5 |
| 3 | Vertiente del Agrio 1 | Copahue | 1,8 | 28,4 |
| 4 | Río Agrio Superior | Copahue–Caviahue | 2,6 | 10,1 |
| 5 | Cascada de la Culebra | Río Agrio | 2,6 | 11,7 |
| 6 | Lago Caviahue, brazo norte | Caviahue | 3,1 | 17,2 |
| 7 | Salto del Agrio | Neuquén | 3,6 | 14,7 |
| 8 | Campo de solfataras Chancho-Có | Copahue | 7,0 | 38,9 |
| 9 | Río Tinto | Huelva, España | 2,3 | 20 |
| 10 | Richmond Mine, Iron Mountain | California, EE.UU. | −3,6 a 1 | 40 |
| 11 | Laguna ácida hidrotermal (Norris) | Yellowstone, EE.UU. | 2,5 | 70 |
| 12 | Fumarolas de Vulcano | Islas Eolias, Italia | 2,0 | 60 |
| 13 | Soufrière Hills | Montserrat, Caribe | 2,5 | 35 |
| 14 | Baños Romanos | Bath, Reino Unido | 7,0 | 45 |
| 15 | Pila de biolixiviación | Minera Escondida, Atacama (CL) | 1,6 | 35 |
| 16 | Biopila boreal | Talvivaara/Terrafame, Finlandia | 2,0 | 90 (núcleo) / −20 (aire) |
| 17 | Reactor de tanque agitado (BIOX) | Planta de biooxidación | 1,5 | 45 |
| 18 | Alcantarilla de hormigón corroído | Red cloacal urbana | 1,0 | 25 |
| 19 | Mina de Parys Mountain | Anglesey, Gales | 2,2 | 10 |
| 20 | Laboratorio de acidófilos | Fundación Ciencia & Vida, Santiago (CL) | 2,0 (medio) | 30 (incubadora) |

Cada fondo tiene 3 capas de parallax dibujadas en código (canvas): cielo/techo, lejano (volcán, chimeneas, estanterías) y primer plano (orilla, pasarela, mesón). Partículas: vapor, burbujas, lluvia ácida, ceniza, escarcha, según escenario.

---

## 3. Mecánicas

- Flujo: Título → Selección de personaje (grilla 17 retratos, estilo GG con nombre, clado y "ficha científica") → Selección de escenario al azar → Combate.
- Combate: **3 rounds, 2:00 cada uno**, gana el mejor de 3. Sin modos extra.
- Controles P1: WASD mover, J/K/L golpe ligero/medio/fuerte, I patada, U especial, O Overdrive. P2: flechas + numpad 1/2/3, 4, 5, 6. Gamepad soportado (Xbox/PS). Comandos tipo "cuarto de círculo + botón".
- Sistemas GG traducidos: medidor **Tension** = "Gradiente de protones" (se llena al atacar/acercarse); **Roman Cancel** = "Lysis Cancel" (50 % del medidor, cancela cualquier golpe); **Burst** = "Burst de biofilm" (1 por round, empuja al rival); **Overdrive** = poder especial (100 % del medidor); Instant Kill no (demasiado para 2 min).
- Hitboxes/hurtboxes rectangulares por frame, frame data (startup/active/recovery) por golpe, combos con cancels ligero→medio→fuerte→especial, juggles aéreos.
- CPU: máquina de estados con 3 niveles (reacciona a distancia, bloquea con probabilidad, usa combos preparados).

---

## 4. Música y sonido

Guilty Gear = rock/metal. No se usan canciones ajenas: toda la música se genera en el navegador con **Web Audio API** (sintetizadores). Un motor de "metal procedural": riffs de guitarra (sawtooth + distorsión waveshaper + cabinet IR sintética), bajo, batería con doble bombo (ruido filtrado + osciladores), pads. Cada escenario tiene tonalidad, tempo (160–200 bpm) y progresión propia; el tema de selección de personaje es más limpio y el de victoria más épico. Los 17 personajes tienen un "lick" propio que suena al elegirlos. Efectos de golpes, bloqueos y poderes también sintetizados (sin archivos). Si más adelante quieren canciones propias (como en Copahue FM), se agrega una carpeta `music/` y una lista `TRACKS` igual que en `copahue-v8/js/radio.js`.

---

## 5. Multijugador por red: sí, es posible

**Respuesta corta:** sí. El juego corre en GitHub Pages y dos personas pueden pelear en tiempo real, en LAN o por Internet. Se usará **lockstep determinista con retraso de entrada**, el mismo principio de los fighting games clásicos online:

1. El juego es 100 % determinista: paso fijo de 60 Hz, aleatoriedad con semilla compartida, nada depende del reloj de la máquina.
2. Cada jugador envía sólo sus **inputs** (unos pocos bytes por frame), no posiciones. Ambos navegadores simulan la misma pelea.
3. Se aplica un retraso de 2–3 frames (33–50 ms) para esconder la latencia. En LAN (1–5 ms) es imperceptible; en Internet dentro de Chile queda jugable (ping < 60 ms). Si el ping es alto el retraso sube solo.

Dos formas de conectar, ambas incluidas:

- **Modo A — sin servidor (WebRTC P2P)**: el navegador de P1 crea una sala y muestra un código de 4 letras; P2 lo escribe y se conectan directo (DataChannel UDP-like). El "señalizador" para intercambiar direcciones es el servidor público gratuito de PeerJS, así que funciona desde GitHub Pages sin instalar nada. En la misma LAN la conexión es directa. Por Internet funciona en la mayoría de los routers (STUN); si uno de los dos está detrás de un NAT muy cerrado, falla y hay que usar el modo B.
- **Modo B — con tu Ubuntu de servidor (WebSocket)**: un servidor Node.js de ~150 líneas (`server/server.js`, `ws`) que crea salas y reenvía los inputs entre los dos clientes. En la LAN: `node server.js` y en el juego se escribe `ws://IP-del-ubuntu:8787`. Por Internet: abrir el puerto 8787 en el router, o más fácil, usar Tailscale/ZeroTier (los dos computadores quedan en una "LAN virtual") o un túnel Cloudflare gratis que además da `wss://` (necesario porque GitHub Pages es HTTPS y no deja abrir `ws://` sin cifrar hacia Internet; en LAN sí se permite abriendo el juego por `http://`). Este servidor también puede servir el juego mismo (`http://IP:8787/`), con lo que en LAN no se necesita ni GitHub.

Recomendación: partir con A (cero infraestructura) y dejar B listo en la carpeta `server/` para la LAN del laboratorio.

---

## 6. Arquitectura y archivos

Sin frameworks ni compilación: HTML + JavaScript (ES modules) + Canvas 2D, igual que copahue-v8, así GitHub Pages lo sirve tal cual.

```
acidgear/
├── index.html            pantalla única (título, select, pelea)
├── css/style.css
├── js/
│   ├── main.js           bucle, estados (title/select/fight/result)
│   ├── engine/           physics.js, input.js, hitbox.js, rng.js (determinista)
│   ├── fighters/         roster.js (17 fichas), moves.js (frame data), draw.js (dibujo vectorial + esqueleto)
│   ├── stages/           stages.js (20 fondos, pH, T), particles.js
│   ├── audio/            synth.js, music.js (metal procedural), sfx.js
│   ├── net/              lockstep.js, peer.js (WebRTC), socket.js (WebSocket)
│   └── ai/cpu.js
├── server/server.js      servidor Node opcional (Ubuntu)
├── server/package.json
├── tools/serve.py        servidor local para probar (como en copahue-v8)
├── LEEME.md / README.md
└── PLAN.md               este documento
```

---

## 7. Etapas de trabajo

1. Motor base: bucle fijo 60 Hz, input, físicas, hitboxes, 1 personaje de prueba, HUD de vida/tiempo/rounds. 
2. Roster completo: 17 esqueletos vectoriales, animaciones (idle, caminar, saltar, 3 golpes, patada, bloqueo, daño, KO), especial y Overdrive de cada uno.
3. 20 escenarios con parallax, partículas y cartel de pH/temperatura.
4. Pantallas: título, selección de personaje, VS, resultado.
5. Audio: sintetizador de metal, temas por escenario, SFX.
6. CPU.
7. Red: lockstep + WebRTC (A) + WebSocket (B) + lobby con código de sala.
8. Pruebas (determinismo entre dos pestañas, latencia simulada), LEEME, publicación en GitHub Pages.

Entregas intermedias: después de 1–2 ya se puede jugar local; después de 7 online.
