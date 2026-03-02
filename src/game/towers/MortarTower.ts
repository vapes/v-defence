import { Graphics } from 'pixi.js';
import { Tower } from './Tower';
import { TowerType } from '../../types';
import { Enemy } from '../enemies/Enemy';

const SHELL_FLIGHT = 30; // frames (~0.5s at 60fps)
const EXPLOSION_DURATION = 18;

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
  readonly towerType: TowerType = 'mortar';

  private cooldown: number = 0;
  private shells: Shell[] = [];
  private explosions: Explosion[] = [];
  private effectGfx: Graphics;

  constructor(row: number, col: number) {
    super(row, col);
    this.effectGfx = new Graphics();
    this.addChildAt(this.effectGfx, 0);
    this.drawTower();
  }

  drawTower(): void {
    this.base.clear();
    this.base.roundRect(-22, -22, 44, 44, 4).fill(0x556b2f);
    this.base.roundRect(-22, -22, 44, 44, 4).stroke({ color: 0x3b4a20, width: 2 });

    const shade = this.level === 0 ? 0x6b8e23 : this.level === 1 ? 0x8fbc8f : 0xadff2f;
    this.head.clear();
    this.head.rect(-6, -18, 12, 20).fill(shade);
    this.head.rect(-6, -18, 12, 20).stroke({ color: 0x333333, width: 1 });
    this.head.circle(0, -18, 6).fill(0x444444);
  }

  update(dt: number, enemies: Enemy[]): void {
    const dtMs = dt * (1000 / 60);
    this.cooldown -= dtMs;

    this.updateShells(dt, enemies);
    this.updateExplosions(dt);

    const target = this.findTarget(enemies);
    if (!target) return;

    this.rotateToTarget(target);

    if (this.cooldown <= 0) {
      this.cooldown = this.stats.fireRate ?? 2500;
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
        if (shell.stunDuration > 0) {
          enemy.applyStun(shell.stunDuration);
        }
      }
    }

    this.explosions.push({
      x: shell.tx, y: shell.ty,
      timer: EXPLOSION_DURATION,
      radius: shell.aoeRadius,
    });
  }

  private updateExplosions(dt: number): void {
    this.effectGfx.clear();

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

    for (const s of this.shells) {
      const t = s.progress;
      const cx = s.sx + (s.tx - s.sx) * t;
      const cy = s.sy + (s.ty - s.sy) * t;
      const arc = -Math.sin(t * Math.PI) * 30;
      this.effectGfx.circle(cx, cy + arc, 4).fill(0x444444);
    }
  }
}
