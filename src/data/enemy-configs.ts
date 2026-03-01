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

  // СПРИНТЕР (Triangle) — Быстрый, требует Крио-луча или Теслы
  triangle: {
    type: 'triangle',
    health: 40,       // Мало HP, но пробегает зону обстрела за секунды
    speed: 3.5,       // В 2.3 раза быстрее обычного
    reward: 12,
    color: 0xf39c12,
    armor: 0,
  },

  // ТАНК (Hexagon) — Огромное HP, цель для Лазера
  hexagon: {
    type: 'hexagon',
    health: 600,      // Лазер Lvl 1 будет "пилить" его 20 секунд
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
