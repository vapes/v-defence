import { Application, Container } from 'pixi.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants';

export interface Scene extends Container {
  onEnter?(): void;
  onExit?(): void;
  update?(dt: number): void;
}

export class SceneManager {
  private app: Application;
  private currentScene: Scene | null = null;

  stageScale: number = 1;
  stageOffsetX: number = 0;
  stageOffsetY: number = 0;

  constructor(app: Application) {
    this.app = app;
    this.app.ticker.add((ticker) => {
      if (this.currentScene?.update) {
        this.currentScene.update(ticker.deltaTime);
      }
    });
  }

  goTo(scene: Scene): void {
    if (this.currentScene) {
      this.currentScene.onExit?.();
      this.app.stage.removeChild(this.currentScene);
    }
    this.currentScene = scene;
    this.app.stage.addChild(scene);
    scene.onEnter?.();
  }

  /** Convert native clientX/Y to design-space coordinates. */
  toDesign(clientX: number, clientY: number): { x: number; y: number } {
    return {
      x: (clientX - this.stageOffsetX) / this.stageScale,
      y: (clientY - this.stageOffsetY) / this.stageScale,
    };
  }

  get width(): number {
    return DESIGN_WIDTH;
  }

  get height(): number {
    return DESIGN_HEIGHT;
  }
}
