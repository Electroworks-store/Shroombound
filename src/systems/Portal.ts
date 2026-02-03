/**
 * Portal - Stylized transition zone between levels
 * Animated glowing portal with particle effects
 */

import * as Phaser from 'phaser';
import { COLORS } from '../config';

export interface PortalConfig {
    x: number;
    y: number;
    width?: number;
    height?: number;
    color?: number;
    label?: string;
    locked?: boolean;
    onEnter: () => void;
}

export class Portal {
    private scene: Phaser.Scene;
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private color: number;
    private locked: boolean;
    
    private graphics!: Phaser.GameObjects.Graphics;
    private zone!: Phaser.GameObjects.Rectangle;
    private label!: Phaser.GameObjects.Text;
    private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
    private glowOffset: number = 0;
    
    constructor(scene: Phaser.Scene, config: PortalConfig) {
        this.scene = scene;
        this.x = config.x;
        this.y = config.y;
        this.width = config.width || 60;
        this.height = config.height || 120;
        this.color = config.color || COLORS.PLAYER_GLOW;
        this.locked = config.locked || false;
        
        this.createVisuals();
        this.createZone(config.onEnter);
        
        if (config.label) {
            this.createLabel(config.label);
        }
        
        // Start animation
        this.animate();
    }
    
    private createVisuals(): void {
        this.graphics = this.scene.add.graphics();
        this.drawPortal();
        
        // Create particle effect
        this.particles = this.scene.add.particles(this.x, this.y, 'dust', {
            speed: { min: 20, max: 50 },
            angle: { min: 260, max: 280 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 1000,
            frequency: 100,
            quantity: 1,
            tint: this.locked ? 0xFF6B6B : this.color,
            emitZone: {
                type: 'edge',
                source: new Phaser.Geom.Rectangle(-this.width/2, -this.height/2, this.width, this.height),
                quantity: 20
            }
        });
    }
    
    private drawPortal(): void {
        this.graphics.clear();
        
        const pulseScale = 1 + Math.sin(this.glowOffset) * 0.05;
        const portalColor = this.locked ? 0xFF6B6B : this.color;
        
        // Outer glow
        this.graphics.fillStyle(portalColor, 0.1);
        this.graphics.fillRoundedRect(
            this.x - (this.width * pulseScale) / 2 - 10,
            this.y - (this.height * pulseScale) / 2 - 10,
            this.width * pulseScale + 20,
            this.height * pulseScale + 20,
            12
        );
        
        // Middle glow
        this.graphics.fillStyle(portalColor, 0.2);
        this.graphics.fillRoundedRect(
            this.x - (this.width * pulseScale) / 2 - 5,
            this.y - (this.height * pulseScale) / 2 - 5,
            this.width * pulseScale + 10,
            this.height * pulseScale + 10,
            10
        );
        
        // Inner portal
        this.graphics.fillStyle(portalColor, 0.15);
        this.graphics.fillRoundedRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height,
            8
        );
        
        // Border
        this.graphics.lineStyle(2, portalColor, 0.8);
        this.graphics.strokeRoundedRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height,
            8
        );
        
        // Inner energy lines
        const lineAlpha = 0.3 + Math.sin(this.glowOffset * 2) * 0.2;
        this.graphics.lineStyle(1, portalColor, lineAlpha);
        for (let i = 0; i < 3; i++) {
            const yOffset = (this.glowOffset * 30 + i * 40) % this.height - this.height / 2;
            this.graphics.lineBetween(
                this.x - this.width / 2 + 8,
                this.y + yOffset,
                this.x + this.width / 2 - 8,
                this.y + yOffset
            );
        }
        
        // Arrow indicator
        if (!this.locked) {
            const arrowY = this.y - this.height / 2 - 20 + Math.sin(this.glowOffset * 2) * 5;
            this.graphics.fillStyle(portalColor, 0.8);
            this.graphics.fillTriangle(
                this.x, arrowY - 10,
                this.x - 10, arrowY + 5,
                this.x + 10, arrowY + 5
            );
        }
    }
    
    private createZone(onEnter: () => void): void {
        this.zone = this.scene.add.rectangle(this.x, this.y, this.width, this.height);
        this.zone.setVisible(false);
        this.scene.physics.add.existing(this.zone, true);
        
        // Store callback for overlap check
        (this.zone as Phaser.GameObjects.Rectangle & { portalCallback: () => void }).portalCallback = onEnter;
    }
    
    private createLabel(text: string): void {
        this.label = this.scene.add.text(this.x, this.y + this.height / 2 + 15, text, {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: this.locked ? '#FF6B6B' : '#00FFFF',
            align: 'center'
        }).setOrigin(0.5);
    }
    
    private animate(): void {
        this.scene.time.addEvent({
            delay: 16,
            callback: () => {
                this.glowOffset += 0.05;
                this.drawPortal();
            },
            loop: true
        });
    }
    
    /**
     * Set up overlap detection with player
     */
    setupOverlap(player: Phaser.Physics.Arcade.Sprite): void {
        const callback = (this.zone as Phaser.GameObjects.Rectangle & { portalCallback: () => void }).portalCallback;
        this.scene.physics.add.overlap(player, this.zone, () => {
            if (!this.locked) {
                callback();
            }
        });
    }
    
    /**
     * Unlock the portal
     */
    unlock(): void {
        this.locked = false;
        this.color = COLORS.PLAYER_GLOW;
        if (this.label) {
            this.label.setColor('#00FFFF');
        }
        // Update particles
        this.particles.setParticleTint(this.color);
    }
    
    /**
     * Update the label text
     */
    setLabel(text: string): void {
        if (this.label) {
            this.label.setText(text);
        }
    }
    
    /**
     * Check if portal is locked
     */
    isLocked(): boolean {
        return this.locked;
    }
    
    destroy(): void {
        this.graphics.destroy();
        this.zone.destroy();
        if (this.label) this.label.destroy();
        if (this.particles) this.particles.destroy();
    }
}
