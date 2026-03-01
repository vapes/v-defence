import { CellType, GridPosition } from '../types';
import { Tower } from './towers/Tower';

export class Cell {
  type: CellType;
  row: number;
  col: number;
  tower: Tower | null = null;

  constructor(type: CellType, pos: GridPosition) {
    this.type = type;
    this.row = pos.row;
    this.col = pos.col;
  }

  get canBuild(): boolean {
    return this.type === CellType.Grass && this.tower === null;
  }
}
