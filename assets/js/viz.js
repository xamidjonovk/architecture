/* ══════════════════════════════════════════════════════════════════════
   INTERACTIVE 3D VISUALIZATIONS
   Each .viz-3d[data-viz="..."] element is initialized lazily when it
   scrolls near the viewport. Skipped entirely when Three.js is unavailable
   or the user has prefers-reduced-motion.
   ══════════════════════════════════════════════════════════════════════ */

function createViz(container, buildScene) {
  if (typeof THREE === 'undefined') return;
  const w = container.clientWidth;
  const h = 400;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
  camera.position.set(0, 8, 22);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const light1 = new THREE.DirectionalLight(0x00ff88, 0.7);
  light1.position.set(8, 12, 8);
  scene.add(light1);
  const light2 = new THREE.DirectionalLight(0xff00aa, 0.4);
  light2.position.set(-8, 6, -6);
  scene.add(light2);

  const gridHelper = new THREE.GridHelper(30, 30, 0x00ff88, 0x113322);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.25;
  gridHelper.position.y = -5;
  scene.add(gridHelper);

  const group = new THREE.Group();
  scene.add(group);
  buildScene(group, THREE);

  let rotX = 0.25, rotY = 0, autoRot = true;
  let dragging = false, lastX = 0, lastY = 0;
  const canvas = renderer.domElement;

  canvas.addEventListener('mousedown', (e) => {
    dragging = true; autoRot = false;
    lastX = e.clientX; lastY = e.clientY;
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    rotY += (e.clientX - lastX) * 0.008;
    rotX += (e.clientY - lastY) * 0.008;
    rotX = Math.max(-1.2, Math.min(1.2, rotX));
    lastX = e.clientX; lastY = e.clientY;
  });

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      dragging = true; autoRot = false;
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (!dragging || e.touches.length !== 1) return;
    rotY += (e.touches[0].clientX - lastX) * 0.008;
    rotX += (e.touches[0].clientY - lastY) * 0.008;
    rotX = Math.max(-1.2, Math.min(1.2, rotX));
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener('touchend', () => { dragging = false; });

  // Pause the per-container render loop when it scrolls off screen
  let onScreen = true;
  const visObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) requestAnimationFrame(animate);
  }, { rootMargin: '100px' });
  visObserver.observe(container);

  function animate() {
    if (!onScreen) return;
    if (autoRot) rotY += 0.003;
    group.rotation.x = rotX;
    group.rotation.y = rotY;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  new ResizeObserver(() => {
    const nw = container.clientWidth;
    renderer.setSize(nw, h);
    camera.aspect = nw / h;
    camera.updateProjectionMatrix();
  }).observe(container);
}

function makeLabel(text, color) {
  const canv = document.createElement('canvas');
  canv.width = 256; canv.height = 64;
  const ctx = canv.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.font = 'bold 32px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color || '#00ff88';
  ctx.shadowColor = color || '#00ff88';
  ctx.shadowBlur = 8;
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(canv);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3, 0.75, 1);
  return sprite;
}

function makeNode(THREE, size, color, label, labelColor) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(size, size * 0.6, size);
  const mat = new THREE.MeshStandardMaterial({
    color: color, transparent: true, opacity: 0.7,
    emissive: color, emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.4
  });
  const cube = new THREE.Mesh(geo, mat);
  g.add(cube);

  const wf = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.9 })
  );
  g.add(wf);

  if (label) {
    const lbl = makeLabel(label, labelColor || '#ffffff');
    lbl.position.y = size * 0.75;
    g.add(lbl);
  }
  return g;
}

function makeConnection(THREE, from, to, color) {
  const mat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.8 });
  const pts = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, mat);
}

