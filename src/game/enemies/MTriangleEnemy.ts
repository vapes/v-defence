import { Enemy } from './Enemy';
import { EnemyType } from '../../types';

export class MTriangleEnemy extends Enemy {
  readonly enemyType: EnemyType = 'mtriangle';

  constructor(health: number, speed: number, reward: number, color: number) {
    super(health, speed, reward, color);
    this.drawShape();
  }

  drawShape(): void {
    this.body.clear();
    this.body.poly([0, -8, 8, 7, -8, 7]).fill(this.color);
    this.body.poly([0, -8, 8, 7, -8, 7]).stroke({ color: 0x000000, alpha: 0.3, width: 1 });
  }
}
