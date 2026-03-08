#!/usr/bin/env node
// Balance simulation for tower defense levels 1-5
// Models enemy movement, tower firing, and greedy buying strategy

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const configs = JSON.parse(readFileSync(join(ROOT, 'src/data/game-configs.json'), 'utf8'));

const CELL_SIZE = 64;
const DT = 0.05; // simulation step seconds
const SLOW_DURATION = 0.5;
const CHAIN_RANGE_PX = 80; // chain lightning range in pixels
const COUNTDOWN = 5; // seconds between waves
const MAX_WAVE_TIME = 300;

// Tower stat lookups
function towerStats(type, lvl) {
  return configs.towers[type].levels[lvl - 1];
}

// Build path: returns array of [row, col] from spawn to base
function buildPath(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let start = null;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] === 2) start = [r, c];

  const path = [start];
  const visited = new Set([`${start[0]},${start[1]}`]);

  while (true) {
    const [cr, cc] = path[path.length - 1];
    if (grid[cr][cc] === 3) break;
    let found = false;
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = cr + dr, nc = cc + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited.has(`${nr},${nc}`)) continue;
      if (grid[nr][nc] === 0) continue;
      path.push([nr, nc]);
      visited.add(`${nr},${nc}`);
      found = true;
      break;
    }
    if (!found) break;
  }
  return path;
}

// Find grass cells adjacent to path cells
function findGrassCells(grid, path) {
  const pathSet = new Set(path.map(([r,c]) => `${r},${c}`));
  const grassCells = [];
  for (const [pr, pc] of path) {
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0],[-1,-1],[-1,1],[1,-1],[1,1]]) {
      const nr = pr + dr, nc = pc + dc;
      if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) continue;
      if (grid[nr][nc] !== 0) continue;
      const key = `${nr},${nc}`;
      if (!pathSet.has(key) && !grassCells.some(([r,c]) => r===nr && c===nc)) {
        grassCells.push([nr, nc]);
      }
    }
  }
  return grassCells;
}

// World position of cell center in pixels
function cellWorld(r, c) {
  return [c * CELL_SIZE + CELL_SIZE/2, r * CELL_SIZE + CELL_SIZE/2];
}

// Enemy world position given pathPos (0..pathLen)
// pathPos 0 = center of spawn cell, pathPos 1 = center of next cell, etc.
function enemyWorld(path, pathPos) {
  const idx = Math.floor(pathPos);
  const frac = pathPos - idx;
  if (idx >= path.length - 1) {
    const [r, c] = path[path.length - 1];
    return cellWorld(r, c);
  }
  const [r1, c1] = path[idx];
  const [r2, c2] = path[idx + 1];
  const [wx1, wy1] = cellWorld(r1, c1);
  const [wx2, wy2] = cellWorld(r2, c2);
  return [wx1 + (wx2-wx1)*frac, wy1 + (wy2-wy1)*frac];
}

// Distance in pixels
function dist2D(x1, y1, x2, y2) {
  return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
}

