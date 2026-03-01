import { Container, Graphics, Text } from 'pixi.js';
import { Scene, SceneManager } from '../core/SceneManager';
import { Button } from '../ui/Button';
import { LevelSelectScene } from './LevelSelectScene';

export class VictoryScene extends Container implements Scene {
  private sceneManager: SceneManager;
  private levelId: number;

  constructor(sceneManager: SceneManager, levelId: number) {
    super();
    this.sceneManager = sceneManager;
    this.levelId = levelId;
  }

  onEnter(): void {
    const w = this.sceneManager.width;
    const h = this.sceneManager.height;

    const bg = new Graphics();
    bg.rect(0, 0, w, h).fill(0x1a1a2e);
    this.addChild(bg);

    const title = new Text({
      text: 'Victory!',
      style: { fontSize: 48, fill: 0xffd700, fontFamily: 'Arial', fontWeight: 'bold' },
    });
    title.anchor.set(0.5);
    title.x = w / 2;
    title.y = h / 2 - 80;
    this.addChild(title);

    const sub = new Text({
      text: `Level ${this.levelId} Complete`,
      style: { fontSize: 22, fill: 0xffffff, fontFamily: 'Arial' },
    });
    sub.anchor.set(0.5);
    sub.x = w / 2;
    sub.y = h / 2 - 20;
    this.addChild(sub);

    this.unlockNextLevel();

    const btn = new Button('Continue', 200, 50);
    btn.x = (w - 200) / 2;
    btn.y = h / 2 + 40;
    btn.on('pointertap', () => {
      this.sceneManager.goTo(new LevelSelectScene(this.sceneManager));
    });
    this.addChild(btn);
  }

  private unlockNextLevel(): void {
    try {
      const data = localStorage.getItem('v-defence-progress');
      const progress = data ? JSON.parse(data) : { unlockedLevel: 1 };
      if (this.levelId >= progress.unlockedLevel) {
        progress.unlockedLevel = this.levelId + 1;
        localStorage.setItem('v-defence-progress', JSON.stringify(progress));
      }
    } catch {}
  }
}
