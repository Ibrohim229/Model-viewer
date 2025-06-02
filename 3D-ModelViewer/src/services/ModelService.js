import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { API_URL } from "../constants";

const getFiles = async () => {
  const response = await fetch(`${API_URL}/files`);
  if (!response.ok) {
    throw new Error("Failed to fetch files");
  }
  return await response.json();
};

const loadGLTFModel = (path, onLoad, onError) => {
  const loader = new GLTFLoader();
  loader.load(
    path,
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.03, 0.03, 0.03);
      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);
      onLoad(model);
    },
    undefined,
    onError
  );
};

const createCamera = (width, height) => {
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 1, 3);
  return camera;
};

const createRenderer = (container, width, height) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);
  return renderer;
};

const createControls = (camera, renderer) => {
  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  return orbitControls;
};

const setupLights = (scene) => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(-5, 5, -5);
  scene.add(directionalLight);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 4);
  hemisphereLight.position.set(0, 1, 0);
  scene.add(hemisphereLight);
};

const createTriadGroup = () => {
  const group = new THREE.Group();

  const arrowLength = 0.8;
  const shaftRadius = 0.02;
  const coneHeight = 0.1;
  const coneRadius = 0.06;

  const createArrow = (dir, color, label) => {
    const arrow = new THREE.Group();

    const shaftGeometry = new THREE.CylinderGeometry(
      shaftRadius,
      shaftRadius,
      arrowLength - coneHeight
    );
    const shaftMaterial = new THREE.MeshBasicMaterial({ color });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);

    shaft.position.y = (arrowLength - coneHeight) / 2;
    arrow.add(shaft);

    const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight);
    const coneMaterial = new THREE.MeshBasicMaterial({ color });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = arrowLength - coneHeight / 2;
    arrow.add(cone);

    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      up,
      dir.clone().normalize()
    );
    arrow.quaternion.copy(quaternion);

    if (label) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = "130px Arial";
      context.fillStyle = color;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(label, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        depthTest: false,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(0.5, 0.25, 1);
      sprite.position.set(0, arrowLength + 0.1, 0);
      arrow.add(sprite);
    }

    return arrow;
  };

  const xArrow = createArrow(new THREE.Vector3(0, 0, 1), "#ff0000", "X"); // x (red)
  const yArrow = createArrow(new THREE.Vector3(1, 0, 0), "#00ff00", "Y"); // y (green)
  const zArrow = createArrow(new THREE.Vector3(0, 1, 0), "#0000ff", "Z"); // z (blue)

  group.add(xArrow);
  group.add(yArrow);
  group.add(zArrow);

  return group;
};

const createTriadScene = () => {
  const scene = new THREE.Scene();
  return scene;
};

const renderScene = (
  rendererRef,
  cameraRef,
  sceneRef,
  controlsRef,
  miniSceneRef,
  miniCameraRef,
  axesHelperRef
) => {
  if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;

  controlsRef.current?.update();

  const renderer = rendererRef.current;
  renderer.setViewport(
    0,
    0,
    renderer.domElement.width,
    renderer.domElement.height
  );
  renderer.setScissor(
    0,
    0,
    renderer.domElement.width,
    renderer.domElement.height
  );
  renderer.setScissorTest(false);

  renderer.render(sceneRef.current, cameraRef.current);
  renderer.autoClear = false;

  const size = renderer.getSize(new THREE.Vector2());
  const insetSize = Math.min(size.x, size.y) * 0.2;

  renderer.clearDepth();
  renderer.setScissorTest(true);
  renderer.setScissor(10, 10, insetSize, insetSize);
  renderer.setViewport(10, 10, insetSize, insetSize);

  if (axesHelperRef?.current && cameraRef.current) {
    axesHelperRef.current.quaternion
      .copy(cameraRef.current.quaternion)
      .invert();
  }

  renderer.render(miniSceneRef.current, miniCameraRef.current);
  renderer.setScissorTest(false);
};

const startAnimationLoop = (
  rendererRef,
  cameraRef,
  sceneRef,
  controlsRef,
  animationFrameIdRef,
  isAnimatingRef,
  gizmoRendererRef,
  gizmoSceneRef,
  gizmoCameraRef
) => {
  if (isAnimatingRef.current) {
    return;
  }

  const animate = () => {
    renderScene(
      rendererRef,
      cameraRef,
      sceneRef,
      controlsRef,
      gizmoRendererRef,
      gizmoSceneRef,
      gizmoCameraRef
    );
    animationFrameIdRef.current = requestAnimationFrame(animate);
  };

  isAnimatingRef.current = true;
  animate();
};

const stopAnimationLoop = (animationFrameIdRef, isAnimatingRef) => {
  if (animationFrameIdRef.current) {
    cancelAnimationFrame(animationFrameIdRef.current);
    animationFrameIdRef.current = null;
  }
  isAnimatingRef.current = false;
};

const convertStepFile = async (selectedFile) => {
  const formData = new FormData();
  formData.append("stepFile", selectedFile);
  const response = await fetch(`${API_URL}/convert`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("Upload failed");
  }
  return response;
};

export {
  getFiles,
  loadGLTFModel,
  createCamera,
  createRenderer,
  createControls,
  setupLights,
  createTriadGroup,
  createTriadScene,
  renderScene,
  startAnimationLoop,
  stopAnimationLoop,
  convertStepFile,
};
