import { Graphics } from 'pixi.js';
import { Tower } from './Tower';
import { TowerType } from '../../types';
import { Enemy } from '../enemies/Enemy';

export class LaserTower extends Tower {
  readonly towerType: TowerType = 'laser';

  private currentTarget: Enemy | null = null;
  private focusTime: number = 0;
  private beamGfx: Graphics;

  constructor(row: number, col: number) {
    super(row, col);
    this.beamGfx = new Graphics();
    this.addChildAt(this.beamGfx, 0);
    this.drawTower();
  }

  drawTower(): void {
    this.base.clear();
    this.base.roundRect(-22, -22, 44, 44, 8).fill(0x2c3e50);
    this.base.roundRect(-22, -22, 44, 44, 8).stroke({ color: 0x1a252f, width: 2 });

    const shade = this.level === 0 ? 0xe74c3c : this.level === 1 ? 0xff6b6b : 0xff9999;
    this.head.clear();
    this.head.poly([0, -22, 8, -4, -8, -4]).fill(shade);
    this.head.poly([0, -22, 8, -4, -8, -4]).stroke({ color: 0x333333, width: 1 });
  }

  update(dt: number, enemies: Enemy[]): void {
    const target = this.findTarget(enemies);

    if (!target) {
      this.clearBeam();
      return;
    }

    if (target !== this.currentTarget) {
      this.currentTarget = target;
      this.focusTime = 0;
    }

    this.rotateToTarget(target);

    const dtSec = dt / 60;
    const { baseDamage = 0, maxDamage = 0, rampUpTime = 3 } = this.stats;
    const step = rampUpTime > 0 ? (maxDamage - baseDamage) / rampUpTime : 0;
    const t = Math.min(this.focusTime, rampUpTime);
    const dps = baseDamage + step * t;

    target.takeDamage(dps * dtSec);
    this.focusTime += dtSec;

    this.drawBeam(target, t / rampUpTime);
  }

  private drawBeam(target: Enemy, intensity: number): void {
    this.beamGfx.clear();
    const dx = target.x - this.x;
    const dy = target.y - this.y;

    const alpha = 0.4 + 0.6 * intensity;
    const width = 2 + 3 * intensity;
    this.beamGfx.moveTo(0, 0).lineTo(dx, dy).stroke({ color: 0xff0000, alpha, width });

    const glowAlpha = 0.1 + 0.15 * intensity;
    this.beamGfx.moveTo(0, 0).lineTo(dx, dy).stroke({ color: 0xff4444, alpha: glowAlpha, width: width + 4 });
  }

  private clearBeam(): void {
    this.beamGfx.clear();
    this.currentTarget = null;
    this.focusTime = 0;
  }
}
