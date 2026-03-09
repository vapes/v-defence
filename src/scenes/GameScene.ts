import { Container } from 'pixi.js';
import { Scene, SceneManager } from '../core/SceneManager';
import { LevelConfig, TowerType, WaveState } from '../types';
import { towers as TOWER_CONFIGS } from '../data/game-configs.json';
import { Grid } from '../game/Grid';
import { EnemyManager } from '../game/EnemyManager';
import { TowerManager } from '../game/TowerManager';
import { ProjectileManager } from '../game/ProjectileManager';
import { WaveManager } from '../game/WaveManager';
import { TowerFactory } from '../game/towers/TowerFactory';
import { Tower } from '../game/towers/Tower';
import { Bullet } from '../game/projectiles/Bullet';
import { LaserBeam } from '../game/projectiles/LaserBeam';
import { HUD } from '../ui/HUD';
import { TowerBar } from '../ui/TowerBar';
import { UpgradeMenu } from '../ui/UpgradeMenu';
import { CoinAnimation } from '../ui/CoinAnimation';
import { WaveCountdown } from '../ui/WaveCountdown';
import { NewTowerPopup, getNewTowersForLevel } from '../ui/NewTowerPopup';
import { DevSpawnPanel } from '../ui/DevSpawnPanel';
import { VictoryScene } from './VictoryScene';
import { DefeatScene } from './DefeatScene';
import { Cell } from '../game/Cell';

export class GameScene extends Container implements Scene {
  private sceneManager: SceneManager;
  private level: LevelConfig;

  private grid!: Grid;
  private enemyManager!: EnemyManager;
  private towerManager!: TowerManager;
  private projectileManager!: ProjectileManager;
  private waveManager!: WaveManager;

  private hud!: HUD;
  private towerBar!: TowerBar;
  private upgradeMenu!: UpgradeMenu;
  private coinAnim!: CoinAnimation;
  private waveCountdown!: WaveCountdown;
  private newTowerPopup!: NewTowerPopup;
  private devSpawnPanel?: DevSpawnPanel;
  private coins: number = 0;
  private lives: number = 0;
  private gameOver: boolean = false;
  private introPopupActive: boolean = false;

  private selectedCell: Cell | null = null;

  // Drag-and-drop state
  private isDragging: boolean = false;
  private dragType: TowerType | null = null;
  private dragGhost: Tower | null = null;
  private dragOverlay!: Container;
  private dragHoverCell: { row: number; col: number } | null = null;

  constructor(sceneManager: SceneManager, level: LevelConfig) {
    super();
    this.sceneManager = sceneManager;
    this.level = level;
  }

