import { Container, Graphics, Text } from 'pixi.js';
import { COLORS } from '../constants';

export class Button extends Container {
  private bg: Graphics;
  private labelText: Text;
  private _disabled: boolean = false;
  private normalColor: number;

  constructor(text: string, width: number, height: number, color: number = COLORS.buttonNormal) {
    super();
    this.normalColor = color;

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.labelText = new Text({ text, style: { fontSize: 18, fill: 0xffffff, fontFamily: 'Arial' } });
    this.labelText.anchor.set(0.5);
    this.labelText.x = width / 2;
    this.labelText.y = height / 2;
    this.addChild(this.labelText);

    this.drawBg(color, width, height);

    this.interactive = true;
    this.cursor = 'pointer';

    this.on('pointerover', () => {
      if (!this._disabled) this.drawBg(COLORS.buttonHover, width, height);
    });
    this.on('pointerout', () => {
      if (!this._disabled) this.drawBg(this.normalColor, width, height);
    });
  }

  private drawBg(color: number, w: number, h: number): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, w, h, 8).fill(color);
  }

  set disabled(val: boolean) {
    this._disabled = val;
    this.interactive = !val;
    this.alpha = val ? 0.5 : 1;
  }

  get disabled(): boolean {
    return this._disabled;
  }

  setText(text: string): void {
    this.labelText.text = text;
  }
}
