import { Container, Graphics, Text } from 'pixi.js';
import { COLORS, TOWER_BAR_HEIGHT } from '../constants';

export class WaveCountdown extends Container {
  private countdownText: Text;
  private buildPhaseContainer: Container;
  private buildPhaseLabel: Text;

  onStartWave?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    // Countdown text (shown between waves during auto-countdown)
    this.countdownText = new Text({
      text: '',
      style: { fontSize: 36, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold', dropShadow: true },
    });
    this.countdownText.anchor.set(0.5);
    this.countdownText.x = screenWidth / 2;
    this.countdownText.y = screenHeight / 2;
    this.countdownText.visible = false;
    this.addChild(this.countdownText);

    // Build phase panel at bottom of screen
    this.buildPhaseContainer = new Container();
    this.buildPhaseContainer.visible = false;

    const panelW = screenWidth - 40;
    const panelH = 90;
    const panelX = 20;
    const panelY = screenHeight - TOWER_BAR_HEIGHT - panelH - 10;

    const bg = new Graphics();
    bg.roundRect(panelX, panelY, panelW, panelH, 10).fill({ color: COLORS.hudBackground, alpha: 0.92 });
    this.buildPhaseContainer.addChild(bg);

    this.buildPhaseLabel = new Text({
      text: '',
      style: { fontSize: 16, fill: COLORS.textGold, fontFamily: 'Arial', fontWeight: 'bold' },
    });
    this.buildPhaseLabel.anchor.set(0.5, 0);
    this.buildPhaseLabel.x = screenWidth / 2;
    this.buildPhaseLabel.y = panelY + 10;
    this.buildPhaseContainer.addChild(this.buildPhaseLabel);

    const btnW = 150;
    const btnH = 38;
    const btnX = screenWidth / 2 - btnW / 2;
    const btnY = panelY + 40;

    const btnBg = new Graphics();
    btnBg.roundRect(btnX, btnY, btnW, btnH, 8).fill(COLORS.buttonNormal);
    btnBg.interactive = true;
    btnBg.cursor = 'pointer';
    btnBg.on('pointerover', () => {
      btnBg.clear();
      btnBg.roundRect(btnX, btnY, btnW, btnH, 8).fill(COLORS.buttonHover);
    });
    btnBg.on('pointerout', () => {
      btnBg.clear();
      btnBg.roundRect(btnX, btnY, btnW, btnH, 8).fill(COLORS.buttonNormal);
    });
    btnBg.on('pointerdown', () => this.onStartWave?.());
    this.buildPhaseContainer.addChild(btnBg);

    const btnLabel = new Text({
      text: 'Start Wave',
      style: { fontSize: 16, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' },
    });
    btnLabel.anchor.set(0.5);
    btnLabel.x = screenWidth / 2;
    btnLabel.y = btnY + btnH / 2;
    this.buildPhaseContainer.addChild(btnLabel);

    this.addChild(this.buildPhaseContainer);
    this.visible = false;
  }

  show(seconds: number): void {
    this.visible = true;
    this.countdownText.visible = true;
    this.buildPhaseContainer.visible = false;
    this.countdownText.text = `Next wave in ${seconds}...`;
  }

  showBuildPhase(wave: number, totalWaves: number): void {
    this.visible = true;
    this.countdownText.visible = false;
    this.buildPhaseContainer.visible = true;
    this.buildPhaseLabel.text = `Wave ${wave}/${totalWaves} — Place your towers!`;
  }

  hide(): void {
    this.visible = false;
    this.countdownText.visible = false;
    this.buildPhaseContainer.visible = false;
  }
}
