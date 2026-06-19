// A little parked car built from primitives, with an openable driver door and
// hood, an engine bay, headlights, and a fill point for the oil easter egg.
import * as THREE from 'three';
import { metalTexture } from './textures.js';

export function buildCar(scene, origin, facingYaw = 0) {
  const car = new THREE.Group();
  car.position.copy(origin);
  car.rotation.y = facingYaw;
  scene.add(car);

  const BODY_COLOR = 0x4a8fb0;
  const paint = new THREE.MeshStandardMaterial({ color: BODY_COLOR, roughness: 0.35, metalness: 0.5 });
  const darkPaint = new THREE.MeshStandardMaterial({ color: 0x2c5468, roughness: 0.4, metalness: 0.5 });
  const chrome = new THREE.MeshStandardMaterial({ map: metalTexture('#cdd2d6'), roughness: 0.25, metalness: 0.85 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fc4d6, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.55 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.9 });
  const engineMat = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.6, metalness: 0.5 });

  // dimensions (car points along -Z, hood at front = -Z)
  const W = 1.9, L = 4.2, H = 0.7;
  const wheelR = 0.38;
  const bodyY = wheelR + 0.15;

  // lower body
  const lower = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), paint);
  lower.position.y = bodyY + H / 2;
  lower.castShadow = true;
  lower.receiveShadow = true;
  car.add(lower);

  // cabin (greenhouse), set back toward +Z
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(W - 0.18, 0.62, L * 0.42), paint);
  cabin.position.set(0, bodyY + H + 0.31, 0.35);
  cabin.castShadow = true;
  car.add(cabin);
  // windows
  const winFront = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.34, 0.5), glass);
  winFront.position.set(0, bodyY + H + 0.33, 0.35 - L * 0.21 - 0.01);
  winFront.rotation.y = Math.PI;
  car.add(winFront);
  const winBack = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.34, 0.5), glass);
  winBack.position.set(0, bodyY + H + 0.33, 0.35 + L * 0.21 + 0.01);
  car.add(winBack);
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.4, 0.46), glass);
    side.position.set(sx * (W / 2 - 0.08), bodyY + H + 0.33, 0.35);
    side.rotation.y = sx * Math.PI / 2;
    car.add(side);
  }

  // hood (front, -Z) on a pivot at its rear edge so it lifts up
  const hoodLen = L * 0.28;
  const hoodFrontZ = -L / 2;
  const hoodRearZ = hoodFrontZ + hoodLen;
  const hoodPivot = new THREE.Group();
  hoodPivot.position.set(0, bodyY + H, hoodRearZ);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(W - 0.06, 0.08, hoodLen), paint);
  hood.position.set(0, 0.04, -hoodLen / 2);
  hood.castShadow = true;
  hoodPivot.add(hood);
  car.add(hoodPivot);

  // engine bay (revealed when hood is up): a block with parts
  const bay = new THREE.Group();
  bay.position.set(0, bodyY + H - 0.18, hoodFrontZ + hoodLen / 2);
  const block = new THREE.Mesh(new THREE.BoxGeometry(W - 0.3, 0.34, hoodLen - 0.1), engineMat);
  block.position.y = 0.17;
  bay.add(block);
  // a few pipes/caps
  for (const [ex, ez] of [[-0.3, -0.1], [0.3, -0.1], [0, 0.15]]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), chrome);
    cap.position.set(ex, 0.4, ez);
    bay.add(cap);
  }
  // the oil fill cap — bright yellow so it reads as the target
  const fillCap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10), new THREE.MeshStandardMaterial({ color: 0xe6a93c, roughness: 0.5, emissive: 0x000000 }));
  fillCap.position.set(0.4, 0.44, 0.1);
  bay.add(fillCap);
  bay.visible = false; // only meaningful with the hood up
  car.add(bay);

  // grille + bumpers + headlights
  const grille = new THREE.Mesh(new THREE.BoxGeometry(W - 0.5, 0.3, 0.06), chrome);
  grille.position.set(0, bodyY + 0.3, -L / 2 - 0.01);
  car.add(grille);
  const headlights = [];
  for (const sx of [-1, 1]) {
    const hl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.06, 14),
      new THREE.MeshStandardMaterial({ color: 0xfff4d0, roughness: 0.3, emissive: 0x000000, emissiveIntensity: 0 })
    );
    hl.rotation.x = Math.PI / 2;
    hl.position.set(sx * (W / 2 - 0.32), bodyY + 0.42, -L / 2 - 0.02);
    car.add(hl);
    headlights.push(hl.material);
    const beam = new THREE.SpotLight(0xfff0c8, 0, 18, Math.PI / 7, 0.5, 1.2);
    beam.position.set(sx * (W / 2 - 0.32), bodyY + 0.42, -L / 2 - 0.05);
    beam.target.position.set(sx * (W / 2 - 0.32), bodyY, -L / 2 - 8);
    car.add(beam, beam.target);
    headlights.push(beam);
  }
  for (const bz of [-L / 2 - 0.04, L / 2 + 0.04]) {
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.16, 0.12), chrome);
    bumper.position.set(0, bodyY + 0.08, bz);
    car.add(bumper);
  }

  // wheels
  const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.3, 18);
  const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.32, 10);
  const wheels = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const wheel = new THREE.Group();
      const tyre = new THREE.Mesh(wheelGeo, rubber);
      tyre.rotation.z = Math.PI / 2;
      const hub = new THREE.Mesh(hubGeo, chrome);
      hub.rotation.z = Math.PI / 2;
      wheel.add(tyre, hub);
      wheel.position.set(sx * (W / 2 - 0.02), wheelR, sz * (L / 2 - 0.85));
      wheel.castShadow = true;
      car.add(wheel);
      wheels.push(wheel);
    }
  }

  // driver door (left side, -X) on a pivot at its front edge so it swings open
  const doorPivot = new THREE.Group();
  const doorH = H + 0.5;
  const doorL = L * 0.34;
  doorPivot.position.set(-W / 2, bodyY + 0.05, doorL / 2 + 0.1);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, doorH, doorL), darkPaint);
  door.position.set(-0.03, doorH / 2 - 0.05, -doorL / 2);
  door.castShadow = true;
  doorPivot.add(door);
  const doorWin = new THREE.Mesh(new THREE.PlaneGeometry(doorL - 0.12, 0.34), glass);
  doorWin.position.set(-0.065, doorH - 0.28, -doorL / 2);
  doorWin.rotation.y = -Math.PI / 2;
  doorPivot.add(doorWin);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.12), chrome);
  handle.position.set(-0.07, doorH / 2, -doorL / 2 + 0.08);
  doorPivot.add(handle);
  car.add(doorPivot);

  // ---- animated state ----
  const state = {
    door: { pivot: doorPivot, open: false, t: 0, max: Math.PI * 0.62 },
    hood: { pivot: hoodPivot, open: false, t: 0, max: -Math.PI * 0.42 },
    bay,
    headlights,
    wheels,
    running: false,
    runT: 0,
    // world-space anchor points for proximity checks
    doorAnchor: origin.clone().add(new THREE.Vector3(-W / 2 - 0.5, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw)),
    frontAnchor: origin.clone().add(new THREE.Vector3(0, 0, -L / 2 - 0.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw)),
  };

  function openDoor() {
    if (state.door.open) return false;
    state.door.open = true;
    return true;
  }
  function openHood() {
    if (state.hood.open) return false;
    state.hood.open = true;
    state.bay.visible = true;
    return true;
  }
  function startEngine() {
    if (state.running) return false;
    state.running = true;
    return true;
  }

  function update(dt) {
    const d = state.door;
    if (d.open && d.t < 1) {
      d.t = Math.min(1, d.t + dt * 1.6);
      d.pivot.rotation.y = ease(d.t) * d.max;
    }
    const h = state.hood;
    if (h.open && h.t < 1) {
      h.t = Math.min(1, h.t + dt * 1.4);
      h.pivot.rotation.x = ease(h.t) * h.max;
    }
    if (state.running) {
      state.runT += dt;
      // idle shudder
      const shake = Math.sin(state.runT * 40) * 0.004 + Math.sin(state.runT * 26) * 0.003;
      car.position.y = origin.y + shake;
      const glow = 0.7 + Math.sin(state.runT * 30) * 0.05;
      for (const hl of state.headlights) {
        if (hl.isSpotLight) hl.intensity = 2.4;
        else { hl.emissive.setHex(0xfff4d0); hl.emissiveIntensity = glow; }
      }
    }
  }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  // body collider footprint (axis-aligned approx; fine for facingYaw≈0)
  const half = facingYaw % Math.PI === 0 ? { x: W / 2 + 0.2, z: L / 2 + 0.2 } : { x: L / 2 + 0.2, z: W / 2 + 0.2 };
  const collider = {
    minX: origin.x - half.x, maxX: origin.x + half.x,
    minZ: origin.z - half.z, maxZ: origin.z + half.z,
  };

  return { group: car, state, openDoor, openHood, startEngine, update, collider };
}

// A standalone oil bucket prop you pick up.
export function buildOilBucket(scene, pos) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.15, 0.34, 16),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3f, roughness: 0.5, metalness: 0.6 })
  );
  body.position.y = 0.17;
  body.castShadow = true;
  g.add(body);
  const oil = new THREE.Mesh(
    new THREE.CircleGeometry(0.165, 16),
    new THREE.MeshStandardMaterial({ color: 0x140d04, roughness: 0.25 })
  );
  oil.rotation.x = -Math.PI / 2;
  oil.position.y = 0.33;
  g.add(oil);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.012, 6, 16, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.4, metalness: 0.7 })
  );
  handle.position.y = 0.34;
  g.add(handle);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xe6a93c, roughness: 0.7 })
  );
  label.position.set(0, 0.16, 0.181);
  g.add(label);
  g.position.copy(pos);
  scene.add(g);
  return g;
}
