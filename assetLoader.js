import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * AssetLoader - Handles loading and caching of 3D models and audio assets
 */
export class AssetLoader {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.audioLoader = new THREE.AudioLoader();
    this.loadedModels = new Map();
    this.loadedAudio = new Map();
  }

  /**
   * Load a GLTF model
   * @param {string} path - Path to the GLTF file
   * @returns {Promise<THREE.Group>} - Loaded model
   */
  async loadModel(path) {
    if (this.loadedModels.has(path)) {
      return this.loadedModels.get(path).clone();
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf) => {
          this.loadedModels.set(path, gltf.scene);
          resolve(gltf.scene.clone());
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Load an audio file
   * @param {string} path - Path to the audio file
   * @returns {Promise<AudioBuffer>} - Loaded audio buffer
   */
  async loadAudio(path) {
    if (this.loadedAudio.has(path)) {
      return this.loadedAudio.get(path);
    }

    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        path,
        (buffer) => {
          this.loadedAudio.set(path, buffer);
          resolve(buffer);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Create a simple bird model using Three.js geometry
   * @returns {THREE.Group} - Bird model
   */
  createBirdModel() {
    const bird = new THREE.Group();

    // Body (ellipsoid)
    const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    bodyGeometry.scale(1, 0.8, 1.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      roughness: 0.5,
      metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bird.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdd33,
      roughness: 0.5,
      metalness: 0.2
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.4, 0.3);
    bird.add(head);

    // Beak
    const beakGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
    const beakMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.7
    });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.4, 0.6);
    bird.add(beak);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 0.5, 0.45);
    bird.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 0.5, 0.45);
    bird.add(rightEye);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.4);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      roughness: 0.6
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.5, 0, 0);
    leftWing.rotation.z = -0.3;
    bird.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.5, 0, 0);
    rightWing.rotation.z = 0.3;
    bird.add(rightWing);

    return bird;
  }

  /**
   * Create a simple pipe model using Three.js geometry
   * @returns {THREE.Group} - Pipe model
   */
  createPipeModel() {
    const pipe = new THREE.Group();

    // Main pipe cylinder
    const pipeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
    const pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aa00,
      roughness: 0.7,
      metalness: 0.1
    });
    const cylinder = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.add(cylinder);

    // Pipe rim (top)
    const rimGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x008800,
      roughness: 0.7
    });
    const topRim = new THREE.Mesh(rimGeometry, rimMaterial);
    topRim.position.y = 4.15;
    pipe.add(topRim);

    // Pipe rim (bottom)
    const bottomRim = new THREE.Mesh(rimGeometry, rimMaterial);
    bottomRim.position.y = -4.15;
    pipe.add(bottomRim);

    return pipe;
  }

  /**
   * Create bird (wrapper for createBirdModel)
   * @returns {THREE.Group} - Bird model
   */
  createBird() {
    return this.createBirdModel();
  }

  /**
   * Create pipe (wrapper for createPipeModel)
   * @returns {THREE.Group} - Pipe model
   */
  createPipe() {
    return this.createPipeModel();
  }
}
