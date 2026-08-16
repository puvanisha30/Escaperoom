// ============================================================
// PARTICLE SYSTEM — canvas-based atmospheric effects.
// One reusable engine drives dust motes, fireflies, embers, fog
// wisps, and rain depending on the room's theme.
// ============================================================

class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.mode = "dust";
    this.running = false;
    this._resize = this._resize.bind(this);
    this._tick = this._tick.bind(this);
    window.addEventListener("resize", this._resize);
    this._resize();
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  setMode(mode, density = 60) {
    this.mode = mode;
    this.particles = [];
    const w = this.canvas.width, h = this.canvas.height;
    for (let i = 0; i < density; i++) {
      this.particles.push(this._spawn(w, h));
    }
  }

  _spawn(w, h) {
    const base = { x: Math.random() * w, y: Math.random() * h };
    switch (this.mode) {
      case "fireflies":
        return { ...base, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: 1.5 + Math.random() * 2, hue: 50, phase: Math.random() * Math.PI * 2 };
      case "embers":
        return { ...base, y: h + Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: -0.4 - Math.random() * 0.8, r: 1 + Math.random() * 2, hue: 20 };
      case "fog":
        return { ...base, vx: 0.05 + Math.random() * 0.15, vy: 0, r: 60 + Math.random() * 90, hue: 0 };
      case "snowRain":
        return { ...base, vx: -0.2, vy: 2 + Math.random() * 2, r: 1 + Math.random(), hue: 210 };
      case "leaves":
        return { ...base, vx: (Math.random() - 0.5) * 0.6, vy: 0.3 + Math.random() * 0.5, r: 3 + Math.random() * 2, hue: 40, phase: Math.random() * Math.PI * 2 };
      default: // dust
        return { ...base, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, r: 0.8 + Math.random() * 1.5, hue: 45 };
    }
  }

  start() { if (!this.running) { this.running = true; requestAnimationFrame(this._tick); } }
  stop() { this.running = false; }

  _tick() {
    if (!this.running) return;
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.phase !== undefined) { p.phase += 0.02; p.x += Math.sin(p.phase) * 0.3; }
      if (p.x < -50) p.x = w + 50; if (p.x > w + 50) p.x = -50;
      if (p.y < -100) p.y = h + 100; if (p.y > h + 100) p.y = -100;

      if (this.mode === "fog") {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, "rgba(200,200,220,0.06)");
        grad.addColorStop(1, "rgba(200,200,220,0)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      } else if (this.mode === "fireflies") {
        const glow = 0.5 + Math.sin(p.phase || 0) * 0.5;
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${0.3 + glow * 0.5})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + glow * 0.5), 0, Math.PI * 2); ctx.fill();
      } else if (this.mode === "embers") {
        ctx.fillStyle = `hsla(${p.hue}, 100%, 55%, 0.8)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      } else if (this.mode === "snowRain") {
        ctx.strokeStyle = `hsla(${p.hue}, 60%, 85%, 0.5)`;
        ctx.lineWidth = p.r;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3, p.y - 8); ctx.stroke();
      } else if (this.mode === "leaves") {
        ctx.fillStyle = `hsla(${p.hue}, 70%, 45%, 0.7)`;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.5, p.phase || 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, 0.5)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    });
    requestAnimationFrame(this._tick);
  }
}

window.ParticleField = ParticleField;
