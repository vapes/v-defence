import { Text } from 'pixi.js';

export class HealthBar extends Text {
  constructor() {
    super({ text: '', style: { fontSize: 11, fill: 0xffffff, fontWeight: 'bold' } });
    this.anchor.set(0.5, 0.5);
    this.y = 0;
  }

  updateHealth(ratio: number, current?: number, max?: number): void {
    if (current !== undefined) {
      this.text = Math.ceil(current).toString();
    }
  }
}
