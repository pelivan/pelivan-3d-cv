// Wooden story signs along the orchard path, with canvas-painted CV content.
import * as THREE from 'three';
import { woodTexture } from './textures.js';
import { CV } from './cv-data.js';

const ROUND = "'Fredoka', 'Trebuchet MS', sans-serif";
const HAND = "'Caveat', 'Segoe Script', cursive";
const BODY = "'Nunito', Arial, sans-serif";

const INK = '#4a3826';
const SOFT = '#75614a';
const LEAF = '#356026';
const APPLE = '#c2402f';

function paperBackground(ctx, w, h) {
  ctx.fillStyle = '#f3e7c8';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(120, 95, 60, ${Math.random() * 0.06})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  // rounded painted border
  ctx.strokeStyle = LEAF;
  ctx.lineWidth = 7;
  roundRect(ctx, 16, 16, w - 32, h - 32, 18);
  ctx.stroke();
  ctx.strokeStyle = APPLE;
  ctx.lineWidth = 2;
  roundRect(ctx, 28, 28, w - 56, h - 56, 12);
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function header(ctx, w, title, sub) {
  ctx.fillStyle = LEAF;
  ctx.font = `52px ${ROUND}`;
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, 92);
  if (sub) {
    ctx.font = `26px ${HAND}`;
    ctx.fillStyle = APPLE;
    ctx.fillText(sub, w / 2, 124);
  }
  ctx.strokeStyle = 'rgba(120, 95, 60, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 142);
  ctx.lineTo(w - 70, 142);
  ctx.stroke();
  ctx.textAlign = 'left';
}

// a little painted apple badge in a corner
function appleBadge(ctx, x, y, r = 22) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = APPLE;
  ctx.beginPath();
  ctx.arc(-r * 0.4, 0, r, 0, 7);
  ctx.arc(r * 0.4, 0, r, 0, 7);
  ctx.fill();
  ctx.strokeStyle = '#6b3a1c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7);
  ctx.lineTo(2, -r * 1.4);
  ctx.stroke();
  ctx.fillStyle = LEAF;
  ctx.beginPath();
  ctx.ellipse(10, -r * 1.2, 9, 5, -0.6, 0, 7);
  ctx.fill();
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}

function paintProfile(ctx, w, h) {
  paperBackground(ctx, w, h);
  header(ctx, w, 'About Ivan', 'the gardener of this orchard');

  // friendly avatar: a sun-and-sapling roundel
  const px = 150, py = 290;
  ctx.fillStyle = '#fbf1d5';
  roundRect(ctx, px - 95, py - 110, 190, 220, 16);
  ctx.fill();
  ctx.strokeStyle = LEAF;
  ctx.lineWidth = 3;
  roundRect(ctx, px - 95, py - 110, 190, 220, 16);
  ctx.stroke();
  // sun
  ctx.fillStyle = '#e6a93c';
  ctx.beginPath();
  ctx.arc(px, py - 50, 30, 0, 7);
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.strokeStyle = '#e6a93c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(a) * 38, py - 50 + Math.sin(a) * 38);
    ctx.lineTo(px + Math.cos(a) * 50, py - 50 + Math.sin(a) * 50);
    ctx.stroke();
  }
  // little tree
  ctx.fillStyle = '#6e4f33';
  ctx.fillRect(px - 5, py + 10, 10, 50);
  ctx.fillStyle = LEAF;
  ctx.beginPath();
  ctx.arc(px, py + 6, 30, 0, 7);
  ctx.fill();
  ctx.fillStyle = APPLE;
  ctx.beginPath();
  ctx.arc(px - 12, py + 4, 5, 0, 7);
  ctx.arc(px + 14, py - 6, 5, 0, 7);
  ctx.fill();

  // identity block
  const lx = 300;
  let y = 215;
  ctx.fillStyle = LEAF;
  ctx.font = `40px ${ROUND}`;
  ctx.fillText(CV.name, lx, y);
  y += 42;
  ctx.font = `24px ${BODY}`;
  ctx.fillStyle = SOFT;
  ctx.fillText(`${CV.title} · ${CV.company}`, lx, y);
  y += 32;
  ctx.fillText(`📍 ${CV.location}`, lx, y);
  y += 32;
  ctx.fillText(`✉ ${CV.email}`, lx, y);
  y += 32;
  ctx.fillText(`◷ ${CV.github}`, lx, y);
  y += 32;
  ctx.fillText(`in ${CV.linkedin}`, lx, y);

  // summary
  y = 490;
  ctx.font = `26px ${ROUND}`;
  ctx.fillStyle = LEAF;
  ctx.fillText('A little about me', 70, y);
  y += 38;
  ctx.font = `24px ${BODY}`;
  ctx.fillStyle = INK;
  wrapText(ctx, CV.summary, 70, y, w - 150, 32);

  appleBadge(ctx, w - 90, 200);
}

