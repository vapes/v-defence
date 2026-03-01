import { Container, Graphics, Text } from 'pixi.js';
import { COLORS, CELL_SIZE, HUD_HEIGHT } from '../constants';
import { Tower } from '../game/towers/Tower';
import TOWER_CONFIGS from '../data/tower-configs.json';

const POPUP_W = 224;
const PAD = 10;
const BTN_H = 32;

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
    const nextStats = canUpgrade ? TOWER_CONFIGS[tower.towerType].levels[tower.level + 1] : null;
    const canAffordUpgrade = canUpgrade && nextStats ? coins >= nextStats.cost : false;

    // ── Layout metrics ──────────────────────────────────────────────
    const titleY = PAD;
    const statsY = titleY + 22 + 4;
    const hintY = statsY + 16 + 3;
    const showHint = canUpgrade && nextStats !== null;
    const btnY = (showHint ? hintY + 14 : statsY + 16) + 10;
    const totalH = btnY + BTN_H + PAD;

    // Background
    const bg = new Graphics();
    bg.roundRect(0, 0, POPUP_W, totalH, 10).fill({ color: 0x1a1a2e });
    bg.roundRect(0, 0, POPUP_W, totalH, 10).stroke({ color: 0x44446a, width: 1.5 });
    this.popup.addChild(bg);

    // Title — "Bullet · Lv 1/3"
    const title = new Text({
      text: `${tower.towerType.charAt(0).toUpperCase() + tower.towerType.slice(1)} · Lv ${tower.level + 1}/${tower.maxLevel + 1}`,
      style: { fontSize: 14, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' },
    });
    title.x = PAD;
    title.y = titleY;
    this.popup.addChild(title);

    // Current stats
    const s = tower.stats;
    const statsText = new Text({
      text: `DMG ${s.damage}  Rate ${s.fireRate}ms  Rng ${s.range}`,
      style: { fontSize: 11, fill: COLORS.textSecondary, fontFamily: 'Arial' },
    });
    statsText.x = PAD;
    statsText.y = statsY;
    this.popup.addChild(statsText);

    // Next-level hint
    if (showHint && nextStats) {
      const hint = new Text({
        text: `→ DMG ${nextStats.damage}  Rate ${nextStats.fireRate}ms  Rng ${nextStats.range}`,
        style: { fontSize: 11, fill: COLORS.textGold, fontFamily: 'Arial' },
      });
      hint.x = PAD;
      hint.y = hintY;
      this.popup.addChild(hint);
    }

    // ── Buttons ─────────────────────────────────────────────────────
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
      // Max level — sell spans full width
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

    // ── Position above/below the tower, clamped to screen ───────────
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
