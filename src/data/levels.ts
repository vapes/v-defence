import { LevelConfig } from '../types';
import levelDev from './levels/level-dev.json';
import level1 from './levels/level1.json';
import level2 from './levels/level2.json';
import level3 from './levels/level3.json';
import level4 from './levels/level4.json';
import level5 from './levels/level5.json';

const prodLevels: LevelConfig[] = [
  level1 as LevelConfig,
  level2 as LevelConfig,
  level3 as LevelConfig,
  level4 as LevelConfig,
  level5 as LevelConfig,
];

export const LEVELS: LevelConfig[] = import.meta.env.DEV
  ? [levelDev as LevelConfig, ...prodLevels]
  : prodLevels;
