import { FlappyBirdGame } from './game.js';

console.log('[Main] main.js loaded at', new Date().toISOString());
console.log('[Main] Document ready state:', document.readyState);

// Add global diagnostic function
window.diagnoseKeyboardIssue = function() {
    console.log('===== KEYBOARD DIAGNOSTIC =====');
    console.log('Document ready state:', document.readyState);
    console.log('Game object exists:', !!window.game);
    console.log('Canvas element exists:', !!document.getElementById('game-canvas'));
    console.log('Body element exists:', !!document.body);

    // Test keyboard event
    console.log('Testing if keydown event fires...');
    let testEventFired = false;
    const testHandler = (e) => {
        testEventFired = true;
        console.log('TEST: Keyboard event detected!', e.code, e.key);
    };

    window.addEventListener('keydown', testHandler);
    console.log('Test handler attached. Press any key now...');

    setTimeout(() => {
        window.removeEventListener('keydown', testHandler);
        if (testEventFired) {
            console.log('✓ Keyboard events ARE working');
        } else {
            console.log('✗ NO keyboard events detected - possible browser security policy or focus issue');
            console.log('Try clicking on the page first, then press a key');
        }
    }, 3000);

    console.log('===== END DIAGNOSTIC =====');
};

// Log all uncaught errors
window.addEventListener('error', (e) => {
    console.error('[Main] Uncaught error:', e.message, e.filename, e.lineno, e.colno);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('[Main] Unhandled promise rejection:', e.reason);
});

// CRITICAL FIX: DOMContentLoaded may never fire if DOM is already loaded
// Module scripts can execute after DOM is ready, so we must check readyState
function initializeGame() {
    console.log('[Main] ===== INITIALIZATION FUNCTION CALLED =====');
    console.log('[Main] Timestamp:', new Date().toISOString());
    console.log('[Main] Document ready state:', document.readyState);
    console.log('[Main] Body exists:', !!document.body);
    console.log('[Main] Canvas exists:', !!document.getElementById('game-canvas'));

    console.log('[Main] Initializing Flappy Bird game...');

    // Update debug display immediately to show initialization started
    const debugDiv = document.getElementById('debug-key-display');
    if (debugDiv) {
        console.log('[Main] Found debug div, updating to "Loading game assets..."');
        debugDiv.textContent = 'Loading game assets...';
        debugDiv.style.backgroundColor = '#336699';
    } else {
        console.error('[Main] DEBUG DIV NOT FOUND - this should not happen!');
    }

    try {
        console.log('[Main] Creating FlappyBirdGame instance...');
        const game = new FlappyBirdGame();
        console.log('[Main] Game initialized successfully');
        console.log('[Main] Game state:', game.state);
        console.log('[Main] Game canvas:', game.canvas);
        window.game = game;

        console.log('[Main] ===== INITIALIZATION COMPLETE =====');
        console.log('[Main] You can run window.diagnoseKeyboardIssue() to test keyboard events');
        console.log('[Main] Press SPACEBAR to start the game');

        // Visual confirmation in debug display - update immediately, no setTimeout
        if (debugDiv) {
            console.log('[Main] Updating debug div to READY state');
            debugDiv.textContent = '✓ READY - Press SPACEBAR or CLICK to start!';
            debugDiv.style.backgroundColor = '#006600';
            debugDiv.style.fontWeight = 'bold';
        }

    } catch (error) {
        console.error('[Main] Failed to initialize game:', error);
        console.error('[Main] Error stack:', error.stack);

        // Visual error indicator
        if (debugDiv) {
            debugDiv.textContent = '✗ Game initialization failed - check console';
            debugDiv.style.backgroundColor = '#660000';
        }
    }
}

// CRITICAL FIX: Check if DOM is already loaded
console.log('[Main] Checking document ready state before adding event listener...');
console.log('[Main] Current readyState:', document.readyState);

if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded event
    console.log('[Main] DOM is still loading, adding DOMContentLoaded listener');
    window.addEventListener('DOMContentLoaded', () => {
        console.log('[Main] DOMContentLoaded event fired');
        initializeGame();
    });
} else {
    // DOM is already loaded (readyState is 'interactive' or 'complete')
    // Execute initialization immediately
    console.log('[Main] DOM already loaded (readyState:', document.readyState, '), executing immediately');
    initializeGame();
}
