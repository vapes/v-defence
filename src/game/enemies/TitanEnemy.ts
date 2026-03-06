import { Enemy } from './Enemy';
import { EnemyType } from '../../types';

export class TitanEnemy extends Enemy {
  readonly enemyType: EnemyType = 'titan';

  constructor(health: number, speed: number, reward: number, color: number) {
    super(health, speed, reward, color);
    this.drawShape();
  }

  drawShape(): void {
    const s = 22;
    this.body.clear();
    this.body.rect(-s, -s, s * 2, s * 2).fill(this.color);
    this.body.rect(-s, -s, s * 2, s * 2).stroke({ color: 0xffffff, alpha: 0.6, width: 4 });
    this.body.rect(-s + 7, -s + 7, s * 2 - 14, s * 2 - 14).stroke({ color: 0xaaaaaa, alpha: 0.35, width: 2 });
  }
}
