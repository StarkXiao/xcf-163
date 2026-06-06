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
import { PortCommission } from './modules/PortCommission.js';
import { StorySystem } from './modules/StorySystem.js';
import { RuinsDive } from './modules/RuinsDive.js';
import { COMBO_CONFIG, getComboEnergyDiscount, getComboEnergyRegenBonus } from './data/creatures.js';
import { rollNightVoyageEvent } from './data/deepSeaExpedition.js';

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
    this.portCommission = null;
    this.storySystem = null;
    this.ruinsDive = null;

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

    this.nightVoyageEvent = null;
    this.nightVoyageBranch = null;
    this.nightVoyageTimer = null;
    this.nightVoyageEndAt = 0;
    this.nightVoyageTriggerCooldown = 0;
    this.catchesSinceLastEvent = 0;

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
      if (this.storySystem) this.storySystem.onGameEvent('tide_phase', phase);
    });
    
    setTimeout(() => {
      this.taskSystem.showTutorialHint();
    }, 1000);

    setTimeout(() => {
      if (this.storySystem && !this.storySystem.completedChapters.size && !Storage.hasSave()) {
        this.storySystem.startChapter('chapter_01');
      }
    }, 1500);
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
    document.getElementById('btn-ruins').addEventListener('click', () => {
      if (this.ruinsDive) this.ruinsDive.openRuins();
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
    this.portCommission = new PortCommission(this);
    this.storySystem = new StorySystem(this);
    this.ruinsDive = new RuinsDive(this);
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

    if (this.storySystem) this.storySystem.onGameEvent('combo_reach', this.stats.comboCount);
    
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

    if (this.nightVoyageEvent && Date.now() > this.nightVoyageEndAt) {
      this.clearNightVoyageEvent();
    }

    if (!this.nightVoyageEvent && this.nightVoyageTriggerCooldown <= 0) {
      const bonusChance = Math.min(0.15, this.catchesSinceLastEvent * 0.015);
      const rolledEvent = rollNightVoyageEvent(bonusChance);
      if (rolledEvent) {
        this.triggerNightVoyageEvent(rolledEvent);
        return;
      }
    } else if (this.nightVoyageTriggerCooldown > 0) {
      this.nightVoyageTriggerCooldown--;
    }

    this.updateStats('energy', -cost);
    this.mapScene.startNetAnimation(() => {
      this.catchesSinceLastEvent++;
      this.battleSystem.startBattle();
    });
  }

  triggerNightVoyageEvent(event) {
    this.nightVoyageEvent = event;
    this.showNightVoyageChoiceModal(event);
  }

  showNightVoyageChoiceModal(event) {
    const modal = document.getElementById('night-voyage-modal');
    const content = document.getElementById('night-voyage-content');
    if (!modal || !content) return;

    const hexColor = '#' + event.color.toString(16).padStart(6, '0');
    content.innerHTML = `
      <div class="nv-header" style="border-color: ${hexColor};">
        <div class="nv-icon">${event.icon}</div>
        <div class="nv-info">
          <h3 class="nv-title" style="color: ${hexColor};">${event.name}</h3>
          <p class="nv-desc">${event.desc}</p>
          <p class="nv-event-bonus" style="color: #aaa; font-size: 11px; margin-top: 4px;">
            全局加成：价值 ×${event.valueMultiplier.toFixed(1)}${event.extraRewards && event.extraRewards.coins ? ` · 金币 +${event.extraRewards.coins[0]}~${event.extraRewards.coins[1]}` : ''}
          </p>
        </div>
      </div>
      <div class="nv-branches">
        ${event.branches.map((branch, idx) => {
          const risk = branch.onRisk || {};
          const success = branch.onSuccess || {};
          const extraBoost = branch.extraRarityBoost ? Object.entries(branch.extraRarityBoost).map(([k, v]) => `${k}×${v.toFixed(1)}`).join(' ') : '';
          return `
          <div class="nv-branch-card" data-branch-idx="${idx}">
            <div class="nv-branch-name">${branch.name}</div>
            <div class="nv-branch-desc">${branch.desc}</div>
            <div class="nv-branch-stats">
              <span class="nv-reward">奖励 ×${branch.rewardMultiplier.toFixed(1)}</span>
              <span class="nv-risk">风险 ${Math.round(branch.riskChance * 100)}%</span>
            </div>
            <div class="nv-branch-detail">
              ${risk.valuePenalty && risk.valuePenalty < 1 ? `<span class="nv-risk-detail">折损 ×${risk.valuePenalty.toFixed(2)}</span>` : ''}
              ${risk.hullDamage ? `<span class="nv-risk-detail">船体 -${risk.hullDamage[0]}~${risk.hullDamage[1]}⚡</span>` : ''}
              ${risk.comboReset ? `<span class="nv-risk-detail">连击中断</span>` : ''}
              ${success.bonusCoins ? `<span class="nv-reward-detail">成功金币 +${success.bonusCoins[0]}~${success.bonusCoins[1]}</span>` : ''}
              ${success.supplyDrop ? `<span class="nv-reward-detail">补给概率 ${Math.round(success.supplyDrop.chance * 100)}%</span>` : ''}
              ${success.legendaryChanceBoost ? `<span class="nv-reward-detail">传说率 +${Math.round(success.legendaryChanceBoost * 100)}%</span>` : ''}
              ${extraBoost ? `<span class="nv-reward-detail">稀有度 ${extraBoost}</span>` : ''}
              ${branch.legendaryChanceBoost ? `<span class="nv-reward-detail">传说率 +${Math.round(branch.legendaryChanceBoost * 100)}%</span>` : ''}
            </div>
          </div>
        `;}).join('')}
      </div>
      <div class="nv-note" style="font-size: 11px; color: #888; margin-bottom: 12px; line-height: 1.5;">
        提示：每次打捞会独立判定分支风险，风险触发时收益按比例折损并可能扣能量/中断连击；成功时获得额外奖励。
      </div>
      <div class="modal-footer">
        <button class="modal-btn secondary" id="nv-cancel">暂不选择</button>
      </div>
    `;

    modal.classList.remove('hidden');

    content.querySelectorAll('[data-branch-idx]').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.branchIdx);
        this.selectNightVoyageBranch(event, event.branches[idx]);
        modal.classList.add('hidden');
      });
    });

    const cancelBtn = document.getElementById('nv-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        this.clearNightVoyageEvent();
        this.nightVoyageTriggerCooldown = 5;
      });
    }
  }

  selectNightVoyageBranch(event, branch) {
    this.nightVoyageEvent = event;
    this.nightVoyageBranch = branch;
    this.nightVoyageEndAt = Date.now() + event.durationMs;

    if (this.mapScene) {
      this.mapScene.applyNightVoyageEvent(event, branch);
    }
    if (this.battleSystem) {
      this.battleSystem.setNightVoyageEvent(event, branch);
    }

    const risk = branch.onRisk || {};
    const success = branch.onSuccess || {};
    const taglines = [];
    taglines.push(`${event.icon} ${event.name} · ${branch.name}`);
    taglines.push(`持续 ${Math.floor(event.durationMs / 1000)}s · 奖励 ×${(event.valueMultiplier * branch.rewardMultiplier).toFixed(1)}`);
    if (branch.riskChance > 0 && risk.valuePenalty && risk.valuePenalty < 1) {
      taglines.push(`风险${Math.round(branch.riskChance * 100)}%·折损×${risk.valuePenalty.toFixed(2)}`);
    }
    this.taskSystem.showHint(taglines.join(' · '));

    this.updateNightVoyageUI();
    this.startNightVoyageTimer(event.durationMs);
    this.saveProgress();
    this.checkTasks('night_voyage_trigger', event);
  }

  startNightVoyageTimer(durationMs) {
    if (this.nightVoyageTimer) {
      clearInterval(this.nightVoyageTimer);
    }
    this.nightVoyageTimer = setInterval(() => {
      this.updateNightVoyageUI();
      if (Date.now() > this.nightVoyageEndAt) {
        this.clearNightVoyageEvent();
      }
    }, 1000);
  }

  clearNightVoyageEvent() {
    if (this.nightVoyageTimer) {
      clearInterval(this.nightVoyageTimer);
      this.nightVoyageTimer = null;
    }
    this.nightVoyageEvent = null;
    this.nightVoyageBranch = null;
    this.nightVoyageEndAt = 0;
    this.catchesSinceLastEvent = 0;

    if (this.mapScene) {
      this.mapScene.clearNightVoyageEvent();
    }
    if (this.battleSystem) {
      this.battleSystem.clearNightVoyageEvent();
    }
    this.updateNightVoyageUI();
    this.saveProgress();
  }

  updateNightVoyageUI() {
    const indicator = document.getElementById('night-voyage-indicator');
    if (!indicator) return;

    if (this.nightVoyageEvent) {
      const remaining = Math.max(0, this.nightVoyageEndAt - Date.now());
      const seconds = Math.ceil(remaining / 1000);
      const hexColor = '#' + this.nightVoyageEvent.color.toString(16).padStart(6, '0');
      indicator.classList.remove('hidden');
      indicator.style.borderColor = hexColor;
      indicator.innerHTML = `
        <span class="nv-ind-icon">${this.nightVoyageEvent.icon}</span>
        <span class="nv-ind-text">${this.nightVoyageEvent.name} · ${this.nightVoyageBranch?.name || ''}</span>
        <span class="nv-ind-timer" style="color: ${hexColor};">${seconds}s</span>
      `;
    } else {
      indicator.classList.add('hidden');
    }
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
        if (this.storySystem) this.storySystem.onGameEvent('coins');
        break;
      case 'catchCount':
        this.stats.catchCount += value;
        if (this.storySystem) this.storySystem.onGameEvent('catch_count');
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
      portCommission: this.portCommission ? this.portCommission.toJSON() : null,
      story: this.storySystem ? this.storySystem.toJSON() : null,
      ruinsDive: this.ruinsDive ? this.ruinsDive.toJSON() : null,
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
      if (this.portCommission && data.portCommission) {
        this.portCommission.loadData(data.portCommission);
      }
      if (this.storySystem && data.story) {
        this.storySystem.loadData(data.story);
      }
      if (this.ruinsDive && data.ruinsDive) {
        this.ruinsDive.loadData(data.ruinsDive);
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
