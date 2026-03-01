import { Container, Graphics } from 'pixi.js';
import { TowerType, TowerLevelStats } from '../../types';
import { Enemy } from '../enemies/Enemy';
import TOWER_CONFIGS from '../../data/tower-configs.json';

export abstract class Tower extends Container {
  abstract readonly towerType: TowerType;

  level: number = 0;
  gridRow: number;
  gridCol: number;
  totalInvested: number = 0;

  protected base: Graphics;
  protected head: Graphics;
  protected rangeGfx: Graphics;
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
    this.drawRange();
  }

  update(dt: number, enemies: Enemy[]): void {
    this.cooldownTimer -= dt * (1000 / 60);

    const target = this.findTarget(enemies);
    if (target) {
      this.rotateToTarget(target);
      if (this.cooldownTimer <= 0) {
        this.cooldownTimer = this.stats.fireRate;
        this.onFire?.(this, target);
      }
    }
  }

  private findTarget(enemies: Enemy[]): Enemy | null {
    let best: Enemy | null = null;
    let bestProgress = -1;
    const range = this.stats.range;

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

  private rotateToTarget(target: Enemy): void {
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
    this.rangeGfx.circle(0, 0, this.stats.range).fill({ color: 0xffff00, alpha: 0.1 });
    this.rangeGfx.circle(0, 0, this.stats.range).stroke({ color: 0xffff00, alpha: 0.3, width: 1 });
  }
}
