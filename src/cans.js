// Tin cans on a fence rail. An apple impact knocks one off; each downed can
// reveals an achievement.
import * as THREE from 'three';
import { metalTexture, canLabelTexture, woodTexture } from './textures.js';
import { CV } from './cv-data.js';

const CAN_R = 0.13;
const CAN_H = 0.34;
const GRAVITY = 16;

const LABEL_HUES = ['#c8402f', '#3f6b2a', '#e6a93c', '#4a6fa5', '#a5478a', '#c87f2f'];
const LABEL_WORDS = ['APPLES', 'CIDER', 'JAM', 'HONEY', 'PEARS', 'PRESERVE'];

export class CanRange {
  constructor(scene, line) {
    this.scene = scene;
    this.cans = [];
    this.hitCount = 0;
    this.onHit = null; // (index, achievement, remaining) => {}
    this.onAllDown = null;

    const group = new THREE.Group();
    scene.add(group);
    this.group = group;

    const railY = line.railY ?? 1.0;
    const metalMat = new THREE.MeshStandardMaterial({ map: metalTexture(), roughness: 0.4, metalness: 0.7 });

    // the fence rail the cans sit on
    const railMat = new THREE.MeshStandardMaterial({ map: woodTexture('#9c7748'), roughness: 0.85 });
    const railLen = line.gap * (line.count + 1);
    const railCx = line.xStart + (line.count - 1) * line.gap / 2;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(railLen, 0.12, 0.32), railMat);
    rail.position.set(railCx, railY - 0.06, line.z);
    rail.castShadow = true;
    rail.receiveShadow = true;
    group.add(rail);
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, railY + 0.1, 8), railMat);
      post.position.set(railCx + sx * railLen / 2, (railY) / 2, line.z);
      post.castShadow = true;
      group.add(post);
    }

    for (let i = 0; i < line.count; i++) {
      const x = line.xStart + i * line.gap;
      const can = new THREE.Group();

      const body = new THREE.Mesh(new THREE.CylinderGeometry(CAN_R, CAN_R, CAN_H, 16), metalMat);
      can.add(body);
      // paper label
      const label = new THREE.Mesh(
        new THREE.CylinderGeometry(CAN_R + 0.004, CAN_R + 0.004, CAN_H * 0.62, 16, 1, true),
        new THREE.MeshStandardMaterial({
          map: canLabelTexture(LABEL_HUES[i % LABEL_HUES.length], LABEL_WORDS[i % LABEL_WORDS.length]),
          roughness: 0.8,
        })
      );
      can.add(label);
      // rims
      for (const ry of [CAN_H / 2, -CAN_H / 2]) {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(CAN_R, 0.012, 6, 16), metalMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = ry;
        can.add(rim);
      }
      can.traverse((o) => {
        if (o.isMesh) o.castShadow = true;
      });

      can.position.set(x, railY + CAN_H / 2, line.z);
      group.add(can);

      this.cans.push({
        mesh: can,
        index: i,
        state: 'up', // 'up' | 'falling' | 'down'
        hitCenter: can.position.clone(),
        vel: new THREE.Vector3(),
        spin: new THREE.Vector3(),
      });
    }
  }

  standing() {
    return this.cans.filter((c) => c.state === 'up');
  }

  knock(can, fromDir) {
    if (can.state !== 'up') return null;
    can.state = 'falling';
    // fling backwards off the rail with a bit of randomness
    const away = fromDir ? fromDir.clone().setY(0).normalize() : new THREE.Vector3(0, 0, -1);
    can.vel.set(
      away.x * 2 + (Math.random() - 0.5) * 1.5,
      2 + Math.random() * 1.5,
      away.z * 2 + (Math.random() - 0.5) * 1.5
    );
    can.spin.set((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 18);

    this.hitCount++;
    const achievement = CV.achievements[can.index % CV.achievements.length];
    const remaining = this.cans.length - this.hitCount;
    if (this.onHit) this.onHit(can.index, achievement, remaining);
    if (remaining === 0 && this.onAllDown) this.onAllDown();
    return achievement;
  }

  update(dt) {
    for (const can of this.cans) {
      if (can.state !== 'falling') continue;
      can.vel.y -= GRAVITY * dt;
      can.mesh.position.addScaledVector(can.vel, dt);
      can.mesh.rotation.x += can.spin.x * dt;
      can.mesh.rotation.y += can.spin.y * dt;
      can.mesh.rotation.z += can.spin.z * dt;
      if (can.mesh.position.y <= CAN_R) {
        can.mesh.position.y = CAN_R;
        if (Math.abs(can.vel.y) > 1.2) {
          can.vel.y = -can.vel.y * 0.4; // small bounce
          can.vel.x *= 0.6;
          can.vel.z *= 0.6;
          can.spin.multiplyScalar(0.5);
        } else {
          can.vel.set(0, 0, 0);
          can.spin.set(0, 0, 0);
          can.state = 'down';
        }
      }
    }
  }
}
