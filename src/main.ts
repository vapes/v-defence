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

  function applyScale() {
    const scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
    const ox = (window.innerWidth - DESIGN_WIDTH * scale) / 2;
    const oy = (window.innerHeight - DESIGN_HEIGHT * scale) / 2;
    app.stage.scale.set(scale);
    app.stage.position.set(ox, oy);
    sceneManager.stageScale = scale;
    sceneManager.stageOffsetX = ox;
    sceneManager.stageOffsetY = oy;
  }

  applyScale();
  window.addEventListener('resize', applyScale);

  sceneManager.goTo(new LevelSelectScene(sceneManager));
}

init().catch(console.error);
