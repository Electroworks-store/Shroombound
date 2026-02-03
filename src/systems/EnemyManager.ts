/**
 * EnemyManager - Reusable enemy spawning and management system
 * Enemies patrol back and forth, don't fall into holes, and damage player on contact
 */

import * as Phaser from 'phaser';
import { COLORS, CRAWLER, FLYER } from '../config';
import { Player } from '@/entities/Player';

export type EnemyType = 'crawler' | 'flyer';

export interface EnemySpawnConfig {
    type: EnemyType;
    x: number;
    y: number;
    patrolRange?: number; // How far to patrol from spawn point
    patrolMinX?: number;  // Optional hard bounds for patrol
    patrolMaxX?: number;  // Optional hard bounds for patrol
}

/**
 * Base enemy with patrol behavior
 */
class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
    protected health: number = 2;
    protected damage: number = 1;
    protected moveSpeed: number = 80;
    protected isAlive: boolean = true;
    protected isHurt: boolean = false;
    protected hurtTimer: number = 0;
    
    // Patrol state
    protected spawnX: number;
    protected patrolRange: number = 150;
    protected patrolDir: number = 1;
    protected patrolMinX?: number;
    protected patrolMaxX?: number;
    
    // Visual container
    protected gfx!: Phaser.GameObjects.Graphics;
    
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        textureKey: string,
        patrolRange: number = 150,
        patrolMinX?: number,
        patrolMaxX?: number
    ) {
        // Use a valid texture key (we draw over it with graphics, but this avoids missing-frame errors)
        super(scene, x, y, textureKey, 0);
        
        this.spawnX = x;
        this.patrolRange = patrolRange;
        this.patrolMinX = patrolMinX;
        this.patrolMaxX = patrolMaxX;
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Hide the sprite itself - we use graphics instead
        this.setAlpha(0);
        
        // Create graphics for visual
        this.gfx = scene.add.graphics();
    }
    
    update(_time: number, delta: number, player: Player): void {
        if (!this.isAlive) return;
        
        // Handle hurt state
        if (this.isHurt) {
            this.hurtTimer -= delta;
            if (this.hurtTimer <= 0) {
                this.isHurt = false;
            }
        }
        
        // Check player collision for damage
        if (this.checkPlayerCollision(player)) {
            player.takeDamage(this.damage, this.x);
        }
    }
    
    protected checkPlayerCollision(player: Player): boolean {
        if (!this.isAlive) return false;
        const body = this.body as Phaser.Physics.Arcade.Body;
        const playerBody = player.body as Phaser.Physics.Arcade.Body;
        const enemyRect = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
        const playerRect = new Phaser.Geom.Rectangle(playerBody.x, playerBody.y, playerBody.width, playerBody.height);
        return Phaser.Geom.Rectangle.Overlaps(enemyRect, playerRect);
    }
    
    takeDamage(amount: number, sourceX: number): void {
        if (this.isHurt || !this.isAlive) return;
        
        this.health -= amount;
        this.isHurt = true;
        this.hurtTimer = 300;
        
        // Knockback
        const dir = this.x < sourceX ? -1 : 1;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x = 150 * dir;
        body.velocity.y = -50;
        
        // Hit particles
        this.createHitParticles();
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    protected createHitParticles(): void {
        const particles = this.scene.add.particles(this.x, this.y, 'dust', {
            speed: { min: 30, max: 60 },
            scale: { start: 0.4, end: 0 },
            lifespan: 150,
            quantity: 3,
            tint: COLORS.ENEMY_GLOW
        });
        this.scene.time.delayedCall(150, () => particles.destroy());
    }
    
    protected die(): void {
        this.isAlive = false;
        
        // Death particles
        const particles = this.scene.add.particles(this.x, this.y, 'dust', {
            speed: { min: 40, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            lifespan: 350,
            quantity: 10,
            tint: COLORS.ENEMY_BODY
        });
        this.scene.time.delayedCall(350, () => particles.destroy());
        
        // Clean up graphics and emit event
        if (this.gfx) {
            this.gfx.destroy();
        }
        this.scene.events.emit('enemy-defeated');
        this.destroy();
    }
    
    protected drawVisuals(): void {
        // Override in subclass
    }
    
    getDamage(): number { return this.damage; }
    getIsAlive(): boolean { return this.isAlive; }
    
    destroy(fromScene?: boolean): void {
        if (this.gfx) {
            this.gfx.destroy();
        }
        super.destroy(fromScene);
    }
}

/**
 * Crawler - ground enemy that patrols back and forth
 */
class CrawlerEnemy extends BaseEnemy {
    private animOffset: number = 0;
    
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        patrolRange: number = 150,
        patrolMinX?: number,
        patrolMaxX?: number
    ) {
        super(scene, x, y, 'crawler', patrolRange, patrolMinX, patrolMaxX);
        
        this.health = CRAWLER.HEALTH;
        this.damage = CRAWLER.DAMAGE;
        this.moveSpeed = CRAWLER.SPEED * 0.6; // Slower patrol speed
        
        // Set up physics body
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(44, 28);
        body.setOffset(-22, -14);
        body.setCollideWorldBounds(true);
    }
    
    update(time: number, delta: number, player: Player): void {
        super.update(time, delta, player);
        
        if (!this.isAlive) return;
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // Simple patrol: move back and forth within range of spawn point
        if (!this.isHurt) {
            const minX = this.patrolMinX ?? (this.spawnX - this.patrolRange);
            const maxX = this.patrolMaxX ?? (this.spawnX + this.patrolRange);
            const edgeBuffer = 6;

            // Check if we've gone too far from spawn or reached hard bounds
            if (this.x > maxX - edgeBuffer) {
                this.patrolDir = -1;
            } else if (this.x < minX + edgeBuffer) {
                this.patrolDir = 1;
            }
            
            // Also reverse if hitting a wall
            if (body.blocked.left) this.patrolDir = 1;
            if (body.blocked.right) this.patrolDir = -1;
            
            // Move
            body.velocity.x = this.moveSpeed * this.patrolDir;
        }
        
        // Animation offset for legs
        this.animOffset += delta * 0.008;
        
        // Draw visuals
        this.drawVisuals();
    }
    
    protected drawVisuals(): void {
        if (!this.gfx || !this.isAlive) return;
        
        this.gfx.clear();
        
        const x = this.x;
        const y = this.y;
        
        // Flash white when hurt
        const bodyColor = this.isHurt ? 0xFFFFFF : COLORS.ENEMY_BODY;
        
        // Body - rounded beetle shape
        this.gfx.fillStyle(bodyColor, 1);
        this.gfx.fillEllipse(x, y, 40, 24);
        
        // Shell highlights
        this.gfx.fillStyle(0x3a3a5a, 0.5);
        this.gfx.fillEllipse(x, y - 3, 32, 14);
        
        // Legs with animation
        const legWave = Math.sin(this.animOffset) * 2;
        this.gfx.fillStyle(bodyColor, 1);
        this.gfx.fillRect(x - 18, y + 8 + legWave, 5, 8);
        this.gfx.fillRect(x - 8, y + 10 - legWave, 4, 6);
        this.gfx.fillRect(x + 4, y + 10 + legWave, 4, 6);
        this.gfx.fillRect(x + 13, y + 8 - legWave, 5, 8);
        
        // Eyes on front side
        const eyeOffsetX = this.patrolDir > 0 ? 10 : -10;
        this.gfx.fillStyle(COLORS.ENEMY_GLOW, 1);
        this.gfx.fillCircle(x + eyeOffsetX, y - 2, 4);
        this.gfx.fillCircle(x + eyeOffsetX + 6 * this.patrolDir, y, 3);
        
        // Eye glow
        this.gfx.fillStyle(COLORS.ENEMY_GLOW, 0.2);
        this.gfx.fillCircle(x + eyeOffsetX, y - 2, 8);
    }
}

