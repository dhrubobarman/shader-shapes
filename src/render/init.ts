import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import {
  EffectComposer,
  Pass,
} from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import TickManager, { TickEvent } from "./tick-manager.js";

let scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  composer: EffectComposer,
  controls: OrbitControls,
  stats: Stats,
  gui: GUI,
  renderWidth: number,
  renderHeight: number,
  renderAspectRatio: number;

const renderTickManager = new TickManager();

export const initEngine = async () => {
  scene = new THREE.Scene();

  renderWidth = window.innerWidth;
  renderHeight = window.innerHeight;

  renderAspectRatio = renderWidth / renderHeight;

  camera = new THREE.PerspectiveCamera(75, renderAspectRatio, 0.1, 100);
  camera.position.z = 2;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(renderWidth, renderHeight);

  renderer.setClearColor(0x101114);

  // shadow
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);

  const target = new THREE.WebGLRenderTarget(renderWidth, renderHeight, {
    samples: 8,
  });
  composer = new EffectComposer(renderer, target);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  gui = new GUI();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  window.addEventListener(
    "resize",
    () => {
      renderWidth = window.innerWidth;
      renderHeight = window.innerHeight;
      renderAspectRatio = renderWidth / renderHeight;

      renderer.setPixelRatio(window.devicePixelRatio * 1.5);

      camera.aspect = renderAspectRatio;
      camera.updateProjectionMatrix();

      renderer.setSize(renderWidth, renderHeight);
      composer.setSize(renderWidth, renderHeight);
    },
    false
  );

  renderTickManager.startLoop();
};

export const useRenderer = () => renderer;

export const useRenderSize = () => ({
  width: renderWidth,
  height: renderHeight,
});

export const useScene = () => scene;

export const useCamera = () => camera;

export const useControls = () => controls;

export const useStats = () => stats;

export const useComposer = () => composer;

export const useGui = () => gui;

export const addPass = (pass: Pass) => {
  composer.addPass(pass);
};

export const useTick = (
  fn: (e: {
    timestamp: number;
    timeDiff: number;
    frame: XRFrame | null;
  }) => void
) => {
  if (renderTickManager) {
    const _tick = (e: TickEvent) => {
      fn(e.data);
    };
    renderTickManager.addEventListener("tick", (e) => _tick(e as TickEvent));
  }
};
