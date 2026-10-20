# ACID GEAR: XTREME LITHO-STRIKE

A Guilty Gear-style 2D fighting game where the fighters are the 17 taxa of the class *Acidithiobacillia* (Fig. 3A of Moya-Beltrán et al. 2021, *ISME J* 15:3221–3238). Pure HTML + JavaScript + Canvas, no build step: runs on GitHub Pages. 1P vs CPU, 2P on one keyboard, and 2P online (serverless WebRTC rooms, or an optional WebSocket relay server for LAN play).

- 17 humanized bacilli with faces, flagella and special moves derived from their real physiology (iron/sulfur oxidation, psychrotolerance, N₂ fixation, geothermal origin…).
- 20 extremophile arenas (Copahue crater lake, Río Tinto, Richmond Mine, Yellowstone, bioleaching heaps, a BIOX reactor, a corroded sewer…) each labelled with place, pH and temperature. Copahue values come from real field measurements.
- Procedural metal soundtrack synthesized with the Web Audio API.
- Deterministic 60 Hz engine + input-delay lockstep netcode.

Run locally: `python3 tools/serve.py` → http://localhost:8000. Full instructions (Spanish) in `LEEME.md`.
