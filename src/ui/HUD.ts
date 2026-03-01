import { Container, Graphics, Text } from 'pixi.js';
import { COLORS, HUD_HEIGHT } from '../constants';

export class HUD extends Container {
  private bg: Graphics;
  private coinsText: Text;
  private wavesText: Text;
  private livesText: Text;

  private _coins: number = 0;
  private _lives: number = 0;
  private _wave: number = 0;
  private _totalWaves: number = 0;

  constructor(screenWidth: number) {
    super();
    this.bg = new Graphics();
    this.bg.rect(0, 0, screenWidth, HUD_HEIGHT).fill(COLORS.hudBackground);
    this.addChild(this.bg);

    const style = { fontSize: 16, fill: 0xffffff, fontFamily: 'Arial' };

    this.coinsText = new Text({ text: '', style: { ...style, fill: COLORS.textGold } });
    this.coinsText.x = 10;
    this.coinsText.y = 15;
    this.addChild(this.coinsText);

    this.wavesText = new Text({ text: '', style });
    this.wavesText.anchor.set(0.5, 0);
    this.wavesText.x = screenWidth / 2;
    this.wavesText.y = 15;
    this.addChild(this.wavesText);

    this.livesText = new Text({ text: '', style: { ...style, fill: 0xff6b6b } });
    this.livesText.anchor.set(1, 0);
    this.livesText.x = screenWidth - 10;
    this.livesText.y = 15;
    this.addChild(this.livesText);
  }

  set coins(v: number) {
    this._coins = v;
    this.coinsText.text = `Coins: ${v}`;
  }
  get coins(): number { return this._coins; }

  set lives(v: number) {
    this._lives = v;
    this.livesText.text = `Lives: ${v}`;
  }
  get lives(): number { return this._lives; }

  setWave(current: number, total: number): void {
    this._wave = current;
    this._totalWaves = total;
    this.wavesText.text = `Wave ${current}/${total}`;
  }

  get coinTextPosition(): { x: number; y: number } {
    return { x: this.coinsText.x + 40, y: this.coinsText.y + 10 };
  }
}
