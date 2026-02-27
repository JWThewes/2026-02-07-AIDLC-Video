import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { AssetLoader } from './assetLoader.js';
import { AudioManager } from './audioManager.js';
import { PipeManager } from './Pipe.js';
import { ShaderManager } from './ShaderManager.js';
import { PostProcessing } from './PostProcessing.js';
import { ParticleSystem } from './ParticleSystem.js';

export class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('[Game] ERROR: Canvas element #game-canvas not found!');
            return;
        }
        console.log('[Game] Canvas found:', this.canvas);
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.bird = null;
        this.pipeManager = null;
        this.state = 'READY'; // READY, PLAYING, GAME_OVER
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('flappyHighScore') || '0');
        this.birdVelocity = 0;
        // Physics constants use SECONDS for deltaTime (converted from ms in animate())
        // Reference: Bird.js has gravity=-25, flapForce=8 which works well
        this.gravity = -25;       // units/sec^2 - moderate pull downward
        this.flapForce = 7.5;     // units/sec - SET velocity on flap (not additive)
        this.maxFallSpeed = -10;  // units/sec - terminal velocity cap
        this.gameSpeed = 3;
        this.pipeGap = 3.5;
        this.lastTime = 0;
        this.assetLoader = new AssetLoader();
        this.audioManager = null;
        this.shaderManager = null;
        this.postProcessing = null;
        this.particleSystem = null;
        
        this.init();
    }

    init() {
        console.log('[Game] init() started');
        
        if (!this.canvas) {
            console.error('[Game] Cannot init - canvas not found');
            return;
        }
        
        try {
            this.setupScene();
            console.log('[Game] Scene setup complete');
            this.setupCamera();
            console.log('[Game] Camera setup complete');
            this.setupRenderer();
            console.log('[Game] Renderer setup complete');
            this.setupLights();
            console.log('[Game] Lights setup complete');
            this.createBird();
            console.log('[Game] Bird created');
            this.audioManager = new AudioManager(this.camera);
            console.log('[Game] Audio manager created');
            this.pipeManager = new PipeManager(this.scene, this.assetLoader);
            console.log('[Game] Pipe manager created');
            this.shaderManager = new ShaderManager(this.scene, this.camera);
            console.log('[Game] Shader manager created');
            this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera);
            console.log('[Game] Post processing created');
            this.particleSystem = new ParticleSystem(this.scene);
            console.log('[Game] Particle system created');
            this.setupInput();
            this.updateUI();
            this.animate();
            console.log('[Game] init() complete - game is ready to play!');
        } catch (error) {
            console.error('[Game] Error during init():', error);
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 15, 50);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 8);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        if (this.postProcessing) this.postProcessing.resize(width, height);
    }

    setupLights() {
        // Hemisphere light for natural sky/ground color bleed
        const hemiLight = new THREE.HemisphereLight(0x88ccff, 0x44aa44, 0.5);
        this.scene.add(hemiLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xfff5e0, 1.0);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);

        // Warm point light near bird for rim-lighting effect
        const pointLight = new THREE.PointLight(0xffaa44, 0.6, 15);
        pointLight.position.set(-2, 2, 5);
        this.scene.add(pointLight);
    }

    createBird() {
        this.bird = this.assetLoader.createBirdModel();
        this.bird.position.set(-2, 0, 0);
        // Enhance bird materials with subtle emissive glow
        this.bird.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.emissive = child.material.color.clone().multiplyScalar(0.15);
                child.material.emissiveIntensity = 0.4;
                child.material.metalness = Math.min(child.material.metalness + 0.1, 0.5);
                child.material.roughness = Math.max(child.material.roughness - 0.1, 0.3);
            }
        });
        this.scene.add(this.bird);
    }

    setupInput() {
        console.log('[Game] ===== SETUP INPUT STARTED =====');
        console.log('[Game] Document ready state:', document.readyState);
        console.log('[Game] Window object exists:', typeof window !== 'undefined');
        console.log('[Game] Document object exists:', typeof document !== 'undefined');

        // STRATEGY 1: Global keyboard monitor (FIRST priority - catches everything)
        const globalKeyMonitor = (e) => {
            console.log('[GLOBAL KEY MONITOR] Key detected BEFORE game handler:', {
                code: e.code,
                key: e.key,
                keyCode: e.keyCode,
                type: e.type,
                target: e.target.tagName,
                timestamp: Date.now()
            });

            // Update visual debug indicator
            const debugDiv = document.getElementById('debug-key-display');
            if (debugDiv) {
                debugDiv.textContent = `Last key: ${e.code} (${e.key}) at ${new Date().toLocaleTimeString()}`;
                debugDiv.style.backgroundColor = '#00ff00';
                setTimeout(() => {
                    debugDiv.style.backgroundColor = '#333';
                }, 200);
            }
        };

        // Attach global monitor at capture phase (runs before bubble phase)
        window.addEventListener('keydown', globalKeyMonitor, true);
        window.addEventListener('keyup', globalKeyMonitor, true);
        console.log('[Game] Global keyboard monitor attached (capture phase)');

        // STRATEGY 2: Multiple redundant handlers with different binding approaches
        const handleKeyDown = (e) => {
            console.log('[Game] ===== GAME KEY HANDLER FIRED =====');
            console.log('[Game] Key pressed:', e.code, e.key, e.keyCode);
            console.log('[Game] Event type:', e.type);
            console.log('[Game] Target element:', e.target);
            console.log('[Game] Current game state:', this.state);

            if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar' || e.keyCode === 32) {
                console.log('[Game] !!!!! SPACEBAR CONFIRMED !!!!!');
                e.preventDefault();
                e.stopPropagation();
                console.log('[Game] Calling handleInput() with state:', this.state);
                this.handleInput();
            }
        };

        // Attach to window (bubble phase)
        window.addEventListener('keydown', handleKeyDown, false);
        console.log('[Game] Handler attached to window (bubble)');

        // Attach to document (bubble phase)
        document.addEventListener('keydown', handleKeyDown, false);
        console.log('[Game] Handler attached to document (bubble)');

        // Attach to body (bubble phase)
        document.body.addEventListener('keydown', handleKeyDown, false);
        console.log('[Game] Handler attached to body (bubble)');

        // STRATEGY 3: Canvas-specific handler
        if (this.canvas) {
            this.canvas.setAttribute('tabindex', '0');
            this.canvas.addEventListener('keydown', handleKeyDown, false);
            console.log('[Game] Handler attached to canvas with tabindex');

            // Auto-focus canvas on click
            this.canvas.addEventListener('click', () => {
                console.log('[Game] Canvas clicked, focusing...');
                this.canvas.focus();
            });
        }

        // STRATEGY 4: Pointer/touch inputs
        const handlePointerInput = (e) => {
            e.preventDefault();
            console.log('[Game] Pointer input detected:', e.type);
            this.handleInput();
        };

        window.addEventListener('touchstart', handlePointerInput, { passive: false });
        window.addEventListener('mousedown', handlePointerInput);
        document.addEventListener('click', handlePointerInput);
        console.log('[Game] Pointer listeners attached');

        // STRATEGY 5: Test immediate spacebar detection
        console.log('[Game] Testing immediate key detection - press spacebar now...');
        setTimeout(() => {
            console.log('[Game] 5 seconds passed, checking if spacebar was pressed...');
        }, 5000);

        console.log('[Game] ===== SETUP INPUT COMPLETE =====');
        console.log('[Game] Press any key to test - watch console for [GLOBAL KEY MONITOR] messages');
    }

    handleInput() {
        console.log('[Game] ===== HANDLE INPUT CALLED =====');
        console.log('[Game] Current state:', this.state);
        console.log('[Game] Bird exists:', !!this.bird);
        console.log('[Game] Bird velocity:', this.birdVelocity);

        if (this.state === 'READY') {
            console.log('[Game] State is READY - calling startGame()');
            this.startGame();
        } else if (this.state === 'PLAYING') {
            console.log('[Game] State is PLAYING - calling flap()');
            this.flap();
        } else if (this.state === 'GAME_OVER') {
            console.log('[Game] State is GAME_OVER - calling restart()');
            this.restart();
        } else {
            console.log('[Game] WARNING: Unknown state:', this.state);
        }
        console.log('[Game] ===== HANDLE INPUT COMPLETE =====');
    }

    startGame() {
        console.log('[Game] ===== START GAME CALLED =====');
        console.log('[Game] Changing state from', this.state, 'to PLAYING');
        this.state = 'PLAYING';

        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.classList.add('hidden');
            console.log('[Game] Start screen hidden');
        } else {
            console.error('[Game] Start screen element not found!');
        }

        this.pipeManager.spawnPipe(this.pipeGap);
        console.log('[Game] Pipe spawned');

        this.birdVelocity = this.flapForce;
        console.log('[Game] Bird velocity set to:', this.birdVelocity);

        if (this.audioManager) {
            this.audioManager.play('flap');
            console.log('[Game] Flap sound played');
        }
        console.log('[Game] ===== START GAME COMPLETE =====');
    }

    flap() {
        this.birdVelocity = this.flapForce;
        if (this.audioManager) this.audioManager.play('flap');
    }

    update(deltaTime) {
        if (this.state !== 'PLAYING') {
            // Still update visual systems when not playing for ambient animation
            this.shaderManager.update(deltaTime);
            this.particleSystem.update(deltaTime);
            return;
        }

        // Update bird physics
        this.birdVelocity += this.gravity * deltaTime;
        // Clamp to terminal velocity (max fall speed)
        this.birdVelocity = Math.max(this.maxFallSpeed, this.birdVelocity);
        this.bird.position.y += this.birdVelocity * deltaTime;
        this.bird.rotation.z = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.birdVelocity * 0.15));

        // Animate wings based on velocity
        const wingAngle = 0.3 + Math.sin(Date.now() * 0.015) * 0.2;
        if (this.bird.children.length >= 7) {
            this.bird.children[5].rotation.z = -wingAngle; // left wing
            this.bird.children[6].rotation.z = wingAngle;  // right wing
        }

        // Update pipes and check for spawning
        const shouldSpawn = this.pipeManager.update(deltaTime, this.gameSpeed, this.bird.position.x);
        if (shouldSpawn) {
            this.pipeManager.spawnPipe(this.pipeGap);
        }

        // Check collisions and scoring
        const birdBox = new THREE.Box3().setFromObject(this.bird);
        const collisionResult = this.pipeManager.checkCollisions(birdBox, this.bird.position.x);
        
        if (collisionResult === true) {
            this.gameOver();
        } else if (collisionResult === 'scored') {
            this.score++;
            if (this.audioManager) this.audioManager.play('score');
            this.updateUI();
            // Score sparkle particles
            this.particleSystem.spawnSparkles(this.bird.position.clone());
            
            // Increase difficulty
            this.gameSpeed += 0.1;
            this.pipeGap = Math.max(2.5, this.pipeGap - 0.02);
        }

        // Check ground/ceiling collision
        if (this.bird.position.y < -4 || this.bird.position.y > 4) {
            this.gameOver();
        }

        // Update visual systems
        this.shaderManager.update(deltaTime);
        this.particleSystem.update(deltaTime);
    }

    gameOver() {
        this.state = 'GAME_OVER';
        if (this.audioManager) this.audioManager.play('collision');
        
        // Visual feedback: screen shake + feather burst
        this.shaderManager.triggerShake(0.35);
        this.particleSystem.spawnFeathers(this.bird.position.clone());
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyHighScore', this.highScore.toString());
        }
        
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    restart() {
        this.state = 'READY';
        this.score = 0;
        this.birdVelocity = 0;
        this.gameSpeed = 3;
        this.pipeGap = 3.5;
        
        this.bird.position.set(-2, 0, 0);
        this.bird.rotation.z = 0;
        
        this.pipeManager.reset();
        
        this.updateUI();
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
    }

    updateUI() {
        document.getElementById('current-score').textContent = this.score;
    }

    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));
        
        // Convert deltaTime from milliseconds to seconds
        let deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Guard: skip first frame (lastTime was 0) and cap at 100ms to prevent spiral
        if (deltaTime > 0.1 || deltaTime < 0) deltaTime = 1 / 60;
        
        this.update(deltaTime);
        // Render through post-processing pipeline (bloom + color grading)
        this.postProcessing.render();
    }
}
