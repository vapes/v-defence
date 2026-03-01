import { Container, Text } from 'pixi.js';

export class WaveCountdown extends Container {
  private text: Text;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.text = new Text({
      text: '',
      style: { fontSize: 36, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold', dropShadow: true },
    });
    this.text.anchor.set(0.5);
    this.text.x = screenWidth / 2;
    this.text.y = screenHeight / 2;
    this.addChild(this.text);
    this.visible = false;
  }

  show(seconds: number): void {
    this.visible = true;
    this.text.text = `Next wave in ${seconds}...`;
  }

  hide(): void {
    this.visible = false;
  }
}
