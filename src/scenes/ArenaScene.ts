/**
 * ArenaScene - Room 2
 * Combat practice with basic enemies
 * Uses the reusable EnemyManager and Portal systems
 */

import * as Phaser from 'phaser';
import { SCENES, COLORS, GAME_CONFIG } from '../config';
import { Player } from '@/entities/Player';
import { EnemyManager, EnemySpawnConfig } from '@/systems/EnemyManager';
import { Portal } from '@/systems/Portal';
import { PlatformRenderer, PlatformStyle } from '@/utils/PlatformRenderer';

export class ArenaScene extends Phaser.Scene {
    private player!: Player;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private enemyManager!: EnemyManager;
    private enemiesDefeated: number = 0;
    private totalEnemies: number = 5;
    private exitPortal!: Portal;
    private entryPortal!: Portal;
    
    constructor() {
        super({ key: SCENES.ARENA });
    }
    
    create(): void {
        // Reset counters
        this.enemiesDefeated = 0;
        
        // Set world bounds (wider arena)
        this.physics.world.setBounds(0, 0, 2000, GAME_CONFIG.HEIGHT);
        
        this.createBackground();
        this.createPlatforms();
        this.createPlayer();
        this.setupCamera();
        this.createPortals();
        
        // Create enemy manager and spawn enemies
        this.enemyManager = new EnemyManager(this, this.platforms, this.player);
        this.spawnEnemies();
        
        // Listen for enemy defeats
        this.events.on('enemy-defeated', () => {
            this.enemiesDefeated++;
            this.updateExitStatus();
        });
        
        // Fade in
        this.cameras.main.fadeIn(500);
        
        // Emit scene ready event for UI
        this.events.emit('scene-ready', { room: 'arena' });
    }
    
