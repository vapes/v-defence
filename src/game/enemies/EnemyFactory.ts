import { EnemyType } from '../../types';
import { ENEMY_CONFIGS } from '../../data/enemy-configs';
import { Enemy } from './Enemy';
import { CircleEnemy } from './CircleEnemy';
import { TriangleEnemy } from './TriangleEnemy';
import { HexagonEnemy } from './HexagonEnemy';
import { SquareEnemy } from './SquareEnemy';
import { PentagonEnemy } from './PentagonEnemy';

export class EnemyFactory {
  static create(type: EnemyType, waveMultiplier: number = 1): Enemy {
    const cfg = ENEMY_CONFIGS[type];
    const health = Math.round(cfg.health * waveMultiplier);
    switch (type) {
      case 'circle':
        return new CircleEnemy(health, cfg.speed, cfg.reward, cfg.color);
      case 'triangle':
        return new TriangleEnemy(health, cfg.speed, cfg.reward, cfg.color);
      case 'hexagon':
        return new HexagonEnemy(health, cfg.speed, cfg.reward, cfg.color);
      case 'square':
        return new SquareEnemy(health, cfg.speed, cfg.reward, cfg.color);
      case 'pentagon':
        return new PentagonEnemy(health, cfg.speed, cfg.reward, cfg.color);
      default:
        throw new Error(`Enemy type "${type}" is not yet implemented`);
    }
  }
}
