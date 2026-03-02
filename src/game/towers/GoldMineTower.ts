import { Graphics } from 'pixi.js';
import { Tower } from './Tower';
import { TowerType } from '../../types';
import { Enemy } from '../enemies/Enemy';

export class GoldMineTower extends Tower {
  readonly towerType: TowerType = 'gold_mine';

  private timer: number = 0;
  onGoldGenerated?: (amount: number) => void;

  constructor(row: number, col: number) {
    super(row, col);
    this.drawTower();
  }

  drawTower(): void {
    this.base.clear();
    this.base.circle(0, 0, 22).fill(0x8b6914);
    this.base.circle(0, 0, 22).stroke({ color: 0x5d4e37, width: 2 });

    const shade = this.level === 0 ? 0xf39c12 : this.level === 1 ? 0xf1c40f : 0xffd700;
    this.head.clear();
    this.head.circle(0, -2, 10).fill(shade);
    this.head.circle(0, -2, 10).stroke({ color: 0xd68910, width: 1.5 });
    this.head.circle(0, -2, 4).fill(0xd68910);
  }

  update(dt: number, _enemies: Enemy[]): void {
    const dtMs = dt * (1000 / 60);
    const interval = (this.stats.interval ?? 10) * 1000;

    this.timer += dtMs;
    if (this.timer >= interval) {
      this.timer -= interval;
      const income = this.stats.income ?? 0;
      this.onGoldGenerated?.(income);
    }
  }
}
