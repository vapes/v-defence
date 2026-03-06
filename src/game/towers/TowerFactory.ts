import { TowerType } from '../../types';
import { Tower } from './Tower';
import { BulletTower } from './BulletTower';
import { LaserTower } from './LaserTower';
import { TeslaTower } from './TeslaTower';
import { MortarTower } from './MortarTower';
import { CryoTower } from './CryoTower';

export class TowerFactory {
  static create(type: TowerType, row: number, col: number): Tower {
    switch (type) {
      case 'bullet':
        return new BulletTower(row, col);
      case 'laser':
        return new LaserTower(row, col);
      case 'tesla':
        return new TeslaTower(row, col);
      case 'magic':
        return new MortarTower(row, col);
      case 'cryo':
        return new CryoTower(row, col);
      default:
        throw new Error(`Tower type "${type}" is not yet implemented`);
    }
  }
}
