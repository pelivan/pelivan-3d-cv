// Builds Pelivan Orchard: sunny terrain, apple trees, story signs, the can
// range, a gravel driveway with the car, and the cabin with its door.
import * as THREE from 'three';
import {
  grassTexture, gravelTexture, dirtTexture, woodTexture,
  barkTexture, leafTexture, hayTexture,
} from './textures.js';
import { buildBoard } from './boards.js';
import { buildCar, buildOilBucket } from './car.js';

export const BOUNDS = { minX: -30, maxX: 30, minZ: -44, maxZ: 39 };

function aabb(x, z, hw, hd) {
  return { minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd };
}

export function buildWorld(scene) {
  const colliders = [];

  // ---------- atmosphere ----------
  scene.background = new THREE.Color(0xbfe3f2);
  scene.fog = new THREE.Fog(0xcfe9f2, 55, 165);

  const hemi = new THREE.HemisphereLight(0xeaf4ff, 0x6f9a4a, 1.05);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2cf, 2.1);
  sun.position.set(28, 46, 34);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.camera.far = 150;
  sun.shadow.bias = -0.0008;
  scene.add(sun);

  // sky dome (soft gradient so the horizon isn't flat fog)
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(300, 24, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        top: { value: new THREE.Color(0x6fb7e8) },
        bottom: { value: new THREE.Color(0xdff1f7) },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `,
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bottom;
        void main(){ float h = clamp((normalize(vP).y*0.5)+0.5, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, h), 1.0);} `,
    })
  );
  scene.add(sky);

  // ---------- terrain ----------
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 420),
    new THREE.MeshStandardMaterial({ map: grassTexture(60), roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // gravel driveway down the middle
  const drive = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 80),
    new THREE.MeshStandardMaterial({ map: gravelTexture(12), roughness: 1 })
  );
  drive.rotation.x = -Math.PI / 2;
  drive.position.set(0, 0.02, 0);
  drive.receiveShadow = true;
  scene.add(drive);

  // distant rolling hills
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x7ba84d, roughness: 1, flatShading: true });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 160 + Math.random() * 50;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(28 + Math.random() * 30, 8, 6), hillMat);
    hill.position.set(Math.cos(a) * r, -18 - Math.random() * 6, Math.sin(a) * r);
    hill.scale.y = 0.5;
    scene.add(hill);
  }

  // a few drifting clouds
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false });
  for (let i = 0; i < 8; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(5 + Math.random() * 5, 7, 6), cloudMat);
      p.position.set(j * 6 - 9 + Math.random() * 3, Math.random() * 3, Math.random() * 4);
      p.scale.y = 0.6;
      cloud.add(p);
    }
    cloud.position.set((Math.random() - 0.5) * 220, 55 + Math.random() * 25, (Math.random() - 0.5) * 220);
    scene.add(cloud);
  }

  // ---------- shared materials ----------
  const barkMat = new THREE.MeshStandardMaterial({ map: barkTexture(), roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ map: leafTexture(), roughness: 0.95, flatShading: false });
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTexture('#a07a4c'), roughness: 0.9 });
  const woodDark = new THREE.MeshStandardMaterial({ map: woodTexture('#7c5a36'), roughness: 0.9 });
  const hayMat = new THREE.MeshStandardMaterial({ map: hayTexture(), roughness: 1 });

  const appleMat = new THREE.MeshStandardMaterial({ color: 0xc8402f, roughness: 0.5 });
  const appleGeo = new THREE.SphereGeometry(0.13, 6, 5);

  // ---------- apple tree ----------
  function appleTree(x, z, scale = 1) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.34 * scale, 2.6 * scale, 8), barkMat);
    trunk.position.y = 1.3 * scale;
    trunk.castShadow = true;
    g.add(trunk);
    // a couple of branch stubs
    for (let i = 0; i < 3; i++) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * scale, 0.1 * scale, 1.1 * scale, 5), barkMat);
      const a = (i / 3) * Math.PI * 2 + 0.5;
      br.position.set(Math.cos(a) * 0.5 * scale, 2.2 * scale, Math.sin(a) * 0.5 * scale);
      br.rotation.z = Math.cos(a) * 0.7;
      br.rotation.x = -Math.sin(a) * 0.7;
      g.add(br);
    }
    // lumpy canopy from several spheres
    const crown = new THREE.Group();
    crown.position.y = 3.2 * scale;
    const blobs = [
      [0, 0.4, 0, 1.7], [-1.1, -0.1, 0.3, 1.2], [1.0, 0.0, -0.4, 1.25],
      [0.2, -0.2, 1.1, 1.1], [-0.3, 0.1, -1.0, 1.15],
    ];
    for (const [bx, by, bz, br] of blobs) {
      const blob = new THREE.Mesh(new THREE.SphereGeometry(br * scale, 9, 8), leafMat);
      blob.position.set(bx * scale, by * scale, bz * scale);
      blob.castShadow = true;
      crown.add(blob);
    }
    g.add(crown);
    // apples nestled in the canopy
    for (let i = 0; i < 9; i++) {
      const apple = new THREE.Mesh(appleGeo, appleMat);
      const a = Math.random() * Math.PI * 2;
      const rr = (1.0 + Math.random() * 0.8) * scale;
      apple.position.set(
        Math.cos(a) * rr,
        3.0 * scale + (Math.random() - 0.5) * 1.6 * scale,
        Math.sin(a) * rr
      );
      g.add(apple);
    }
    g.position.set(x, 0, z);
    g.rotation.y = Math.random() * Math.PI;
    scene.add(g);
    colliders.push(aabb(x, z, 0.5 * scale, 0.5 * scale));
  }

  // orchard rows flanking the driveway
  const treeRows = [];
  for (let i = 0; i < 6; i++) {
    const z = 24 - i * 9;
    treeRows.push([-13, z], [-22, z], [13, z], [22, z]);
  }
  // skip trees that would crowd the can range / driveway features; place rest
  for (const [tx, tz] of treeRows) {
    // leave the east mid open for the car driveway
    if (tx > 0 && tz > -6 && tz < 8) continue;
    appleTree(tx, tz, 0.9 + Math.random() * 0.35);
  }
  // scattered trees outside the fence
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 40 + Math.random() * 45;
    appleTree(Math.cos(a) * r, Math.sin(a) * r, 0.8 + Math.random() * 0.5);
  }

  // ---------- perimeter fence ----------
  function fenceRun(x1, z1, x2, z2) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const posts = Math.max(2, Math.round(len / 4));
    const dir = new THREE.Vector2(x2 - x1, z2 - z1).divideScalar(posts);
    for (let i = 0; i <= posts; i++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.5, 6), woodDark);
      post.position.set(x1 + dir.x * i, 0.75, z1 + dir.y * i);
      post.castShadow = true;
      scene.add(post);
    }
    const angle = Math.atan2(z2 - z1, x2 - x1);
    for (const y of [0.5, 1.05]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.05), woodMat);
      rail.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
      rail.rotation.y = -angle;
      scene.add(rail);
    }
  }
  const B = BOUNDS;
  fenceRun(B.minX - 1, B.maxZ + 1, B.maxX + 1, B.maxZ + 1);
  fenceRun(B.minX - 1, B.minZ - 1, B.maxX + 1, B.minZ - 1);
  fenceRun(B.minX - 1, B.minZ - 1, B.minX - 1, B.maxZ + 1);
  fenceRun(B.maxX + 1, B.minZ - 1, B.maxX + 1, B.maxZ + 1);

  // ---------- entrance arch ----------
  const arch = new THREE.Group();
  for (const sx of [-3.2, 3.2]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 5.2, 8), woodDark);
    pole.position.set(sx, 2.6, 0);
    pole.castShadow = true;
    arch.add(pole);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.3, 0.3), woodDark);
  lintel.position.y = 5.1;
  arch.add(lintel);
  const signC = document.createElement('canvas');
  signC.width = 768; signC.height = 168;
  const sctx = signC.getContext('2d');
  sctx.fillStyle = '#7c5a36';
  sctx.fillRect(0, 0, 768, 168);
  sctx.strokeStyle = '#f3e7c8';
  sctx.lineWidth = 8;
  sctx.strokeRect(8, 8, 752, 152);
  sctx.fillStyle = '#f3e7c8';
  sctx.font = "62px 'Fredoka', Impact, sans-serif";
  sctx.textAlign = 'center';
  sctx.fillText('PELIVAN ORCHARD', 384, 78);
  sctx.fillStyle = '#e6a93c';
  sctx.font = "34px 'Caveat', cursive";
  sctx.fillText('est. wherever you are reading this', 384, 122);
  const signTex = new THREE.CanvasTexture(signC);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(6.6, 1.45, 0.12),
    [woodMat, woodMat, woodMat, woodMat, new THREE.MeshStandardMaterial({ map: signTex }), woodMat]
  );
  sign.position.y = 4.2;
  arch.add(sign);
  arch.position.set(0, 0, 31);
  scene.add(arch);
  colliders.push(aabb(-3.2, 31, 0.4, 0.4), aabb(3.2, 31, 0.4, 0.4));

  // ---------- story signs ----------
  const boardDefs = [
    { kind: 'profile', x: -6.5, z: 22, ry: 0.45 },
    { kind: 'colophon', x: 6.5, z: 24, ry: -0.45 },
    { kind: 'experience', x: 6.5, z: 13, ry: -0.45 },
    { kind: 'skills', x: -6.5, z: 6, ry: 0.45 },
    { kind: 'range', x: 6.5, z: -2, ry: -0.6, width: 3 },
  ];
  const boardMeshes = [];
  for (const def of boardDefs) {
    const board = buildBoard(def.kind, def.width || 4.2);
    board.position.set(def.x, 0, def.z);
    board.rotation.y = def.ry;
    scene.add(board);
    boardMeshes.push(board);
    // tight AABB around the thin panel only, so you can walk right up to read it
    const halfW = (def.width || 4.2) / 2;
    const halfD = 0.12;
    const ry = def.ry;
    colliders.push(aabb(
      def.x,
      def.z,
      halfW * Math.abs(Math.cos(ry)) + halfD * Math.abs(Math.sin(ry)),
      halfW * Math.abs(Math.sin(ry)) + halfD * Math.abs(Math.cos(ry))
    ));
  }

  // ---------- apple baskets (refill points) ----------
  const basketSpots = [];
  function basket(x, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.32, 0.6, 14),
      new THREE.MeshStandardMaterial({ map: woodTexture('#b08642'), roughness: 0.9 })
    );
    body.position.y = 0.3;
    body.castShadow = true;
    g.add(body);
    // weave rings
    for (const ry of [0.12, 0.3, 0.48]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4 - (0.5 - ry) * 0.12, 0.025, 6, 16), new THREE.MeshStandardMaterial({ color: 0x8a6630, roughness: 1 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = ry;
      g.add(ring);
    }
    // heap of apples
    for (let i = 0; i < 14; i++) {
      const apple = new THREE.Mesh(appleGeo, appleMat);
      const a = Math.random() * Math.PI * 2;
      const rr = Math.random() * 0.3;
      apple.position.set(Math.cos(a) * rr, 0.6 + Math.random() * 0.12, Math.sin(a) * rr);
      apple.castShadow = true;
      g.add(apple);
    }
    g.position.set(x, 0, z);
    scene.add(g);
    colliders.push(aabb(x, z, 0.5, 0.5));
    basketSpots.push({ x, z });
  }
  basket(3.5, 28);          // near the entrance
  basket(-6.5, -9);         // at the throwing line
  basket(-13.5, -9);

  // ---------- can range ----------
  // rail of cans on the west side; player throws from the driveway side
  const canLine = { z: -25, xStart: -16, gap: 2.6, count: 6, railY: 1.05 };

  // hay-bale backstop behind the cans
  function hayBale(x, z, ry = 0) {
    const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.7, 16), hayMat);
    bale.rotation.z = Math.PI / 2;
    bale.rotation.y = ry;
    bale.position.set(x, 0.8, z);
    bale.castShadow = true;
    bale.receiveShadow = true;
    scene.add(bale);
    colliders.push(aabb(x, z, 1.0, 0.95));
  }
  for (let i = 0; i < 7; i++) hayBale(-17 + i * 2.7, -28 - (i % 2) * 0.3, (Math.random() - 0.5) * 0.3);
  for (let i = 0; i < 5; i++) hayBale(-15 + i * 2.7, -29.6, 0.1);

  // throwing line: a rope fence walls off the range so you must lob from afar
  const LINE_Z = -16, LINE_X1 = -29, LINE_X2 = -1;
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xc9b78a, roughness: 1 });
  const linePosts = Math.round((LINE_X2 - LINE_X1) / 3);
  for (let i = 0; i <= linePosts; i++) {
    const x = LINE_X1 + (i / linePosts) * (LINE_X2 - LINE_X1);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.15, 6), woodDark);
    post.position.set(x, 0.55, LINE_Z);
    post.castShadow = true;
    scene.add(post);
  }
  for (const y of [0.55, 0.95]) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, LINE_X2 - LINE_X1, 6), ropeMat);
    rope.rotation.z = Math.PI / 2;
    rope.position.set((LINE_X1 + LINE_X2) / 2, y, LINE_Z);
    scene.add(rope);
  }
  colliders.push({ minX: LINE_X1, maxX: LINE_X2, minZ: LINE_Z - 0.25, maxZ: LINE_Z + 0.25 });
  // "throwing line" plaque
  const tlC = document.createElement('canvas');
  tlC.width = 320; tlC.height = 96;
  const tlCtx = tlC.getContext('2d');
  tlCtx.fillStyle = '#c2402f';
  tlCtx.fillRect(0, 0, 320, 96);
  tlCtx.strokeStyle = '#f3e7c8'; tlCtx.lineWidth = 5;
  tlCtx.strokeRect(6, 6, 308, 84);
  tlCtx.fillStyle = '#f3e7c8';
  tlCtx.font = "30px 'Fredoka', sans-serif";
  tlCtx.textAlign = 'center';
  tlCtx.fillText('THROWING LINE', 160, 42);
  tlCtx.font = "22px 'Caveat', cursive";
  tlCtx.fillText('lob from behind here!', 160, 72);
  const tlTex = new THREE.CanvasTexture(tlC);
  tlTex.colorSpace = THREE.SRGBColorSpace;
  const tlSign = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.6), new THREE.MeshStandardMaterial({ map: tlTex, side: THREE.DoubleSide }));
  tlSign.position.set(-9.5, 1.35, LINE_Z);
  scene.add(tlSign);

  // ---------- the cabin (end room) ----------
  const hut = new THREE.Group();
  const HW = 5, HD = 4, WALL_H = 3.4;
  const wallMat = woodMat;
  let wall = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, WALL_H, 0.25), wallMat);
  wall.position.set(0, WALL_H / 2, -HD);
  wall.castShadow = true; wall.receiveShadow = true;
  hut.add(wall);
  for (const sx of [-1, 1]) {
    wall = new THREE.Mesh(new THREE.BoxGeometry(0.25, WALL_H, HD * 2), wallMat);
    wall.position.set(sx * HW, WALL_H / 2, 0);
    wall.castShadow = true; wall.receiveShadow = true;
    hut.add(wall);
  }
  const DOOR_W = 1.5, DOOR_H = 2.5;
  for (const sx of [-1, 1]) {
    const segW = HW - DOOR_W / 2;
    wall = new THREE.Mesh(new THREE.BoxGeometry(segW, WALL_H, 0.25), wallMat);
    wall.position.set(sx * (DOOR_W / 2 + segW / 2), WALL_H / 2, HD);
    wall.castShadow = true; wall.receiveShadow = true;
    hut.add(wall);
  }
  const headerSeg = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, WALL_H - DOOR_H, 0.25), wallMat);
  headerSeg.position.set(0, DOOR_H + (WALL_H - DOOR_H) / 2, HD);
  hut.add(headerSeg);
  // gabled roof
  const hutRoofGeo = new THREE.BufferGeometry();
  {
    const hw2 = HW + 0.5, hd2 = HD + 0.5, y0 = WALL_H, rh = 1.7;
    const v = new Float32Array([
      -hw2, y0, hd2, hw2, y0, hd2, hw2, y0 + rh, 0,
      -hw2, y0, hd2, hw2, y0 + rh, 0, -hw2, y0 + rh, 0,
      hw2, y0, -hd2, -hw2, y0, -hd2, -hw2, y0 + rh, 0,
      hw2, y0, -hd2, -hw2, y0 + rh, 0, hw2, y0 + rh, 0,
      hw2, y0, hd2, hw2, y0, -hd2, hw2, y0 + rh, 0,
      -hw2, y0, -hd2, -hw2, y0, hd2, -hw2, y0 + rh, 0,
    ]);
    hutRoofGeo.setAttribute('position', new THREE.BufferAttribute(v, 3));
    hutRoofGeo.computeVertexNormals();
  }
  const hutRoof = new THREE.Mesh(hutRoofGeo, new THREE.MeshStandardMaterial({ color: 0x9a4b34, roughness: 0.9 }));
  hutRoof.castShadow = true;
  hut.add(hutRoof);
  const hutFloor = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, 0.08, HD * 2), woodDark);
  hutFloor.position.y = 0.04;
  hutFloor.receiveShadow = true;
  hut.add(hutFloor);

  // "THE CABIN" sign
  const dbC = document.createElement('canvas');
  dbC.width = 512; dbC.height = 140;
  const dbCtx = dbC.getContext('2d');
  dbCtx.fillStyle = '#356026';
  dbCtx.fillRect(0, 0, 512, 140);
  dbCtx.strokeStyle = '#f3e7c8';
  dbCtx.lineWidth = 6;
  dbCtx.strokeRect(8, 8, 496, 124);
  dbCtx.fillStyle = '#f3e7c8';
  dbCtx.font = "46px 'Fredoka', sans-serif";
  dbCtx.textAlign = 'center';
  dbCtx.fillText('THE CABIN', 256, 64);
  dbCtx.fillStyle = '#e6a93c';
  dbCtx.font = "30px 'Caveat', cursive";
  dbCtx.fillText('your CV is inside', 256, 104);
  const dbTex = new THREE.CanvasTexture(dbC);
  dbTex.colorSpace = THREE.SRGBColorSpace;
  const dbSign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.88), new THREE.MeshStandardMaterial({ map: dbTex }));
  dbSign.position.set(0, DOOR_H + 0.55, HD + 0.14);
  hut.add(dbSign);

  // the door
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-DOOR_W / 2, 0, HD);
  const doorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W, DOOR_H, 0.09),
    new THREE.MeshStandardMaterial({ map: woodTexture('#6b4a2c'), roughness: 0.85 })
  );
  doorMesh.position.set(DOOR_W / 2, DOOR_H / 2, 0);
  doorMesh.castShadow = true;
  doorPivot.add(doorMesh);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0xe6a93c, metalness: 0.6, roughness: 0.3 }));
  knob.position.set(DOOR_W - 0.18, DOOR_H / 2, 0.1);
  doorPivot.add(knob);
  hut.add(doorPivot);

  // cozy interior: a table with the glowing CV
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.1), woodDark);
  table.position.set(0, 0.95, -HD + 1.2);
  hut.add(table);
  for (const [lx, lz] of [[-1.05, -0.4], [1.05, -0.4], [-1.05, 0.4], [1.05, 0.4]]) {
    const tleg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), woodDark);
    tleg.position.set(lx, 0.5, -HD + 1.2 + lz);
    hut.add(tleg);
  }
  const cv = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.06, 0.95),
    new THREE.MeshStandardMaterial({ color: 0xf3e7c8, emissive: 0xe6a93c, emissiveIntensity: 0.45 })
  );
  cv.position.set(0, 1.04, -HD + 1.2);
  cv.rotation.y = 0.15;
  hut.add(cv);
  const lamp = new THREE.PointLight(0xffd9a0, 1.5, 9, 1.6);
  lamp.position.set(0, 2.6, -HD + 1.5);
  hut.add(lamp);

  const HUT_POS = new THREE.Vector3(0, 0, -38);
  hut.position.copy(HUT_POS);
  scene.add(hut);

  const hz = HUT_POS.z;
  colliders.push(
    aabb(0, hz - HD, HW + 0.3, 0.35),
    aabb(-HW, hz, 0.35, HD + 0.3),
    aabb(HW, hz, 0.35, HD + 0.3),
    aabb(-(DOOR_W / 2 + (HW - DOOR_W / 2) / 2), hz + HD, (HW - DOOR_W / 2) / 2 + 0.1, 0.35),
    aabb(DOOR_W / 2 + (HW - DOOR_W / 2) / 2, hz + HD, (HW - DOOR_W / 2) / 2 + 0.1, 0.35),
    aabb(0, hz - HD + 1.2, 1.4, 0.8)
  );
  const doorCollider = aabb(0, hz + HD, DOOR_W / 2 + 0.15, 0.3);
  colliders.push(doorCollider);

  const door = {
    pivot: doorPivot,
    collider: doorCollider,
    worldPos: new THREE.Vector3(0, 1.2, hz + HD),
    locked: true,
    open: false,
    progress: 0,
    update(dt) {
      if (this.open && this.progress < 1) {
        this.progress = Math.min(1, this.progress + dt * 1.2);
        this.pivot.rotation.y = -this.progress * Math.PI * 0.55;
      }
    },
    openNow() {
      if (this.open) return;
      this.open = true;
      this.collider.minX = 9999;
      this.collider.maxX = 9999;
    },
  };
  const endTrigger = { minX: -2.5, maxX: 2.5, minZ: hz - HD + 1.8, maxZ: hz + HD - 1.4 };

  // ---------- the car + oil bucket (easter egg) ----------
  const carPos = new THREE.Vector3(18, 0, 2);
  const car = buildCar(scene, carPos, 0);
  colliders.push(car.collider);
  // a short gravel pad under the car
  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 9),
    new THREE.MeshStandardMaterial({ map: gravelTexture(5), roughness: 1 })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(18, 0.015, 2);
  pad.receiveShadow = true;
  scene.add(pad);

  const oilPos = new THREE.Vector3(15.6, 0, 3.4);
  const oilBucket = buildOilBucket(scene, oilPos);
  oilBucket.userData.worldPos = oilPos.clone();

  // ---------- hidden golden apples ----------
  // emissive only — no per-apple light. Adding/removing lights at runtime forces
  // a full shader recompile (a frame hitch), so the glow is baked into the material.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffcf3a, roughness: 0.25, metalness: 0.8, emissive: 0xe0a020, emissiveIntensity: 0.85,
  });
  const goldenApples = [];
  const goldSpots = [
    [-24, 20], [24, 24], [13, -11], [-15, -9], [27, -6], [6, -30],
  ];
  for (const [gx, gz] of goldSpots) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), goldMat);
    body.scale.set(1, 0.9, 1);
    g.add(body);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.016, 0.08, 5),
      new THREE.MeshStandardMaterial({ color: 0x5b3a1c, roughness: 0.9 })
    );
    stem.position.y = 0.16;
    g.add(stem);
    g.position.set(gx, 0.85, gz);
    scene.add(g);
    goldenApples.push({ mesh: g, x: gx, z: gz, baseY: 0.85, collected: false });
  }

  // ---------- wandering chickens ----------
  const chickens = [];
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf4f0e6, roughness: 0.9 });
  const combMat = new THREE.MeshStandardMaterial({ color: 0xc2402f, roughness: 0.8 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xe6a93c, roughness: 0.7 });
  function buildChicken(x, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bodyMat);
    body.scale.set(1, 0.9, 1.25);
    body.position.y = 0.32;
    body.castShadow = true;
    g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 6), bodyMat);
    tail.position.set(0, 0.42, 0.22);
    tail.rotation.x = -1.0;
    g.add(tail);
    const head = new THREE.Group();
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 7), bodyMat);
    head.add(skull);
    const comb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.12), combMat);
    comb.position.y = 0.12;
    head.add(comb);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 5), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0, -0.13);
    head.add(beak);
    const wattle = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), combMat);
    wattle.position.set(0, -0.08, -0.1);
    head.add(wattle);
    head.position.set(0, 0.5, -0.18);
    g.add(head);
    const legMat = beakMat;
    const legs = [];
    for (const lx of [-0.07, 0.07]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 5), legMat);
      leg.position.set(lx, 0.1, 0);
      g.add(leg);
      legs.push(leg);
    }
    g.position.set(x, 0, z);
    scene.add(g);
    return {
      group: g, head, legs,
      x, z, heading: Math.random() * Math.PI * 2,
      target: null, timer: 0, peckT: 0, bob: Math.random() * 7,
    };
  }
  const FLOCK_CENTER = { x: 9, z: 21 };
  for (let i = 0; i < 5; i++) {
    chickens.push(buildChicken(
      FLOCK_CENTER.x + (Math.random() - 0.5) * 10,
      FLOCK_CENTER.z + (Math.random() - 0.5) * 8
    ));
  }
  function updateChickens(dt) {
    for (const c of chickens) {
      c.timer -= dt;
      if (!c.target || c.timer <= 0) {
        // pick a new spot near the flock center; sometimes just stand and peck
        if (Math.random() < 0.35) {
          c.target = null;
          c.timer = 1.2 + Math.random() * 2;
          c.peckT = 1;
        } else {
          c.target = {
            x: FLOCK_CENTER.x + (Math.random() - 0.5) * 13,
            z: FLOCK_CENTER.z + (Math.random() - 0.5) * 11,
          };
          c.timer = 2 + Math.random() * 3;
        }
      }
      if (c.target) {
        const dx = c.target.x - c.x, dz = c.target.z - c.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.2) {
          c.heading = Math.atan2(dx, dz);
          const step = Math.min(d, 0.9 * dt);
          c.x += (dx / d) * step;
          c.z += (dz / d) * step;
          c.bob += dt * 12;
          c.group.position.y = Math.abs(Math.sin(c.bob)) * 0.04;
          c.legs[0].rotation.x = Math.sin(c.bob) * 0.5;
          c.legs[1].rotation.x = -Math.sin(c.bob) * 0.5;
        } else {
          c.target = null;
        }
      } else if (c.peckT > 0) {
        c.peckT -= dt;
        c.head.position.y = 0.5 - Math.max(0, Math.sin(c.peckT * 10)) * 0.32;
      }
      c.group.position.x = c.x;
      c.group.position.z = c.z;
      c.group.rotation.y = c.heading;
    }
  }

  return {
    colliders, door, endTrigger, canLine, boardMeshes, basketSpots, car, oilBucket,
    goldenApples, updateChickens,
  };
}
