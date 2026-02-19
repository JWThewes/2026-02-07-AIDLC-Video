import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { AssetLoader } from './assetLoader.js';
import { AudioManager } from './audioManager.js';

export class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.bird = null;
        this.pipes = [];
        this.state = 'READY'; // READY, PLAYING, GAME_OVER
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('flappyHighScore') || '0');
        this.birdVelocity = 0;
        this.gravity = -0.0008;
        this.flapForce = 0.015;
        this.gameSpeed = 0.003;
        this.pipeGap = 2.5;
        this.lastTime = 0;
        this.assetLoader = new AssetLoader();
        this.audioManager = new AudioManager();
        
        this.init();
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.createBird();
        this.setupInput();
        this.updateUI();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 50);
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
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);
    }

    createBird() {
        this.bird = this.assetLoader.createBird();
        this.bird.position.set(-2, 0, 0);
        this.scene.add(this.bird);
    }

    createPipe() {
        const gapY = (Math.random() - 0.5) * 3;
        const topPipe = this.assetLoader.createPipe();
        const bottomPipe = this.assetLoader.createPipe();
        
        topPipe.position.set(10, gapY + this.pipeGap / 2 + 2.5, 0);
        bottomPipe.position.set(10, gapY - this.pipeGap / 2 - 2.5, 0);
        bottomPipe.rotation.z = Math.PI;
        
        this.scene.add(topPipe);
        this.scene.add(bottomPipe);
        
        this.pipes.push({ top: topPipe, bottom: bottomPipe, scored: false });
    }

    setupInput() {
        const handleInput = () => {
            if (this.state === 'READY') {
                this.startGame();
            } else if (this.state === 'PLAYING') {
                this.flap();
            } else if (this.state === 'GAME_OVER') {
                this.restart();
            }
        };

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handleInput();
            }
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleInput();
        });

        this.canvas.addEventListener('click', handleInput);
    }

    startGame() {
        this.state = 'PLAYING';
        document.getElementById('start-screen').classList.add('hidden');
        this.createPipe();
    }

    flap() {
        this.birdVelocity = this.flapForce;
        this.audioManager.playFlap();
    }

    update(deltaTime) {
        if (this.state !== 'PLAYING') return;

        // Update bird physics
        this.birdVelocity += this.gravity * deltaTime;
        this.bird.position.y += this.birdVelocity * deltaTime;
        this.bird.rotation.z = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.birdVelocity * 50));

        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.top.position.x -= this.gameSpeed * deltaTime;
            pipe.bottom.position.x -= this.gameSpeed * deltaTime;

            // Check scoring
            if (!pipe.scored && pipe.top.position.x < this.bird.position.x) {
                pipe.scored = true;
                this.score++;
                this.audioManager.playScore();
                this.updateUI();
                
                // Increase difficulty
                this.gameSpeed += 0.0001;
                this.pipeGap = Math.max(1.8, this.pipeGap - 0.02);
            }

            // Remove off-screen pipes
            if (pipe.top.position.x < -10) {
                this.scene.remove(pipe.top);
                this.scene.remove(pipe.bottom);
                this.pipes.splice(i, 1);
            }

            // Check collision
            if (this.checkCollision(pipe)) {
                this.gameOver();
            }
        }

        // Spawn new pipes
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].top.position.x < 5) {
            this.createPipe();
        }

        // Check ground/ceiling collision
        if (this.bird.position.y < -4 || this.bird.position.y > 4) {
            this.gameOver();
        }
    }

    checkCollision(pipe) {
        const birdBox = new THREE.Box3().setFromObject(this.bird);
        const topBox = new THREE.Box3().setFromObject(pipe.top);
        const bottomBox = new THREE.Box3().setFromObject(pipe.bottom);
        
        return birdBox.intersectsBox(topBox) || birdBox.intersectsBox(bottomBox);
    }

    gameOver() {
        this.state = 'GAME_OVER';
        this.audioManager.playHit();
        
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
        this.gameSpeed = 0.003;
        this.pipeGap = 2.5;
        
        this.bird.position.set(-2, 0, 0);
        this.bird.rotation.z = 0;
        
        this.pipes.forEach(pipe => {
            this.scene.remove(pipe.top);
            this.scene.remove(pipe.bottom);
        });
        this.pipes = [];
        
        this.updateUI();
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
    }

    updateUI() {
        document.getElementById('current-score').textContent = this.score;
    }

    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
}
