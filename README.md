# V-Defence

A strategic tower defense game built with Pixi.js and TypeScript.

**[Play Now](https://vapes.github.io/v-defence/)**

---

## About

Defend your base from waves of geometric invaders by strategically placing and upgrading towers. Each level introduces new challenges — more enemies, tighter paths, and tougher foes. Plan your layout, manage your coins, and survive every wave.

## Towers

| Tower | Style | Strength |
|-------|-------|----------|
| **Bullet Tower** | Fast-firing projectiles that track enemies | Cheap and versatile — great for covering lanes |
| **Laser Tower** | Instant-hit beams with high damage per shot | Slower but devastating — ideal for tough targets |

Both towers can be upgraded twice, increasing damage, range, and fire rate. Sell towers you no longer need for 70% of your investment.

## Enemies

| Enemy | Shape | Trait |
|-------|-------|-------|
| **Circle** | Red circle | Basic — balanced stats |
| **Triangle** | Orange triangle | Fast — low health but hard to catch |
| **Square** | Blue square | Sturdy — more health, decent reward |
| **Hexagon** | Purple hexagon | Tank — slow, tough, and rewarding |

Enemies grow stronger with every wave, scaling in health as the battle progresses.

## Levels

1. **The Straight Path** — Learn the basics with a guided tutorial and a single tower type
2. **The Winding Road** — Choose between bullet and laser towers on a twisting path
3. **The Fortress** — Fewer lives, more waves, and relentless enemy combinations

## Built With

- [Pixi.js 8](https://pixijs.com/) — 2D WebGL rendering
- [TypeScript](https://www.typescriptlang.org/) — strict mode
- [Vite](https://vite.dev/) — build tooling

## Development

```bash
npm install
npm run dev       # Start dev server
npm run build     # Type-check + production build
npm run preview   # Preview production build
```
