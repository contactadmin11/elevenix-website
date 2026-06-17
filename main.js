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

  // ---- ANAMORPHIC BREAKOUT: HOLOGRAPHIC SEAL ----
  const sealGroup = new THREE.Group();
  
  // Outer metallic rim
  const rimGeo = new THREE.TorusGeometry(1.8, 0.1, 16, 100);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37, metalness: 0.8, roughness: 0.2
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  sealGroup.add(rim);

  // Inner glass body
  const bodyGeo = new THREE.CylinderGeometry(1.7, 1.7, 0.05, 64);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x0A0F1C,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.8,
    transmission: 0.9,
    ior: 1.5
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  sealGroup.add(body);

  // Inner wireframe detail
  const wireGeo = new THREE.TorusGeometry(1.4, 0.02, 16, 64);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xB87333, wireframe: true, transparent: true, opacity: 0.5 });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  sealGroup.add(wire);

  sealGroup.position.set(2, 0.5, 0); // Offset to the right
  scene.add(sealGroup);

  // Lighting
  const light = new THREE.PointLight(0xD4AF37, 2, 50);
  light.position.set(5, 5, 5);
  scene.add(light);
  const greenLight = new THREE.PointLight(0x10B981, 1.5, 50);
  greenLight.position.set(-5, -5, 2);
  scene.add(greenLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  // Removed Data City per user request

  // ---- FOOTER CHAKRA RING ----
  const chakraGeo = new THREE.TorusKnotGeometry(2.5, 0.1, 128, 32);
  const chakraMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, wireframe: true, transparent: true, opacity: 0.2 });
  const chakra = new THREE.Mesh(chakraGeo, chakraMat);
  chakra.position.set(0, -1, -12);
  scene.add(chakra);
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

  // ---- NATIVE SCROLL-BASED DEPTH ----
  let scrollY = 0;
  let scrollProgress = 0;

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    // Calculate scroll progress (0 to 1) based on document height
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = Math.max(0, Math.min(1, maxScroll > 0 ? scrollY / maxScroll : 0));
  }, { passive: true });

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

    // Anamorphic Breakout Updates
    // Holographic Seal Parallax (reacts to mouse)
    sealGroup.rotation.y = mouseX * 0.5 + t * 0.2;
    sealGroup.rotation.x = mouseY * 0.5 + Math.sin(t * 0.5) * 0.1;
    sealGroup.position.y = 0.5 + Math.sin(t * 0.8) * 0.2;
    

    
    // Chakra slow rotation
    chakra.rotation.z = t * 0.1;
    chakra.rotation.x = t * 0.05;

    closeParticles.rotation.y = t * 0.05;
    closeParticles.rotation.x = t * 0.03;

    // Camera fly-through + parallax
    camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.025;
    camera.position.y += (-mouseY * 0.4 - camera.position.y) * 0.025;
    
    // Aggressive 3D fly-through based on scroll!
    // Start at Z=6, fly deep into the scene past the Chakra
    camera.position.z = 6 - (scrollProgress * 18);
    
    // Subtle rotation mapping
    camera.rotation.z = scrollProgress * Math.PI * 0.1;
    
    // Look at center, but offset by mouse
    const lookTarget = new THREE.Vector3(mouseX * 0.2, -mouseY * 0.2, camera.position.z - 5);
    camera.lookAt(lookTarget);

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
  // GSAP SCROLL REVEAL - "CARD DEALING" ANAMORPHIC EFFECT
  // --------------------------------------------------------
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray('section').forEach((section) => {
    const elements = section.querySelectorAll('.section-title, .section-subtitle, .svc-card, .sw-card, .why-card, .contact-item, .contact-form');
    if (elements.length === 0) return;

    // "Dealing Cards" 3D Flip Animation
    gsap.fromTo(elements, 
      { y: 150, z: -500, opacity: 0, rotationX: 90, scale: 0.8, transformPerspective: 1200 },
      {
        y: 0,
        z: 0,
        opacity: 1,
        rotationX: 0,
        scale: 1,
        duration: 1.4,
        stagger: 0.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          end: "bottom 15%",
          toggleActions: "play none none reverse"
        }
      }
    );
  });

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
