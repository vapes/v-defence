# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # TypeScript check + Vite production build (tsc && vite build)
npm run preview  # Preview production build locally
```

No test framework is configured. Type-check with `npx tsc --noEmit`.

## Tech Stack

- **Pixi.js 8** for 2D WebGL rendering
- **TypeScript** (strict mode, ES2020 target)
- **Vite** for bundling (base path `./`)

## Architecture

Tower defense game with a **scene-based architecture** managed by `SceneManager`. The main game loop lives in `GameScene`, which wires together all subsystems.

### Scene Flow

`LevelSelectScene` → `GameScene` → `VictoryScene` / `DefeatScene`

### GameScene Subsystems

GameScene composes these systems, wired together via **callback properties** (not event emitters):

- **Grid** — 2D cell grid (Grass/Road/Spawn/Base). Handles click→cell mapping and BFS pathfinding.
- **WaveManager** — State machine (`Idle→Spawning→Waiting→Countdown→Complete`) that schedules enemy spawns per wave config. Health scales by `1 + wave * 0.15`.
- **EnemyManager / TowerManager / ProjectileManager** — Entity lifecycle managers following the same pattern: `add()`, `remove()`, `update(dt)`, `clear()`. Each owns a Pixi Container for its entities.
- **UI layer** — HUD, BuildMenu, UpgradeMenu, CoinAnimation, WaveCountdown, Tutorial. Menus slide in/out with easing.

### Entity Hierarchy

Towers, enemies, and projectiles each use an **abstract base class** (extending Pixi `Container`) with concrete subclasses and a **factory** for instantiation:

- `Tower` → `BulletTower`, `LaserTower`, `MortarTower`, `CryoTower`, `AlchemistTower`, `GoldMineTower`, `TeslaTower`, `VoidBeaconTower`, `OracleTower`, `OrbitalTower` (via `TowerFactory`)
- `Enemy` → `CircleEnemy`, `Circle2Enemy`, `TriangleEnemy`, `SquareEnemy`, `HexagonEnemy`, `PentagonEnemy` (via `EnemyFactory`)
- `Projectile` → `Bullet`, `LaserBeam`

### Data Layer (`src/data/`)

Game balance is **configuration-driven**, separate from logic:

- `levels/*.json` — Grid layout (2D number array: 0=Grass, 1=Road, 2=Spawn, 3=Base), wave groups, starting money, lives, available towers
- `game-configs.json` — Tower stats (damage, fire rate, range, cost per level) and enemy configs (health, speed, reward, color, armor)
- `types.ts` — All shared interfaces (`LevelConfig`, `WaveConfig`, `TowerLevelStats`, `EnemyConfig`, etc.)

### Key Conventions

- All coordinates use Pixi's global coordinate system. Grid→world conversion via `Grid.getCellWorldPos()`.
- `update(dt)` uses Pixi ticker delta (frame-based, ~1.0 at 60fps). WaveManager converts to ms internally.
- WaveManager state machine: `Idle→Building→Spawning→Waiting→Countdown→Complete`. Health scales by `1 + wave * 0.15`.
- Game state (coins, lives) lives in GameScene and is pushed to HUD via property setters.
- Progress persistence uses `localStorage` key `v-defence-progress` (stores `{ unlockedLevel }`).
- Level 1 has a tutorial overlay (`src/ui/Tutorial.ts`) that guides tower placement before waves begin.
- Design canvas is 450×800 (`DESIGN_WIDTH`/`DESIGN_HEIGHT` in constants).
