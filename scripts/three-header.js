import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js";

const header = document.querySelector(".bubble-header");
const canvas = document.querySelector("#bubble-header-canvas");

if (header && canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const geometry = new THREE.PlaneGeometry(6, 1.25, 18, 6);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(geometry, material);
  const pointer = new THREE.Vector2();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  camera.position.z = 7;
  scene.add(plane);

  new THREE.TextureLoader().load(
    "assets/bubbleText.jpeg",
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      material.map = texture;
      material.opacity = 1;
      material.needsUpdate = true;
      header.classList.add("has-texture");
    },
    undefined,
    () => {
      // The HTML title remains visible until bubbleText.jpeg is added.
    }
  );

  const resize = () => {
    const { width, height } = header.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  };

  const trackPointer = (event) => {
    const bounds = header.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  };

  const render = (time = 0) => {
    const drift = reducedMotion.matches ? 0 : Math.sin(time * 0.00055) * 0.018;
    plane.rotation.x += ((pointer.y * 0.04 + drift) - plane.rotation.x) * 0.04;
    plane.rotation.y += ((pointer.x * 0.055) - plane.rotation.y) * 0.04;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", trackPointer, { passive: true });
  requestAnimationFrame(render);
}
