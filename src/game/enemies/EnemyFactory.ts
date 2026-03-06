import { EnemyType } from '../../types';
import { enemies as ENEMY_CONFIGS } from '../../data/game-configs.json';
import { Enemy } from './Enemy';
import { CircleEnemy } from './CircleEnemy';
import { Circle2Enemy } from './Circle2Enemy';
import { TriangleEnemy } from './TriangleEnemy';
import { HexagonEnemy } from './HexagonEnemy';
import { SquareEnemy } from './SquareEnemy';
import { PentagonEnemy } from './PentagonEnemy';
import { TitanEnemy } from './TitanEnemy';

export class EnemyFactory {
  static create(type: EnemyType, waveMultiplier: number = 1): Enemy {
    const cfg = ENEMY_CONFIGS[type];
    const health = Math.round(cfg.health * waveMultiplier);
    let enemy: Enemy;
    switch (type) {
      case 'circle':
        enemy = new CircleEnemy(health, cfg.speed, cfg.reward, cfg.color); break;
      case 'circle2':
        enemy = new Circle2Enemy(health, cfg.speed, cfg.reward, cfg.color); break;
      case 'triangle':
        enemy = new TriangleEnemy(health, cfg.speed, cfg.reward, cfg.color); break;
      case 'hexagon':
        enemy = new HexagonEnemy(health, cfg.speed, cfg.reward, cfg.color); break;
      case 'square':
        enemy = new SquareEnemy(health, cfg.speed, cfg.reward, cfg.color); break;
      case 'pentagon':
        enemy = new PentagonEnemy(health, cfg.speed, cfg.reward, cfg.color); break;
      case 'titan':
        enemy = new TitanEnemy(health, cfg.speed, cfg.reward, cfg.color); break;
      default:
        throw new Error(`Enemy type "${type}" is not yet implemented`);
    }
    enemy.armor = cfg.armor ?? 0;
    return enemy;
  }
}
