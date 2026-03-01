import { Graphics } from 'pixi.js';
import { COLORS } from '../../constants';

export class HealthBar extends Graphics {
  private barWidth = 40;
  private barHeight = 5;

  constructor() {
    super();
    this.y = -22;
  }

  updateHealth(ratio: number): void {
    this.clear();
    const x = -this.barWidth / 2;
    this.rect(x, 0, this.barWidth, this.barHeight).fill(COLORS.healthRed);
    this.rect(x, 0, this.barWidth * Math.max(0, ratio), this.barHeight).fill(COLORS.healthGreen);
  }
}
