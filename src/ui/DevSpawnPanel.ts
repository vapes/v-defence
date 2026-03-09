import { Container, Graphics, Text } from 'pixi.js';
import { EnemyType, WaveGroup } from '../types';
import { COLORS, TOWER_BAR_HEIGHT } from '../constants';

const ENEMY_TYPES: EnemyType[] = ['circle', 'circle2', 'triangle', 'mtriangle', 'hexagon', 'square', 'pentagon', 'titan'];
const ENEMY_LABELS: Record<EnemyType, string> = {
  circle: 'Circle', circle2: 'Circle2', triangle: 'Tri', mtriangle: 'mTri',
  hexagon: 'Hex', square: 'Sqr', pentagon: 'Pent', titan: 'Titan',
};
const INTERVALS: [string, number][] = [['Fast', 200], ['Med', 500], ['Slow', 1000]];

export class DevSpawnPanel extends Container {
  onStartWave?: (groups: WaveGroup[]) => void;

  private counts: Record<EnemyType, number> = {} as Record<EnemyType, number>;
  private countTexts: Record<EnemyType, Text> = {} as Record<EnemyType, Text>;
  private selectedInterval: number = 500;
  private intervalBtns: Map<number, { g: Graphics; x: number; y: number; w: number; h: number }> = new Map();
  private startBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private startBtn!: Graphics;
  private startBtnText!: Text;
  private spawning: boolean = false;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    for (const t of ENEMY_TYPES) this.counts[t] = 0;

    const PAD = 8;
    const panelW = screenWidth - 20;
    const panelX = 10;
    const rowH = 34;
    const headerH = 22;
    const intervalRowH = 32;
    const btnRowH = 36;
    const totalH = PAD + headerH + 4 + rowH * 2 + 4 + intervalRowH + 4 + btnRowH + PAD;
    const panelY = screenHeight - TOWER_BAR_HEIGHT - totalH - 4;

    // Background
    const bg = new Graphics();
    bg.roundRect(panelX, panelY, panelW, totalH, 10).fill({ color: COLORS.hudBackground, alpha: 0.95 });
    this.addChild(bg);

    let cy = panelY + PAD;

    // Header
    const header = new Text({ text: '⚙ DEV SPAWN', style: { fontSize: 13, fill: COLORS.textGold, fontFamily: 'Arial', fontWeight: 'bold' } });
    header.anchor.set(0.5, 0);
    header.x = screenWidth / 2;
    header.y = cy;
    this.addChild(header);
    cy += headerH + 4;

    // Enemy grid: 4 cols x 2 rows
    const cols = 4;
    const colW = (panelW - PAD * 2) / cols;
    ENEMY_TYPES.forEach((type, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = panelX + PAD + col * colW + colW / 2;
      const ry = cy + row * rowH;

      const nameText = new Text({ text: ENEMY_LABELS[type], style: { fontSize: 10, fill: COLORS.textSecondary, fontFamily: 'Arial' } });
      nameText.anchor.set(0.5, 0);
      nameText.x = cx;
      nameText.y = ry;
      this.addChild(nameText);

      const BW = 18; const BH = 16; const BY = ry + 14;

      // [-]
      const minus = new Graphics();
      minus.roundRect(cx - 28, BY, BW, BH, 3).fill(COLORS.buttonNormal);
      minus.interactive = true; minus.cursor = 'pointer';
      minus.on('pointerdown', () => {
        if (this.counts[type] > 0) { this.counts[type]--; this.countTexts[type].text = String(this.counts[type]); }
      });
      this.addChild(minus);
      const mt = new Text({ text: '−', style: { fontSize: 12, fill: 0xffffff, fontFamily: 'Arial' } });
      mt.anchor.set(0.5); mt.x = cx - 28 + BW / 2; mt.y = BY + BH / 2;
      this.addChild(mt);

      // Count
      const ct = new Text({ text: '0', style: { fontSize: 12, fill: COLORS.textPrimary, fontFamily: 'Arial', fontWeight: 'bold' } });
      ct.anchor.set(0.5); ct.x = cx; ct.y = BY + BH / 2;
      this.addChild(ct);
      this.countTexts[type] = ct;

      // [+]
      const plus = new Graphics();
      plus.roundRect(cx + 10, BY, BW, BH, 3).fill(COLORS.buttonNormal);
      plus.interactive = true; plus.cursor = 'pointer';
      plus.on('pointerdown', () => { this.counts[type]++; this.countTexts[type].text = String(this.counts[type]); });
      this.addChild(plus);
      const pt = new Text({ text: '+', style: { fontSize: 12, fill: 0xffffff, fontFamily: 'Arial' } });
      pt.anchor.set(0.5); pt.x = cx + 10 + BW / 2; pt.y = BY + BH / 2;
      this.addChild(pt);
    });

