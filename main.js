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
  const aspect = window.innerWidth / window.innerHeight;
  const d = 12; // Frustum size
  const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
  camera.position.set(20, 20, 20); // Isometric angle
  camera.lookAt(scene.position);

  // Enable Shadows
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Colours
  const C_GOLD     = new THREE.Color(0xD4AF37);
  const C_GOLD_L   = new THREE.Color(0xF5D97D);
  const C_WHITE    = new THREE.Color(0xFFFFFF);
  const C_DIM      = new THREE.Color(0x333333);

  // ---- ISOMETRIC FACTORY SCENE ----
  const factoryGroup = new THREE.Group();
  scene.add(factoryGroup);

  // Floor plane (receives shadows)
  const floorGeo = new THREE.PlaneGeometry(200, 200);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x0A0F1C, roughness: 0.1, metalness: 0.1 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4;
  floor.receiveShadow = true;
  factoryGroup.add(floor);

  // Conveyor Belt Base
  const beltGeo = new THREE.BoxGeometry(30, 0.5, 4);
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x1E1E1E, roughness: 0.8 });
  const belt = new THREE.Mesh(beltGeo, beltMat);
  belt.position.set(0, -2, 6);
  belt.castShadow = true;
  belt.receiveShadow = true;
  factoryGroup.add(belt);

  // Moving Boxes Array (Packages)
  const boxes = [];
  const boxGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
  const boxMats = [
    new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.4 }), // Gold
    new THREE.MeshStandardMaterial({ color: 0xB87333, roughness: 0.4 }), // Copper
    new THREE.MeshStandardMaterial({ color: 0x10B981, roughness: 0.4 }), // Green
  ];

  for(let i=0; i<6; i++) {
    const box = new THREE.Mesh(boxGeo, boxMats[i % 3]);
    box.position.set(-15 + (i * 5), -0.8, 6);
    box.castShadow = true;
    box.receiveShadow = true;
    factoryGroup.add(box);
    boxes.push({ mesh: box, speed: 0.04 + (Math.random() * 0.02) });
  }

  // Background Data Dashboard
  const dashGroup = new THREE.Group();
  dashGroup.position.set(-2, -1, -6);
  factoryGroup.add(dashGroup);

  const boardGeo = new THREE.BoxGeometry(16, 10, 0.5);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.1 });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.set(0, 3, 0);
  board.castShadow = true;
  board.receiveShadow = true;
  dashGroup.add(board);

  // Chart Bars (Cylinders on the dashboard)
  const bars = [];
  const barGeo = new THREE.CylinderGeometry(0.6, 0.6, 1, 32);
  for(let i=0; i<6; i++) {
    const bar = new THREE.Mesh(barGeo, boxMats[i % 3]);
    bar.position.set(-6 + (i * 2.4), -1, 1);
    bar.rotation.x = 0;
    bar.castShadow = true;
    dashGroup.add(bar);
    bars.push({ mesh: bar, baseHeight: Math.random() * 4 + 2, speed: Math.random() * 2 + 1 });
  }

  // ---- LIGHTING ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(20, 40, -10);
  dirLight.castShadow = true;
  // Increase shadow map quality
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.top = 30;
  dirLight.shadow.camera.bottom = -30;
  scene.add(dirLight);

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
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
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

    // Move boxes on conveyor belt
    boxes.forEach(b => {
      b.mesh.position.x += b.speed;
      b.mesh.rotation.y = t * 0.5; // Slight spin for life
      
      // Reset position when off belt
      if(b.mesh.position.x > 16) {
        b.mesh.position.x = -16;
      }
    });

    // Animate Chart bars
    bars.forEach(b => {
      const height = b.baseHeight + Math.sin(t * b.speed) * 2;
      b.mesh.scale.y = Math.max(0.1, height);
      b.mesh.position.y = -1 + (b.mesh.scale.y / 2); // Anchor to bottom
    });

    // Orthographic Camera Parallax (Shift target instead of rotation for stable isometric)
    const scrollOffset = scrollProgress * 15;
    
    // Base isometric position
    const baseX = 20;
    const baseZ = 20;
    
    // Apply parallax
    camera.position.x = baseX + mouseX * 2 - scrollOffset;
    camera.position.z = baseZ - mouseY * 2 - scrollOffset;
    camera.position.y = 20 - scrollOffset * 0.5;
    
    // Keep camera looking at the moving scene center
    camera.lookAt(scene.position.x - scrollOffset, scene.position.y - scrollOffset*0.5, scene.position.z - scrollOffset);

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
