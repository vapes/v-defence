import { EnemyConfig } from '../types';

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  circle: {
    type: 'circle',
    health: 50,
    speed: 1.5,
    reward: 10,
    color: 0xe74c3c,
  },
  triangle: {
    type: 'triangle',
    health: 30,
    speed: 2.5,
    reward: 8,
    color: 0xf39c12,
  },
  hexagon: {
    type: 'hexagon',
    health: 120,
    speed: 1.0,
    reward: 20,
    color: 0x9b59b6,
  },
  square: {
    type: 'square',
    health: 80,
    speed: 1.2,
    reward: 15,
    color: 0x3498db,
  },
};
