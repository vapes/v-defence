import { CellType, Point } from '../types';
import { CELL_SIZE } from '../constants';
import { Cell } from './Cell';

export class PathFinder {
  static findPath(cells: Cell[][], offsetX: number, offsetY: number): Point[] {
    let spawn: Cell | null = null;
    for (const row of cells) {
      for (const cell of row) {
        if (cell.type === CellType.Spawn) {
          spawn = cell;
          break;
        }
      }
      if (spawn) break;
    }
    if (!spawn) return [];

    const rows = cells.length;
    const cols = cells[0].length;
    const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const path: Point[] = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    let current = spawn;
    visited[current.row][current.col] = true;
    path.push({
      x: offsetX + current.col * CELL_SIZE + CELL_SIZE / 2,
      y: offsetY + current.row * CELL_SIZE + CELL_SIZE / 2,
    });

    while (current.type !== CellType.Base) {
      let found = false;
      for (const [dr, dc] of dirs) {
        const nr = current.row + dr;
        const nc = current.col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          const next = cells[nr][nc];
          if (next.type === CellType.Road || next.type === CellType.Base) {
            visited[nr][nc] = true;
            current = next;
            path.push({
              x: offsetX + current.col * CELL_SIZE + CELL_SIZE / 2,
              y: offsetY + current.row * CELL_SIZE + CELL_SIZE / 2,
            });
            found = true;
            break;
          }
        }
      }
      if (!found) break;
    }

    return path;
  }
}
