// ===== NEURAL NETWORK + ROTATING RINGS =====
const canvas = document.getElementById('particles');
const ctx    = canvas.getContext('2d');
let W, H;
const pointer = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0
};

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); buildNet(); });
window.addEventListener('pointermove', (e) => {
  pointer.targetX = (e.clientX / W - 0.5) * 2;
  pointer.targetY = (e.clientY / H - 0.5) * 2;
});
window.addEventListener('pointerleave', () => {
  pointer.targetX = 0;
  pointer.targetY = 0;
});
window.addEventListener('blur', () => {
  pointer.targetX = 0;
  pointer.targetY = 0;
});

function updatePointer() {
  pointer.x += (pointer.targetX - pointer.x) * 0.06;
  pointer.y += (pointer.targetY - pointer.y) * 0.06;
}

/* ── 5-colour palette: vivid but theme-matched ── */
const COLS = [
  '168,  85, 247',   // bright purple
  '232, 121, 249',   // hot pink
  '192, 132, 252',   // lavender
  '124,  58, 237',   // deep violet
  '250, 170, 255',   // pale pink-purple
];

/* ══════════════════════
   NEURAL NETWORK
══════════════════════ */
const NODE_COUNT   = 55;
const CONNECT_DIST = 140;
let nodes = [], pulses = [];

