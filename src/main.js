import * as PIXI from 'pixi.js';
import { ResourceLoader } from './modules/ResourceLoader.js';
import { MapScene } from './modules/MapScene.js';
import { BattleSystem } from './modules/BattleSystem.js';
import { Inventory } from './modules/Inventory.js';
import { TaskSystem } from './modules/TaskSystem.js';
import { Storage } from './modules/Storage.js';
import { TideSystem } from './modules/TideSystem.js';
import { ReinforceSystem } from './modules/ReinforceSystem.js';
import { ScrapWorkshop } from './modules/ScrapWorkshop.js';
import { ChamberOfCommerce } from './modules/ChamberOfCommerce.js';
import { DeepSeaExpedition } from './modules/DeepSeaExpedition.js';
import { TavernSystem } from './modules/TavernSystem.js';
import { COMBO_CONFIG, getComboEnergyDiscount, getComboEnergyRegenBonus } from './data/creatures.js';

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
    this.scrapWorkshop = null;
    this.chamber = null;
    this.expedition = null;
    this.tavernSystem = null;
    
    this.stats = {
      energy: 100,
      coins: 0,
      catchCount: 0,
      comboCount: 0,
      maxComboReached: 0,
      totalComboHits: 0
    };
    
    this.baseEnergyCost = 10;
    this.energyRegenRate = 1;
    this.energyRegenInterval = 3000;
    this.comboTimer = null;
    this.lastCatchTime = 0;
    
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
    document.getElementById('btn-chamber').addEventListener('click', () => {
      if (this.chamber) this.chamber.openChamber();
    });
    document.getElementById('btn-expedition').addEventListener('click', () => {
      if (this.expedition) this.expedition.openExpedition();
    });
    document.getElementById('btn-scrap-workshop').addEventListener('click', () => {
      if (this.scrapWorkshop) this.scrapWorkshop.open();
    });
    document.getElementById('btn-tavern').addEventListener('click', () => {
      if (this.tavernSystem) this.tavernSystem.openTavern();
    });
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
    this.scrapWorkshop = new ScrapWorkshop(this);
    this.chamber = new ChamberOfCommerce(this);
    this.expedition = new DeepSeaExpedition(this);
    this.tavernSystem = new TavernSystem(this);
    this.stallSystem = this.chamber.stallSystem;
    this.pricingSystem = this.chamber.pricingSystem;
    this.customerSystem = this.chamber.customerSystem;
    this.orderSystem = this.chamber.orderSystem;
    this.startChamberTick();
  }

  startChamberTick() {
    setInterval(() => {
      if (this.chamber) {
        this.chamber.tick();
      }
    }, 1000);
  }

  showGameUI() {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
  }

  getCurrentEnergyCost() {
    let cost = this.baseEnergyCost;
    if (this.tideSystem) {
      cost = this.tideSystem.getAdjustedEnergyCost(cost);
    }
    const comboDiscount = getComboEnergyDiscount(this.stats.comboCount || 0);
    cost = Math.max(1, Math.ceil(cost * (1 - comboDiscount)));
    
    if (this.tavernSystem) {
      const intelEffects = this.tavernSystem.getIntelEffects();
      if (intelEffects.energyDiscount) {
        cost = Math.max(1, Math.ceil(cost * (1 - intelEffects.energyDiscount)));
      }
    }
    
    return cost;
  }

  incrementCombo() {
    const now = Date.now();
    const withinTimeout = (now - this.lastCatchTime) <= COMBO_CONFIG.comboTimeout;
    
    if (withinTimeout || this.stats.comboCount === 0) {
      this.stats.comboCount = (this.stats.comboCount || 0) + 1;
    } else {
      this.stats.comboCount = 1;
    }
    
    this.lastCatchTime = now;
    this.stats.totalComboHits = (this.stats.totalComboHits || 0) + 1;
    
    if (this.stats.comboCount > (this.stats.maxComboReached || 0)) {
      this.stats.maxComboReached = this.stats.comboCount;
    }
    
    this.resetComboTimer();
    this.updateUI();
    this.saveProgress();
    
    this.checkTasks('combo_reach', this.stats.comboCount);
    this.checkTasks('total_combo_hits');
    
    return this.stats.comboCount;
  }

  resetCombo() {
    if (this.stats.comboCount > 0) {
      this.stats.comboCount = 0;
      this.updateUI();
      this.saveProgress();
    }
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
      this.comboTimer = null;
    }
  }

  resetComboTimer() {
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
    }
    
    let timeout = COMBO_CONFIG.comboTimeout;
    if (this.tavernSystem) {
      const intelEffects = this.tavernSystem.getIntelEffects();
      if (intelEffects.comboTimeoutExtend) {
        timeout = timeout * (1 + intelEffects.comboTimeoutExtend);
      }
    }
    
    this.comboTimer = setTimeout(() => {
      this.resetCombo();
    }, timeout);
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
    
    this.updateComboUI();
    this.updateTideUI();
  }

  updateComboUI() {
    const comboDisplay = document.getElementById('combo-display');
    const comboCountEl = document.getElementById('combo-count');
    const comboMultiplierEl = document.getElementById('combo-multiplier');
    
    if (!comboDisplay || !comboCountEl) return;
    
    const combo = this.stats.comboCount || 0;
    if (combo >= 2) {
      comboDisplay.classList.remove('hidden');
      comboCountEl.textContent = `${combo} COMBO`;
      
      const tier = this.getComboTier(combo);
      comboDisplay.className = `combo-display combo-tier-${tier}`;
      
      if (comboMultiplierEl) {
        const rarityBoost = Math.round((Math.pow(1.15, Math.min(combo, 10)) - 1) * 100);
        const energyDiscount = Math.round(getComboEnergyDiscount(combo) * 100);
        comboMultiplierEl.textContent = `稀有+${rarityBoost}% 能量-${energyDiscount}%`;
      }
    } else {
      comboDisplay.classList.add('hidden');
    }
  }

  getComboTier(combo) {
    if (combo >= 30) return 6;
    if (combo >= 20) return 5;
    if (combo >= 10) return 4;
    if (combo >= 8) return 3;
    if (combo >= 5) return 2;
    if (combo >= 3) return 1;
    return 0;
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
        const regenBonus = getComboEnergyRegenBonus(this.stats.comboCount || 0);
        const totalRegen = this.energyRegenRate * (1 + regenBonus);
        this.updateStats('energy', totalRegen);
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
    if (this.tavernSystem) {
      this.tavernSystem.checkQuests(type, data);
    }
  }

  saveProgress() {
    const statsToSave = {
      ...this.stats,
      comboCount: 0
    };
    const saveData = {
      stats: statsToSave,
      inventory: this.inventory.toJSON(),
      tasks: this.taskSystem.toJSON(),
      tide: this.tideSystem ? this.tideSystem.toJSON() : null,
      reinforce: this.reinforceSystem ? this.reinforceSystem.toJSON() : null,
      scrapWorkshop: this.scrapWorkshop ? this.scrapWorkshop.toJSON() : null,
      chamber: this.chamber ? this.chamber.toJSON() : null,
      expedition: this.expedition ? this.expedition.toJSON() : null,
      tavern: this.tavernSystem ? this.tavernSystem.toJSON() : null,
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
      this.stats.comboCount = 0;
      this.lastCatchTime = 0;
      if (this.comboTimer) {
        clearTimeout(this.comboTimer);
        this.comboTimer = null;
      }
      this.inventory.loadData(data.inventory || {});
      this.taskSystem.loadData(data.tasks || {});
      if (this.reinforceSystem && data.reinforce) {
        this.reinforceSystem.loadData(data.reinforce);
      }
      if (this.scrapWorkshop && data.scrapWorkshop) {
        this.scrapWorkshop.loadData(data.scrapWorkshop);
      }
      if (this.chamber && data.chamber) {
        this.chamber.loadData(data.chamber);
      }
      if (this.expedition && data.expedition) {
        this.expedition.loadData(data.expedition);
      }
      if (this.tavernSystem && data.tavern) {
        this.tavernSystem.loadData(data.tavern);
      }
      if (this.tideSystem && data.tide) {
        this.tideSystem.init(data.tide);
      } else if (this.tideSystem) {
        this.tideSystem.init();
      }
      console.log('存档加载成功（连击状态已重置）');
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
  window.__game = new Game();
});
