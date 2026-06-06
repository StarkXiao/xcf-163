import * as PIXI from 'pixi.js';
import { ResourceLoader } from './modules/ResourceLoader.js';
import { MapScene } from './modules/MapScene.js';
import { BattleSystem } from './modules/BattleSystem.js';
import { Inventory } from './modules/Inventory.js';
import { TaskSystem } from './modules/TaskSystem.js';
import { Storage } from './modules/Storage.js';

class Game {
  constructor() {
    this.app = null;
    this.resourceLoader = null;
    this.mapScene = null;
    this.battleSystem = null;
    this.inventory = null;
    this.taskSystem = null;
    
    this.stats = {
      energy: 100,
      coins: 0,
      catchCount: 0
    };
    
    this.energyCost = 10;
    this.energyRegenRate = 1;
    this.energyRegenInterval = 3000;
    
    this.init();
  }

  async init() {
    this.bindUIEvents();
    await this.loadResources();
    this.initPixi();
    this.initModules();
    this.loadProgress();
    this.startEnergyRegen();
    this.showGameUI();
    this.updateUI();
    
    setTimeout(() => {
      this.taskSystem.showTutorialHint();
    }, 1000);
  }

  bindUIEvents() {
    document.getElementById('btn-catch').addEventListener('click', () => this.tryCatch());
    document.getElementById('btn-backpack').addEventListener('click', () => this.inventory.openBackpack());
    document.getElementById('btn-collection').addEventListener('click', () => this.inventory.openCollection());
    document.getElementById('btn-task').addEventListener('click', () => this.taskSystem.openTaskList());
  }

  async loadResources() {
    this.resourceLoader = new ResourceLoader();
    
    await this.resourceLoader.load(
      (progress) => {
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('loading-percent').textContent = `${progress}%`;
      },
      () => {
        console.log('资源加载完成');
      }
    );
  }

  initPixi() {
    const canvas = document.getElementById('game-canvas');
    const container = document.getElementById('game-container');
    
    this.app = new PIXI.Application({
      view: canvas,
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: 0x0a0a1a,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    window.addEventListener('resize', () => this.onResize());
  }

  initModules() {
    this.mapScene = new MapScene(this.app);
    this.battleSystem = new BattleSystem(this);
    this.inventory = new Inventory(this);
    this.taskSystem = new TaskSystem(this);
  }

  showGameUI() {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
  }

  tryCatch() {
    if (this.stats.energy < this.energyCost) {
      this.taskSystem.showHint('能量不足！请等待恢复。');
      return;
    }
    
    if (this.battleSystem.isBattling) {
      return;
    }
    
    if (this.mapScene.isNetActive) {
      return;
    }
    
    this.updateStats('energy', -this.energyCost);
    this.mapScene.startNetAnimation(() => {
      this.battleSystem.startBattle();
    });
  }

  addToBackpack(creature) {
    const success = this.inventory.addToBackpack(creature);
    if (!success) {
      this.taskSystem.showHint('背包已满！请出售一些物品。');
      this.updateStats('coins', creature.value);
    }
    return success;
  }

  updateStats(type, value) {
    switch (type) {
      case 'energy':
        this.stats.energy = Math.max(0, Math.min(100, this.stats.energy + value));
        break;
      case 'coins':
        this.stats.coins = Math.max(0, this.stats.coins + value);
        break;
      case 'catchCount':
        this.stats.catchCount += value;
        break;
    }
    this.updateUI();
    this.saveProgress();
  }

  updateUI() {
    document.getElementById('energy-value').textContent = Math.floor(this.stats.energy);
    document.getElementById('coin-value').textContent = this.stats.coins;
    document.getElementById('catch-count').textContent = this.stats.catchCount;
    
    const catchBtn = document.getElementById('btn-catch');
    catchBtn.disabled = this.stats.energy < this.energyCost;
  }

  startEnergyRegen() {
    setInterval(() => {
      if (this.stats.energy < 100) {
        this.updateStats('energy', this.energyRegenRate);
      }
    }, this.energyRegenInterval);
  }

  checkTasks(type, data = null) {
    this.taskSystem.checkTasks(type, data);
  }

  saveProgress() {
    const saveData = {
      stats: this.stats,
      inventory: this.inventory.toJSON(),
      tasks: this.taskSystem.toJSON(),
      timestamp: Date.now()
    };
    Storage.save(saveData);
  }

  loadProgress() {
    const data = Storage.load();
    if (data) {
      if (data.stats) {
        this.stats = { ...this.stats, ...data.stats };
      }
      this.inventory.loadData(data.inventory || {});
      this.taskSystem.loadData(data.tasks || {});
      console.log('存档加载成功');
    }
  }

  onResize() {
    const container = document.getElementById('game-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.app.renderer.resize(width, height);
    if (this.mapScene) {
      this.mapScene.resize(width, height);
    }
  }

  destroy() {
    if (this.app) {
      this.app.destroy(true);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
