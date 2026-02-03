# 🎮 Hollow Knight MVP - Blueprint & Architecture Document

## Project Overview
**Codename:** Shadow Nail  
**Engine:** Phaser 3.70+  
**Language:** TypeScript  
**Target:** Web Browser (Chrome, Firefox, Edge)  
**Development Time:** 7 Days  

---

## 1. 🎨 Visual Style: "Vector Noir"

### Art Direction
A **silhouette-based aesthetic** that's quick to create but visually striking:

| Element | Style | Colors |
|---------|-------|--------|
| Player | Solid black silhouette with glowing eyes | `#000000` + `#00FFFF` (cyan glow) |
| Enemies | Dark gray silhouettes | `#1a1a2e` + `#FF6B6B` (red glow) |
| Background | Layered parallax gradients | `#16213e` → `#0f0f23` |
| Platforms | Solid shapes with subtle edge glow | `#2d2d44` + `#4a4a6a` |
| Effects | Particle-based slashes, dust | `#FFFFFF` with alpha fade |

### Why This Works
- **Fast to create:** No complex textures, just shapes and gradients
- **Professional look:** High contrast creates dramatic atmosphere
- **Performance:** Simple shapes = fast rendering
- **Scalable:** Looks good at any resolution

---

## 2. ⚙️ Core Mechanics - The Math

### 2.1 Weighty Jump Physics

```typescript
// Jump Configuration
const JUMP_CONFIG = {
    GRAVITY: 1800,              // Pixels per second²
    JUMP_VELOCITY: -620,        // Initial upward velocity
    JUMP_CUT_MULTIPLIER: 0.4,   // When releasing jump early
    COYOTE_TIME: 100,           // ms - grace period after leaving platform
    JUMP_BUFFER: 150,           // ms - input buffer before landing
    FALL_MULTIPLIER: 2.5,       // Faster falling than rising
    MAX_FALL_SPEED: 1200,       // Terminal velocity
};

// Jump Feel Formula
// Rising: Apply normal gravity
// Falling: Apply gravity * FALL_MULTIPLIER
// This creates the "weighty" arc Hollow Knight is known for

function updateJump(player, delta) {
    if (player.velocity.y > 0) {
        // Falling - apply extra gravity for weight
        player.velocity.y += GRAVITY * FALL_MULTIPLIER * delta;
    } else {
        // Rising - normal gravity
        player.velocity.y += GRAVITY * delta;
    }
    
    // Clamp to terminal velocity
    player.velocity.y = Math.min(player.velocity.y, MAX_FALL_SPEED);
}
```

### 2.2 Quick Dash Mechanics

```typescript
const DASH_CONFIG = {
    VELOCITY: 800,              // Dash speed (pixels/sec)
    DURATION: 150,              // ms - how long dash lasts
    COOLDOWN: 600,              // ms - time before next dash
    INVINCIBILITY_FRAMES: 100,  // ms - i-frames during dash
    TRAIL_SPAWN_RATE: 20,       // ms - afterimage frequency
};

// Dash Physics
// 1. Lock vertical velocity to 0 (horizontal dash)
// 2. Set horizontal velocity to DASH_VELOCITY * direction
// 3. Disable gravity during dash
// 4. Enable i-frames
// 5. Spawn afterimage trail

function executeDash(player, direction) {
    player.velocity.x = DASH_VELOCITY * direction;
    player.velocity.y = 0;
    player.gravityEnabled = false;
    player.invincible = true;
    
    // Reset after duration
    setTimeout(() => {
        player.gravityEnabled = true;
        player.invincible = false;
    }, DASH_DURATION);
}
```

### 2.3 Melee "Nail" Slash with Knockback

```typescript
const NAIL_CONFIG = {
    DAMAGE: 1,                  // Hearts of damage
    SLASH_DURATION: 200,        // ms - active hitbox time
    COOLDOWN: 400,              // ms - attack cooldown
    HITBOX_WIDTH: 80,           // pixels
    HITBOX_HEIGHT: 60,          // pixels
    KNOCKBACK_VELOCITY: 400,    // pixels/sec - enemy pushback
    RECOIL_VELOCITY: 200,       // pixels/sec - player pushback
    HITSTOP_DURATION: 50,       // ms - freeze frame on hit
};

// Knockback Formula
function applyKnockback(attacker, target, config) {
    // Direction from attacker to target
    const direction = Math.sign(target.x - attacker.x);
    
    // Apply knockback to target
    target.velocity.x = direction * KNOCKBACK_VELOCITY;
    target.velocity.y = -100; // Slight upward pop
    
    // Apply recoil to attacker (opposite direction)
    attacker.velocity.x = -direction * RECOIL_VELOCITY;
    
    // Hitstop - freeze both entities briefly
    freezeFrame(HITSTOP_DURATION);
}

// Directional Attacks (4-way like Hollow Knight)
enum SlashDirection {
    LEFT,   // Default when facing left
    RIGHT,  // Default when facing right
    UP,     // When holding up
    DOWN    // When holding down (pogo mechanic!)
}

// Down-slash pogo bounce
function pogoJump(player) {
    player.velocity.y = JUMP_VELOCITY * 0.8;  // 80% of normal jump
}
```

