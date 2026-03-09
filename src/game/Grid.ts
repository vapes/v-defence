import { Container, Graphics, Text } from 'pixi.js';
import { Cell } from './Cell';
import { CellType, LevelConfig, Point, GridPosition } from '../types';
import { CELL_SIZE, COLORS, HUD_HEIGHT, TOWER_BAR_HEIGHT } from '../constants';
import { PathFinder } from './PathFinder';

export class Grid extends Container {
  cells: Cell[][] = [];
  path: Point[] = [];
  private gridGfx: Graphics;
  private highlightGfx: Graphics;
  private livesText: Text;
  rows: number = 0;
  cols: number = 0;
  offsetX: number = 0;
  offsetY: number = 0;

  onCellClick?: (cell: Cell, pos: GridPosition) => void;

  constructor() {
    super();
    this.gridGfx = new Graphics();
    this.addChild(this.gridGfx);
    this.highlightGfx = new Graphics();
    this.addChild(this.highlightGfx);

    this.livesText = new Text({ text: '', style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold' } });
    this.livesText.anchor.set(0.5, 0.5);
    this.addChild(this.livesText);
  }

  init(level: LevelConfig, screenWidth: number, screenHeight: number): void {
    this.rows = level.grid.length;
    this.cols = level.grid[0].length;

    const gridWidth = this.cols * CELL_SIZE;
    const gridHeight = this.rows * CELL_SIZE;
    this.offsetX = Math.floor((screenWidth - gridWidth) / 2);
    this.offsetY = HUD_HEIGHT + Math.floor((screenHeight - HUD_HEIGHT - TOWER_BAR_HEIGHT - gridHeight) / 2);

    this.cells = [];
    for (let r = 0; r < this.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(new Cell(level.grid[r][c] as CellType, { row: r, col: c }));
      }
      this.cells.push(row);
    }

    this.path = PathFinder.findPath(this.cells, this.offsetX, this.offsetY);
    this.draw();
    this.setupInteraction();

    // Position lives label on the base cell
    outer: for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].type === CellType.Base) {
          this.livesText.x = this.offsetX + c * CELL_SIZE + CELL_SIZE / 2;
          this.livesText.y = this.offsetY + r * CELL_SIZE + CELL_SIZE / 2;
          break outer;
        }
      }
    }
  }

  updateLives(lives: number): void {
    this.livesText.text = lives.toString();
  }

  private draw(): void {
    this.gridGfx.clear();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[r][c];
        const x = this.offsetX + c * CELL_SIZE;
        const y = this.offsetY + r * CELL_SIZE;

        let color: number;
        switch (cell.type) {
          case CellType.Road:
            color = COLORS.road;
            break;
          case CellType.Spawn:
            color = COLORS.spawn;
            break;
          case CellType.Base:
            color = COLORS.base;
            break;
          default:
            color = (r + c) % 2 === 0 ? COLORS.grass : COLORS.grassAlt;
        }

        this.gridGfx.rect(x, y, CELL_SIZE, CELL_SIZE).fill(color);
        this.gridGfx.rect(x, y, CELL_SIZE, CELL_SIZE).stroke({ color: 0x000000, alpha: 0.15, width: 1 });
      }
    }
  }

  private setupInteraction(): void {
    this.gridGfx.interactive = true;
    this.gridGfx.on('pointertap', (e) => {
      const local = this.gridGfx.toLocal(e.global);
      const col = Math.floor((local.x - this.offsetX) / CELL_SIZE);
      const row = Math.floor((local.y - this.offsetY) / CELL_SIZE);
      if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
        this.onCellClick?.(this.cells[row][col], { row, col });
      }
    });
  }

  getCellWorldPos(row: number, col: number): Point {
    return {
      x: this.offsetX + col * CELL_SIZE + CELL_SIZE / 2,
      y: this.offsetY + row * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  getCellAtWorldPos(worldX: number, worldY: number): GridPosition | null {
    const col = Math.floor((worldX - this.offsetX) / CELL_SIZE);
    const row = Math.floor((worldY - this.offsetY) / CELL_SIZE);
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      return { row, col };
    }
    return null;
  }

  highlightCell(row: number, col: number, valid: boolean): void {
    this.highlightGfx.clear();
    const x = this.offsetX + col * CELL_SIZE;
    const y = this.offsetY + row * CELL_SIZE;
    const color = valid ? 0x00ff88 : 0xff4444;
    this.highlightGfx.rect(x, y, CELL_SIZE, CELL_SIZE).fill({ color, alpha: 0.35 });
  }

  clearHighlight(): void {
    this.highlightGfx.clear();
  }
}
