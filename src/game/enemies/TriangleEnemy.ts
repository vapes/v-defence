import { Enemy } from './Enemy';
import { EnemyType } from '../../types';

export class TriangleEnemy extends Enemy {
  readonly enemyType: EnemyType = 'triangle';

  constructor(health: number, speed: number, reward: number, color: number) {
    super(health, speed, reward, color);
    this.drawShape();
    this.healthBar.y = 5;
  }

  drawShape(): void {
    this.body.clear();
    this.body.poly([0, -14, 14, 12, -14, 12]).fill(this.color);
    this.body.poly([0, -14, 14, 12, -14, 12]).stroke({ color: 0x000000, alpha: 0.3, width: 2 });
  }
}
