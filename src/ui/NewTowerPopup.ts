import { Container, Graphics, Text } from 'pixi.js';
import { TowerType, TowerLevelStats, Point } from '../types';
import { TowerFactory } from '../game/towers/TowerFactory';
import { Tower } from '../game/towers/Tower';
import { EnemyFactory } from '../game/enemies/EnemyFactory';
import { Enemy } from '../game/enemies/Enemy';
import { towers as TOWER_CONFIGS } from '../data/game-configs.json';
import { LEVELS } from '../data/levels';

const CARD_W = 340;
const PAD = 16;
const DEMO_W = 300;
const DEMO_H = 100;

interface TowerInfo {
  name: string;
  desc: string;
  color: number;
}

const TOWER_INFO: Record<TowerType, TowerInfo> = {
  bullet: {
    name: 'Arbalest',
    desc: 'Fires bolts at single targets. Reliable and affordable.',
    color: 0x888888,
  },
  laser: {
    name: 'Prism',
    desc: 'Continuous beam. Damage ramps up while focused on one target.',
    color: 0xe74c3c,
  },
  magic: {
    name: 'Magic Ball',
    desc: 'Charges a fireball and launches it into the crowd. AoE fire damage. Lvl 3 stuns.',
    color: 0xff6600,
  },
  cryo: {
    name: 'Cryo',
    desc: 'Freezing aura slows all enemies in range.',
    color: 0x4fc3f7,
  },
  tesla: {
    name: 'Tesla',
    desc: 'Chain lightning jumps between enemies. Full damage each jump.',
    color: 0x3498db,
  },
};

const NO_DEMO: TowerType[] = [];

interface StatRow {
  label: string;
  values: string[];
}

function getLevelStats(type: TowerType): StatRow[] {
  const levels = TOWER_CONFIGS[type].levels as TowerLevelStats[];
  const rows: StatRow[] = [];

  const num = (label: string, key: keyof TowerLevelStats, suffix = '') => {
    const vals = levels.map((l) => {
      const v = l[key];
      return v != null ? `${v}${suffix}` : '—';
    });
    if (vals.some((v) => v !== '—')) rows.push({ label, values: vals });
  };
  const pct = (label: string, key: keyof TowerLevelStats) => {
    const vals = levels.map((l) => {
      const v = l[key] as number | undefined;
      return v != null ? `${Math.round(v * 100)}%` : '—';
    });
    if (vals.some((v) => v !== '—')) rows.push({ label, values: vals });
  };

  switch (type) {
    case 'bullet':
      num('DMG', 'damage'); num('Rate', 'fireRate', 'ms'); num('Range', 'range'); break;
    case 'laser':
      num('Base DPS', 'baseDamage'); num('Max DPS', 'maxDamage'); num('Range', 'range'); break;
    case 'magic':
      num('DMG', 'damage'); num('AoE', 'aoeRadius'); num('Rate', 'fireRate', 'ms'); break;
    case 'cryo':
      pct('Slow', 'slowFactor'); num('DPS', 'damage'); num('Range', 'range'); break;
    case 'tesla':
      num('DMG', 'damage'); num('Targets', 'chainTargets'); num('Range', 'range'); break;
  }

  const costs = levels.map((l) => `$${l.cost}`);
  rows.push({ label: 'Cost', values: costs });
  return rows;
}

// ── Demo projectile for bullet tower ────────────────────────────────────────

interface DemoProjectile {
  gfx: Graphics;
  x: number;
  y: number;
  target: Enemy;
  damage: number;
  speed: number;
}

// ── Seen towers persistence ──────────────────────────────────────────────────

const SEEN_TOWERS_KEY = 'v-defence-seen-towers';

function getSeenTowers(): Set<TowerType> {
  try {
    const data = localStorage.getItem(SEEN_TOWERS_KEY);
    if (data) return new Set(JSON.parse(data) as TowerType[]);
  } catch {}
  return new Set();
}

function markTowerSeen(type: TowerType): void {
  const seen = getSeenTowers();
  seen.add(type);
  localStorage.setItem(SEEN_TOWERS_KEY, JSON.stringify([...seen]));
}

// ── Public API ──────────────────────────────────────────────────────────────

