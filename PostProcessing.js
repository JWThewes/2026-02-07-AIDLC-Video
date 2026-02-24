import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js';

/**
 * PostProcessing - Bloom, color grading, and vignette via Three.js EffectComposer.
 *
 * Pipeline:
 *   RenderPass -> UnrealBloomPass -> ColorGrading+Vignette ShaderPass
 */

// Custom color-grading + vignette shader
const ColorGradingShader = {
    uniforms: {
        tDiffuse: { value: null },
        uBrightness: { value: 0.02 },
        uContrast: { value: 1.08 },
        uSaturation: { value: 1.15 },
        uVignetteStrength: { value: 0.35 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uBrightness;
        uniform float uContrast;
        uniform float uSaturation;
        uniform float uVignetteStrength;
        varying vec2 vUv;

        void main() {
            vec4 tex = texture2D(tDiffuse, vUv);
            vec3 c = tex.rgb;

            // Brightness & contrast
            c = (c - 0.5) * uContrast + 0.5 + uBrightness;

            // Saturation
            float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
            c = mix(vec3(lum), c, uSaturation);

            // Vignette
            vec2 uv = vUv * 2.0 - 1.0;
            float vig = 1.0 - dot(uv * 0.5, uv * 0.5);
            vig = smoothstep(0.0, 1.0, vig);
            c *= mix(1.0, vig, uVignetteStrength);

            gl_FragColor = vec4(c, tex.a);
        }
    `
};

export class PostProcessing {
    constructor(renderer, scene, camera) {
        this.composer = new EffectComposer(renderer);

        // 1. Render pass
        this.composer.addPass(new RenderPass(scene, camera));

        // 2. Bloom
        const bloomRes = new THREE.Vector2(window.innerWidth, window.innerHeight);
        this.bloomPass = new UnrealBloomPass(bloomRes, 0.4, 0.6, 0.85);
        this.composer.addPass(this.bloomPass);

        // 3. Color grading + vignette
        this.colorPass = new ShaderPass(ColorGradingShader);
        this.composer.addPass(this.colorPass);
    }

    resize(width, height) {
        this.composer.setSize(width, height);
        this.bloomPass.resolution.set(width, height);
    }

    render() {
        this.composer.render();
    }
}
