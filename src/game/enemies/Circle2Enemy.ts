import { Enemy } from './Enemy';
import { EnemyType } from '../../types';

export class Circle2Enemy extends Enemy {
  readonly enemyType: EnemyType = 'circle2';

  constructor(health: number, speed: number, reward: number, color: number) {
    super(health, speed, reward, color);
    this.drawShape();
  }

  drawShape(): void {
    this.body.clear();
    this.body.circle(0, 0, 14).fill(this.color);
    this.body.circle(0, 0, 14).stroke({ color: 0x000000, alpha: 0.5, width: 3 });
    this.body.circle(0, 0, 7).stroke({ color: 0xffffff, alpha: 0.4, width: 2 });
  }
}
