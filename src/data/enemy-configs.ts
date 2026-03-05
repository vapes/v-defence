import { EnemyConfig } from '../types';

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  // МЯСО (Circle) — Базовый враг, убивается пушкой с 1 выстрела
  circle: {
    type: 'circle',
    health: 20,       // Убивается 1 выстрелом пушки Lvl 1 (урон 20)
    speed: 1.2,       // -20% от исходных 1.5
    reward: 10,
    color: 0xe74c3c,
    armor: 0,
  },

  // СПРИНТЕР (Triangle) — Быстрый, убивается пушкой с 1 выстрела
  triangle: {
    type: 'triangle',
    health: 20,       // Убивается 1 выстрелом пушки Lvl 1 (урон 20)
    speed: 1.6,       // -20% от исходных 2.0
    reward: 12,
    color: 0xf39c12,
    armor: 0,
  },

  // ТАНК (Hexagon) — Высокое HP, цель для нескольких башен
  hexagon: {
    type: 'hexagon',
    health: 300,      // 2 башни Lvl 2 убивают за ~4-5 секунд обстрела
    speed: 0.64,      // -20% от исходных 0.8
    reward: 40,
    color: 0x9b59b6,
    armor: 5,         // Небольшая защита от слабых пуль
  },

  // БРОНИРОВАННЫЙ (Square) — Контр-пик Арбалета, требует Алхимика
  square: {
    type: 'square',
    health: 150,
    speed: 0.96,      // -20% от исходных 1.2
    reward: 25,
    color: 0x3498db,
    armor: 25,        // Арбалет Lvl 1 наносит ему 0 урона (т.к. урон 20 < 25)
  },

  // БОСС (Дополнительно) — Проверка всей системы обороны
  pentagon: {
    type: 'pentagon',
    health: 2500,
    speed: 0.48,      // -20% от исходных 0.6
    reward: 200,
    color: 0x2ecc71,
    armor: 30,
  },
};
