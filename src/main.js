import * as PIXI from 'pixi.js';
import { ResourceLoader } from './modules/ResourceLoader.js';
import { MapScene } from './modules/MapScene.js';
import { BattleSystem } from './modules/BattleSystem.js';
import { Inventory } from './modules/Inventory.js';
import { TaskSystem } from './modules/TaskSystem.js';
import { Storage } from './modules/Storage.js';
import { TideSystem } from './modules/TideSystem.js';
import { ReinforceSystem } from './modules/ReinforceSystem.js';

class Game {
  constructor() {
    this.app = null;
    this.resourceLoader = null;
    this.mapScene = null;
    this.battleSystem = null;
    this.inventory = null;
    this.taskSystem = null;
    this.tideSystem = null;
    this.reinforceSystem = null;
    
    this.stats = {
      energy: 100,
      coins: 0,
      catchCount: 0
    };
    
    this.baseEnergyCost = 10;
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
    this.startTideUIUpdate();
    this.showGameUI();
    this.updateUI();
    
    if (this.tideSystem && this.mapScene) {
      this.mapScene.applyTideEffect(this.tideSystem.getCurrentPhase());
    }
    
    this.tideSystem.addListener((phase) => {
      this.taskSystem.showHint(`潮汐变化：${phase.icon} ${phase.name} - ${phase.desc}`);
      this.updateUI();
      this.saveProgress();
    });
    
    setTimeout(() => {
      this.taskSystem.showTutorialHint();
    }, 1000);
  }

  bindUIEvents() {
    document.getElementById('btn-catch').addEventListener('click', () => this.tryCatch());
    document.getElementById('btn-backpack').addEventListener('click', () => this.inventory.openBackpack());
    document.getElementById('btn-workshop').addEventListener('click', () => {
      if (this.reinforceSystem) this.reinforceSystem.openWorkshop();
    });
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
    this.tideSystem = new TideSystem(this);
    this.mapScene = new MapScene(this.app);
    this.battleSystem = new BattleSystem(this);
    this.inventory = new Inventory(this);
    this.taskSystem = new TaskSystem(this);
    this.reinforceSystem = new ReinforceSystem(this);
  }

  showGameUI() {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
  }

  getCurrentEnergyCost() {
    if (this.tideSystem) {
      return this.tideSystem.getAdjustedEnergyCost(this.baseEnergyCost);
    }
    return this.baseEnergyCost;
  }

  tryCatch() {
    const cost = this.getCurrentEnergyCost();
    
    if (this.stats.energy < cost) {
      const phase = this.tideSystem ? this.tideSystem.getCurrentPhase() : null;
      const phaseName = phase ? `${phase.name} ` : '';
      this.taskSystem.showHint(`能量不足！${phaseName}拖网需要 ${cost} 能量，请等待恢复。`);
      return;
    }
    
    if (this.battleSystem.isBattling) {
      return;
    }
    
    if (this.mapScene.isNetActive) {
      return;
    }
    
    this.updateStats('energy', -cost);
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
    
    const cost = this.getCurrentEnergyCost();
    const catchBtn = document.getElementById('btn-catch');
    catchBtn.disabled = this.stats.energy < cost;
    
    const costEl = document.getElementById('energy-cost');
    if (costEl) {
      costEl.textContent = cost;
    }
    
    this.updateTideUI();
  }

  updateTideUI() {
    if (!this.tideSystem) return;
    
    const phase = this.tideSystem.getCurrentPhase();
    const tideNameEl = document.getElementById('tide-name');
    const tideIconEl = document.getElementById('tide-icon');
    const tideDescEl = document.getElementById('tide-desc');
    const tideProgressEl = document.getElementById('tide-progress');
    const tideTimeEl = document.getElementById('tide-time');
    const tideBarEl = document.getElementById('tide-progress-bar');
    
    if (tideNameEl) tideNameEl.textContent = phase.name;
    if (tideIconEl) tideIconEl.textContent = phase.icon;
    if (tideDescEl) tideDescEl.textContent = phase.desc;
    
    const remaining = this.tideSystem.getPhaseRemainingTime();
    const seconds = Math.ceil(remaining / 1000);
    if (tideTimeEl) {
      tideTimeEl.textContent = `${seconds}s`;
    }
    
    const progress = this.tideSystem.getPhaseProgress();
    if (tideProgressEl) {
      tideProgressEl.style.width = `${progress * 100}%`;
    }
    if (tideBarEl) {
      tideBarEl.style.background = `linear-gradient(90deg, #${phase.color.toString(16).padStart(6, '0')}, #00ffff)`;
    }
  }

  startEnergyRegen() {
    setInterval(() => {
      if (this.stats.energy < 100) {
        this.updateStats('energy', this.energyRegenRate);
      }
    }, this.energyRegenInterval);
  }

  startTideUIUpdate() {
    setInterval(() => {
      this.updateTideUI();
    }, 1000);
  }

  checkTasks(type, data = null) {
    this.taskSystem.checkTasks(type, data);
  }

  saveProgress() {
    const saveData = {
      stats: this.stats,
      inventory: this.inventory.toJSON(),
      tasks: this.taskSystem.toJSON(),
      tide: this.tideSystem ? this.tideSystem.toJSON() : null,
      reinforce: this.reinforceSystem ? this.reinforceSystem.toJSON() : null,
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
      if (this.reinforceSystem && data.reinforce) {
        this.reinforceSystem.loadData(data.reinforce);
      }
      if (this.tideSystem && data.tide) {
        this.tideSystem.init(data.tide);
      } else if (this.tideSystem) {
        this.tideSystem.init();
      }
      console.log('存档加载成功');
    } else if (this.tideSystem) {
      this.tideSystem.init();
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
