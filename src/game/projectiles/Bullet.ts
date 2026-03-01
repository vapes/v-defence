import { Projectile } from './Projectile';
import { Enemy } from '../enemies/Enemy';

export class Bullet extends Projectile {
  private speed = 6;

  constructor(damage: number, target: Enemy, startX: number, startY: number) {
    super(damage, target, startX, startY);
    this.gfx.circle(0, 0, 4).fill(0xffd700);
  }

  update(dt: number): void {
    if (this.done) return;

    if (this.target.isDead || this.target.reachedBase) {
      this.done = true;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      this.target.takeDamage(this.damage);
      this.done = true;
      return;
    }

    this.x += (dx / dist) * this.speed * dt;
    this.y += (dy / dist) * this.speed * dt;
  }
}
