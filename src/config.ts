/**
 * Game Configuration Constants
 * All tunable values for game feel and balance
 */

// ===========================================
// DISPLAY SETTINGS
// ===========================================
export const GAME_CONFIG = {
    WIDTH: 1280,
    HEIGHT: 720,
    PIXEL_SCALE: 1,
    FPS: 60
} as const;

// ===========================================
// PLAYER PHYSICS - The "Feel"
// ===========================================
export const PLAYER = {
    // Movement
    MOVE_SPEED: 280,
    ACCELERATION: 1800,
    DECELERATION: 2400,
    AIR_CONTROL: 0.85,          // Multiplier for air movement
    
    // Jump - Weighty feel
    GRAVITY: 1800,
    JUMP_VELOCITY: -620,
    JUMP_CUT_MULTIPLIER: 0.4,   // Release jump early = cut velocity
    COYOTE_TIME: 100,           // ms grace period after leaving platform
    JUMP_BUFFER: 150,           // ms input buffer before landing
    FALL_MULTIPLIER: 2.5,       // Fall faster than rise
    MAX_FALL_SPEED: 1200,
    
    // Dash
    DASH_VELOCITY: 800,
    DASH_DURATION: 150,         // ms
    DASH_COOLDOWN: 600,         // ms
    DASH_INVINCIBILITY: 100,    // ms i-frames
    
    // Combat
    NAIL_DAMAGE: 1,
    NAIL_DURATION: 200,         // ms hitbox active
    NAIL_COOLDOWN: 400,         // ms between attacks
    NAIL_HITBOX_WIDTH: 80,
    NAIL_HITBOX_HEIGHT: 60,
    KNOCKBACK_VELOCITY: 400,
    RECOIL_VELOCITY: 200,
    HITSTOP_DURATION: 50,       // ms freeze on hit
    POGO_VELOCITY: -500,        // Down-slash bounce
    
    // Stats
    MAX_HEALTH: 5,
    INVINCIBILITY_TIME: 1000,   // ms after taking damage
    
    // Visual
    WIDTH: 48,
    HEIGHT: 64
} as const;

// ===========================================
// ENEMY CONFIGURATIONS
// ===========================================
export const CRAWLER = {
    SPEED: 120,
    HEALTH: 2,
    DAMAGE: 1,
    DETECTION_RANGE: 300,
    ATTACK_RANGE: 50,
    WIDTH: 56,
    HEIGHT: 40
} as const;

export const FLYER = {
    SPEED: 150,
    HEALTH: 1,
    DAMAGE: 1,
    HOVER_AMPLITUDE: 30,
    HOVER_SPEED: 2,
    SWOOP_SPEED: 350,
    DETECTION_RANGE: 400,
    WIDTH: 48,
    HEIGHT: 48
} as const;

export const BOSS = {
    HEALTH: 15,
    DAMAGE: 2,
    
    // Phase 1
    PHASE1_SPEED: 180,
    PHASE1_ATTACK_COOLDOWN: 2000,
    
    // Phase 2 (66% health)
    PHASE2_SPEED: 220,
    PHASE2_ATTACK_COOLDOWN: 1500,
    PHASE2_DASH_SPEED: 500,
    
    // Phase 3 (33% health)
    PHASE3_SPEED: 260,
    PHASE3_ATTACK_COOLDOWN: 1000,
    
    WIDTH: 72,
    HEIGHT: 96
} as const;

// ===========================================
// COLORS - Vector Noir Palette
// ===========================================
export const COLORS = {
    // Backgrounds
    BG_DARK: 0x0f0f23,
    BG_MID: 0x16213e,
    BG_LIGHT: 0x1a1a2e,
    
    // Player
    PLAYER_BODY: 0x000000,
    PLAYER_GLOW: 0x00FFFF,
    PLAYER_EYES: 0x00FFFF,
    
    // Enemies
    ENEMY_BODY: 0x1a1a2e,
    ENEMY_GLOW: 0xFF6B6B,
    ENEMY_EYES: 0xFF6B6B,
    
    // Environment
    PLATFORM_MAIN: 0x2d2d44,
    PLATFORM_EDGE: 0x4a4a6a,
    
    // Effects
    SLASH_COLOR: 0xFFFFFF,
    DASH_TRAIL: 0x00FFFF,
    DAMAGE_FLASH: 0xFF0000,
    HEAL_COLOR: 0x00FF88
} as const;

// ===========================================
// CAMERA SETTINGS
// ===========================================
export const CAMERA = {
    LERP_X: 0.1,
    LERP_Y: 0.08,
    DEAD_ZONE_WIDTH: 50,
    DEAD_ZONE_HEIGHT: 30,
    SHAKE_INTENSITY: 0.01,
    SHAKE_DURATION: 100
} as const;

// ===========================================
// AUDIO VOLUMES
// ===========================================
export const AUDIO = {
    MASTER: 0.8,
    SFX: 0.7,
    MUSIC: 0.5
} as const;

// ===========================================
// INPUT KEYCODES
// ===========================================
export const KEYS = {
    LEFT: ['A', 'LEFT'],
    RIGHT: ['D', 'RIGHT'],
    JUMP: ['SPACE', 'W', 'UP'],
    DASH: ['SHIFT', 'K'],
    ATTACK: ['J'],
    PAUSE: ['ESC']
} as const;

// ===========================================
// SCENE KEYS
// ===========================================
export const SCENES = {
    BOOT: 'BootScene',
    MENU: 'MenuScene',
    TUTORIAL: 'TutorialScene',
    ARENA: 'ArenaScene',
    BOSS: 'BossScene',
    UI: 'UIScene',
    GAME_OVER: 'GameOverScene'
} as const;

// ===========================================
// ANIMATION KEYS
// ===========================================
export const ANIMS = {
    PLAYER: {
        IDLE: 'player-idle',
        RUN: 'player-run',
        JUMP: 'player-jump',
        FALL: 'player-fall',
        DASH: 'player-dash',
        ATTACK_SIDE: 'player-attack-side',
        ATTACK_UP: 'player-attack-up',
        ATTACK_DOWN: 'player-attack-down',
        HURT: 'player-hurt',
        DEATH: 'player-death'
    },
    CRAWLER: {
        IDLE: 'crawler-idle',
        WALK: 'crawler-walk',
        ATTACK: 'crawler-attack',
        HURT: 'crawler-hurt',
        DEATH: 'crawler-death'
    },
    FLYER: {
        HOVER: 'flyer-hover',
        SWOOP: 'flyer-swoop',
        HURT: 'flyer-hurt',
        DEATH: 'flyer-death'
    },
    BOSS: {
        IDLE: 'boss-idle',
        WALK: 'boss-walk',
        ATTACK: 'boss-attack',
        DASH: 'boss-dash',
        HURT: 'boss-hurt',
        DEATH: 'boss-death'
    },
    EFFECTS: {
        SLASH: 'effect-slash',
        DUST: 'effect-dust',
        IMPACT: 'effect-impact'
    }
} as const;
