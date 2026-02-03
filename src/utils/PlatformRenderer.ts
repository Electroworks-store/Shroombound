import Phaser from 'phaser';

export type PlatformStyle = 'concrete' | 'steel' | 'crate' | 'rusted' | 'overgrown-concrete' | 'overgrown-steel' | 'brick' | 'industrial';

export interface PlatformRenderOptions {
    x: number;
    y: number;
    width: number;
    height: number;
    style: PlatformStyle;
    depth?: number;
    overgrowth?: 'none' | 'light' | 'heavy';
    damage?: 'none' | 'cracked' | 'broken';
    hasMoss?: boolean;
    hasRust?: boolean;
    hasDrips?: boolean;
}

interface ColorPalette {
    base: number;
    light: number;
    dark: number;
    accent: number;
    edge: number;
}

const PALETTES: Record<string, ColorPalette> = {
    concrete: {
        base: 0x3f4b52,
        light: 0x5a6a73,
        dark: 0x2a3338,
        accent: 0x4d5c64,
        edge: 0x1b2428
    },
    steel: {
        base: 0x505a65,
        light: 0x6a7580,
        dark: 0x3a4550,
        accent: 0x7a8590,
        edge: 0x2a3540
    },
    crate: {
        base: 0x8b6914,
        light: 0xa57d28,
        dark: 0x6b4f0e,
        accent: 0xc4993d,
        edge: 0x4a3508
    },
    rusted: {
        base: 0x6b4423,
        light: 0x8b5a33,
        dark: 0x4b3018,
        accent: 0xa06a40,
        edge: 0x3a2510
    },
    brick: {
        base: 0x7a3b2e,
        light: 0x9a4b3e,
        dark: 0x5a2b1e,
        accent: 0x6a332a,
        edge: 0x4a1b10
    },
    moss: {
        base: 0x2f6b5a,
        light: 0x4f8f7a,
        dark: 0x214b3f,
        accent: 0x5fa88e,
        edge: 0x16352c
    },
    industrial: {
        base: 0x3a4550,
        light: 0x4a5560,
        dark: 0x2a3540,
        accent: 0xd4aa00,
        edge: 0x1a2530
    }
};

