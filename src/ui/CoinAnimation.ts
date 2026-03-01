import { Container, Graphics } from 'pixi.js';

interface CoinParticle {
  gfx: Graphics;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
}

export class CoinAnimation extends Container {
  private particles: CoinParticle[] = [];

  spawn(fromX: number, fromY: number, toX: number, toY: number): void {
    const gfx = new Graphics();
    gfx.circle(0, 0, 6).fill(0xffd700);
    gfx.circle(0, 0, 6).stroke({ color: 0xb8860b, width: 1.5 });
    this.addChild(gfx);

    this.particles.push({
      gfx,
      x: fromX,
      y: fromY,
      targetX: toX,
      targetY: toY,
      progress: 0,
      speed: 0.04 + Math.random() * 0.02,
    });
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.progress += p.speed * dt;
      if (p.progress >= 1) {
        this.removeChild(p.gfx);
        p.gfx.destroy();
        this.particles.splice(i, 1);
        continue;
      }
      const t = p.progress;
      const ease = t * t * (3 - 2 * t);
      p.gfx.x = p.x + (p.targetX - p.x) * ease;
      p.gfx.y = p.y + (p.targetY - p.y) * ease - Math.sin(t * Math.PI) * 40;
    }
  }
}
