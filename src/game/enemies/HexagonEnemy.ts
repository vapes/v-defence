import { Enemy } from './Enemy';
import { EnemyType } from '../../types';

export class HexagonEnemy extends Enemy {
  readonly enemyType: EnemyType = 'hexagon';

  constructor(health: number, speed: number, reward: number, color: number) {
    super(health, speed, reward, color);
    this.drawShape();
  }

  drawShape(): void {
    const r = 15;
    const pts: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      pts.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    this.body.clear();
    this.body.poly(pts).fill(this.color);
    this.body.poly(pts).stroke({ color: 0x000000, alpha: 0.3, width: 2 });
  }
}