function paintExperience(ctx, w, h) {
  paperBackground(ctx, w, h);
  header(ctx, w, 'My Story', 'where I’ve grown things');
  let y = 200;
  for (const job of CV.experience) {
    ctx.font = `30px ${ROUND}`;
    ctx.fillStyle = LEAF;
    ctx.fillText(job.role, 70, y);
    ctx.font = `24px ${HAND}`;
    ctx.fillStyle = APPLE;
    ctx.textAlign = 'right';
    ctx.fillText(job.period, w - 70, y);
    ctx.textAlign = 'left';
    y += 32;
    ctx.font = `23px ${BODY}`;
    ctx.fillStyle = SOFT;
    ctx.fillText(job.org, 70, y);
    y += 36;
    ctx.fillStyle = INK;
    for (const p of job.points) {
      ctx.fillStyle = APPLE;
      ctx.fillText('•', 84, y);
      ctx.fillStyle = INK;
      y = wrapText(ctx, p, 108, y, w - 200, 30);
    }
    y += 26;
  }
  ctx.strokeStyle = 'rgba(120,95,60,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, y - 10);
  ctx.lineTo(w - 70, y - 10);
  ctx.stroke();
  y += 24;
  ctx.font = `26px ${ROUND}`;
  ctx.fillStyle = LEAF;
  ctx.fillText('Where I learned', 70, y);
  y += 34;
  ctx.font = `22px ${BODY}`;
  ctx.fillStyle = INK;
  for (const e of CV.education) {
    y = wrapText(ctx, `${e.school} (${e.period}) — ${e.note}`, 70, y, w - 150, 28);
  }
  appleBadge(ctx, w - 90, 660);
}

function paintSkills(ctx, w, h) {
  paperBackground(ctx, w, h);
  header(ctx, w, 'What I Tinker With', 'tools of the trade');
  const cols = Object.entries(CV.skills);
  const colW = (w - 140) / cols.length;
  cols.forEach(([group, items], i) => {
    const x = 70 + i * colW;
    let y = 210;
    ctx.font = `22px ${ROUND}`;
    ctx.fillStyle = LEAF;
    ctx.fillText(group, x, y);
    ctx.strokeStyle = 'rgba(196,64,47,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x + colW - 50, y + 10);
    ctx.stroke();
    y += 48;
    ctx.font = `23px ${BODY}`;
    for (const item of items) {
      ctx.fillStyle = APPLE;
      ctx.fillText('🍎', x, y);
      ctx.fillStyle = INK;
      ctx.fillText(item, x + 34, y);
      y += 38;
    }
  });
  let y = 500;
  ctx.font = `26px ${ROUND}`;
  ctx.fillStyle = LEAF;
  ctx.fillText('Languages I speak', 70, y);
  ctx.font = `24px ${BODY}`;
  ctx.fillStyle = INK;
  y += 36;
  ctx.fillText(CV.languages.join('   ·   '), 70, y);
  appleBadge(ctx, w - 90, 200);
}

function paintRangeSign(ctx, w, h) {
  paperBackground(ctx, w, h);
  ctx.fillStyle = APPLE;
  ctx.font = `60px ${ROUND}`;
  ctx.textAlign = 'center';
  ctx.fillText('The Apple Toss', w / 2, 120);
  ctx.fillStyle = LEAF;
  ctx.font = `30px ${HAND}`;
  ctx.fillText('knock the cans, hear the stories', w / 2, 165);
  ctx.font = `25px ${BODY}`;
  ctx.fillStyle = INK;
  const lines = [
    `There are ${CV.achievements.length} old tin cans on the fence rail.`,
    'Grab apples from the basket, take aim,',
    'and lob one at each can.',
    '',
    'Every can you knock off shares a little',
    'story about what I’ve done.',
  ];
  let y = 225;
  for (const l of lines) {
    ctx.fillText(l, w / 2, y);
    y += 38;
  }
  ctx.textAlign = 'left';
  appleBadge(ctx, w / 2, 470, 26);
}

function paintColophon(ctx, w, h) {
  paperBackground(ctx, w, h);
  header(ctx, w, CV.colophon.title, CV.colophon.subtitle);
  let y = 200;
  ctx.font = `25px ${BODY}`;
  for (const line of CV.colophon.lines) {
    if (line.startsWith('•')) {
      ctx.fillStyle = APPLE;
      ctx.fillText('🍎', 84, y);
      ctx.fillStyle = INK;
      y = wrapText(ctx, line.slice(1).trim(), 120, y, w - 220, 32);
    } else if (line.endsWith(':')) {
      ctx.font = `26px ${ROUND}`;
      ctx.fillStyle = LEAF;
      ctx.fillText(line, 70, y);
      ctx.font = `25px ${BODY}`;
      y += 36;
    } else {
      ctx.fillStyle = INK;
      y = wrapText(ctx, line, 70, y, w - 150, line ? 32 : 18);
    }
  }
  appleBadge(ctx, w - 90, 660);
}

const PAINTERS = {
  profile: { paint: paintProfile, aspect: [1024, 768] },
  experience: { paint: paintExperience, aspect: [1024, 768] },
  skills: { paint: paintSkills, aspect: [1024, 640] },
  range: { paint: paintRangeSign, aspect: [900, 560] },
  colophon: { paint: paintColophon, aspect: [1024, 768] },
};

export function buildBoard(kind, width = 4) {
  const { paint, aspect } = PAINTERS[kind];
  const [cw, ch] = aspect;
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  paint(c.getContext('2d'), cw, ch);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const height = width * (ch / cw);
  const group = new THREE.Group();

  const wood = woodTexture('#a07a4c');
  const frameMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.85 });

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.3, height + 0.3, 0.1),
    frameMat
  );
  panel.position.y = height / 2 + 1.0;
  panel.castShadow = true;
  panel.receiveShadow = true;
  group.add(panel);

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })
  );
  face.position.set(0, height / 2 + 1.0, 0.06);
  group.add(face);

  const legGeo = new THREE.BoxGeometry(0.18, height + 1.6, 0.18);
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, frameMat);
    leg.position.set((sx * (width + 0.1)) / 2, (height + 1.6) / 2 - 0.3, -0.12);
    leg.castShadow = true;
    group.add(leg);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(width + 0.7, 0.22, 0.22), frameMat);
  beam.position.set(0, height + 1.18, -0.12);
  beam.castShadow = true;
  group.add(beam);

  group.userData.collider = { hw: width / 2 + 0.35, hd: 0.5 };
  return group;
}
