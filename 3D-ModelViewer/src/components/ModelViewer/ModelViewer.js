import React, { useEffect, useRef, useCallback } from "react";
import { Box } from "@mui/material";
import * as THREE from "three";
import {
  loadGLTFModel,
  createCamera,
  createControls,
  createRenderer,
  setupLights,
  renderScene,
  startAnimationLoop,
  stopAnimationLoop,
  createTriadGroup,
  createTriadScene,
} from "../../services/ModelService";

const ModelViewer = ({ modelPath }) => {
  const viewerRef = useRef();
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const currentModelRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const isAnimatingRef = useRef(false);

  // Mini scene for triad
  const miniSceneRef = useRef();
  const miniCameraRef = useRef();
  const axesHelperRef = useRef();

  const renderSceneCallback = useCallback(() => {
    renderScene(
      rendererRef,
      cameraRef,
      sceneRef,
      controlsRef,
      miniSceneRef,
      miniCameraRef,
      axesHelperRef
    );
  }, []);

  const startLoop = useCallback(() => {
    startAnimationLoop(
      rendererRef,
      cameraRef,
      sceneRef,
      controlsRef,
      animationFrameIdRef,
      isAnimatingRef,
      miniSceneRef,
      miniCameraRef,
      axesHelperRef
    );
  }, []);

  const stopLoop = useCallback(() => {
    stopAnimationLoop(animationFrameIdRef, isAnimatingRef);
  }, []);

  useEffect(() => {
    if (!modelPath) return;

    const container = viewerRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = createCamera(width, height);
    const renderer = createRenderer(container, width, height);
    const controls = createControls(camera, renderer);

    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    setupLights(scene);

    // Setup mini camera, scene and triad
    const miniCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    miniCamera.position.set(0, 0, 2.5);
    miniCamera.lookAt(0, 0, 0);
    miniCameraRef.current = miniCamera;

    const miniScene = createTriadScene();
    miniSceneRef.current = miniScene;

    const axesGroup = createTriadGroup();
    miniSceneRef.current.add(axesGroup);
    axesHelperRef.current = axesGroup;

    controls.addEventListener("start", startLoop);
    controls.addEventListener("end", stopLoop);

    return () => {
      stopLoop();
      controls.removeEventListener("start", startLoop);
      controls.removeEventListener("end", stopLoop);

      if (
        renderer.domElement &&
        container.contains(renderer.domElement) &&
        miniSceneRef.current
      ) {
        miniSceneRef.current.remove(axesHelperRef.current);
        container.removeChild(renderer.domElement);
      }
    };
  }, [startLoop, stopLoop, modelPath]);

  const loadModelCallback = (model) => {
    const scene = sceneRef.current;

    if (currentModelRef.current) {
      scene.remove(currentModelRef.current);
    }

    scene.add(model);
    currentModelRef.current = model;

    renderSceneCallback();
  };

  const loadModel = useCallback(loadModelCallback, [renderSceneCallback]);

  const errorFunction = (error) => {
    console.error("Failed to load model:", error);
  };

  useEffect(() => {
    if (!modelPath || !sceneRef.current) return;
    loadGLTFModel(modelPath, loadModel, errorFunction);
  }, [loadModel, modelPath]);

  return (
    <Box
      ref={viewerRef}
      sx={{
        flex: 1,
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    />
  );
};

export default ModelViewer;
