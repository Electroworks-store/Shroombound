/**
 * TutorialScene - Room 1
 * Teaches basic mechanics: Move, Jump, Dash, Attack
 */

import * as Phaser from 'phaser';
import { SCENES, COLORS, GAME_CONFIG } from '../config';
import { Player } from '@/entities/Player';
import { Portal } from '@/systems/Portal';
import { PlatformRenderer, PlatformStyle } from '@/utils/PlatformRenderer';

export class TutorialScene extends Phaser.Scene {
    private player!: Player;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private tutorialTexts: Phaser.GameObjects.Text[] = [];
    private exitPortal!: Portal;
    
    constructor() {
        super({ key: SCENES.TUTORIAL });
    }
    
    create(): void {
        // Set world bounds
        this.physics.world.setBounds(0, 0, 1600, GAME_CONFIG.HEIGHT);
        
        this.createBackground();
        this.createPlatforms();
        this.createPlayer();
        this.createTutorialElements();
        this.setupCamera();
        this.createTransitionZones();
        
        // Fade in
        this.cameras.main.fadeIn(500);
        
        // Emit scene ready event for UI
        this.events.emit('scene-ready', { room: 'tutorial' });
    }
    
    update(time: number, delta: number): void {
        this.player.update(time, delta);
        this.checkTutorialProgress();
        
        // Check if player fell into death pit
        this.player.checkDeathPit(GAME_CONFIG.HEIGHT - 10);
    }
    
    private createBackground(): void {
        const { width, height } = this.cameras.main;
        
        // Background image
        this.add.image(0, 0, 'level-bg')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDisplaySize(width, height);
        
        // Subtle dark overlay for readability
        this.add.rectangle(0, 0, width, height, 0x000000, 0.2)
            .setOrigin(0, 0)
            .setScrollFactor(0);
        
        // Add plants and vines
        this.createPlants();
    }
    
