import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * Pipe - Manages individual pipe obstacles with humorous variations
 */
export class Pipe {
    constructor(scene, assetLoader, x, gapY, gapSize) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.scored = false;
        this.gapY = gapY;
        this.gapSize = gapSize;
        
        // Create pipe pair with humorous variations
        this.top = this.createHumorousPipe();
        this.bottom = this.createHumorousPipe();
        
        // Position pipes
        this.top.position.set(x, gapY + gapSize / 2 + 2.5, 0);
        this.bottom.position.set(x, gapY - gapSize / 2 - 2.5, 0);
        this.bottom.rotation.z = Math.PI;
        
        this.scene.add(this.top);
        this.scene.add(this.bottom);
    }
    
    createHumorousPipe() {
        const pipe = new THREE.Group();
        const variation = Math.floor(Math.random() * 3);
        
        // Main pipe cylinder
        const pipeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
        let pipeMaterial;
        
        // Humorous color variations
        switch(variation) {
            case 0: // Classic green
                pipeMaterial = new THREE.MeshStandardMaterial({
                    color: 0x00aa00,
                    roughness: 0.7,
                    metalness: 0.1
                });
                break;
            case 1: // Silly purple
                pipeMaterial = new THREE.MeshStandardMaterial({
                    color: 0x9933ff,
                    roughness: 0.6,
                    metalness: 0.3
                });
                break;
            case 2: // Wacky orange
                pipeMaterial = new THREE.MeshStandardMaterial({
                    color: 0xff6600,
                    roughness: 0.5,
                    metalness: 0.2
                });
                break;
        }
        
        const cylinder = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe.add(cylinder);
        
        // Pipe rim (top)
        const rimGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16);
        const rimMaterial = pipeMaterial.clone();
        rimMaterial.color.multiplyScalar(0.8);
        
        const topRim = new THREE.Mesh(rimGeometry, rimMaterial);
        topRim.position.y = 4.15;
        pipe.add(topRim);
        
        // Pipe rim (bottom)
        const bottomRim = new THREE.Mesh(rimGeometry, rimMaterial);
        bottomRim.position.y = -4.15;
        pipe.add(bottomRim);
        
        return pipe;
    }
    
    update(deltaTime, speed) {
        this.top.position.x -= speed * deltaTime;
        this.bottom.position.x -= speed * deltaTime;
    }
    
    getX() {
        return this.top.position.x;
    }
    
    checkCollision(birdBox) {
        const topBox = new THREE.Box3().setFromObject(this.top);
        const bottomBox = new THREE.Box3().setFromObject(this.bottom);
        return birdBox.intersectsBox(topBox) || birdBox.intersectsBox(bottomBox);
    }
    
    remove() {
        this.scene.remove(this.top);
        this.scene.remove(this.bottom);
    }
}

/**
 * PipeManager - Manages pipe spawning, recycling, and collision detection
 */
export class PipeManager {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.pipes = [];
        this.pipeSpacing = 5;
        this.initialGapSize = 2.5;
        this.minGapSize = 1.8;
    }
    
    spawnPipe(gapSize) {
        const gapY = (Math.random() - 0.5) * 3;
        const pipe = new Pipe(this.scene, this.assetLoader, 10, gapY, gapSize);
        this.pipes.push(pipe);
    }
    
    update(deltaTime, speed, birdX) {
        // Update all pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.update(deltaTime, speed);
            
            // Remove off-screen pipes
            if (pipe.getX() < -10) {
                pipe.remove();
                this.pipes.splice(i, 1);
            }
        }
        
        // Spawn new pipes
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].getX() < this.pipeSpacing) {
            return true; // Signal to spawn new pipe
        }
        
        return false;
    }
    
    checkCollisions(birdBox, birdX) {
        for (const pipe of this.pipes) {
            if (pipe.checkCollision(birdBox)) {
                return true;
            }
            
            // Check if bird passed pipe for scoring
            if (!pipe.scored && pipe.getX() < birdX) {
                pipe.scored = true;
                return 'scored';
            }
        }
        return false;
    }
    
    reset() {
        this.pipes.forEach(pipe => pipe.remove());
        this.pipes = [];
    }
}