export function getNewTowersForLevel(levelId: number): TowerType[] {
  const previousTowers = new Set<TowerType>();
  for (const lvl of LEVELS) {
    if (lvl.id >= levelId || lvl.id === 0) continue;
    for (const t of lvl.availableTowers) previousTowers.add(t);
  }
  const currentLevel = LEVELS.find((l) => l.id === levelId);
  if (!currentLevel) return [];
  const seen = getSeenTowers();
  return currentLevel.availableTowers.filter((t) => !previousTowers.has(t) && !seen.has(t));
}

export class NewTowerPopup extends Container {
  private queue: TowerType[] = [];
  private overlay: Graphics;
  private card: Container;
  private sw: number;
  private sh: number;

  // Demo state
  private demoContainer: Container | null = null;
  private demoTower: Tower | null = null;
  private demoEnemies: Enemy[] = [];
  private demoProjectiles: DemoProjectile[] = [];
  private demoPath: Point[] = [];

  onDone?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.sw = screenWidth;
    this.sh = screenHeight;
    this.visible = false;

    this.overlay = new Graphics();
    this.overlay.rect(0, 0, screenWidth, screenHeight).fill({ color: 0x000000, alpha: 0.7 });
    this.overlay.interactive = true;
    this.addChild(this.overlay);

