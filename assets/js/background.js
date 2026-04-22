/* ══════════════════════════════════════════════════════════════════════
   BACKGROUND WIREFRAME GRID (Three.js)
   Skipped on small screens and when reduced-motion is preferred.
   ══════════════════════════════════════════════════════════════════════ */
(function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.innerWidth < 720;
  if (reduceMotion || isSmall) {
    canvas.remove();
    return;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05080a, 40, 180);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 18, 30);
  camera.lookAt(0, 0, -40);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const SEG = 80;
  const SIZE = 220;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);

  const posAttr = geo.attributes.position;
  const origZ = new Float32Array(posAttr.count);
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i), z = posAttr.getZ(i);
    const h = Math.sin(x * 0.12) * Math.cos(z * 0.12) * 1.8 + Math.sin(x * 0.05 + z * 0.03) * 2.2;
    origZ[i] = h;
    posAttr.setY(i, h);
  }

  const mat = new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.35 });
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), mat);
  scene.add(wire);

  const glowGeo = new THREE.PlaneGeometry(600, 0.4);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff00aa, transparent: true, opacity: 0.6 });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, 2, -140);
  scene.add(glow);

  const particleCount = 80;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 200;
    pPos[i * 3 + 1] = Math.random() * 30;
    pPos[i * 3 + 2] = -Math.random() * 160;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0x00eaff, size: 0.7, transparent: true, opacity: 0.7 });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  let t = 0;
  let running = true;

  // Pause the heavy loop when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(animate);
  });

  function animate() {
    if (!running) return;
    t += 0.008;
    wire.position.z = (t * 3) % 10;

    const now = Date.now() * 0.0005;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i), z = posAttr.getZ(i);
      const ripple = Math.sin(x * 0.08 + now) * Math.cos(z * 0.08 + now * 0.7) * 0.6;
      posAttr.setY(i, origZ[i] + ripple);
    }
    posAttr.needsUpdate = true;
    wire.geometry.dispose();
    wire.geometry = new THREE.WireframeGeometry(geo);

    const pp = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pp[i * 3 + 2] += 0.15;
      if (pp[i * 3 + 2] > 30) {
        pp[i * 3 + 2] = -160;
        pp[i * 3] = (Math.random() - 0.5) * 200;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  let resizeRaf;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  });
})();
