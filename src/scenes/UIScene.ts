/**
 * UIScene - HUD Overlay
 * Displays player health and other UI elements
 */

import * as Phaser from 'phaser';
import { SCENES, COLORS, PLAYER } from '../config';

export class UIScene extends Phaser.Scene {
    private hearts: Phaser.GameObjects.Image[] = [];
    private currentHealth: number = PLAYER.MAX_HEALTH;
    private roomText!: Phaser.GameObjects.Text;
    
    constructor() {
        super({ key: SCENES.UI });
    }
    
    create(): void {
        this.createHealthDisplay();
        this.createRoomIndicator();
        this.setupEventListeners();
    }
    
    private createHealthDisplay(): void {
        const startX = 30;
        const startY = 30;
        const spacing = 30;
        
        // Create heart icons
        for (let i = 0; i < PLAYER.MAX_HEALTH; i++) {
            const heart = this.add.image(startX + i * spacing, startY, 'heart');
            heart.setScale(1);
            this.hearts.push(heart);
        }
        
        // "SOUL" text (placeholder for future soul meter)
        this.add.text(startX, startY + 30, 'SOUL', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#4a4a6a'
        });
        
        // Soul meter bar (visual only for MVP)
        const soulBar = this.add.graphics();
        soulBar.fillStyle(COLORS.PLAYER_GLOW, 0.3);
        soulBar.fillRect(startX, startY + 45, 100, 8);
        soulBar.lineStyle(1, COLORS.PLAYER_GLOW, 0.5);
        soulBar.strokeRect(startX, startY + 45, 100, 8);
    }
    
    private createRoomIndicator(): void {
        const { width } = this.cameras.main;
        
        this.roomText = this.add.text(width - 20, 20, '', {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#4a4a6a',
            align: 'right'
        }).setOrigin(1, 0);
    }
    
    private setupEventListeners(): void {
        // Listen for health changes from game scenes
        const scenes = [SCENES.TUTORIAL, SCENES.ARENA, SCENES.BOSS];
        scenes.forEach(sceneKey => {
            const scene = this.scene.get(sceneKey);
            if (scene) {
                // Listen for player damage events
                scene.events.on('player-damaged', (health: number, _maxHealth: number) => {
                    this.updateHealth(health);
                });
                
                // Listen for scene ready events
                scene.events.on('scene-ready', (data: { room: string }) => {
                    this.updateRoomText(data.room);
                });
            }
        });
        
        // Listen for room changes
        this.game.events.on('room-changed', (room: string) => {
            this.updateRoomText(room);
        });
    }
    
    private updateHealth(health: number): void {
        this.currentHealth = Phaser.Math.Clamp(health, 0, PLAYER.MAX_HEALTH);
        
        this.hearts.forEach((heart, index) => {
            if (index < this.currentHealth) {
                heart.setTexture('heart');
                heart.setAlpha(1);
            } else {
                heart.setTexture('heart-empty');
                heart.setAlpha(0.5);
            }
        });
        
        // Flash effect on damage
        if (health < this.hearts.length) {
            const lostHeart = this.hearts[health];
            if (lostHeart) {
                this.tweens.add({
                    targets: lostHeart,
                    scale: 1.5,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => lostHeart.setScale(1)
                });
            }
        }
    }
    
    private updateRoomText(room: string): void {
        const roomNames: { [key: string]: string } = {
            'tutorial': 'The Threshold',
            'arena': 'Trial Grounds',
            'boss': 'Shade Chamber'
        };
        
        this.roomText.setText(roomNames[room] || room);
        
        // Fade in effect
        this.roomText.setAlpha(0);
        this.tweens.add({
            targets: this.roomText,
            alpha: 1,
            duration: 500
        });
    }
}
