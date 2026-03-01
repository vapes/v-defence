import { Tower } from './Tower';
import { TowerType } from '../../types';

export class BulletTower extends Tower {
  readonly towerType: TowerType = 'bullet';

  constructor(row: number, col: number) {
    super(row, col);
    this.drawTower();
  }

  drawTower(): void {
    this.base.clear();
    this.base.circle(0, 0, 22).fill(0x555555);
    this.base.circle(0, 0, 22).stroke({ color: 0x333333, width: 2 });

    const shade = this.level === 0 ? 0x888888 : this.level === 1 ? 0xaaaaaa : 0xdddddd;
    this.head.clear();
    this.head.rect(-5, -20, 10, 25).fill(shade);
    this.head.rect(-5, -20, 10, 25).stroke({ color: 0x333333, width: 1 });
  }
}