---

## 3. 🗺️ The Micro-Map: 3-Room Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                        GAME WORLD LAYOUT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│    │              │    │              │    │              │    │
│    │   ROOM 1     │───►│   ROOM 2     │───►│   ROOM 3     │    │
│    │   Tutorial   │    │   Combat     │    │   Boss       │    │
│    │              │◄───│   Arena      │◄───│   Chamber    │    │
│    │              │    │              │    │              │    │
│    └──────────────┘    └──────────────┘    └──────────────┘    │
│                                                                 │
│    Loop: Boss defeat → Respawn at Tutorial with upgrades       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Room 1: Tutorial Chamber (800 x 600)
**Purpose:** Teach movement mechanics organically

```
Layout:
├── Spawn Point (left side)
├── Low platform gap → teaches JUMP
├── High platform → teaches DOUBLE JUMP (if unlocked)
├── Horizontal gap too wide for jump → teaches DASH
├── Destructible object → teaches NAIL ATTACK
├── Sign posts with minimal text prompts
└── Exit door (right side) → leads to Room 2
```

### Room 2: Combat Arena (1200 x 600)
**Purpose:** Practice combat against basic enemies

```
Layout:
├── Entry from Room 1 (left)
├── Multi-level platforms for vertical combat
├── 3x Crawler enemies (ground-based)
├── 2x Flyer enemies (aerial)
├── Health pickup in hidden corner
├── Exit door (right) → leads to Room 3
└── Return door (left) → back to Room 1
```

### Room 3: Boss Chamber (1000 x 700)
**Purpose:** Test all skills in a boss fight

```
Layout:
├── Entry from Room 2 (left)
├── Flat arena floor with raised side platforms
├── Boss: "The Shade Knight" (mirror of player)
│   ├── Phase 1: Basic slash attacks
│   ├── Phase 2: Adds dash attacks
│   └── Phase 3: Faster, more aggressive
├── Health pickups drop on phase transitions
└── Victory → Return to Room 1 (loop resets, enemies respawn)
```

---

## 4. 📁 MVP File Structure

```
hollow-knight-mvp/
├── 📄 index.html                 # Entry point
├── 📄 package.json               # Dependencies
├── 📄 tsconfig.json              # TypeScript config
├── 📄 vite.config.ts             # Build tool config
│
├── 📂 src/
│   ├── 📄 main.ts                # Game initialization
│   ├── 📄 config.ts              # Game constants & settings
│   │
│   ├── 📂 scenes/
│   │   ├── 📄 BootScene.ts       # Asset loading
│   │   ├── 📄 MenuScene.ts       # Title screen
│   │   ├── 📄 TutorialScene.ts   # Room 1
│   │   ├── 📄 ArenaScene.ts      # Room 2
│   │   ├── 📄 BossScene.ts       # Room 3
│   │   └── 📄 UIScene.ts         # HUD overlay
│   │
│   ├── 📂 entities/
│   │   ├── 📄 Player.ts          # Player class
│   │   ├── 📄 Enemy.ts           # Base enemy class
│   │   ├── 📄 Crawler.ts         # Ground enemy
│   │   ├── 📄 Flyer.ts           # Flying enemy
│   │   └── 📄 Boss.ts            # Boss class
│   │
│   ├── 📂 components/
│   │   ├── 📄 StateMachine.ts    # State management
│   │   ├── 📄 HealthSystem.ts    # HP & damage
│   │   ├── 📄 HitboxManager.ts   # Attack collision
│   │   └── 📄 ParticleEffects.ts # Visual FX
│   │
│   ├── 📂 systems/
│   │   ├── 📄 InputHandler.ts    # Keyboard/gamepad
│   │   ├── 📄 CameraController.ts# Smooth camera
│   │   └── 📄 AudioManager.ts    # Sound effects
│   │
│   └── 📂 utils/
│       ├── 📄 MathHelpers.ts     # Vector math, lerp
│       └── 📄 Debug.ts           # Dev tools
│
├── 📂 assets/
│   ├── 📂 sprites/
│   │   ├── 📄 player.png         # Player spritesheet
│   │   ├── 📄 enemies.png        # Enemy sprites
│   │   └── 📄 effects.png        # Slash, dust, etc.
│   │
│   ├── 📂 tilemaps/
│   │   ├── 📄 tutorial.json      # Room 1 tilemap
│   │   ├── 📄 arena.json         # Room 2 tilemap
│   │   ├── 📄 boss.json          # Room 3 tilemap
│   │   └── 📄 tileset.png        # Shared tileset
│   │
│   ├── 📂 audio/
│   │   ├── 📄 slash.wav          # Attack sound
│   │   ├── 📄 dash.wav           # Dash sound
│   │   ├── 📄 jump.wav           # Jump sound
│   │   ├── 📄 hurt.wav           # Damage sound
│   │   ├── 📄 enemy_hit.wav      # Enemy damage
│   │   └── 📄 boss_theme.mp3     # Boss music
│   │
│   └── 📂 fonts/
│       └── 📄 pixel.ttf          # UI font
│
└── 📂 public/
    └── 📄 favicon.ico            # Browser icon
```

