import { WaveConfig, WaveState, EnemyType } from '../types';
import { EnemyFactory } from './enemies/EnemyFactory';
import { EnemyManager } from './EnemyManager';
import { COUNTDOWN_SECONDS } from '../constants';
import { Enemy } from './enemies/Enemy';

interface SpawnTask {
  type: EnemyType;
  count: number;
  spawnInterval: number;
  delayBefore: number;
  spawned: number;
  timer: number;
  delayDone: boolean;
}

export class WaveManager {
  state: WaveState = WaveState.Idle;
  currentWave: number = 0;
  totalWaves: number = 0;
  countdownTime: number = 0;

  private waves: WaveConfig[] = [];
  private enemyManager: EnemyManager;
  private spawnTasks: SpawnTask[] = [];
  private waveMultiplier: number = 1;

  onBuildPhaseStart?: (wave: number) => void;
  onWaveStart?: (wave: number) => void;
  onAllWavesComplete?: () => void;
  onCountdownTick?: (seconds: number) => void;

  constructor(enemyManager: EnemyManager) {
    this.enemyManager = enemyManager;
  }

  init(waves: WaveConfig[]): void {
    this.waves = waves;
    this.totalWaves = waves.length;
    this.currentWave = 0;
    this.state = WaveState.Building;
    this.onBuildPhaseStart?.(this.currentWave + 1);
  }

  startWave(): void {
    if (this.state !== WaveState.Building) return;
    this.startNextWave();
  }

  private startNextWave(): void {
    if (this.currentWave >= this.totalWaves) {
      this.state = WaveState.Complete;
      return;
    }

    const wave = this.waves[this.currentWave];
    this.waveMultiplier = 1 + this.currentWave * 0.15;
    this.spawnTasks = wave.groups.map((g) => ({
      type: g.type,
      count: g.count,
      spawnInterval: g.spawnInterval,
      delayBefore: g.delayBefore,
      spawned: 0,
      timer: 0,
      delayDone: g.delayBefore === 0,
    }));

    this.state = WaveState.Spawning;
    this.onWaveStart?.(this.currentWave + 1);
  }

  update(dt: number): void {
    const ms = dt * (1000 / 60);

    switch (this.state) {
      case WaveState.Spawning:
        this.updateSpawning(ms);
        break;
      case WaveState.Waiting:
        if (this.enemyManager.activeCount === 0) {
          this.currentWave++;
          if (this.currentWave >= this.totalWaves) {
            this.state = WaveState.Complete;
            this.onAllWavesComplete?.();
          } else {
            this.state = WaveState.Countdown;
            this.countdownTime = COUNTDOWN_SECONDS * 1000;
          }
        }
        break;
      case WaveState.Countdown:
        this.countdownTime -= ms;
        this.onCountdownTick?.(Math.ceil(this.countdownTime / 1000));
        if (this.countdownTime <= 0) {
          this.state = WaveState.Building;
          this.onBuildPhaseStart?.(this.currentWave + 1);
        }
        break;
    }
  }

  private updateSpawning(ms: number): void {
    let allDone = true;

    for (const task of this.spawnTasks) {
      if (task.spawned >= task.count) continue;
      allDone = false;

      if (!task.delayDone) {
        task.delayBefore -= ms;
        if (task.delayBefore <= 0) {
          task.delayDone = true;
          task.timer = 0;
        }
        continue;
      }

      task.timer -= ms;
      if (task.timer <= 0) {
        const enemy = EnemyFactory.create(task.type, this.waveMultiplier);
        this.enemyManager.spawn(enemy);
        task.spawned++;
        task.timer = task.spawnInterval;
      }
    }

    if (allDone) {
      this.state = WaveState.Waiting;
    }
  }
}
