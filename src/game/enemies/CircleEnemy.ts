import { Enemy } from './Enemy';
import { EnemyType } from '../../types';

export class CircleEnemy extends Enemy {
  readonly enemyType: EnemyType = 'circle';

  constructor(health: number, speed: number, reward: number, color: number) {
    super(health, speed, reward, color);
    this.drawShape();
  }

  drawShape(): void {
    this.body.clear();
    this.body.circle(0, 0, 14).fill(this.color);
    this.body.circle(0, 0, 14).stroke({ color: 0x000000, alpha: 0.3, width: 2 });
  }
}
