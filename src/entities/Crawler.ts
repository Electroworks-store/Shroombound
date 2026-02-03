/**
 * Crawler Enemy
 * Ground-based enemy that walks and charges at player
 */

import * as Phaser from 'phaser';
import { CRAWLER } from '../config';
import { Enemy } from './Enemy';
import { Player } from '@/entities/Player';

enum CrawlerState {
    IDLE,
    PATROL,
    CHASE,
    ATTACK
}

export class Crawler extends Enemy {
    private currentState: CrawlerState = CrawlerState.PATROL;
    private patrolDirection: number = 1;
    private patrolTimer: number = 0;
    private patrolDuration: number = 2000;
    private idleTimer: number = 0;
    private idleDuration: number = 1000;
    private chargeSpeed: number = CRAWLER.SPEED * 2;
    private detectionRange: number = CRAWLER.DETECTION_RANGE;
    private attackRange: number = CRAWLER.ATTACK_RANGE;
    
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'crawler', {
            health: CRAWLER.HEALTH,
            damage: CRAWLER.DAMAGE,
            speed: CRAWLER.SPEED
        });
        
        // Configure physics
        this.setSize(CRAWLER.WIDTH * 0.8, CRAWLER.HEIGHT * 0.8);
        this.setOffset(CRAWLER.WIDTH * 0.1, CRAWLER.HEIGHT * 0.2);
        
        // Start patrol
        this.patrolTimer = this.patrolDuration;
        
        // Play animation
        this.play('crawler-walk');
    }
    
    update(_time: number, delta: number, player: Phaser.Physics.Arcade.Sprite): void {
        if (!this.isAlive) return;
        
        this.updateHurt(delta);
        
        if (this.isHurt) return;
        
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const playerVisible = this.canSeePlayer(player);
        
        // State machine
        switch (this.currentState) {
            case CrawlerState.IDLE:
                this.updateIdle(delta, distanceToPlayer, playerVisible);
                break;
            case CrawlerState.PATROL:
                this.updatePatrol(delta, distanceToPlayer, playerVisible);
                break;
            case CrawlerState.CHASE:
                this.updateChase(delta, player, distanceToPlayer);
                break;
            case CrawlerState.ATTACK:
                this.updateAttack(delta, player);
                break;
        }
        
        // Check for collision with player
        this.checkPlayerCollision(player);
    }
    
    private updateIdle(delta: number, distanceToPlayer: number, playerVisible: boolean): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x = 0;
        
        this.idleTimer -= delta;
        
        // Check for player detection
        if (playerVisible && distanceToPlayer < this.detectionRange) {
            this.currentState = CrawlerState.CHASE;
            return;
        }
        
        // Resume patrol
        if (this.idleTimer <= 0) {
            this.patrolDirection *= -1;
            this.patrolTimer = this.patrolDuration;
            this.currentState = CrawlerState.PATROL;
        }
    }
    
    private updatePatrol(delta: number, distanceToPlayer: number, playerVisible: boolean): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // Move in patrol direction
        body.velocity.x = this.speed * this.patrolDirection;
        this.setFlipX(this.patrolDirection < 0);
        
        this.patrolTimer -= delta;
        
        // Check for player detection
        if (playerVisible && distanceToPlayer < this.detectionRange) {
            this.currentState = CrawlerState.CHASE;
            return;
        }
        
        // Check for wall or edge
        if (body.blocked.left || body.blocked.right) {
            this.patrolDirection *= -1;
            this.patrolTimer = this.patrolDuration;
        }
        
        // Switch to idle
        if (this.patrolTimer <= 0) {
            this.idleTimer = this.idleDuration;
            this.currentState = CrawlerState.IDLE;
        }
    }
    
    private updateChase(_delta: number, player: Phaser.Physics.Arcade.Sprite, distanceToPlayer: number): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // Face and move toward player
        this.facePlayer(player.x);
        const direction = player.x > this.x ? 1 : -1;
        body.velocity.x = this.chargeSpeed * direction;
        
        // Attack if close enough
        if (distanceToPlayer < this.attackRange) {
            this.currentState = CrawlerState.ATTACK;
            return;
        }
        
        // Lose interest if too far
        if (distanceToPlayer > this.detectionRange * 1.5) {
            this.currentState = CrawlerState.PATROL;
            this.patrolTimer = this.patrolDuration;
        }
    }
    
    private updateAttack(_delta: number, player: Phaser.Physics.Arcade.Sprite): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // Lunge attack
        const direction = player.x > this.x ? 1 : -1;
        body.velocity.x = this.chargeSpeed * 1.5 * direction;
        
        // Return to chase after attack
        this.scene.time.delayedCall(200, () => {
            if (this.isAlive) {
                this.currentState = CrawlerState.CHASE;
            }
        });
    }
    
    private canSeePlayer(player: Phaser.Physics.Arcade.Sprite): boolean {
        // Simple line-of-sight check
        // For MVP, just check horizontal distance and if roughly on same platform
        const heightDiff = Math.abs(this.y - player.y);
        return heightDiff < 100;
    }
    
    private checkPlayerCollision(player: Phaser.Physics.Arcade.Sprite): void {
        const playerSprite = player as Player;
        const bounds = this.getBounds();
        const playerBounds = player.getBounds();
        
        if (Phaser.Geom.Rectangle.Overlaps(bounds, playerBounds)) {
            playerSprite.takeDamage(this.damage, this.x);
        }
    }
}
