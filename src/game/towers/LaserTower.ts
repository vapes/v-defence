import { Tower } from './Tower';
import { TowerType } from '../../types';

export class LaserTower extends Tower {
  readonly towerType: TowerType = 'laser';

  constructor(row: number, col: number) {
    super(row, col);
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
}
