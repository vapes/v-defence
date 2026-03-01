import { Container, Graphics, Text } from 'pixi.js';
import { COLORS, DESIGN_WIDTH } from '../constants';
import { TowerType } from '../types';
import { TOWER_CONFIGS } from '../data/tower-stats';
import { Button } from './Button';

export class BuildMenu extends Container {
  private panel: Container;
  private overlay: Graphics;
  private targetX: number = 0;
  private isOpen: boolean = false;
  private panelWidth = 200;
  private buttons: { btn: Button; type: TowerType }[] = [];

  onSelect?: (type: TowerType) => void;
  onClose?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    this.overlay = new Graphics();
    this.overlay.rect(0, 0, screenWidth, screenHeight).fill({ color: COLORS.panelOverlay, alpha: 0.4 });
    this.overlay.interactive = true;
    this.overlay.on('pointertap', () => this.close());
    this.addChild(this.overlay);

    this.panel = new Container();
    this.panel.x = -this.panelWidth;
    this.addChild(this.panel);

    const bg = new Graphics();
    bg.rect(0, 0, this.panelWidth, screenHeight).fill(COLORS.panelBackground);
    this.panel.addChild(bg);

    const title = new Text({ text: 'Build Tower', style: { fontSize: 20, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' } });
    title.x = 15;
    title.y = 70;
    this.panel.addChild(title);

    this.visible = false;
  }

  open(availableTowers: TowerType[], coins: number): void {
    this.clearButtons();
    let y = 110;

    for (const type of availableTowers) {
      const cfg = TOWER_CONFIGS[type];
      const cost = cfg.levels[0].cost;
      const label = `${type.charAt(0).toUpperCase() + type.slice(1)} ($${cost})`;
      const btn = new Button(label, 170, 45, COLORS.buttonNormal);
      btn.x = 15;
      btn.y = y;
      btn.disabled = coins < cost;
      btn.on('pointertap', () => {
        this.onSelect?.(type);
        this.close();
      });
      this.panel.addChild(btn);
      this.buttons.push({ btn, type });
      y += 60;
    }

    this.visible = true;
    this.isOpen = true;
    this.targetX = 0;
  }

  close(): void {
    this.isOpen = false;
    this.targetX = -this.panelWidth;
    this.onClose?.();
  }

  update(dt: number): void {
    this.panel.x += (this.targetX - this.panel.x) * 0.2 * dt;
    if (!this.isOpen && this.panel.x <= -this.panelWidth + 1) {
      this.visible = false;
    }
  }

  private clearButtons(): void {
    for (const { btn } of this.buttons) {
      this.panel.removeChild(btn);
      btn.destroy();
    }
    this.buttons = [];
  }
}