    private createPlants(): void {
        // Plant locations on platforms
        const plantSpots = [
            { x: 50, y: 615, type: 'bush' },
            { x: 180, y: 615, type: 'grass' },
            { x: 300, y: 615, type: 'vine' },
            { x: 450, y: 615, type: 'grass' },
            { x: 550, y: 535, type: 'grass' },
            { x: 700, y: 475, type: 'grass' },
            { x: 800, y: 615, type: 'bush' },
            { x: 1050, y: 615, type: 'vine' },
            { x: 1300, y: 615, type: 'grass' },
            { x: 1500, y: 615, type: 'bush' },
        ];
        
        plantSpots.forEach((spot, index) => {
            const plant = this.add.graphics();
            
            if (spot.type === 'bush') {
                // Small bush
                plant.fillStyle(0x2d5a3d, 1);
                plant.fillCircle(spot.x, spot.y - 12, 18);
                plant.fillCircle(spot.x - 12, spot.y - 6, 12);
                plant.fillCircle(spot.x + 12, spot.y - 6, 12);
                plant.fillStyle(0x3d7a5d, 0.7);
                plant.fillCircle(spot.x + 4, spot.y - 16, 8);
            } else if (spot.type === 'vine') {
                // Hanging vine
                plant.lineStyle(3, 0x2d5a3d, 1);
                plant.beginPath();
                plant.moveTo(spot.x, spot.y);
                plant.lineTo(spot.x + 5, spot.y - 30);
                plant.lineTo(spot.x - 3, spot.y - 50);
                plant.lineTo(spot.x + 8, spot.y - 70);
                plant.strokePath();
                // Leaves
                plant.fillStyle(0x3d7a5d, 1);
                plant.fillEllipse(spot.x + 5, spot.y - 30, 8, 5);
                plant.fillEllipse(spot.x - 3, spot.y - 50, 8, 5);
                plant.fillEllipse(spot.x + 8, spot.y - 70, 8, 5);
            } else {
                // Grass tufts
                plant.lineStyle(2, 0x3d7a5d, 1);
                for (let i = -2; i <= 2; i++) {
                    plant.beginPath();
                    plant.moveTo(spot.x + i * 4, spot.y);
                    plant.lineTo(spot.x + i * 6, spot.y - 20 - Math.abs(i) * 3);
                    plant.strokePath();
                }
            }
            
            // Animate swaying
            this.tweens.add({
                targets: plant,
                x: spot.type === 'vine' ? 8 : 3,
                duration: 1500 + index * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }
    
    private createPlatforms(): void {
        this.platforms = this.physics.add.staticGroup();
        
        const renderer = new PlatformRenderer(this);
        
        // Floor sections with gaps - varied materials for visual interest
        const platformData: Array<{
            x: number; y: number; w: number; h: number; 
            style: PlatformStyle; overgrown?: boolean; damaged?: boolean;
        }> = [
            // Starting area floor - old concrete, heavily overgrown (abandoned feel)
            { x: 0, y: 620, w: 350, h: 100, style: 'overgrown-concrete', overgrown: true },
            
            // First small gap to teach jumping - concrete with some moss
            { x: 420, y: 620, w: 200, h: 100, style: 'concrete', overgrown: true },
            
            // Elevated platforms - concrete ledges
            { x: 500, y: 540, w: 120, h: 20, style: 'concrete' },
            { x: 660, y: 480, w: 120, h: 20, style: 'concrete' },
            
            // Dash gap section - concrete only
            { x: 680, y: 620, w: 200, h: 100, style: 'concrete' },
            { x: 1000, y: 620, w: 200, h: 100, style: 'concrete' },
            
            // Combat area floor - cracked concrete
            { x: 1250, y: 620, w: 400, h: 100, style: 'concrete', damaged: true },
            
            // Wall for exit - concrete wall
            { x: 1580, y: 400, w: 20, h: 320, style: 'concrete' }
        ];
        
        platformData.forEach((p, index) => {
            // Create styled visual
            renderer.renderPlatform({
                x: p.x,
                y: p.y,
                width: p.w,
                height: p.h,
                style: p.style,
                overgrowth: p.overgrown ? 'heavy' : 'none',
                damage: p.damaged ? 'cracked' : 'none',
                hasMoss: index < 3, // First few platforms have moss
                hasDrips: p.style === 'concrete' || p.style === 'industrial'
            });
            
            // Physics
            const platform = this.add.rectangle(
                p.x + p.w / 2, 
                p.y + p.h / 2, 
                p.w, 
                p.h
            );
            this.physics.add.existing(platform, true);
            this.platforms.add(platform);
            platform.setVisible(false);
        });
        
        // Add some decorative crates in the starting area
        this.createDecorativeCrates();
    }
    
    private createDecorativeCrates(): void {
        const renderer = new PlatformRenderer(this);
        
        // Scattered crates for atmosphere (non-collidable decoration)
        const cratePositions = [
            { x: 30, y: 580, w: 40, h: 40 },
            { x: 85, y: 590, w: 30, h: 30 },
            { x: 280, y: 585, w: 35, h: 35 },
        ];
        
        cratePositions.forEach(crate => {
            renderer.renderPlatform({
                x: crate.x,
                y: crate.y,
                width: crate.w,
                height: crate.h,
                style: 'crate',
                depth: 4
            });
        });
    }
    
    private createPlayer(): void {
        this.player = new Player(this, 100, 500);
        
        // Set up collision with platforms
        this.physics.add.collider(this.player, this.platforms);
    }
    
    private createTutorialElements(): void {
        const style = {
            fontSize: '16px',
            fontFamily: 'Courier New, monospace',
            color: '#00FFFF',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 10, y: 5 }
        };
        
        // Movement tutorial
        const moveText = this.add.text(100, 520, 'A/D or ←/→ to MOVE', style);
        this.tutorialTexts.push(moveText);
        
        // Jump tutorial
        const jumpText = this.add.text(340, 520, 'SPACE to JUMP', style);
        this.tutorialTexts.push(jumpText);
        
        // Dash tutorial
        const dashText = this.add.text(750, 520, 'SHIFT to DASH\n(Gap too wide to jump!)', {
            ...style,
            align: 'center'
        });
        this.tutorialTexts.push(dashText);
        
        // Attack tutorial
        const attackText = this.add.text(1250, 520, 'J to ATTACK', style);
        this.tutorialTexts.push(attackText);
        
        // Create destructible target for attack practice
        this.createDestructibleTarget(1350, 560);
        
        // Exit sign
        this.add.text(1550, 350, '→', {
            fontSize: '32px',
            color: '#00FFFF'
        });
    }
    
    private createDestructibleTarget(x: number, y: number): void {
        // Create a styled training dummy that looks like a creature
        const container = this.add.container(x, y);
        
        // Body - rounded shape
        const body = this.add.graphics();
        body.fillStyle(COLORS.ENEMY_BODY, 1);
        body.fillEllipse(0, 0, 36, 50);
        
        // Inner body highlight
        body.fillStyle(0x3a3a5a, 0.6);
        body.fillEllipse(0, -5, 26, 35);
        
        // Eyes
        body.fillStyle(COLORS.ENEMY_GLOW, 1);
        body.fillCircle(-8, -8, 5);
        body.fillCircle(8, -8, 5);
        
        // Eye pupils
        body.fillStyle(0x000000, 1);
        body.fillCircle(-6, -8, 2);
        body.fillCircle(10, -8, 2);
        
        // Small horn/antenna
        body.fillStyle(COLORS.ENEMY_BODY, 1);
        body.fillTriangle(-5, -25, 0, -35, 5, -25);
        
        // Glow effect
        const glow = this.add.graphics();
        glow.lineStyle(2, COLORS.ENEMY_GLOW, 0.6);
        glow.strokeEllipse(0, 0, 40, 54);
        
        container.add([body, glow]);
        
        // Physics hitbox
        const hitbox = this.add.rectangle(x, y, 36, 50);
        hitbox.setVisible(false);
        this.physics.add.existing(hitbox, true);
        
        // Store reference for hit detection
        let health = 3;
        
        // Listen for player attacks
        this.events.on('player-attack', (attackHitbox: Phaser.Geom.Rectangle) => {
            const targetBounds = hitbox.getBounds();
            if (Phaser.Geom.Rectangle.Overlaps(attackHitbox, targetBounds)) {
                health--;
                
                // Flash effect
                this.tweens.add({
                    targets: container,
                    alpha: 0.5,
                    scaleX: 1.1,
                    scaleY: 0.9,
                    duration: 50,
                    yoyo: true
                });
                
                // Shake
                this.tweens.add({
                    targets: container,
                    x: x + Phaser.Math.Between(-5, 5),
                    duration: 30,
                    yoyo: true,
                    repeat: 2,
                    onComplete: () => container.setX(x)
                });
                
                if (health <= 0) {
                    // Destroy with particle effect
                    this.createDestroyEffect(x, y);
                    container.destroy();
                    hitbox.destroy();
                }
            }
        });
    }
    
    private createDestroyEffect(x: number, y: number): void {
        const particles = this.add.particles(x, y, 'dust', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 500,
            quantity: 10,
            tint: COLORS.ENEMY_GLOW
        });
        
        this.time.delayedCall(500, () => particles.destroy());
    }
    
    private setupCamera(): void {
        // Set camera to follow player
        this.cameras.main.startFollow(this.player, true, 0.1, 0.08);
        this.cameras.main.setBounds(0, 0, 1600, GAME_CONFIG.HEIGHT);
        this.cameras.main.setDeadzone(100, 50);
    }
    
    private createTransitionZones(): void {
        // Exit portal to Arena with nice styling
        this.exitPortal = new Portal(this, {
            x: 1550,
            y: 550,
            width: 50,
            height: 100,
            color: COLORS.PLAYER_GLOW,
            label: 'Arena →',
            locked: false,
            onEnter: () => this.transitionToArena()
        });
        this.exitPortal.setupOverlap(this.player);
    }
    
    private transitionToArena(): void {
        // Only transition once
        this.physics.pause();
        
        this.cameras.main.fadeOut(500);
        
        this.time.delayedCall(500, () => {
            this.exitPortal.destroy();
            this.scene.start(SCENES.ARENA);
        });
    }
    
    private checkTutorialProgress(): void {
        // Fade out tutorial texts as player progresses past them
        this.tutorialTexts.forEach(text => {
            if (this.player.x > text.x + 200) {
                this.tweens.add({
                    targets: text,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => text.setVisible(false)
                });
            }
        });
    }
}
