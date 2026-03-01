import { Container, Graphics } from 'pixi.js';
import { Cell } from './Cell';
import { CellType, LevelConfig, Point, GridPosition } from '../types';
import { CELL_SIZE, COLORS, HUD_HEIGHT } from '../constants';
import { PathFinder } from './PathFinder';

export class Grid extends Container {
  cells: Cell[][] = [];
  path: Point[] = [];
  private gridGfx: Graphics;
  rows: number = 0;
  cols: number = 0;
  offsetX: number = 0;
  offsetY: number = 0;

  onCellClick?: (cell: Cell, pos: GridPosition) => void;

  constructor() {
    super();
    this.gridGfx = new Graphics();
    this.addChild(this.gridGfx);
  }

  init(level: LevelConfig, screenWidth: number, screenHeight: number): void {
    this.rows = level.grid.length;
    this.cols = level.grid[0].length;

    const gridWidth = this.cols * CELL_SIZE;
    const gridHeight = this.rows * CELL_SIZE;
    this.offsetX = Math.floor((screenWidth - gridWidth) / 2);
    this.offsetY = HUD_HEIGHT + Math.floor((screenHeight - HUD_HEIGHT - gridHeight) / 2);

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
      const local = e.global;
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
}
