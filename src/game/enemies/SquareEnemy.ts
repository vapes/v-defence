import { Enemy } from './Enemy';
import { EnemyType } from '../../types';

export class SquareEnemy extends Enemy {
  readonly enemyType: EnemyType = 'square';

  constructor(health: number, speed: number, reward: number, color: number) {
    super(health, speed, reward, color);
    this.drawShape();
  }

  drawShape(): void {
    this.body.clear();
    this.body.rect(-12, -12, 24, 24).fill(this.color);
    this.body.rect(-12, -12, 24, 24).stroke({ color: 0x000000, alpha: 0.3, width: 2 });
  }
}
