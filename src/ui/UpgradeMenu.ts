import { Container, Graphics, Text } from 'pixi.js';
import { COLORS, CELL_SIZE, HUD_HEIGHT } from '../constants';
import { TowerLevelStats, TowerType } from '../types';
import { Tower } from '../game/towers/Tower';
import { towers as TOWER_CONFIGS } from '../data/game-configs.json';

const POPUP_W = 230;
const PAD = 10;
const BTN_H = 32;
const LINE_H = 16;

interface StatEntry {
  label: string;
  current: string;
  delta: string;
}

const TOWER_NAMES: Record<TowerType, string> = {
  bullet: 'Arbalest',
  laser: 'Prism',
  tesla: 'Tesla',
  magic: 'Magic Ball',
  cryo: 'Cryo',
  alchemist: 'Alchemist',
  gold_mine: 'Gold Mine',
  void_beacon: 'Void Beacon',
  oracle: 'Oracle',
  orbital: 'Orbital',
};

function buildStats(tower: Tower, next: TowerLevelStats | null): StatEntry[] {
  const s = tower.stats;
  const entries: StatEntry[] = [];

  const num = (
    label: string,
    cur: number | undefined,
    nxt: number | undefined,
    suffix = '',
  ) => {
    if (cur == null) return;
    const d = nxt != null ? nxt - cur : 0;
    entries.push({
      label,
      current: `${cur}${suffix}`,
      delta: d !== 0 ? `${d > 0 ? '+' : ''}${d}${suffix}` : '',
    });
  };

  const pct = (
    label: string,
    cur: number | undefined,
    nxt: number | undefined,
  ) => {
    if (cur == null) return;
    const curP = Math.round(cur * 100);
    const d = nxt != null ? Math.round((nxt - cur) * 100) : 0;
    entries.push({
      label,
      current: `${curP}%`,
      delta: d !== 0 ? `+${d}%` : '',
    });
  };

  switch (tower.towerType) {
    case 'bullet':
      num('DMG', s.damage, next?.damage);
      num('Rate', s.fireRate, next?.fireRate, 'ms');
      num('Range', s.range, next?.range);
      break;
    case 'laser':
      num('Base DPS', s.baseDamage, next?.baseDamage);
      num('Max DPS', s.maxDamage, next?.maxDamage);
      num('Range', s.range, next?.range);
      break;
    case 'tesla':
      num('DMG', s.damage, next?.damage);
      num('Rate', s.fireRate, next?.fireRate, 'ms');
      num('Targets', s.chainTargets, next?.chainTargets);
      num('Range', s.range, next?.range);
      break;
    case 'magic':
      num('DMG', s.damage, next?.damage);
      num('Rate', s.fireRate, next?.fireRate, 'ms');
      num('AoE', s.aoeRadius, next?.aoeRadius);
      num('Range', s.range, next?.range);
      if (next?.stunDuration) {
        entries.push({ label: 'Stun', current: '—', delta: `+${next.stunDuration}s` });
      } else if (s.stunDuration) {
        entries.push({ label: 'Stun', current: `${s.stunDuration}s`, delta: '' });
      }
      break;
    case 'cryo':
      pct('Slow', s.slowFactor, next?.slowFactor);
      num('DPS', s.damage, next?.damage);
      num('Range', s.range, next?.range);
      break;
    case 'alchemist':
      num('DoT', s.dotDamage, next?.dotDamage, '/s');
      num('Dur', s.dotDuration, next?.dotDuration, 's');
      num('Range', s.range, next?.range);
      if (next?.armorShred && !s.armorShred) {
        entries.push({ label: 'Shred', current: '—', delta: `+${Math.round(next.armorShred * 100)}%` });
      } else if (s.armorShred) {
        entries.push({ label: 'Shred', current: `${Math.round(s.armorShred * 100)}%`, delta: '' });
      }
      break;
    case 'gold_mine':
      num('Income', s.income, next?.income);
      num('Interval', s.interval, next?.interval, 's');
      if (next?.killBonus && !s.killBonus) {
        entries.push({ label: 'Kill Bonus', current: '—', delta: `+${Math.round((next.killBonus ?? 0) * 100)}%` });
      } else if (s.killBonus) {
        entries.push({ label: 'Kill Bonus', current: `${Math.round(s.killBonus * 100)}%`, delta: '' });
      }
      break;
    case 'void_beacon':
      pct('TP Chance', s.teleportChance, next?.teleportChance);
      num('Cooldown', s.cooldown, next?.cooldown, 's');
      num('Range', s.range, next?.range);
      if (next?.bossStun && !s.bossStun) {
        entries.push({ label: 'Boss Stun', current: '—', delta: `+${next.bossStun}s` });
      } else if (s.bossStun) {
        entries.push({ label: 'Boss Stun', current: `${s.bossStun}s`, delta: '' });
      }
      break;
    case 'oracle':
      pct('Range Buff', s.rangeBonus, next?.rangeBonus);
      pct('Speed Buff', s.speedBonus ?? 0, next?.speedBonus);
      num('Aura', s.auraRadius, next?.auraRadius);
      break;
    case 'orbital':
      num('DMG', s.damage, next?.damage);
      num('Cooldown', s.cooldown, next?.cooldown, 's');
      if (next?.ignoreArmor && !s.ignoreArmor) {
        entries.push({ label: 'Ignore Armor', current: '—', delta: '+Yes' });
      } else if (s.ignoreArmor) {
        entries.push({ label: 'Ignore Armor', current: 'Yes', delta: '' });
      }
      break;
    default:
      num('DMG', s.damage, next?.damage);
      if (s.fireRate) num('Rate', s.fireRate, next?.fireRate, 'ms');
      if (s.range) num('Range', s.range, next?.range);
  }

  return entries;
}

