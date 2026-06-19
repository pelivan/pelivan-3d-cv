// DOM/canvas HUD: compass, objectives, toasts, prompts, hitmarker, apple count,
// throw-charge ring.
export class Hud {
  constructor() {
    this.el = document.getElementById('hud');
    this.compass = document.getElementById('compass');
    this.cctx = this.compass.getContext('2d');
    this.charge = document.getElementById('charge');
    this.chargeCtx = this.charge.getContext('2d');
    this.objectiveList = document.getElementById('objective-list');
    this.toastEl = document.getElementById('toast');
    this.toastHead = document.getElementById('toast-head');
    this.toastBody = document.getElementById('toast-body');
    this.promptEl = document.getElementById('prompt');
    this.hitmarker = document.getElementById('hitmarker');
    this.appleCount = document.getElementById('apple-count');

    this.objectives = [];
    this.toastQueue = [];
    this.toastTimer = 0;
    this.toastShowing = false;
  }

  show() { this.el.classList.add('active'); }
  hide() { this.el.classList.remove('active'); }

  setApples(n) { this.appleCount.textContent = n; }

  flashHitmarker() {
    this.hitmarker.classList.add('show');
    clearTimeout(this._hmT);
    this._hmT = setTimeout(() => this.hitmarker.classList.remove('show'), 90);
  }

  // ---------- charge ring ----------
  // power 0..1, or null to hide
  drawCharge(power) {
    if (power == null) {
      this.charge.classList.remove('show');
      return;
    }
    this.charge.classList.add('show');
    const ctx = this.chargeCtx;
    const S = 54, c = S / 2, R = 22;
    ctx.clearRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(74,56,38,0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.stroke();
    // fill arc from top, color shifts green→gold→red as it maxes
    const hue = 120 - power * 120;
    ctx.strokeStyle = `hsl(${hue}, 75%, 50%)`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(c, c, R, -Math.PI / 2, -Math.PI / 2 + power * Math.PI * 2);
    ctx.stroke();
  }

  // ---------- objectives ----------
  addObjective(id, text) {
    this.objectives.push({ id, text, done: false });
    this.renderObjectives();
  }
  completeObjective(id) {
    const o = this.objectives.find((o) => o.id === id);
    if (o && !o.done) { o.done = true; this.renderObjectives(); }
  }
  updateObjectiveText(id, text) {
    const o = this.objectives.find((o) => o.id === id);
    if (o) { o.text = text; this.renderObjectives(); }
  }
  renderObjectives() {
    this.objectiveList.innerHTML = '';
    for (const o of this.objectives) {
      const div = document.createElement('div');
      div.className = 'item' + (o.done ? ' done' : '');
      div.textContent = (o.done ? '✔ ' : '○ ') + o.text;
      this.objectiveList.appendChild(div);
    }
  }

  // ---------- toasts ----------
  toast(head, body, duration = 3.4) {
    this.toastQueue.push({ head, body, duration });
  }
  updateToasts(dt) {
    if (this.toastShowing) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.toastEl.classList.remove('show');
        this.toastShowing = false;
        this.toastTimer = 0.45;
      }
    } else if (this.toastTimer > 0) {
      this.toastTimer -= dt;
    } else if (this.toastQueue.length) {
      const t = this.toastQueue.shift();
      this.toastHead.textContent = t.head;
      this.toastBody.textContent = t.body;
      this.toastEl.classList.add('show');
      this.toastShowing = true;
      this.toastTimer = t.duration;
    }
  }

  // ---------- prompt ----------
  setPrompt(html) {
    if (html) {
      this.promptEl.innerHTML = html;
      this.promptEl.classList.add('show');
    } else {
      this.promptEl.classList.remove('show');
    }
  }

  // ---------- compass ----------
  drawCompass(yaw, markers = []) {
    const ctx = this.cctx;
    const S = 110, cx = S / 2, cy = S / 2, R = 48;
    ctx.clearRect(0, 0, S, S);

    ctx.fillStyle = 'rgba(243, 231, 200, 0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 7);
    ctx.fill();
    ctx.strokeStyle = '#7c5a36';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 7);
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(yaw);
    const dirs = [['N', 0], ['E', Math.PI / 2], ['S', Math.PI], ['W', -Math.PI / 2]];
    ctx.font = "13px 'Fredoka', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [label, a] of dirs) {
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = label === 'N' ? '#c2402f' : '#4a3826';
      ctx.fillText(label, 0, -R + 12);
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(124, 90, 54, 0.5)';
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 6);
      ctx.beginPath();
      ctx.moveTo(0, -R + 2);
      ctx.lineTo(0, -R + 7);
      ctx.stroke();
      ctx.restore();
    }
    for (const m of markers) {
      ctx.save();
      ctx.rotate(m.angle);
      ctx.fillStyle = m.color || '#e6a93c';
      ctx.beginPath();
      ctx.moveTo(0, -R + 4);
      ctx.lineTo(5, -R + 11);
      ctx.lineTo(0, -R + 18);
      ctx.lineTo(-5, -R + 11);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // player wedge
    ctx.fillStyle = '#356026';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx + 6, cy + 7);
    ctx.lineTo(cx, cy + 3);
    ctx.lineTo(cx - 6, cy + 7);
    ctx.closePath();
    ctx.fill();
  }
}