    update(time: number, delta: number): void {
        if (!this.player || !this.player.active) return;
        
        this.player.update(time, delta);
        
        // Check death pit
        this.player.checkDeathPit(GAME_CONFIG.HEIGHT - 10);
        
        // Update all enemies via manager
        if (this.enemyManager) {
            this.enemyManager.update(time, delta);
        }
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
        // Plant locations - on platforms and ground edges
        const plantSpots = [
            { x: 100, y: 575, type: 'bush' },
            { x: 320, y: 575, type: 'vine' },
            { x: 500, y: 575, type: 'grass' },
            { x: 700, y: 575, type: 'bush' },
            { x: 850, y: 575, type: 'vine' },
            { x: 1000, y: 575, type: 'grass' },
            { x: 1200, y: 575, type: 'bush' },
            { x: 1450, y: 575, type: 'vine' },
            { x: 1650, y: 575, type: 'grass' },
            { x: 1850, y: 575, type: 'bush' },
            // On elevated platforms
            { x: 360, y: 515, type: 'grass' },
            { x: 550, y: 475, type: 'grass' },
            { x: 870, y: 495, type: 'grass' },
            { x: 1320, y: 515, type: 'grass' },
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
        
        // Platform layout: floor sections with gaps and varied heights
        // Mix of concrete, steel, industrial, and some overgrown sections
        const platformData: Array<{
            x: number; y: number; w: number; h: number;
            style: PlatformStyle; overgrown?: boolean; damaged?: boolean; hasMoss?: boolean;
        }> = [
            // Ground floor with holes - section 1 (left) - old overgrown concrete
            { x: 0, y: 580, w: 350, h: 140, style: 'overgrown-concrete', hasMoss: true },
            
            // Ground floor - section 2 (crawler patrol zone) - concrete
            { x: 450, y: 580, w: 400, h: 140, style: 'concrete' },
            
            // Ground floor - section 3 (middle crawler zone) - concrete (cracked)
            { x: 950, y: 580, w: 350, h: 140, style: 'concrete', damaged: true },
            
            // Ground floor - section 4 (right) - concrete with some growth
            { x: 1400, y: 580, w: 600, h: 140, style: 'concrete', overgrown: true },
            
            // Varied height platforms - jump challenges (concrete ledges)
            { x: 320, y: 520, w: 160, h: 20, style: 'concrete' },      
            { x: 500, y: 480, w: 120, h: 20, style: 'concrete' },      
            { x: 700, y: 420, w: 150, h: 20, style: 'concrete' },      
            { x: 820, y: 500, w: 160, h: 20, style: 'concrete' },     
            { x: 1050, y: 450, w: 180, h: 20, style: 'concrete' },     
            { x: 1270, y: 520, w: 160, h: 20, style: 'overgrown-concrete' },     
            { x: 1500, y: 400, w: 140, h: 20, style: 'concrete' },     
            { x: 1650, y: 480, w: 150, h: 20, style: 'concrete' },    
            
            // Walls - concrete with moss
            { x: 0, y: 300, w: 20, h: 280, style: 'concrete', hasMoss: true },
            { x: 1980, y: 300, w: 20, h: 280, style: 'concrete', hasMoss: true }
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
                hasMoss: p.hasMoss,
                hasRust: p.style === 'rusted' || p.style === 'industrial',
                hasDrips: index < 4 // Ground sections have drips
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
        
        // Add decorative crates scattered around the arena
        this.createDecorativeCrates();
    }
    
    private createDecorativeCrates(): void {
        const renderer = new PlatformRenderer(this);
        
        // Crates scattered around for atmosphere
        const cratePositions = [
            { x: 50, y: 540, w: 40, h: 40 },
            { x: 120, y: 545, w: 35, h: 35 },
            { x: 470, y: 545, w: 35, h: 35 },
            { x: 520, y: 550, w: 30, h: 30 },
            { x: 1420, y: 545, w: 35, h: 35 },
            { x: 1500, y: 540, w: 40, h: 40 },
            { x: 1560, y: 550, w: 30, h: 30 },
            { x: 1850, y: 545, w: 35, h: 35 },
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
        this.physics.add.collider(this.player, this.platforms);
    }
    
    private spawnEnemies(): void {
        // Enemy spawn configuration
        // Floor sections are at y=580, spawn crawlers at y=535 (well above floor surface)
        // Crawlers patrol on their respective floor sections only
        const enemyConfig: EnemySpawnConfig[] = [
            // Crawlers on solid floor sections with limited patrol ranges
            { type: 'crawler', x: 550, y: 528, patrolRange: 100, patrolMinX: 470, patrolMaxX: 830 },   // Floor section 2 (450-850)
            { type: 'crawler', x: 750, y: 528, patrolRange: 80, patrolMinX: 470, patrolMaxX: 830 },    // Floor section 2 (450-850)
            { type: 'crawler', x: 1100, y: 528, patrolRange: 100, patrolMinX: 970, patrolMaxX: 1280 }, // Floor section 3 (950-1300)
            
            // Flyers above gaps - extra challenge
            { type: 'flyer', x: 400, y: 420, patrolRange: 80 },      // Over gap 1
            { type: 'flyer', x: 900, y: 400, patrolRange: 100 }      // Over gap 2
        ];
        
        this.enemyManager.spawnEnemies(enemyConfig);
        this.totalEnemies = enemyConfig.length;
    }
    
    private setupCamera(): void {
        this.cameras.main.startFollow(this.player, true, 0.1, 0.08);
        this.cameras.main.setBounds(0, 0, 2000, GAME_CONFIG.HEIGHT);
        this.cameras.main.setDeadzone(100, 50);
    }
    
    private createPortals(): void {
        // Entry portal (back to tutorial)
        this.entryPortal = new Portal(this, {
            x: 50,
            y: 510,
            width: 50,
            height: 100,
            color: COLORS.PLAYER_GLOW,
            label: '← Tutorial',
            locked: false,
            onEnter: () => this.transitionTo(SCENES.TUTORIAL)
        });
        this.entryPortal.setupOverlap(this.player);
        
        // Exit portal (to boss - locked until enemies defeated)
        this.exitPortal = new Portal(this, {
            x: 1950,
            y: 510,
            width: 50,
            height: 100,
            color: 0xFF6B6B,
            label: `Defeat ${this.totalEnemies} enemies`,
            locked: true,
            onEnter: () => this.transitionTo(SCENES.BOSS)
        });
        this.exitPortal.setupOverlap(this.player);
    }
    
    private updateExitStatus(): void {
        const remaining = this.totalEnemies - this.enemiesDefeated;
        if (remaining <= 0) {
            this.exitPortal.unlock();
            this.exitPortal.setLabel('→ Boss');
        } else {
            this.exitPortal.setLabel(`Defeat ${remaining} more`);
        }
    }
    
    private transitionTo(scene: string): void {
        this.physics.pause();
        this.cameras.main.fadeOut(500);
        
        this.time.delayedCall(500, () => {
            this.enemyManager.destroy();
            this.entryPortal.destroy();
            this.exitPortal.destroy();
            this.scene.start(scene);
        });
    }
}
