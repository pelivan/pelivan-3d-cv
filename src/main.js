import * as THREE from 'three';
import { CV } from './cv-data.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { Hand } from './hand.js';
import { Apples } from './apple.js';
import { CanRange } from './cans.js';
import { Hud } from './hud.js';
import { Sfx } from './audio.js';
import { downloadCvPdf } from './pdf.js';

const MAX_APPLES = 8;

// Signs are painted onto canvases, so the display fonts must be loaded before
// the world is built. Cap the wait so a slow font CDN can't block the game.
const fontsReady = Promise.race([
  Promise.all([
    document.fonts.load("52px 'Fredoka'"),
    document.fonts.load("24px 'Caveat'"),
    document.fonts.load("24px 'Nunito'"),
  ]).then(() => document.fonts.ready),
  new Promise((r) => setTimeout(r, 2500)),
]);

fontsReady.then(boot);

function boot() {
  // ---------- renderer / scene ----------
  const app = document.getElementById('app');
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.classList.add('webgl');
  app.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 400);
  scene.add(camera);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---------- world / systems ----------
  const sfx = new Sfx();
  const world = buildWorld(scene);
  const player = new Player(camera, renderer.domElement, world.colliders, sfx);
  const hand = new Hand(camera);
  const apples = new Apples(scene);
  const cans = new CanRange(scene, world.canLine);
  const hud = new Hud();

  // ---------- game state ----------
  const state = {
    phase: 'welcome', // welcome -> playing -> ended
    startTime: 0,
    endTime: 0,
    signsSeen: new Set(),
    rangeCleared: false,
    doorUnlocked: false,
    ended: false,
    apples: MAX_APPLES,
    thrown: 0,
    score: 0,
    goldenFound: 0,
    // car easter egg
    carryingOil: false,
    oilPoured: false,
    eggDone: false,
  };

  const SIGN_SPOTS = [
    { id: 0, x: -6.5, z: 22, label: 'About Ivan' },
    { id: 1, x: 6.5, z: 24, label: 'This Place' },
    { id: 2, x: 6.5, z: 13, label: 'My Story' },
    { id: 3, x: -6.5, z: 6, label: 'What I tinker with' },
  ];
  const GOLDEN_TOTAL = world.goldenApples.length;
  const RANGE_SPOT = { x: -10, z: -12 };
  const DOOR_SPOT = world.door.worldPos;
  const car = world.car;
  const oilWorld = world.oilBucket.userData.worldPos;

  hud.setApples(state.apples);

  // ---------- welcome typewriter ----------
  const welcomeEl = document.getElementById('welcome');
  const welcomeText = document.getElementById('welcome-text');
  const welcomeEnter = document.getElementById('welcome-enter');
  document.getElementById('welcome-title').textContent = CV.welcome.title;
  document.getElementById('welcome-sub').textContent = CV.welcome.subtitle;

  const fullText = CV.welcome.lines.join('\n');
  let typed = 0;
  let typeDone = false;
  const cursor = '<span class="cursor">&nbsp;</span>';
  const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function typeStep() {
    if (typeDone) return;
    typed = Math.min(fullText.length, typed + 1 + (Math.random() < 0.3 ? 1 : 0));
    welcomeText.innerHTML = escapeHtml(fullText.slice(0, typed)) + cursor;
    if (typed >= fullText.length) {
      typeDone = true;
      welcomeEnter.classList.add('ready');
    } else {
      setTimeout(typeStep, 12 + Math.random() * 22);
    }
  }
  setTimeout(typeStep, 500);

  welcomeEl.addEventListener('click', () => {
    if (!typeDone) {
      typed = fullText.length;
      typeDone = true;
      welcomeText.innerHTML = escapeHtml(fullText) + cursor;
      welcomeEnter.classList.add('ready');
      return;
    }
    startGame();
  });

  // ---------- pause ----------
  const pauseEl = document.getElementById('pause');
  pauseEl.addEventListener('click', () => {
    if (state.phase === 'playing' && !state.ended) lockPointer();
  });
  function lockPointer() { renderer.domElement.requestPointerLock(); }

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === renderer.domElement;
    player.enabled = locked && state.phase === 'playing';
    if (state.phase !== 'playing' || state.ended) return;
    pauseEl.classList.toggle('hidden', locked);
  });

  // ---------- start ----------
  function startGame() {
    sfx.ensure();
    welcomeEl.classList.add('hidden');
    state.phase = 'playing';
    state.startTime = performance.now();
    hud.show();
    hud.setApples(state.apples);
    hud.addObjective('signs', `Read the story signs (0/${SIGN_SPOTS.length})`);
    hud.addObjective('range', `Knock the tin cans off the rail (0/${cans.cans.length})`);
    hud.addObjective('golden', `Find the hidden golden apples (0/${GOLDEN_TOTAL})`);
    hud.toast('WELCOME', 'Wander, read, and toss some apples');
    sfx.objective();
    lockPointer();
  }

  // ---------- throwing ----------
  function beginThrow() {
    if (state.phase !== 'playing' || !player.enabled) return;
    hand.startCharge();
  }
  function endThrow() {
    if (state.phase !== 'playing' || !player.enabled) return;
    const result = hand.release(camera);
    if (!result) return;
    const origin = new THREE.Vector3();
    camera.getWorldPosition(origin);
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    origin.addScaledVector(fwd, 0.5).add(new THREE.Vector3(0, -0.08, 0));
    apples.spawn(origin, result.velocity);
    state.apples = Math.max(0, state.apples - 1);
    state.thrown++;
    hud.setApples(state.apples);
    sfx.throwWhoosh(result.power);
  }

  document.addEventListener('mousedown', (e) => { if (e.button === 0) beginThrow(); });
  document.addEventListener('mouseup', (e) => { if (e.button === 0) endThrow(); });

  document.addEventListener('keydown', (e) => {
    if (state.phase !== 'playing' || !player.enabled) return;
    if (e.code === 'KeyF') tryInteract();
  });

  // apple hits a can
  apples.onCanHit = (can) => {
    const fromDir = can.hitCenter.clone().sub(new THREE.Vector3(player.position.x, can.hitCenter.y, player.position.z));
    cans.knock(can, fromDir);
    sfx.canClatter();
    hud.flashHitmarker();
  };
  cans.onHit = (index, achievement, remaining) => {
    sfx.chime();
    state.score += 150;
    hud.toast('A LITTLE STORY', achievement, 3.8);
    hud.updateObjectiveText('range', `Knock the tin cans off the rail (${cans.hitCount}/${cans.cans.length})`);
  };
  cans.onAllDown = () => {
    state.rangeCleared = true;
    state.score += 400; // clean sweep bonus
    hud.completeObjective('range');
    setTimeout(tryUnlockDoor, 1100);
  };

  // the cabin only opens once the visitor has read every sign AND cleared the
  // cans — so they actually see the CV before grabbing the PDF.
  function tryUnlockDoor() {
    if (state.doorUnlocked) return;
    if (state.signsSeen.size < SIGN_SPOTS.length || !state.rangeCleared) return;
    state.doorUnlocked = true;
    world.door.locked = false;
    hud.addObjective('door', 'Head to the cabin for your CV');
    hud.toast('THE CABIN IS OPEN', 'You’ve seen it all — come grab your CV');
    sfx.objective();
  }

  // ---------- interaction ----------
  function distXZ(x, z) { return Math.hypot(player.position.x - x, player.position.z - z); }

  // builds the list of currently-available interactions, nearest-first
  function interactions() {
    const list = [];
    // cabin door
    const dCabin = distXZ(DOOR_SPOT.x, DOOR_SPOT.z);
    if (!world.door.open && dCabin < 2.8) {
      const needSigns = state.signsSeen.size < SIGN_SPOTS.length;
      const needCans = !state.rangeCleared;
      let lockedMsg;
      if (needSigns && needCans) lockedMsg = 'Read all the signs and knock the cans down first';
      else if (needSigns) lockedMsg = `Read all the story signs first (${state.signsSeen.size}/${SIGN_SPOTS.length})`;
      else lockedMsg = 'Knock all the cans down first';
      list.push({
        d: dCabin,
        prompt: world.door.locked ? lockedMsg : 'Press <b>F</b> to step inside',
        enabled: !world.door.locked,
        run: () => { world.door.openNow(); sfx.doorCreak(); },
      });
    }
    // oil bucket pickup
    if (!state.carryingOil && !state.oilPoured) {
      const dOil = distXZ(oilWorld.x, oilWorld.z);
      if (dOil < 2.2) {
        list.push({
          d: dOil, enabled: true, prompt: 'Press <b>F</b> to pick up the oil can',
          run: () => {
            state.carryingOil = true;
            world.oilBucket.visible = false;
            hand.setMode('bucket');
            sfx.pickup();
            hud.toast('GREASY HANDS', 'Picked up the oil — pop the hood', 2.6);
          },
        });
      }
    }
    // car door
    const cd = car.state.doorAnchor;
    const dCarDoor = distXZ(cd.x, cd.z);
    if (!car.state.door.open && dCarDoor < 2.4) {
      list.push({
        d: dCarDoor, enabled: true, prompt: 'Press <b>F</b> to open the car door',
        run: () => { car.openDoor(); sfx.carDoor(); hud.toast('CREEEAK', 'An old car in the driveway…', 2.2); },
      });
    }
    // car hood + pour
    const fa = car.state.frontAnchor;
    const dFront = distXZ(fa.x, fa.z);
    if (dFront < 2.6) {
      if (!car.state.hood.open) {
        list.push({
          d: dFront, enabled: true, prompt: 'Press <b>F</b> to lift the hood',
          run: () => { car.openHood(); sfx.hood(); hud.toast('UNDER THE HOOD', 'Looks low on oil…', 2.4); },
        });
      } else if (state.carryingOil && !state.oilPoured) {
        list.push({
          d: dFront, enabled: true, prompt: 'Press <b>F</b> to pour the oil in',
          run: pourOil,
        });
      }
    }
    list.sort((a, b) => a.d - b.d);
    return list;
  }

  function pourOil() {
    state.carryingOil = false;
    hand.setMode('apple');
    sfx.oilGlug();
    hud.toast('GLUG GLUG GLUG', 'Topping her up…', 1.6);
    setTimeout(() => {
      car.startEngine();
      sfx.engineStart();
      state.oilPoured = true;
      state.eggDone = true;
      state.score += 600;
      hud.toast('🔧 EASTER EGG', 'You got the old car running! (+600)', 4.2);
    }, 1100);
  }

  function tryInteract() {
    const list = interactions();
    const top = list.find((i) => i.enabled) || list[0];
    if (top && top.enabled) top.run();
  }

  function checkProximity() {
    // signs
    for (const s of SIGN_SPOTS) {
      if (!state.signsSeen.has(s.id) && distXZ(s.x, s.z) < 5) {
        state.signsSeen.add(s.id);
        hud.toast('YOU READ A SIGN', s.label, 2.2);
        hud.updateObjectiveText('signs', `Read the story signs (${state.signsSeen.size}/${SIGN_SPOTS.length})`);
        if (state.signsSeen.size === SIGN_SPOTS.length) {
          hud.completeObjective('signs');
          sfx.objective();
          tryUnlockDoor();
        }
      }
    }

    // golden apples
    for (const g of world.goldenApples) {
      if (!g.collected && distXZ(g.x, g.z) < 1.6) {
        g.collected = true;
        g.mesh.visible = false;
        state.goldenFound++;
        state.score += 250;
        sfx.pickup();
        sfx.chime();
        hud.updateObjectiveText('golden', `Find the hidden golden apples (${state.goldenFound}/${GOLDEN_TOTAL})`);
        if (state.goldenFound === GOLDEN_TOTAL) {
          hud.completeObjective('golden');
          state.score += 500;
          hud.toast('GOLDEN HARVEST', 'You found every golden apple!', 3.2);
          sfx.objective();
        } else {
          hud.toast('✨ GOLDEN APPLE', `${state.goldenFound} of ${GOLDEN_TOTAL} found`, 2.2);
        }
      }
    }

    // basket refill
    for (const b of world.basketSpots) {
      if (distXZ(b.x, b.z) < 2.3 && state.apples < MAX_APPLES) {
        const was = state.apples;
        state.apples = MAX_APPLES;
        hud.setApples(state.apples);
        if (was === 0) hand.refill();
        sfx.pickup();
        hud.toast('FRESH APPLES', 'Basket topped up', 1.6);
        break;
      }
    }

    // context prompt
    const list = interactions();
    if (state.phase === 'playing' && list.length) {
      hud.setPrompt(list[0].prompt);
    } else {
      hud.setPrompt(null);
    }

    // end trigger
    const t = world.endTrigger;
    if (
      !state.ended && world.door.open &&
      player.position.x > t.minX && player.position.x < t.maxX &&
      player.position.z > t.minZ && player.position.z < t.maxZ
    ) {
      endMission();
    }
  }

  // ---------- ending ----------
  const fadeEl = document.getElementById('fade');
  const debriefEl = document.getElementById('debrief');

  function endMission() {
    state.ended = true;
    state.endTime = performance.now();
    fadeEl.classList.add('in');
    sfx.fanfare();
    setTimeout(() => {
      state.phase = 'ended';
      player.enabled = false;
      document.exitPointerLock();
      hud.hide();
      pauseEl.classList.add('hidden');

      const seconds = Math.round((state.endTime - state.startTime) / 1000);
      const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
      const ss = String(seconds % 60).padStart(2, '0');
      const acc = state.thrown ? Math.round((cans.hitCount / state.thrown) * 100) : 0;
      // time bonus: faster visits score a little higher (down to a floor)
      const timeBonus = Math.max(0, 600 - seconds * 2);
      state.score += timeBonus;
      document.getElementById('stat-score').textContent = state.score.toLocaleString();
      document.getElementById('stat-time').textContent = `${mm}:${ss}`;
      document.getElementById('stat-accuracy').textContent = `${acc}%`;
      document.getElementById('stat-targets').textContent = `${cans.hitCount}/${cans.cans.length}`;
      document.getElementById('stat-golden').textContent = `${state.goldenFound}/${GOLDEN_TOTAL}`;

      const list = document.getElementById('debrief-list');
      list.innerHTML = '';
      for (const a of CV.achievements) {
        const li = document.createElement('li');
        li.textContent = a;
        list.appendChild(li);
      }

      const egg = document.getElementById('egg-note');
      if (state.eggDone) {
        egg.textContent = '🔧 ' + CV.easterEgg;
        egg.classList.add('show');
      }

      debriefEl.classList.add('shown');
      fadeEl.classList.remove('in');
    }, 1200);
  }

  document.getElementById('btn-download').addEventListener('click', downloadCvPdf);
  document.getElementById('btn-replay').addEventListener('click', () => location.reload());

  // ---------- compass markers ----------
  function compassMarkers() {
    const markers = [];
    const add = (x, z, color) => {
      markers.push({ angle: Math.atan2(x - player.position.x, -(z - player.position.z)), color });
    };
    if (state.signsSeen.size < SIGN_SPOTS.length) {
      for (const s of SIGN_SPOTS) if (!state.signsSeen.has(s.id)) add(s.x, s.z, '#4e8a3a');
    }
    if (!state.rangeCleared) add(RANGE_SPOT.x, RANGE_SPOT.z, '#c2402f');
    if (state.doorUnlocked && !state.ended) add(DOOR_SPOT.x, DOOR_SPOT.z, '#e6a93c');
    return markers;
  }

  // ---------- debug params ----------
  const params = new URLSearchParams(location.search);
  const pose = params.get('pose');
  if (pose) {
    const [px, pz, pyaw] = pose.split(',').map(Number);
    welcomeEl.style.display = 'none';
    state.phase = 'playing';
    state.startTime = performance.now();
    hud.show();
    hud.setApples(state.apples);
    hud.addObjective('signs', `Read the story signs (0/${SIGN_SPOTS.length})`);
    hud.addObjective('range', `Knock the tin cans off the rail (0/${cans.cans.length})`);
    player.position.set(px, 1.7, pz);
    player.yaw = pyaw || 0;
    player.enabled = true;
    if (params.get('door')) { world.door.locked = false; world.door.openNow(); }
    if (params.get('egg')) {
      car.openDoor(); car.openHood(); car.startEngine();
      state.oilPoured = true; state.eggDone = true;
    }
    if (params.get('apples')) { state.apples = +params.get('apples'); hud.setApples(state.apples); }
    if (params.get('simthrow')) {
      // deterministic physics check: aim at a can and step with fixed dt,
      // independent of the rAF clock (which is unreliable under headless).
      const target = cans.cans[2].hitCenter.clone();
      const origin = new THREE.Vector3(player.position.x, player.position.y, player.position.z);
      const t = 0.5;
      const v = target.clone().sub(origin).multiplyScalar(1 / t);
      v.y += 0.5 * 16 * t;
      apples.spawn(origin, v);
      const fixed = 1 / 60;
      for (let i = 0; i < 90 && cans.hitCount === 0; i++) apples.update(fixed, cans);
      document.title = `SIM hit=${cans.hitCount}/${cans.cans.length}`;
    }
    if (params.get('end')) { if (params.get('egg')) state.eggDone = true; endMission(); }
  }

  // ---------- main loop ----------
  const clock = new THREE.Clock();

  function animateGolden(dt) {
    for (const g of world.goldenApples) {
      if (g.collected) continue;
      g.mesh.rotation.y += dt * 1.6;
      g.mesh.position.y = g.baseY + Math.sin(performance.now() * 0.002 + g.x) * 0.12;
    }
  }

  function tick() {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, clock.getDelta());

    world.updateChickens(dt);
    animateGolden(dt);

    if (state.phase === 'playing') {
      player.update(dt);
      // top the held apple back up between throws
      if (!hand.hasApple && state.apples > 0 && hand.cooldown <= 0 && hand.throwAnim === 0 && !state.carryingOil) {
        hand.refill();
      }
      hand.update(dt, player.bobAmount);
      apples.update(dt, cans);
      cans.update(dt);
      car.update(dt);
      world.door.update(dt);
      checkProximity();
      hud.updateToasts(dt);
      hud.drawCompass(player.yaw, compassMarkers());
      hud.drawCharge(hand.charging ? hand.power : null);
    } else {
      camera.position.set(Math.sin(performance.now() * 0.0001) * 2, 3.4, 33);
      camera.lookAt(0, 1.6, -6);
      cans.update(dt);
      car.update(dt);
      world.door.update(dt);
    }

    renderer.render(scene, camera);
  }
  tick();
}
