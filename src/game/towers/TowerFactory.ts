import { TowerType } from '../../types';
import { Tower } from './Tower';
import { BulletTower } from './BulletTower';
import { LaserTower } from './LaserTower';
import { TeslaTower } from './TeslaTower';
import { MortarTower } from './MortarTower';
import { CryoTower } from './CryoTower';
import { AlchemistTower } from './AlchemistTower';
import { GoldMineTower } from './GoldMineTower';
import { VoidBeaconTower } from './VoidBeaconTower';
import { OracleTower } from './OracleTower';
import { OrbitalTower } from './OrbitalTower';

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
      case 'alchemist':
        return new AlchemistTower(row, col);
      case 'gold_mine':
        return new GoldMineTower(row, col);
      case 'void_beacon':
        return new VoidBeaconTower(row, col);
      case 'oracle':
        return new OracleTower(row, col);
      case 'orbital':
        return new OrbitalTower(row, col);
      default:
        throw new Error(`Tower type "${type}" is not yet implemented`);
    }
  }
}
