import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * Bird - Handles bird physics, controls, and rendering
 */
export class Bird {
  constructor(model, audioManager) {
    this.model = model;
    this.audioManager = audioManager;
    
    // Physics properties
    this.velocity = 0;
    this.gravity = -25;
    this.flapForce = 8;
    this.maxVelocity = 15;
    this.minVelocity = -15;
    
    // Position boundaries
    this.minY = -4;
    this.maxY = 5;
    
    // Initial position
    this.reset();
    
    // Input handling
    this.setupInputHandlers();
  }

  /**
   * Reset bird to initial state
   */
  reset() {
    this.model.position.set(-2, 0, 0);
    this.velocity = 0;
    this.model.rotation.z = 0;
  }

  /**
   * Setup keyboard and touch input handlers
   */
  setupInputHandlers() {
    // Keyboard handler (spacebar)
    this.keydownHandler = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        this.flap();
      }
    };
    
    // Touch handler
    this.touchHandler = (event) => {
      event.preventDefault();
      this.flap();
    };
    
    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('touchstart', this.touchHandler);
  }

  /**
   * Remove input handlers
   */
  removeInputHandlers() {
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('touchstart', this.touchHandler);
  }

  /**
   * Apply flap force to bird
   */
  flap() {
    this.velocity = this.flapForce;
    if (this.audioManager) {
      this.audioManager.play('flap');
    }
  }

  /**
   * Update bird physics
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    // Apply gravity
    this.velocity += this.gravity * deltaTime;
    
    // Clamp velocity
    this.velocity = Math.max(this.minVelocity, Math.min(this.maxVelocity, this.velocity));
    
    // Update position
    this.model.position.y += this.velocity * deltaTime;
    
    // Apply position boundaries
    if (this.model.position.y < this.minY) {
      this.model.position.y = this.minY;
      this.velocity = 0;
    }
    if (this.model.position.y > this.maxY) {
      this.model.position.y = this.maxY;
      this.velocity = 0;
    }
    
    // Update rotation based on velocity
    const targetRotation = THREE.MathUtils.clamp(this.velocity * 0.1, -0.5, 0.5);
    this.model.rotation.z = THREE.MathUtils.lerp(this.model.rotation.z, targetRotation, 0.1);
  }

  /**
   * Get bird's bounding box for collision detection
   * @returns {THREE.Box3} - Bounding box
   */
  getBoundingBox() {
    const box = new THREE.Box3().setFromObject(this.model);
    return box;
  }

  /**
   * Get bird's current position
   * @returns {THREE.Vector3} - Position
   */
  getPosition() {
    return this.model.position.clone();
  }

  /**
   * Check if bird is out of bounds
   * @returns {boolean} - True if out of bounds
   */
  isOutOfBounds() {
    return this.model.position.y <= this.minY || this.model.position.y >= this.maxY;
  }
}
