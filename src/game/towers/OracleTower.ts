import { Graphics } from 'pixi.js';
import { Tower } from './Tower';
import { TowerType } from '../../types';
import { Enemy } from '../enemies/Enemy';

export class OracleTower extends Tower {
  readonly towerType: TowerType = 'oracle';

  private auraGfx: Graphics;
  private auraPhase: number = 0;

  constructor(row: number, col: number) {
    super(row, col);
    this.auraGfx = new Graphics();
    this.addChildAt(this.auraGfx, 0);
    this.drawTower();
  }

  drawTower(): void {
    this.base.clear();
    const rim = this.level === 0 ? 0x16a085 : this.level === 1 ? 0x1abc9c : 0x2ecc71;
    this.base.circle(0, 0, 20).fill(0x1a2a3a);
    this.base.circle(0, 0, 20).stroke({ color: rim, width: 2 });

    this.head.clear();
    this.head.circle(0, 0, 10).fill(rim);
    this.head.circle(0, 0, 10).stroke({ color: 0x0d6050, width: 1.5 });
    this.head.circle(0, 0, 4).fill(0xffffff);
  }

  update(dt: number, _enemies: Enemy[], towers?: Tower[]): void {
    this.auraPhase += dt * 0.03;
    this.drawAura();

    if (!towers) return;

    const { rangeBonus = 0, speedBonus = 0, auraRadius = 150 } = this.stats;

    for (const t of towers) {
      if (t === this) continue;
      const dx = t.x - this.x;
      const dy = t.y - this.y;
      if (Math.sqrt(dx * dx + dy * dy) <= auraRadius) {
        t.rangeBuff = Math.max(t.rangeBuff, rangeBonus);
        t.speedBuff = Math.max(t.speedBuff, speedBonus);
      }
    }
  }

  private drawAura(): void {
    this.auraGfx.clear();
    const r = this.stats.auraRadius ?? 150;
    const alpha = 0.06 + Math.sin(this.auraPhase) * 0.03;
    this.auraGfx.circle(0, 0, r).fill({ color: 0x1abc9c, alpha });
    this.auraGfx.circle(0, 0, r).stroke({ color: 0x1abc9c, alpha: alpha + 0.1, width: 1 });
  }
}
