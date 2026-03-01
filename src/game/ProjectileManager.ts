import { Container } from 'pixi.js';
import { Projectile } from './projectiles/Projectile';

export class ProjectileManager {
  projectiles: Projectile[] = [];
  private container: Container;

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);
  }

  add(proj: Projectile): void {
    this.projectiles.push(proj);
    this.container.addChild(proj);
  }

  update(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);
      if (p.done) {
        this.container.removeChild(p);
        p.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  clear(): void {
    for (const p of this.projectiles) {
      this.container.removeChild(p);
      p.destroy();
    }
    this.projectiles = [];
  }
}