    this.card = new Container();
    this.addChild(this.card);
  }

  show(towers: TowerType[]): void {
    if (towers.length === 0) { this.onDone?.(); return; }
    this.queue = [...towers];
    this.visible = true;
    this.showCurrent();
  }

  private showCurrent(): void {
    this.cleanupDemo();
    this.card.removeChildren();

    const type = this.queue[0];
    const info = TOWER_INFO[type];
    const hasDemo = !NO_DEMO.includes(type);
    const stats = getLevelStats(type);

    // ── Measure layout ────────────────────────────────────────────
    let y = PAD;

    // Subtitle
    const subtitle = this.makeText('NEW TOWER UNLOCKED', 11, 0x888888, true);
    subtitle.anchor.set(0.5, 0);
    subtitle.x = CARD_W / 2; subtitle.y = y; y += 18;

    // Name
    const nameText = this.makeText(info.name, 24, info.color, true);
    nameText.anchor.set(0.5, 0);
    nameText.x = CARD_W / 2; nameText.y = y; y += 32;

    // Description
    const descText = new Text({
      text: info.desc,
      style: { fontSize: 11, fill: 0xaaaaaa, fontFamily: 'Arial', wordWrap: true, wordWrapWidth: CARD_W - PAD * 2 },
    });
    descText.anchor.set(0.5, 0);
    descText.x = CARD_W / 2; descText.y = y; y += descText.height + 12;

    // Demo area
    const demoY = y;
    if (hasDemo) y += DEMO_H + 10;

    // Stats table
    const statsY = y;
    const LINE_H = 15;
    const tableH = (stats.length + 1) * LINE_H + 4;
    y += tableH + 10;

    // Button
    const btnY = y;
    y += 36 + PAD;

    // Counter
    if (this.queue.length > 1) y += 14;

    const totalH = y;

    // ── Background ────────────────────────────────────────────────
    const bg = new Graphics();
    bg.roundRect(0, 0, CARD_W, totalH, 14).fill({ color: 0x1a1a2e });
    bg.roundRect(0, 0, CARD_W, totalH, 14).stroke({ color: info.color, alpha: 0.5, width: 2 });
    this.card.addChild(bg);

    const accent = new Graphics();
    accent.roundRect(0, 0, CARD_W, 3, 2).fill({ color: info.color, alpha: 0.5 });
    this.card.addChild(accent);

    this.card.addChild(subtitle);
    this.card.addChild(nameText);
    this.card.addChild(descText);

    // ── Demo area ─────────────────────────────────────────────────
    if (hasDemo) {
      this.buildDemo(type, demoY);
    }

    // ── Stats table ───────────────────────────────────────────────
    this.buildStatsTable(stats, statsY, info.color);

    // ── Button ────────────────────────────────────────────────────
    const btnLabel = this.queue.length > 1 ? 'Next →' : 'OK';
    const btnW = 130;
    const btnH = 34;
    const btn = new Container();
    const btnBg = new Graphics();
    btnBg.roundRect(0, 0, btnW, btnH, 8).fill({ color: info.color, alpha: 0.85 });
    btn.addChild(btnBg);
    const btnText = this.makeText(btnLabel, 14, 0xffffff, true);
    btnText.anchor.set(0.5); btnText.x = btnW / 2; btnText.y = btnH / 2;
    btn.addChild(btnText);
    btn.x = (CARD_W - btnW) / 2; btn.y = btnY;
    btn.interactive = true; btn.cursor = 'pointer';
    btn.on('pointertap', (e) => { e.stopPropagation(); this.advance(); });
    this.card.addChild(btn);

    // Counter
    if (this.queue.length > 1) {
      const ct = this.makeText(`1 / ${this.queue.length}`, 10, 0x555555);
      ct.anchor.set(0.5, 0);
      ct.x = CARD_W / 2; ct.y = btnY + btnH + 6;
      this.card.addChild(ct);
    }

    // Position card centered
    this.card.x = Math.round((this.sw - CARD_W) / 2);
    this.card.y = Math.round((this.sh - totalH) / 2);
  }

  // ── Demo ──────────────────────────────────────────────────────────────────

  private buildDemo(type: TowerType, y: number): void {
    const dx = (CARD_W - DEMO_W) / 2;
    const demo = new Container();
    demo.x = dx; demo.y = y;
    this.card.addChild(demo);
    this.demoContainer = demo;

    const demoBg = new Graphics();
    demoBg.roundRect(0, 0, DEMO_W, DEMO_H, 6).fill({ color: 0x0d0d1a });
    demoBg.roundRect(0, 0, DEMO_W, DEMO_H, 6).stroke({ color: 0x222244, width: 1 });
    demo.addChild(demoBg);

    const mask = new Graphics();
    mask.roundRect(0, 0, DEMO_W, DEMO_H, 6).fill(0xffffff);
    demo.addChild(mask);

    const content = new Container();
    content.mask = mask;
    demo.addChild(content);

    // Draw path line
    const pathGfx = new Graphics();
    pathGfx.moveTo(0, 72).lineTo(DEMO_W, 72);
    pathGfx.stroke({ color: 0xc4a882, alpha: 0.25, width: 28 });
    content.addChild(pathGfx);

    // Path waypoints for enemies
    this.demoPath = [
      { x: -20, y: 72 },
      { x: DEMO_W * 0.25, y: 72 },
      { x: DEMO_W * 0.5, y: 72 },
      { x: DEMO_W * 0.75, y: 72 },
      { x: DEMO_W + 20, y: 72 },
    ];

    // Tower
    const tower = TowerFactory.create(type, 0, 0);
    tower.x = DEMO_W / 2;
    tower.y = 28;
    content.addChild(tower);
    this.demoTower = tower;

    if (type === 'bullet') {
      tower.onFire = (t, target) => {
        this.spawnDemoProjectile(t.x, t.y, target, t.stats.damage ?? 20);
      };
    }

    // Spawn initial enemies
    for (let i = 0; i < 5; i++) {
      this.spawnDemoEnemy(content, i * 0.2);
    }
  }

  private spawnDemoEnemy(parent: Container, progressOffset: number): void {
    const enemy = EnemyFactory.create('circle', 1);
    enemy.setPath(this.demoPath);
    enemy.waypointIndex = Math.floor(progressOffset * (this.demoPath.length - 1));
    enemy.progress = (progressOffset * (this.demoPath.length - 1)) % 1;
    parent.addChild(enemy);
    this.demoEnemies.push(enemy);
  }

  private spawnDemoProjectile(fx: number, fy: number, target: Enemy, damage: number): void {
    if (!this.demoContainer) return;
    const gfx = new Graphics();
    gfx.circle(0, 0, 3).fill(0xffdd44);
    const content = this.demoContainer.children[2] as Container;
    if (content) content.addChild(gfx);
    gfx.x = fx; gfx.y = fy;
    this.demoProjectiles.push({ gfx, x: fx, y: fy, target, damage, speed: 6 });
  }

  private cleanupDemo(): void {
    if (this.demoTower) { this.demoTower.destroy(); this.demoTower = null; }
    for (const e of this.demoEnemies) e.destroy();
    this.demoEnemies = [];
    for (const p of this.demoProjectiles) p.gfx.destroy();
    this.demoProjectiles = [];
    this.demoContainer = null;
  }

  // ── Stats table ───────────────────────────────────────────────────────────

  private buildStatsTable(stats: StatRow[], y: number, accentColor: number): void {
    const dx = (CARD_W - DEMO_W) / 2;
    const colW = 66;
    const labelW = DEMO_W - colW * 3;
    const LINE_H = 15;

    // Header row
    const headers = ['Lv 1', 'Lv 2', 'Lv 3'];
    for (let c = 0; c < 3; c++) {
      const h = this.makeText(headers[c], 10, accentColor, true);
      h.anchor.set(0.5, 0);
      h.x = dx + labelW + colW * c + colW / 2;
      h.y = y;
      this.card.addChild(h);
    }
    y += LINE_H + 2;

    // Separator
    const sep = new Graphics();
    sep.rect(dx, y - 1, DEMO_W, 1).fill({ color: 0x333355, alpha: 0.5 });
    this.card.addChild(sep);

    // Data rows
    for (let r = 0; r < stats.length; r++) {
      const row = stats[r];
      const ry = y + r * LINE_H + 2;

      const label = this.makeText(row.label, 10, 0x888888);
      label.x = dx + 4; label.y = ry;
      this.card.addChild(label);

      for (let c = 0; c < 3; c++) {
        const val = this.makeText(row.values[c] ?? '—', 10, 0xcccccc);
        val.anchor.set(0.5, 0);
        val.x = dx + labelW + colW * c + colW / 2;
        val.y = ry;
        this.card.addChild(val);
      }
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  private advance(): void {
    markTowerSeen(this.queue[0]);
    this.queue.shift();
    if (this.queue.length > 0) this.showCurrent();
    else this.close();
  }

  private close(): void {
    this.visible = false;
    this.cleanupDemo();
    this.card.removeChildren();
    this.onDone?.();
  }

  update(dt: number): void {
    if (!this.visible) return;
    this.updateDemo(dt);
  }

  private updateDemo(dt: number): void {
    if (!this.demoTower || !this.demoContainer) return;
    const content = this.demoContainer.children[2] as Container;
    if (!content) return;

    const alive = this.demoEnemies.filter((e) => !e.isDead && !e.reachedBase);

    // Update tower
    this.demoTower.update(dt, alive);

    // Update enemies
    for (const enemy of this.demoEnemies) {
      if (!enemy.isDead && !enemy.reachedBase) {
        enemy.update(dt);
      }
    }

    // Respawn dead/reached enemies
    for (let i = this.demoEnemies.length - 1; i >= 0; i--) {
      const e = this.demoEnemies[i];
      if (e.isDead || e.reachedBase) {
        content.removeChild(e);
        e.destroy();
        this.demoEnemies.splice(i, 1);
        this.spawnDemoEnemy(content, 0);
      }
    }

    // Update demo projectiles (for bullet tower)
    for (let i = this.demoProjectiles.length - 1; i >= 0; i--) {
      const p = this.demoProjectiles[i];
      if (p.target.isDead || p.target.reachedBase) {
        p.gfx.destroy();
        this.demoProjectiles.splice(i, 1);
        continue;
      }
      const ddx = p.target.x - p.x;
      const ddy = p.target.y - p.y;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dist < p.speed) {
        p.target.takeDamage(p.damage);
        p.gfx.destroy();
        this.demoProjectiles.splice(i, 1);
        continue;
      }
      p.x += (ddx / dist) * p.speed;
      p.y += (ddy / dist) * p.speed;
      p.gfx.x = p.x;
      p.gfx.y = p.y;
    }
  }

  private makeText(str: string, size: number, color: number, bold = false): Text {
    return new Text({
      text: str,
      style: {
        fontSize: size,
        fill: color,
        fontFamily: 'Arial',
        fontWeight: bold ? 'bold' : 'normal',
      },
    });
  }
}
