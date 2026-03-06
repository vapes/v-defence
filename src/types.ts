export enum CellType {
  Grass = 0,
  Road = 1,
  Spawn = 2,
  Base = 3,
}

export type TowerType =
  | 'bullet'
  | 'laser'
  | 'mortar'
  | 'cryo'
  | 'alchemist'
  | 'gold_mine'
  | 'tesla'
  | 'void_beacon'
  | 'oracle'
  | 'orbital';

export type EnemyType = 'circle' | 'circle2' | 'triangle' | 'hexagon' | 'square' | 'pentagon';

export interface Point {
  x: number;
  y: number;
}

export interface GridPosition {
  row: number;
  col: number;
}

export interface WaveGroup {
  type: EnemyType;
  count: number;
  spawnInterval: number;
  delayBefore: number;
}

export interface WaveConfig {
  groups: WaveGroup[];
}

export interface LevelConfig {
  id: number;
  name: string;
  startingMoney: number;
  lives: number;
  availableTowers: TowerType[];
  grid: number[][];
  waves: WaveConfig[];
}

export interface TowerLevelStats {
  level: number;
  cost: number;
  range?: number;
  // Standard attack
  damage?: number;
  fireRate?: number;
  // Laser
  baseDamage?: number;
  maxDamage?: number;
  rampUpTime?: number;
  // Mortar (AoE)
  aoeRadius?: number;
  stunDuration?: number;
  // Cryo (slow)
  slowFactor?: number;
  // Alchemist (DoT)
  dotDamage?: number;
  dotDuration?: number;
  armorShred?: number;
  // Gold Mine (economy)
  income?: number;
  interval?: number;
  killBonus?: number;
  // Tesla (chain lightning)
  chainTargets?: number;
  strikeChance?: number;
  strikeDamage?: number;
  // Void Beacon (teleport)
  teleportChance?: number;
  cooldown?: number;
  bossStun?: number;
  // Oracle (aura buff)
  rangeBonus?: number;
  speedBonus?: number;
  auraRadius?: number;
  revealStealth?: boolean;
  // Orbital (global sniper)
  ignoreArmor?: boolean;
}

export interface TowerConfig {
  type: string;
  levels: TowerLevelStats[];
}

export interface EnemyConfig {
  type: EnemyType;
  health: number;
  speed: number;
  reward: number;
  color: number;
  armor?: number;
}

export enum WaveState {
  Idle = 'idle',
  Building = 'building',
  Spawning = 'spawning',
  Waiting = 'waiting',
  Countdown = 'countdown',
  Complete = 'complete',
}
