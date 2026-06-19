# pelivan3d — Ivan's Orchard

An interactive CV you can walk around, built with Three.js. You arrive at
**Pelivan Orchard**, read hand-painted story signs along the path, grab apples
from the baskets and lob them at a row of tin cans — each can you knock off
shares a little story about Ivan. When the cans are down, the cabin door opens
and you can take the CV home as a PDF.

A rope **throwing line** keeps you back from the cans, so you have to judge the
arc. Six **golden apples** are hidden around the grounds to hunt down, chickens
wander the lawn, and everything you do feeds a **score** on the farewell card.

There's also a car in the driveway that needs a hand — a little easter egg.

Everything is generated at runtime — procedural canvas textures, WebAudio
synthesized sounds (birdsong, breeze, throws, clatter, an engine that turns
over), and a jsPDF CV. No binary assets.

## Run

```sh
npm install
npm run dev        # local dev server
npm run build      # production build into dist/ (static, host anywhere)
npm run preview    # serve the production build locally
```

Node 16+ (Vite is pinned to v4 for Node 16 compatibility).

## Edit the CV

All content lives in **`src/cv-data.js`** — name, contacts, summary, story,
skills, the per-can achievements, education, the welcome note and the
easter-egg reward text. The signs, the toasts, the farewell screen and the PDF
all regenerate from it.

## Controls

| Input | Action |
| --- | --- |
| WASD | move |
| Mouse | look |
| Hold LMB | wind up a throw; **release** to lob the apple |
| F | interact (cabin door, car door/hood, pick up & pour oil) |
| Shift | jog |
| Space | hop |
| Esc | pause |

Walk into an apple basket to refill. Aim with the centre dot; the ring shows
your throw power.

## The visit, start to finish

1. Welcome note (handwritten, typed out) → click to step into the orchard.
2. Walk the path past four story signs — getting close marks them read.
3. Grab apples and knock all six tin cans off the fence rail — from behind the
   throwing line, so you have to lob them. Each can reveals an achievement.
4. Hunt down the six hidden golden apples scattered around the grounds (bonus).
5. Once you've read **all** the story signs **and** cleared the rail, the cabin
   opens. Press **F** at the door and walk in → score + visit stats +
   **Download CV (PDF)**. (The door tells you what's still missing if you try early.)

Scoring: 150 per can (+400 clean sweep), 250 per golden apple (+500 for all
six), 600 for the car easter egg, plus a small speed bonus.

### Easter egg — the car

Wander to the driveway on the east side:
1. Press **F** to open the driver door (optional flavour).
2. Press **F** at the front to lift the hood.
3. Pick up the **oil can** next to the car (**F**).
4. Back at the open hood, press **F** to pour it in — the engine turns over,
   the headlights come on, and you unlock a note on the farewell screen.

## Debug query params

- `?pose=x,z,yaw` — skip the welcome and spawn at a position (no pointer lock)
- `&apples=N` — set the apple count
- `&simthrow=1` — deterministically lob an apple at a can and report the hit in the page title
- `&door=1` — unlock & open the cabin door
- `&egg=1` — fast-forward the car easter egg (door + hood open, engine running)
- `&end=1` — jump straight to the farewell screen (combine with `&egg=1` to show the egg note)

Example: `http://localhost:5173/?pose=-9.5,-19,0&simthrow=1`

## Code map

| File | What |
| --- | --- |
| `src/main.js` | bootstrapping, game state, objectives, car easter-egg flow, ending |
| `src/cv-data.js` | **all CV content** |
| `src/world.js` | orchard, trees, signs, driveway, cabin + door, car placement |
| `src/car.js` | the car (openable door/hood, engine, lights) + oil bucket |
| `src/player.js` | first-person controller (pointer lock, AABB collision, head bob) |
| `src/hand.js` | hand viewmodel, charge-and-throw, holds apple or oil bucket |
| `src/apple.js` | thrown-apple projectiles (gravity, collision, splats) |
| `src/cans.js` | tin cans on the rail, knockdown physics, achievement reveal |
| `src/boards.js` | canvas-painted story signs |
| `src/hud.js` | compass, objectives, toasts, apple count, throw-charge ring |
| `src/audio.js` | synthesized sound effects + ambience |
| `src/pdf.js` | jsPDF CV generator |
| `src/textures.js` | procedural textures |
