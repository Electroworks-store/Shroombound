/**
 * BootScene - Asset Loading & Initialization
 * Loads all game assets and creates placeholder graphics
 */

import * as Phaser from 'phaser';
import { SCENES, COLORS, PLAYER, CRAWLER, FLYER, BOSS } from '../config';

export class BootScene extends Phaser.Scene {
    private loadingBar!: Phaser.GameObjects.Graphics;
    private progressBar!: Phaser.GameObjects.Graphics;
    
    constructor() {
        super({ key: SCENES.BOOT });
    }
    
    preload(): void {
        this.createLoadingScreen();
        this.createPlaceholderAssets();
        this.loadAssets();
    }
    
    create(): void {
        this.createAnimations();
        
        // Transition to menu
        this.time.delayedCall(500, () => {
            this.scene.start(SCENES.MENU);
        });
    }
    
    private createLoadingScreen(): void {
        const { width, height } = this.cameras.main;
        
        // Background bar
        this.loadingBar = this.add.graphics();
        this.loadingBar.fillStyle(0x2d2d44, 1);
        this.loadingBar.fillRect(width / 4, height / 2 - 10, width / 2, 20);
        
        // Progress bar
        this.progressBar = this.add.graphics();
        
        // Loading text
        this.add.text(width / 2, height / 2 - 40, 'LOADING', {
            fontSize: '24px',
            color: '#00FFFF',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        // Update progress bar
        this.load.on('progress', (value: number) => {
            this.progressBar.clear();
            this.progressBar.fillStyle(COLORS.PLAYER_GLOW, 1);
            this.progressBar.fillRect(
                width / 4 + 4,
                height / 2 - 6,
                (width / 2 - 8) * value,
                12
            );
        });
    }
    
    private createPlaceholderAssets(): void {
        // Create player spritesheet (silhouette style)
        this.createPlayerSprite();
        
        // Create enemy sprites
        this.createCrawlerSprite();
        this.createFlyerSprite();
        this.createBossSprite();
        
        // Create effect sprites
        this.createEffectSprites();
        
        // Create tileset
        this.createTileset();
    }
    
    private createPlayerSprite(): void {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        const frameWidth = PLAYER.WIDTH;
        const frameHeight = PLAYER.HEIGHT;
        
        // Create a single player sprite (simplified for now)
        // Body (black silhouette)
        graphics.fillStyle(COLORS.PLAYER_BODY, 1);
        graphics.fillRoundedRect(8, 16, 32, 44, 4);
        
        // Cloak bottom (flowing shape)
        graphics.fillTriangle(8, 56, 40, 56, 24, 64);
        
        // Eyes (cyan glow)
        graphics.fillStyle(COLORS.PLAYER_GLOW, 1);
        graphics.fillCircle(18, 28, 3);
        graphics.fillCircle(30, 28, 3);
        
        // Horns
        graphics.fillStyle(COLORS.PLAYER_BODY, 1);
        graphics.fillTriangle(12, 16, 8, 4, 16, 16);
        graphics.fillTriangle(36, 16, 40, 4, 32, 16);
        
        graphics.generateTexture('player', frameWidth, frameHeight);
        graphics.destroy();
    }
    
    private createCrawlerSprite(): void {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        const frameWidth = CRAWLER.WIDTH;
        const frameHeight = CRAWLER.HEIGHT;
        const frames = 4;
        
        for (let i = 0; i < frames; i++) {
            const x = i * frameWidth;
            
            // Body (dark gray)
            graphics.fillStyle(COLORS.ENEMY_BODY, 1);
            graphics.fillEllipse(x + 28, 24, 48, 32);
            
            // Legs
            graphics.fillRect(x + 8, 32, 8, 8);
            graphics.fillRect(x + 20, 34, 6, 6);
            graphics.fillRect(x + 30, 34, 6, 6);
            graphics.fillRect(x + 42, 32, 8, 8);
            
            // Eyes (red glow)
            graphics.fillStyle(COLORS.ENEMY_GLOW, 1);
            graphics.fillCircle(x + 36, 18, 4);
            graphics.fillCircle(x + 46, 20, 3);
        }
        
        graphics.generateTexture('crawler', frameWidth * frames, frameHeight);
        // Add frame data so numeric frames 0..frames-1 exist
        const tex = this.textures.get('crawler');
        for (let i = 0; i < frames; i++) {
            tex.add(i, 0, i * frameWidth, 0, frameWidth, frameHeight);
        }
        graphics.destroy();
    }
    
    private createFlyerSprite(): void {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        const frameWidth = FLYER.WIDTH;
        const frameHeight = FLYER.HEIGHT;
        const frames = 4;
        
        for (let i = 0; i < frames; i++) {
            const x = i * frameWidth;
            const wingOffset = (i % 2) * 4;
            
            // Wings
            graphics.fillStyle(COLORS.ENEMY_BODY, 0.7);
            graphics.fillTriangle(x + 4, 20 + wingOffset, x + 20, 24, x + 4, 28 - wingOffset);
            graphics.fillTriangle(x + 44, 20 + wingOffset, x + 28, 24, x + 44, 28 - wingOffset);
            
            // Body
            graphics.fillStyle(COLORS.ENEMY_BODY, 1);
            graphics.fillCircle(x + 24, 28, 16);
            
            // Eye (single red glow)
            graphics.fillStyle(COLORS.ENEMY_GLOW, 1);
            graphics.fillCircle(x + 24, 26, 5);
        }
        
        graphics.generateTexture('flyer', frameWidth * frames, frameHeight);
        const tex = this.textures.get('flyer');
        for (let i = 0; i < frames; i++) {
            tex.add(i, 0, i * frameWidth, 0, frameWidth, frameHeight);
        }
        graphics.destroy();
    }
    
    private createBossSprite(): void {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        const frameWidth = BOSS.WIDTH;
        const frameHeight = BOSS.HEIGHT;
        const frames = 6;
        
        // Offset everything down by 16 so horns don't draw at negative Y
        const yOffset = 16;
        
        for (let i = 0; i < frames; i++) {
            const x = i * frameWidth;
            
            // Large cloak body
            graphics.fillStyle(COLORS.ENEMY_BODY, 1);
            graphics.fillRoundedRect(x + 12, yOffset + 24, 48, 68, 6);
            
            // Cloak bottom
            graphics.fillTriangle(x + 12, yOffset + 88, x + 60, yOffset + 88, x + 36, yOffset + 96);
            
            // Head
            graphics.fillCircle(x + 36, yOffset + 20, 16);
            
            // Crown/horns (larger than player)
            graphics.fillTriangle(x + 20, yOffset + 8, x + 12, yOffset - 8, x + 28, yOffset + 8);
            graphics.fillTriangle(x + 52, yOffset + 8, x + 60, yOffset - 8, x + 44, yOffset + 8);
            graphics.fillTriangle(x + 36, yOffset + 4, x + 36, yOffset - 8, x + 40, yOffset + 4);
            
            // Eyes (menacing red)
            graphics.fillStyle(COLORS.ENEMY_GLOW, 1);
            graphics.fillCircle(x + 28, yOffset + 18, 4);
            graphics.fillCircle(x + 44, yOffset + 18, 4);
            
            // Inner eye glow
            graphics.fillStyle(0xFFFFFF, 0.5);
            graphics.fillCircle(x + 29, yOffset + 17, 2);
            graphics.fillCircle(x + 45, yOffset + 17, 2);
        }
        
        graphics.generateTexture('boss', frameWidth * frames, frameHeight);
        const tex = this.textures.get('boss');
        for (let i = 0; i < frames; i++) {
            tex.add(i, 0, i * frameWidth, 0, frameWidth, frameHeight);
        }
        graphics.destroy();
    }
    
    private createEffectSprites(): void {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        
        // Slash effect (arc shape)
        graphics.lineStyle(4, COLORS.SLASH_COLOR, 1);
        graphics.beginPath();
        graphics.arc(40, 40, 30, Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45));
        graphics.strokePath();
        graphics.generateTexture('slash', 80, 80);
        graphics.clear();
        
        // Dust particle
        graphics.fillStyle(0xFFFFFF, 0.6);
        graphics.fillCircle(8, 8, 6);
        graphics.generateTexture('dust', 16, 16);
        graphics.clear();
        
        // Dash trail
        graphics.fillStyle(COLORS.DASH_TRAIL, 0.5);
        graphics.fillRoundedRect(0, 0, 32, 48, 4);
        graphics.generateTexture('dash-trail', 32, 48);
        graphics.clear();
        
        // Impact effect
        graphics.lineStyle(2, 0xFFFFFF, 1);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            graphics.lineBetween(
                16, 16,
                16 + Math.cos(angle) * 12,
                16 + Math.sin(angle) * 12
            );
        }
        graphics.generateTexture('impact', 32, 32);
        graphics.clear();
        
        // Health heart
        graphics.fillStyle(0xFF6B6B, 1);
        graphics.fillCircle(8, 6, 6);
        graphics.fillCircle(16, 6, 6);
        graphics.fillTriangle(2, 8, 22, 8, 12, 20);
        graphics.generateTexture('heart', 24, 24);
        graphics.clear();
        
        // Empty heart
        graphics.lineStyle(2, 0x4a4a6a, 1);
        graphics.strokeCircle(8, 6, 6);
        graphics.strokeCircle(16, 6, 6);
        graphics.lineBetween(2, 8, 12, 20);
        graphics.lineBetween(22, 8, 12, 20);
        graphics.generateTexture('heart-empty', 24, 24);
        
        graphics.destroy();
    }
    
