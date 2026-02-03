/**
 * Debug utilities for development
 */

import * as Phaser from 'phaser';

export class Debug {
    private scene: Phaser.Scene;
    private graphics: Phaser.GameObjects.Graphics;
    private debugText: Phaser.GameObjects.Text;
    private enabled: boolean = false;
    
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(1000);
        
        this.debugText = scene.add.text(10, 10, '', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#00FF00',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 5, y: 5 }
        }).setScrollFactor(0).setDepth(1000);
        
        // Toggle debug with backtick key
        scene.input.keyboard?.on('keydown-BACKQUOTE', () => {
            this.toggle();
        });
    }
    
    toggle(): void {
        this.enabled = !this.enabled;
        this.graphics.setVisible(this.enabled);
        this.debugText.setVisible(this.enabled);
        
        // Toggle Phaser arcade physics debug
        this.scene.physics.world.drawDebug = this.enabled;
        if (!this.enabled) {
            this.scene.physics.world.debugGraphic?.clear();
        }
    }
    
    update(data: { [key: string]: string | number | boolean }): void {
        if (!this.enabled) return;
        
        // Update debug text
        const lines = Object.entries(data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        
        this.debugText.setText(lines);
    }
    
    drawRect(x: number, y: number, width: number, height: number, color: number = 0xFF0000): void {
        if (!this.enabled) return;
        
        this.graphics.lineStyle(2, color, 1);
        this.graphics.strokeRect(x, y, width, height);
    }
    
    drawCircle(x: number, y: number, radius: number, color: number = 0xFF0000): void {
        if (!this.enabled) return;
        
        this.graphics.lineStyle(2, color, 1);
        this.graphics.strokeCircle(x, y, radius);
    }
    
    drawLine(x1: number, y1: number, x2: number, y2: number, color: number = 0xFF0000): void {
        if (!this.enabled) return;
        
        this.graphics.lineStyle(2, color, 1);
        this.graphics.lineBetween(x1, y1, x2, y2);
    }
    
    drawPoint(x: number, y: number, color: number = 0xFF0000): void {
        if (!this.enabled) return;
        
        this.graphics.fillStyle(color, 1);
        this.graphics.fillCircle(x, y, 4);
    }
    
    clear(): void {
        this.graphics.clear();
    }
    
    log(message: string, ...args: unknown[]): void {
        if (this.enabled) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }
    
    isEnabled(): boolean {
        return this.enabled;
    }
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
    private fpsText: Phaser.GameObjects.Text;
    private updateCount: number = 0;
    private lastTime: number = 0;
    private fps: number = 0;
    
    constructor(scene: Phaser.Scene) {
        this.fpsText = scene.add.text(scene.cameras.main.width - 10, 10, '', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#FFFF00',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 5, y: 2 }
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);
    }
    
    update(time: number): void {
        this.updateCount++;
        
        if (time - this.lastTime >= 1000) {
            this.fps = this.updateCount;
            this.updateCount = 0;
            this.lastTime = time;
            
            const color = this.fps >= 55 ? '#00FF00' : this.fps >= 30 ? '#FFFF00' : '#FF0000';
            this.fpsText.setText(`FPS: ${this.fps}`);
            this.fpsText.setColor(color);
        }
    }
    
    getFPS(): number {
        return this.fps;
    }
}
