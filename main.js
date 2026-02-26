import { FlappyBirdGame } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
    console.log('[Game] Initializing Flappy Bird game...');
    try {
        const game = new FlappyBirdGame();
        console.log('[Game] Game initialized successfully');
        window.game = game;
    } catch (error) {
        console.error('[Game] Failed to initialize game:', error);
    }
});
