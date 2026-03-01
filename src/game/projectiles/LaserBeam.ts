import { Projectile } from './Projectile';
import { Enemy } from '../enemies/Enemy';

export class LaserBeam extends Projectile {
  private lifetime = 10;
  private maxLifetime = 10;
  private targetX: number;
  private targetY: number;

  constructor(damage: number, target: Enemy, startX: number, startY: number) {
    super(damage, target, startX, startY);
    this.targetX = target.x;
    this.targetY = target.y;
    target.takeDamage(damage);
    this.drawBeam(1);
  }

  private drawBeam(alpha: number): void {
    this.gfx.clear();
    this.gfx.moveTo(0, 0);
    this.gfx.lineTo(this.targetX - this.x, this.targetY - this.y);
    this.gfx.stroke({ color: 0xff0000, alpha, width: 3 });
  }

  update(dt: number): void {
    if (this.done) return;
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.done = true;
      return;
    }
    this.drawBeam(this.lifetime / this.maxLifetime);
  }
}
