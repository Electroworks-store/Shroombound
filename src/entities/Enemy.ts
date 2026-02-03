/**
 * Base Enemy Class
 * Common functionality for all enemies
 */

import * as Phaser from 'phaser';
import { COLORS } from '../config';

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
    protected health: number;
    protected maxHealth: number;
    protected damage: number;
    protected speed: number;
    protected isHurt: boolean = false;
    protected isAlive: boolean = true;
    protected facingRight: boolean = true;
    protected knockbackVelocity: number = 300;
    protected hurtTimer: number = 0;
    protected hurtDuration: number = 200;
    
    constructor(
        scene: Phaser.Scene, 
        x: number, 
        y: number, 
        texture: string,
        config: { health: number; damage: number; speed: number }
    ) {
        super(scene, x, y, texture);
        
        this.health = config.health;
        this.maxHealth = config.health;
        this.damage = config.damage;
        this.speed = config.speed;
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
    }
    
    abstract update(time: number, delta: number, player: Phaser.Physics.Arcade.Sprite): void;
    
    takeDamage(amount: number, sourceX: number): void {
        if (this.isHurt || !this.isAlive) return;
        
        this.health -= amount;
        this.isHurt = true;
        this.hurtTimer = this.hurtDuration;
        
        // Knockback
        const direction = this.x < sourceX ? -1 : 1;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x = this.knockbackVelocity * direction;
        body.velocity.y = -100;
        
        // Visual feedback
        this.setTint(0xFFFFFF);
        
        // Hitstop effect
        this.scene.time.delayedCall(50, () => {
            this.clearTint();
        });
        
        // Create hit particles
        this.createHitEffect();
        
        // Check for death
        if (this.health <= 0) {
            this.die();
        }
    }
    
    protected createHitEffect(): void {
        const particles = this.scene.add.particles(this.x, this.y, 'impact', {
            speed: { min: 50, max: 100 },
            scale: { start: 0.5, end: 0 },
            lifespan: 200,
            quantity: 5,
            tint: COLORS.ENEMY_GLOW
        });
        
        this.scene.time.delayedCall(200, () => particles.destroy());
    }
    
    protected die(): void {
        this.isAlive = false;
        
        // Death particles
        const particles = this.scene.add.particles(this.x, this.y, 'dust', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 500,
            quantity: 15,
            tint: COLORS.ENEMY_BODY
        });
        
        this.scene.time.delayedCall(500, () => particles.destroy());
        
        // Fade out and destroy
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.scene.events.emit('enemy-defeated');
                this.destroy();
            }
        });
    }
    
    protected updateHurt(delta: number): void {
        if (this.isHurt) {
            this.hurtTimer -= delta;
            if (this.hurtTimer <= 0) {
                this.isHurt = false;
            }
        }
    }
    
    protected facePlayer(playerX: number): void {
        this.facingRight = playerX > this.x;
        this.setFlipX(!this.facingRight);
    }
    
    getDamage(): number {
        return this.damage;
    }
    
    isActive(): boolean {
        return this.isAlive && !this.isHurt;
    }
}
