import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * AudioManager - Handles audio playback and sound effects
 */
export class AudioManager {
  constructor(camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    
    this.sounds = new Map();
    this.audioContext = null;
    this.enabled = true;
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  /**
   * Add a sound to the manager
   * @param {string} name - Sound identifier
   * @param {AudioBuffer} buffer - Audio buffer
   */
  addSound(name, buffer) {
    const sound = new THREE.Audio(this.listener);
    sound.setBuffer(buffer);
    this.sounds.set(name, sound);
  }

  /**
   * Create a funny flap sound using Web Audio API
   * @returns {AudioBuffer|null} - Generated audio buffer or null if audioContext unavailable
   */
  createFlapSound() {
    if (!this.audioContext) return null;
    
    const duration = 0.15;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a quick "whoosh" sound
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 20);
      const frequency = 400 - t * 300;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    return buffer;
  }

  /**
   * Create a funny score sound using Web Audio API
   * @returns {AudioBuffer|null} - Generated audio buffer or null if audioContext unavailable
   */
  createScoreSound() {
    if (!this.audioContext) return null;
    
    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a cheerful "ding" sound
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);
      const frequency = 800 + Math.sin(t * 30) * 100;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4;
    }

    return buffer;
  }

  /**
   * Create a funny collision sound using Web Audio API
   * @returns {AudioBuffer|null} - Generated audio buffer or null if audioContext unavailable
   */
  createCollisionSound() {
    if (!this.audioContext) return null;
    
    const duration = 0.4;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a comical "bonk" sound
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 10);
      const noise = (Math.random() - 0.5) * 0.3;
      const tone = Math.sin(2 * Math.PI * (200 - t * 150) * t) * 0.5;
      data[i] = (tone + noise) * envelope * 0.5;
    }

    return buffer;
  }

  /**
   * Generate all sound effects
   */
  generateSounds() {
    if (!this.audioContext) {
      this.init();
    }
    
    // Verify audioContext was successfully initialized
    if (!this.audioContext) {
      console.warn('AudioManager: Failed to initialize audio context. Audio will be disabled.');
      this.enabled = false;
      return;
    }

    const flapBuffer = this.createFlapSound();
    const scoreBuffer = this.createScoreSound();
    const collisionBuffer = this.createCollisionSound();

    // Only add sounds if buffers were successfully created
    if (flapBuffer) this.addSound('flap', flapBuffer);
    if (scoreBuffer) this.addSound('score', scoreBuffer);
    if (collisionBuffer) this.addSound('collision', collisionBuffer);
  }

  /**
   * Play a sound by name
   * @param {string} name - Sound identifier
   */
  play(name) {
    if (!this.enabled) return;

    const sound = this.sounds.get(name);
    if (sound) {
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.play();
    }
  }

  /**
   * Toggle audio on/off
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Set volume for all sounds
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.sounds.forEach(sound => {
      sound.setVolume(Math.max(0, Math.min(1, volume)));
    });
  }
}