// Simulate a single level
function simulateLevel(levelNum) {
  const levelData = JSON.parse(readFileSync(join(ROOT, `src/data/levels/level${levelNum}.json`), 'utf8'));
  const path = buildPath(levelData.grid);
  const pathLen = path.length - 1; // number of segments
  const grassCells = findGrassCells(levelData.grid, path);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`LEVEL ${levelNum}: ${levelData.name}`);
  console.log(`Path cells: ${path.length}, Grass spots: ${grassCells.length}, Available: ${levelData.availableTowers.join(', ')}`);
  console.log(`Start money: ${levelData.startingMoney}, Lives: ${levelData.lives}`);
  console.log(`${'='.repeat(60)}`);

  // Placement strategy: place towers at grass cells sorted by coverage of path
  // Sort grass cells by sum of path segments covered within range
  // Pre-score each grass cell for a typical range (120px = bullet L1)
  function scoreGrassCell(gr, gc, rangePx) {
    const [wx, wy] = cellWorld(gr, gc);
    let covered = 0;
    for (const [pr, pc] of path) {
      const [px, py] = cellWorld(pr, pc);
      if (dist2D(wx, wy, px, py) <= rangePx) covered++;
    }
    return covered;
  }

  // Sort grass cells by coverage (descending) for default range
  const sortedGrass = [...grassCells].sort((a, b) => scoreGrassCell(b[0],b[1],120) - scoreGrassCell(a[0],a[1],120));

  // Tower state
  let towers = [];
  let usedGrassCells = new Set();
  let coins = levelData.startingMoney;
  let lives = levelData.lives;
  let totalTime = 0;

  function getNextGrassCell() {
    for (const [gr, gc] of sortedGrass) {
      const key = `${gr},${gc}`;
      if (!usedGrassCells.has(key)) {
        usedGrassCells.add(key);
        return [gr, gc];
      }
    }
    return sortedGrass[0]; // fallback
  }

  function getCryoGrassCell() {
    // Cryo should go near path start (first 20% of path)
    const earlyPath = path.slice(0, Math.ceil(path.length * 0.2));
    let best = null, bestCov = -1;
    for (const [gr, gc] of grassCells) {
      const key = `${gr},${gc}`;
      if (usedGrassCells.has(key)) continue;
      const [wx, wy] = cellWorld(gr, gc);
      let cov = 0;
      for (const [pr, pc] of earlyPath) {
        const [px, py] = cellWorld(pr, pc);
        if (dist2D(wx, wy, px, py) <= 100) cov++;
      }
      if (cov > bestCov) { bestCov = cov; best = [gr, gc]; }
    }
    if (best) {
      usedGrassCells.add(`${best[0]},${best[1]}`);
      return best;
    }
    return getNextGrassCell();
  }

  function addTower(type, lvl, gr, gc) {
    const cost = towerStats(type, lvl).cost;
    coins -= cost;
    const [wx, wy] = cellWorld(gr, gc);
    towers.push({
      type, level: lvl,
      wx, wy,      // world x, y of tower
      row: gr, col: gc,
      cooldown: 0,
      laserRamp: 0,
      laserTarget: null
    });
  }

  // Greedy buying between waves
  // Strategy: damage-first. Don't buy cryo until main DPS is established.
  // Priority order:
  // 1) Buy bullet if no towers
  // 2) Upgrade bullet L1→L2
  // 3) Buy 2nd bullet
  // 4) Upgrade bullet L2→L3 on both
  // 5) Buy new specialty types (tesla > laser > magic)
  // 6) Upgrade specialty towers
  // 7) Buy cryo (only after having at least 2 maxed damage towers, or if stuck with low coins)
  // 8) Buy more bullets
  function buy(available) {
    let bought = true;
    while (bought) {
      bought = false;

      // 1. Buy first bullet if no towers
      if (towers.length === 0 && available.includes('bullet') && coins >= towerStats('bullet', 1).cost) {
        const [gr, gc] = getNextGrassCell();
        addTower('bullet', 1, gr, gc);
        bought = true;
        continue;
      }
      if (towers.length === 0) continue;

      // 2. Upgrade bullet L1 → L2 on first bullet
      const firstBullet = towers.find(t => t.type === 'bullet');
      if (firstBullet && firstBullet.level === 1) {
        const cost = towerStats('bullet', 2).cost; // $180
        if (coins >= cost) {
          coins -= cost;
          firstBullet.level = 2;
          bought = true;
          continue;
        }
      }

      // 3. Buy 2nd bullet (to increase damage coverage)
      const bulletTowers = towers.filter(t => t.type === 'bullet');
      if (bulletTowers.length < 2 && available.includes('bullet') && coins >= towerStats('bullet', 1).cost) {
        const [gr, gc] = getNextGrassCell();
        addTower('bullet', 1, gr, gc);
        bought = true;
        continue;
      }

      // 4. Upgrade all bullets to L2, then L3
      for (const t of towers.filter(t => t.type === 'bullet')) {
        if (t.level < 3) {
          const cost = towerStats('bullet', t.level + 1).cost;
          if (coins >= cost) {
            coins -= cost;
            t.level++;
            bought = true;
            break;
          }
        }
      }
      if (bought) continue;

      // 5. Buy new specialty types: tesla > laser > magic
      for (const type of ['tesla', 'laser', 'magic']) {
        if (!available.includes(type)) continue;
        if (towers.some(t => t.type === type)) continue;
        const cost = towerStats(type, 1).cost;
        if (coins >= cost) {
          const [gr, gc] = getNextGrassCell();
          addTower(type, 1, gr, gc);
          bought = true;
          break;
        }
      }
      if (bought) continue;

      // 6. Upgrade specialty damage towers (non-cryo, non-bullet)
      for (const t of towers.filter(t => t.type !== 'cryo' && t.type !== 'bullet')) {
        if (t.level < 3) {
          const cost = towerStats(t.type, t.level + 1).cost;
          if (coins >= cost) {
            coins -= cost;
            t.level++;
            bought = true;
            break;
          }
        }
      }
      if (bought) continue;

      // 7. Buy cryo if available (only after first bullet is at least L2)
      const firstBulletForCryo = towers.find(t => t.type === 'bullet');
      if (available.includes('cryo') && !towers.some(t => t.type === 'cryo') &&
          coins >= towerStats('cryo', 1).cost &&
          firstBulletForCryo && firstBulletForCryo.level >= 2) {
        const [gr, gc] = getCryoGrassCell();
        addTower('cryo', 1, gr, gc);
        bought = true;
        continue;
      }

      // 8. Upgrade cryo
      const cryoTower = towers.find(t => t.type === 'cryo');
      if (cryoTower && cryoTower.level < 3) {
        const cost = towerStats('cryo', cryoTower.level + 1).cost;
        if (coins >= cost) {
          coins -= cost;
          cryoTower.level++;
          bought = true;
          continue;
        }
      }

      // 9. Buy more bullets
      if (available.includes('bullet') && coins >= towerStats('bullet', 1).cost) {
        const [gr, gc] = getNextGrassCell();
        addTower('bullet', 1, gr, gc);
        bought = true;
      }
    }
  }

  // Simulate a wave
  function simulateWave(waveIdx, waveConfig) {
    const spawnSchedule = [];
    for (const group of waveConfig.groups) {
      const enemyCfg = configs.enemies[group.type];
      let t = group.delayBefore / 1000;
      for (let i = 0; i < group.count; i++) {
        spawnSchedule.push({ time: t, type: group.type, cfg: enemyCfg });
        t += group.spawnInterval / 1000;
      }
    }
    spawnSchedule.sort((a, b) => a.time - b.time);

    let enemies = [];
    let nextId = 0;
    let spawnIdx = 0;
    let simTime = 0;
    let livesLost = 0;
    let coinsEarned = 0;

    for (const t of towers) {
      t.laserRamp = 0;
      t.laserTarget = null;
      t.cooldown = 0;
    }

    while (simTime < MAX_WAVE_TIME) {
      // Spawn
      while (spawnIdx < spawnSchedule.length && spawnSchedule[spawnIdx].time <= simTime) {
        const s = spawnSchedule[spawnIdx];
        enemies.push({
          id: nextId++,
          type: s.type,
          hp: s.cfg.health,
          speed: s.cfg.speed,
          armor: s.cfg.armor,
          reward: s.cfg.reward,
          pathPos: 0,
          slowTimer: 0,
          slowFactor: 0,
          alive: true
        });
        spawnIdx++;
      }

      // Move enemies
      for (const e of enemies) {
        if (!e.alive) continue;
        const effSpeed = e.slowTimer > 0 ? e.speed * (1 - e.slowFactor) : e.speed;
        const cellsPerSec = effSpeed * 60 / CELL_SIZE;
        e.pathPos += cellsPerSec * DT;
        if (e.slowTimer > 0) e.slowTimer = Math.max(0, e.slowTimer - DT);

        if (e.pathPos >= pathLen) {
          e.alive = false;
          livesLost++;
        }
      }

      // Tower attacks
      for (const tower of towers) {
        const stats = towerStats(tower.type, tower.level);
        const rangePx = stats.range;

        // Find enemies in range using 2D world distance
        const inRange = enemies.filter(e => {
          if (!e.alive) return false;
          const [ex, ey] = enemyWorld(path, e.pathPos);
          return dist2D(tower.wx, tower.wy, ex, ey) <= rangePx;
        });

        if (inRange.length === 0) {
          if (tower.type === 'laser') { tower.laserRamp = 0; tower.laserTarget = null; }
          continue;
        }

        // Leading enemy (highest pathPos)
        const leading = inRange.reduce((a, b) => a.pathPos > b.pathPos ? a : b);

        if (tower.type === 'bullet') {
          tower.cooldown -= DT;
          if (tower.cooldown <= 0) {
            const dmg = stats.damage * (1 - leading.armor / 100);
            leading.hp -= dmg;
            if (leading.hp <= 0) {
              leading.alive = false;
              coinsEarned += leading.reward;
            }
            tower.cooldown = stats.fireRate / 1000;
          }
        } else if (tower.type === 'laser') {
          if (tower.laserTarget !== leading.id) {
            tower.laserRamp = 0;
            tower.laserTarget = leading.id;
          }
          tower.laserRamp = Math.min(tower.laserRamp + DT, stats.rampUpTime);
          const dps = stats.baseDamage + (stats.maxDamage - stats.baseDamage) * (tower.laserRamp / stats.rampUpTime);
          const dmg = dps * DT * (1 - leading.armor / 100);
          leading.hp -= dmg;
          if (leading.hp <= 0) {
            leading.alive = false;
            coinsEarned += leading.reward;
            tower.laserRamp = 0;
            tower.laserTarget = null;
          }
        } else if (tower.type === 'magic') {
          tower.cooldown -= DT;
          if (tower.cooldown <= 0) {
            const aoeRadiusPx = stats.aoeRadius;
            const [lx, ly] = enemyWorld(path, leading.pathPos);
            for (const e of enemies) {
              if (!e.alive) continue;
              const [ex, ey] = enemyWorld(path, e.pathPos);
              if (dist2D(lx, ly, ex, ey) <= aoeRadiusPx) {
                const dmg = stats.damage * (1 - e.armor / 100);
                e.hp -= dmg;
                if (e.hp <= 0) {
                  e.alive = false;
                  coinsEarned += e.reward;
                }
              }
            }
            tower.cooldown = stats.fireRate / 1000;
          }
        } else if (tower.type === 'cryo') {
          for (const e of inRange) {
            if (!e.alive) continue;
            e.slowTimer = SLOW_DURATION;
            e.slowFactor = stats.slowFactor;
            const dmg = stats.damage * DT * (1 - e.armor / 100);
            e.hp -= dmg;
            if (e.hp <= 0) {
              e.alive = false;
              coinsEarned += e.reward;
            }
          }
        } else if (tower.type === 'tesla') {
          tower.cooldown -= DT;
          if (tower.cooldown <= 0) {
            let targets = [leading];
            let hitSet = new Set([leading.id]);
            for (let chain = 1; chain < stats.chainTargets; chain++) {
              const last = targets[targets.length - 1];
              const [lx, ly] = enemyWorld(path, last.pathPos);
              let nearest = null, nearDist = Infinity;
              for (const e of enemies) {
                if (!e.alive || hitSet.has(e.id)) continue;
                const [ex, ey] = enemyWorld(path, e.pathPos);
                const d = dist2D(lx, ly, ex, ey);
                if (d < CHAIN_RANGE_PX && d < nearDist) {
                  nearDist = d;
                  nearest = e;
                }
              }
              if (!nearest) break;
              targets.push(nearest);
              hitSet.add(nearest.id);
            }
            for (const e of targets) {
              const dmg = stats.damage * (1 - e.armor / 100);
              e.hp -= dmg;
              if (e.hp <= 0) {
                e.alive = false;
                coinsEarned += e.reward;
              }
            }
            tower.cooldown = stats.fireRate / 1000;
          }
        }
      }

      // Clean dead
      enemies = enemies.filter(e => e.alive);
      simTime += DT;

      if (spawnIdx >= spawnSchedule.length && enemies.length === 0) break;
    }

    return { duration: simTime, livesLost, coinsEarned };
  }

  // Initial buy
  buy(levelData.availableTowers);
  console.log(`Initial towers: ${towers.map(t => `${t.type}L${t.level}@(${t.row},${t.col})`).join(', ')}`);
  console.log(`Coins remaining: ${coins}`);

  let totalLivesLost = 0;

  for (let wi = 0; wi < levelData.waves.length; wi++) {
    const result = simulateWave(wi, levelData.waves[wi]);
    totalLivesLost += result.livesLost;
    lives -= result.livesLost;
    coins += result.coinsEarned;
    totalTime += result.duration + (wi < levelData.waves.length - 1 ? COUNTDOWN : 0);

    const towerList = towers.map(t => `${t.type}L${t.level}`).join(', ');
    console.log(`  Wave ${wi+1}: ${result.duration.toFixed(1)}s, lost: ${result.livesLost}, +${result.coinsEarned}c → coins: ${Math.round(coins)}, lives: ${lives} | [${towerList}]`);

    if (wi < levelData.waves.length - 1) {
      buy(levelData.availableTowers);
    }
  }

  const won = lives > 0;
  console.log(`\nRESULT: ${won ? 'WIN' : 'DEFEAT'} | ${(totalTime/60).toFixed(2)}min | lives: ${lives}/${levelData.lives} | lost: ${totalLivesLost}`);
  console.log(`Final towers: ${towers.map(t => `${t.type}L${t.level}`).join(', ')}`);

  return { won, lives, totalTime, totalLivesLost };
}

// Run all levels
const results = [];
for (let i = 1; i <= 5; i++) {
  try {
    const r = simulateLevel(i);
    results.push({ level: i, ...r });
  } catch (e) {
    console.error(`Level ${i} error:`, e.message);
    console.error(e.stack);
    results.push({ level: i, error: e.message });
  }
}

console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
for (const r of results) {
  if (r.error) {
    console.log(`Level ${r.level}: ERROR - ${r.error}`);
  } else {
    const status = r.won ? 'WIN   ' : 'DEFEAT';
    console.log(`Level ${r.level}: ${status} | ${(r.totalTime/60).toFixed(2)}min | lives lost: ${r.totalLivesLost} | final lives: ${r.lives}`);
  }
}
