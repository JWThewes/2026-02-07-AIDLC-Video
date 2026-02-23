import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * Pipe - Individual pipe obstacle with a clear gap for the bird to fly through.
 *
 * Each pipe pair consists of two tall cylinders:
 *   - Top pipe: hangs down from above, bottom edge at gapY + gapSize/2
 *   - Bottom pipe: rises up from below, top edge at gapY - gapSize/2
 *
 * The gap between them is clearly visible empty space.
 */
export class Pipe {
    constructor(scene, assetLoader, x, gapY, gapSize) {
        this.scene = scene;
        this.scored = false;
        this.gapY = gapY;
        this.gapSize = gapSize;

        const pipeHeight = 20; // tall enough to extend well off-screen
        const halfPipe = pipeHeight / 2;

        // Top pipe: bottom edge sits at gapY + gapSize/2
        // Center of top pipe = gapY + gapSize/2 + halfPipe
        const topCenterY = gapY + gapSize / 2 + halfPipe;

        // Bottom pipe: top edge sits at gapY - gapSize/2
        // Center of bottom pipe = gapY - gapSize/2 - halfPipe
        const bottomCenterY = gapY - gapSize / 2 - halfPipe;

        this.top = this.createPipeMesh(pipeHeight);
        this.top.position.set(x, topCenterY, 0);

        this.bottom = this.createPipeMesh(pipeHeight);
        this.bottom.position.set(x, bottomCenterY, 0);

        this.scene.add(this.top);
        this.scene.add(this.bottom);
    }

    createPipeMesh(height) {
        const group = new THREE.Group();
        const variation = Math.floor(Math.random() * 3);

        const colors = [0x00aa00, 0x9933ff, 0xff6600];
        const color = colors[variation];

        const material = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.6,
            metalness: 0.2
        });

        // Main body
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, height, 16),
            material
        );
        group.add(body);

        // Rim at the opening end (bottom of top pipe / top of bottom pipe)
        const rimMat = material.clone();
        rimMat.color.multiplyScalar(0.8);
        const rim = new THREE.Mesh(
            new THREE.CylinderGeometry(0.65, 0.65, 0.4, 16),
            rimMat
        );
        // Place rim at the edge closest to the gap (bottom of this mesh)
        rim.position.y = -height / 2;
        group.add(rim);

        return group;
    }

    update(deltaTime, speed) {
        const dx = speed * deltaTime;
        this.top.position.x -= dx;
        this.bottom.position.x -= dx;
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
 * PipeManager - Spawns, updates, and recycles pipe pairs.
 */
export class PipeManager {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.pipes = [];
        this.pipeSpacing = 5;
    }

    spawnPipe(gapSize) {
        // Random gap center between -2 and 2 (well within the -4..4 play area)
        const gapY = (Math.random() - 0.5) * 4;
        const pipe = new Pipe(this.scene, this.assetLoader, 10, gapY, gapSize);
        this.pipes.push(pipe);
    }

    update(deltaTime, speed) {
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.update(deltaTime, speed);
            if (pipe.getX() < -10) {
                pipe.remove();
                this.pipes.splice(i, 1);
            }
        }

        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].getX() < this.pipeSpacing) {
            return true;
        }
        return false;
    }

    checkCollisions(birdBox, birdX) {
        for (const pipe of this.pipes) {
            if (pipe.checkCollision(birdBox)) {
                return true;
            }
            if (!pipe.scored && pipe.getX() < birdX) {
                pipe.scored = true;
                return 'scored';
            }
        }
        return false;
    }

    reset() {
        this.pipes.forEach(p => p.remove());
        this.pipes = [];
    }
}
