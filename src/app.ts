import * as THREE from "three";
import {
  addPass,
  useCamera,
  useGui,
  useRenderSize,
  useScene,
  useTick,
} from "./render/init.js";
// import postprocessing passes
import { SavePass } from "three/examples/jsm/postprocessing/SavePass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { BlendShader } from "three/examples/jsm/shaders/BlendShader.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import vertexPars from "@/shaders/vertex_parse.glsl?raw";
import vertexMain from "@/shaders/vertex_main.glsl?raw";

import fragmentMain from "@/shaders/fragment_main.glsl?raw";
import fragmentPars from "@/shaders/fragment_parse.glsl?raw";

const startApp = () => {
  const scene = useScene();
  const camera = useCamera();
  const gui = useGui();
  const { width, height } = useRenderSize();

  // settings
  const MOTION_BLUR_AMOUNT = 0.125;

  // lighting
  const dirLight = new THREE.DirectionalLight("#526cff", 0.6);
  dirLight.position.set(2, 2, 2);

  const ambientLight = new THREE.AmbientLight("#4255ff", 0.5);
  scene.add(dirLight, ambientLight);

  // meshes
  const geometry = new THREE.IcosahedronGeometry(1, 300);
  const material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    flatShading: true,
  });

  material.onBeforeCompile = (shader) => {
    // storing a reference to the shader
    material.userData.shader = shader;

    // uniforms
    shader.uniforms.uTime = { value: 0 };

    // vertex shader
    const parsVertexString = /* glsl */ `#include <displacementmap_pars_vertex>`;
    shader.vertexShader = shader.vertexShader.replace(
      parsVertexString,
      parsVertexString + vertexPars
    );

    const mainVertexString = /* glsl */ `#include <displacementmap_vertex>`;
    shader.vertexShader = shader.vertexShader.replace(
      mainVertexString,
      mainVertexString + vertexMain
    );

    //! fragment shader
    // const mainFragmentString = /* glsl */ `#include <normal_fragment_maps>`;
    // const parsFragmentString = /* glsl */ `#include <bumpmap_pars_fragment>`;
    // shader.fragmentShader = shader.fragmentShader.replace(
    //   parsFragmentString,
    //   parsFragmentString + fragmentPars
    // );

    // shader.fragmentShader = shader.fragmentShader.replace(
    //   mainFragmentString,
    //   mainFragmentString + fragmentMain
    // );
  };

  const ico = new THREE.Mesh(geometry, material);
  scene.add(ico);

  // GUI
  const cameraFolder = gui.addFolder("Camera");
  cameraFolder.add(camera.position, "z", 0, 10);
  cameraFolder.open();

  // postprocessing
  const renderTargetParameters = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    stencilBuffer: false,
  };

  // save pass
  const savePass = new SavePass(
    new THREE.WebGLRenderTarget(width, height, renderTargetParameters)
  );

  // blend pass
  const blendPass = new ShaderPass(BlendShader, "tDiffuse1");
  blendPass.uniforms["tDiffuse2"].value = savePass.renderTarget.texture;
  blendPass.uniforms["mixRatio"].value = MOTION_BLUR_AMOUNT;

  // output pass
  const outputPass = new ShaderPass(CopyShader);
  outputPass.renderToScreen = true;

  // adding passes to composer
  addPass(blendPass);
  addPass(savePass);
  addPass(outputPass);
  addPass(new UnrealBloomPass(new THREE.Vector2(width, height), 0.7, 0.4, 0.4));

  useTick(({ timestamp }) => {
    const time = timestamp / 10000;
    material.userData.shader.uniforms.uTime.value = time;
  });
};

export default startApp;
