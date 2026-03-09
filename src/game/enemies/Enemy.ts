import { Container, Graphics } from 'pixi.js';
import { Point, EnemyType } from '../../types';
import { HealthBar } from './HealthBar';
import { CELL_SIZE } from '../../constants';

export interface DotEffect {
  dps: number;
  remaining: number;
  armorShred: number;
}

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

  armor: number = 0;

  slowFactor: number = 0;
  slowTimer: number = 0;
  stunTimer: number = 0;
  dots: DotEffect[] = [];
  armorShred: number = 0;

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
    this.healthBar.updateHealth(1, this.health, this.maxHealth);
  }

  abstract drawShape(): void;

  setPath(path: Point[]): void {
    this.path = path;
    if (path.length > 0) {
      this.x = path[0].x;
      this.y = path[0].y;
    }
  }

  applySlow(factor: number, duration: number): void {
    if (factor > this.slowFactor) this.slowFactor = factor;
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  applyStun(duration: number): void {
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  applyDot(dps: number, duration: number, shred: number = 0): void {
    this.dots.push({ dps, remaining: duration, armorShred: shred });
  }

  teleportBack(fraction: number): void {
    const totalSegments = this.path.length - 1;
    if (totalSegments <= 0) return;

    const currentPos = this.waypointIndex + this.progress;
    const moveBack = fraction * totalSegments;
    const newPos = Math.max(0, currentPos - moveBack);

    this.waypointIndex = Math.floor(newPos);
    this.progress = newPos - this.waypointIndex;

    if (this.waypointIndex < this.path.length - 1) {
      const from = this.path[this.waypointIndex];
      const to = this.path[this.waypointIndex + 1];
      this.x = from.x + (to.x - from.x) * this.progress;
      this.y = from.y + (to.y - from.y) * this.progress;
    }
  }

  update(dt: number): void {
    if (this.isDead || this.reachedBase || this.path.length < 2) return;

    const dtSec = dt / 60;

    this.tickDots(dtSec);

    if (this.stunTimer > 0) {
      this.stunTimer -= dtSec;
      return;
    }

    if (this.slowTimer > 0) this.slowTimer -= dtSec;

    const effSpeed = this.slowTimer > 0
      ? this.speed * (1 - this.slowFactor)
      : this.speed;

    if (this.slowTimer <= 0) this.slowFactor = 0;

    const from = this.path[this.waypointIndex];
    const to = this.path[this.waypointIndex + 1];
    if (!to) {
      this.reachedBase = true;
      return;
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveAmount = (effSpeed * dt * 60) / (dist > 0 ? dist : 1);

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

  private tickDots(dtSec: number): void {
    let maxShred = 0;
    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      this.takeDamage(dot.dps * dtSec);
      if (dot.armorShred > maxShred) maxShred = dot.armorShred;
      dot.remaining -= dtSec;
      if (dot.remaining <= 0) this.dots.splice(i, 1);
    }
    this.armorShred = maxShred;
  }

  takeDamage(amount: number, ignoresArmor = false): void {
    if (!ignoresArmor && this.armor > 0) {
      const effectiveArmor = Math.max(0, this.armor / 100 - this.armorShred);
      amount *= (1 - effectiveArmor);
    }
    this.health -= amount;
    const ratio = Math.max(0, this.health / this.maxHealth);
    this.healthBar.updateHealth(ratio, this.health, this.maxHealth);
    const v = Math.round(0x33 + (0xff - 0x33) * ratio);
    this.body.tint = (v << 16) | (v << 8) | v;
    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  get pathProgress(): number {
    return this.waypointIndex + this.progress;
  }
}
