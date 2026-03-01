import { Application } from 'pixi.js';
import { SceneManager } from './core/SceneManager';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from './constants';

async function init() {
  const app = new Application();

  await app.init({
    background: 0x1a1a2e,
    resizeTo: window,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  document.body.appendChild(app.canvas);

  const sceneManager = new SceneManager(app);
  sceneManager.goTo(new LevelSelectScene(sceneManager));
}

init().catch(console.error);
