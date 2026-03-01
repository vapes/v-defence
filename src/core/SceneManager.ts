import { Application, Container } from 'pixi.js';

export interface Scene extends Container {
  onEnter?(): void;
  onExit?(): void;
  update?(dt: number): void;
}

export class SceneManager {
  private app: Application;
  private currentScene: Scene | null = null;

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

  get width(): number {
    return this.app.screen.width;
  }

  get height(): number {
    return this.app.screen.height;
  }
}
