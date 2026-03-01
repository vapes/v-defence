import { Container, Graphics, Text } from 'pixi.js';
import { Scene, SceneManager } from '../core/SceneManager';
import { LevelConfig } from '../types';
import { Button } from '../ui/Button';
import { LevelSelectScene } from './LevelSelectScene';
import { GameScene } from './GameScene';

export class DefeatScene extends Container implements Scene {
  private sceneManager: SceneManager;
  private level: LevelConfig;

  constructor(sceneManager: SceneManager, level: LevelConfig) {
    super();
    this.sceneManager = sceneManager;
    this.level = level;
  }

  onEnter(): void {
    const w = this.sceneManager.width;
    const h = this.sceneManager.height;

    const bg = new Graphics();
    bg.rect(0, 0, w, h).fill(0x1a1a2e);
    this.addChild(bg);

    const title = new Text({
      text: 'Defeat',
      style: { fontSize: 48, fill: 0xe74c3c, fontFamily: 'Arial', fontWeight: 'bold' },
    });
    title.anchor.set(0.5);
    title.x = w / 2;
    title.y = h / 2 - 80;
    this.addChild(title);

    const sub = new Text({
      text: 'Your base was destroyed!',
      style: { fontSize: 20, fill: 0xffffff, fontFamily: 'Arial' },
    });
    sub.anchor.set(0.5);
    sub.x = w / 2;
    sub.y = h / 2 - 20;
    this.addChild(sub);

    const retryBtn = new Button('Retry', 200, 50);
    retryBtn.x = (w - 200) / 2;
    retryBtn.y = h / 2 + 30;
    retryBtn.on('pointertap', () => {
      this.sceneManager.goTo(new GameScene(this.sceneManager, this.level));
    });
    this.addChild(retryBtn);

    const menuBtn = new Button('Menu', 200, 50, 0x555555);
    menuBtn.x = (w - 200) / 2;
    menuBtn.y = h / 2 + 95;
    menuBtn.on('pointertap', () => {
      this.sceneManager.goTo(new LevelSelectScene(this.sceneManager));
    });
    this.addChild(menuBtn);
  }
}
