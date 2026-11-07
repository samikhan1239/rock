import * as THREE from "three";

let heroScrollProgress = 0;

export function setHeroScroll(progress) {
  heroScrollProgress = THREE.MathUtils.clamp(progress, 0, 1);
}

export function initHeroScene() {
  const container = document.getElementById("hero-canvas-container");
  const canvas = document.getElementById("hero-canvas");
  const loader = document.getElementById("hero-canvas-loader");

  if (!container || !canvas) return;

  // ==========================================
  // 1. SCENE SETUP
  // ==========================================

  const scene = new THREE.Scene();

  const getDimensions = () => ({
    width: container.clientWidth || 560,
    height: container.clientHeight || 560,
  });

  const { width, height } = getDimensions();

  const camera = new THREE.PerspectiveCamera(
    42,
    width / height,
    0.1,
    100
  );

  camera.position.set(0, 0.5, 8);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // ==========================================
  // 2. LIGHTING
  // ==========================================

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const cyanLight = new THREE.PointLight(0x38bdf8, 18, 20);
  cyanLight.position.set(-4, 2, 3);
  scene.add(cyanLight);

  const violetLight = new THREE.PointLight(0xa78bfa, 12, 20);
  violetLight.position.set(4, -3, -2);
  scene.add(violetLight);

  const backLight = new THREE.PointLight(0x67e8f9, 10, 20);
  backLight.position.set(0, 4, -5);
  scene.add(backLight);

  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  // ==========================================
  // 3. MATERIALS
  // ==========================================

  const materials = {
    white: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.38,
      metalness: 0.02,
    }),

    cyan: new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.25,
      metalness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
    }),

    dark: new THREE.MeshStandardMaterial({
      color: 0x164e63,
      roughness: 0.3,
      metalness: 0.4,
    }),

    gold: new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.3,
      metalness: 0.7,
    }),

    glass: new THREE.MeshPhysicalMaterial({
      color: 0x67e8f9,
      metalness: 0.1,
      roughness: 0.08,
      transmission: 0.7,
      thickness: 0.8,
      transparent: true,
      opacity: 0.8,
      clearcoat: 1,
    }),
  };

  // ==========================================
  // 4. CENTRAL FLOATING BOOK
  // ==========================================

  const bookGroup = new THREE.Group();
  mainGroup.add(bookGroup);

  const coverGeometry = new THREE.BoxGeometry(1.65, 0.12, 2.3);

  const leftCover = new THREE.Mesh(
    coverGeometry,
    materials.cyan
  );

  leftCover.position.set(-0.82, -0.08, 0);
  leftCover.rotation.z = -0.12;
  bookGroup.add(leftCover);

  const rightCover = new THREE.Mesh(
    coverGeometry,
    materials.dark
  );

  rightCover.position.set(0.82, -0.08, 0);
  rightCover.rotation.z = 0.12;
  bookGroup.add(rightCover);

  // Pages
  const pageGeometry = new THREE.BoxGeometry(1.52, 0.1, 2.18);

  const leftPages = new THREE.Mesh(
    pageGeometry,
    materials.white
  );

  leftPages.position.set(-0.8, 0.02, 0);
  leftPages.rotation.z = -0.12;
  bookGroup.add(leftPages);

  const rightPages = new THREE.Mesh(
    pageGeometry,
    materials.white
  );

  rightPages.position.set(0.8, 0.02, 0);
  rightPages.rotation.z = 0.12;
  bookGroup.add(rightPages);

  // Spine
  const spineGeometry = new THREE.CylinderGeometry(
    0.12,
    0.12,
    2.3,
    24
  );

  const spine = new THREE.Mesh(
    spineGeometry,
    materials.dark
  );

  spine.rotation.x = Math.PI / 2;
  spine.position.set(0, -0.08, 0);
  bookGroup.add(spine);

  // Page detail lines
  const lineMaterial = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.8,
  });

  for (let i = 0; i < 5; i++) {
    const lineGeometry = new THREE.BoxGeometry(
      0.75,
      0.008,
      0.015
    );

    const leftLine = new THREE.Mesh(
      lineGeometry,
      lineMaterial
    );

    leftLine.position.set(
      -0.85,
      0.085,
      -0.55 + i * 0.22
    );

    bookGroup.add(leftLine);

    const rightLine = new THREE.Mesh(
      lineGeometry,
      lineMaterial
    );

    rightLine.position.set(
      0.85,
      0.085,
      -0.55 + i * 0.22
    );

    bookGroup.add(rightLine);
  }

  bookGroup.position.set(0, 0, 0);
  bookGroup.rotation.set(0.35, -0.25, 0);

  // ==========================================
  // 5. FLOATING GRADUATION CAP
  // ==========================================

  const capGroup = new THREE.Group();
  mainGroup.add(capGroup);

  const capTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.08, 1.15),
    materials.dark
  );

  capTop.rotation.y = Math.PI / 4;
  capGroup.add(capTop);

  const capBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.28, 32),
    materials.cyan
  );

  capBase.position.y = -0.17;
  capGroup.add(capBase);

  const tasselButton = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 16, 16),
    materials.gold
  );

  tasselButton.position.set(0, 0.08, 0);
  capGroup.add(tasselButton);

  const tassel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.55, 8),
    materials.gold
  );

  tassel.position.set(0.38, -0.16, 0.38);
  tassel.rotation.z = -0.5;
  capGroup.add(tassel);

  capGroup.position.set(2.1, 1.5, -0.5);
  capGroup.scale.setScalar(0.8);

  // ==========================================
  // 6. FLOATING PENCIL
  // ==========================================

  const pencilGroup = new THREE.Group();
  mainGroup.add(pencilGroup);

  const pencilBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 1.65, 8),
    materials.cyan
  );

  pencilGroup.add(pencilBody);

  const pencilTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.07, 0.3, 8),
    materials.gold
  );

  pencilTip.position.y = 0.96;
  pencilGroup.add(pencilTip);

  const graphite = new THREE.Mesh(
    new THREE.ConeGeometry(0.025, 0.1, 8),
    materials.dark
  );

  graphite.position.y = 1.15;
  pencilGroup.add(graphite);

  pencilGroup.position.set(-2.1, -1.2, 0.5);
  pencilGroup.rotation.z = 0.65;
  pencilGroup.rotation.x = 0.5;

  // ==========================================
  // 7. KNOWLEDGE CRYSTALS
  // ==========================================

  const crystalGroup = new THREE.Group();
  mainGroup.add(crystalGroup);

  const crystal1 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42, 1),
    materials.glass
  );

  crystal1.position.set(-2.3, 1.3, -0.8);
  crystalGroup.add(crystal1);

  const crystal2 = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.4, 0),
    materials.glass
  );

  crystal2.position.set(2.2, -1.5, 0.3);
  crystalGroup.add(crystal2);

  const crystal3 = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.25, 0),
    materials.cyan
  );

  crystal3.position.set(-2.7, -0.4, -1);
  crystalGroup.add(crystal3);

  // ==========================================
  // 8. ORBITAL RINGS
  // ==========================================

  const orbitGroup = new THREE.Group();
  mainGroup.add(orbitGroup);

  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(2.55, 0.012, 8, 160),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    })
  );

  ring1.rotation.x = Math.PI / 2.5;
  orbitGroup.add(ring1);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.9, 0.008, 8, 160),
    new THREE.MeshBasicMaterial({
      color: 0xa5f3fc,
      transparent: true,
      opacity: 0.5,
    })
  );

  ring2.rotation.x = Math.PI / 3;
  ring2.rotation.y = Math.PI / 5;
  orbitGroup.add(ring2);

  // ==========================================
  // 9. ORBITING NODES
  // ==========================================

  const nodes = [];

  const nodeGeometry = new THREE.SphereGeometry(
    0.065,
    16,
    16
  );

  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: 0x0ea5e9,
  });

  for (let i = 0; i < 6; i++) {
    const node = new THREE.Mesh(
      nodeGeometry,
      nodeMaterial
    );

    orbitGroup.add(node);
    nodes.push(node);
  }

  // ==========================================
  // 10. FLOATING PARTICLES
  // ==========================================

  const particleCount = 350;
  const particleGeometry = new THREE.BufferGeometry();

  const particlePositions = new Float32Array(
    particleCount * 3
  );

  for (let i = 0; i < particleCount; i++) {
    const radius = 2.8 + Math.random() * 2.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI;

    particlePositions[i * 3] =
      radius * Math.cos(theta) * Math.cos(phi);

    particlePositions[i * 3 + 1] =
      radius * Math.sin(phi);

    particlePositions[i * 3 + 2] =
      radius * Math.sin(theta) * Math.cos(phi);
  }

  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3)
  );

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.035,
    transparent: true,
    opacity: 0.65,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(
    particleGeometry,
    particleMaterial
  );

  mainGroup.add(particles);

  // ==========================================
  // 11. MOUSE INTERACTION
  // ==========================================

  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  const onMouseMove = (event) => {
    const rect = container.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    targetX =
      ((event.clientX - rect.left) / rect.width - 0.5) * 0.8;

    targetY =
      ((event.clientY - rect.top) / rect.height - 0.5) * 0.8;
  };

  window.addEventListener("mousemove", onMouseMove);

  // ==========================================
  // 12. ANIMATION
  // ==========================================

  const clock = new THREE.Clock();

  let animationFrameId = 0;
  let smoothedScroll = 0;
  let isDisposed = false;

  const animate = () => {
    if (isDisposed) return;

    animationFrameId = requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    mouseX += (targetX - mouseX) * 0.045;
    mouseY += (targetY - mouseY) * 0.045;

    smoothedScroll +=
      (heroScrollProgress - smoothedScroll) * 0.055;

    const scroll = smoothedScroll;

    // Main group
    mainGroup.rotation.y =
      mouseX * 0.35 + Math.sin(time * 0.35) * 0.04;

    mainGroup.rotation.x =
      -mouseY * 0.2 + Math.cos(time * 0.3) * 0.025;

    // Book
    bookGroup.rotation.y =
      -0.25 + mouseX * 0.25 + scroll * 1.1;

    bookGroup.rotation.x =
      0.35 - mouseY * 0.15 + scroll * 0.35;

    bookGroup.position.y =
      Math.sin(time * 0.9) * 0.09 - scroll * 0.8;

    bookGroup.position.z = scroll * 0.8;

    // Graduation cap
    capGroup.position.x = 2.1 - scroll * 1.2;

    capGroup.position.y =
      1.5 + Math.sin(time * 1.1) * 0.12 + scroll * 1.1;

    capGroup.position.z = -0.5 + scroll * 1.8;
    capGroup.rotation.y = time * 0.35 + scroll * 0.6;

    // Pencil
    pencilGroup.position.x = -2.1 - scroll * 1.2;

    pencilGroup.position.y =
      -1.2 + Math.cos(time * 1.2) * 0.1 + scroll * 1.5;

    pencilGroup.position.z = 0.5 + scroll * 1.8;
    pencilGroup.rotation.y = time * 0.25;

    // Crystals
    crystal1.rotation.x = time * 0.25;
    crystal1.rotation.y = time * 0.35;

    crystal2.rotation.y = -time * 0.3;
    crystal2.rotation.z = time * 0.2;

    crystal3.rotation.x = time * 0.3;
    crystal3.rotation.z = time * 0.2;

    crystal1.position.x = -2.3 - scroll * 1.2;
    crystal2.position.x = 2.2 + scroll * 1.2;

    // Orbital rings
    ring1.rotation.z = time * 0.12 + scroll * 0.4;
    ring2.rotation.z = -time * 0.1;

    // Orbiting nodes
    nodes.forEach((node, index) => {
      const angle =
        time * 0.3 + (index / nodes.length) * Math.PI * 2;

      const radius = 2.55;

      node.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.45,
        Math.sin(angle) * radius * 0.7
      );
    });

    // Particles
    particles.rotation.y = time * 0.025 + scroll * 0.3;
    particles.rotation.x = Math.sin(time * 0.15) * 0.08;

    // Camera
    camera.position.z = 8 - scroll * 1.0;
    camera.position.y = 0.5 - scroll * 0.3;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };

  animate();

  // ==========================================
  // 13. RESPONSIVE RESIZE
  // ==========================================

  const resizeObserver = new ResizeObserver(() => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;

    if (!newWidth || !newHeight) return;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(newWidth, newHeight);
  });

  resizeObserver.observe(container);

  // Hide loader after initialization
  loader?.classList.add("hidden");

  // ==========================================
  // 14. CLEANUP
  // ==========================================

  return () => {
    isDisposed = true;

    cancelAnimationFrame(animationFrameId);

    window.removeEventListener("mousemove", onMouseMove);

    resizeObserver.disconnect();

    scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Points
      ) {
        object.geometry.dispose();

        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    renderer.dispose();
  };
}