import { Container, Graphics } from 'pixi.js';
import { Enemy } from '../enemies/Enemy';

export abstract class Projectile extends Container {
  damage: number;
  target: Enemy;
  done: boolean = false;
  protected gfx: Graphics;

  constructor(damage: number, target: Enemy, startX: number, startY: number) {
    super();
    this.damage = damage;
    this.target = target;
    this.x = startX;
    this.y = startY;
    this.gfx = new Graphics();
    this.addChild(this.gfx);
  }

  abstract update(dt: number): void;
}
