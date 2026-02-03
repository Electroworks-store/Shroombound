/**
 * Player.ts - The Hero Controller
 * Simplified version with working movement, jump, and attack
 */

import * as Phaser from 'phaser';

// Player states
enum State {
    IDLE,
    RUN,
    JUMP,
    FALL,
    DASH,
    ATTACK
}

// Physics constants - tuned for Hollow Knight feel
const PHYSICS = {
    MOVE_SPEED: 280,
    ACCEL: 2000,
    DECEL: 2400,
    AIR_CONTROL: 0.85,
    JUMP_VELOCITY: -550,
    FALL_MULTIPLIER: 2.0,
    MAX_FALL: 900,
    COYOTE_MS: 100,
    JUMP_BUFFER_MS: 150,
    DASH_SPEED: 900,
    DASH_DURATION_MS: 240,
    DASH_COOLDOWN_MS: 500,
    WIDTH: 48,
    HEIGHT: 64
} as const;

export class Player extends Phaser.Physics.Arcade.Sprite {
    private currentState: State = State.IDLE;
    private facing: 1 | -1 = 1;
    
    // Ground detection
    private grounded = false;
    private coyoteTimer = 0;
    private jumpBufferTimer = 0;
    
    // Dash state
    private canDash = true;
    private dashTimer = 0;
    private dashVelocityY = 0;
    
    // Health system
    private health: number = 5;
    private maxHealth: number = 5;
    private invincible: boolean = false;
    private spawnX: number;
    private spawnY: number;
    
    // Input keys
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyA!: Phaser.Input.Keyboard.Key;
    private keyD!: Phaser.Input.Keyboard.Key;
    private keyW!: Phaser.Input.Keyboard.Key;
    private keySpace!: Phaser.Input.Keyboard.Key;
    private keyShift!: Phaser.Input.Keyboard.Key;
    private keyJ!: Phaser.Input.Keyboard.Key;
    
    // Attack state
    private canAttack: boolean = true;
    private attackCooldown: number = 300;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player', 0);
        
        // Store spawn point for respawn
        this.spawnX = x;
        this.spawnY = y;
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Physics body setup
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(PHYSICS.WIDTH * 0.5, PHYSICS.HEIGHT * 0.85);
        body.setOffset(PHYSICS.WIDTH * 0.25, PHYSICS.HEIGHT * 0.15);
            // Allow falling out of the world so death pits can trigger
            body.setCollideWorldBounds(false);
        body.setMaxVelocity(PHYSICS.MOVE_SPEED, PHYSICS.MAX_FALL);
        
