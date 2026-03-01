import { Container } from 'pixi.js';
import { Scene, SceneManager } from '../core/SceneManager';
import { LevelConfig, TowerType, WaveState } from '../types';
import { TOWER_CONFIGS } from '../data/tower-stats';
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
import { BuildMenu } from '../ui/BuildMenu';
import { UpgradeMenu } from '../ui/UpgradeMenu';
import { CoinAnimation } from '../ui/CoinAnimation';
import { WaveCountdown } from '../ui/WaveCountdown';
import { Tutorial, TutorialStep } from '../ui/Tutorial';
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
  private buildMenu!: BuildMenu;
  private upgradeMenu!: UpgradeMenu;
  private coinAnim!: CoinAnimation;
  private waveCountdown!: WaveCountdown;
  private tutorial: Tutorial | null = null;

  private coins: number = 0;
  private lives: number = 0;
  private gameOver: boolean = false;

  private selectedCell: Cell | null = null;

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

    // Wave manager
    this.waveManager = new WaveManager(this.enemyManager);

    // HUD
    this.hud = new HUD(w);
    this.addChild(this.hud);
    this.hud.coins = this.coins;
    this.hud.lives = this.lives;
    this.hud.setWave(1, this.level.waves.length);

    // Coin animation
    this.coinAnim = new CoinAnimation();
    this.addChild(this.coinAnim);

    // Wave countdown
    this.waveCountdown = new WaveCountdown(w, h);
    this.addChild(this.waveCountdown);

    // UI Panels (on top)
    this.buildMenu = new BuildMenu(w, h);
    this.addChild(this.buildMenu);

    this.upgradeMenu = new UpgradeMenu(w, h);
    this.addChild(this.upgradeMenu);

    // Wire events
    this.grid.onCellClick = (cell) => this.onCellClick(cell);

    this.enemyManager.onEnemyKilled = (enemy) => {
      this.coins += enemy.reward;
      this.hud.coins = this.coins;
      const hudPos = this.hud.coinTextPosition;
      this.coinAnim.spawn(enemy.x, enemy.y, hudPos.x, hudPos.y);
    };

    this.enemyManager.onEnemyReachedBase = () => {
      this.lives--;
      this.hud.lives = this.lives;
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

    this.buildMenu.onSelect = (type) => this.buildTower(type);
    this.buildMenu.onClose = () => { this.selectedCell = null; this.towerManager.deselectAll(); };

    this.upgradeMenu.onUpgrade = (tower) => this.upgradeTower(tower);
    this.upgradeMenu.onSell = (tower) => this.sellTower(tower);
    this.upgradeMenu.onClose = () => { this.selectedCell = null; this.towerManager.deselectAll(); };

    // Tutorial for level 1
    if (this.level.id === 1) {
      this.tutorial = new Tutorial(w, h);
      // Highlight a good grass cell next to the path (row 1, col 3)
      const hlPos = this.grid.getCellWorldPos(1, 3);
      this.tutorial.highlightWorldX = hlPos.x;
      this.tutorial.highlightWorldY = hlPos.y;
      this.tutorial.onComplete = () => {
        this.waveManager.init(this.level.waves);
      };
      this.addChild(this.tutorial);
    } else {
      // Start waves immediately for other levels
      this.waveManager.init(this.level.waves);
    }
  }

  private onCellClick(cell: Cell): void {
    this.towerManager.deselectAll();
    this.buildMenu.close();
    this.upgradeMenu.close();

    if (cell.tower) {
      cell.tower.setShowRange(true);
      this.selectedCell = cell;
      this.upgradeMenu.open(cell.tower, this.coins);
    } else if (cell.canBuild) {
      this.selectedCell = cell;
      // Advance tutorial from TapCell → BuildTower when player taps a grass cell
      if (this.tutorial && this.tutorial.step === TutorialStep.TapCell) {
        this.tutorial.showStep(TutorialStep.BuildTower);
      }
      const pos = this.grid.getCellWorldPos(cell.row, cell.col);
      this.buildMenu.open(this.level.availableTowers, this.coins, pos.x, pos.y);
    } else {
      this.selectedCell = null;
    }
  }

  private buildTower(type: TowerType): void {
    if (!this.selectedCell || !this.selectedCell.canBuild) return;

    const cost = TOWER_CONFIGS[type].levels[0].cost;
    if (this.coins < cost) return;

    this.coins -= cost;
    this.hud.coins = this.coins;

    const tower = TowerFactory.create(type, this.selectedCell.row, this.selectedCell.col);
    const pos = this.grid.getCellWorldPos(this.selectedCell.row, this.selectedCell.col);
    tower.x = pos.x;
    tower.y = pos.y;
    tower.totalInvested = cost;

    tower.onFire = (t, target) => {
      if (t.towerType === 'bullet') {
        this.projectileManager.add(new Bullet(t.stats.damage, target, t.x, t.y));
      } else {
        this.projectileManager.add(new LaserBeam(t.stats.damage, target, t.x, t.y));
      }
    };

    this.selectedCell.tower = tower;
    this.towerManager.add(tower);
    this.selectedCell = null;

    // Advance tutorial from BuildTower → TowerBuilt
    if (this.tutorial && this.tutorial.step === TutorialStep.BuildTower) {
      this.tutorial.showStep(TutorialStep.TowerBuilt);
    }
  }

  private upgradeTower(tower: Tower): void {
    if (!tower.canUpgrade) return;
    const cost = tower.upgradeCost;
    if (this.coins < cost) return;

    this.coins -= cost;
    this.hud.coins = this.coins;
    tower.upgrade();
  }

  private sellTower(tower: Tower): void {
    const refund = tower.sellValue;
    this.coins += refund;
    this.hud.coins = this.coins;

    const cell = this.grid.cells[tower.gridRow]?.[tower.gridCol];
    if (cell) cell.tower = null;

    this.towerManager.remove(tower);
  }

  update(dt: number): void {
    if (this.gameOver) return;

    this.waveManager.update(dt);
    this.enemyManager.update(dt);
    this.towerManager.update(dt, this.enemyManager.enemies);
    this.projectileManager.update(dt);
    this.coinAnim.update(dt);
    this.buildMenu.update(dt);
    this.upgradeMenu.update(dt);
    this.tutorial?.update(dt);

    // Check victory after all enemies cleared on last wave
    if (this.waveManager.state === WaveState.Complete && this.enemyManager.activeCount === 0 && !this.gameOver) {
      this.gameOver = true;
      this.sceneManager.goTo(new VictoryScene(this.sceneManager, this.level.id));
    }
  }

  onExit(): void {
    this.enemyManager.clear();
    this.towerManager.clear();
    this.projectileManager.clear();
  }
}
