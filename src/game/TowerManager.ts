import { Container } from 'pixi.js';
import { Tower } from './towers/Tower';
import { Enemy } from './enemies/Enemy';

export class TowerManager {
  towers: Tower[] = [];
  private container: Container;

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);
  }

  add(tower: Tower): void {
    this.towers.push(tower);
    this.container.addChild(tower);
  }

  remove(tower: Tower): void {
    const idx = this.towers.indexOf(tower);
    if (idx !== -1) {
      this.towers.splice(idx, 1);
      this.container.removeChild(tower);
      tower.destroy();
    }
  }

  update(dt: number, enemies: Enemy[]): void {
    for (const tower of this.towers) {
      tower.update(dt, enemies);
    }
  }

  deselectAll(): void {
    for (const tower of this.towers) {
      tower.setShowRange(false);
    }
  }

  clear(): void {
    for (const t of this.towers) {
      this.container.removeChild(t);
      t.destroy();
    }
    this.towers = [];
  }
}
