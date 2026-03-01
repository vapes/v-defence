import { Container, Graphics, Text } from 'pixi.js';
import { CELL_SIZE, TOWER_BAR_HEIGHT } from '../constants';

export enum TutorialStep {
  TapCell = 0,
  BuildTower = 1,
  TowerBuilt = 2,
  Done = 3,
}

export class Tutorial extends Container {
  private overlay: Graphics;
  private messageBox: Graphics;
  private messageText: Text;
  private highlightGfx: Graphics;
  private pulseTimer: number = 0;
  private screenWidth: number;
  private screenHeight: number;

  private _step: TutorialStep = TutorialStep.TapCell;
  private _paused: boolean = true;

  /** Called when the tutorial finishes all steps */
  onComplete?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // Semi-transparent overlay (non-interactive so clicks pass through)
    this.overlay = new Graphics();
    this.addChild(this.overlay);

    // Pulsing highlight ring around the target cell
    this.highlightGfx = new Graphics();
    this.addChild(this.highlightGfx);

    // Message box at bottom
    this.messageBox = new Graphics();
    this.addChild(this.messageBox);

    this.messageText = new Text({
      text: '',
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontFamily: 'Arial',
        wordWrap: true,
        wordWrapWidth: screenWidth - 60,
        align: 'center',
      },
    });
    this.messageText.anchor.set(0.5, 0.5);
    this.addChild(this.messageText);

    this.showStep(TutorialStep.TapCell);
  }

  /** The grid position to highlight for step 0 — set by GameScene */
  highlightWorldX: number = 0;
  highlightWorldY: number = 0;

  get step(): TutorialStep {
    return this._step;
  }

  /** Whether the tutorial is pausing wave progression */
  get paused(): boolean {
    return this._paused;
  }

  showStep(step: TutorialStep): void {
    this._step = step;

    switch (step) {
      case TutorialStep.TapCell:
        this._paused = true;
        this.setMessage('Drag a tower from the bottom bar\nto a green cell next to the path');
        this.highlightGfx.visible = true;
        break;

      case TutorialStep.BuildTower:
        this._paused = true;
        this.setMessage('Drop the tower on the highlighted cell');
        this.highlightGfx.visible = false;
        break;

      case TutorialStep.TowerBuilt:
        this._paused = false;
        this.setMessage('Towers shoot enemies automatically.\nDefend your base!');
        this.highlightGfx.visible = false;
        // Auto-advance after a short delay
        setTimeout(() => {
          this.showStep(TutorialStep.Done);
        }, 2500);
        break;

      case TutorialStep.Done:
        this._paused = false;
        this.visible = false;
        this.onComplete?.();
        return;
    }

    this.visible = true;
  }

  advance(): void {
    this.showStep(this._step + 1);
  }

  update(dt: number): void {
    if (!this.visible) return;

    // Pulsing highlight
    if (this.highlightGfx.visible) {
      this.pulseTimer += dt * 0.05;
      const pulse = 0.6 + Math.sin(this.pulseTimer * 4) * 0.4;
      this.highlightGfx.clear();
      this.highlightGfx
        .roundRect(
          this.highlightWorldX - CELL_SIZE / 2 - 4,
          this.highlightWorldY - CELL_SIZE / 2 - 4,
          CELL_SIZE + 8,
          CELL_SIZE + 8,
          6
        )
        .stroke({ color: 0xffd700, width: 3, alpha: pulse });
    }
  }

  private setMessage(text: string): void {
    this.messageText.text = text;

    const boxW = this.screenWidth - 40;
    const boxH = 70;
    const boxX = 20;
    const boxY = this.screenHeight - TOWER_BAR_HEIGHT - boxH - 10;

    this.messageBox.clear();
    this.messageBox.roundRect(boxX, boxY, boxW, boxH, 10).fill({ color: 0x000000, alpha: 0.8 });

    this.messageText.x = boxX + boxW / 2;
    this.messageText.y = boxY + boxH / 2;
  }
}
