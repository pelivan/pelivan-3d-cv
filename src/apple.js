// Thrown-apple projectiles: spawn, gravity, collision with cans + ground, splats.
import * as THREE from 'three';

const GRAVITY = 16;
const GROUND_Y = 0.12;
const APPLE_R = 0.13;
const LIFETIME = 5;

function appleMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(APPLE_R, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xc8402f, roughness: 0.5 })
  );
  body.scale.set(1, 0.9, 1);
  body.castShadow = true;
  g.add(body);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.016, 0.07, 5),
    new THREE.MeshStandardMaterial({ color: 0x5b3a1c, roughness: 0.9 })
  );
  stem.position.y = APPLE_R + 0.02;
  g.add(stem);
  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 6, 5),
    new THREE.MeshStandardMaterial({ color: 0x4e8a3a, roughness: 0.7 })
  );
  leaf.scale.set(1.6, 0.4, 1);
  leaf.position.set(0.03, APPLE_R + 0.04, 0);
  g.add(leaf);
  g.traverse((o) => (o.frustumCulled = false));
  return g;
}

export class Apples {
  constructor(scene) {
    this.scene = scene;
    this.live = [];
    this.splats = [];
    this.onCanHit = null; // (can) => {}
  }

  spawn(origin, velocity) {
    const mesh = appleMesh();
    mesh.position.copy(origin);
    this.scene.add(mesh);
    this.live.push({
      mesh,
      vel: velocity.clone(),
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12
      ),
      life: LIFETIME,
    });
  }

  splat(pos, color = 0xc8402f) {
    for (let i = 0; i < 6; i++) {
      const bit = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 + Math.random() * 0.03, 5, 4),
        new THREE.MeshStandardMaterial({ color, roughness: 0.6, transparent: true })
      );
      bit.position.copy(pos);
      bit.raycast = () => {};
      this.scene.add(bit);
      this.splats.push({
        mesh: bit,
        vel: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2.5, (Math.random() - 0.5) * 3),
        life: 0.7,
      });
    }
  }

  update(dt, cans) {
    // projectiles
    for (let i = this.live.length - 1; i >= 0; i--) {
      const a = this.live[i];
      a.vel.y -= GRAVITY * dt;
      a.mesh.position.addScaledVector(a.vel, dt);
      a.mesh.rotation.x += a.spin.x * dt;
      a.mesh.rotation.y += a.spin.y * dt;
      a.life -= dt;

      let dead = false;

      // can collisions (generous radius for satisfying throws)
      if (cans) {
        for (const can of cans.standing()) {
          if (a.mesh.position.distanceToSquared(can.hitCenter) < 0.45 * 0.45) {
            if (this.onCanHit) this.onCanHit(can);
            this.splat(a.mesh.position);
            dead = true;
            break;
          }
        }
      }

      if (!dead && a.mesh.position.y <= GROUND_Y) {
        a.mesh.position.y = GROUND_Y;
        this.splat(a.mesh.position);
        dead = true;
      }

      if (!dead && (a.life <= 0 || Math.abs(a.mesh.position.x) > 80 || Math.abs(a.mesh.position.z) > 80)) {
        dead = true;
      }

      if (dead) {
        this.scene.remove(a.mesh);
        a.mesh.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
        this.live.splice(i, 1);
      }
    }

    // splat bits
    for (let i = this.splats.length - 1; i >= 0; i--) {
      const s = this.splats[i];
      s.vel.y -= GRAVITY * dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      s.life -= dt;
      s.mesh.material.opacity = Math.max(0, s.life / 0.7);
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
        this.splats.splice(i, 1);
      }
    }
  }
}
