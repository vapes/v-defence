import { Graphics } from 'pixi.js';
import { Tower } from './Tower';
import { TowerType } from '../../types';
import { Enemy } from '../enemies/Enemy';

const BLOB_FLIGHT = 20; // frames (~0.33s at 60fps)

interface PoisonBlob {
  sx: number; sy: number;
  target: Enemy;
  progress: number;
  dotDps: number;
  dotDuration: number;
  armorShred: number;
}

export class AlchemistTower extends Tower {
  readonly towerType: TowerType = 'alchemist';

  private cooldown: number = 0;
  private blobs: PoisonBlob[] = [];
  private blobGfx: Graphics;

  constructor(row: number, col: number) {
    super(row, col);
    this.blobGfx = new Graphics();
    this.addChildAt(this.blobGfx, 0);
    this.drawTower();
  }

  drawTower(): void {
    this.base.clear();
    this.base.circle(0, 0, 22).fill(0x2d2b55);
    this.base.circle(0, 0, 22).stroke({ color: 0x1a1840, width: 2 });

    const shade = this.level === 0 ? 0x27ae60 : this.level === 1 ? 0x2ecc71 : 0xa8e6cf;
    this.head.clear();
    // Flask body
    this.head.roundRect(-5, -14, 10, 12, 2).fill(shade);
    this.head.roundRect(-5, -14, 10, 12, 2).stroke({ color: 0x1e8449, width: 1 });
    // Flask neck
    this.head.rect(-3, -18, 6, 5).fill(shade);
    // Bubbles
    this.head.circle(-2, -10, 1.5).fill(0xf1c40f);
    this.head.circle(2, -8, 1).fill(0xf1c40f);
  }

  update(dt: number, enemies: Enemy[]): void {
    const dtMs = dt * (1000 / 60);
    this.cooldown -= dtMs;

    this.updateBlobs(dt);

    const target = this.findTarget(enemies);
    if (!target) return;

    this.rotateToTarget(target);

    if (this.cooldown <= 0) {
      this.cooldown = this.stats.fireRate ?? 2000;
      const { dotDamage = 5, dotDuration = 3, armorShred = 0 } = this.stats;
      this.blobs.push({
        sx: 0, sy: 0,
        target,
        progress: 0,
        dotDps: dotDamage,
        dotDuration,
        armorShred,
      });
    }
  }

  private updateBlobs(dt: number): void {
    this.blobGfx.clear();

    for (let i = this.blobs.length - 1; i >= 0; i--) {
      const b = this.blobs[i];
      b.progress += dt / BLOB_FLIGHT;

      if (b.target.isDead || b.target.reachedBase) {
        this.blobs.splice(i, 1);
        continue;
      }

      if (b.progress >= 1) {
        b.target.applyDot(b.dotDps, b.dotDuration, b.armorShred);
        this.blobs.splice(i, 1);
        continue;
      }

      const tx = b.target.x - this.x;
      const ty = b.target.y - this.y;
      const cx = b.sx + (tx - b.sx) * b.progress;
      const cy = b.sy + (ty - b.sy) * b.progress;
      const arc = -Math.sin(b.progress * Math.PI) * 15;

      this.blobGfx.circle(cx, cy + arc, 4).fill({ color: 0x27ae60, alpha: 0.9 });
      this.blobGfx.circle(cx, cy + arc, 2).fill({ color: 0xf1c40f, alpha: 0.6 });
    }
  }
}
