/**
 * Flyer Enemy
 * Flying enemy that hovers and swoops at player
 */

import * as Phaser from 'phaser';
import { FLYER } from '../config';
import { Enemy } from './Enemy';
import { Player } from '@/entities/Player';

enum FlyerState {
    HOVER,
    TRACK,
    SWOOP,
    RETREAT
}

export class Flyer extends Enemy {
    private currentState: FlyerState = FlyerState.HOVER;
    private hoverOffset: number = 0;
    private hoverBaseY: number;
    private swoopTarget: { x: number; y: number } | null = null;
    private retreatTimer: number = 0;
    private retreatDuration: number = 1500;
    private trackTimer: number = 0;
    private trackDuration: number = 500;
    
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'flyer', {
            health: FLYER.HEALTH,
            damage: FLYER.DAMAGE,
            speed: FLYER.SPEED
        });
        
        this.hoverBaseY = y;
        
        // Configure physics - no gravity for flyers
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        
        this.setSize(FLYER.WIDTH * 0.7, FLYER.HEIGHT * 0.7);
        this.setOffset(FLYER.WIDTH * 0.15, FLYER.HEIGHT * 0.15);
        
        // Play animation
        this.play('flyer-hover');
    }
    
    update(_time: number, delta: number, player: Phaser.Physics.Arcade.Sprite): void {
        if (!this.isAlive) return;
        
        this.updateHurt(delta);
        
        if (this.isHurt) return;
        
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        
        // State machine
        switch (this.currentState) {
            case FlyerState.HOVER:
                this.updateHover(_time, delta, distanceToPlayer, player);
                break;
            case FlyerState.TRACK:
                this.updateTrack(delta, player);
                break;
            case FlyerState.SWOOP:
                this.updateSwoop(delta, player);
                break;
            case FlyerState.RETREAT:
                this.updateRetreat(delta);
                break;
        }
        
        // Always face player
        this.facePlayer(player.x);
        
        // Check for collision with player
        this.checkPlayerCollision(player);
    }
    
    private updateHover(_time: number, delta: number, distanceToPlayer: number, _player: Phaser.Physics.Arcade.Sprite): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // Sinusoidal hover movement
        this.hoverOffset += delta * FLYER.HOVER_SPEED * 0.001;
        const targetY = this.hoverBaseY + Math.sin(this.hoverOffset) * FLYER.HOVER_AMPLITUDE;
        
        body.velocity.y = (targetY - this.y) * 3;
        body.velocity.x = 0;
        
        // Detect player and start tracking
        if (distanceToPlayer < FLYER.DETECTION_RANGE) {
            this.currentState = FlyerState.TRACK;
            this.trackTimer = this.trackDuration;
        }
    }
    
    private updateTrack(delta: number, player: Phaser.Physics.Arcade.Sprite): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        this.trackTimer -= delta;
        
        // Move toward position above player
        const targetX = player.x;
        const targetY = player.y - 150;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            body.velocity.x = (dx / distance) * this.speed;
            body.velocity.y = (dy / distance) * this.speed;
        }
        
        // Start swoop when tracked enough or in position
        if (this.trackTimer <= 0 || distance < 50) {
            this.startSwoop(player);
        }
    }
    
    private startSwoop(player: Phaser.Physics.Arcade.Sprite): void {
        this.currentState = FlyerState.SWOOP;
        this.swoopTarget = { x: player.x, y: player.y };
    }
    
    private updateSwoop(_delta: number, _player: Phaser.Physics.Arcade.Sprite): void {
        if (!this.swoopTarget) {
            this.currentState = FlyerState.RETREAT;
            this.retreatTimer = this.retreatDuration;
            return;
        }
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // Dive toward target
        const dx = this.swoopTarget.x - this.x;
        const dy = this.swoopTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 20) {
            body.velocity.x = (dx / distance) * FLYER.SWOOP_SPEED;
            body.velocity.y = (dy / distance) * FLYER.SWOOP_SPEED;
        } else {
            // Reached target, retreat
            this.currentState = FlyerState.RETREAT;
            this.retreatTimer = this.retreatDuration;
            this.swoopTarget = null;
            return;
        }
        
        // Also retreat if passed through target area
        if (this.swoopTarget && this.y > this.swoopTarget.y + 50) {
            this.currentState = FlyerState.RETREAT;
            this.retreatTimer = this.retreatDuration;
            this.swoopTarget = null;
        }
    }
    
    private updateRetreat(delta: number): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        this.retreatTimer -= delta;
        
        // Move back up to hover height
        const targetY = this.hoverBaseY;
        const dy = targetY - this.y;
        
        body.velocity.y = Math.sign(dy) * this.speed;
        body.velocity.x = 0;
        
        // Return to hover state
        if (this.retreatTimer <= 0 || Math.abs(dy) < 20) {
            this.currentState = FlyerState.HOVER;
            this.hoverOffset = 0;
        }
    }
    
    private checkPlayerCollision(player: Phaser.Physics.Arcade.Sprite): void {
        const playerSprite = player as Player;
        const bounds = this.getBounds();
        const playerBounds = player.getBounds();
        
        if (Phaser.Geom.Rectangle.Overlaps(bounds, playerBounds)) {
            playerSprite.takeDamage(this.damage, this.x);
            
            // If swooping, retreat after hit
            if (this.state === FlyerState.SWOOP) {
                this.state = FlyerState.RETREAT;
                this.retreatTimer = this.retreatDuration;
            }
        }
    }
    
    takeDamage(amount: number, sourceX: number): void {
        super.takeDamage(amount, sourceX);
        
        // Retreat when hit
        if (this.isAlive) {
            this.state = FlyerState.RETREAT;
            this.retreatTimer = this.retreatDuration;
        }
    }
}
