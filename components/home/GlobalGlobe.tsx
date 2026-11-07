"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function GlobalGlobe() {
const mountRef = useRef<HTMLDivElement>(null);

useEffect(() => {
const container = mountRef.current;
if (!container) return;


let width = container.clientWidth;
let height = container.clientHeight;
let frameId = 0;
let destroyed = false;

if (!width || !height) return;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  width / height,
  0.1,
  100
);

// Slightly closer camera for a larger globe
camera.position.z = 8.8;

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  powerPreference: "high-performance",
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(width, height);
renderer.setClearColor(0x000000, 0);

container.appendChild(renderer.domElement);

const globe = new THREE.Group();
scene.add(globe);

// Slightly increased globe size
const radius = 1.85;

// GLOBE BASE
const sphereGeometry = new THREE.SphereGeometry(radius, 64, 64);

const sphereMaterial = new THREE.MeshPhysicalMaterial({
  color: "#0B2948",
  metalness: 0.45,
  roughness: 0.3,
  transparent: true,
  opacity: 0.28,
  transmission: 0.08,
});

globe.add(new THREE.Mesh(sphereGeometry, sphereMaterial));

// ATMOSPHERE
const atmosphereGeometry = new THREE.SphereGeometry(
  radius * 1.015,
  48,
  48
);

const atmosphereMaterial = new THREE.MeshBasicMaterial({
  color: "#087CBA",
  transparent: true,
  opacity: 0.055,
  side: THREE.BackSide,
});

globe.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

// LATITUDE AND LONGITUDE GRID
const gridMaterial = new THREE.LineBasicMaterial({
  color: "#38BDF8",
  transparent: true,
  opacity: 0.16,
  blending: THREE.AdditiveBlending,
});

for (let longitude = 0; longitude < 12; longitude++) {
  const points: THREE.Vector3[] = [];
  const angle = (longitude / 12) * Math.PI * 2;

  for (let i = 0; i <= 100; i++) {
    const latitude = (i / 100) * Math.PI - Math.PI / 2;

    points.push(
      new THREE.Vector3(
        radius * Math.cos(latitude) * Math.cos(angle),
        radius * Math.sin(latitude),
        radius * Math.cos(latitude) * Math.sin(angle)
      )
    );
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  globe.add(new THREE.Line(geometry, gridMaterial));
}

for (let latitude = -60; latitude <= 60; latitude += 20) {
  const points: THREE.Vector3[] = [];
  const lat = (latitude * Math.PI) / 180;

  for (let i = 0; i <= 120; i++) {
    const longitude = (i / 120) * Math.PI * 2;

    points.push(
      new THREE.Vector3(
        radius * Math.cos(lat) * Math.cos(longitude),
        radius * Math.sin(lat),
        radius * Math.cos(lat) * Math.sin(longitude)
      )
    );
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  globe.add(new THREE.Line(geometry, gridMaterial));
}

// DIGITAL SURFACE PARTICLES
const dotCount = 1800;
const dotPositions = new Float32Array(dotCount * 3);
const dotColors = new Float32Array(dotCount * 3);

const cyan = new THREE.Color("#67E8F9");
const blue = new THREE.Color("#2563EB");
const violet = new THREE.Color("#A78BFA");

for (let i = 0; i < dotCount; i++) {
  const y = 1 - (i / (dotCount - 1)) * 2;
  const horizontalRadius = Math.sqrt(1 - y * y);
  const angle = Math.PI * (3 - Math.sqrt(5)) * i;

  const x = Math.cos(angle) * horizontalRadius;
  const z = Math.sin(angle) * horizontalRadius;

  const index = i * 3;

  dotPositions[index] = x * (radius + 0.012);
  dotPositions[index + 1] = y * (radius + 0.012);
  dotPositions[index + 2] = z * (radius + 0.012);

  const color =
    i % 9 === 0 ? violet : i % 4 === 0 ? blue : cyan;

  dotColors[index] = color.r;
  dotColors[index + 1] = color.g;
  dotColors[index + 2] = color.b;
}

const dotGeometry = new THREE.BufferGeometry();

dotGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(dotPositions, 3)
);

dotGeometry.setAttribute(
  "color",
  new THREE.BufferAttribute(dotColors, 3)
);

const dotMaterial = new THREE.PointsMaterial({
  size: 0.025,
  vertexColors: true,
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

globe.add(new THREE.Points(dotGeometry, dotMaterial));

// GLOBAL CONNECTION LOCATIONS
const locations = [
  { lat: 37.77, lon: -122.41 },
  { lat: 40.71, lon: -74.0 },
  { lat: 51.5, lon: -0.12 },
  { lat: 48.85, lon: 2.35 },
  { lat: 25.2, lon: 55.27 },
  { lat: 28.61, lon: 77.2 },
  { lat: 19.07, lon: 72.87 },
  { lat: 35.67, lon: 139.65 },
  { lat: -33.86, lon: 151.2 },
  { lat: -23.55, lon: -46.63 },
  { lat: 1.35, lon: 103.81 },
  { lat: 30.04, lon: 31.23 },
];

const getPosition = (
  lat: number,
  lon: number,
  r = radius + 0.035
) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
};

// LOCATION NODES
const nodePositions: number[] = [];

locations.forEach(({ lat, lon }) => {
  const position = getPosition(lat, lon);
  nodePositions.push(position.x, position.y, position.z);
});

const locationGeometry = new THREE.BufferGeometry();

locationGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(nodePositions, 3)
);

const locationMaterial = new THREE.PointsMaterial({
  color: "#FFFFFF",
  size: 0.075,
  transparent: true,
  opacity: 1,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

globe.add(new THREE.Points(locationGeometry, locationMaterial));

// CONNECTION ROUTES
const routeMaterial = new THREE.LineBasicMaterial({
  color: "#00E5FF",
  transparent: true,
  opacity: 0.65,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const violetRouteMaterial = new THREE.LineBasicMaterial({
  color: "#8B5CF6",
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const connections = [
  [0, 1],
  [1, 2],
  [2, 3],
  [2, 4],
  [3, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [4, 10],
  [10, 7],
  [5, 10],
  [9, 1],
  [11, 4],
  [11, 3],
];

connections.forEach(([startIndex, endIndex], index) => {
  const start = getPosition(
    locations[startIndex].lat,
    locations[startIndex].lon
  );

  const end = getPosition(
    locations[endIndex].lat,
    locations[endIndex].lon
  );

  const middle = start.clone().add(end).multiplyScalar(0.5);
  middle.normalize().multiplyScalar(radius + 0.25);

  const curve = new THREE.QuadraticBezierCurve3(
    start,
    middle,
    end
  );

  const geometry = new THREE.BufferGeometry().setFromPoints(
    curve.getPoints(48)
  );

  globe.add(
    new THREE.Line(
      geometry,
      index % 4 === 0 ? violetRouteMaterial : routeMaterial
    )
  );
});

// GLOWING LOCATION HALOS
const haloGeometry = new THREE.BufferGeometry();

haloGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(nodePositions, 3)
);

const haloMaterial = new THREE.PointsMaterial({
  color: "#00E5FF",
  size: 0.16,
  transparent: true,
  opacity: 0.3,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const halos = new THREE.Points(haloGeometry, haloMaterial);
globe.add(halos);

// FLOATING DATA PARTICLES
const particleCount = 160;
const particlePositions = new Float32Array(particleCount * 3);

const particleData = Array.from({ length: particleCount }, () => ({
  angle: Math.random() * Math.PI * 2,
  radius: radius + 0.3 + Math.random() * 0.55,
  height: (Math.random() - 0.5) * 3.0,
  speed: 0.15 + Math.random() * 0.35,
}));

const particleGeometry = new THREE.BufferGeometry();

particleGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(particlePositions, 3)
);

const particleMaterial = new THREE.PointsMaterial({
  color: "#A5F3FC",
  size: 0.03,
  transparent: true,
  opacity: 0.7,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const particles = new THREE.Points(
  particleGeometry,
  particleMaterial
);

scene.add(particles);

// LIGHTING
scene.add(new THREE.AmbientLight("#FFFFFF", 1.1));

const cyanLight = new THREE.PointLight("#00E5FF", 5, 12);
cyanLight.position.set(3, 2, 3);
scene.add(cyanLight);

const violetLight = new THREE.PointLight("#8B5CF6", 3, 12);
violetLight.position.set(-3, -2, 2);
scene.add(violetLight);

// MOUSE INTERACTION
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const handleMouseMove = (event: MouseEvent) => {
  const rect = container.getBoundingClientRect();

  targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
};

container.addEventListener("mousemove", handleMouseMove);

// RESIZE
const handleResize = () => {
  width = container.clientWidth;
  height = container.clientHeight;

  if (!width || !height) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
};

window.addEventListener("resize", handleResize);

// ANIMATION
const clock = new THREE.Clock();

const animate = () => {
  if (destroyed) return;

  frameId = requestAnimationFrame(animate);

  const time = clock.getElapsedTime();

  mouseX += (targetX - mouseX) * 0.035;
  mouseY += (targetY - mouseY) * 0.035;

  globe.rotation.y = time * 0.1 + mouseX * 0.2;
  globe.rotation.x =
    mouseY * 0.12 + Math.sin(time * 0.2) * 0.025;

  haloMaterial.opacity =
    0.2 + (Math.sin(time * 2) + 1) * 0.12;

  for (let i = 0; i < particleCount; i++) {
    const particle = particleData[i];
    const index = i * 3;

    particle.angle += particle.speed * 0.002;

    particlePositions[index] =
      Math.cos(particle.angle) * particle.radius;

    particlePositions[index + 1] =
      particle.height +
      Math.sin(time * 0.4 + particle.angle) * 0.1;

    particlePositions[index + 2] =
      Math.sin(particle.angle) * particle.radius;
  }

  particleGeometry.attributes.position.needsUpdate = true;
  particles.rotation.y = -time * 0.025;

  renderer.render(scene, camera);
};

animate();

// CLEANUP
return () => {
  destroyed = true;

  cancelAnimationFrame(frameId);

  container.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("resize", handleResize);

  scene.traverse((object) => {
    if (
      object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.Points
    ) {
      object.geometry.dispose();

      const material = object.material;

      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
      } else {
        material.dispose();
      }
    }
  });

  renderer.dispose();

  if (renderer.domElement.parentNode === container) {
    container.removeChild(renderer.domElement);
  }
};


}, []);

return ( <div
   ref={mountRef}
   className="relative h-[300px] w-full sm:h-[380px] lg:h-[440px]"
 />
);
}
