import { Container, Graphics, Text } from 'pixi.js';
import { COLORS, TOWER_BAR_HEIGHT } from '../constants';
import { TowerType } from '../types';
import { towers as TOWER_CONFIGS } from '../data/tower-configs.json';

const SLOT_W = 76;
const SLOT_H = 80;
const SLOT_PAD = 4;

export class TowerBar extends Container {
  private bg: Graphics;
  private slotsContainer: Container;
  private scrollMask: Graphics;
  private scrollX: number = 0;
  private scrollMaxX: number = 0;
  private sw: number;
  private sh: number;

  onTowerDragStart?: (type: TowerType, globalX: number, globalY: number) => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.sw = screenWidth;
    this.sh = screenHeight;

    const barY = screenHeight - TOWER_BAR_HEIGHT;

    // Dark background panel
    this.bg = new Graphics();
    this.bg.rect(0, barY, screenWidth, TOWER_BAR_HEIGHT).fill({ color: COLORS.panelBackground });
    this.bg.rect(0, barY, screenWidth, 2).fill({ color: 0x44446a });
    this.bg.interactive = true;
    this.addChild(this.bg);

    // Scrollable slots container
    this.slotsContainer = new Container();
    this.addChild(this.slotsContainer);

    // Mask clipping to bar area
    this.scrollMask = new Graphics();
    this.scrollMask.rect(0, barY, screenWidth, TOWER_BAR_HEIGHT).fill(0xffffff);
    this.addChild(this.scrollMask);
    this.slotsContainer.mask = this.scrollMask;

    this.setupScrollInteraction();
  }

  /** Call whenever available towers or coins change */
  setTowers(available: TowerType[], coins: number): void {
    this.buildSlots(available, coins);
  }

  private buildSlots(available: TowerType[], coins: number): void {
    this.slotsContainer.removeChildren();

    const barY = this.sh - TOWER_BAR_HEIGHT;
    const totalW = available.length * SLOT_W + SLOT_PAD * 2;

    this.scrollMaxX = Math.max(0, totalW - this.sw);
    this.scrollX = Math.min(this.scrollX, this.scrollMaxX);

    // Center content when it fits, otherwise start at left edge
    const contentStartX =
      totalW <= this.sw ? (this.sw - totalW) / 2 + SLOT_PAD : SLOT_PAD;

    for (let i = 0; i < available.length; i++) {
      const type = available[i];
      const cost = TOWER_CONFIGS[type].levels[0].cost;
      const canAfford = coins >= cost;

      const slot = new Container();
      slot.x = contentStartX + i * SLOT_W;
      slot.y = barY + (TOWER_BAR_HEIGHT - SLOT_H) / 2;

      // Slot background
      const slotBg = new Graphics();
      slotBg
        .roundRect(2, 2, SLOT_W - 4, SLOT_H - 4, 8)
        .fill({ color: canAfford ? 0x252545 : 0x1a1a2e });
      slotBg
        .roundRect(2, 2, SLOT_W - 4, SLOT_H - 4, 8)
        .stroke({ color: canAfford ? 0x44446a : 0x2a2a40, width: 1 });
      slot.addChild(slotBg);

      // Tower icon
      const icon = drawTowerIcon(type);
      icon.x = SLOT_W / 2;
      icon.y = 26;
      slot.addChild(icon);

      // Cost label
      const price = new Text({
        text: `$${cost}`,
        style: {
          fontSize: 12,
          fill: canAfford ? COLORS.textGold : 0x555555,
          fontFamily: 'Arial',
          fontWeight: 'bold',
        },
      });
      price.anchor.set(0.5, 0);
      price.x = SLOT_W / 2;
      price.y = 46;
      slot.addChild(price);

      // Tower name
      const label = new Text({
        text: formatName(type),
        style: { fontSize: 9, fill: canAfford ? 0xaaaaaa : 0x444455, fontFamily: 'Arial' },
      });
      label.anchor.set(0.5, 0);
      label.x = SLOT_W / 2;
      label.y = 61;
      slot.addChild(label);

      slot.alpha = canAfford ? 1.0 : 0.55;

      if (canAfford) {
        slot.interactive = true;
        slot.cursor = 'grab';
        slot.on('pointerdown', (e) => {
          e.stopPropagation();
          const startX = e.global.x;
          const startY = e.global.y;
          let dragStarted = false;

          const onMove = (evt: PointerEvent) => {
            if (dragStarted) return;
            const dx = evt.clientX - startX;
            const dy = evt.clientY - startY;
            if (dx * dx + dy * dy > 64) {
              dragStarted = true;
              cleanup();
              this.onTowerDragStart?.(type, evt.clientX, evt.clientY);
            }
          };

          const onUp = () => cleanup();

          const cleanup = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
          };

          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
        });
      }

      this.slotsContainer.addChild(slot);
    }

    // Apply current scroll offset
    this.slotsContainer.x = -this.scrollX;
  }

  private setupScrollInteraction(): void {
    let scrollStartX = 0;
    let scrollStartVal = 0;
    let active = false;

    this.bg.on('pointerdown', (e) => {
      active = true;
      scrollStartX = e.global.x;
      scrollStartVal = this.scrollX;
    });

    this.bg.on('pointermove', (e) => {
      if (!active || this.scrollMaxX === 0) return;
      const dx = scrollStartX - e.global.x;
      this.scrollX = Math.max(0, Math.min(this.scrollMaxX, scrollStartVal + dx));
      this.slotsContainer.x = -this.scrollX;
    });

    this.bg.on('pointerup', () => { active = false; });
    this.bg.on('pointerupoutside', () => { active = false; });
  }
}