const vizBuilders = {
  auth(group, THREE) {
    const client = makeNode(THREE, 2.2, 0x00eaff, 'CLIENT', '#00eaff');
    client.position.set(-9, 0, 0);
    group.add(client);

    const gw = makeNode(THREE, 2.2, 0x00ff88, 'GATEWAY', '#00ff88');
    gw.position.set(-3, 0, 0);
    group.add(gw);

    const auth = makeNode(THREE, 2.2, 0xff00aa, 'AUTH', '#ff00aa');
    auth.position.set(3, 0, 0);
    group.add(auth);

    const db = makeNode(THREE, 2, 0xb87eff, 'DB', '#b87eff');
    db.position.set(9, 2, 0);
    group.add(db);

    const redis = makeNode(THREE, 2, 0xffb800, 'REDIS', '#ffb800');
    redis.position.set(9, -2, 0);
    group.add(redis);

    group.add(makeConnection(THREE, [-9, 0, 0], [-3, 0, 0], 0x00eaff));
    group.add(makeConnection(THREE, [-3, 0, 0], [3, 0, 0], 0x00ff88));
    group.add(makeConnection(THREE, [3, 0, 0], [9, 2, 0], 0xff00aa));
    group.add(makeConnection(THREE, [3, 0, 0], [9, -2, 0], 0xff00aa));

    const tokenGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const tokenMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.9 });
    const token = new THREE.Mesh(tokenGeo, tokenMat);
    group.add(token);

    const path = [[-9, 0, 0], [-3, 0, 0], [3, 0, 0], [9, 2, 0], [3, 0, 0], [-3, 0, 0], [-9, 0, 0]];
    let idx = 0, prog = 0;
    function step() {
      const from = path[idx], to = path[(idx + 1) % path.length];
      token.position.set(
        from[0] + (to[0] - from[0]) * prog,
        from[1] + (to[1] - from[1]) * prog + Math.sin(prog * Math.PI) * 1.5,
        from[2] + (to[2] - from[2]) * prog
      );
      prog += 0.015;
      if (prog >= 1) { prog = 0; idx = (idx + 1) % path.length; }
      requestAnimationFrame(step);
    }
    step();
  },

  cache(group, THREE) {
    const layers = [
      { y: 5, size: 2, color: 0x00eaff, label: 'L1 BROWSER' },
      { y: 3, size: 4, color: 0x00ff88, label: 'L2 CDN' },
      { y: 1, size: 6, color: 0xffb800, label: 'L3 APP' },
      { y: -1, size: 8, color: 0xff00aa, label: 'L4 REDIS' },
      { y: -3, size: 10, color: 0xb87eff, label: 'L5 DB' }
    ];
    layers.forEach(L => {
      const geo = new THREE.BoxGeometry(L.size, 1.2, L.size);
      const mat = new THREE.MeshStandardMaterial({
        color: L.color, transparent: true, opacity: 0.55,
        emissive: L.color, emissiveIntensity: 0.35
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.y = L.y;
      group.add(m);
      const wf = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: L.color, transparent: true, opacity: 1 })
      );
      wf.position.y = L.y;
      group.add(wf);
      const lbl = makeLabel(L.label, '#ffffff');
      lbl.position.set(L.size / 2 + 3, L.y, 0);
      lbl.scale.set(4, 1, 1);
      group.add(lbl);
    });

    const arrowGeo = new THREE.ConeGeometry(0.3, 0.8, 8);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.rotation.x = Math.PI;
    group.add(arrow);

    let y = 6;
    function step() {
      y -= 0.1;
      if (y < -4) y = 6;
      arrow.position.set(-8, y, 0);
      requestAnimationFrame(step);
    }
    step();
  },

  replication(group, THREE) {
    const primary = makeNode(THREE, 2.8, 0xff00aa, 'PRIMARY', '#ff00aa');
    primary.position.set(0, 3, 0);
    group.add(primary);

    const replicas = [];
    const positions = [[-7, -1, 4], [-2, -1, -6], [7, -1, 4], [3, -1, -6]];
    positions.forEach((p, i) => {
      const r = makeNode(THREE, 2.2, 0x00ff88, `REPLICA-${i + 1}`, '#00ff88');
      r.position.set(...p);
      group.add(r);
      replicas.push(r);
      group.add(makeConnection(THREE, [0, 3, 0], p, 0x00ff88));
    });

    const packets = replicas.map(() => {
      const geo = new THREE.SphereGeometry(0.25, 10, 10);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const m = new THREE.Mesh(geo, mat);
      group.add(m);
      return m;
    });
    const progs = packets.map(() => Math.random());
    function step() {
      packets.forEach((pk, i) => {
        progs[i] += 0.02;
        if (progs[i] > 1) progs[i] = 0;
        const t = progs[i];
        pk.position.set(
          0 + (positions[i][0]) * t,
          3 + (positions[i][1] - 3) * t,
          0 + (positions[i][2]) * t
        );
      });
      requestAnimationFrame(step);
    }
    step();
  },

  deploy(group, THREE) {
    const blueBox = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const n = makeNode(THREE, 1.4, 0x00eaff, `v1`, '#00eaff');
      n.position.set(-6, 2 - i * 2, 0);
      blueBox.add(n);
    }
    group.add(blueBox);

    const greenBox = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const n = makeNode(THREE, 1.4, 0x00ff88, `v2`, '#00ff88');
      n.position.set(6, 2 - i * 2, 0);
      greenBox.add(n);
    }
    group.add(greenBox);

    const lb = makeNode(THREE, 2.2, 0xffb800, 'LB', '#ffb800');
    lb.position.set(0, 5, 0);
    group.add(lb);

    for (let i = 0; i < 3; i++) {
      group.add(makeConnection(THREE, [0, 5, 0], [-6, 2 - i * 2, 0], 0x00eaff));
      group.add(makeConnection(THREE, [0, 5, 0], [6, 2 - i * 2, 0], 0x00ff88));
    }

    const canaryGeo = new THREE.SphereGeometry(0.25, 10, 10);
    const canaryMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const packets = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(canaryGeo, canaryMat);
      group.add(p);
      packets.push({ mesh: p, prog: Math.random(), target: i < 5 ? 'blue' : 'green' });
    }

    function step() {
      packets.forEach(p => {
        p.prog += 0.015;
        if (p.prog > 1) { p.prog = 0; p.target = Math.random() > 0.8 ? 'green' : 'blue'; }
        const endX = p.target === 'blue' ? -6 : 6;
        const endY = 2 - Math.floor(Math.random() * 3) * 2;
        p.mesh.position.set(
          0 + endX * p.prog,
          5 + (endY - 5) * p.prog,
          0
        );
      });
      requestAnimationFrame(step);
    }
    step();
  },

  rag(group, THREE) {
    const stages = [
      { x: -10, color: 0x00eaff, label: 'QUERY' },
      { x: -6, color: 0xffb800, label: 'EMBED' },
      { x: -2, color: 0xb87eff, label: 'VECTOR DB' },
      { x: 2, color: 0xff00aa, label: 'RERANK' },
      { x: 6, color: 0x00ff88, label: 'LLM' },
      { x: 10, color: 0x00eaff, label: 'ANSWER' }
    ];
    stages.forEach((s, i) => {
      const n = makeNode(THREE, 1.8, s.color, s.label, '#ffffff');
      n.position.set(s.x, 0, 0);
      group.add(n);
      if (i < stages.length - 1) {
        group.add(makeConnection(THREE, [s.x, 0, 0], [stages[i + 1].x, 0, 0], s.color));
      }
    });

    const pointCount = 200;
    const cloudGeo = new THREE.BufferGeometry();
    const cloudPos = new Float32Array(pointCount * 3);
    const cloudCol = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      cloudPos[i * 3] = -2 + (Math.random() - 0.5) * 4;
      cloudPos[i * 3 + 1] = -2 - Math.random() * 3;
      cloudPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      cloudCol[i * 3] = 0.72;
      cloudCol[i * 3 + 1] = 0.5;
      cloudCol[i * 3 + 2] = 1;
    }
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPos, 3));
    cloudGeo.setAttribute('color', new THREE.BufferAttribute(cloudCol, 3));
    const cloudMat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.8 });
    const cloud = new THREE.Points(cloudGeo, cloudMat);
    group.add(cloud);

    const pGeo = new THREE.SphereGeometry(0.3, 12, 12);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const packet = new THREE.Mesh(pGeo, pMat);
    group.add(packet);
    let prog = 0;
    function step() {
      prog += 0.008;
      if (prog > 1) prog = 0;
      packet.position.set(-10 + 20 * prog, Math.sin(prog * Math.PI * 2) * 0.5, 0);
      cloud.rotation.y += 0.005;
      requestAnimationFrame(step);
    }
    step();
  },

  agent(group, THREE) {
    const brainGeo = new THREE.IcosahedronGeometry(2.2, 1);
    const brainMat = new THREE.MeshStandardMaterial({
      color: 0xb87eff, transparent: true, opacity: 0.55,
      emissive: 0xb87eff, emissiveIntensity: 0.5, wireframe: true
    });
    const brain = new THREE.Mesh(brainGeo, brainMat);
    group.add(brain);
    const brainLbl = makeLabel('LLM', '#b87eff');
    brainLbl.position.set(0, 3.5, 0);
    group.add(brainLbl);

    const tools = [
      { angle: 0, color: 0x00ff88, label: 'SEARCH' },
      { angle: Math.PI / 2, color: 0xff00aa, label: 'DB' },
      { angle: Math.PI, color: 0xffb800, label: 'API' },
      { angle: 3 * Math.PI / 2, color: 0x00eaff, label: 'CALC' }
    ];

    const toolNodes = tools.map(t => {
      const x = Math.cos(t.angle) * 7;
      const z = Math.sin(t.angle) * 7;
      const n = makeNode(THREE, 1.6, t.color, t.label, '#ffffff');
      n.position.set(x, 0, z);
      group.add(n);
      group.add(makeConnection(THREE, [0, 0, 0], [x, 0, z], t.color));
      return { mesh: n, pos: [x, 0, z], color: t.color };
    });

    const packets = toolNodes.map((t, i) => {
      const pGeo = new THREE.SphereGeometry(0.25, 10, 10);
      const pMat = new THREE.MeshBasicMaterial({ color: t.color });
      const p = new THREE.Mesh(pGeo, pMat);
      group.add(p);
      return { mesh: p, tool: t, prog: i * 0.25, dir: 1 };
    });

    function step() {
      brain.rotation.x += 0.005;
      brain.rotation.y += 0.007;

      packets.forEach(p => {
        p.prog += 0.015 * p.dir;
        if (p.prog >= 1) { p.dir = -1; }
        if (p.prog <= 0) { p.dir = 1; }
        p.mesh.position.set(
          p.tool.pos[0] * p.prog,
          Math.sin(p.prog * Math.PI) * 1.5,
          p.tool.pos[2] * p.prog
        );
      });
      requestAnimationFrame(step);
    }
    step();
  }
};

(function initAllVizes() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const containers = document.querySelectorAll('.viz-3d[data-viz]');
  if (!containers.length) return;

  if (reduceMotion || typeof THREE === 'undefined') {
    containers.forEach(c => {
      const note = document.createElement('div');
      note.className = 'viz-label';
      note.textContent = '3d viz disabled';
      c.appendChild(note);
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (el.dataset.initialized) return;
        const type = el.dataset.viz;
        if (vizBuilders[type]) {
          el.dataset.initialized = '1';
          try {
            createViz(el, vizBuilders[type]);
          } catch (e) {
            console.warn('viz init error:', type, e);
          }
        }
        observer.unobserve(el);
      }
    });
  }, { rootMargin: '200px' });

  containers.forEach(c => observer.observe(c));
})();
