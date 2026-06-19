// First-person controller: pointer lock look, WASD, sprint, jump,
// AABB push-out collision, head bob + footsteps.
import * as THREE from 'three';
import { BOUNDS } from './world.js';

const EYE_HEIGHT = 1.7;
const RADIUS = 0.45;
const WALK = 5.2;
const SPRINT = 8.2;
const ACCEL = 38;
const FRICTION = 11;
const GRAVITY = 22;
const JUMP = 7.2;

export class Player {
  constructor(camera, domElement, colliders, sfx) {
    this.camera = camera;
    this.dom = domElement;
    this.colliders = colliders;
    this.sfx = sfx;

    this.position = new THREE.Vector3(0, EYE_HEIGHT, 35);
    this.velocity = new THREE.Vector3();
    this.yaw = 0; // rotation.y = 0 → camera faces -Z, straight down the camp path
    this.pitch = 0;
    this.onGround = true;
    this.enabled = false;
    this.keys = {};
    this.bobPhase = 0;
    this.bobAmount = 0;
    this.stepAccum = 0;

    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled || document.pointerLockElement !== this.dom) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch -= e.movementY * 0.0022;
      this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));
    });
  }

  get isSprinting() {
    return (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && this.isMoving;
  }

  get isMoving() {
    return this.keys['KeyW'] || this.keys['KeyA'] || this.keys['KeyS'] || this.keys['KeyD'];
  }

  update(dt) {
    if (!this.enabled) return;

    // wish direction in world space from yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const wish = new THREE.Vector3();
    if (this.keys['KeyW']) wish.add(forward);
    if (this.keys['KeyS']) wish.sub(forward);
    if (this.keys['KeyD']) wish.add(right);
    if (this.keys['KeyA']) wish.sub(right);
    const moving = wish.lengthSq() > 0;
    if (moving) wish.normalize();

    const speedCap = this.isSprinting ? SPRINT : WALK;

    // horizontal accelerate / friction
    const hv = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
    if (moving) {
      hv.addScaledVector(wish, ACCEL * dt);
      if (hv.length() > speedCap) hv.setLength(speedCap);
    } else {
      const drop = Math.max(0, 1 - FRICTION * dt);
      hv.multiplyScalar(drop);
      if (hv.lengthSq() < 0.001) hv.set(0, 0, 0);
    }
    this.velocity.x = hv.x;
    this.velocity.z = hv.z;

    // gravity & jump
    if (this.onGround && this.keys['Space']) {
      this.velocity.y = JUMP;
      this.onGround = false;
    }
    this.velocity.y -= GRAVITY * dt;

    // integrate + collide per axis
    this.position.x += this.velocity.x * dt;
    this.collideAxis('x');
    this.position.z += this.velocity.z * dt;
    this.collideAxis('z');
    this.position.y += this.velocity.y * dt;
    if (this.position.y <= EYE_HEIGHT) {
      this.position.y = EYE_HEIGHT;
      this.velocity.y = 0;
      this.onGround = true;
    }

    // world bounds
    this.position.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, this.position.x));
    this.position.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, this.position.z));

    // head bob + footsteps
    const hSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (hSpeed > 0.5 && this.onGround) {
      const rate = this.isSprinting ? 11 : 8;
      this.bobPhase += dt * rate;
      this.bobAmount = Math.min(1, this.bobAmount + dt * 6);
      this.stepAccum += dt * rate;
      if (this.stepAccum > Math.PI) {
        this.stepAccum -= Math.PI;
        this.sfx.footstep();
      }
    } else {
      this.bobAmount = Math.max(0, this.bobAmount - dt * 6);
    }
    const bobY = Math.abs(Math.sin(this.bobPhase)) * 0.05 * this.bobAmount;
    const bobX = Math.sin(this.bobPhase) * 0.025 * this.bobAmount;

    // apply to camera
    this.camera.position.set(
      this.position.x + Math.cos(this.yaw) * bobX,
      this.position.y + bobY,
      this.position.z - Math.sin(this.yaw) * bobX
    );
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  collideAxis(axis) {
    for (const c of this.colliders) {
      if (
        this.position.x + RADIUS <= c.minX ||
        this.position.x - RADIUS >= c.maxX ||
        this.position.z + RADIUS <= c.minZ ||
        this.position.z - RADIUS >= c.maxZ
      ) {
        continue;
      }
      if (axis === 'x') {
        if (this.position.x > (c.minX + c.maxX) / 2) this.position.x = c.maxX + RADIUS;
        else this.position.x = c.minX - RADIUS;
        this.velocity.x = 0;
      } else {
        if (this.position.z > (c.minZ + c.maxZ) / 2) this.position.z = c.maxZ + RADIUS;
        else this.position.z = c.minZ - RADIUS;
        this.velocity.z = 0;
      }
    }
  }
}
