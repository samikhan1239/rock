import * as THREE from "three";

export function initBackgroundScene() {
  const canvas = document.getElementById("bg-canvas");

  if (!canvas) {
    return {
      updateScroll: () => {},
      destroy: () => {},
    };
  }

  // =========================================
  // SCENE SETUP
  // =========================================

  let width = window.innerWidth;
  let height = window.innerHeight;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    width / height,
    0.1,
    1000
  );

  camera.position.set(0, 0, 22);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.75)
  );

  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);

  // =========================================
  // COLOR PALETTE
  // =========================================

  const cyan = new THREE.Color("#00E5FF");
  const blue = new THREE.Color("#2563EB");
  const violet = new THREE.Color("#8B5CF6");
  const white = new THREE.Color("#FFFFFF");

  // =========================================
  // 1. PARTICLE UNIVERSE
  // =========================================

  const particleCount = 2200;

  const particleGeometry = new THREE.BufferGeometry();

  const particlePositions = new Float32Array(
    particleCount * 3
  );

  const originalPositions = new Float32Array(
    particleCount * 3
  );

  const particleColors = new Float32Array(
    particleCount * 3
  );

  const particleSizes = new Float32Array(
    particleCount
  );

  const particlePhases = new Float32Array(
    particleCount
  );

  for (let i = 0; i < particleCount; i++) {
    const radius = 3 + Math.random() * 13;

    const angle = Math.random() * Math.PI * 2;

    const x = Math.cos(angle) * radius;

    const y =
      Math.sin(angle) * radius * 0.65;

    const z = (Math.random() - 0.5) * 15;

    const index = i * 3;

    particlePositions[index] = x;
    particlePositions[index + 1] = y;
    particlePositions[index + 2] = z;

    originalPositions[index] = x;
    originalPositions[index + 1] = y;
    originalPositions[index + 2] = z;

    const random = Math.random();

    const color = new THREE.Color();

    if (random < 0.5) {
      color.copy(cyan);
    } else if (random < 0.82) {
      color.copy(blue);
    } else if (random < 0.96) {
      color.copy(violet);
    } else {
      color.copy(white);
    }

    particleColors[index] = color.r;
    particleColors[index + 1] = color.g;
    particleColors[index + 2] = color.b;

    particleSizes[i] =
      0.7 + Math.random() * 2.5;

    particlePhases[i] =
      Math.random() * Math.PI * 2;
  }

  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      particlePositions,
      3
    )
  );

  particleGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(
      particleColors,
      3
    )
  );

  particleGeometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(
      particleSizes,
      1
    )
  );

  particleGeometry.setAttribute(
    "aPhase",
    new THREE.BufferAttribute(
      particlePhases,
      1
    )
  );

  // Custom glowing particle shader

  const particleMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,

    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: {
        value: renderer.getPixelRatio(),
      },
    },

    vertexShader: `
      attribute float aSize;
      attribute float aPhase;

      uniform float uTime;
      uniform float uPixelRatio;

      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = color;

        vec3 pos = position;

        float movement =
          sin(uTime * 0.35 + aPhase);

        pos.x += movement * 0.035;
        pos.y += cos(uTime * 0.25 + aPhase) * 0.04;
        pos.z += movement * 0.05;

        vec4 mvPosition =
          modelViewMatrix * vec4(pos, 1.0);

        float twinkle =
          0.65 + 0.35 *
          sin(uTime * 1.8 + aPhase);

        gl_PointSize =
          aSize * twinkle * uPixelRatio *
          (35.0 / -mvPosition.z);

        gl_Position =
          projectionMatrix * mvPosition;

        vAlpha = twinkle;
      }
    `,

    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);

        float d = length(uv);

        if (d > 0.5) discard;

        float glow = exp(-d * 11.0);
        float core = exp(-d * 35.0);

        vec3 finalColor =
          vColor * (glow * 0.8 + core);

        gl_FragColor = vec4(
          finalColor,
          glow * vAlpha
        );
      }
    `,
  });

  const universe = new THREE.Points(
    particleGeometry,
    particleMaterial
  );

  scene.add(universe);

  // =========================================
  // 2. NEURAL WAVE NETWORK
  // =========================================

  const cols = 75;
  const rows = 40;

  const count = cols * rows;

  const waveGeometry = new THREE.BufferGeometry();

  const wavePositions = new Float32Array(
    count * 3
  );

  const waveColors = new Float32Array(
    count * 3
  );

  const initialY = new Float32Array(count);

  let index = 0;

  for (let ix = 0; ix < cols; ix++) {
    for (let iy = 0; iy < rows; iy++) {
      const u = ix / (cols - 1);
      const v = iy / (rows - 1);

      const x = (ix - cols / 2) * 0.65;

      const z =
        (iy - rows / 2) * 0.55 - 7;

      const y =
        Math.sin(ix * 0.16) *
        Math.cos(iy * 0.16) *
        0.8;

      const i = index * 3;

      wavePositions[i] = x;
      wavePositions[i + 1] = y - 3.5;
      wavePositions[i + 2] = z;

      initialY[index] = y - 3.5;

      // Cyan -> blue -> violet

      const color = cyan.clone();

      color.lerp(blue, u * 0.65);
      color.lerp(violet, v * 0.35);

      waveColors[i] = color.r;
      waveColors[i + 1] = color.g;
      waveColors[i + 2] = color.b;

      index++;
    }
  }

  waveGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      wavePositions,
      3
    )
  );

  waveGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(
      waveColors,
      3
    )
  );

  // =========================================
  // 3. CONNECTED NEURAL LINES
  // =========================================

  const lineIndices = [];

  for (let ix = 0; ix < cols; ix++) {
    for (let iy = 0; iy < rows; iy++) {
      const current = ix * rows + iy;

      // Horizontal connections

      if (ix < cols - 1) {
        lineIndices.push(
          current,
          current + rows
        );
      }

      // Vertical connections

      if (iy < rows - 1) {
        lineIndices.push(
          current,
          current + 1
        );
      }

      // Diagonal connections

      if (ix < cols - 1 && iy < rows - 1) {
        lineIndices.push(
          current,
          current + rows + 1
        );
      }
    }
  }

  const lineGeometry = new THREE.BufferGeometry();

  lineGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      wavePositions,
      3
    )
  );

  lineGeometry.setIndex(lineIndices);

  const lineMaterial = new THREE.LineBasicMaterial({
    color: "#38BDF8",
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const waveLines = new THREE.LineSegments(
    lineGeometry,
    lineMaterial
  );

  scene.add(waveLines);

  // =========================================
  // 4. GLOWING WAVE NODES
  // =========================================

  const nodeMaterial = new THREE.PointsMaterial({
    size: 0.085,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const nodes = new THREE.Points(
    waveGeometry,
    nodeMaterial
  );

  scene.add(nodes);

  // =========================================
  // 5. ENERGY PULSES
  // =========================================

  const pulseCount = 24;

  const pulseGeometry = new THREE.BufferGeometry();

  const pulsePositions = new Float32Array(
    pulseCount * 3
  );

  const pulseColors = new Float32Array(
    pulseCount * 3
  );

  const pulseData = [];

  for (let i = 0; i < pulseCount; i++) {
    const color =
      i % 3 === 0
        ? cyan
        : i % 3 === 1
          ? blue
          : violet;

    pulseColors[i * 3] = color.r;
    pulseColors[i * 3 + 1] = color.g;
    pulseColors[i * 3 + 2] = color.b;

    pulseData.push({
      row: Math.floor(Math.random() * rows),
      progress: Math.random(),
      speed: 0.12 + Math.random() * 0.2,
    });
  }

  pulseGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      pulsePositions,
      3
    )
  );

  pulseGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(
      pulseColors,
      3
    )
  );

  const pulseMaterial = new THREE.PointsMaterial({
    size: 0.22,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const pulses = new THREE.Points(
    pulseGeometry,
    pulseMaterial
  );

  scene.add(pulses);

  // =========================================
  // 6. FLOATING DUST PARTICLES
  // =========================================

  const dustCount = 450;

  const dustGeometry = new THREE.BufferGeometry();

  const dustPositions = new Float32Array(
    dustCount * 3
  );

  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] =
      (Math.random() - 0.5) * 55;

    dustPositions[i * 3 + 1] =
      (Math.random() - 0.5) * 35;

    dustPositions[i * 3 + 2] =
      (Math.random() - 0.5) * 35;
  }

  dustGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      dustPositions,
      3
    )
  );

  const dustMaterial = new THREE.PointsMaterial({
    color: "#8BDFFF",
    size: 0.065,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const dust = new THREE.Points(
    dustGeometry,
    dustMaterial
  );

  scene.add(dust);

  // =========================================
  // 7. NEBULA GLOW
  // =========================================

  const glowCanvas = document.createElement("canvas");

  glowCanvas.width = 256;
  glowCanvas.height = 256;

  const ctx = glowCanvas.getContext("2d");

  if (ctx) {
    const gradient = ctx.createRadialGradient(
      128,
      128,
      0,
      128,
      128,
      128
    );

    gradient.addColorStop(
      0,
      "rgba(0, 220, 255, 0.22)"
    );

    gradient.addColorStop(
      0.35,
      "rgba(37, 99, 235, 0.12)"
    );

    gradient.addColorStop(
      0.7,
      "rgba(139, 92, 246, 0.04)"
    );

    gradient.addColorStop(
      1,
      "rgba(0, 0, 0, 0)"
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }

  const glowTexture = new THREE.CanvasTexture(
    glowCanvas
  );

  const glowGroup = new THREE.Group();

  const glowPositions = [
    [-7, 2, -9],
    [7, -3, -10],
    [0, 4, -12],
  ];

  glowPositions.forEach((position, i) => {
    const material = new THREE.SpriteMaterial({
      map: glowTexture,
      color: i === 1 ? violet : cyan,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);

    sprite.position.set(
      position[0],
      position[1],
      position[2]
    );

    sprite.scale.set(13, 13, 1);

    glowGroup.add(sprite);
  });

  scene.add(glowGroup);

  // =========================================
  // 8. MOUSE & SCROLL INTERACTION
  // =========================================

  let mouseX = 0;
  let mouseY = 0;

  let targetMouseX = 0;
  let targetMouseY = 0;

  let scrollProgress = 0;
  let smoothedScroll = 0;

  const handleMouseMove = (event) => {
    targetMouseX =
      (event.clientX / width - 0.5) * 2;

    targetMouseY =
      (event.clientY / height - 0.5) * 2;
  };

  window.addEventListener(
    "mousemove",
    handleMouseMove
  );

  function updateScroll(progress) {
    scrollProgress = THREE.MathUtils.clamp(
      progress,
      0,
      1
    );
  }

  // =========================================
  // 9. ANIMATION
  // =========================================

  const clock = new THREE.Clock();

  let animationId = 0;
  let destroyed = false;

  function animate() {
    if (destroyed) return;

    animationId = requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Particle shader time

    particleMaterial.uniforms.uTime.value = time;

    // Smooth mouse

    mouseX += (targetMouseX - mouseX) * 0.035;
    mouseY += (targetMouseY - mouseY) * 0.035;

    smoothedScroll +=
      (scrollProgress - smoothedScroll) * 0.035;

    // -----------------------------------------
    // PARTICLE UNIVERSE MOVEMENT
    // -----------------------------------------

    for (let i = 0; i < particleCount; i++) {
      const index = i * 3;

      particlePositions[index] =
        originalPositions[index] +
        Math.sin(time * 0.3 + particlePhases[i]) * 0.035;

      particlePositions[index + 1] =
        originalPositions[index + 1] +
        Math.cos(time * 0.25 + particlePhases[i]) * 0.04;

      particlePositions[index + 2] =
        originalPositions[index + 2] +
        Math.sin(time * 0.2 + particlePhases[i]) * 0.05;
    }

    particleGeometry.attributes.position.needsUpdate = true;

    universe.rotation.y = time * 0.012;
    universe.rotation.z = time * 0.004;

    // -----------------------------------------
    // NEURAL WAVE ANIMATION
    // -----------------------------------------

    let i = 0;

    for (let ix = 0; ix < cols; ix++) {
      for (let iy = 0; iy < rows; iy++) {
        const u = ix / cols;
        const v = iy / rows;

        const wave1 = Math.sin(
          u * 8 + time * 0.65 + smoothedScroll * 3
        ) * 0.65;

        const wave2 = Math.cos(
          v * 6 + time * 0.55
        ) * 0.5;

        const wave3 = Math.sin(
          (u + v) * 4 + time * 0.8
        ) * 0.35;

        const wave4 = Math.cos(
          u * 4 - v * 5 + time * 0.35
        ) * 0.2;

        wavePositions[i * 3 + 1] =
          initialY[i] +
          wave1 +
          wave2 +
          wave3 +
          wave4;

        i++;
      }
    }

    waveGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.position.needsUpdate = true;

    // -----------------------------------------
    // ENERGY PULSE MOVEMENT
    // -----------------------------------------

    for (let i = 0; i < pulseCount; i++) {
      const pulse = pulseData[i];

      pulse.progress += pulse.speed * 0.016;

      if (pulse.progress >= 1) {
        pulse.progress = 0;

        pulse.row = Math.floor(
          Math.random() * rows
        );
      }

      const colPosition =
        pulse.progress * (cols - 1);

      const col = Math.floor(colPosition);

      const nextCol = Math.min(col + 1, cols - 1);

      const fraction = colPosition - col;

      const indexA = pulse.row * cols + col;
      const indexB = pulse.row * cols + nextCol;

      const a = indexA * 3;
      const b = indexB * 3;

      pulsePositions[i * 3] =
        THREE.MathUtils.lerp(
          wavePositions[a],
          wavePositions[b],
          fraction
        );

      pulsePositions[i * 3 + 1] =
        THREE.MathUtils.lerp(
          wavePositions[a + 1],
          wavePositions[b + 1],
          fraction
        );

      pulsePositions[i * 3 + 2] =
        THREE.MathUtils.lerp(
          wavePositions[a + 2],
          wavePositions[b + 2],
          fraction
        ) + 0.12;
    }

    pulseGeometry.attributes.position.needsUpdate = true;

    // -----------------------------------------
    // DUST & NEBULA MOVEMENT
    // -----------------------------------------

    dust.rotation.y = time * 0.012;
    dust.rotation.x = Math.sin(time * 0.1) * 0.025;

    glowGroup.rotation.y =
      Math.sin(time * 0.08) * 0.06;

    // -----------------------------------------
    // CAMERA PARALLAX
    // -----------------------------------------

    camera.position.x = mouseX * 1.1;

    camera.position.y =
      -smoothedScroll * 3 + mouseY * 0.7;

    camera.position.z =
      22 - smoothedScroll * 1.2;

    camera.rotation.x =
      -mouseY * 0.025;

    camera.rotation.y =
      mouseX * 0.025;

    renderer.render(scene, camera);
  }

  animate();

  // =========================================
  // 10. RESPONSIVE
  // =========================================

  function handleResize() {
    width = window.innerWidth;
    height = window.innerHeight;

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 1.75)
    );

    particleMaterial.uniforms.uPixelRatio.value =
      renderer.getPixelRatio();
  }

  window.addEventListener("resize", handleResize);

  // =========================================
  // 11. CLEANUP
  // =========================================

  function destroy() {
    destroyed = true;

    cancelAnimationFrame(animationId);

    window.removeEventListener(
      "mousemove",
      handleMouseMove
    );

    window.removeEventListener(
      "resize",
      handleResize
    );

    particleGeometry.dispose();
    particleMaterial.dispose();

    waveGeometry.dispose();
    lineGeometry.dispose();
    lineMaterial.dispose();

    nodeMaterial.dispose();

    pulseGeometry.dispose();
    pulseMaterial.dispose();

    dustGeometry.dispose();
    dustMaterial.dispose();

    glowTexture.dispose();

    glowGroup.children.forEach((child) => {
      if (child instanceof THREE.Sprite) {
        child.material.dispose();
      }
    });

    renderer.dispose();
  }

  return {
    updateScroll,
    destroy,
  };
}