import * as THREE from 'three';

export function initShieldScene() {
  const canvas = document.getElementById('shield-canvas');
  if (!canvas) return;

  const parent = canvas.parentElement;
  const width = parent.clientWidth || 440;
  const height = parent.clientHeight || 440;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 5.2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
  dirLight.position.set(3, 4, 5);
  scene.add(dirLight);

  const backLight = new THREE.PointLight(0x4ade80, 2, 20);
  backLight.position.set(-2, -3, -2);
  scene.add(backLight);

  const shieldGroup = new THREE.Group();
  scene.add(shieldGroup);

  // ==========================================
  // SHIELD GEOMETRY CREATION
  // ==========================================
  // Custom shield shape
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(0, 1.6);
  shieldShape.bezierCurveTo(1.2, 1.5, 1.4, 0.8, 1.3, -0.2);
  shieldShape.bezierCurveTo(1.2, -1.0, 0.6, -1.6, 0, -2.0);
  shieldShape.bezierCurveTo(-0.6, -1.6, -1.2, -1.0, -1.3, -0.2);
  shieldShape.bezierCurveTo(-1.4, 0.8, -1.2, 1.5, 0, 1.6);

  const extrudeSettings = {
    steps: 2,
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.08,
    bevelSegments: 6
  };

  const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
  shieldGeo.center();

  // Outer Metallic Rim
  const shieldRimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0x0f172a
  });
  const shieldRim = new THREE.Mesh(shieldGeo, shieldRimMat);
  shieldGroup.add(shieldRim);

  // Inner Sapphire Core
  const innerExtrude = {
    steps: 1,
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 4
  };
  const innerGeo = new THREE.ExtrudeGeometry(shieldShape, innerExtrude);
  innerGeo.center();
  const innerMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    metalness: 0.4,
    roughness: 0.15,
    transmission: 0.6,
    thickness: 0.8,
    transparent: true,
    opacity: 0.9,
    emissive: 0x0369a1,
    emissiveIntensity: 0.25
  });
  const innerShield = new THREE.Mesh(innerGeo, innerMat);
  innerShield.scale.set(0.85, 0.85, 0.85);
  innerShield.position.z = 0.08;
  shieldGroup.add(innerShield);

  // Checkmark Emblem (3D Checkmark on Shield)
  const checkShape = new THREE.Shape();
  checkShape.moveTo(-0.45, 0.05);
  checkShape.lineTo(-0.15, -0.35);
  checkShape.lineTo(0.5, 0.45);
  checkShape.lineTo(0.38, 0.55);
  checkShape.lineTo(-0.15, -0.15);
  checkShape.lineTo(-0.35, 0.15);
  checkShape.closePath();

  const checkExtrude = { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 3 };
  const checkGeo = new THREE.ExtrudeGeometry(checkShape, checkExtrude);
  checkGeo.center();
  const checkMat = new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    emissive: 0x22c55e,
    emissiveIntensity: 0.6,
    metalness: 0.6,
    roughness: 0.2
  });
  const checkMesh = new THREE.Mesh(checkGeo, checkMat);
  checkMesh.position.z = 0.24;
  shieldGroup.add(checkMesh);

  // Orbiting Energy Ring
  const ringGeo = new THREE.TorusGeometry(2.1, 0.02, 16, 100);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.6
  });
  const orbitalRing = new THREE.Mesh(ringGeo, ringMat);
  orbitalRing.rotation.x = Math.PI / 2.5;
  shieldGroup.add(orbitalRing);

  // 4 Orbiting Verification Data Nodes
  const nodeGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const nodeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1 });
  const nodes = [];
  for (let i = 0; i < 4; i++) {
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    shieldGroup.add(node);
    nodes.push(node);
  }

  // Mouse interaction
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.clientY >= rect.top - 200 && e.clientY <= rect.bottom + 200) {
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.7;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.7;
    }
  });

  // Stage Card Hover highlight reaction
  const stageCards = document.querySelectorAll('.trust-stage-card');
  stageCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      innerMat.emissiveIntensity = 0.9;
      dirLight.intensity = 4.0;
    });
    card.addEventListener('mouseleave', () => {
      innerMat.emissiveIntensity = 0.25;
      dirLight.intensity = 2.5;
    });
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    mouseX += (targetX - mouseX) * 0.05;
    mouseY += (targetY - mouseY) * 0.05;

    shieldGroup.rotation.y = mouseX + Math.sin(t * 0.8) * 0.15;
    shieldGroup.rotation.x = -mouseY + Math.cos(t * 0.6) * 0.08;

    orbitalRing.rotation.z = t * 0.25;

    // Position orbital nodes around ring
    nodes.forEach((node, idx) => {
      const angle = t * 0.4 + (idx * Math.PI) / 2;
      const r = 2.1;
      node.position.x = r * Math.cos(angle);
      node.position.y = (r * Math.sin(angle)) * Math.cos(Math.PI / 2.5);
      node.position.z = (r * Math.sin(angle)) * Math.sin(Math.PI / 2.5);
    });

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
