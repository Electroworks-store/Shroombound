/**
 * BossScene - The Hollow Throne
 * Final challenge: The Forgotten King - a corrupted ruler consumed by void
 * 
 * Story: The King was once a benevolent ruler who sought immortality.
 * His experiments with the void corrupted him, turning him into a hollow shell.
 * Now he guards his throne room, attacking any who dare enter.
 */

import * as Phaser from 'phaser';
import { SCENES, GAME_CONFIG } from '../config';
import { Player } from '@/entities/Player';
import { PlatformRenderer, PlatformStyle } from '@/utils/PlatformRenderer';

// Boss states for the fight
enum BossState {
    DORMANT,        // Before fight starts
    AWAKENING,      // Dramatic intro
    IDLE,           // Brief pause between actions
    WALKING,        // Stalking the player
    SLASH,          // Melee attack
    CHARGE,         // Fast dash attack
    SUMMON,         // Phase 2+: spawn projectiles
    SLAM,           // Phase 3: ground pound
    STUNNED,        // After taking enough hits
    DYING,          // Death animation
    DEAD            // Fight over
}

export class BossScene extends Phaser.Scene {
    // Core objects
    private player!: Player;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    
    // Boss properties
    private bossContainer!: Phaser.GameObjects.Container;
    private bossBody!: Phaser.GameObjects.Graphics;
    private bossGlow!: Phaser.GameObjects.Graphics;
    private bossX: number = 1100;
    private bossY: number = 520;
    private bossHealth: number = 20;
    private bossMaxHealth: number = 20;
    private bossState: BossState = BossState.DORMANT;
    private bossPhase: number = 1;
    private bossFacing: number = -1; // -1 = left, 1 = right
    private bossVelocityX: number = 0;
    private bossVelocityY: number = 0;
    private bossHitbox!: Phaser.Geom.Rectangle;
    
    // Timers
    private stateTimer: number = 0;
    private attackCooldown: number = 0;
    private invincibleTimer: number = 0;
    private animTimer: number = 0;
    
    // UI elements
    private bossHealthBar!: Phaser.GameObjects.Graphics;
    private bossNameText!: Phaser.GameObjects.Text;
    private phaseText!: Phaser.GameObjects.Text;
    
    // Visual effects
    private screenShakeIntensity: number = 0;
    private voidOrbs: Phaser.GameObjects.Graphics[] = [];
    
    constructor() {
        super({ key: SCENES.BOSS });
    }
    
    create(): void {
        console.log('BossScene: Creating...');
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, 1400, GAME_CONFIG.HEIGHT);
        
        // Create the arena
        this.createThrone();
        this.createPlatforms();
        this.createAtmosphere();
        
        // Create player
        this.player = new Player(this, 150, 520);
        this.physics.add.collider(this.player, this.platforms);
        
        // Create boss (initially dormant)
        this.createBoss();
        
        // Create UI (hidden until fight starts)
        this.createBossUI();
        
        // Setup camera
        this.cameras.main.setBounds(0, 0, 1400, GAME_CONFIG.HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        
        // Setup combat
        this.setupCombat();
        
        // Create entrance trigger
        this.createBattleTrigger();
        
        // Fade in
        this.cameras.main.fadeIn(1000, 10, 5, 5);
        
        // Show lore text
        this.showEntranceText();
        
        // Emit ready event
        this.events.emit('scene-ready', { room: 'boss' });
        
        console.log('BossScene: Created successfully!');
    }
    
    update(time: number, delta: number): void {
        // Update player
        this.player.update(time, delta);
        this.player.checkDeathPit(GAME_CONFIG.HEIGHT + 50);
        
        // Update boss
        this.updateBoss(delta);
        
        // Update timers
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.invincibleTimer > 0) this.invincibleTimer -= delta;
        this.animTimer += delta;
        
        // Screen shake
        if (this.screenShakeIntensity > 0) {
            this.cameras.main.setScroll(
                this.cameras.main.scrollX + Phaser.Math.Between(-this.screenShakeIntensity, this.screenShakeIntensity),
                this.cameras.main.scrollY + Phaser.Math.Between(-this.screenShakeIntensity, this.screenShakeIntensity)
            );
            this.screenShakeIntensity *= 0.9;
            if (this.screenShakeIntensity < 0.5) this.screenShakeIntensity = 0;
        }
        
