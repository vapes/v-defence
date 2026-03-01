import { Container, Graphics, Text } from 'pixi.js';
import { Scene, SceneManager } from '../core/SceneManager';
import { LEVELS } from '../data/levels';
import { COLORS } from '../constants';
import { Button } from '../ui/Button';
import { GameScene } from './GameScene';

const COLS = 4;
const BTN_W = 92;
const BTN_H = 65;
const COL_GAP = 8;
const ROW_GAP = 10;

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
    title.y = 60;
    this.addChild(title);

    const subtitle = new Text({
      text: 'Select Level',
      style: { fontSize: 20, fill: COLORS.textSecondary, fontFamily: 'Arial' },
    });
    subtitle.anchor.set(0.5);
    subtitle.x = w / 2;
    subtitle.y = 105;
    this.addChild(subtitle);

    const bossNote = new Text({
      text: '★ Boss appears at the end of every level',
      style: { fontSize: 13, fill: 0x2ecc71, fontFamily: 'Arial' },
    });
    bossNote.anchor.set(0.5);
    bossNote.x = w / 2;
    bossNote.y = 135;
    this.addChild(bossNote);

    const unlockedLevel = this.getUnlockedLevel();

    const totalW = COLS * BTN_W + (COLS - 1) * COL_GAP;
    const startX = (w - totalW) / 2;
    const startY = 165;

    LEVELS.forEach((level, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const locked = idx + 1 > unlockedLevel;
      const btnColor = locked ? COLORS.buttonDisabled : COLORS.buttonNormal;

      const btn = new Button(`${level.id}`, BTN_W, BTN_H, btnColor);
      btn.x = startX + col * (BTN_W + COL_GAP);
      btn.y = startY + row * (BTN_H + ROW_GAP);
      btn.disabled = locked;

      const nameText = new Text({
        text: level.name,
        style: { fontSize: 9, fill: 0xcccccc, fontFamily: 'Arial' },
      });
      nameText.anchor.set(0.5, 0);
      nameText.x = BTN_W / 2;
      nameText.y = BTN_H - 16;
      btn.addChild(nameText);

      if (locked) {
        const lockText = new Text({
          text: '🔒',
          style: { fontSize: 16, fill: 0xffffff, fontFamily: 'Arial' },
        });
        lockText.anchor.set(0.5);
        lockText.x = BTN_W / 2;
        lockText.y = BTN_H / 2 - 6;
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