    private createTileset(): void {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        const tileSize = 32;
        
        // Tile 0: Empty
        
        // Tile 1: Solid platform
        graphics.fillStyle(COLORS.PLATFORM_MAIN, 1);
        graphics.fillRect(0, 0, tileSize, tileSize);
        graphics.lineStyle(2, COLORS.PLATFORM_EDGE, 1);
        graphics.strokeRect(0, 0, tileSize, tileSize);
        
        // Tile 2: Platform top
        graphics.fillStyle(COLORS.PLATFORM_MAIN, 1);
        graphics.fillRect(tileSize, 0, tileSize, tileSize);
        graphics.lineStyle(3, COLORS.PLATFORM_EDGE, 1);
        graphics.lineBetween(tileSize, 0, tileSize * 2, 0);
        
        // Tile 3: Spike
        graphics.fillStyle(COLORS.ENEMY_GLOW, 1);
        graphics.fillTriangle(
            tileSize * 2 + 16, 0,
            tileSize * 2, tileSize,
            tileSize * 3, tileSize
        );
        
        graphics.generateTexture('tileset', tileSize * 4, tileSize);
        graphics.destroy();
    }
    
    private loadAssets(): void {
        // Note: In production, you would load actual asset files here
        // For the MVP, we're using generated placeholder graphics
        
        // Example of how to load real assets:
        // this.load.image('player', 'assets/sprites/player.png');
        // this.load.audio('slash', 'assets/audio/slash.wav');
        // this.load.tilemapTiledJSON('tutorial', 'assets/tilemaps/tutorial.json');
        this.load.image('level-bg', 'img/Hollow-knight-bg.png');
    }
    
    private createAnimations(): void {
        // Player animations
        this.anims.create({
            key: 'player-idle',
            frames: [{ key: 'player' }],
            frameRate: 1,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player-run',
            frames: [{ key: 'player' }],
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player-jump',
            frames: [{ key: 'player' }],
            frameRate: 1
        });
        
        this.anims.create({
            key: 'player-fall',
            frames: [{ key: 'player' }],
            frameRate: 1
        });
        
        this.anims.create({
            key: 'player-dash',
            frames: [{ key: 'player' }],
            frameRate: 1
        });
        
        // Crawler animations
        this.anims.create({
            key: 'crawler-walk',
            frames: this.anims.generateFrameNumbers('crawler', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        
        // Flyer animations
        this.anims.create({
            key: 'flyer-hover',
            frames: this.anims.generateFrameNumbers('flyer', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: -1
        });
        
        // Boss animations
        this.anims.create({
            key: 'boss-idle',
            frames: this.anims.generateFrameNumbers('boss', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });
    }
}
