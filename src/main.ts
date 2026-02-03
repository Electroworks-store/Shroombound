/**
 * Shadow Nail - Main Entry Point
 * A Hollow Knight inspired platformer MVP
 */

import * as Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { TutorialScene } from './scenes/TutorialScene';
import { ArenaScene } from './scenes/ArenaScene';
import { BossScene } from './scenes/BossScene';
import { UIScene } from './scenes/UIScene';

// Phaser Game Configuration
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    backgroundColor: COLORS.BG_DARK,
    pixelArt: true,
    roundPixels: true,
    
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 1800 },
            debug: false,  // Set to true during development
            tileBias: 16
        }
    },
    
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 640,
            height: 360
        },
        max: {
            width: 1920,
            height: 1080
        }
    },
    
    scene: [
        BootScene,
        MenuScene,
        TutorialScene,
        ArenaScene,
        BossScene,
        UIScene
    ],
    
    // Performance settings
    fps: {
        target: GAME_CONFIG.FPS,
        forceSetTimeOut: false
    },
    
    render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true
    }
};

// Hide loading screen when game is ready
window.addEventListener('load', () => {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
});

// Create the game instance
const game = new Phaser.Game(config);

// Export for debugging in console
(window as unknown as { game: Phaser.Game }).game = game;

console.log('%c🎮 Shadow Nail v1.0.0', 'color: #00FFFF; font-size: 20px; font-weight: bold;');
console.log('%cA Hollow Knight Tribute', 'color: #4a4a6a; font-size: 14px;');
