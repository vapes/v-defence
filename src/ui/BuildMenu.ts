import { Container, Graphics, Text } from 'pixi.js';
import { COLORS, CELL_SIZE, HUD_HEIGHT } from '../constants';
import { TowerType } from '../types';
import { TOWER_CONFIGS } from '../data/tower-stats';

const SLOT_W = 72;
const ICON_H = 52;
const LABEL_H = 34;
const PAD = 8;

export class BuildMenu extends Container {
  private popup: Container;
  private sw: number;
  private sh: number;

  onSelect?: (type: TowerType) => void;
  onClose?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.sw = screenWidth;
    this.sh = screenHeight;

    this.popup = new Container();
    this.addChild(this.popup);

    this.visible = false;
  }

  open(availableTowers: TowerType[], coins: number, worldX: number, worldY: number): void {
    this.popup.removeChildren();

    const totalW = availableTowers.length * SLOT_W + PAD * 2;
    const totalH = ICON_H + LABEL_H + PAD * 2;

    const bg = new Graphics();
    bg.roundRect(0, 0, totalW, totalH, 10).fill({ color: 0x1a1a2e });
    bg.roundRect(0, 0, totalW, totalH, 10).stroke({ color: 0x44446a, width: 1.5 });
    this.popup.addChild(bg);

    for (let i = 0; i < availableTowers.length; i++) {
      const type = availableTowers[i];
      const cost = TOWER_CONFIGS[type].levels[0].cost;
      const canAfford = coins >= cost;

      const slot = new Container();
      slot.x = PAD + i * SLOT_W;
      slot.y = PAD;

      // Icon area background
      const iconBg = new Graphics();
      iconBg.roundRect(4, 0, SLOT_W - 8, ICON_H, 6).fill({ color: 0x252545 });
      slot.addChild(iconBg);

      // Mini tower icon centered in icon area
      const icon = this.drawTowerIcon(type);
      icon.x = SLOT_W / 2;
      icon.y = ICON_H / 2 + 2;
      slot.addChild(icon);

      // Price
      const price = new Text({
        text: `$${cost}`,
        style: {
          fontSize: 13,
          fill: canAfford ? COLORS.textGold : 0x888888,
          fontFamily: 'Arial',
          fontWeight: 'bold',
        },
      });
      price.anchor.set(0.5, 0);
      price.x = SLOT_W / 2;
      price.y = ICON_H + 5;
      slot.addChild(price);

      // Tower name
      const label = new Text({
        text: type.charAt(0).toUpperCase() + type.slice(1),
        style: { fontSize: 10, fill: 0xaaaaaa, fontFamily: 'Arial' },
      });
      label.anchor.set(0.5, 0);
      label.x = SLOT_W / 2;
      label.y = ICON_H + 21;
      slot.addChild(label);

      slot.alpha = canAfford ? 1 : 0.7;
      slot.interactive = true;
      slot.cursor = canAfford ? 'pointer' : 'default';
      slot.on('pointertap', (e) => {
        e.stopPropagation();
        if (canAfford) {
          this.onSelect?.(type);
          this.close();
        }
      });

      this.popup.addChild(slot);
    }

    // Position above the cell center, clamped to screen
    let px = worldX - totalW / 2;
    let py = worldY - CELL_SIZE / 2 - totalH - 6;

    px = Math.max(4, Math.min(px, this.sw - totalW - 4));
    if (py < HUD_HEIGHT + 4) {
      py = worldY + CELL_SIZE / 2 + 6;
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

  // Called from GameScene update loop – no animation needed
  update(_dt: number): void {}

  private drawTowerIcon(type: TowerType): Graphics {
    const g = new Graphics();
    if (type === 'bullet') {
      g.circle(0, 0, 13).fill(0x555555);
      g.circle(0, 0, 13).stroke({ color: 0x333333, width: 1.5 });
      g.rect(-3, -17, 6, 17).fill(0x888888);
      g.rect(-3, -17, 6, 17).stroke({ color: 0x333333, width: 1 });
    } else {
      g.roundRect(-13, -13, 26, 26, 4).fill(0x2c3e50);
      g.roundRect(-13, -13, 26, 26, 4).stroke({ color: 0x1a252f, width: 1.5 });
      g.poly([0, -16, 7, -1, -7, -1]).fill(0xe74c3c);
      g.poly([0, -16, 7, -1, -7, -1]).stroke({ color: 0x333333, width: 1 });
    }
    return g;
  }
}