    cy += rowH * 2 + 4;

    // Interval selector
    const intLabel = new Text({ text: 'Interval:', style: { fontSize: 11, fill: COLORS.textSecondary, fontFamily: 'Arial' } });
    intLabel.anchor.set(0, 0.5);
    intLabel.x = panelX + PAD;
    intLabel.y = cy + intervalRowH / 2;
    this.addChild(intLabel);

    let ibx = panelX + PAD + 60;
    const IBW = 52; const IBH = 22;
    for (const [label, ms] of INTERVALS) {
      const g = new Graphics();
      const ix = ibx; const iy = cy + 5;
      const isActive = ms === this.selectedInterval;
      g.roundRect(ix, iy, IBW, IBH, 4).fill(isActive ? COLORS.buttonHover : COLORS.buttonDisabled);
      g.interactive = true; g.cursor = 'pointer';
      g.on('pointerdown', () => this.selectInterval(ms));
      this.addChild(g);
      this.intervalBtns.set(ms, { g, x: ix, y: iy, w: IBW, h: IBH });

      const lt = new Text({ text: label, style: { fontSize: 11, fill: 0xffffff, fontFamily: 'Arial' } });
      lt.anchor.set(0.5); lt.x = ix + IBW / 2; lt.y = iy + IBH / 2;
      this.addChild(lt);

      ibx += IBW + 6;
    }
    cy += intervalRowH + 4;

    // Start Wave button
    const BW2 = panelW - PAD * 2; const BH2 = btnRowH - 6;
    const bx = panelX + PAD; const by = cy;
    this.startBtnRect = { x: bx, y: by, w: BW2, h: BH2 };

    this.startBtn = new Graphics();
    this.redrawStartBtn(false);
    this.startBtn.interactive = true; this.startBtn.cursor = 'pointer';
    this.startBtn.on('pointerover', () => { if (!this.spawning) { this.startBtn.clear(); this.startBtn.roundRect(bx, by, BW2, BH2, 8).fill(COLORS.buttonHover); } });
    this.startBtn.on('pointerout', () => { if (!this.spawning) this.redrawStartBtn(false); });
    this.startBtn.on('pointerdown', () => this.handleStart());
    this.addChild(this.startBtn);

    this.startBtnText = new Text({ text: 'Start Wave', style: { fontSize: 14, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' } });
    this.startBtnText.anchor.set(0.5);
    this.startBtnText.x = screenWidth / 2;
    this.startBtnText.y = by + BH2 / 2;
    this.addChild(this.startBtnText);
  }

  private redrawStartBtn(disabled: boolean): void {
    const { x, y, w, h } = this.startBtnRect;
    this.startBtn.clear();
    this.startBtn.roundRect(x, y, w, h, 8).fill(disabled ? COLORS.buttonDisabled : COLORS.buttonNormal);
  }

  private selectInterval(ms: number): void {
    this.selectedInterval = ms;
    for (const [val, info] of this.intervalBtns) {
      info.g.clear();
      info.g.roundRect(info.x, info.y, info.w, info.h, 4).fill(val === ms ? COLORS.buttonHover : COLORS.buttonDisabled);
    }
  }

  private handleStart(): void {
    if (this.spawning) return;
    const groups: WaveGroup[] = ENEMY_TYPES
      .filter((t) => this.counts[t] > 0)
      .map((t) => ({ type: t, count: this.counts[t], spawnInterval: this.selectedInterval, delayBefore: 0 }));
    if (groups.length === 0) return;
    this.onStartWave?.(groups);
  }

  setSpawning(value: boolean): void {
    this.spawning = value;
    this.startBtn.interactive = !value;
    this.startBtnText.text = value ? 'Spawning...' : 'Start Wave';
    this.redrawStartBtn(value);
  }
}