        // Setup input
        this.setupInput();
    }

    private setupInput(): void {
        const kb = this.scene.input.keyboard;
        if (!kb) return;
        
        this.cursors = kb.createCursorKeys();
        this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyShift = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.keyJ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    }

    update(_time: number, delta: number): void {
        if (!this.body) return;
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // Update ground state
        const wasGrounded = this.grounded;
        this.grounded = body.blocked.down || body.onFloor();
        
        // Reset coyote time when landing
        if (this.grounded && !wasGrounded) {
            this.coyoteTimer = PHYSICS.COYOTE_MS;
            this.canDash = true;
        }
        
        // Start coyote time when leaving ground
        if (!this.grounded && wasGrounded && this.currentState !== State.JUMP) {
            this.coyoteTimer = PHYSICS.COYOTE_MS;
        }
        
        // Update timers
        if (this.coyoteTimer > 0) this.coyoteTimer -= delta;
        if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= delta;
        if (this.dashTimer > 0) this.dashTimer -= delta;
        
        // Handle dash state
        if (this.currentState === State.DASH) {
            this.updateDash(body);
            return;
        }
        
        // Handle horizontal movement
        this.handleMovement(body, delta);
        
        // Handle jump input
        this.handleJump(body);
        
        // Handle dash input
        this.handleDashInput(body);
        
        // Handle attack input
        this.handleAttack();
        
        // Apply extra fall gravity for weighty feel
        if (body.velocity.y > 0) {
            body.velocity.y += PHYSICS.FALL_MULTIPLIER * delta * 0.5;
        }
        
        // Update state based on velocity
        this.updateState(body);
        
        // Update animation
        this.updateAnimation();
    }

    private handleMovement(body: Phaser.Physics.Arcade.Body, delta: number): void {
        // Get input direction
        const leftPressed = this.keyA.isDown || this.cursors.left.isDown;
        const rightPressed = this.keyD.isDown || this.cursors.right.isDown;
        
        let inputX = 0;
        if (leftPressed) inputX = -1;
        if (rightPressed) inputX = 1;
        
        // Apply movement
        if (inputX !== 0) {
            this.facing = inputX as 1 | -1;
            this.setFlipX(inputX < 0);
            
            const accel = this.grounded ? PHYSICS.ACCEL : PHYSICS.ACCEL * PHYSICS.AIR_CONTROL;
            const targetVelocity = inputX * PHYSICS.MOVE_SPEED;
            
            // Accelerate toward target velocity
            if (body.velocity.x < targetVelocity) {
                body.velocity.x = Math.min(body.velocity.x + accel * delta / 1000, targetVelocity);
            } else if (body.velocity.x > targetVelocity) {
                body.velocity.x = Math.max(body.velocity.x - accel * delta / 1000, targetVelocity);
            }
        } else {
            // Decelerate when no input
            const decel = PHYSICS.DECEL * delta / 1000;
            if (body.velocity.x > 0) {
                body.velocity.x = Math.max(0, body.velocity.x - decel);
            } else if (body.velocity.x < 0) {
                body.velocity.x = Math.min(0, body.velocity.x + decel);
            }
        }
    }

    private handleJump(body: Phaser.Physics.Arcade.Body): void {
        // Buffer jump input (Space, W, or Up arrow)
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keySpace) || 
                           Phaser.Input.Keyboard.JustDown(this.keyW) ||
                           Phaser.Input.Keyboard.JustDown(this.cursors.up);
        if (jumpPressed) {
            this.jumpBufferTimer = PHYSICS.JUMP_BUFFER_MS;
        }
        
        // Can jump if grounded or within coyote time
        const canJump = this.grounded || this.coyoteTimer > 0;
        
        if (this.jumpBufferTimer > 0 && canJump) {
            body.velocity.y = PHYSICS.JUMP_VELOCITY;
            this.currentState = State.JUMP;
            this.coyoteTimer = 0;
            this.jumpBufferTimer = 0;
        }
        
        // Variable jump height - release to cut jump short
        // Check all jump keys for held state
        const jumpHeld = this.keySpace.isDown || this.keyW.isDown || this.cursors.up.isDown;
        if (this.currentState === State.JUMP && !jumpHeld && body.velocity.y < -100) {
            body.velocity.y *= 0.5;
        }
    }

    private handleDashInput(body: Phaser.Physics.Arcade.Body): void {
        if (Phaser.Input.Keyboard.JustDown(this.keyShift) && this.canDash) {
            this.currentState = State.DASH;
            this.dashTimer = PHYSICS.DASH_DURATION_MS;
            this.canDash = false;
            
            // Set dash velocity
            body.velocity.x = PHYSICS.DASH_SPEED * this.facing;
            this.dashVelocityY = this.grounded ? 0 : body.velocity.y;
            body.velocity.y = this.dashVelocityY;
            body.setAllowGravity(false);
            
            // Dash cooldown
            this.scene.time.delayedCall(PHYSICS.DASH_COOLDOWN_MS, () => {
                this.canDash = true;
            });
        }
    }
    
    private handleAttack(): void {
        if (Phaser.Input.Keyboard.JustDown(this.keyJ) && this.canAttack) {
            this.canAttack = false;
            
            // Create attack hitbox
            const hitboxWidth = 70;
            const hitboxHeight = 50;
            const offsetX = this.facing > 0 ? 20 : -20 - hitboxWidth;
            
            const hitbox = new Phaser.Geom.Rectangle(
                this.x + offsetX,
                this.y - hitboxHeight / 2,
                hitboxWidth,
                hitboxHeight
            );
            
            // Emit attack event for enemy collision
            this.scene.events.emit('player-attack', hitbox);
            
            // Show slash effect
            this.showSlashEffect();
            
            // Attack cooldown
            this.scene.time.delayedCall(this.attackCooldown, () => {
                this.canAttack = true;
            });
        }
    }
    
    private showSlashEffect(): void {
        const offsetX = this.facing > 0 ? 50 : -50;
        const slash = this.scene.add.sprite(this.x + offsetX, this.y, 'slash');
        slash.setFlipX(this.facing < 0);
        slash.setTint(0x00FFFF);
        slash.setBlendMode(Phaser.BlendModes.ADD);
        slash.setScale(1.2);
        
        this.scene.tweens.add({
            targets: slash,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 150,
            onComplete: () => slash.destroy()
        });
    }

    private updateDash(body: Phaser.Physics.Arcade.Body): void {
        // Maintain dash velocity
        body.velocity.x = PHYSICS.DASH_SPEED * this.facing;
        body.velocity.y = this.dashVelocityY;
        
        // Create dash trail effect
        this.createDashTrail();
        
        // End dash
        if (this.dashTimer <= 0) {
            body.setAllowGravity(true);
            body.velocity.x *= 0.5;
            this.currentState = this.grounded ? State.IDLE : State.FALL;
        }
    }
    
    private createDashTrail(): void {
        // Create afterimage
        const trail = this.scene.add.sprite(this.x, this.y, 'player');
        trail.setAlpha(0.5);
        trail.setTint(0x00FFFF);
        trail.setFlipX(this.facing < 0);
        trail.setBlendMode(Phaser.BlendModes.ADD);
        
        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 1.2,
            duration: 150,
            onComplete: () => trail.destroy()
        });
    }

    private updateState(body: Phaser.Physics.Arcade.Body): void {
        if (this.currentState === State.DASH) return;
        
        if (this.grounded) {
            if (Math.abs(body.velocity.x) > 20) {
                this.currentState = State.RUN;
            } else {
                this.currentState = State.IDLE;
            }
        } else {
            if (body.velocity.y < 0) {
                this.currentState = State.JUMP;
            } else {
                this.currentState = State.FALL;
            }
        }
    }

    private updateAnimation(): void {
        let animKey = 'player-idle';
        
        switch (this.currentState) {
            case State.IDLE: animKey = 'player-idle'; break;
            case State.RUN: animKey = 'player-run'; break;
            case State.JUMP: animKey = 'player-jump'; break;
            case State.FALL: animKey = 'player-fall'; break;
            case State.DASH: animKey = 'player-dash'; break;
        }
        
        if (this.anims.currentAnim?.key !== animKey) {
            this.play(animKey, true);
        }
    }

    // Public method for taking damage
    takeDamage(amount: number, sourceX: number): void {
        if (this.invincible) return;
        
        this.health -= amount;
        this.invincible = true;
        
        const knockbackDir = this.x < sourceX ? -1 : 1;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x = 200 * knockbackDir;
        body.velocity.y = -150;
        
        // Flash effect
        this.setTint(0xff0000);
        
        // Emit damage event for UI
        this.scene.events.emit('player-damaged', this.health, this.maxHealth);
        
        // Check for death
        if (this.health <= 0) {
            this.die();
            return;
        }
        
        // Invincibility period with flashing
        let flashCount = 0;
        const flashInterval = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                flashCount++;
                if (flashCount % 2 === 0) {
                    this.setAlpha(1);
                    this.clearTint();
                } else {
                    this.setAlpha(0.5);
                    this.setTint(0xff0000);
                }
            },
            repeat: 9
        });
        
        this.scene.time.delayedCall(1000, () => {
            this.invincible = false;
            this.setAlpha(1);
            this.clearTint();
            flashInterval.destroy();
        });
    }
    
    // Called when falling into pit
    fallDeath(): void {
        this.health -= 1;
        this.scene.events.emit('player-damaged', this.health, this.maxHealth);
        
        if (this.health <= 0) {
            this.die();
        } else {
            this.respawn();
        }
    }
    
    private respawn(): void {
        // Reset position to spawn point
        this.setPosition(this.spawnX, this.spawnY);
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.set(0, 0);
        
        // Brief invincibility
        this.invincible = true;
        this.setAlpha(0.5);
        
        this.scene.time.delayedCall(500, () => {
            this.invincible = false;
            this.setAlpha(1);
        });
        
        // Camera flash
        this.scene.cameras.main.flash(200, 255, 0, 0);
    }
    
    private die(): void {
        this.scene.events.emit('player-died');
        
        // Reset health and respawn
        this.health = this.maxHealth;
        this.respawn();
        
        // Emit health update
        this.scene.events.emit('player-damaged', this.health, this.maxHealth);
    }

    // Getters
    getHealth(): number { return this.health; }
    getMaxHealth(): number { return this.maxHealth; }
    
    // Check if player fell into death pit
    checkDeathPit(deathY: number): void {
        if (this.y > deathY) {
            this.fallDeath();
        }
    }
}
