/* =========================================================
   ELEVEN IX — Three.js 3D Scene + UI Logic
   ========================================================= */

(function () {
  'use strict';

  // --------------------------------------------------------
  // THREE.JS SCENE
  // --------------------------------------------------------
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 6);

  // Colours
  const C_GOLD     = new THREE.Color(0xD4AF37);
  const C_GOLD_L   = new THREE.Color(0xF5D97D);
  const C_WHITE    = new THREE.Color(0xFFFFFF);
  const C_DIM      = new THREE.Color(0x333333);

  // ---- STAR / PARTICLE FIELD ----
  const STAR_COUNT = 4000;
  const starPos    = new Float32Array(STAR_COUNT * 3);
  const starColor  = new Float32Array(STAR_COUNT * 3);
  const starSize   = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    // Spread in a large sphere
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 10 + Math.random() * 60;
    starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);

    // Color: 30% gold, rest white/dim
    const roll = Math.random();
    if (roll > 0.75) {
      starColor[i * 3] = C_GOLD.r; starColor[i * 3 + 1] = C_GOLD.g; starColor[i * 3 + 2] = C_GOLD.b;
    } else if (roll > 0.55) {
      starColor[i * 3] = C_GOLD_L.r; starColor[i * 3 + 1] = C_GOLD_L.g; starColor[i * 3 + 2] = C_GOLD_L.b;
    } else {
      const b = 0.25 + Math.random() * 0.45;
      starColor[i * 3] = b; starColor[i * 3 + 1] = b; starColor[i * 3 + 2] = b;
    }
    starSize[i] = Math.random() * 1.5 + 0.3;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color',    new THREE.BufferAttribute(starColor, 3));
  starGeo.setAttribute('size',     new THREE.BufferAttribute(starSize, 1));

  const starMat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });

  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ---- TECH NETWORK GRAPH ----
  const NODE_COUNT = 120;
  const nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 15,
      z: (Math.random() - 0.5) * 10 - 2,
      vx: (Math.random() - 0.5) * 0.015,
      vy: (Math.random() - 0.5) * 0.015,
      vz: (Math.random() - 0.5) * 0.015,
    });
  }

  const netMat = new THREE.LineBasicMaterial({
    color: 0xD4AF37,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
  });

  const nodeGeo = new THREE.BufferGeometry();
  const nodePos = new Float32Array(NODE_COUNT * 3);
  const nodeMat = new THREE.PointsMaterial({
    color: 0xF5D97D,
    size: 0.06,
    transparent: true,
    opacity: 0.8
  });
  const nodePoints = new THREE.Points(nodeGeo, nodeMat);
  scene.add(nodePoints);

  const linesGeo = new THREE.BufferGeometry();
  const maxLines = 4000;
  const linePos = new Float32Array(maxLines * 6);
  linesGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lineMesh = new THREE.LineSegments(linesGeo, netMat);
  scene.add(lineMesh);
  // ---- AMBIENT PARTICLES (close, interactive) ----
  const CLOSE_COUNT = 60;
  const closePos = new Float32Array(CLOSE_COUNT * 3);
  for (let i = 0; i < CLOSE_COUNT; i++) {
    closePos[i * 3]     = (Math.random() - 0.5) * 12;
    closePos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    closePos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
  }

  const closeGeo = new THREE.BufferGeometry();
  closeGeo.setAttribute('position', new THREE.BufferAttribute(closePos, 3));

  const closeMat = new THREE.PointsMaterial({
    color: 0xD4AF37,
    size: 0.04,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
  });

  const closeParticles = new THREE.Points(closeGeo, closeMat);
  scene.add(closeParticles);

  // ---- MOUSE PARALLAX ----
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Touch support
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    targetX = (t.clientX / window.innerWidth  - 0.5) * 2;
    targetY = (t.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // ---- RESIZE ----
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // ---- SCROLL-BASED DEPTH ----
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  // ---- ANIMATION LOOP ----
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth mouse
    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;

    // Stars rotation (very slow drift)
    stars.rotation.y = t * 0.012;
    stars.rotation.x = t * 0.006;

    // Update Tech Network
    let lineIdx = 0;
    for (let i = 0; i < NODE_COUNT; i++) {
      const n1 = nodes[i];
      n1.x += n1.vx; n1.y += n1.vy; n1.z += n1.vz;

      // Bounce bounds
      if(n1.x > 10 || n1.x < -10) n1.vx *= -1;
      if(n1.y > 8 || n1.y < -8) n1.vy *= -1;
      if(n1.z > 2 || n1.z < -12) n1.vz *= -1;

      nodePos[i*3] = n1.x; nodePos[i*3+1] = n1.y; nodePos[i*3+2] = n1.z;

      for (let j = i + 1; j < NODE_COUNT; j++) {
        const n2 = nodes[j];
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dz = n1.z - n2.z;
        const distSq = dx*dx + dy*dy + dz*dz;
        
        if (distSq < 6.0 && lineIdx < maxLines * 6) {
          linePos[lineIdx++] = n1.x; linePos[lineIdx++] = n1.y; linePos[lineIdx++] = n1.z;
          linePos[lineIdx++] = n2.x; linePos[lineIdx++] = n2.y; linePos[lineIdx++] = n2.z;
        }
      }
    }
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    linesGeo.setDrawRange(0, lineIdx / 3);
    linesGeo.attributes.position.needsUpdate = true;

    closeParticles.rotation.y = t * 0.05;
    closeParticles.rotation.x = t * 0.03;

    // Camera parallax + scroll depth
    const scrollOffset = scrollY * 0.001;
    camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.025;
    camera.position.y += (-mouseY * 0.4 - camera.position.y) * 0.025;
    camera.position.z = 6 + scrollOffset * 0.5;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  animate();

  // --------------------------------------------------------
  // NAVBAR SCROLL BEHAVIOUR
  // --------------------------------------------------------
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // --------------------------------------------------------
  // HAMBURGER MENU
  // --------------------------------------------------------
  const hamburger = document.getElementById('hamburger');
  const navLinks   = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
    // Animate hamburger spans
    const [s1, s2, s3] = hamburger.querySelectorAll('span');
    if (open) {
      s1.style.transform = 'translateY(7px) rotate(45deg)';
      s2.style.opacity = '0';
      s3.style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      s1.style.transform = s2.style.opacity = s3.style.transform = '';
      s2.style.opacity = '1';
    }
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      const [s1, s2, s3] = hamburger.querySelectorAll('span');
      s1.style.transform = s2.style.opacity = s3.style.transform = '';
      s2.style.opacity = '1';
    });
  });

  // --------------------------------------------------------
  // SCROLL REVEAL
  // --------------------------------------------------------
  const revealTargets = document.querySelectorAll('.svc-card, .sw-card, .why-card, .contact-item, .contact-form');
  revealTargets.forEach(el => el.classList.add('reveal'));

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = parseInt(entry.target.dataset.delay || '0');
      setTimeout(() => entry.target.classList.add('visible'), delay);
      revealObs.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealTargets.forEach(el => revealObs.observe(el));

  // --------------------------------------------------------
  // COUNTER ANIMATION
  // --------------------------------------------------------
  function runCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 2200;
    const fps      = 60;
    const steps    = duration / (1000 / fps);
    const inc      = target / steps;
    let current    = 0;

    const timer = setInterval(() => {
      current += inc;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current);
    }, 1000 / fps);
  }

  const statsSection = document.querySelector('.hero-stats');
  const statsObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('.stat-number').forEach(runCounter);
      statsObs.unobserve(e.target);
    });
  }, { threshold: 0.6 });

  if (statsSection) statsObs.observe(statsSection);

  // --------------------------------------------------------
  // CONTACT FORM  (uses FormSubmit.co — free, no backend)
  // --------------------------------------------------------
  const form       = document.getElementById('contactForm');
  const statusDiv  = document.getElementById('formStatus');
  const submitBtn  = document.getElementById('submitBtn');
  const btnText    = document.getElementById('btnText');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusDiv.className = 'form-status';
    statusDiv.textContent = '';

    // Basic validation
    const name  = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();

    if (!name || !phone || !email) {
      statusDiv.className = 'form-status err';
      statusDiv.textContent = '⚠️ Please fill in all required fields.';
      return;
    }

    // Disable button
    submitBtn.disabled = true;
    btnText.textContent = 'Sending…';

    try {
      // FormSubmit sends form data to the configured email via AJAX
      const data = new FormData(form);
      data.append('_subject', `[Eleven IX] New Enquiry from ${name}`);
      data.append('_captcha', 'false');
      data.append('_template', 'table');

      const resp = await fetch('https://formsubmit.co/ajax/contactadmin11@gmail.com', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data,
      });

      const json = await resp.json();

      if (json.success === 'true' || json.success === true) {
        statusDiv.className = 'form-status ok';
        statusDiv.textContent = '✅ Message sent successfully! We\'ll get back to you within 24 hours.';
        form.reset();
      } else {
        throw new Error('Server responded with failure');
      }
    } catch (err) {
      statusDiv.className = 'form-status err';
      statusDiv.textContent = '❌ Something went wrong. Please email us directly at contactadmin11@gmail.com';
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Send Message';
    }
  });

  // --------------------------------------------------------
  // SMOOTH ACTIVE LINK HIGHLIGHTING
  // --------------------------------------------------------
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAnchors.forEach(a => {
          a.style.color = a.getAttribute('href') === `#${entry.target.id}` ? 'var(--gold)' : '';
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => sectionObs.observe(s));

})();
