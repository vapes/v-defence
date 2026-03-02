import { Graphics } from 'pixi.js';
import { Tower } from './Tower';
import { TowerType } from '../../types';
import { Enemy } from '../enemies/Enemy';

const SLOW_DURATION = 0.5; // seconds — refreshed every frame while in range

export class CryoTower extends Tower {
  readonly towerType: TowerType = 'cryo';

  private auraGfx: Graphics;
  private pulsePhase: number = 0;

  constructor(row: number, col: number) {
    super(row, col);
    this.auraGfx = new Graphics();
    this.addChildAt(this.auraGfx, 0);
    this.drawTower();
  }

  drawTower(): void {
    this.base.clear();
    const sides = 6;
    const r = 22;
    const pts: number[] = [];
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
      pts.push(Math.cos(a) * r, Math.sin(a) * r);
    }
    this.base.poly(pts).fill(0x2c3e50);
    this.base.poly(pts).stroke({ color: 0x1a252f, width: 2 });

    const shade = this.level === 0 ? 0x00bcd4 : this.level === 1 ? 0x4dd0e1 : 0x80deea;
    this.head.clear();
    this.head.poly([0, -16, 6, -4, -6, -4]).fill(shade);
    this.head.poly([0, -16, 6, -4, -6, -4]).stroke({ color: 0x006064, width: 1 });
    this.head.circle(0, -6, 3).fill(0xb2ebf2);
  }

  update(dt: number, enemies: Enemy[]): void {
    const dtSec = dt / 60;
    this.pulsePhase += dtSec;

    const inRange = this.findAllInRange(enemies);
    const { slowFactor = 0.2, damage = 2 } = this.stats;
    const dps = damage;

    for (const enemy of inRange) {
      enemy.applySlow(slowFactor, SLOW_DURATION);
      enemy.takeDamage(dps * dtSec);
    }

    if (inRange.length > 0) {
      this.rotateToTarget(inRange[0]);
    }

    this.drawAura(inRange.length > 0);
  }

  private drawAura(active: boolean): void {
    this.auraGfx.clear();
    const range = this.stats.range ?? 100;
    const pulse = Math.sin(this.pulsePhase * 3) * 0.03;
    const baseAlpha = active ? 0.12 + pulse : 0.05;
    this.auraGfx.circle(0, 0, range).fill({ color: 0x00bcd4, alpha: baseAlpha });
    this.auraGfx.circle(0, 0, range).stroke({ color: 0x4dd0e1, alpha: baseAlpha + 0.1, width: 1 });
  }
}
