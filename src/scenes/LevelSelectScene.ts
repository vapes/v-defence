import { Container, Graphics, Text } from 'pixi.js';
import { Scene, SceneManager } from '../core/SceneManager';
import { LEVELS } from '../data/levels';
import { COLORS } from '../constants';
import { Button } from '../ui/Button';
import { GameScene } from './GameScene';

export class LevelSelectScene extends Container implements Scene {
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    super();
    this.sceneManager = sceneManager;
  }

  onEnter(): void {
    this.removeChildren();

    const w = this.sceneManager.width;
    const h = this.sceneManager.height;

    const bg = new Graphics();
    bg.rect(0, 0, w, h).fill(0x1a1a2e);
    this.addChild(bg);

    const title = new Text({
      text: 'V-Defence',
      style: { fontSize: 36, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' },
    });
    title.anchor.set(0.5);
    title.x = w / 2;
    title.y = 80;
    this.addChild(title);

    const subtitle = new Text({
      text: 'Select Level',
      style: { fontSize: 20, fill: COLORS.textSecondary, fontFamily: 'Arial' },
    });
    subtitle.anchor.set(0.5);
    subtitle.x = w / 2;
    subtitle.y = 130;
    this.addChild(subtitle);

    const unlockedLevel = this.getUnlockedLevel();

    LEVELS.forEach((level, idx) => {
      const locked = idx + 1 > unlockedLevel;
      const btnColor = locked ? COLORS.buttonDisabled : COLORS.buttonNormal;
      const btn = new Button(`${level.id}. ${level.name}`, 280, 55, btnColor);
      btn.x = (w - 280) / 2;
      btn.y = 190 + idx * 75;
      btn.disabled = locked;

      if (locked) {
        const lockText = new Text({
          text: '🔒',
          style: { fontSize: 20, fill: 0xffffff, fontFamily: 'Arial' },
        });
        lockText.x = 290;
        lockText.y = 15;
        btn.addChild(lockText);
      }

      btn.on('pointertap', () => {
        if (!locked) {
          this.sceneManager.goTo(new GameScene(this.sceneManager, level));
        }
      });

      this.addChild(btn);
    });
  }

  private getUnlockedLevel(): number {
    try {
      const data = localStorage.getItem('v-defence-progress');
      if (data) {
        return JSON.parse(data).unlockedLevel || 1;
      }
    } catch {}
    return 1;
  }
}
