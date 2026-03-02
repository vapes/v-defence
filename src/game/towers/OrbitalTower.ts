import { Graphics } from 'pixi.js';
import { Tower } from './Tower';
import { TowerType } from '../../types';
import { Enemy } from '../enemies/Enemy';

const BEAM_DURATION = 30;

export class OrbitalTower extends Tower {
  readonly towerType: TowerType = 'orbital';

  private cooldown: number = 0;
  private beamGfx: Graphics;
  private beamTimer: number = 0;
  private beamTarget: { x: number; y: number } | null = null;

  constructor(row: number, col: number) {
    super(row, col);
    this.beamGfx = new Graphics();
    this.addChildAt(this.beamGfx, 0);
    this.drawTower();
  }

  drawTower(): void {
    this.base.clear();
    this.base.roundRect(-20, -20, 40, 40, 8).fill(0x1a1a2e);
    this.base.roundRect(-20, -20, 40, 40, 8).stroke({ color: 0x2c3e50, width: 2 });

    const shade = this.level === 0 ? 0xe74c3c : this.level === 1 ? 0xff6b6b : 0xff4757;
    this.head.clear();
    this.head.circle(0, 0, 10).fill(shade);
    this.head.circle(0, 0, 10).stroke({ color: 0x922b21, width: 1.5 });
    this.head.rect(-1, -14, 2, 8).fill(shade);
    this.head.rect(-1, 6, 2, 8).fill(shade);
    this.head.rect(-14, -1, 8, 2).fill(shade);
    this.head.rect(6, -1, 8, 2).fill(shade);
  }

  update(dt: number, enemies: Enemy[]): void {
    const dtMs = dt * (1000 / 60);
    this.cooldown -= dtMs;
    this.updateBeam(dt);

    if (this.cooldown > 0) return;

    let target: Enemy | null = null;
    let maxHp = 0;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      if (enemy.health > maxHp) {
        maxHp = enemy.health;
        target = enemy;
      }
    }
    if (!target) return;

    const { damage = 200, ignoreArmor = false, cooldown: cd = 8 } = this.stats;
    target.takeDamage(ignoreArmor ? damage : damage);

    this.beamTarget = { x: target.x - this.x, y: target.y - this.y };
    this.beamTimer = BEAM_DURATION;
    this.cooldown = cd * 1000;
  }

  private updateBeam(dt: number): void {
    if (this.beamTimer > 0) {
      this.beamTimer -= dt;
      this.drawBeam();
    } else {
      this.beamGfx.clear();
      this.beamTarget = null;
    }
  }

  private drawBeam(): void {
    this.beamGfx.clear();
    if (!this.beamTarget) return;

    const alpha = this.beamTimer / BEAM_DURATION;
    const { x: tx, y: ty } = this.beamTarget;

    this.beamGfx.moveTo(0, 0).lineTo(tx, ty);
    this.beamGfx.stroke({ color: 0xff0000, alpha, width: 3 });
    this.beamGfx.moveTo(0, 0).lineTo(tx, ty);
    this.beamGfx.stroke({ color: 0xff6666, alpha: alpha * 0.3, width: 8 });
    this.beamGfx.circle(tx, ty, 10 * alpha).fill({ color: 0xff0000, alpha: alpha * 0.5 });
  }
}