  onEnter(): void {
    const w = this.sceneManager.width;
    const h = this.sceneManager.height;

    this.coins = this.level.startingMoney;
    this.lives = this.level.lives;

    // Grid
    this.grid = new Grid();
    this.grid.init(this.level, w, h);
    this.addChild(this.grid);

    // Game layers
    this.enemyManager = new EnemyManager(this);
    this.enemyManager.setPath(this.grid.path);
    this.towerManager = new TowerManager(this);
    this.projectileManager = new ProjectileManager(this);

    // Drag overlay (above game entities, below UI)
    this.dragOverlay = new Container();
    this.addChild(this.dragOverlay);

    // Wave manager
    this.waveManager = new WaveManager(this.enemyManager);

    // HUD
    this.hud = new HUD(w);
    this.addChild(this.hud);
    this.hud.coins = this.coins;
    this.hud.lives = this.lives;
    this.grid.updateLives(this.lives);
    if (this.level.id !== 0) this.hud.setWave(1, this.level.waves.length);

    // Coin animation
    this.coinAnim = new CoinAnimation();
    this.addChild(this.coinAnim);

    // Upgrade menu (still used for placed towers)
    this.upgradeMenu = new UpgradeMenu(w, h);
    this.addChild(this.upgradeMenu);

    // Tower bar (bottom)
    this.towerBar = new TowerBar(w, h);
    this.towerBar.setTowers(this.level.availableTowers, this.coins);
    this.addChild(this.towerBar);

    // Wave countdown (above tower bar)
    this.waveCountdown = new WaveCountdown(w, h);
    this.addChild(this.waveCountdown);

    // Wire events
    this.grid.onCellClick = (cell) => this.onCellClick(cell);

    this.enemyManager.onEnemyKilled = (enemy) => {
      this.changeCoins(enemy.reward);
      const hudPos = this.hud.coinTextPosition;
      this.coinAnim.spawn(enemy.x, enemy.y, hudPos.x, hudPos.y);
    };

    this.enemyManager.onEnemyReachedBase = () => {
      this.lives--;
      this.hud.lives = this.lives;
      this.grid.updateLives(this.lives);
      if (this.lives <= 0 && !this.gameOver) {
        this.gameOver = true;
        this.sceneManager.goTo(new DefeatScene(this.sceneManager, this.level));
      }
    };

    this.waveManager.onBuildPhaseStart = (wave) => {
      this.waveCountdown.showBuildPhase(wave, this.level.waves.length);
    };

    this.waveManager.onWaveStart = (wave) => {
      this.hud.setWave(wave, this.level.waves.length);
      this.waveCountdown.hide();
    };

    this.waveManager.onCountdownTick = (seconds) => {
      this.waveCountdown.show(seconds);
    };

    this.waveCountdown.onStartWave = () => {
      this.waveManager.startWave();
    };

    this.waveManager.onAllWavesComplete = () => {
      if (!this.gameOver) {
        this.gameOver = true;
        this.sceneManager.goTo(new VictoryScene(this.sceneManager, this.level.id));
      }
    };

    this.towerBar.onTowerDragStart = (type, x, y) => this.startTowerDrag(type, x, y);

    this.upgradeMenu.onUpgrade = (tower) => this.upgradeTower(tower);
    this.upgradeMenu.onSell = (tower) => this.sellTower(tower);
    this.upgradeMenu.onClose = () => {
      this.selectedCell = null;
      this.towerManager.deselectAll();
    };

    // New tower intro popup
    this.newTowerPopup = new NewTowerPopup(w, h);
    this.addChild(this.newTowerPopup);

    if (this.level.id === 0) {
      // Dev mode: manual spawn panel, no automatic waves
      this.waveManager.devMode = true;
      this.waveManager.onDevWaveComplete = () => {
        this.devSpawnPanel?.setSpawning(false);
      };
      this.devSpawnPanel = new DevSpawnPanel(w, h);
      this.devSpawnPanel.onStartWave = (groups) => {
        this.devSpawnPanel!.setSpawning(true);
        this.waveManager.spawnCustom(groups);
      };
      this.addChild(this.devSpawnPanel);
    } else {
      const newTowers = getNewTowersForLevel(this.level.id);
      if (newTowers.length > 0) {
        this.introPopupActive = true;
        this.newTowerPopup.onDone = () => {
          this.introPopupActive = false;
          this.waveManager.init(this.level.waves);
        };
        this.newTowerPopup.show(newTowers);
      } else {
        this.waveManager.init(this.level.waves);
      }
    }
  }

  private onCellClick(cell: Cell): void {
    if (this.isDragging || this.introPopupActive) return;

    this.towerManager.deselectAll();
    this.upgradeMenu.close();

    if (cell.tower) {
      cell.tower.setShowRange(true);
      this.selectedCell = cell;
      this.upgradeMenu.open(cell.tower, this.coins);
    } else {
      this.selectedCell = null;
    }
  }

  // ── Drag-and-drop ────────────────────────────────────────────────────────────

  private startTowerDrag(type: TowerType, x: number, y: number): void {
    if (this.isDragging || this.gameOver || this.introPopupActive) return;

    const cost = TOWER_CONFIGS[type].levels[0].cost;
    if (this.coins < cost) return;

    let ghost: Tower;
    try {
      ghost = TowerFactory.create(type, 0, 0);
    } catch {
      return; // tower type not yet implemented
    }

    ghost.alpha = 0.65;
    ghost.setShowRange(true);
    const dp = this.sceneManager.toDesign(x, y);
    ghost.x = dp.x;
    ghost.y = dp.y;

    this.isDragging = true;
    this.dragType = type;
    this.dragGhost = ghost;
    this.dragOverlay.addChild(ghost);

    // Close any open menus
    this.upgradeMenu.close();
    this.towerManager.deselectAll();

    // Reveal all placed tower ranges so the player can plan placement
    this.towerManager.showAllRanges(true);

    window.addEventListener('pointermove', this.handleDragMove);
    window.addEventListener('pointerup', this.handleDragEnd);
  }

  private readonly handleDragMove = (e: PointerEvent): void => {
    if (!this.isDragging || !this.dragGhost) return;

    const { x: wx, y: wy } = this.sceneManager.toDesign(e.clientX, e.clientY);

    const cellPos = this.grid.getCellAtWorldPos(wx, wy);
    if (cellPos) {
      const cell = this.grid.cells[cellPos.row][cellPos.col];
      const worldPos = this.grid.getCellWorldPos(cellPos.row, cellPos.col);
      // Snap ghost to cell center
      this.dragGhost.x = worldPos.x;
      this.dragGhost.y = worldPos.y;
      if (cell.canBuild) {
        this.grid.highlightCell(cellPos.row, cellPos.col, true);
        this.dragHoverCell = cellPos;
      } else {
        this.grid.highlightCell(cellPos.row, cellPos.col, false);
        this.dragHoverCell = null;
      }
    } else {
      // Float freely when outside the grid
      this.dragGhost.x = wx;
      this.dragGhost.y = wy;
      this.grid.clearHighlight();
      this.dragHoverCell = null;
    }
  };

