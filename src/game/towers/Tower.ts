import { Container, Graphics } from 'pixi.js';
import { TowerType, TowerLevelStats } from '../../types';
import { Enemy } from '../enemies/Enemy';
import { towers as TOWER_CONFIGS } from '../../data/game-configs.json';

export abstract class Tower extends Container {
  abstract readonly towerType: TowerType;

  level: number = 0;
  gridRow: number;
  gridCol: number;
  totalInvested: number = 0;

  rangeBuff: number = 0;
  speedBuff: number = 0;

  protected base: Graphics;
  protected head: Graphics;
  protected rangeGfx: Graphics;
  private levelGfx: Graphics;
  private cooldownTimer: number = 0;
  showingRange: boolean = false;

  onFire?: (tower: Tower, target: Enemy) => void;

  constructor(row: number, col: number) {
    super();
    this.gridRow = row;
    this.gridCol = col;

    this.rangeGfx = new Graphics();
    this.rangeGfx.visible = false;
    this.addChild(this.rangeGfx);

    this.base = new Graphics();
    this.addChild(this.base);

    this.head = new Graphics();
    this.addChild(this.head);

    this.levelGfx = new Graphics();
    this.addChild(this.levelGfx);
  }

  abstract drawTower(): void;

  get stats(): TowerLevelStats {
    return TOWER_CONFIGS[this.towerType].levels[this.level];
  }

  get maxLevel(): number {
    return TOWER_CONFIGS[this.towerType].levels.length - 1;
  }

  get canUpgrade(): boolean {
    return this.level < this.maxLevel;
  }

  get upgradeCost(): number {
    if (!this.canUpgrade) return 0;
    return TOWER_CONFIGS[this.towerType].levels[this.level + 1].cost;
  }

  get sellValue(): number {
    return Math.floor(this.totalInvested * 0.7);
  }

  upgrade(): void {
    if (!this.canUpgrade) return;
    this.level++;
    this.totalInvested += this.stats.cost;
    this.drawTower();
    this.drawLevelGlow();
    this.drawRange();
  }

  private drawLevelGlow(): void {
    this.levelGfx.clear();
    if (this.level === 0) return;
    const color = this.level === 1 ? 0x5dade2 : 0xffd700;
    const alpha = this.level === 1 ? 0.5 : 0.7;
    const round: TowerType[] = ['bullet', 'tesla', 'alchemist', 'gold_mine', 'oracle'];
    if (round.includes(this.towerType)) {
      this.levelGfx.circle(0, 0, 26).stroke({ color, alpha, width: 2 });
    } else {
      this.levelGfx.roundRect(-26, -26, 52, 52, 10).stroke({ color, alpha, width: 2 });
    }

    const dotY = 20;
    for (let i = 0; i <= this.level; i++) {
      const dx = (i - this.level / 2) * 6;
      this.levelGfx.circle(dx, dotY, 2).fill({ color, alpha: alpha + 0.2 });
    }
  }

  get effectiveRange(): number {
    return (this.stats.range ?? 0) * (1 + this.rangeBuff);
  }

  get effectiveFireRate(): number {
    const base = this.stats.fireRate ?? 0;
    return base > 0 ? base * (1 - this.speedBuff) : base;
  }

  update(dt: number, enemies: Enemy[], _towers?: Tower[]): void {
    this.cooldownTimer -= dt * (1000 / 60);

    const target = this.findTarget(enemies);
    if (target) {
      this.rotateToTarget(target);
      if (this.cooldownTimer <= 0) {
        this.cooldownTimer = this.effectiveFireRate;
        this.onFire?.(this, target);
      }
    }
  }

  protected findTarget(enemies: Enemy[]): Enemy | null {
    let best: Enemy | null = null;
    let bestProgress = -1;
    const range = this.effectiveRange;

    for (const enemy of enemies) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= range && enemy.pathProgress > bestProgress) {
        best = enemy;
        bestProgress = enemy.pathProgress;
      }
    }
    return best;
  }

  protected findAllInRange(enemies: Enemy[]): Enemy[] {
    const range = this.effectiveRange;
    const result: Enemy[] = [];
    for (const enemy of enemies) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      if (Math.sqrt(dx * dx + dy * dy) <= range) {
        result.push(enemy);
      }
    }
    return result;
  }

  protected rotateToTarget(target: Enemy): void {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    this.head.rotation = Math.atan2(dy, dx) + Math.PI / 2;
  }

  setShowRange(show: boolean): void {
    this.showingRange = show;
    this.rangeGfx.visible = show;
    if (show) this.drawRange();
  }

  private drawRange(): void {
    this.rangeGfx.clear();
    const r = this.stats.range ?? 0;
    this.rangeGfx.circle(0, 0, r).fill({ color: 0xffff00, alpha: 0.1 });
    this.rangeGfx.circle(0, 0, r).stroke({ color: 0xffff00, alpha: 0.3, width: 1 });
  }
}
