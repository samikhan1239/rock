import * as THREE from 'three';

export function initStoryScene() {
  const canvas = document.getElementById('story-3d-canvas');
  if (!canvas) return { setProgress: () => {} };

  const container = canvas.parentElement;
  let width = container.clientWidth || 500;
  let height = container.clientHeight || 500;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 6.5);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Ambient & Directional Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);

  const pLight1 = new THREE.PointLight(0x38bdf8, 3.5, 30);
  pLight1.position.set(4, 4, 4);
  scene.add(pLight1);

  const pLight2 = new THREE.PointLight(0xa855f7, 3, 30);
  pLight2.position.set(-4, -3, 3);
  scene.add(pLight2);

  // Parent group for all story objects
  const storyRoot = new THREE.Group();
  scene.add(storyRoot);

  // ==========================================
  // OBJECT 1: College Scholar Diploma / Scroll (Scene 1)
  // ==========================================
  const scrollGroup = new THREE.Group();
  const cylGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.4, 24);
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const scrollCyl = new THREE.Mesh(cylGeo, paperMat);
  scrollGroup.add(scrollCyl);

  // Golden Ribbon
  const ribbonGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.3, 24);
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 });
  const ribbon = new THREE.Mesh(ribbonGeo, goldMat);
  scrollGroup.add(ribbon);

  scrollGroup.rotation.z = Math.PI / 4;
  scrollGroup.rotation.x = 0.3;
  storyRoot.add(scrollGroup);

  // ==========================================
  // OBJECT 2: Holographic Profile Shield / Card (Scene 2)
  // ==========================================
  const cardGroup = new THREE.Group();
  const cardGeo = new THREE.BoxGeometry(2.2, 3.0, 0.08);
  const cardMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    transmission: 0.75,
    opacity: 0.9,
    transparent: true,
    roughness: 0.1,
    metalness: 0.3,
    emissive: 0x0369a1,
    emissiveIntensity: 0.4
  });
  const cardMesh = new THREE.Mesh(cardGeo, cardMat);
  cardGroup.add(cardMesh);

  // Wireframe highlight border
  const wireGeo = new THREE.EdgesGeometry(cardGeo);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
  const cardBorder = new THREE.LineSegments(wireGeo, wireMat);
  cardGroup.add(cardBorder);

  cardGroup.position.set(0, 0, 0);
  cardGroup.scale.set(0.001, 0.001, 0.001); // starts invisible
  storyRoot.add(cardGroup);

  // ==========================================
  // OBJECT 3: AI Neural Vetting Ring & Shield (Scene 3)
  // ==========================================
  const vetGroup = new THREE.Group();
  const torusGeo = new THREE.TorusGeometry(1.6, 0.04, 16, 64);
  const torusMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
  const neuralRing = new THREE.Mesh(torusGeo, torusMat);
  vetGroup.add(neuralRing);

  // Inner pulsing sphere
  const sphereGeo = new THREE.IcosahedronGeometry(0.8, 1);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    wireframe: true,
    emissive: 0x10b981,
    emissiveIntensity: 0.6
  });
  const neuralCore = new THREE.Mesh(sphereGeo, sphereMat);
  vetGroup.add(neuralCore);

  vetGroup.scale.set(0.001, 0.001, 0.001);
  storyRoot.add(vetGroup);

  // ==========================================
  // OBJECT 4: Parent Radar Scanner (Scene 4)
  // ==========================================
  const radarGroup = new THREE.Group();
  const radarRingGeo = new THREE.RingGeometry(0.4, 2.0, 32);
  const radarMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4,
    wireframe: true
  });
  const radarMesh = new THREE.Mesh(radarRingGeo, radarMat);
  radarGroup.add(radarMesh);

  radarGroup.scale.set(0.001, 0.001, 0.001);
  storyRoot.add(radarGroup);

  // ==========================================
  // OBJECT 5: Converged Handshake Core (Scene 5)
  // ==========================================
  const matchGroup = new THREE.Group();
  const knotGeo = new THREE.TorusKnotGeometry(1.2, 0.25, 64, 16, 2, 3);
  const knotMat = new THREE.MeshPhysicalMaterial({
    color: 0x818cf8,
    emissive: 0x4f46e5,
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.2
  });
  const matchKnot = new THREE.Mesh(knotGeo, knotMat);
  matchGroup.add(matchKnot);

  matchGroup.scale.set(0.001, 0.001, 0.001);
  storyRoot.add(matchGroup);

  // Background floating stardust particles
  const pCount = 120;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount * 3; i += 3) {
    pPos[i] = (Math.random() - 0.5) * 8;
    pPos[i + 1] = (Math.random() - 0.5) * 8;
    pPos[i + 2] = (Math.random() - 0.5) * 6;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.7
  });
  const stars = new THREE.Points(pGeo, pMaterial);
  storyRoot.add(stars);

  // Mouse interaction
  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
  });

  // Current scroll progress (0.0 to 1.0)
  let currentProgress = 0;
  let targetProgress = 0;

  function setProgress(progress) {
    targetProgress = Math.max(0, Math.min(1, progress));
  }

  // Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Lerp progress smoothly
    currentProgress += (targetProgress - currentProgress) * 0.1;

    // Subtly rotate root with mouse + idle
    storyRoot.rotation.y = mouseX + Math.sin(t * 0.5) * 0.08;
    storyRoot.rotation.x = -mouseY + Math.cos(t * 0.4) * 0.06;

    stars.rotation.y = t * 0.03;

    // Continuous 5-Stage Morphing based on progress [0.0 - 1.0]:
    // Stage 1: 0.0 - 0.20 (Diploma)
    // Stage 2: 0.20 - 0.40 (Profile Card)
    // Stage 3: 0.40 - 0.60 (AI Verification)
    // Stage 4: 0.60 - 0.80 (Parent Radar)
    // Stage 5: 0.80 - 1.0 (Match Nexus)

    // Helper: calculate scale for a given stage window
    const getStageScale = (start, peak, end, prog) => {
      if (prog < start || prog > end) return 0.001;
      if (prog <= peak) return 0.001 + (prog - start) / (peak - start);
      return Math.max(0.001, 1 - (prog - peak) / (end - peak));
    };

    // 1. Diploma
    const s1 = getStageScale(-0.1, 0.1, 0.25, currentProgress);
    scrollGroup.scale.set(s1, s1, s1);
    scrollGroup.rotation.y = t * 0.8 + currentProgress * 4;

    // 2. Profile Card
    const s2 = getStageScale(0.18, 0.32, 0.45, currentProgress);
    cardGroup.scale.set(s2, s2, s2);
    cardGroup.rotation.y = Math.sin(t * 0.8) * 0.2 + (currentProgress - 0.3) * 3;

    // 3. AI Verification
    const s3 = getStageScale(0.38, 0.52, 0.65, currentProgress);
    vetGroup.scale.set(s3, s3, s3);
    neuralRing.rotation.z = t * 1.5;
    neuralCore.rotation.x = t * 0.8;

    // 4. Parent Radar
    const s4 = getStageScale(0.58, 0.72, 0.85, currentProgress);
    radarGroup.scale.set(s4, s4, s4);
    radarMesh.rotation.z = t * 1.2;

    // 5. Match Nexus
    const s5 = getStageScale(0.78, 0.95, 1.1, currentProgress);
    matchGroup.scale.set(s5, s5, s5);
    matchKnot.rotation.x = t * 0.6;
    matchKnot.rotation.y = t * 0.8;

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    if (!container) return;
    width = container.clientWidth;
    height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });

  return { setProgress };
}
