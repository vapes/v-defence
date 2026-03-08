import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../src/data');

const configs = JSON.parse(readFileSync(join(dataDir, 'game-configs.json'), 'utf8'));
const enemyRewards = Object.fromEntries(
  Object.entries(configs.enemies).map(([k, v]) => [k, v.reward])
);

// ── Formatter (same as solver.mjs) ───────────────────────────────────────────

function compactArray(arr) {
  return '[' + arr.map(v => JSON.stringify(v)).join(', ') + ']';
}

function compactObject(obj) {
  const pairs = Object.entries(obj).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  return '{ ' + pairs.join(', ') + ' }';
}

function formatLevelJson(level) {
  const I = '  ';
  const lines = ['{'];
  const entries = Object.entries(level);

  entries.forEach(([key, value], i) => {
    const comma = i < entries.length - 1 ? ',' : '';

    if (key === 'grid') {
      lines.push(`${I}"grid": [`);
      value.forEach((row, ri) => {
        lines.push(`${I}${I}${compactArray(row)}${ri < value.length - 1 ? ',' : ''}`);
      });
      lines.push(`${I}]${comma}`);
    } else if (key === 'waves') {
      lines.push(`${I}"waves": [`);
      value.forEach((wave, wi) => {
        lines.push(`${I}${I}{`);
        lines.push(`${I}${I}${I}"groups": [`);
        wave.groups.forEach((group, gi) => {
          lines.push(`${I}${I}${I}${I}${compactObject(group)}${gi < wave.groups.length - 1 ? ',' : ''}`);
        });
        lines.push(`${I}${I}${I}]${wave.gold !== undefined ? ',' : ''}`);
        if (wave.gold !== undefined) lines.push(`${I}${I}${I}"gold": ${wave.gold}`);
        lines.push(`${I}${I}}${wi < value.length - 1 ? ',' : ''}`);
      });
      lines.push(`${I}]${comma}`);
    } else if (Array.isArray(value)) {
      lines.push(`${I}${JSON.stringify(key)}: ${compactArray(value)}${comma}`);
    } else {
      lines.push(`${I}${JSON.stringify(key)}: ${JSON.stringify(value)}${comma}`);
    }
  });

  lines.push('}');
  return lines.join('\n') + '\n';
}

// ── Main ─────────────────────────────────────────────────────────────────────

const levelsDir = join(dataDir, 'levels');
const files = readdirSync(levelsDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const path = join(levelsDir, file);
  const level = JSON.parse(readFileSync(path, 'utf8'));

  let changed = false;
  for (const wave of level.waves) {
    const gold = wave.groups.reduce((sum, g) => {
      const reward = enemyRewards[g.type];
      if (reward === undefined) {
        console.warn(`Unknown enemy type: ${g.type} in ${file}`);
        return sum;
      }
      return sum + g.count * reward;
    }, 0);

    if (wave.gold !== gold) {
      wave.gold = gold;
      changed = true;
    }
  }

  const formatted = formatLevelJson(level);
  const current = readFileSync(path, 'utf8');
  if (changed || formatted !== current) {
    writeFileSync(path, formatted);
    console.log(`Updated ${file}`);
  } else {
    console.log(`No changes in ${file}`);
  }
}
