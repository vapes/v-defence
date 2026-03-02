import { Graphics } from 'pixi.js';
import { Tower } from './Tower';
import { TowerType } from '../../types';
import { Enemy } from '../enemies/Enemy';

export class VoidBeaconTower extends Tower {
  readonly towerType: TowerType = 'void_beacon';

  private cooldown: number = 0;
  private pulsePhase: number = 0;
  private effectGfx: Graphics;

  constructor(row: number, col: number) {
    super(row, col);
    this.effectGfx = new Graphics();
    this.addChildAt(this.effectGfx, 0);
    this.drawTower();
  }

  drawTower(): void {
    this.base.clear();
    this.base.roundRect(-18, -18, 36, 36, 6).fill(0x0d0d1a);
    this.base.roundRect(-18, -18, 36, 36, 6).stroke({ color: 0x2d1b69, width: 2 });

    const shade = this.level === 0 ? 0x6a0dad : this.level === 1 ? 0x8b00ff : 0xbf40bf;
    this.head.clear();
    this.head.circle(0, 0, 8).fill(shade);
    this.head.circle(0, 0, 8).stroke({ color: 0x4a0080, width: 1.5 });
    this.head.circle(0, 0, 3).fill(0xffffff);
  }

  update(dt: number, enemies: Enemy[]): void {
    const dtMs = dt * (1000 / 60);
    this.cooldown -= dtMs;
    this.pulsePhase += dt * 0.05;
    this.drawPulse();

    if (this.cooldown > 0) return;

    const inRange = this.findAllInRange(enemies);
    if (inRange.length === 0) return;

    const { teleportChance = 0.05, bossStun = 0 } = this.stats;
    const cdMs = (this.stats.cooldown ?? 2) * 1000;

    for (const enemy of inRange) {
      if (Math.random() < teleportChance) {
        if (bossStun > 0 && enemy.enemyType === 'pentagon') {
          enemy.applyStun(bossStun);
        } else {
          enemy.teleportBack(0.2);
        }
        this.cooldown = cdMs;
        return;
      }
    }
    this.cooldown = cdMs;
  }

  private drawPulse(): void {
    this.effectGfx.clear();
    const alpha = 0.12 + Math.sin(this.pulsePhase) * 0.08;
    const r = this.stats.range ?? 150;
    this.effectGfx.circle(0, 0, r * 0.3).fill({ color: 0x8b00ff, alpha });
  }
}