class NetNode {
  constructor() { this.spawn(); }
  spawn() {
    this.x     = Math.random() * W;
    this.y     = Math.random() * H;
    this.vx    = (Math.random() - .5) * .3;
    this.vy    = (Math.random() - .5) * .3;
    this.r     = 1.5 + Math.random() * 1.8;
    this.col   = COLS[Math.random() * COLS.length | 0];
    this.phase = Math.random() * Math.PI * 2;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.phase += .016;
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;
  }
  draw() {
    /* vivid solid dot with strong opacity */
    const pulse = .75 + .25 * Math.sin(this.phase);
    ctx.fillStyle = `rgba(${this.col}, ${.85 + .15 * pulse})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, (this.r + 1) * pulse, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* Small dot that travels along an edge */
class Pulse {
  constructor(a, b) {
    this.a   = a; this.b = b;
    this.t   = 0;
    this.spd = .007 + Math.random() * .010;
    this.col = COLS[Math.random() * COLS.length | 0];
  }
  update() { this.t += this.spd; return this.t < 1; }
  draw() {
    /* bright vivid dot travelling along edge */
    const aX = this.a.x + pointer.x * (6 + this.a.r * 4.2);
    const aY = this.a.y + pointer.y * (6 + this.a.r * 4.2);
    const bX = this.b.x + pointer.x * (6 + this.b.r * 4.2);
    const bY = this.b.y + pointer.y * (6 + this.b.r * 4.2);
    const x = aX + (bX - aX) * this.t;
    const y = aY + (bY - aY) * this.t;
    ctx.fillStyle = `rgba(${this.col}, .95)`;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function buildNet() {
  nodes  = Array.from({ length: NODE_COUNT }, () => new NetNode());
  pulses = [];
}
buildNet();

function drawNet() {
  /* edges — visible lines with stronger alpha */
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < CONNECT_DIST) {
        const a = (1 - d / CONNECT_DIST) * .55;
        const aX = nodes[i].x + pointer.x * (6 + nodes[i].r * 4.2);
        const aY = nodes[i].y + pointer.y * (6 + nodes[i].r * 4.2);
        const bX = nodes[j].x + pointer.x * (6 + nodes[j].r * 4.2);
        const bY = nodes[j].y + pointer.y * (6 + nodes[j].r * 4.2);
        ctx.strokeStyle = `rgba(${nodes[i].col}, ${a})`;
        ctx.lineWidth   = 1.1;
        ctx.beginPath();
        ctx.moveTo(aX, aY);
        ctx.lineTo(bX, bY);
        ctx.stroke();
      }
    }
  }

  /* travelling pulses */
  pulses = pulses.filter(p => {
    const alive = p.update();
    const d = Math.hypot(p.a.x - p.b.x, p.a.y - p.b.y);
    if (d < CONNECT_DIST) p.draw();
    return alive;
  });
  if (Math.random() < .035 && pulses.length < 25) {
    const a = nodes[Math.random() * nodes.length | 0];
    const b = nodes[Math.random() * nodes.length | 0];
    if (a !== b) pulses.push(new Pulse(a, b));
  }

  nodes.forEach(n => { n.update(); n.draw(); });
}

/* ══════════════════════
   ROTATING DASHED RINGS
══════════════════════ */
const rings = [
  { xP:.18, yP:.22, r:150, spd: .00022, phase:0.0, col:'160,100,240', lw:1.0, alpha:.20, dash:[16,10], parallax:.24 },
  { xP:.82, yP:.72, r:200, spd:-.00016, phase:2.1, col:'100, 60,200', lw:.85, alpha:.16, dash:[22,14], parallax:.18 },
  { xP:.50, yP:.50, r:265, spd: .00013, phase:4.5, col:'200,110,255', lw:.7,  alpha:.11, dash:[12, 8], parallax:.14 },
  { xP:.14, yP:.76, r:115, spd:-.00028, phase:1.3, col:'220,150,255', lw:.9,  alpha:.18, dash:[10, 7], parallax:.28 },
  { xP:.87, yP:.22, r:135, spd: .00020, phase:3.7, col:'170, 80,210', lw:.8,  alpha:.15, dash:[18,11], parallax:.22 },
];
let tick = 0;

function drawRings() {
  rings.forEach(rng => {
    const cx = W * rng.xP + Math.sin(tick * .00011 + rng.phase) * W * .055 + pointer.x * W * rng.parallax * .06;
    const cy = H * rng.yP + Math.cos(tick * .000095 + rng.phase * 1.3) * H * .055 + pointer.y * H * rng.parallax * .06;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tick * rng.spd);

    /* clean dashed stroke — no glow fill at all */
    ctx.setLineDash(rng.dash);
    ctx.strokeStyle = `rgba(${rng.col}, ${rng.alpha})`;
    ctx.lineWidth   = rng.lw;
    ctx.beginPath();
    ctx.arc(0, 0, rng.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  });
}

/* ══════════════════════
   MAIN LOOP
══════════════════════ */
function animate() {
  updatePointer();

  ctx.fillStyle = '#0d0118';
  ctx.fillRect(0, 0, W, H);

  drawRings();
  drawNet();

  tick++;
  requestAnimationFrame(animate);
}
animate();

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

document.getElementById('navToggle').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('open');
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.remove('open');
  });
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ===== REVEAL ON SCROLL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('revealed'), i * 80);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

// ===== HERO TYPING EFFECT =====
window.addEventListener('load', () => {
  document.querySelectorAll('[data-reveal]').forEach((el, i) => {
    if (el.closest('#hero')) {
      setTimeout(() => el.classList.add('revealed'), 200 + i * 150);
    }
  });
});

// ===== CONTACT FORM =====
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  const note = document.getElementById('formNote');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  // Build mailto link from form data
  const name = this.querySelector('input[type="text"]').value;
  const email = this.querySelector('input[type="email"]').value;
  const subject = this.querySelectorAll('input[type="text"]')[1]?.value || 'Portfolio Inquiry';
  const message = this.querySelector('textarea').value;

  const mailtoLink = `mailto:umapriyankasubramanyam@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;

  setTimeout(() => {
    window.location.href = mailtoLink;
    btn.textContent = 'Send Message ✉️';
    btn.disabled = false;
    note.textContent = '✅ Your email client will open to send this message!';
    setTimeout(() => note.textContent = '', 5000);
  }, 800);
});

// ===== COUNTER ANIMATION =====
function animateCounter(el, target, suffix = '') {
  let current = 0;
  const duration = 1500;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Number.isInteger(target) ? Math.floor(current) + suffix : current.toFixed(1) + suffix;
    if (current >= target) clearInterval(timer);
  }, 16);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const nums = entry.target.querySelectorAll('.stat-num');
      nums.forEach(num => {
        const val = parseFloat(num.textContent);
        animateCounter(num, val, num.textContent.replace(/[\d.]/g, ''));
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ===== CURSOR GLOW (desktop only) =====
if (window.matchMedia('(pointer: fine)').matches) {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed; width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%);
    border-radius: 50%; pointer-events: none; z-index: 0;
    transform: translate(-50%, -50%); transition: all 0.15s ease;
  `;
  document.body.appendChild(glow);
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}
