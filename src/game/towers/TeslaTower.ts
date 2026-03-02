import { Graphics } from 'pixi.js';
import { Tower } from './Tower';
import { TowerType } from '../../types';
import { Enemy } from '../enemies/Enemy';

const CHAIN_RANGE = 80;
const BOLT_DURATION = 12;

interface LightningBolt {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  lifetime: number;
}

export class TeslaTower extends Tower {
  readonly towerType: TowerType = 'tesla';

  private cooldown: number = 0;
  private boltGfx: Graphics;
  private bolts: LightningBolt[] = [];

  constructor(row: number, col: number) {
    super(row, col);
    this.boltGfx = new Graphics();
    this.addChildAt(this.boltGfx, 0);
    this.drawTower();
  }

  drawTower(): void {
    this.base.clear();
    this.base.circle(0, 0, 22).fill(0x1a2a3a);
    this.base.circle(0, 0, 22).stroke({ color: 0x0d1520, width: 2 });

    const shade = this.level === 0 ? 0x3498db : this.level === 1 ? 0x5dade2 : 0x85c1e9;
    this.head.clear();
    this.head.rect(-3, -8, 6, 14).fill(shade);
    this.head.circle(0, -12, 7).fill(shade);
    this.head.circle(0, -12, 7).stroke({ color: 0x1a6fa0, width: 1.5 });
  }

  update(dt: number, enemies: Enemy[]): void {
    const dtMs = dt * (1000 / 60);
    this.cooldown -= dtMs;

    this.updateBolts(dt);

    const target = this.findTarget(enemies);
    if (!target) return;

    this.rotateToTarget(target);

    if (this.cooldown <= 0) {
      this.cooldown = this.stats.fireRate ?? 1000;
      this.fireChainLightning(target, enemies);
    }
  }

  private fireChainLightning(primary: Enemy, enemies: Enemy[]): void {
    const { damage = 0, chainTargets = 3, strikeChance = 0, strikeDamage = 0 } = this.stats;
    const hit = new Set<Enemy>();

    let prev = { x: this.x, y: this.y };
    let current: Enemy | null = primary;

    for (let i = 0; i < chainTargets && current; i++) {
      current.takeDamage(damage);
      hit.add(current);

      this.bolts.push({
        fromX: prev.x - this.x,
        fromY: prev.y - this.y,
        toX: current.x - this.x,
        toY: current.y - this.y,
        lifetime: BOLT_DURATION,
      });

      if (strikeChance > 0 && Math.random() < strikeChance) {
        current.takeDamage(strikeDamage);
        this.bolts.push({
          fromX: current.x - this.x,
          fromY: current.y - this.y - 400,
          toX: current.x - this.x,
          toY: current.y - this.y,
          lifetime: BOLT_DURATION * 1.5,
        });
      }

      prev = { x: current.x, y: current.y };
      current = this.findChainTarget(prev, enemies, hit);
    }
  }

  private findChainTarget(
    from: { x: number; y: number },
    enemies: Enemy[],
    hit: Set<Enemy>,
  ): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = CHAIN_RANGE;

    for (const enemy of enemies) {
      if (hit.has(enemy) || enemy.isDead) continue;
      const dx = enemy.x - from.x;
      const dy = enemy.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        best = enemy;
        bestDist = dist;
      }
    }
    return best;
  }

  private updateBolts(dt: number): void {
    this.boltGfx.clear();

    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const bolt = this.bolts[i];
      bolt.lifetime -= dt;
      if (bolt.lifetime <= 0) {
        this.bolts.splice(i, 1);
        continue;
      }
      const alpha = bolt.lifetime / BOLT_DURATION;
      this.drawLightning(bolt.fromX, bolt.fromY, bolt.toX, bolt.toY, alpha);
    }
  }

  private drawLightning(
    x1: number, y1: number,
    x2: number, y2: number,
    alpha: number,
  ): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const perpX = -dy / len;
    const perpY = dx / len;
    const jitter = len * 0.15;
    const segments = 6;

    this.boltGfx.moveTo(x1, y1);
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const mx = x1 + dx * t + perpX * (Math.random() - 0.5) * jitter;
      const my = y1 + dy * t + perpY * (Math.random() - 0.5) * jitter;
      this.boltGfx.lineTo(mx, my);
    }
    this.boltGfx.lineTo(x2, y2);
    this.boltGfx.stroke({ color: 0x00bfff, alpha, width: 2.5 });

    this.boltGfx.moveTo(x1, y1).lineTo(x2, y2);
    this.boltGfx.stroke({ color: 0x87ceeb, alpha: alpha * 0.3, width: 6 });
  }
}
