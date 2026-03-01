import { Enemy } from './Enemy';
import { EnemyType } from '../../types';

export class PentagonEnemy extends Enemy {
  readonly enemyType: EnemyType = 'pentagon';

  constructor(health: number, speed: number, reward: number, color: number) {
    super(health, speed, reward, color);
    this.drawShape();
  }

  drawShape(): void {
    const r = 20;
    const pts: number[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      pts.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    this.body.clear();
    this.body.poly(pts).fill(this.color);
    this.body.poly(pts).stroke({ color: 0xffffff, alpha: 0.6, width: 3 });
  }
}
