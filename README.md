# 🎮 Shroombound - A Hollow Knight Tribute

A Hollow Knight-inspired 2D platformer MVP built with **Phaser 3** and **TypeScript**.

![Vector Noir Style](https://img.shields.io/badge/Style-Vector%20Noir-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Phaser](https://img.shields.io/badge/Phaser-3.70-green)

## 🚀 Quick Start

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

## 🎮 Controls

| Action | Keyboard | Alternative |
|--------|----------|-------------|
| Move Left | A | ← Arrow |
| Move Right | D | → Arrow |
| Jump | Space | W |
| Dash | Shift | K |
| Attack | J | - |
| Pause | Escape | - |
| Debug Mode | ` (backtick) | - |

## 🗺️ Game Structure

### Three-Room Loop
1. **The Threshold** (Tutorial) - Learn the mechanics
2. **Trial Grounds** (Arena) - Practice combat
3. **Shade Chamber** (Boss) - Face the Shade Knight

## 🎨 Vector Noir Art Style

The game uses a **silhouette-based aesthetic**:
- **Player**: Black silhouette with cyan glowing eyes
- **Enemies**: Dark gray with red glow
- **Environment**: Layered gradients with edge highlighting
- **Effects**: White particle-based slashes and dust

## ⚙️ Core Mechanics

### Weighty Jump
- Coyote time (100ms grace period)
- Jump buffering (150ms input buffer)
- Variable jump height (release to cut short)
- Faster falling than rising

### Quick Dash
- 800 pixels/second burst
- 150ms duration
- I-frames during dash
- Afterimage trail effect

### Nail Combat
- 4-directional attacks
- Knockback on enemies
- Recoil on player
- Hitstop for impact feel
- Pogo bounce on down-attack

## 📁 Project Structure

```
src/
├── main.ts              # Game initialization
├── config.ts            # All game constants
├── scenes/              # Game scenes
│   ├── BootScene.ts     # Asset loading
│   ├── MenuScene.ts     # Title screen
│   ├── TutorialScene.ts # Room 1
│   ├── ArenaScene.ts    # Room 2
│   ├── BossScene.ts     # Room 3
│   └── UIScene.ts       # HUD overlay
├── entities/            # Game objects
│   ├── Player.ts        # Player controller
│   ├── Enemy.ts         # Base enemy class
│   ├── Crawler.ts       # Ground enemy
│   ├── Flyer.ts         # Flying enemy
│   └── Boss.ts          # Boss AI
├── components/          # Reusable systems
│   └── StateMachine.ts  # State management
└── utils/               # Helpers
    ├── MathHelpers.ts   # Math utilities
    └── Debug.ts         # Dev tools
```

## 🔧 Configuration

All tunable values are in `src/config.ts`:

- `PLAYER` - Movement, jump, dash, combat values
- `CRAWLER` / `FLYER` / `BOSS` - Enemy stats
- `COLORS` - Vector Noir color palette
- `CAMERA` - Follow and shake settings
- `AUDIO` - Volume levels

## 📅 Development Roadmap

- [x] Day 1: Project setup, basic movement
- [ ] Day 2: Jump and dash mechanics
- [ ] Day 3: Combat system
- [ ] Day 4: Enemies and AI
- [ ] Day 5: Level design
- [ ] Day 6: Boss fight and polish
- [ ] Day 7: Audio and launch

## 🎯 MVP Scope

### Included
- ✅ Walk, jump, dash, attack
- ✅ 2 enemy types + 1 boss
- ✅ 3 connected rooms
- ✅ Health system
- ✅ Basic UI

### Future (Post-MVP)
- ❌ Save system
- ❌ Multiple weapons
- ❌ Upgrades/abilities
- ❌ More rooms
- ❌ Dialogue

## 🐛 Debug Mode

Press **`** (backtick) to toggle debug mode:
- Physics bodies visible
- FPS counter
- State information
- Hitbox visualization

## 📜 License

MIT License - Feel free to use this as a learning resource!

---

*Built with ❤️ as a tribute to Team Cherry's Hollow Knight*