  private readonly handleDragEnd = (_e: PointerEvent): void => {
    window.removeEventListener('pointermove', this.handleDragMove);
    window.removeEventListener('pointerup', this.handleDragEnd);

    if (this.dragHoverCell && this.dragType) {
      const cell = this.grid.cells[this.dragHoverCell.row]?.[this.dragHoverCell.col];
      if (cell?.canBuild) {
        this.selectedCell = cell;
        this.buildTower(this.dragType);
      }
    }

    this.cleanupDrag();
  };

  private cleanupDrag(): void {
    if (this.dragGhost) {
      this.dragOverlay.removeChild(this.dragGhost);
      this.dragGhost.destroy();
      this.dragGhost = null;
    }
    this.grid.clearHighlight();
    this.towerManager.showAllRanges(false);
    this.isDragging = false;
    this.dragType = null;
    this.dragHoverCell = null;
  }

  // ── Tower lifecycle ───────────────────────────────────────────────────────────

  private buildTower(type: TowerType): void {
    if (!this.selectedCell || !this.selectedCell.canBuild) return;

    const cost = TOWER_CONFIGS[type].levels[0].cost;
    if (this.coins < cost) return;

    this.changeCoins(-cost);

    const tower = TowerFactory.create(type, this.selectedCell.row, this.selectedCell.col);
    const pos = this.grid.getCellWorldPos(this.selectedCell.row, this.selectedCell.col);
    tower.x = pos.x;
    tower.y = pos.y;
    tower.totalInvested = cost;

    const selfManaged: TowerType[] = ['laser', 'tesla', 'magic', 'cryo'];
    if (!selfManaged.includes(type)) {
      tower.onFire = (t, target) => {
        if (t.towerType === 'bullet') {
          this.projectileManager.add(new Bullet(t.stats.damage ?? 0, target, t.x, t.y));
        } else {
          this.projectileManager.add(new LaserBeam(t.stats.damage ?? 0, target, t.x, t.y));
        }
      };
    }

    tower.onUpgradeIconClick = () => this.upgradeTower(tower);

    this.selectedCell.tower = tower;
    this.towerManager.add(tower);
    this.selectedCell = null;

    this.refreshUpgradeIcons();
  }

  private upgradeTower(tower: Tower): void {
    if (!tower.canUpgrade) return;
    const cost = tower.upgradeCost;
    if (this.coins < cost) return;

    this.changeCoins(-cost);
    tower.upgrade();
    this.refreshUpgradeIcons();
  }

  private refreshUpgradeIcons(): void {
    for (const tower of this.towerManager.towers) {
      tower.showUpIcon(this.coins >= tower.upgradeCost);
    }
  }

  private sellTower(tower: Tower): void {
    const refund = tower.sellValue;
    this.changeCoins(refund);

    const cell = this.grid.cells[tower.gridRow]?.[tower.gridCol];
    if (cell) cell.tower = null;

    this.towerManager.remove(tower);
  }

  private changeCoins(delta: number): void {
    this.coins += delta;
    this.hud.coins = this.coins;
    this.towerBar.setTowers(this.level.availableTowers, this.coins);
    if (this.upgradeMenu.visible && this.selectedCell?.tower) {
      this.upgradeMenu.open(this.selectedCell.tower, this.coins);
    }
    this.refreshUpgradeIcons();
  }

  update(dt: number): void {
    if (this.gameOver) return;

    this.newTowerPopup.update(dt);
    if (this.introPopupActive) return;

    this.waveManager.update(dt);
    this.enemyManager.update(dt);
    this.towerManager.update(dt, this.enemyManager.enemies);
    this.projectileManager.update(dt);
    this.coinAnim.update(dt);
    this.upgradeMenu.update(dt);
    if (this.waveManager.state === WaveState.Complete && this.enemyManager.activeCount === 0 && !this.gameOver) {
      this.gameOver = true;
      this.sceneManager.goTo(new VictoryScene(this.sceneManager, this.level.id));
    }
  }

  onExit(): void {
    // Clean up any in-flight drag
    window.removeEventListener('pointermove', this.handleDragMove);
    window.removeEventListener('pointerup', this.handleDragEnd);
    this.cleanupDrag();

    this.enemyManager.clear();
    this.towerManager.clear();
    this.projectileManager.clear();
  }
}
