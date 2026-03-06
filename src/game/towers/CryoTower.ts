import { Graphics } from 'pixi.js';
import { Tower } from './Tower';
import { TowerType } from '../../types';
import { Enemy } from '../enemies/Enemy';

const SLOW_DURATION = 0.5;

export class CryoTower extends Tower {
  readonly towerType: TowerType = 'cryo';

  private auraGfx: Graphics;
  private orbitGfx: Graphics;
  private pulsePhase: number = 0;
  private orbitAngle: number = 0;

  constructor(row: number, col: number) {
    super(row, col);
    this.auraGfx = new Graphics();
    this.addChildAt(this.auraGfx, 0);
    // orbitGfx goes above head (index 4) but below levelGfx
    this.orbitGfx = new Graphics();
    this.addChildAt(this.orbitGfx, 4);
    this.drawTower();
  }

  drawTower(): void {
    // ── Base: dark hex with glowing border + layered inner orb ──
    this.base.clear();
    const sides = 6;
    const r = 20;
    const pts: number[] = [];
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
      pts.push(Math.cos(a) * r, Math.sin(a) * r);
    }

    // Outer soft glow
    this.base.circle(0, 0, r + 5).fill({ color: 0x00e5ff, alpha: 0.08 });
    // Hex body
    this.base.poly(pts).fill(0x0a1628);
    this.base.poly(pts).stroke({ color: 0x00e5ff, width: 1.5 });

    // Inner glow orb (layered circles)
    this.base.circle(0, 0, 12).fill({ color: 0x00bcd4, alpha: 0.25 });
    this.base.circle(0, 0, 8).fill({ color: 0x26c6da, alpha: 0.4 });
    this.base.circle(0, 0, 5).fill({ color: 0x80deea, alpha: 0.7 });
    this.base.circle(0, 0, 2.5).fill({ color: 0xffffff, alpha: 0.9 });

    // ── Head: snowflake ──
    const color = this.level === 0 ? 0x00e5ff : this.level === 1 ? 0x4dd0e1 : 0xb2ebf2;
    this.head.clear();
    this.drawSnowflake(this.head, color);
  }

  private drawSnowflake(g: Graphics, color: number): void {
    const ARM = 12;
    const BRANCH = 4.5;
    const BP = 0.48;
    const lw = 1.5;

    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      const ax = Math.cos(a) * ARM;
      const ay = Math.sin(a) * ARM;

      g.moveTo(0, 0).lineTo(ax, ay).stroke({ color, width: lw, alpha: 0.95 });

      const bx = Math.cos(a) * ARM * BP;
      const by = Math.sin(a) * ARM * BP;
      g.moveTo(bx, by)
        .lineTo(bx + Math.cos(a + Math.PI / 3) * BRANCH, by + Math.sin(a + Math.PI / 3) * BRANCH)
        .stroke({ color, width: lw, alpha: 0.85 });
      g.moveTo(bx, by)
        .lineTo(bx + Math.cos(a - Math.PI / 3) * BRANCH, by + Math.sin(a - Math.PI / 3) * BRANCH)
        .stroke({ color, width: lw, alpha: 0.85 });
    }
    // Center
    g.circle(0, 0, 2).fill({ color: 0xffffff, alpha: 0.95 });
  }

  private drawOrbits(angle: number): void {
    this.orbitGfx.clear();
    const count = 3;
    const R = 17;
    const color = this.level === 2 ? 0xb2ebf2 : 0x00e5ff;

    for (let i = 0; i < count; i++) {
      const a = angle + (Math.PI * 2 * i) / count;
      const cx = Math.cos(a) * R;
      const cy = Math.sin(a) * R;
      const s = 3.5;
      // Diamond shard
      this.orbitGfx
        .poly([cx, cy - s, cx + s * 0.55, cy, cx, cy + s * 0.7, cx - s * 0.55, cy])
        .fill({ color, alpha: 0.9 });
      // Tiny glow dot
      this.orbitGfx.circle(cx, cy, 1.5).fill({ color: 0xffffff, alpha: 0.6 });
    }
  }

  update(dt: number, enemies: Enemy[]): void {
    const dtSec = dt / 60;
    this.pulsePhase += dtSec;

    // Snowflake rotates slowly clockwise
    this.head.rotation += dtSec * Math.PI * 0.35;
    // Crystals orbit counter-clockwise, faster
    this.orbitAngle -= dtSec * Math.PI * 1.1;
    this.drawOrbits(this.orbitAngle);

    const inRange = this.findAllInRange(enemies);
    const { slowFactor = 0.2, damage = 2 } = this.stats;
    const dps = damage;

    for (const enemy of inRange) {
      enemy.applySlow(slowFactor, SLOW_DURATION);
      enemy.takeDamage(dps * dtSec);
    }

    this.drawAura(inRange.length > 0);
  }

  private drawAura(active: boolean): void {
    this.auraGfx.clear();
    const range = this.stats.range ?? 100;
    const pulse = Math.sin(this.pulsePhase * 2) * 0.025;
    const alpha = active ? 0.11 + pulse : 0.04;
    this.auraGfx.circle(0, 0, range).fill({ color: 0x00bcd4, alpha });
    this.auraGfx.circle(0, 0, range).stroke({ color: 0x00e5ff, alpha: alpha + 0.12, width: 1 });
  }
}
