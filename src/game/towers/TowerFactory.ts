import { TowerType } from '../../types';
import { Tower } from './Tower';
import { BulletTower } from './BulletTower';
import { LaserTower } from './LaserTower';

export class TowerFactory {
  static create(type: TowerType, row: number, col: number): Tower {
    switch (type) {
      case 'bullet':
        return new BulletTower(row, col);
      case 'laser':
        return new LaserTower(row, col);
      default:
        throw new Error(`Tower type "${type}" is not yet implemented`);
    }
  }
}
