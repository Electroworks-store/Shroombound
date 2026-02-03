/**
 * MenuScene - Title Screen
 * Simple menu with game title and start prompt
 */

import * as Phaser from 'phaser';
import { SCENES, COLORS } from '../config';

export class MenuScene extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private promptText!: Phaser.GameObjects.Text;
    
    constructor() {
        super({ key: SCENES.MENU });
    }
    
    create(): void {
        const { width, height } = this.cameras.main;
        
        this.createBackground();
        this.createTitle(width, height);
        this.createPrompt(width, height);
        this.createParticles(width, height);
        this.setupInput();
        
        // Fade in
        this.cameras.main.fadeIn(500);
    }
    
    private createBackground(): void {
        const { width, height } = this.cameras.main;
        
        // Gradient background
        const graphics = this.add.graphics();
        
        // Create vertical gradient
        for (let y = 0; y < height; y++) {
            const ratio = y / height;
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(COLORS.BG_MID),
                Phaser.Display.Color.ValueToColor(COLORS.BG_DARK),
                100,
                ratio * 100
            );
            graphics.lineStyle(1, Phaser.Display.Color.GetColor(color.r, color.g, color.b));
            graphics.lineBetween(0, y, width, y);
        }
        
        // Ground silhouette
        graphics.fillStyle(COLORS.PLATFORM_MAIN, 1);
        graphics.fillRect(0, height - 100, width, 100);
        
        // Distant structures (silhouettes)
        graphics.fillStyle(COLORS.BG_LIGHT, 0.5);
        graphics.fillTriangle(100, height - 100, 200, height - 250, 300, height - 100);
        graphics.fillTriangle(400, height - 100, 500, height - 200, 600, height - 100);
        graphics.fillRect(800, height - 180, 60, 80);
        graphics.fillRect(900, height - 160, 80, 60);
        graphics.fillTriangle(1000, height - 100, 1100, height - 220, 1200, height - 100);
    }
    
    private createTitle(width: number, height: number): void {
        // Main title
        this.titleText = this.add.text(width / 2, height / 3, 'SHADOW NAIL', {
            fontSize: '72px',
            fontFamily: 'Georgia, serif',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(width / 2, height / 3 + 60, 'A Hollow Knight Tribute', {
            fontSize: '18px',
            fontFamily: 'Courier New, monospace',
            color: '#4a4a6a'
        }).setOrigin(0.5);
        
        // Add subtle glow animation
        this.tweens.add({
            targets: this.titleText,
            alpha: 0.8,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    private createPrompt(width: number, height: number): void {
        this.promptText = this.add.text(width / 2, height * 0.7, 'Press SPACE or CLICK to Start', {
            fontSize: '24px',
            fontFamily: 'Courier New, monospace',
            color: '#00FFFF'
        }).setOrigin(0.5);
        
        // Blinking effect
        this.tweens.add({
            targets: this.promptText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Controls info
        const controlsY = height - 80;
        const controlsStyle = {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#4a4a6a'
        };
        
        this.add.text(width / 2, controlsY, 'Controls:', controlsStyle).setOrigin(0.5);
        this.add.text(width / 2, controlsY + 20, 
            'A/D - Move  |  SPACE - Jump  |  SHIFT - Dash  |  J - Attack', 
            controlsStyle
        ).setOrigin(0.5);
    }
    
    private createParticles(width: number, height: number): void {
        // Floating dust particles for atmosphere
        this.add.particles(0, 0, 'dust', {
            x: { min: 0, max: width },
            y: { min: 0, max: height },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.3, end: 0 },
            speed: { min: 10, max: 30 },
            angle: { min: 260, max: 280 },
            lifespan: 6000,
            frequency: 500,
            blendMode: Phaser.BlendModes.ADD
        });
    }
    
    private setupInput(): void {
        // Keyboard
        this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
        this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
        
        // Mouse/Touch
        this.input.once('pointerdown', () => this.startGame());
    }
    
    private startGame(): void {
        // Fade out and transition
        this.cameras.main.fadeOut(500);
        
        this.time.delayedCall(500, () => {
            // Start the tutorial scene and UI overlay
            this.scene.start(SCENES.TUTORIAL);
            this.scene.launch(SCENES.UI);
        });
    }
}
