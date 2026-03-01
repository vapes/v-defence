import { TowerConfig } from '../types';

export const TOWER_CONFIGS: Record<string, TowerConfig> = {
  bullet: {
    type: 'bullet',
    levels: [
      { damage: 15, fireRate: 800, range: 120, cost: 50 },
      { damage: 25, fireRate: 650, range: 140, cost: 40 },
      { damage: 40, fireRate: 500, range: 160, cost: 60 },
    ],
  },
  laser: {
    type: 'laser',
    levels: [
      { damage: 30, fireRate: 1200, range: 150, cost: 80 },
      { damage: 50, fireRate: 1000, range: 170, cost: 60 },
      { damage: 80, fireRate: 800, range: 200, cost: 90 },
    ],
  },
};
