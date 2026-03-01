import { Container, Graphics } from 'pixi.js';
import { Point, EnemyType } from '../../types';
import { HealthBar } from './HealthBar';
import { CELL_SIZE } from '../../constants';

export abstract class Enemy extends Container {
  abstract readonly enemyType: EnemyType;

  maxHealth: number;
  health: number;
  speed: number;
  reward: number;
  color: number;

  waypointIndex: number = 0;
  progress: number = 0;
  isDead: boolean = false;
  reachedBase: boolean = false;

  protected body: Graphics;
  protected healthBar: HealthBar;
  private path: Point[] = [];

  constructor(health: number, speed: number, reward: number, color: number) {
    super();
    this.maxHealth = health;
    this.health = health;
    this.speed = speed;
    this.reward = reward;
    this.color = color;

    this.body = new Graphics();
    this.addChild(this.body);

    this.healthBar = new HealthBar();
    this.addChild(this.healthBar);
    this.healthBar.updateHealth(1);
  }

  abstract drawShape(): void;

  setPath(path: Point[]): void {
    this.path = path;
    if (path.length > 0) {
      this.x = path[0].x;
      this.y = path[0].y;
    }
  }

  update(dt: number): void {
    if (this.isDead || this.reachedBase || this.path.length < 2) return;

    const from = this.path[this.waypointIndex];
    const to = this.path[this.waypointIndex + 1];
    if (!to) {
      this.reachedBase = true;
      return;
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveAmount = (this.speed * dt * 60) / (dist > 0 ? dist : 1);

    this.progress += moveAmount / 60;

    if (this.progress >= 1) {
      this.waypointIndex++;
      this.progress = 0;
      if (this.waypointIndex >= this.path.length - 1) {
        this.reachedBase = true;
        return;
      }
    }

    const cp = this.progress;
    const currFrom = this.path[this.waypointIndex];
    const currTo = this.path[this.waypointIndex + 1];
    if (currTo) {
      this.x = currFrom.x + (currTo.x - currFrom.x) * cp;
      this.y = currFrom.y + (currTo.y - currFrom.y) * cp;
    }
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    this.healthBar.updateHealth(this.health / this.maxHealth);
    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  get pathProgress(): number {
    return this.waypointIndex + this.progress;
  }
}