export class UpgradeMenu extends Container {
  private popup: Container;
  private sw: number;
  private sh: number;

  onUpgrade?: (tower: Tower) => void;
  onSell?: (tower: Tower) => void;
  onClose?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.sw = screenWidth;
    this.sh = screenHeight;

    this.popup = new Container();
    this.addChild(this.popup);

    this.visible = false;
  }

  open(tower: Tower, coins: number): void {
    this.popup.removeChildren();

    const canUpgrade = tower.canUpgrade;
    const nextStats = canUpgrade
      ? (TOWER_CONFIGS[tower.towerType].levels[tower.level + 1] as TowerLevelStats)
      : null;
    const canAffordUpgrade = canUpgrade && nextStats ? coins >= nextStats.cost : false;

    const stats = buildStats(tower, nextStats);

    // ── Layout ────────────────────────────────────────────────────
    const titleY = PAD;
    const statsY = titleY + 22 + 6;
    const statsH = stats.length * LINE_H;
    const btnY = statsY + statsH + 8;
    const totalH = btnY + BTN_H + PAD;

    // Background
    const bg = new Graphics();
    bg.roundRect(0, 0, POPUP_W, totalH, 10).fill({ color: 0x1a1a2e });
    bg.roundRect(0, 0, POPUP_W, totalH, 10).stroke({ color: 0x44446a, width: 1.5 });
    this.popup.addChild(bg);

    // Title
    const name = TOWER_NAMES[tower.towerType] ?? tower.towerType;
    const title = new Text({
      text: `${name} · Lv ${tower.level + 1}/${tower.maxLevel + 1}`,
      style: { fontSize: 14, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' },
    });
    title.x = PAD;
    title.y = titleY;
    this.popup.addChild(title);

    // Stats
    for (let i = 0; i < stats.length; i++) {
      const entry = stats[i];
      const y = statsY + i * LINE_H;

      const label = new Text({
        text: `${entry.label}: ${entry.current}`,
        style: { fontSize: 11, fill: COLORS.textSecondary, fontFamily: 'Arial' },
      });
      label.x = PAD;
      label.y = y;
      this.popup.addChild(label);

      if (entry.delta) {
        const delta = new Text({
          text: ` ${entry.delta}`,
          style: { fontSize: 11, fill: 0x2ecc71, fontFamily: 'Arial', fontWeight: 'bold' },
        });
        delta.x = label.x + label.width;
        delta.y = y;
        this.popup.addChild(delta);
      }
    }

    // ── Buttons ───────────────────────────────────────────────────
    if (canUpgrade && nextStats) {
      const upgW = 128;
      const sellW = POPUP_W - PAD * 2 - upgW - 6;

      const upgBtn = this.makeBtn(
        `Upgrade $${nextStats.cost}`,
        upgW,
        canAffordUpgrade ? 0x2980b9 : 0x3a3a5a,
      );
      upgBtn.alpha = canAffordUpgrade ? 1 : 0.7;
      upgBtn.x = PAD;
      upgBtn.y = btnY;
      if (canAffordUpgrade) {
        upgBtn.interactive = true;
        upgBtn.cursor = 'pointer';
        upgBtn.on('pointertap', (e) => {
          e.stopPropagation();
          this.onUpgrade?.(tower);
          this.close();
        });
      }
      this.popup.addChild(upgBtn);

      const sellBtn = this.makeBtn(`Sell $${tower.sellValue}`, sellW, 0xc0392b);
      sellBtn.x = PAD + upgW + 6;
      sellBtn.y = btnY;
      sellBtn.interactive = true;
      sellBtn.cursor = 'pointer';
      sellBtn.on('pointertap', (e) => {
        e.stopPropagation();
        this.onSell?.(tower);
        this.close();
      });
      this.popup.addChild(sellBtn);
    } else {
      const sellBtn = this.makeBtn(`Sell $${tower.sellValue}`, POPUP_W - PAD * 2, 0xc0392b);
      sellBtn.x = PAD;
      sellBtn.y = btnY;
      sellBtn.interactive = true;
      sellBtn.cursor = 'pointer';
      sellBtn.on('pointertap', (e) => {
        e.stopPropagation();
        this.onSell?.(tower);
        this.close();
      });
      this.popup.addChild(sellBtn);
    }

    // ── Position ──────────────────────────────────────────────────
    let px = tower.x - POPUP_W / 2;
    let py = tower.y - CELL_SIZE / 2 - totalH - 6;

    px = Math.max(4, Math.min(px, this.sw - POPUP_W - 4));
    if (py < HUD_HEIGHT + 4) {
      py = tower.y + CELL_SIZE / 2 + 6;
    }

    this.popup.x = Math.round(px);
    this.popup.y = Math.round(py);

    this.visible = true;
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.onClose?.();
  }

  update(_dt: number): void {}

  private makeBtn(label: string, w: number, color: number): Container {
    const c = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, w, BTN_H, 6).fill({ color });
    c.addChild(bg);

    const t = new Text({
      text: label,
      style: { fontSize: 12, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' },
    });
    t.anchor.set(0.5);
    t.x = w / 2;
    t.y = BTN_H / 2;
    c.addChild(t);
    return c;
  }
}
