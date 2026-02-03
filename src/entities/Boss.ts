/**
 * Boss Entity - The Shade Knight
 * Three-phase boss fight that mirrors the player
 */

import * as Phaser from 'phaser';
import { BOSS, COLORS } from '../config';
import { Player } from '@/entities/Player';

enum BossPhase {
    PHASE_1,
    PHASE_2,
    PHASE_3
}

enum BossState {
    IDLE,
    WALK,
    ATTACK,
    DASH,
    STUNNED,
    TRANSITION
}

export class Boss extends Phaser.Physics.Arcade.Sprite {
    // Stats
    private health: number = BOSS.HEALTH;
    private maxHealth: number = BOSS.HEALTH;
    private damage: number = BOSS.DAMAGE;
    
    // State
    private phase: BossPhase = BossPhase.PHASE_1;
    private currentState: BossState = BossState.IDLE;
    private facingRight: boolean = false;
    private isAlive: boolean = true;
    private isHurt: boolean = false;
    private hurtTimer: number = 0;
    private hurtDuration: number = 300;
    
    // Timers
    private actionTimer: number = 0;
    private attackCooldown: number = BOSS.PHASE1_ATTACK_COOLDOWN;
    private attackTimer: number = 0;
    
    // Combat
    private currentSpeed: number = BOSS.PHASE1_SPEED;
    private hitbox: Phaser.Geom.Rectangle | null = null;
    
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'boss', 0);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Configure physics
        this.setSize(BOSS.WIDTH * 0.6, BOSS.HEIGHT * 0.85);
        this.setOffset(BOSS.WIDTH * 0.2, BOSS.HEIGHT * 0.15);
        this.setCollideWorldBounds(true);
        
        // Play idle animation if it exists
        if (scene.anims.exists('boss-idle')) {
            this.play('boss-idle');
        }
        
        // Initialize attack cooldown
        this.attackTimer = this.attackCooldown;
    }
    
    update(_time: number, delta: number, player: Player): void {
        if (!this.isAlive || !this.active) return;
        
        this.updateHurt(delta);
        
        if (this.isHurt || this.currentState === BossState.TRANSITION) return;
        
        // Update attack cooldown
        this.attackTimer -= delta;
        
        // State machine
        switch (this.currentState) {
            case BossState.IDLE:
                this.updateIdle(delta, player);
                break;
            case BossState.WALK:
                this.updateWalk(delta, player);
                break;
            case BossState.ATTACK:
                this.updateAttack(delta, player);
                break;
            case BossState.DASH:
                this.updateDash(delta, player);
                break;
            case BossState.STUNNED:
                this.updateStunned(delta);
                break;
        }
        
        // Check for collision with player
        this.checkPlayerCollision(player);
    }
    
    private updateIdle(delta: number, player: Player): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x = 0;
        
        this.actionTimer -= delta;
        this.facePlayer(player.x);
        
        // Decide next action
        if (this.actionTimer <= 0) {
            const distanceToPlayer = Math.abs(this.x - player.x);
            
            if (distanceToPlayer < 100 && this.attackTimer <= 0) {
                this.startAttack();
            } else if (this.phase >= BossPhase.PHASE_2 && 
                       distanceToPlayer > 300 && 
                       this.attackTimer <= 0 && 
                       Math.random() > 0.5) {
                this.startDash(player);
            } else {
                this.currentState = BossState.WALK;
            }
        }
    }
    
    private updateWalk(_delta: number, player: Player): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        this.facePlayer(player.x);
        const direction = player.x > this.x ? 1 : -1;
        body.velocity.x = this.currentSpeed * direction;
        
        const distanceToPlayer = Math.abs(this.x - player.x);
        
        // Attack if close enough and cooldown ready
        if (distanceToPlayer < 120 && this.attackTimer <= 0) {
            this.startAttack();
        }
        
        // Dash if far and in phase 2+
        if (this.phase >= BossPhase.PHASE_2 && 
            distanceToPlayer > 400 && 
            this.attackTimer <= 0 &&
            Math.random() > 0.8) {
            this.startDash(player);
        }
    }
    
    private startAttack(): void {
        this.currentState = BossState.ATTACK;
        this.actionTimer = 400;  // Attack duration
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x = 0;
        
        // Create attack hitbox after wind-up
        this.scene.time.delayedCall(150, () => {
            if (this.currentState === BossState.ATTACK) {
                this.createAttackHitbox();
            }
        });
    }
    
    private createAttackHitbox(): void {
        const hitboxWidth = 100;
        const hitboxHeight = 80;
        const offsetX = this.facingRight ? 30 : -30 - hitboxWidth;
        
        this.hitbox = new Phaser.Geom.Rectangle(
            this.x + offsetX,
            this.y - hitboxHeight / 2,
            hitboxWidth,
            hitboxHeight
        );
        
        // Show slash effect
        const slashX = this.x + (this.facingRight ? 60 : -60);
        const slash = this.scene.add.sprite(slashX, this.y, 'slash');
        slash.setFlipX(!this.facingRight);
        slash.setScale(1.5);
        slash.setTint(COLORS.ENEMY_GLOW);
        slash.setBlendMode(Phaser.BlendModes.ADD);
        
        this.scene.tweens.add({
            targets: slash,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => slash.destroy()
        });
        
        // Clear hitbox after active frames
        this.scene.time.delayedCall(100, () => {
            this.hitbox = null;
        });
    }
    
    private updateAttack(delta: number, _player: Player): void {
        this.actionTimer -= delta;
        
        if (this.actionTimer <= 0) {
            this.attackTimer = this.attackCooldown;
            this.currentState = BossState.IDLE;
            this.actionTimer = 500;
        }
    }
    
    private startDash(player: Player): void {
        this.currentState = BossState.DASH;
        this.actionTimer = 400;
        
        // Dash toward player
        const direction = player.x > this.x ? 1 : -1;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x = BOSS.PHASE2_DASH_SPEED * direction;
        body.velocity.y = 0;
        
        // Create dash trail effect
        this.createDashTrail();
    }
    
    private createDashTrail(): void {
        const trail = this.scene.add.sprite(this.x, this.y, 'boss');
        trail.setAlpha(0.5);
        trail.setFlipX(!this.facingRight);
        trail.setTint(COLORS.ENEMY_GLOW);
        
        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            duration: 300,
            onComplete: () => trail.destroy()
        });
    }
    
    private updateDash(delta: number, _player: Player): void {
        this.actionTimer -= delta;
        
        // Create trail
        if (Math.random() > 0.5) {
            this.createDashTrail();
        }
        
        if (this.actionTimer <= 0) {
            this.attackTimer = this.attackCooldown;
            this.currentState = BossState.IDLE;
            this.actionTimer = 800;
            
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.velocity.x *= 0.3;
        }
    }
    
    private updateStunned(delta: number): void {
        this.actionTimer -= delta;
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x *= 0.95;
        
        if (this.actionTimer <= 0) {
            this.currentState = BossState.IDLE;
            this.actionTimer = 200;
        }
    }
    
    private updateHurt(delta: number): void {
        if (this.isHurt) {
            this.hurtTimer -= delta;
            if (this.hurtTimer <= 0) {
                this.isHurt = false;
                this.clearTint();
            }
        }
    }
    
    private facePlayer(playerX: number): void {
        this.facingRight = playerX > this.x;
        this.setFlipX(!this.facingRight);
    }
    
    private checkPlayerCollision(player: Player): void {
        // Body collision
        const bounds = this.getBounds();
        const playerBounds = player.getBounds();
        
        if (Phaser.Geom.Rectangle.Overlaps(bounds, playerBounds)) {
            player.takeDamage(this.damage, this.x);
        }
        
        // Attack hitbox collision
        if (this.hitbox && Phaser.Geom.Rectangle.Overlaps(this.hitbox, playerBounds)) {
            player.takeDamage(this.damage, this.x);
            this.hitbox = null;
        }
    }
    
    takeDamage(amount: number, sourceX: number): void {
        if (this.isHurt || !this.isAlive) return;
        
        this.health -= amount;
        this.isHurt = true;
        this.hurtTimer = this.hurtDuration;
        
        // Knockback (slight for boss)
        const direction = this.x < sourceX ? -1 : 1;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x = 100 * direction;
        
        // Visual feedback
        this.setTint(0xFFFFFF);
        
        // Create hit particles
        const particles = this.scene.add.particles(this.x, this.y, 'impact', {
            speed: { min: 50, max: 100 },
            scale: { start: 0.8, end: 0 },
            lifespan: 200,
            quantity: 8,
            tint: COLORS.ENEMY_GLOW
        });
        this.scene.time.delayedCall(200, () => particles.destroy());
        
        // Check phase transitions
        this.checkPhaseTransition();
        
        // Check for death
        if (this.health <= 0) {
            this.die();
        }
    }
    
    private checkPhaseTransition(): void {
        const healthPercent = this.health / this.maxHealth;
        
        if (healthPercent <= 0.66 && this.phase === BossPhase.PHASE_1) {
            this.transitionToPhase(BossPhase.PHASE_2);
        } else if (healthPercent <= 0.33 && this.phase === BossPhase.PHASE_2) {
            this.transitionToPhase(BossPhase.PHASE_3);
        }
    }
    
    private transitionToPhase(newPhase: BossPhase): void {
        this.phase = newPhase;
        this.currentState = BossState.TRANSITION;
        
        // Screen effect
        this.scene.cameras.main.flash(300, 255, 50, 50);
        this.scene.cameras.main.shake(300, 0.02);
        
        // Update stats based on phase
        switch (newPhase) {
            case BossPhase.PHASE_2:
                this.currentSpeed = BOSS.PHASE2_SPEED;
                this.attackCooldown = BOSS.PHASE2_ATTACK_COOLDOWN;
                break;
            case BossPhase.PHASE_3:
                this.currentSpeed = BOSS.PHASE3_SPEED;
                this.attackCooldown = BOSS.PHASE3_ATTACK_COOLDOWN;
                break;
        }
        
        // Roar/transition animation
        const roarText = this.scene.add.text(this.x, this.y - 80, '!!!', {
            fontSize: '36px',
            color: '#FF0000'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: roarText,
            alpha: 0,
            y: this.y - 120,
            duration: 500,
            onComplete: () => roarText.destroy()
        });
        
        // Brief invulnerability during transition
        this.scene.time.delayedCall(500, () => {
            this.currentState = BossState.IDLE;
            this.actionTimer = 500;
        });
    }
    
    private die(): void {
        this.isAlive = false;
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.set(0, 0);
        body.setAllowGravity(false);
        
        // Dramatic death effect
        this.scene.cameras.main.shake(1000, 0.02);
        
        // Multiple particle bursts
        for (let i = 0; i < 5; i++) {
            this.scene.time.delayedCall(i * 200, () => {
                const particles = this.scene.add.particles(
                    this.x + Phaser.Math.Between(-30, 30),
                    this.y + Phaser.Math.Between(-40, 40),
                    'dust',
                    {
                        speed: { min: 100, max: 250 },
                        angle: { min: 0, max: 360 },
                        scale: { start: 1.5, end: 0 },
                        lifespan: 800,
                        quantity: 20,
                        tint: [COLORS.ENEMY_BODY, COLORS.ENEMY_GLOW]
                    }
                );
                this.scene.time.delayedCall(800, () => particles.destroy());
            });
        }
        
        // Fade out
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 1.2,
            scaleY: 0.8,
            duration: 1000,
            onComplete: () => {
                this.emit('defeated');
                this.destroy();
            }
        });
    }
    
    getHealthPercent(): number {
        return this.health / this.maxHealth;
    }
    
    getCurrentPhase(): BossPhase {
        return this.phase;
    }
}
