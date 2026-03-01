import { Container, Graphics, Text } from 'pixi.js';
import { COLORS } from '../constants';
import { Tower } from '../game/towers/Tower';
import { TOWER_CONFIGS } from '../data/tower-stats';
import { Button } from './Button';

export class UpgradeMenu extends Container {
  private panel: Container;
  private overlay: Graphics;
  private targetX: number = 0;
  private isOpen: boolean = false;
  private panelWidth = 220;
  private contentContainer: Container;

  onUpgrade?: (tower: Tower) => void;
  onSell?: (tower: Tower) => void;
  onClose?: () => void;

  private currentTower: Tower | null = null;

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

    this.contentContainer = new Container();
    this.panel.addChild(this.contentContainer);

    this.visible = false;
  }

  open(tower: Tower, coins: number): void {
    this.currentTower = tower;
    this.contentContainer.removeChildren();

    const style = { fontSize: 14, fill: 0xffffff, fontFamily: 'Arial' };

    const title = new Text({
      text: `${tower.towerType.charAt(0).toUpperCase() + tower.towerType.slice(1)} Tower`,
      style: { fontSize: 20, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' },
    });
    title.x = 15;
    title.y = 70;
    this.contentContainer.addChild(title);

    const levelText = new Text({ text: `Level: ${tower.level + 1}/${tower.maxLevel + 1}`, style });
    levelText.x = 15;
    levelText.y = 100;
    this.contentContainer.addChild(levelText);

    const stats = tower.stats;
    const statsText = new Text({
      text: `DMG: ${stats.damage}\nRate: ${stats.fireRate}ms\nRange: ${stats.range}`,
      style: { ...style, fontSize: 13, lineHeight: 20 },
    });
    statsText.x = 15;
    statsText.y = 125;
    this.contentContainer.addChild(statsText);

    if (tower.canUpgrade) {
      const nextStats = TOWER_CONFIGS[tower.towerType].levels[tower.level + 1];
      const upgradeBtn = new Button(`Upgrade ($${nextStats.cost})`, 190, 40, 0x2980b9);
      upgradeBtn.x = 15;
      upgradeBtn.y = 200;
      upgradeBtn.disabled = coins < nextStats.cost;
      upgradeBtn.on('pointertap', () => {
        this.onUpgrade?.(tower);
        this.close();
      });
      this.contentContainer.addChild(upgradeBtn);

      const nextText = new Text({
        text: `→ DMG: ${nextStats.damage}, Rate: ${nextStats.fireRate}ms`,
        style: { fontSize: 11, fill: COLORS.textGold, fontFamily: 'Arial' },
      });
      nextText.x = 15;
      nextText.y = 250;
      this.contentContainer.addChild(nextText);
    }

    const sellBtn = new Button(`Sell ($${tower.sellValue})`, 190, 40, 0xc0392b);
    sellBtn.x = 15;
    sellBtn.y = tower.canUpgrade ? 280 : 200;
    sellBtn.on('pointertap', () => {
      this.onSell?.(tower);
      this.close();
    });
    this.contentContainer.addChild(sellBtn);

    this.visible = true;
    this.isOpen = true;
    this.targetX = 0;
  }

  close(): void {
    this.isOpen = false;
    this.targetX = -this.panelWidth;
    this.currentTower = null;
    this.onClose?.();
  }

  update(dt: number): void {
    this.panel.x += (this.targetX - this.panel.x) * 0.2 * dt;
    if (!this.isOpen && this.panel.x <= -this.panelWidth + 1) {
      this.visible = false;
    }
  }
}