---

## 5. 📅 7-Day Execution Plan

### Day 1: Foundation (Monday)
**Goal:** Project runs, player moves

- [ ] Initialize project with Vite + TypeScript + Phaser 3
- [ ] Create basic file structure
- [ ] Implement `BootScene` with placeholder assets
- [ ] Create `Player.ts` with basic movement (left/right)
- [ ] Add gravity and ground collision
- [ ] **Milestone:** Player walks and falls

### Day 2: Jump & Dash (Tuesday)
**Goal:** Movement feels good

- [ ] Implement weighty jump mechanics
- [ ] Add coyote time and jump buffering
- [ ] Implement dash with i-frames
- [ ] Add afterimage trail effect
- [ ] Create dust particles for landing
- [ ] **Milestone:** Movement feels like Hollow Knight

### Day 3: Combat System (Wednesday)
**Goal:** Player can attack

- [ ] Implement 4-directional nail slash
- [ ] Create hitbox system
- [ ] Add hitstop (freeze frames)
- [ ] Implement knockback physics
- [ ] Add pogo mechanic (down-slash bounce)
- [ ] Create slash visual effects
- [ ] **Milestone:** Combat feels impactful

### Day 4: Enemies & AI (Thursday)
**Goal:** Things to fight

- [ ] Create base `Enemy` class with health
- [ ] Implement `Crawler` (walks, charges)
- [ ] Implement `Flyer` (hovers, swoops)
- [ ] Add enemy-to-player collision damage
- [ ] Create player health/damage system
- [ ] Add I-frames after taking damage
- [ ] **Milestone:** Functional combat loop

### Day 5: Level Design (Friday)
**Goal:** Playable world

- [ ] Create tileset graphics (Vector Noir style)
- [ ] Design Tutorial room in Tiled
- [ ] Design Arena room in Tiled
- [ ] Design Boss chamber in Tiled
- [ ] Implement room transitions
- [ ] Add spawn points and enemy placement
- [ ] **Milestone:** All 3 rooms playable

### Day 6: Boss & Polish (Saturday)
**Goal:** Complete game loop

- [ ] Implement Boss AI with 3 phases
- [ ] Create boss attack patterns
- [ ] Add UI (health hearts, boss healthbar)
- [ ] Implement game over / victory states
- [ ] Add screen shake and camera effects
- [ ] Create respawn system
- [ ] **Milestone:** Full game loop works

### Day 7: Audio & Launch (Sunday)
**Goal:** Ship it!

- [ ] Add all sound effects
- [ ] Add boss music
- [ ] Create title screen
- [ ] Bug fixing and balance tuning
- [ ] Build for production
- [ ] Deploy to itch.io or GitHub Pages
- [ ] **Milestone:** 🚀 LAUNCH!

---

## 6. 🎯 MVP Scope Boundaries

### ✅ IN SCOPE
- 1 playable character
- 2 enemy types + 1 boss
- 3 connected rooms
- Walk, jump, dash, attack
- Health system
- Basic UI
- Sound effects

### ❌ OUT OF SCOPE (Post-MVP)
- Save system
- Multiple weapons
- Upgrades/abilities
- More than 3 rooms
- Dialogue system
- Inventory
- Map screen

---

## 7. 🔧 Technical Notes

### Performance Targets
- **60 FPS** on mid-range hardware
- **< 5MB** total asset size
- **< 3 second** initial load

### Browser Support
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

### Controls
| Action | Keyboard | Gamepad |
|--------|----------|---------|
| Move   | A/D or ←/→ | Left Stick |
| Jump   | Space or W | A Button |
| Dash   | Shift or K | B Button |
| Attack | J or Click | X Button |
| Pause  | Escape | Start |

---

## 8. 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

*Document Version: 1.0*  
*Last Updated: January 28, 2026*  
*Author: Shadow Nail Development Team*
