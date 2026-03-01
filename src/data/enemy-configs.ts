import { EnemyConfig } from '../types';

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  // МЯСО (Circle) — Базовый враг для проверки Мортир и Пуль
  circle: {
    type: 'circle',
    health: 60,       // Выживет под 3-4 выстрелами Арбалета Lvl 1
    speed: 1.5,
    reward: 10,
    color: 0xe74c3c,
    armor: 0,
  },

  // СПРИНТЕР (Triangle) — Быстрый, требует точного позиционирования башен
  triangle: {
    type: 'triangle',
    health: 40,       // Мало HP, но пробегает зону обстрела быстро
    speed: 2.0,       // ~1.3x быстрее обычного — убивается 2 башнями Lvl 1 на повороте
    reward: 12,
    color: 0xf39c12,
    armor: 0,
  },

  // ТАНК (Hexagon) — Высокое HP, цель для нескольких башен
  hexagon: {
    type: 'hexagon',
    health: 300,      // 2 башни Lvl 2 убивают за ~4-5 секунд обстрела
    speed: 0.8,       // Очень медленный
    reward: 40,
    color: 0x9b59b6,
    armor: 5,         // Небольшая защита от слабых пуль
  },

  // БРОНИРОВАННЫЙ (Square) — Контр-пик Арбалета, требует Алхимика
  square: {
    type: 'square',
    health: 150,
    speed: 1.2,
    reward: 25,
    color: 0x3498db,
    armor: 25,        // Арбалет Lvl 1 наносит ему 0 урона (т.к. урон 20 < 25)
  },

  // БОСС (Дополнительно) — Проверка всей системы обороны
  pentagon: {
    type: 'pentagon',
    health: 2500,
    speed: 0.6,
    reward: 200,
    color: 0x2ecc71,
    armor: 30,
  },
};
