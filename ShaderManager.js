import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * ShaderManager - Custom GLSL shaders for visual effects.
 *
 * Provides:
 *   - Animated gradient sky background with moving clouds
 *   - Scrolling ground/terrain plane
 *   - Screen shake utility for collision feedback
 */
export class ShaderManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.time = 0;
        this.shakeIntensity = 0;
        this.cameraBasePos = camera.position.clone();

        this.skyMesh = null;
        this.groundMesh = null;

        this.createSkyBackground();
        this.createGround();
    }

    // ---------------------------------------------------------------
    //  Animated sky with procedural clouds
    // ---------------------------------------------------------------
    createSkyBackground() {
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float uTime;
            varying vec2 vUv;

            // Simple hash-based noise
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                float a = hash(i);
                float b = hash(i + vec2(1.0, 0.0));
                float c = hash(i + vec2(0.0, 1.0));
                float d = hash(i + vec2(1.0, 1.0));
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }

            float fbm(vec2 p) {
                float v = 0.0;
                float a = 0.5;
                for (int i = 0; i < 4; i++) {
                    v += a * noise(p);
                    p *= 2.0;
                    a *= 0.5;
                }
                return v;
            }

            void main() {
                // Sky gradient: deep blue at top -> light blue at horizon
                vec3 topColor    = vec3(0.25, 0.55, 0.95);
                vec3 bottomColor = vec3(0.65, 0.85, 1.0);
                vec3 sky = mix(bottomColor, topColor, vUv.y);

                // Clouds drifting right-to-left
                vec2 cloudUv = vUv * vec2(4.0, 2.0) + vec2(uTime * 0.04, 0.0);
                float cloud = fbm(cloudUv);
                cloud = smoothstep(0.4, 0.7, cloud);

                // Fade clouds near bottom so they don't cover ground area
                cloud *= smoothstep(0.15, 0.45, vUv.y);

                vec3 cloudColor = vec3(1.0);
                vec3 color = mix(sky, cloudColor, cloud * 0.6);

                // Subtle warm sun glow in upper-right
                float sun = 1.0 - length((vUv - vec2(0.8, 0.85)) * vec2(1.5, 1.0));
                sun = pow(max(sun, 0.0), 3.0) * 0.35;
                color += vec3(1.0, 0.9, 0.6) * sun;

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const skyMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const skyGeo = new THREE.PlaneGeometry(60, 30);
        this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
        this.skyMesh.position.set(0, 2, -15);
        this.skyMesh.renderOrder = -1;
        this.scene.add(this.skyMesh);
    }

    // ---------------------------------------------------------------
    //  Scrolling ground with grass-like shader
    // ---------------------------------------------------------------
    createGround() {
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float uTime;
            varying vec2 vUv;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }

            void main() {
                vec2 uv = vUv;
                uv.x += uTime * 0.15; // scroll with game

                // Base grass color with subtle variation
                vec3 grass1 = vec3(0.2, 0.6, 0.15);
                vec3 grass2 = vec3(0.25, 0.7, 0.2);
                float pattern = hash(floor(uv * 40.0));
                vec3 color = mix(grass1, grass2, pattern);

                // Darker stripe rows for depth
                float stripe = smoothstep(0.48, 0.5, fract(uv.y * 8.0));
                color *= 0.9 + 0.1 * stripe;

                // Fade at far edge
                color *= smoothstep(0.0, 0.15, vUv.y);

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const groundMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide
        });

        const groundGeo = new THREE.PlaneGeometry(60, 4);
        this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
        this.groundMesh.position.set(0, -5.5, -2);
        this.scene.add(this.groundMesh);
    }

    // ---------------------------------------------------------------
    //  Screen shake
    // ---------------------------------------------------------------
    triggerShake(intensity = 0.3) {
        this.shakeIntensity = intensity;
    }

    // ---------------------------------------------------------------
    //  Per-frame update
    // ---------------------------------------------------------------
    update(deltaTime) {
        this.time += deltaTime;

        // Update shader uniforms
        if (this.skyMesh) this.skyMesh.material.uniforms.uTime.value = this.time;
        if (this.groundMesh) this.groundMesh.material.uniforms.uTime.value = this.time;

        // Screen shake decay
        if (this.shakeIntensity > 0.001) {
            this.camera.position.x = this.cameraBasePos.x + (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.y = this.cameraBasePos.y + (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= 0.88; // fast decay
        } else if (this.shakeIntensity > 0) {
            this.camera.position.copy(this.cameraBasePos);
            this.shakeIntensity = 0;
        }
    }
}