/**
 * Flyer - hovering enemy that patrols in the air
 */
class FlyerEnemy extends BaseEnemy {
    private baseY: number;
    private hoverOffset: number = 0;
    private wingAngle: number = 0;
    
    constructor(scene: Phaser.Scene, x: number, y: number, patrolRange: number = 120) {
        super(scene, x, y, 'flyer', patrolRange);
        
        this.baseY = y;
        this.health = FLYER.HEALTH;
        this.damage = FLYER.DAMAGE;
        this.moveSpeed = FLYER.SPEED * 0.4; // Slower patrol
        
        // No gravity for flyers
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setSize(32, 28);
        body.setOffset(-16, -14);
        body.setCollideWorldBounds(true);
    }
    
    update(time: number, delta: number, player: Player): void {
        super.update(time, delta, player);
        
        if (!this.isAlive) return;
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        if (!this.isHurt) {
            // Patrol horizontally
            if (this.x > this.spawnX + this.patrolRange) {
                this.patrolDir = -1;
            } else if (this.x < this.spawnX - this.patrolRange) {
                this.patrolDir = 1;
            }
            
            body.velocity.x = this.moveSpeed * this.patrolDir;
            
            // Hover up and down
            this.hoverOffset += delta * 0.003;
            const targetY = this.baseY + Math.sin(this.hoverOffset) * 20;
            body.velocity.y = (targetY - this.y) * 3;
        }
        
        // Wing flap animation
        this.wingAngle += delta * 0.015;
        
        this.drawVisuals();
    }
    
