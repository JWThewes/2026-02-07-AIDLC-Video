import * as THREE from 'three';

const GameState = {
  READY: 'READY',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

class FlappyBirdGame {
  constructor() {
    this.state = GameState.READY;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.lastTime = 0;
    this.deltaTime = 0;
  }

  init() {
    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    this.setupLighting();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    this.animate(0);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: document.getElementById('gameCanvas'),
      antialias: true 
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  update(deltaTime) {
    // Game logic updates will be added by other tasks
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate(currentTime) {
    requestAnimationFrame((time) => this.animate(time));
    
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (this.state === GameState.PLAYING) {
      this.update(this.deltaTime);
    }
    
    this.render();
  }

  setState(newState) {
    this.state = newState;
  }

  getState() {
    return this.state;
  }
}

export { FlappyBirdGame, GameState };