        // Update void orbs
        this.updateVoidOrbs(delta);
    }
    
    // ==================== ARENA CREATION ====================
    
    private createThrone(): void {
        const g = this.add.graphics();
        
        // Dark gradient background with red tint
        for (let y = 0; y < GAME_CONFIG.HEIGHT; y++) {
            const ratio = y / GAME_CONFIG.HEIGHT;
            const r = Math.floor(15 + ratio * 5);
            const gb = Math.floor(5 + ratio * 3);
            g.lineStyle(1, Phaser.Display.Color.GetColor(r, gb, gb + 5));
            g.lineBetween(0, y, 1400, y);
        }
        
        // Grand throne structure in background
        g.fillStyle(0x1a1a2e, 0.8);
        
        // Central throne pillar
        g.fillRect(620, 100, 160, 520);
        
        // Throne seat
        g.fillRect(580, 350, 240, 80);
        
        // Throne back (tall ornate structure)
        g.fillStyle(0x2a1a3e, 0.9);
        g.fillRect(650, 50, 100, 300);
        
        // Crown-like spires
        g.fillTriangle(650, 50, 700, -50, 750, 50);
        g.fillTriangle(600, 100, 650, 20, 700, 100);
        g.fillTriangle(700, 100, 750, 20, 800, 100);
        
        // Side pillars
        g.fillStyle(0x1a1a2e, 0.6);
        g.fillRect(100, 200, 60, 420);
        g.fillRect(1240, 200, 60, 420);
        
        // Pillar tops
        g.fillRect(90, 180, 80, 30);
        g.fillRect(1230, 180, 80, 30);
        
        // Chains hanging from ceiling
        g.lineStyle(3, 0x3a3a4a, 0.5);
        for (let x = 200; x < 1200; x += 150) {
            const sway = Math.sin(x * 0.01) * 20;
            g.beginPath();
            g.moveTo(x, 0);
            g.lineTo(x + sway * 0.5, 80);
            g.lineTo(x + sway, 150);
            g.strokePath();
        }
        
        // Cracked floor pattern
        g.lineStyle(1, 0x2a2a3a, 0.3);
        for (let i = 0; i < 20; i++) {
            const x1 = Phaser.Math.Between(0, 1400);
            const y1 = Phaser.Math.Between(550, 620);
            g.lineBetween(x1, y1, x1 + Phaser.Math.Between(-50, 50), y1 + Phaser.Math.Between(10, 40));
        }
        
        // Glowing runes on floor
        g.lineStyle(2, 0x8B0000, 0.4);
        g.strokeCircle(700, 580, 200);
        g.strokeCircle(700, 580, 150);
        
        // Rune symbols
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const rx = 700 + Math.cos(angle) * 175;
            const ry = 580 + Math.sin(angle) * 30; // Perspective squash
            g.fillStyle(0x8B0000, 0.5);
            g.fillCircle(rx, ry, 8);
        }
    }
    
    private createPlatforms(): void {
        this.platforms = this.physics.add.staticGroup();
        const renderer = new PlatformRenderer(this);
        
        // The throne room - ancient stone and corrupted architecture
        const platformData: Array<{
            x: number; y: number; w: number; h: number;
            style: PlatformStyle; corrupted?: boolean; hasMoss?: boolean;
        }> = [
            // Main floor - ancient concrete, heavily weathered
            { x: 0, y: 620, w: 1400, h: 100, style: 'concrete', hasMoss: true },
            // Side platforms for dodging - concrete ledges
            { x: 80, y: 500, w: 180, h: 20, style: 'concrete' },
            { x: 1140, y: 500, w: 180, h: 20, style: 'concrete' },
            // Central elevated platform - throne platform, ancient stone
            { x: 550, y: 450, w: 300, h: 20, style: 'concrete', corrupted: true },
            // Walls - massive concrete pillars
            { x: 0, y: 0, w: 30, h: 720, style: 'concrete', hasMoss: true },
            { x: 1370, y: 0, w: 30, h: 720, style: 'concrete', hasMoss: true }
        ];
        
        platformData.forEach((p) => {
            // Styled platform visual
            renderer.renderPlatform({
                x: p.x,
                y: p.y,
                width: p.w,
                height: p.h,
                style: p.style,
                hasMoss: p.hasMoss,
                hasRust: p.style === 'rusted',
                damage: p.corrupted ? 'cracked' : 'none',
                hasDrips: p.hasMoss,
                depth: 5
            });
            
            const plat = this.add.rectangle(p.x + p.w/2, p.y + p.h/2, p.w, p.h);
            plat.setVisible(false);
            this.physics.add.existing(plat, true);
            this.platforms.add(plat);
        });
        
        // Add throne room decorations
        this.createThroneDecorations();
    }
    
    private createThroneDecorations(): void {
        const g = this.add.graphics();
        g.setDepth(3);
        
        // Broken pillars on sides
        this.drawBrokenPillar(g, 100, 620, 60);
        this.drawBrokenPillar(g, 1240, 620, 80);
        
        // Throne platform support columns
        this.drawSupportColumn(g, 560, 450, 620);
        this.drawSupportColumn(g, 840, 450, 620);
        
        // Scattered rubble
        this.drawRubble(g, 200, 615);
        this.drawRubble(g, 1100, 615);
        this.drawRubble(g, 650, 615);
        
        // Corrupted void cracks in floor
        this.drawVoidCracks(g);
    }
    
    private drawBrokenPillar(g: Phaser.GameObjects.Graphics, x: number, baseY: number, height: number): void {
        const width = 40;
        
        // Base of pillar
        g.fillStyle(0x4a4a5a, 1);
        g.fillRect(x - width/2, baseY - height, width, height);
        
        // Pillar details - grooves
        g.lineStyle(2, 0x3a3a4a, 0.6);
        g.lineBetween(x - width/4, baseY - height + 10, x - width/4, baseY - 5);
        g.lineBetween(x + width/4, baseY - height + 10, x + width/4, baseY - 5);
        
        // Broken top - jagged edge
        g.fillStyle(0x5a5a6a, 1);
        g.beginPath();
        g.moveTo(x - width/2, baseY - height);
        g.lineTo(x - width/3, baseY - height - 15);
        g.lineTo(x, baseY - height - 5);
        g.lineTo(x + width/4, baseY - height - 20);
        g.lineTo(x + width/2, baseY - height - 8);
        g.lineTo(x + width/2, baseY - height);
        g.closePath();
        g.fillPath();
        
        // Moss on pillar
        g.fillStyle(0x2d5a3d, 0.5);
        g.fillCircle(x - width/3, baseY - height/2, 8);
        g.fillCircle(x + width/4, baseY - 20, 6);
    }
    
    private drawSupportColumn(g: Phaser.GameObjects.Graphics, x: number, topY: number, bottomY: number): void {
        const width = 20;
        const height = bottomY - topY;
        
        // Column shadow
        g.fillStyle(0x1a1a2e, 0.5);
        g.fillRect(x - width/2 + 3, topY + 3, width, height);
        
        // Main column
        g.fillStyle(0x4a4a5a, 1);
        g.fillRect(x - width/2, topY, width, height);
        
        // Highlight edge
        g.fillStyle(0x6a6a7a, 0.5);
        g.fillRect(x - width/2, topY, 4, height);
        
        // Dark edge
        g.fillStyle(0x2a2a3a, 0.5);
        g.fillRect(x + width/2 - 4, topY, 4, height);
        
        // Decorative bands
        g.fillStyle(0x3a3a4a, 1);
        g.fillRect(x - width/2 - 3, topY + 10, width + 6, 8);
        g.fillRect(x - width/2 - 3, bottomY - 20, width + 6, 8);
    }
    
    private drawRubble(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
        const colors = [0x4a4a5a, 0x5a5a6a, 0x3a3a4a];
        
        for (let i = 0; i < 5; i++) {
            const rx = x + (Math.random() - 0.5) * 60;
            const ry = y - Math.random() * 10;
            const size = 5 + Math.random() * 10;
            
            g.fillStyle(colors[Math.floor(Math.random() * colors.length)], 1);
            g.fillRect(rx, ry, size, size * 0.7);
        }
    }
    
    private drawVoidCracks(g: Phaser.GameObjects.Graphics): void {
        // Corrupted void energy seeping through floor cracks
        const crackPositions = [
            { x: 400, length: 80 },
            { x: 700, length: 120 },
            { x: 1000, length: 90 }
        ];
        
        crackPositions.forEach(crack => {
            // Dark void base
            g.lineStyle(4, 0x1a0020, 0.8);
            g.beginPath();
            g.moveTo(crack.x, 620);
            let cx = crack.x;
            for (let i = 0; i < crack.length; i += 15) {
                cx += (Math.random() - 0.5) * 20;
                g.lineTo(cx, 620 - i);
            }
            g.strokePath();
            
            // Void glow
            g.lineStyle(2, 0x8B0000, 0.4);
            g.beginPath();
            g.moveTo(crack.x, 620);
            cx = crack.x;
            for (let i = 0; i < crack.length; i += 15) {
                cx += (Math.random() - 0.5) * 15;
                g.lineTo(cx, 620 - i);
            }
            g.strokePath();
        });
    }
    
    private createAtmosphere(): void {
        // Floating dust particles
        this.add.particles(700, 300, 'dust', {
            x: { min: 0, max: 1400 },
            y: { min: 0, max: 600 },
            lifespan: 4000,
            speedY: { min: -10, max: 10 },
            speedX: { min: -5, max: 5 },
            scale: { start: 0.3, end: 0.1 },
            alpha: { start: 0.3, end: 0 },
            quantity: 1,
            frequency: 200
        });
        
        // Ambient void wisps
        for (let i = 0; i < 5; i++) {
            const wisp = this.add.graphics();
            wisp.fillStyle(0x8B0000, 0.2);
            wisp.fillCircle(0, 0, 15);
            wisp.setPosition(
                Phaser.Math.Between(100, 1300),
                Phaser.Math.Between(100, 500)
            );
            
            // Float around
            this.tweens.add({
                targets: wisp,
                x: wisp.x + Phaser.Math.Between(-100, 100),
                y: wisp.y + Phaser.Math.Between(-50, 50),
                duration: 3000 + i * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    // ==================== BOSS CREATION ====================
    
    private createBoss(): void {
        this.bossContainer = this.add.container(this.bossX, this.bossY);
        
        // Boss glow (underneath)
        this.bossGlow = this.add.graphics();
        this.drawBossGlow();
        this.bossContainer.add(this.bossGlow);
        
        // Boss body
        this.bossBody = this.add.graphics();
        this.drawBoss();
        this.bossContainer.add(this.bossBody);
        
        // Hitbox for combat
        this.bossHitbox = new Phaser.Geom.Rectangle(-30, -50, 60, 100);
        
        // Initially dormant - slightly transparent
        this.bossContainer.setAlpha(0.5);
        
        // Subtle breathing animation
        this.tweens.add({
            targets: this.bossContainer,
            scaleY: 1.02,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    private drawBoss(): void {
        const g = this.bossBody;
        g.clear();
        
        const phase = this.bossPhase;
        const hurtFlash = this.invincibleTimer > 0 && Math.floor(this.animTimer / 50) % 2 === 0;
        
        // Colors based on phase
        const bodyColor = hurtFlash ? 0xFFFFFF : (phase >= 3 ? 0x1a0a1a : phase >= 2 ? 0x150515 : 0x0a0a15);
        const glowColor = phase >= 3 ? 0xFF0000 : phase >= 2 ? 0xCC0000 : 0x8B0000;
        const eyeColor = phase >= 3 ? 0xFF4444 : 0xFF0000;
        
        // Cloak/body - larger imposing figure
        g.fillStyle(bodyColor, 1);
        
        // Main body shape (flowing cloak)
        g.beginPath();
        g.moveTo(-35, 50);  // Bottom left
        g.lineTo(-40, 0);   // Left side
        g.lineTo(-30, -40); // Left shoulder
        g.lineTo(0, -55);   // Top center (head)
        g.lineTo(30, -40);  // Right shoulder
        g.lineTo(40, 0);    // Right side
        g.lineTo(35, 50);   // Bottom right
        g.closePath();
        g.fillPath();
        
        // Crown/horns
        g.fillStyle(bodyColor, 1);
        g.fillTriangle(-20, -50, -30, -80, -10, -55);
        g.fillTriangle(20, -50, 30, -80, 10, -55);
        g.fillTriangle(0, -55, 0, -90, 5, -60); // Center horn
        
        // Face void
        g.fillStyle(0x000000, 1);
        g.fillEllipse(0, -35, 25, 20);
        
        // Eyes - menacing
        g.fillStyle(eyeColor, 1);
        const eyeOffset = this.bossFacing * 3;
        g.fillCircle(-8 + eyeOffset, -38, 5);
        g.fillCircle(8 + eyeOffset, -38, 5);
        
        // Eye inner glow
        g.fillStyle(0xFFFFFF, 0.7);
        g.fillCircle(-7 + eyeOffset, -39, 2);
        g.fillCircle(9 + eyeOffset, -39, 2);
        
        // Void tendrils from bottom (more in later phases)
        const tendrilCount = phase + 2;
        g.lineStyle(3, glowColor, 0.6);
        for (let i = 0; i < tendrilCount; i++) {
            const tx = -30 + (60 / tendrilCount) * i + 10;
            const waveOffset = Math.sin(this.animTimer * 0.003 + i) * 10;
            g.beginPath();
            g.moveTo(tx, 50);
            g.lineTo(tx + waveOffset, 70);
            g.lineTo(tx - waveOffset * 0.5, 90);
            g.strokePath();
        }
        
        // Weapon (appears during attack states)
        if (this.bossState === BossState.SLASH || this.bossState === BossState.CHARGE) {
            const weaponX = this.bossFacing * 50;
            g.fillStyle(0x2a2a3a, 1);
            g.fillRect(weaponX - 5, -30, 10, 80);
            g.fillTriangle(weaponX - 8, -30, weaponX + 8, -30, weaponX, -50);
            
            // Weapon glow
            g.lineStyle(2, glowColor, 0.8);
            g.strokeRect(weaponX - 5, -30, 10, 80);
        }
    }
    
    private drawBossGlow(): void {
        const g = this.bossGlow;
        g.clear();
        
        const phase = this.bossPhase;
        const intensity = 0.2 + (phase - 1) * 0.1;
        const color = phase >= 3 ? 0xFF0000 : phase >= 2 ? 0xCC0000 : 0x8B0000;
        
        // Pulsing aura
        const pulse = Math.sin(this.animTimer * 0.002) * 0.1 + 0.9;
        const size = 60 * pulse;
        
        g.fillStyle(color, intensity * pulse);
        g.fillCircle(0, -10, size);
        g.fillCircle(0, -10, size * 0.7);
    }
    
    // ==================== BOSS UI ====================
    
    private createBossUI(): void {
        // Boss name (hidden initially)
        this.bossNameText = this.add.text(700, 60, 'THE FORGOTTEN KING', {
            fontSize: '32px',
            fontFamily: 'Georgia, serif',
            color: '#8B0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);
        
        // Phase indicator
        this.phaseText = this.add.text(700, 95, '', {
            fontSize: '16px',
            fontFamily: 'Courier New, monospace',
            color: '#666666'
        }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);
        
        // Health bar
        this.bossHealthBar = this.add.graphics().setScrollFactor(0).setAlpha(0);
    }
    
    private updateBossHealthBar(): void {
        const g = this.bossHealthBar;
        g.clear();
        
        const barWidth = 400;
        const barHeight = 16;
        const x = 450;
        const y = 120;
        
        // Background
        g.fillStyle(0x0a0a0a, 1);
        g.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
        
        // Health remaining
        const healthPercent = this.bossHealth / this.bossMaxHealth;
        const fillColor = this.bossPhase >= 3 ? 0xFF0000 : this.bossPhase >= 2 ? 0xCC3333 : 0x8B0000;
        g.fillStyle(fillColor, 1);
        g.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // Phase markers
        g.lineStyle(2, 0xFFFFFF, 0.5);
        g.lineBetween(x + barWidth * 0.66, y, x + barWidth * 0.66, y + barHeight);
        g.lineBetween(x + barWidth * 0.33, y, x + barWidth * 0.33, y + barHeight);
        
        // Border
        g.lineStyle(2, 0x4a4a5a, 1);
        g.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
    }
    
    // ==================== STORY ELEMENTS ====================
    
    private showEntranceText(): void {
        const texts = [
            { text: 'The Hollow Throne...', delay: 500, duration: 2000 },
            { text: 'Where the King awaits...', delay: 2800, duration: 2000 },
            { text: 'Consumed by void, forgotten by time.', delay: 5000, duration: 2500 }
        ];
        
        texts.forEach(t => {
            this.time.delayedCall(t.delay, () => {
                const text = this.add.text(700, 200, t.text, {
                    fontSize: '20px',
                    fontFamily: 'Georgia, serif',
                    color: '#666666',
                    fontStyle: 'italic'
                }).setOrigin(0.5).setAlpha(0);
                
                this.tweens.add({
                    targets: text,
                    alpha: 1,
                    duration: 500
                });
                
                this.time.delayedCall(t.duration, () => {
                    this.tweens.add({
                        targets: text,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => text.destroy()
                    });
                });
            });
        });
    }
    
    private showPhaseTransitionText(phase: number): void {
        const phaseTexts: { [key: number]: string } = {
            2: 'His rage awakens...',
            3: 'THE VOID CONSUMES!'
        };
        
        if (!phaseTexts[phase]) return;
        
        const text = this.add.text(700, 300, phaseTexts[phase], {
            fontSize: phase === 3 ? '36px' : '28px',
            fontFamily: 'Georgia, serif',
            color: phase === 3 ? '#FF0000' : '#CC0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: text,
            scale: 1.3,
            alpha: 0,
            y: 250,
            duration: 2000,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy()
        });
    }
    
    // ==================== BATTLE TRIGGER ====================
    
    private createBattleTrigger(): void {
        // Trigger zone
        const triggerZone = this.add.rectangle(700, 550, 300, 200).setAlpha(0);
        this.physics.add.existing(triggerZone, true);
        
        // Prompt text
        const promptText = this.add.text(700, 400, '[ Approach the Throne ]', {
            fontSize: '18px',
            fontFamily: 'Courier New, monospace',
            color: '#8B0000'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: promptText,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        this.physics.add.overlap(this.player, triggerZone, () => {
            if (this.bossState === BossState.DORMANT) {
                promptText.destroy();
                triggerZone.destroy();
                this.startBossFight();
            }
        });
        
        // Back exit
        const exitZone = this.add.rectangle(15, 400, 40, 300, 0x00FFFF, 0.1);
        this.physics.add.existing(exitZone, true);
        
        this.add.text(50, 300, '← Arena', {
            fontSize: '14px',
            color: '#3a3a5a'
        });
        
        this.physics.add.overlap(this.player, exitZone, () => {
            if (this.bossState === BossState.DORMANT) {
                this.transitionOut(SCENES.ARENA);
            }
        });
    }
    
    private startBossFight(): void {
        this.bossState = BossState.AWAKENING;
        this.stateTimer = 3000;
        
        // Camera focus on boss
        this.cameras.main.stopFollow();
        this.cameras.main.pan(this.bossX, this.bossY - 100, 1000, 'Cubic.easeOut');
        
        // Dramatic flash
        this.cameras.main.flash(500, 50, 0, 0);
        this.screenShakeIntensity = 5;
        
        // Boss awakens
        this.tweens.add({
            targets: this.bossContainer,
            alpha: 1,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                this.bossContainer.setScale(1);
            }
        });
        
        // Show UI
        this.time.delayedCall(1500, () => {
            this.tweens.add({
                targets: [this.bossNameText, this.bossHealthBar, this.phaseText],
                alpha: 1,
                duration: 500
            });
            this.phaseText.setText('- Phase I -');
        });
        
        // Boss roar text
        this.time.delayedCall(1000, () => {
            const roar = this.add.text(this.bossX, this.bossY - 100, 'YOU DARE...', {
                fontSize: '28px',
                fontFamily: 'Georgia, serif',
                color: '#FF0000',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: roar,
                y: this.bossY - 150,
                alpha: 0,
                duration: 1500,
                onComplete: () => roar.destroy()
            });
        });
        
        // Return camera and start fight
        this.time.delayedCall(2500, () => {
            this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
            this.bossState = BossState.IDLE;
            this.stateTimer = 500;
        });
    }
    
    // ==================== BOSS AI ====================
    
    private updateBoss(delta: number): void {
        // Always update visuals
        this.drawBoss();
        this.drawBossGlow();
        
        if (this.bossState === BossState.DORMANT || this.bossState === BossState.AWAKENING) {
            return;
        }
        
        if (this.bossState === BossState.DEAD) {
            return;
        }
        
        // Update health bar
        this.updateBossHealthBar();
        
        // State timer
        this.stateTimer -= delta;
        
        // Face player
        this.bossFacing = this.player.x < this.bossX ? -1 : 1;
        
        // State machine
        switch (this.bossState) {
            case BossState.IDLE:
                this.updateIdle();
                break;
            case BossState.WALKING:
                this.updateWalking();
                break;
            case BossState.SLASH:
                this.updateSlash();
                break;
            case BossState.CHARGE:
                this.updateCharge();
                break;
            case BossState.SUMMON:
                this.updateSummon();
                break;
            case BossState.SLAM:
                this.updateSlam();
                break;
            case BossState.STUNNED:
                this.updateStunned();
                break;
            case BossState.DYING:
                break;
        }
        
        // Apply velocity
        this.bossX += this.bossVelocityX * (delta / 1000);
        this.bossY += this.bossVelocityY * (delta / 1000);
        
        // Keep in bounds
        this.bossX = Phaser.Math.Clamp(this.bossX, 80, 1320);
        this.bossY = Phaser.Math.Clamp(this.bossY, 100, 580);
        
        // Update position
        this.bossContainer.setPosition(this.bossX, this.bossY);
        this.bossContainer.setScale(this.bossFacing, 1);
        
        // Update hitbox
        this.bossHitbox.setPosition(this.bossX - 30, this.bossY - 50);
        
        // Check player collision
        this.checkBossPlayerCollision();
    }
    
    private updateIdle(): void {
        this.bossVelocityX = 0;
        this.bossVelocityY = 0;
        
        if (this.stateTimer <= 0 && this.attackCooldown <= 0) {
            this.chooseNextAction();
        }
    }
    
    private updateWalking(): void {
        const speed = 120 + (this.bossPhase - 1) * 40;
        const direction = this.player.x < this.bossX ? -1 : 1;
        this.bossVelocityX = speed * direction;
        
        const distance = Math.abs(this.player.x - this.bossX);
        
        if (distance < 100 && this.attackCooldown <= 0) {
            this.startSlash();
        } else if (this.stateTimer <= 0) {
            this.bossState = BossState.IDLE;
            this.stateTimer = 300;
        }
    }
    
    private chooseNextAction(): void {
        const distance = Math.abs(this.player.x - this.bossX);
        const roll = Math.random();
        
        if (distance < 120) {
            // Close range - slash
            this.startSlash();
        } else if (distance > 400 && this.bossPhase >= 2 && roll > 0.5) {
            // Far range, phase 2+ - charge
            this.startCharge();
        } else if (this.bossPhase >= 2 && roll > 0.7) {
            // Phase 2+ - summon
            this.startSummon();
        } else if (this.bossPhase >= 3 && roll > 0.6) {
            // Phase 3 - slam
            this.startSlam();
        } else {
            // Walk towards player
            this.bossState = BossState.WALKING;
            this.stateTimer = 2000;
        }
    }
    
    // ==================== BOSS ATTACKS ====================
    
    private startSlash(): void {
        this.bossState = BossState.SLASH;
        this.stateTimer = 400;
        this.bossVelocityX = 0;
        
        // Windup
        this.tweens.add({
            targets: this.bossContainer,
            x: this.bossX - this.bossFacing * 20,
            duration: 100,
            yoyo: true
        });
        
        // Damage after windup
        this.time.delayedCall(150, () => {
            if (this.bossState !== BossState.SLASH) return;
            
            const slashHitbox = new Phaser.Geom.Rectangle(
                this.bossX + this.bossFacing * 30,
                this.bossY - 40,
                80,
                80
            );
            
            const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
            const playerRect = new Phaser.Geom.Rectangle(
                playerBody.x, playerBody.y, playerBody.width, playerBody.height
            );
            
            if (Phaser.Geom.Rectangle.Overlaps(slashHitbox, playerRect)) {
                this.player.takeDamage(2, this.bossX);
                this.screenShakeIntensity = 8;
            }
            
            // Slash visual effect
            this.createSlashEffect(this.bossX + this.bossFacing * 50, this.bossY - 20);
        });
        
        this.attackCooldown = 800 - (this.bossPhase - 1) * 150;
    }
    
    private startCharge(): void {
        this.bossState = BossState.CHARGE;
        this.stateTimer = 600;
        
        // Windup visual
        this.tweens.add({
            targets: this.bossContainer,
            scaleX: this.bossFacing * 1.3,
            duration: 200,
            yoyo: true
        });
        
        // Start charging after windup
        this.time.delayedCall(200, () => {
            if (this.bossState !== BossState.CHARGE) return;
            
            const chargeDir = this.player.x < this.bossX ? -1 : 1;
            this.bossVelocityX = 600 * chargeDir;
            
            // Trail effect
            for (let i = 0; i < 5; i++) {
                this.time.delayedCall(i * 50, () => {
                    const trail = this.add.graphics();
                    trail.fillStyle(0x8B0000, 0.3);
                    trail.fillRect(this.bossX - 20, this.bossY - 50, 40, 100);
                    this.tweens.add({
                        targets: trail,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => trail.destroy()
                    });
                });
            }
        });
        
        this.attackCooldown = 1500;
    }
    
    private startSummon(): void {
        this.bossState = BossState.SUMMON;
        this.stateTimer = 1500;
        this.bossVelocityX = 0;
        
        // Raise hands animation
        this.tweens.add({
            targets: this.bossContainer,
            y: this.bossY - 20,
            duration: 300,
            yoyo: true
        });
        
        // Spawn void orbs
        const orbCount = this.bossPhase;
        for (let i = 0; i < orbCount; i++) {
            this.time.delayedCall(300 + i * 200, () => {
                this.spawnVoidOrb();
            });
        }
        
        this.attackCooldown = 2000;
    }
    
    private startSlam(): void {
        this.bossState = BossState.SLAM;
        this.stateTimer = 1000;
        
        // Jump up
        this.tweens.add({
            targets: this.bossContainer,
            y: this.bossY - 150,
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                // Slam down
                this.tweens.add({
                    targets: this.bossContainer,
                    y: 580,
                    duration: 200,
                    ease: 'Cubic.easeIn',
                    onComplete: () => {
                        this.bossY = 580;
                        this.screenShakeIntensity = 15;
                        this.createSlamWave();
                    }
                });
            }
        });
        
        this.attackCooldown = 2500;
    }
    
    private updateSlash(): void {
        if (this.stateTimer <= 0) {
            this.bossState = BossState.IDLE;
            this.stateTimer = 300;
        }
    }
    
    private updateCharge(): void {
        // Check player collision during charge
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        const playerRect = new Phaser.Geom.Rectangle(
            playerBody.x, playerBody.y, playerBody.width, playerBody.height
        );
        
        if (Phaser.Geom.Rectangle.Overlaps(this.bossHitbox, playerRect)) {
            this.player.takeDamage(2, this.bossX);
            this.screenShakeIntensity = 10;
            this.bossVelocityX = 0;
            this.bossState = BossState.IDLE;
            this.stateTimer = 500;
            return;
        }
        
        // Stop at walls
        if (this.bossX <= 100 || this.bossX >= 1300) {
            this.bossVelocityX = 0;
            this.screenShakeIntensity = 5;
            this.bossState = BossState.STUNNED;
            this.stateTimer = 1000;
        }
        
        if (this.stateTimer <= 0) {
            this.bossVelocityX = 0;
            this.bossState = BossState.IDLE;
            this.stateTimer = 300;
        }
    }
    
    private updateSummon(): void {
        if (this.stateTimer <= 0) {
            this.bossState = BossState.IDLE;
            this.stateTimer = 500;
        }
    }
    
    private updateSlam(): void {
        if (this.stateTimer <= 0) {
            this.bossState = BossState.IDLE;
            this.stateTimer = 500;
        }
    }
    
    private updateStunned(): void {
        // Vulnerable - flash
        this.bossContainer.setAlpha(0.5 + Math.sin(this.animTimer * 0.02) * 0.3);
        
        if (this.stateTimer <= 0) {
            this.bossContainer.setAlpha(1);
            this.bossState = BossState.IDLE;
            this.stateTimer = 300;
        }
    }
    
    // ==================== VOID ORBS ====================
    
    private spawnVoidOrb(): void {
        const orb = this.add.graphics();
        const startX = this.bossX;
        const startY = this.bossY - 30;
        
        orb.fillStyle(0x8B0000, 0.8);
        orb.fillCircle(0, 0, 12);
        orb.fillStyle(0xFF0000, 0.5);
        orb.fillCircle(0, 0, 6);
        orb.setPosition(startX, startY);
        
        // Store orb data
        (orb as any).targetX = this.player.x;
        (orb as any).targetY = this.player.y;
        (orb as any).speed = 200;
        (orb as any).lifetime = 3000;
        (orb as any).chasing = false;
        
        this.voidOrbs.push(orb);
        
        // Float up then chase
        this.tweens.add({
            targets: orb,
            y: startY - 50,
            duration: 500,
            onComplete: () => {
                (orb as any).chasing = true;
            }
        });
    }
    
    private updateVoidOrbs(delta: number): void {
        this.voidOrbs = this.voidOrbs.filter(orb => {
            if (!orb.active) return false;
            
            (orb as any).lifetime -= delta;
            if ((orb as any).lifetime <= 0) {
                orb.destroy();
                return false;
            }
            
            if ((orb as any).chasing) {
                const dx = this.player.x - orb.x;
                const dy = this.player.y - orb.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    const speed = (orb as any).speed * (delta / 1000);
                    orb.x += (dx / dist) * speed;
                    orb.y += (dy / dist) * speed;
                }
                
                // Check player collision
                if (dist < 30) {
                    this.player.takeDamage(1, orb.x);
                    this.createHitEffect(orb.x, orb.y);
                    orb.destroy();
                    return false;
                }
            }
            
            return true;
        });
    }
    
    // ==================== EFFECTS ====================
    
    private createSlashEffect(x: number, y: number): void {
        const slash = this.add.graphics();
        slash.lineStyle(4, 0xFF0000, 1);
        slash.beginPath();
        slash.arc(x, y, 40, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60));
        slash.strokePath();
        
        this.tweens.add({
            targets: slash,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => slash.destroy()
        });
    }
    
    private createSlamWave(): void {
        // Ground wave effect
        for (let i = 0; i < 2; i++) {
            const dir = i === 0 ? -1 : 1;
            const wave = this.add.graphics();
            wave.fillStyle(0x8B0000, 0.7);
            wave.fillRect(0, 0, 50, 30);
            wave.setPosition(this.bossX, 595);
            
            this.tweens.add({
                targets: wave,
                x: this.bossX + dir * 400,
                alpha: 0,
                scaleX: 2,
                duration: 500,
                onComplete: () => wave.destroy()
            });
            
            // Damage check along wave path
            this.time.delayedCall(100, () => {
                const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
                if (playerBody.y > 550 && Math.abs(this.player.x - this.bossX) < 350) {
                    this.player.takeDamage(2, this.bossX);
                }
            });
        }
    }
    
    private createHitEffect(x: number, y: number): void {
        const hit = this.add.graphics();
        hit.fillStyle(0xFF0000, 1);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            hit.fillCircle(Math.cos(angle) * 10, Math.sin(angle) * 10, 4);
        }
        hit.setPosition(x, y);
        
        this.tweens.add({
            targets: hit,
            scale: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => hit.destroy()
        });
    }
    
    // ==================== COMBAT ====================
    
    private setupCombat(): void {
        this.events.on('player-attack', (hitbox: Phaser.Geom.Rectangle) => {
            if (this.bossState === BossState.DORMANT || 
                this.bossState === BossState.AWAKENING ||
                this.bossState === BossState.DEAD ||
                this.invincibleTimer > 0) {
                return;
            }
            
            if (Phaser.Geom.Rectangle.Overlaps(hitbox, this.bossHitbox)) {
                this.bossTakeDamage(1);
            }
        });
    }
    
    private bossTakeDamage(amount: number): void {
        this.bossHealth -= amount;
        this.invincibleTimer = 300;
        this.screenShakeIntensity = 3;
        
        // Hit effect
        this.createHitEffect(this.bossX, this.bossY - 20);
        
        // Check phase transitions
        const healthPercent = this.bossHealth / this.bossMaxHealth;
        
        if (healthPercent <= 0.33 && this.bossPhase < 3) {
            this.transitionToPhase(3);
        } else if (healthPercent <= 0.66 && this.bossPhase < 2) {
            this.transitionToPhase(2);
        }
        
        // Check death
        if (this.bossHealth <= 0) {
            this.startBossDeath();
        }
    }
    
    private transitionToPhase(phase: number): void {
        this.bossPhase = phase;
        this.bossState = BossState.STUNNED;
        this.stateTimer = 2000;
        
        this.phaseText.setText(`- Phase ${phase === 2 ? 'II' : 'III'} -`);
        
        // Dramatic effect
        this.cameras.main.flash(300, phase === 3 ? 100 : 50, 0, 0);
        this.screenShakeIntensity = 10;
        
        this.showPhaseTransitionText(phase);
        
        // Boss roar
        const roar = this.add.text(this.bossX, this.bossY - 80, phase === 3 ? 'ENOUGH!' : 'RRRGH!', {
            fontSize: '32px',
            color: '#FF0000',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: roar,
            y: this.bossY - 130,
            alpha: 0,
            duration: 1000,
            onComplete: () => roar.destroy()
        });
    }
    
    private checkBossPlayerCollision(): void {
        if (this.bossState === BossState.DORMANT || this.bossState === BossState.DEAD) return;
        
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        const playerRect = new Phaser.Geom.Rectangle(
            playerBody.x, playerBody.y, playerBody.width, playerBody.height
        );
        
        if (Phaser.Geom.Rectangle.Overlaps(this.bossHitbox, playerRect)) {
            // Contact damage
            if (this.bossState !== BossState.STUNNED) {
                this.player.takeDamage(1, this.bossX);
            }
        }
    }
    
    // ==================== BOSS DEATH ====================
    
    private startBossDeath(): void {
        this.bossState = BossState.DYING;
        
        // Destroy all orbs
        this.voidOrbs.forEach(orb => orb.destroy());
        this.voidOrbs = [];
        
        // Freeze and shake
        this.screenShakeIntensity = 20;
        
        // Death animation
        this.tweens.add({
            targets: this.bossContainer,
            alpha: 0,
            scaleY: 0,
            duration: 2000,
            ease: 'Cubic.easeIn'
        });
        
        // Explosion particles
        for (let i = 0; i < 20; i++) {
            this.time.delayedCall(i * 100, () => {
                const particle = this.add.graphics();
                particle.fillStyle(0xFF0000, 1);
                particle.fillCircle(0, 0, Phaser.Math.Between(5, 15));
                particle.setPosition(
                    this.bossX + Phaser.Math.Between(-40, 40),
                    this.bossY + Phaser.Math.Between(-60, 40)
                );
                
                this.tweens.add({
                    targets: particle,
                    y: particle.y - Phaser.Math.Between(50, 150),
                    alpha: 0,
                    duration: 500,
                    onComplete: () => particle.destroy()
                });
            });
        }
        
        // Victory!
        this.time.delayedCall(2500, () => {
            this.bossState = BossState.DEAD;
            this.showVictory();
        });
    }
    
    private showVictory(): void {
        // Hide boss UI
        this.tweens.add({
            targets: [this.bossNameText, this.bossHealthBar, this.phaseText],
            alpha: 0,
            duration: 500
        });
        
        // Victory text
        const victory = this.add.text(700, 300, 'VICTORY', {
            fontSize: '72px',
            fontFamily: 'Georgia, serif',
            color: '#00FFFF',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);
        
        this.tweens.add({
            targets: victory,
            alpha: 1,
            scale: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: 1
        });
        
        // Epilogue text
        this.time.delayedCall(2000, () => {
            const epilogue = this.add.text(700, 400, 'The Forgotten King has fallen.\nThe void recedes... for now.', {
                fontSize: '20px',
                fontFamily: 'Georgia, serif',
                color: '#888888',
                align: 'center',
                fontStyle: 'italic'
            }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);
            
            this.tweens.add({
                targets: epilogue,
                alpha: 1,
                duration: 1000
            });
        });
        
        // Return to menu after delay
        this.time.delayedCall(6000, () => {
            this.transitionOut(SCENES.MENU);
        });
    }
    
    private transitionOut(scene: string): void {
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.time.delayedCall(1000, () => {
            this.scene.start(scene);
        });
    }
}
