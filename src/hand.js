// First-person hand viewmodel attached to the camera. Holds an apple you can
// charge up and throw, or an oil bucket during the car easter egg.
import * as THREE from 'three';

const SKIN = 0xe2a878;
const MIN_POWER = 0.32;
const THROW_SPEED = 26; // m/s at full power (enough to clear the throwing line)
const COOLDOWN = 0.45;

export class Hand {
  constructor(camera) {
    this.camera = camera;
    this.root = new THREE.Group();
    camera.add(this.root);

    this.mode = 'apple'; // 'apple' | 'bucket'
    this.charging = false;
    this.power = 0;
    this.cooldown = 0;
    this.throwAnim = 0; // 0..1 timeline, >0 means animating
    this.hasApple = true;

    this.buildHand();
    this.buildHeldApple();
    this.buildBucket();
    this.root.traverse((o) => {
      o.frustumCulled = false;
      o.raycast = () => {};
    });

    this.restPos = new THREE.Vector3(0.26, -0.32, -0.5);
    this.restRot = new THREE.Euler(0.1, -0.2, 0);
  }

  buildHand() {
    const mat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.8 });
    const cuffMat = new THREE.MeshStandardMaterial({ color: 0x3f6b2a, roughness: 0.9 });
    const hand = new THREE.Group();

    // forearm sleeve
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.34, 10), cuffMat);
    sleeve.rotation.x = Math.PI / 2.2;
    sleeve.position.set(0, -0.06, 0.18);
    hand.add(sleeve);

    // palm
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.13), mat);
    palm.position.set(0, 0, 0);
    hand.add(palm);

    // fingers (curled around to cradle the apple)
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Group();
      const seg1 = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.06), mat);
      seg1.position.z = -0.04;
      const seg2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.045), mat);
      seg2.position.set(0, -0.025, -0.085);
      seg2.rotation.x = -0.9;
      finger.add(seg1, seg2);
      finger.position.set(-0.045 + i * 0.03, 0.0, -0.065);
      hand.add(finger);
    }
    // thumb
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 0.06), mat);
    thumb.position.set(0.07, 0.0, -0.03);
    thumb.rotation.y = 0.6;
    hand.add(thumb);

    hand.position.copy(new THREE.Vector3(0, 0, 0));
    this.handGroup = hand;
    this.root.add(hand);
  }

  buildHeldApple() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xc8402f, roughness: 0.5 })
    );
    body.scale.set(1, 0.9, 1);
    g.add(body);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.014, 0.06, 5),
      new THREE.MeshStandardMaterial({ color: 0x5b3a1c, roughness: 0.9 })
    );
    stem.position.y = 0.11;
    g.add(stem);
    g.position.set(0, 0.02, -0.09);
    this.heldApple = g;
    this.handGroup.add(g);
  }

  buildBucket() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.085, 0.18, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3f, roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide })
    );
    g.add(body);
    const oil = new THREE.Mesh(
      new THREE.CircleGeometry(0.092, 14),
      new THREE.MeshStandardMaterial({ color: 0x1a1206, roughness: 0.3 })
    );
    oil.rotation.x = -Math.PI / 2;
    oil.position.y = 0.05;
    g.add(oil);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.07),
      new THREE.MeshStandardMaterial({ color: 0xe6a93c, roughness: 0.7 })
    );
    label.position.set(0, 0, 0.101);
    g.add(label);
    g.position.set(0, 0.0, -0.12);
    g.visible = false;
    this.bucket = g;
    this.handGroup.add(g);
  }

  setMode(mode) {
    this.mode = mode;
    this.bucket.visible = mode === 'bucket';
    this.heldApple.visible = mode === 'apple' && this.hasApple && this.throwAnim === 0;
  }

  startCharge() {
    if (this.mode !== 'apple' || !this.hasApple || this.cooldown > 0 || this.throwAnim > 0) return false;
    this.charging = true;
    this.power = MIN_POWER;
    return true;
  }

  // returns { velocity, power }, or null if nothing thrown
  release(camera) {
    if (!this.charging) return null;
    this.charging = false;
    const power = this.power;
    this.power = 0;
    this.throwAnim = 0.0001; // kick off animation
    this.cooldown = COOLDOWN;
    this.hasApple = false;
    this.heldApple.visible = false;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    // add a gentle upward lob that shrinks as power grows (full power = flatter)
    dir.y += 0.18 - power * 0.08;
    dir.normalize();
    return { velocity: dir.multiplyScalar(THROW_SPEED * power), power };
  }

  refill() {
    this.hasApple = true;
    if (this.mode === 'apple' && this.throwAnim === 0) this.heldApple.visible = true;
  }

  update(dt, bobAmount) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.charging) this.power = Math.min(1, this.power + dt * 1.4);

    // throw animation: quick wind-back then fling
    let throwOffset = new THREE.Vector3();
    let throwPitch = 0;
    if (this.throwAnim > 0) {
      this.throwAnim = Math.min(1, this.throwAnim + dt * 4.5);
      const k = this.throwAnim;
      if (k < 0.3) {
        const w = k / 0.3; // wind back
        throwOffset.set(0.04 * w, 0.05 * w, 0.12 * w);
        throwPitch = 0.5 * w;
      } else {
        const f = (k - 0.3) / 0.7; // fling forward
        throwOffset.set(-0.05 * (1 - f), -0.04 * (1 - f), -0.3 * Math.sin(f * Math.PI));
        throwPitch = -0.7 * Math.sin(f * Math.PI);
      }
      if (this.throwAnim >= 1) {
        this.throwAnim = 0;
        if (this.hasApple && this.mode === 'apple') this.heldApple.visible = true;
      }
    }

    // charge crouch: pull the apple back as you wind up
    const chargeBack = this.charging ? this.power : 0;

    const t = performance.now() * 0.001;
    const sway = Math.sin(t * 1.5) * 0.004 + Math.sin(t * 0.8) * 0.003;
    const bob = Math.sin(t * 8) * 0.008 * bobAmount;

    this.handGroup.position.set(
      this.restPos.x + sway + throwOffset.x + chargeBack * 0.03,
      this.restPos.y + bob + throwOffset.y - chargeBack * 0.04,
      this.restPos.z + throwOffset.z + chargeBack * 0.07
    );
    this.handGroup.rotation.set(
      this.restRot.x + throwPitch + chargeBack * 0.25,
      this.restRot.y + sway * 2,
      this.restRot.z
    );
  }
}