export class PlatformRenderer {
    private scene: Phaser.Scene;
    private graphics: Phaser.GameObjects.Graphics;
    
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(5);
    }
    
    public renderPlatform(options: PlatformRenderOptions): Phaser.GameObjects.Graphics {
        const g = this.scene.add.graphics();
        g.setDepth(options.depth ?? 5);
        
        switch (options.style) {
            case 'concrete':
                this.drawConcrete(g, options);
                break;
            case 'steel':
                this.drawSteel(g, options);
                break;
            case 'crate':
                this.drawCrate(g, options);
                break;
            case 'rusted':
                this.drawRusted(g, options);
                break;
            case 'overgrown-concrete':
                this.drawConcrete(g, options);
                this.addOvergrowth(g, options, 'heavy');
                break;
            case 'overgrown-steel':
                this.drawSteel(g, options);
                this.addOvergrowth(g, options, 'light');
                break;
            case 'brick':
                this.drawBrick(g, options);
                break;
            case 'industrial':
                this.drawIndustrial(g, options);
                break;
        }
        
        // Add optional effects
        if (options.overgrowth && options.overgrowth !== 'none') {
            this.addOvergrowth(g, options, options.overgrowth);
        }
        
        if (options.damage && options.damage !== 'none') {
            this.addDamage(g, options);
        }
        
        if (options.hasMoss) {
            this.addMoss(g, options);
        }
        
        if (options.hasRust) {
            this.addRustPatches(g, options);
        }
        
        if (options.hasDrips) {
            this.addDrips(g, options);
        }
        
        return g;
    }
    
    private drawConcrete(g: Phaser.GameObjects.Graphics, opts: PlatformRenderOptions): void {
        const { x, y, width, height } = opts;
        const pal = PALETTES.concrete;
        
        // Base fill with slight gradient effect via layers
        g.fillStyle(pal.dark, 1);
        g.fillRect(x, y, width, height);
        
        g.fillStyle(pal.base, 1);
        g.fillRect(x + 2, y + 2, width - 4, height - 6);
        
        // Top highlight edge
        g.fillStyle(pal.light, 1);
        g.fillRect(x + 2, y + 2, width - 4, 4);
        
        // Concrete panels/sections
        const panelWidth = 60 + Math.random() * 20;
        let px = x + 4;
        while (px < x + width - 10) {
            const pw = Math.min(panelWidth + (Math.random() - 0.5) * 20, x + width - px - 6);
            
            // Panel line
            g.lineStyle(1, pal.dark, 0.7);
            g.lineBetween(px + pw, y + 6, px + pw, y + height - 4);
            
            // Random texture spots
            for (let i = 0; i < 3; i++) {
                const sx = px + Math.random() * pw;
                const sy = y + 8 + Math.random() * (height - 16);
                const size = 2 + Math.random() * 4;
                g.fillStyle(Math.random() > 0.5 ? pal.dark : pal.light, 0.3);
                g.fillCircle(sx, sy, size);
            }
            
            px += pw + 2;
        }
        
        // Edge shadows
        g.fillStyle(0x000000, 0.2);
        g.fillRect(x, y + height - 4, width, 4);
        g.fillRect(x + width - 3, y, 3, height);
        
        // Top edge detail
        g.lineStyle(2, pal.edge, 1);
        g.lineBetween(x, y, x + width, y);
        
        // Random aggregate spots (gravel in concrete)
        for (let i = 0; i < width / 20; i++) {
            const ax = x + 5 + Math.random() * (width - 10);
            const ay = y + 10 + Math.random() * (height - 20);
            g.fillStyle(0x6a7a82, 0.5);
            g.fillCircle(ax, ay, 1 + Math.random());
        }
    }
    
    private drawSteel(g: Phaser.GameObjects.Graphics, opts: PlatformRenderOptions): void {
        const { x, y, width, height } = opts;
        const pal = PALETTES.steel;
        
        // Base
        g.fillStyle(pal.dark, 1);
        g.fillRect(x, y, width, height);
        
        // Main body
        g.fillStyle(pal.base, 1);
        g.fillRect(x + 2, y + 2, width - 4, height - 4);
        
        // Metallic sheen (horizontal gradient simulation)
        g.fillStyle(pal.light, 0.3);
        g.fillRect(x + 2, y + 2, width - 4, height / 3);
        
        // Rivet lines
        const rivetSpacing = 50;
        g.fillStyle(pal.dark, 0.8);
        for (let rx = x + 20; rx < x + width - 20; rx += rivetSpacing) {
            // Top rivet
            g.fillCircle(rx, y + 6, 3);
            g.fillStyle(pal.light, 0.5);
            g.fillCircle(rx - 1, y + 5, 1);
            g.fillStyle(pal.dark, 0.8);
            
            // Bottom rivet if tall enough
            if (height > 30) {
                g.fillCircle(rx, y + height - 6, 3);
                g.fillStyle(pal.light, 0.5);
                g.fillCircle(rx - 1, y + height - 7, 1);
                g.fillStyle(pal.dark, 0.8);
            }
        }
        
        // Seam lines (welded joints)
        g.lineStyle(2, pal.dark, 0.5);
        const seamSpacing = 100;
        for (let sx = x + seamSpacing; sx < x + width - 20; sx += seamSpacing) {
            g.lineBetween(sx, y + 10, sx, y + height - 10);
            // Weld bumps
            g.fillStyle(pal.accent, 0.3);
            for (let wy = y + 15; wy < y + height - 15; wy += 8) {
                g.fillCircle(sx, wy, 2);
            }
        }
        
        // Diamond plate pattern for walkable surfaces
        if (height <= 25) {
            this.addDiamondPlate(g, x, y, width, height, pal);
        }
        
        // Edge highlight and shadow
        g.lineStyle(1, pal.light, 0.5);
        g.lineBetween(x + 2, y + 2, x + width - 2, y + 2);
        g.lineStyle(2, pal.edge, 1);
        g.lineBetween(x, y + height, x + width, y + height);
    }
    
    private addDiamondPlate(g: Phaser.GameObjects.Graphics, x: number, y: number, 
                            width: number, height: number, pal: ColorPalette): void {
        const spacing = 12;
        g.lineStyle(1, pal.light, 0.2);
        
        for (let dx = x + 6; dx < x + width - 6; dx += spacing) {
            for (let dy = y + 4; dy < y + height - 4; dy += spacing / 2) {
                const offset = ((dy - y) / (spacing / 2)) % 2 === 0 ? 0 : spacing / 2;
                g.fillStyle(pal.light, 0.15);
                g.fillRect(dx + offset - 2, dy - 1, 4, 2);
                g.fillRect(dx + offset - 1, dy - 2, 2, 4);
            }
        }
    }
    
    private drawCrate(g: Phaser.GameObjects.Graphics, opts: PlatformRenderOptions): void {
        const { x, y, width, height } = opts;
        const pal = PALETTES.crate;
        
        // Wooden base
        g.fillStyle(pal.dark, 1);
        g.fillRect(x, y, width, height);
        
        g.fillStyle(pal.base, 1);
        g.fillRect(x + 3, y + 3, width - 6, height - 6);
        
        // Wood plank lines
        const plankHeight = 12 + Math.random() * 6;
        let py = y + 3;
        while (py < y + height - 6) {
            g.lineStyle(1, pal.dark, 0.6);
            g.lineBetween(x + 3, py, x + width - 3, py);
            
            // Wood grain within plank
            const grainY = py + plankHeight / 2;
            g.lineStyle(1, pal.light, 0.2);
            for (let gx = x + 10; gx < x + width - 10; gx += 20 + Math.random() * 15) {
                const grainLen = 10 + Math.random() * 20;
                g.lineBetween(gx, grainY - 2, gx + grainLen, grainY + (Math.random() - 0.5) * 4);
            }
            
            py += plankHeight;
        }
        
        // Corner metal brackets
        const bracketSize = Math.min(20, width / 4, height / 4);
        this.drawCornerBracket(g, x, y, bracketSize, 'tl');
        this.drawCornerBracket(g, x + width, y, bracketSize, 'tr');
        this.drawCornerBracket(g, x, y + height, bracketSize, 'bl');
        this.drawCornerBracket(g, x + width, y + height, bracketSize, 'br');
        
        // Nail heads
        g.fillStyle(0x333333, 0.8);
        const nailPositions = [
            { nx: x + 15, ny: y + 10 },
            { nx: x + width - 15, ny: y + 10 },
            { nx: x + 15, ny: y + height - 10 },
            { nx: x + width - 15, ny: y + height - 10 }
        ];
        nailPositions.forEach(n => {
            g.fillCircle(n.nx, n.ny, 2);
        });
        
        // Stenciled text/marking (abstract)
        if (width > 60 && height > 40) {
            g.fillStyle(0x222222, 0.3);
            const textX = x + width / 2 - 15;
            const textY = y + height / 2 - 5;
            g.fillRect(textX, textY, 30, 3);
            g.fillRect(textX, textY + 6, 20, 3);
        }
    }
    
    private drawCornerBracket(g: Phaser.GameObjects.Graphics, x: number, y: number, 
                               size: number, corner: 'tl' | 'tr' | 'bl' | 'br'): void {
        const pal = PALETTES.steel;
        g.fillStyle(pal.base, 1);
        g.lineStyle(1, pal.dark, 1);
        
        const path: { x: number; y: number }[] = [];
        
        switch (corner) {
            case 'tl':
                path.push({ x: x, y: y }, { x: x + size, y: y }, 
                          { x: x + size, y: y + 5 }, { x: x + 5, y: y + 5 },
                          { x: x + 5, y: y + size }, { x: x, y: y + size });
                break;
            case 'tr':
                path.push({ x: x, y: y }, { x: x - size, y: y }, 
                          { x: x - size, y: y + 5 }, { x: x - 5, y: y + 5 },
                          { x: x - 5, y: y + size }, { x: x, y: y + size });
                break;
            case 'bl':
                path.push({ x: x, y: y }, { x: x + size, y: y }, 
                          { x: x + size, y: y - 5 }, { x: x + 5, y: y - 5 },
                          { x: x + 5, y: y - size }, { x: x, y: y - size });
                break;
            case 'br':
                path.push({ x: x, y: y }, { x: x - size, y: y }, 
                          { x: x - size, y: y - 5 }, { x: x - 5, y: y - 5 },
                          { x: x - 5, y: y - size }, { x: x, y: y - size });
                break;
        }
        
        g.beginPath();
        g.moveTo(path[0].x, path[0].y);
        path.slice(1).forEach(p => g.lineTo(p.x, p.y));
        g.closePath();
        g.fillPath();
        g.strokePath();
        
        // Rivet
        const rivetX = corner.includes('l') ? x + size / 2 : x - size / 2;
        const rivetY = corner.includes('t') ? y + size / 2 : y - size / 2;
        g.fillStyle(pal.dark, 1);
        g.fillCircle(rivetX, rivetY, 2);
    }
    
    private drawRusted(g: Phaser.GameObjects.Graphics, opts: PlatformRenderOptions): void {
        // Start with steel, then add heavy rust
        this.drawSteel(g, opts);
        
        const { x, y, width, height } = opts;
        const pal = PALETTES.rusted;
        
        // Rust patches
        const patchCount = Math.floor(width / 40);
        for (let i = 0; i < patchCount; i++) {
            const px = x + 10 + Math.random() * (width - 20);
            const py = y + 5 + Math.random() * (height - 10);
            const psize = 8 + Math.random() * 15;
            
            // Layered rust spots
            g.fillStyle(pal.dark, 0.6);
            g.fillCircle(px, py, psize);
            g.fillStyle(pal.base, 0.5);
            g.fillCircle(px + 2, py - 1, psize * 0.7);
            g.fillStyle(pal.light, 0.3);
            g.fillCircle(px + 3, py - 2, psize * 0.4);
        }
        
        // Rust drips from edges
        g.lineStyle(2, pal.base, 0.4);
        for (let dx = x + 15; dx < x + width - 15; dx += 30 + Math.random() * 40) {
            const dripLen = 5 + Math.random() * 15;
            g.beginPath();
            g.moveTo(dx, y + height);
            g.lineTo(dx + (Math.random() - 0.5) * 4, y + height + dripLen);
            g.strokePath();
        }
    }
    
    private drawBrick(g: Phaser.GameObjects.Graphics, opts: PlatformRenderOptions): void {
        const { x, y, width, height } = opts;
        const pal = PALETTES.brick;
        
        // Mortar base
        g.fillStyle(0x555555, 1);
        g.fillRect(x, y, width, height);
        
        // Brick dimensions
        const brickW = 32;
        const brickH = 14;
        const mortarGap = 3;
        
        let row = 0;
        for (let by = y + 2; by < y + height - brickH; by += brickH + mortarGap) {
            const offset = (row % 2) * (brickW / 2 + mortarGap / 2);
            
            for (let bx = x + 2 - offset; bx < x + width - 4; bx += brickW + mortarGap) {
                const drawX = Math.max(x + 2, bx);
                const drawW = Math.min(brickW, x + width - 4 - drawX);
                
                if (drawW > 5) {
                    // Brick base color with variation
                    const colorVar = Math.random() * 0.2 - 0.1;
                    const r = Math.min(255, Math.floor(((pal.base >> 16) & 0xFF) * (1 + colorVar)));
                    const gr = Math.min(255, Math.floor(((pal.base >> 8) & 0xFF) * (1 + colorVar)));
                    const b = Math.min(255, Math.floor((pal.base & 0xFF) * (1 + colorVar)));
                    const brickColor = (r << 16) | (gr << 8) | b;
                    
                    g.fillStyle(brickColor, 1);
                    g.fillRect(drawX, by, drawW, brickH);
                    
                    // Highlight top edge
                    g.fillStyle(pal.light, 0.3);
                    g.fillRect(drawX, by, drawW, 2);
                    
                    // Shadow bottom edge
                    g.fillStyle(pal.dark, 0.3);
                    g.fillRect(drawX, by + brickH - 2, drawW, 2);
                    
                    // Random damage/chips
                    if (Math.random() < 0.1) {
                        g.fillStyle(0x555555, 1);
                        const chipX = drawX + Math.random() * (drawW - 5);
                        const chipY = by + Math.random() * (brickH - 4);
                        g.fillRect(chipX, chipY, 4 + Math.random() * 3, 3);
                    }
                }
            }
            row++;
        }
        
        // Top edge detail
        g.lineStyle(2, pal.edge, 1);
        g.lineBetween(x, y, x + width, y);
    }
    
    private drawIndustrial(g: Phaser.GameObjects.Graphics, opts: PlatformRenderOptions): void {
        const { x, y, width, height } = opts;
        const pal = PALETTES.industrial;
        
        // Base steel-like surface
        g.fillStyle(pal.dark, 1);
        g.fillRect(x, y, width, height);
        
        g.fillStyle(pal.base, 1);
        g.fillRect(x + 3, y + 3, width - 6, height - 6);
        
        // Warning stripes for edges of taller platforms
        if (height > 50) {
            const stripeWidth = 15;
            g.lineStyle(10, pal.accent, 0.8);
            for (let sx = x; sx < x + width; sx += stripeWidth * 2) {
                g.lineBetween(sx, y + 3, sx + stripeWidth, y + 3);
            }
        }
        
        // Grating pattern for floor
        if (height >= 40) {
            g.lineStyle(2, pal.dark, 0.6);
            for (let gx = x + 10; gx < x + width - 10; gx += 15) {
                g.lineBetween(gx, y + 20, gx, y + height - 5);
            }
            for (let gy = y + 25; gy < y + height - 5; gy += 15) {
                g.lineBetween(x + 10, gy, x + width - 10, gy);
            }
        }
        
        // I-beam supports at edges
        this.drawIBeam(g, x + 5, y, 10, height);
        this.drawIBeam(g, x + width - 15, y, 10, height);
        
        // Add some rivets
        g.fillStyle(pal.light, 0.7);
        for (let rx = x + 30; rx < x + width - 30; rx += 60) {
            g.fillCircle(rx, y + 8, 3);
            if (height > 30) {
                g.fillCircle(rx, y + height - 8, 3);
            }
        }
    }
    
    private drawIBeam(g: Phaser.GameObjects.Graphics, x: number, y: number, 
                      width: number, height: number): void {
        const pal = PALETTES.steel;
        const flangeH = 5;
        const webW = width / 3;
        
        g.fillStyle(pal.dark, 1);
        // Top flange
        g.fillRect(x, y, width, flangeH);
        // Bottom flange
        g.fillRect(x, y + height - flangeH, width, flangeH);
        // Web
        g.fillRect(x + (width - webW) / 2, y + flangeH, webW, height - flangeH * 2);
        
        // Highlight
        g.fillStyle(pal.light, 0.3);
        g.fillRect(x, y, width, 2);
    }
    
    private addOvergrowth(g: Phaser.GameObjects.Graphics, opts: PlatformRenderOptions, 
                          level: 'light' | 'heavy'): void {
        const { x, y, width } = opts;
        const pal = PALETTES.moss;
        const density = level === 'heavy' ? 1.5 : 0.7;
        
        // Grass/fern patches on top
        const patchCount = Math.floor((width / 40) * density);
        for (let i = 0; i < patchCount; i++) {
            const px = x + 10 + Math.random() * (width - 20);
            const bladeCount = 3 + Math.floor(Math.random() * 4);
            
            for (let b = 0; b < bladeCount; b++) {
                const bx = px + (b - bladeCount / 2) * 4;
                const bHeight = 8 + Math.random() * 12;
                const curve = (Math.random() - 0.5) * 8;
                
                g.lineStyle(2, Math.random() > 0.5 ? pal.base : pal.light, 0.9);
                g.beginPath();
                g.moveTo(bx, y);
                g.lineTo(bx + curve, y - bHeight);
                g.strokePath();
            }
        }
        
        // Moss patches
        if (level === 'heavy') {
            const mossPatches = Math.floor(width / 80);
            for (let i = 0; i < mossPatches; i++) {
                const mx = x + 20 + Math.random() * (width - 40);
                const mw = 20 + Math.random() * 30;
                
                g.fillStyle(pal.dark, 0.6);
                g.fillEllipse(mx, y + 3, mw, 8);
                g.fillStyle(pal.base, 0.4);
                g.fillEllipse(mx, y + 2, mw * 0.8, 6);
            }
        }
        
        // Hanging vines from edges
        if (level === 'heavy' && opts.height > 30) {
            const vineCount = Math.floor(width / 100);
            for (let i = 0; i < vineCount; i++) {
                const vx = x + 30 + Math.random() * (width - 60);
                this.drawHangingVine(g, vx, y + opts.height);
            }
        }
    }
    
    private drawHangingVine(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
        const pal = PALETTES.moss;
        const vineLength = 20 + Math.random() * 40;
        const segments = Math.floor(vineLength / 10);
        
        g.lineStyle(2, pal.base, 0.9);
        g.beginPath();
        g.moveTo(x, y);
        
        let vx = x;
        let vy = y;
        for (let i = 0; i < segments; i++) {
            vx += (Math.random() - 0.5) * 8;
            vy += 10;
            g.lineTo(vx, vy);
            
            // Small leaf
            if (Math.random() > 0.5) {
                g.strokePath();
                g.fillStyle(pal.light, 0.8);
                g.fillEllipse(vx + (Math.random() > 0.5 ? 5 : -5), vy, 6, 4);
                g.lineStyle(2, pal.base, 0.9);
                g.beginPath();
                g.moveTo(vx, vy);
            }
        }
        g.strokePath();
    }
    
    private addMoss(g: Phaser.GameObjects.Graphics, opts: PlatformRenderOptions): void {
        const { x, y, width, height } = opts;
        const pal = PALETTES.moss;
        
        // Moss in corners and edges
        const cornerSize = Math.min(25, width / 4, height / 2);
        
        // Top-left corner moss
        g.fillStyle(pal.dark, 0.5);
        g.beginPath();
        g.arc(x, y, cornerSize, 0, Math.PI / 2);
        g.fillPath();
        
        // Top-right corner moss
        g.beginPath();
        g.arc(x + width, y, cornerSize * 0.7, Math.PI / 2, Math.PI);
        g.fillPath();
        
        // Random moss spots
        for (let i = 0; i < 3; i++) {
            const mx = x + 10 + Math.random() * (width - 20);
            const my = y + 5 + Math.random() * Math.min(20, height - 10);
            g.fillStyle(pal.base, 0.3);
            g.fillCircle(mx, my, 5 + Math.random() * 8);
        }
    }
    
    private addRustPatches(g: Phaser.GameObjects.Graphics, opts: PlatformRenderOptions): void {
        const { x, y, width, height } = opts;
        const pal = PALETTES.rusted;
        
        const patchCount = Math.floor(width / 60);
        for (let i = 0; i < patchCount; i++) {
            const px = x + 15 + Math.random() * (width - 30);
            const py = y + 8 + Math.random() * (height - 16);
            const psize = 5 + Math.random() * 10;
            
            g.fillStyle(pal.base, 0.4);
            g.fillCircle(px, py, psize);
            g.fillStyle(pal.light, 0.2);
            g.fillCircle(px + 1, py - 1, psize * 0.6);
        }
    }
    
    private addDamage(g: Phaser.GameObjects.Graphics, opts: PlatformRenderOptions): void {
        const { x, y, width, height, damage } = opts;
        
        if (damage === 'cracked') {
            // Draw cracks
            g.lineStyle(1, 0x222222, 0.6);
            const crackCount = Math.floor(width / 100) + 1;
            
            for (let i = 0; i < crackCount; i++) {
                const startX = x + 20 + Math.random() * (width - 40);
                const startY = y + Math.random() * height;
                
                this.drawCrack(g, startX, startY, 15 + Math.random() * 25);
            }
        } else if (damage === 'broken') {
            // Chunks missing
            g.fillStyle(0x000000, 0.8);
            const chunkCount = Math.floor(width / 150) + 1;
            
            for (let i = 0; i < chunkCount; i++) {
                const cx = x + 30 + Math.random() * (width - 60);
                const cy = y + (Math.random() > 0.5 ? 0 : height - 10);
                const cw = 10 + Math.random() * 15;
                const ch = 8 + Math.random() * 10;
                
                g.fillRect(cx, cy, cw, ch);
            }
            
            // Also add cracks around damage
            g.lineStyle(1, 0x222222, 0.4);
            this.drawCrack(g, x + width * 0.3, y + 5, 20);
            this.drawCrack(g, x + width * 0.7, y + height - 5, 15);
        }
    }
    
    private drawCrack(g: Phaser.GameObjects.Graphics, x: number, y: number, length: number): void {
        g.beginPath();
        g.moveTo(x, y);
        
        let cx = x;
        let cy = y;
        const segments = Math.floor(length / 5);
        
        for (let i = 0; i < segments; i++) {
            cx += (Math.random() - 0.5) * 10;
            cy += 3 + Math.random() * 5;
            g.lineTo(cx, cy);
            
            // Branch occasionally
            if (Math.random() < 0.3) {
                const branchX = cx + (Math.random() - 0.5) * 15;
                const branchY = cy + 5 + Math.random() * 10;
                g.lineTo(branchX, branchY);
                g.moveTo(cx, cy);
            }
        }
        g.strokePath();
    }
    
    private addDrips(g: Phaser.GameObjects.Graphics, opts: PlatformRenderOptions): void {
        const { x, y, width, height } = opts;
        
        // Water/grime drips from bottom edge
        g.lineStyle(1, 0x2d5c57, 0.4);
        const dripCount = Math.floor(width / 50);
        
        for (let i = 0; i < dripCount; i++) {
            const dx = x + 20 + Math.random() * (width - 40);
            const dripLen = 10 + Math.random() * 25;
            
            g.beginPath();
            g.moveTo(dx, y + height);
            g.lineTo(dx + (Math.random() - 0.5) * 6, y + height + dripLen);
            g.strokePath();
            
            // Drip end bulb
            g.fillStyle(0x2d5c57, 0.3);
            g.fillCircle(dx + (Math.random() - 0.5) * 4, y + height + dripLen, 2);
        }
    }
    
    public destroy(): void {
        this.graphics.destroy();
    }
}

// Convenience function for creating styled platforms
export function createStyledPlatform(
    scene: Phaser.Scene, 
    options: PlatformRenderOptions
): Phaser.GameObjects.Graphics {
    const renderer = new PlatformRenderer(scene);
    return renderer.renderPlatform(options);
}
