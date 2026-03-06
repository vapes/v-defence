import { Graphics } from 'pixi.js';
import { Tower } from './Tower';
import { TowerType } from '../../types';
import { Enemy } from '../enemies/Enemy';

const SHELL_FLIGHT = 30; // frames (~0.5s at 60fps)
const EXPLOSION_DURATION = 18;
const FIREBALL_RADIUS = 12; // 3× bullet radius (4)

interface Shell {
  sx: number; sy: number;
  tx: number; ty: number;
  progress: number;
  damage: number;
  aoeRadius: number;
  stunDuration: number;
}

interface Explosion {
  x: number; y: number;
  timer: number;
  radius: number;
}

export class MortarTower extends Tower {
  readonly towerType: TowerType = 'magic';

  private cooldown: number = 0;
  private maxCooldown: number = 0;
  private shells: Shell[] = [];
  private explosions: Explosion[] = [];
  private effectGfx: Graphics;

  constructor(row: number, col: number) {
    super(row, col);
    this.effectGfx = new Graphics();
    this.addChildAt(this.effectGfx, 3); // above base(1) and head(2), below levelGfx(4)
    this.drawTower();
  }

  drawTower(): void {
    this.base.clear();
    // Dark indigo arcane pedestal
    this.base.roundRect(-22, -22, 44, 44, 6).fill(0x1a0a3e);
    this.base.roundRect(-22, -22, 44, 44, 6).stroke({ color: 0x7b1fa2, width: 2 });

    const accentColor = this.level === 0 ? 0x6a1a9e : this.level === 1 ? 0xab47bc : 0xe040fb;

    // Rune cross lines
    this.base.rect(-1, -16, 2, 32).fill({ color: accentColor, alpha: 0.35 });
    this.base.rect(-16, -1, 32, 2).fill({ color: accentColor, alpha: 0.35 });

    // Corner rune dots
    for (const [cx, cy] of [[-12, -12], [12, -12], [-12, 12], [12, 12]] as [number, number][]) {
      this.base.circle(cx, cy, 2.5).fill({ color: accentColor, alpha: 0.7 });
    }

    // Head: orb cradle — ring + 3 prongs
    this.head.clear();
    this.head.circle(0, 0, 10).stroke({ color: accentColor, width: 2.5 });
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const x1 = Math.cos(angle) * 10;
      const y1 = Math.sin(angle) * 10;
      const x2 = Math.cos(angle) * 17;
      const y2 = Math.sin(angle) * 17;
      this.head.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: accentColor, width: 2 });
    }
  }

  update(dt: number, enemies: Enemy[]): void {
    const dtMs = dt * (1000 / 60);
    this.cooldown -= dtMs;

    this.updateShells(dt, enemies);
    this.updateExplosions(dt);

    const target = this.findTarget(enemies);
    if (!target) return;

    // No rotation — no barrel
    if (this.cooldown <= 0) {
      const fireRate = this.stats.fireRate ?? 2500;
      this.cooldown = fireRate;
      this.maxCooldown = fireRate;
      const { damage = 30, aoeRadius = 40, stunDuration = 0 } = this.stats;
      this.shells.push({
        sx: 0, sy: 0,
        tx: target.x - this.x,
        ty: target.y - this.y,
        progress: 0,
        damage, aoeRadius, stunDuration,
      });
    }
  }

  private updateShells(dt: number, enemies: Enemy[]): void {
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.progress += dt / SHELL_FLIGHT;
      if (s.progress >= 1) {
        this.explode(s, enemies);
        this.shells.splice(i, 1);
      }
    }
  }

  private explode(shell: Shell, enemies: Enemy[]): void {
    const worldX = this.x + shell.tx;
    const worldY = this.y + shell.ty;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dx = enemy.x - worldX;
      const dy = enemy.y - worldY;
      if (Math.sqrt(dx * dx + dy * dy) <= shell.aoeRadius) {
        enemy.takeDamage(shell.damage);
        if (shell.stunDuration > 0) enemy.applyStun(shell.stunDuration);
      }
    }
    this.explosions.push({ x: shell.tx, y: shell.ty, timer: EXPLOSION_DURATION, radius: shell.aoeRadius });
  }

  private updateExplosions(dt: number): void {
    this.effectGfx.clear();

    // Charging fireball on tower
    const chargeRatio = this.maxCooldown > 0
      ? Math.max(0, Math.min(1, 1 - this.cooldown / this.maxCooldown))
      : 1;

    if (chargeRatio > 0.01) {
      const r = chargeRatio * FIREBALL_RADIUS;
      this.effectGfx.circle(0, 0, r * 1.7).fill({ color: 0xff6600, alpha: 0.15 * chargeRatio });
      this.effectGfx.circle(0, 0, r).fill(0xff4400);
      this.effectGfx.circle(0, 0, r * 0.5).fill(0xffdd00);
    }

    // Flying fireballs
    for (const s of this.shells) {
      const t = s.progress;
      const cx = s.sx + (s.tx - s.sx) * t;
      const cy = s.sy + (s.ty - s.sy) * t;
      const arc = -Math.sin(t * Math.PI) * 30;
      this.effectGfx.circle(cx, cy + arc, FIREBALL_RADIUS * 1.8).fill({ color: 0xff6600, alpha: 0.25 });
      this.effectGfx.circle(cx, cy + arc, FIREBALL_RADIUS).fill(0xff4400);
      this.effectGfx.circle(cx, cy + arc, FIREBALL_RADIUS * 0.5).fill(0xffdd00);
    }

    // Fire explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const e = this.explosions[i];
      e.timer -= dt;
      if (e.timer <= 0) {
        this.explosions.splice(i, 1);
        continue;
      }
      const t = 1 - e.timer / EXPLOSION_DURATION;
      const r = e.radius * (0.3 + 0.7 * t);
      const alpha = 0.5 * (e.timer / EXPLOSION_DURATION);
      this.effectGfx.circle(e.x, e.y, r).fill({ color: 0xff6600, alpha });
      this.effectGfx.circle(e.x, e.y, r * 0.5).fill({ color: 0xffcc00, alpha: alpha * 0.6 });
    }
  }
}
