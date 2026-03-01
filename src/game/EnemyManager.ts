import { Container } from 'pixi.js';
import { Enemy } from './enemies/Enemy';
import { Point } from '../types';

export class EnemyManager {
  enemies: Enemy[] = [];
  private container: Container;
  private path: Point[] = [];

  onEnemyKilled?: (enemy: Enemy) => void;
  onEnemyReachedBase?: (enemy: Enemy) => void;

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);
  }

  setPath(path: Point[]): void {
    this.path = path;
  }

  spawn(enemy: Enemy): void {
    enemy.setPath(this.path);
    this.enemies.push(enemy);
    this.container.addChild(enemy);
  }

  update(dt: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy) break;
      enemy.update(dt);

      if (enemy.isDead) {
        this.onEnemyKilled?.(enemy);
        this.container.removeChild(enemy);
        enemy.destroy();
        this.enemies.splice(i, 1);
      } else if (enemy.reachedBase) {
        this.onEnemyReachedBase?.(enemy);
        this.container.removeChild(enemy);
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  get activeCount(): number {
    return this.enemies.length;
  }

  clear(): void {
    for (const e of this.enemies) {
      this.container.removeChild(e);
      e.destroy();
    }
    this.enemies = [];
  }
}
