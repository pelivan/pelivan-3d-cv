// Procedural canvas textures — no external assets needed.
import * as THREE from 'three';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function noise(ctx, w, h, alpha) {
  for (let i = 0; i < (w * h) / 16; i++) {
    const v = Math.floor(Math.random() * 60);
    ctx.fillStyle = `rgba(${v}, ${v}, ${v}, ${alpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

function makeTexture(c, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function grassTexture(repeat = 36) {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6fa83f';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    const g = 130 + Math.random() * 80;
    ctx.fillStyle = `rgba(${g * 0.55}, ${g}, ${g * 0.35}, 0.5)`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 1 + Math.random() * 3);
  }
  // little flowers + clover for a sunny meadow feel
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = ['#f4e36a', '#f6f2e0', '#e9a6c8'][i % 3];
    const x = Math.random() * 256, y = Math.random() * 256;
    ctx.beginPath();
    ctx.arc(x, y, 1.6 + Math.random() * 1.4, 0, 7);
    ctx.fill();
  }
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = 'rgba(60, 120, 40, 0.14)';
    ctx.beginPath();
    ctx.ellipse(Math.random() * 256, Math.random() * 256, 14 + Math.random() * 30, 8 + Math.random() * 18, Math.random() * 3, 0, 7);
    ctx.fill();
  }
  return makeTexture(c, repeat, repeat);
}

export function gravelTexture(repeat = 10) {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b7a98a';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const v = 120 + Math.random() * 90;
    ctx.fillStyle = `rgba(${v}, ${v * 0.95}, ${v * 0.8}, ${0.4 + Math.random() * 0.4})`;
    const r = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, r, 0, 7);
    ctx.fill();
  }
  noise(ctx, 256, 256, 0.1);
  return makeTexture(c, repeat, repeat);
}

export function dirtTexture(repeat = 8) {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a6f47';
  ctx.fillRect(0, 0, 256, 256);
  noise(ctx, 256, 256, 0.16);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(70, 54, 30, ${0.08 + Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 26, 4 + Math.random() * 14, Math.random() * 3, 0, 7);
    ctx.fill();
  }
  return makeTexture(c, repeat, repeat);
}

export function woodTexture(base = '#a07a4c', repeat = 2) {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  const plankH = 42;
  for (let y = 0; y < 256; y += plankH) {
    ctx.fillStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.08})`;
    ctx.fillRect(0, y, 256, 3);
    for (let i = 0; i < 24; i++) {
      const gy = y + 4 + Math.random() * (plankH - 8);
      ctx.strokeStyle = `rgba(70, 48, 22, ${0.05 + Math.random() * 0.09})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(64, gy + (Math.random() * 6 - 3), 192, gy + (Math.random() * 6 - 3), 256, gy);
      ctx.stroke();
    }
    if (Math.random() < 0.5) {
      ctx.fillStyle = 'rgba(70, 48, 22, 0.45)';
      ctx.beginPath();
      ctx.ellipse(Math.random() * 256, y + plankH / 2, 4, 6, 0, 0, 7);
      ctx.fill();
    }
  }
  noise(ctx, 256, 256, 0.05);
  return makeTexture(c, repeat, repeat);
}

export function barkTexture(repeat = 3) {
  const c = canvas(128, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6e4f33';
  ctx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = `rgba(40, 26, 14, ${0.1 + Math.random() * 0.18})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    const x = Math.random() * 128;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (Math.random() * 16 - 8), 90, x + (Math.random() * 16 - 8), 170, x + (Math.random() * 12 - 6), 256);
    ctx.stroke();
  }
  for (let i = 0; i < 30; i++) {
    ctx.strokeStyle = `rgba(150, 120, 80, ${0.08 + Math.random() * 0.1})`;
    const x = Math.random() * 128;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() * 8 - 4), 256);
    ctx.stroke();
  }
  return makeTexture(c, repeat, repeat);
}

export function leafTexture() {
  // a soft dappled canopy texture for the round tree crowns
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3f7a2c';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) {
    const g = 90 + Math.random() * 110;
    ctx.fillStyle = `rgba(${g * 0.5}, ${g}, ${g * 0.4}, 0.5)`;
    const x = Math.random() * 256, y = Math.random() * 256;
    ctx.beginPath();
    ctx.ellipse(x, y, 4 + Math.random() * 8, 3 + Math.random() * 5, Math.random() * 3, 0, 7);
    ctx.fill();
  }
  // sunlit highlights
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = 'rgba(210, 240, 150, 0.25)';
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 3 + Math.random() * 6, 0, 7);
    ctx.fill();
  }
  return makeTexture(c, 1, 1);
}

export function hayTexture() {
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d9b85e';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 700; i++) {
    ctx.strokeStyle = `rgba(${150 + Math.random() * 60}, ${120 + Math.random() * 50}, 40, 0.4)`;
    const x = Math.random() * 128, y = Math.random() * 128;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() * 14 - 7), y + (Math.random() * 6 - 3));
    ctx.stroke();
  }
  return makeTexture(c, 1, 1);
}

export function metalTexture(base = '#b9c0c4') {
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  // vertical brushed gradient
  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, '#8c9296');
  grad.addColorStop(0.5, base);
  grad.addColorStop(1, '#7d8488');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 200; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.07})`;
    const y = Math.random() * 128;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
  }
  // a couple of dents/spots
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = `rgba(90, 80, 60, ${0.05 + Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 5, 0, 7);
    ctx.fill();
  }
  return makeTexture(c, 1, 1);
}

// Wrap-around paper label for a tin can.
export function canLabelTexture(hue = '#c8402f', text = 'PELIVAN') {
  const c = canvas(256, 128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f3e7c8';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = hue;
  ctx.fillRect(0, 18, 256, 24);
  ctx.fillRect(0, 86, 256, 24);
  ctx.fillStyle = hue;
  ctx.font = "bold 30px 'Fredoka', Arial, sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 64);
  noise(ctx, 256, 128, 0.04);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