function formatName(type: TowerType): string {
  if (type === 'gold_mine') return 'Gold Mine';
  if (type === 'void_beacon') return 'Void';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function drawTowerIcon(type: TowerType): Graphics {
  const g = new Graphics();
  switch (type) {
    case 'bullet':
      g.circle(0, 0, 13).fill(0x555555);
      g.circle(0, 0, 13).stroke({ color: 0x333333, width: 1.5 });
      g.rect(-3, -17, 6, 17).fill(0x888888);
      g.rect(-3, -17, 6, 17).stroke({ color: 0x333333, width: 1 });
      break;
    case 'laser':
      g.roundRect(-13, -13, 26, 26, 4).fill(0x2c3e50);
      g.roundRect(-13, -13, 26, 26, 4).stroke({ color: 0x1a252f, width: 1.5 });
      g.poly([0, -16, 7, -1, -7, -1]).fill(0xe74c3c);
      g.poly([0, -16, 7, -1, -7, -1]).stroke({ color: 0x333333, width: 1 });
      break;
    case 'mortar':
      g.circle(0, 0, 13).fill(0x6b4226);
      g.circle(0, 0, 13).stroke({ color: 0x3c1f0a, width: 1.5 });
      g.circle(0, 0, 6).fill(0x3c1f0a);
      break;
    case 'cryo':
      g.circle(0, 0, 13).fill(0x4fc3f7);
      g.circle(0, 0, 13).stroke({ color: 0x0288d1, width: 1.5 });
      g.rect(-2, -12, 4, 24).fill(0xffffff);
      g.rect(-12, -2, 24, 4).fill(0xffffff);
      break;
    case 'alchemist':
      g.circle(0, 0, 13).fill(0x8e44ad);
      g.circle(0, 0, 13).stroke({ color: 0x6c3483, width: 1.5 });
      g.circle(0, 0, 5).fill(0xd7bde2);
      break;
    case 'gold_mine':
      g.circle(0, 0, 13).fill(0xf39c12);
      g.circle(0, 0, 13).stroke({ color: 0xd68910, width: 1.5 });
      g.circle(0, 0, 6).fill(0xffd700);
      break;
    case 'tesla':
      g.circle(0, 0, 13).fill(0x1a1a2e);
      g.circle(0, 0, 13).stroke({ color: 0x9b59b6, width: 2 });
      g.poly([-3, -12, 3, -2, -2, -2, 2, 12, -3, 0, 3, 0]).fill(0xffd700);
      break;
    case 'void_beacon':
      g.circle(0, 0, 13).fill(0x0d0d1a);
      g.circle(0, 0, 13).stroke({ color: 0x8b00ff, width: 2 });
      g.circle(0, 0, 5).fill(0x8b00ff);
      break;
    case 'oracle':
      g.circle(0, 0, 13).fill(0x1abc9c);
      g.circle(0, 0, 13).stroke({ color: 0x16a085, width: 1.5 });
      g.circle(0, 0, 4).fill(0xffffff);
      break;
    case 'orbital':
      g.circle(0, 0, 13).fill(0x2c3e50);
      g.circle(0, 0, 13).stroke({ color: 0xe74c3c, width: 2 });
      g.circle(0, 0, 4).fill(0xe74c3c);
      break;
    default:
      g.circle(0, 0, 13).fill(0x555555);
  }
  return g;
}