    protected drawVisuals(): void {
        if (!this.gfx || !this.isAlive) return;
        
        this.gfx.clear();
        
        const x = this.x;
        const y = this.y;
        
        const bodyColor = this.isHurt ? 0xFFFFFF : COLORS.ENEMY_BODY;
        
        // Wing flap
        const wingY = Math.sin(this.wingAngle) * 6;
        
        // Wings
        this.gfx.fillStyle(bodyColor, 0.7);
        // Left wing
        this.gfx.beginPath();
        this.gfx.moveTo(x - 4, y);
        this.gfx.lineTo(x - 24, y - 6 + wingY);
        this.gfx.lineTo(x - 18, y + 4);
        this.gfx.closePath();
        this.gfx.fill();
        // Right wing
        this.gfx.beginPath();
        this.gfx.moveTo(x + 4, y);
        this.gfx.lineTo(x + 24, y - 6 - wingY);
        this.gfx.lineTo(x + 18, y + 4);
        this.gfx.closePath();
        this.gfx.fill();
        
        // Body
        this.gfx.fillStyle(bodyColor, 1);
        this.gfx.fillCircle(x, y, 12);
        
        // Eye
        this.gfx.fillStyle(COLORS.ENEMY_GLOW, 1);
        this.gfx.fillCircle(x, y - 2, 5);
        
        // Eye glow
        this.gfx.fillStyle(COLORS.ENEMY_GLOW, 0.25);
        this.gfx.fillCircle(x, y - 2, 10);
        
        // Pupil
        this.gfx.fillStyle(0x000000, 1);
        this.gfx.fillCircle(x + this.patrolDir * 2, y - 2, 2);
    }
}

/**
 * EnemyManager - manages all enemies in a scene
 */
export class EnemyManager {
    private scene: Phaser.Scene;
    private enemies!: Phaser.Physics.Arcade.Group;
    private player: Player;
    private isDestroyed: boolean = false;
    
    constructor(scene: Phaser.Scene, platforms: Phaser.Physics.Arcade.StaticGroup, player: Player) {
        this.scene = scene;
        this.player = player;
        
        // Create physics group for enemies
        this.enemies = scene.physics.add.group({
            collideWorldBounds: true
        });
        
        // Enemies collide with platforms (prevents falling through)
        scene.physics.add.collider(this.enemies, platforms);
        
        // Listen for player attacks
        scene.events.on('player-attack', (hitbox: Phaser.Geom.Rectangle) => {
            this.handlePlayerAttack(hitbox);
        });
    }
    
    spawnEnemies(configs: EnemySpawnConfig[]): void {
        configs.forEach(config => {
            this.spawnEnemy(
                config.type,
                config.x,
                config.y,
                config.patrolRange,
                config.patrolMinX,
                config.patrolMaxX
            );
        });
    }
    
    spawnEnemy(
        type: EnemyType,
        x: number,
        y: number,
        patrolRange: number = 150,
        patrolMinX?: number,
        patrolMaxX?: number
    ): BaseEnemy | null {
        let enemy: BaseEnemy | null = null;
        
        switch (type) {
            case 'crawler':
                enemy = new CrawlerEnemy(this.scene, x, y, patrolRange, patrolMinX, patrolMaxX);
                break;
            case 'flyer':
                enemy = new FlyerEnemy(this.scene, x, y, patrolRange);
                break;
        }
        
        if (enemy) {
            this.enemies.add(enemy);
        }
        
        return enemy;
    }
    
    update(time: number, delta: number): void {
        if (this.isDestroyed || !this.enemies) return;
        
        this.enemies.getChildren().forEach(enemy => {
            const e = enemy as BaseEnemy;
            if (e.active && e.getIsAlive()) {
                e.update(time, delta, this.player);
            }
        });
    }
    
    private handlePlayerAttack(hitbox: Phaser.Geom.Rectangle): void {
        if (this.isDestroyed || !this.enemies) return;
        
        this.enemies.getChildren().forEach(enemy => {
            const e = enemy as BaseEnemy;
            if (e.active && e.getIsAlive()) {
                const body = e.body as Phaser.Physics.Arcade.Body;
                const enemyRect = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
                if (Phaser.Geom.Rectangle.Overlaps(hitbox, enemyRect)) {
                    e.takeDamage(1, this.player.x);
                }
            }
        });
    }
    
    getAliveCount(): number {
        return this.enemies.getChildren().filter(e => (e as BaseEnemy).getIsAlive()).length;
    }
    
    getGroup(): Phaser.Physics.Arcade.Group {
        return this.enemies;
    }
    
    destroy(): void {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        
        if (this.enemies) {
            this.enemies.getChildren().forEach(enemy => {
                const e = enemy as BaseEnemy;
                e.destroy();
            });
            this.enemies.destroy(true);
        }
    }
}
