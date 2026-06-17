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

  // ---- HELPER: wireframe mesh ----
  function wireMesh(geo, color, opacity) {
    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color, wireframe: true, transparent: true, opacity,
    }));
  }

  // ---- FLOATING OBJECTS ----
  // 1. Large torus — left
  const torus1 = wireMesh(new THREE.TorusGeometry(1.3, 0.018, 24, 100), 0xD4AF37, 0.45);
  torus1.position.set(-4.5, 1.5, -4);
  scene.add(torus1);

  // 2. Medium torus — right
  const torus2 = wireMesh(new THREE.TorusGeometry(0.8, 0.014, 16, 70), 0xF5D97D, 0.35);
  torus2.position.set(4.8, -1.2, -2.5);
  torus2.rotation.x = 0.8;
  scene.add(torus2);

  // 3. Icosahedron — top right
  const ico = wireMesh(new THREE.IcosahedronGeometry(0.9, 1), 0xD4AF37, 0.28);
  ico.position.set(4, 2.8, -5);
  scene.add(ico);

  // 4. Octahedron — bottom left
  const oct = wireMesh(new THREE.OctahedronGeometry(0.75), 0xF5D97D, 0.30);
  oct.position.set(-4.5, -2.5, -3);
  scene.add(oct);

  // 5. Dodecahedron — top center
  const dod = wireMesh(new THREE.DodecahedronGeometry(0.65), 0xD4AF37, 0.22);
  dod.position.set(1, 3.5, -6);
  scene.add(dod);

  // 6. Outer ring — center back
  const ring = wireMesh(new THREE.TorusGeometry(2.4, 0.01, 3, 120), 0xD4AF37, 0.12);
  ring.position.set(0, 0, -8);
  scene.add(ring);

  // 7. Tetrahedron
  const tet = wireMesh(new THREE.TetrahedronGeometry(0.7), 0xF5D97D, 0.25);
  tet.position.set(-2, 3, -4);
  scene.add(tet);

  // 8. Small torus — bottom right
  const torus3 = wireMesh(new THREE.TorusGeometry(0.5, 0.012, 12, 50), 0xD4AF37, 0.30);
  torus3.position.set(3, -3.2, -3);
  scene.add(torus3);

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

    // Geometric objects
    torus1.rotation.x = t * 0.22;
    torus1.rotation.y = t * 0.15;
    torus1.position.y = 1.5 + Math.sin(t * 0.4) * 0.35;

    torus2.rotation.z = t * 0.35;
    torus2.rotation.x = 0.8 + t * 0.18;
    torus2.position.y = -1.2 + Math.sin(t * 0.5 + 1) * 0.3;

    ico.rotation.x = t * 0.28;
    ico.rotation.y = t * 0.22;
    ico.position.y = 2.8 + Math.sin(t * 0.38 + 0.5) * 0.4;

    oct.rotation.x = t * 0.18;
    oct.rotation.z = t * 0.25;
    oct.position.y = -2.5 + Math.sin(t * 0.55 + 2) * 0.3;

    dod.rotation.y = t * 0.32;
    dod.rotation.x = t * 0.20;
    dod.position.y = 3.5 + Math.sin(t * 0.28 + 0.8) * 0.5;

    tet.rotation.y = t * 0.40;
    tet.rotation.z = t * 0.22;
    tet.position.y = 3 + Math.sin(t * 0.45 + 1.2) * 0.35;

    torus3.rotation.z = t * 0.55;
    torus3.position.y = -3.2 + Math.sin(t * 0.60 + 0.3) * 0.25;

    ring.rotation.x = t * 0.08;
    ring.rotation.z = t * 0.05;

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
