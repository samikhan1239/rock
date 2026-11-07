import * as THREE from 'three';

export function initCoreScene() {
  const canvas = document.getElementById('closing-canvas');
  if (!canvas) return;

  const parent = canvas.parentElement;
  const width = parent.clientWidth || window.innerWidth;
  const height = parent.clientHeight || 750;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 0, 7.0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting
  const amb = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(amb);

  const light1 = new THREE.PointLight(0x38bdf8, 3, 50);
  light1.position.set(5, 5, 5);
  scene.add(light1);

  const light2 = new THREE.PointLight(0xa855f7, 3, 50);
  light2.position.set(-5, -5, 5);
  scene.add(light2);

  const nexusGroup = new THREE.Group();
  scene.add(nexusGroup);

  // 1. Torus Knot (Knowledge Nexus)
  const knotGeo = new THREE.TorusKnotGeometry(2.0, 0.35, 128, 32, 2, 3);
  const knotMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e1b4b,
    emissive: 0x312e81,
    emissiveIntensity: 0.4,
    metalness: 0.8,
    roughness: 0.2,
    wireframe: false,
    transparent: true,
    opacity: 0.85
  });
  const knot = new THREE.Mesh(knotGeo, knotMat);
  nexusGroup.add(knot);

  // 2. Glowing Wireframe Shell
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.25
  });
  const knotWire = new THREE.Mesh(knotGeo, wireMat);
  knotWire.scale.set(1.02, 1.02, 1.02);
  nexusGroup.add(knotWire);

  // 3. Central Core of Light
  const coreGeo = new THREE.SphereGeometry(0.8, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.65
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  nexusGroup.add(core);

  // 4. Stardust Cloud Particles
  const particleCount = 400;
  const particleGeo = new THREE.BufferGeometry();
  const coords = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    coords[i] = (Math.random() - 0.5) * 16;
    coords[i + 1] = (Math.random() - 0.5) * 12;
    coords[i + 2] = (Math.random() - 0.5) * 10;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(coords, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.04,
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  const particleField = new THREE.Points(particleGeo, pMat);
  scene.add(particleField);

  // Mouse interaction
  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    nexusGroup.rotation.x = t * 0.15 + mouseY;
    nexusGroup.rotation.y = t * 0.2 + mouseX;

    const scale = 1 + Math.sin(t * 1.5) * 0.05;
    core.scale.set(scale, scale, scale);

    particleField.rotation.y = t * 0.02;

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    if (!parent) return;
    const newW = parent.clientWidth;
    const newH = parent.clientHeight;
    camera.aspect = newW / newH;
    camera.updateProjectionMatrix();
    renderer.setSize(newW, newH);
  });
}
