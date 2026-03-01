export enum CellType {
  Grass = 0,
  Road = 1,
  Spawn = 2,
  Base = 3,
}

export type TowerType = 'bullet' | 'laser';
export type EnemyType = 'circle' | 'triangle' | 'hexagon' | 'square';

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
  damage: number;
  fireRate: number;
  range: number;
  cost: number;
}

export interface TowerConfig {
  type: TowerType;
  levels: TowerLevelStats[];
}

export interface EnemyConfig {
  type: EnemyType;
  health: number;
  speed: number;
  reward: number;
  color: number;
}

export enum WaveState {
  Idle = 'idle',
  Building = 'building',
  Spawning = 'spawning',
  Waiting = 'waiting',
  Countdown = 'countdown',
  Complete = 'complete',
}
