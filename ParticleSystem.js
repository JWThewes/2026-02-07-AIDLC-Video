import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * ParticleSystem - Lightweight GPU-friendly particle effects.
 *
 * Effects:
 *   - Feather burst on collision (white/yellow particles exploding outward)
 *   - Score sparkle (golden particles rising upward)
 */
export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.effects = []; // active effect instances
    }

    /**
     * Spawn a feather burst at the given position.
     */
    spawnFeathers(position) {
        this._spawn(position, {
            count: 24,
            colors: [0xffffff, 0xffee88, 0xffcc00],
            speed: 4,
            lifetime: 0.8,
            size: 0.12,
            gravity: -6
        });
    }

    /**
     * Spawn score sparkles at the given position.
     */
    spawnSparkles(position) {
        this._spawn(position, {
            count: 12,
            colors: [0xffdd00, 0xffaa00, 0xffffff],
            speed: 2.5,
            lifetime: 0.6,
            size: 0.08,
            gravity: 2 // float upward
        });
    }

    // ---------------------------------------------------------------
    //  Internal: create a Points object with random velocities
    // ---------------------------------------------------------------
    _spawn(position, opts) {
        const { count, colors, speed, lifetime, size, gravity } = opts;
        const positions = new Float32Array(count * 3);
        const colorArr = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            // Random direction
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI - Math.PI / 2;
            const s = speed * (0.5 + Math.random() * 0.5);
            velocities.push(
                Math.cos(theta) * Math.cos(phi) * s,
                Math.sin(phi) * s,
                Math.sin(theta) * Math.cos(phi) * s * 0.3
            );

            const c = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
            colorArr[i * 3] = c.r;
            colorArr[i * 3 + 1] = c.g;
            colorArr[i * 3 + 2] = c.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));

        const mat = new THREE.PointsMaterial({
            size,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const points = new THREE.Points(geo, mat);
        this.scene.add(points);

        this.effects.push({
            points,
            velocities,
            gravity,
            age: 0,
            lifetime
        });
    }

    // ---------------------------------------------------------------
    //  Per-frame update
    // ---------------------------------------------------------------
    update(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const fx = this.effects[i];
            fx.age += deltaTime;

            if (fx.age >= fx.lifetime) {
                this.scene.remove(fx.points);
                fx.points.geometry.dispose();
                fx.points.material.dispose();
                this.effects.splice(i, 1);
                continue;
            }

            // Fade out
            fx.points.material.opacity = 1 - fx.age / fx.lifetime;

            // Move particles
            const posAttr = fx.points.geometry.attributes.position;
            const arr = posAttr.array;
            const count = arr.length / 3;
            for (let j = 0; j < count; j++) {
                const vi = j * 3;
                fx.velocities[vi + 1] += fx.gravity * deltaTime; // apply gravity
                arr[vi] += fx.velocities[vi] * deltaTime;
                arr[vi + 1] += fx.velocities[vi + 1] * deltaTime;
                arr[vi + 2] += fx.velocities[vi + 2] * deltaTime;
            }
            posAttr.needsUpdate = true;
        }
    }
}
