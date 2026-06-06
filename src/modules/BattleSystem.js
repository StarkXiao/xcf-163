import { getRandomCreature, generateRandomAffixes, calculateCreatureValue, isComboMilestone, getRarityKey, RARITY, CREATURES, COMBO_CONFIG } from '../data/creatures.js';
import { rollNightVoyageEvent } from '../data/deepSeaExpedition.js';

export class BattleSystem {
  constructor(game) {
    this.game = game;
    this.currentCreature = null;
    this.isBattling = false;
    this.currentNightEvent = null;
    this.currentEventBranch = null;
    this.eventBonusCoins = 0;

    this.modal = document.getElementById('battle-modal');
    this.titleEl = document.getElementById('battle-title');
    this.displayEl = document.getElementById('creature-display');
    this.quoteEl = document.getElementById('creature-quote');
    this.nameEl = document.getElementById('creature-name');
    this.rarityEl = document.getElementById('creature-rarity');
    this.valueEl = document.getElementById('creature-value');
    this.tideHintEl = document.getElementById('battle-tide-hint');

    this.collectBtn = document.getElementById('btn-collect');
    this.releaseBtn = document.getElementById('btn-release');

    this.bindEvents();
  }

  setNightVoyageEvent(event, branch) {
    this.currentNightEvent = event;
    this.currentEventBranch = branch;
  }

  clearNightVoyageEvent() {
    this.currentNightEvent = null;
    this.currentEventBranch = null;
    this.eventBonusCoins = 0;
  }

  hasActiveNightEvent() {
    return this.currentNightEvent !== null;
  }

  getEventRarityBoost() {
    if (this.currentNightEvent && this.currentNightEvent.rarityBoost) {
      return this.currentNightEvent.rarityBoost;
    }
    return null;
  }

  getEventValueMultiplier() {
    let mult = 1.0;
    if (this.currentNightEvent && this.currentNightEvent.valueMultiplier) {
      mult *= this.currentNightEvent.valueMultiplier;
    }
    if (this.currentEventBranch && this.currentEventBranch.rewardMultiplier) {
      mult *= this.currentEventBranch.rewardMultiplier;
    }
    return mult;
  }

  rollEventRisk() {
    if (!this.currentEventBranch && this.currentEventBranch.riskChance) {
      return Math.random() < this.currentEventBranch.riskChance;
    }
    return false;
  }

  getRandomCreatureWithEventBoost(tideSystem, comboCount, intelEffects) {
    const eventBoost = this.getEventRarityBoost();
    if (eventBoost) {
      const rarityEntries = Object.entries(RARITY);
      let totalWeight = 0;
      const adjustedWeights = {};

      for (const [name, rarity] of rarityEntries) {
        const key = getRarityKey(rarity);
        let weight = rarity.weight;

        if (tideSystem) {
          weight = tideSystem.getAdjustedRarityWeight(weight, key);
        }

        if (comboCount > 0 && COMBO_CONFIG.rarityBoostPerCombo[key]) {
          const boost = Math.pow(COMBO_CONFIG.rarityBoostPerCombo[key], Math.min(comboCount, COMBO_CONFIG.maxComboMultiplier));
          weight = weight * boost;
        }

        if (eventBoost[key]) {
          weight = weight * eventBoost[key];
        }

        if (this.currentEventBranch && this.currentEventBranch.legendaryChanceBoost && rarity === RARITY.LEGENDARY) {
          weight = weight * (1 + this.currentEventBranch.legendaryChanceBoost);
        }

        if (intelEffects) {
          if (intelEffects.rarityBoost) {
            weight = weight * (1 + intelEffects.rarityBoost);
          }
          if (intelEffects.rareAndAboveBoost && (rarity === RARITY.RARE || rarity === RARITY.EPIC || rarity === RARITY.LEGENDARY)) {
            weight = weight * (1 + intelEffects.rareAndAboveBoost);
          }
          if (intelEffects.epicAndAboveBoost && (rarity === RARITY.EPIC || rarity === RARITY.LEGENDARY)) {
            weight = weight * (1 + intelEffects.epicAndAboveBoost);
          }
        }

        adjustedWeights[name] = weight;
        totalWeight += weight;
      }

      let random = Math.random() * totalWeight;
      let selectedRarity = RARITY.COMMON;
      for (const [name, rarity] of rarityEntries) {
        if (random < adjustedWeights[name]) {
          selectedRarity = rarity;
          break;
        }
        random -= adjustedWeights[name];
      }

      const availableCreatures = CREATURES.filter(c => c.rarity === selectedRarity);
      return availableCreatures[Math.floor(Math.random() * availableCreatures.length)];
    }
    return getRandomCreature(tideSystem, comboCount, intelEffects);
  }

  bindEvents() {
    this.collectBtn.addEventListener('click', () => this.collectCreature());
    this.releaseBtn.addEventListener('click', () => this.releaseCreature());
  }

  startBattle() {
    if (this.isBattling) return;

    this.isBattling = true;

    const tideSystem = this.game.tideSystem;
    const currentCombo = this.game.stats.comboCount || 0;
    const tavernSystem = this.game.tavernSystem;
    const intelEffects = tavernSystem ? tavernSystem.getIntelEffects() : null;

    if (tideSystem) {
      const encounterRate = tideSystem.getAdjustedEncounterRate();
      let finalEncounterRate = (intelEffects && intelEffects.noEmptyCatch) ? 1.0 : encounterRate;
      if (this.hasActiveNightEvent()) {
        finalEncounterRate = Math.min(1.0, finalEncounterRate + 0.2);
      }
      if (Math.random() > finalEncounterRate) {
        this.game.resetCombo();
        this.showEmptyCatch();
        if (tavernSystem) tavernSystem.consumeCatchIntels();
        return;
      }
    }

    const newCombo = this.game.incrementCombo();
    this.currentCreature = this.getRandomCreatureWithEventBoost(tideSystem, newCombo, intelEffects);
    this.currentCreature.tier = 1;
    this.currentCreature.affixes = generateRandomAffixes(this.currentCreature);

    if (tideSystem) {
      tideSystem.recordCatch();
    }

    if (tavernSystem) {
      tavernSystem.consumeCatchIntels();
    }

    this.eventBonusCoins = 0;
    if (this.currentNightEvent && this.currentNightEvent.extraRewards && this.currentNightEvent.extraRewards.coins) {
      const [minC, maxC] = this.currentNightEvent.extraRewards.coins;
      this.eventBonusCoins = Math.floor(minC + Math.random() * (maxC - minC));
    }
    const branchMult = this.currentEventBranch ? (this.currentEventBranch.rewardMultiplier || 1.0) : 1.0;
    this.eventBonusCoins = Math.floor(this.eventBonusCoins * branchMult);

    this.showModal(newCombo);
    this.game.updateStats('catchCount', 1);
    this.game.checkTasks('catch_count');
    this.game.checkTasks('find_rarity', this.currentCreature.rarity);
    this.game.checkTasks('find_rarity_in_combo', {
      rarity: this.currentCreature.rarity,
      combo: newCombo
    });
    this.game.checkTasks('find_creature', this.currentCreature);
    this.game.checkTasks('tavern_find_creature', this.currentCreature);

    if (tideSystem) {
      this.game.checkTasks('catch_in_tide', tideSystem.getCurrentPhase());
      this.game.checkTasks('find_rarity_in_tide', {
        rarity: this.currentCreature.rarity,
        tide: tideSystem.getCurrentPhase()
      });
    }
  }

  showEmptyCatch() {
    const tidePhase = this.game.tideSystem ? this.game.tideSystem.getCurrentPhase() : null;
    
    this.titleEl.textContent = '一无所获...';
    this.displayEl.innerHTML = '<span style="font-size: 60px;">🌀</span>';
    this.displayEl.style.background = 'radial-gradient(circle, rgba(100, 100, 150, 0.3) 0%, transparent 70%)';
    this.quoteEl.textContent = tidePhase 
      ? `"${tidePhase.name}时海里空空如也，再试一次吧..."`
      : '"这次没捞到东西，再试一次吧..."';
    this.nameEl.textContent = '空网';
    this.rarityEl.textContent = tidePhase ? tidePhase.name : '-';
    this.rarityEl.className = 'stat-data';
    this.valueEl.textContent = '0 金币';
    
    this.collectBtn.style.display = 'none';
    this.releaseBtn.textContent = '继续';
    
    this.modal.classList.remove('hidden');
  }

  showModal(comboCount = 0) {
    const c = this.currentCreature;
    const quote = c.quotes[Math.floor(Math.random() * c.quotes.length)];
    const baseValue = calculateCreatureValue(c, c.tier || 1, c.affixes);
    const valueMult = this.getEventValueMultiplier();
    const actualValue = Math.floor(baseValue * valueMult);

    let titleText = c.rarity.name === '传说' ? '传说降临！' :
                    c.rarity.name === '史诗' ? '史诗发现！' :
                    '发现机械残骸！';

    if (this.hasActiveNightEvent() && this.currentNightEvent) {
      titleText = `${this.currentNightEvent.icon} ${this.currentNightEvent.name} · ${titleText}`;
    }

    if (comboCount >= 2) {
      const milestoneText = isComboMilestone(comboCount) ? ` ⭐里程碑！` : '';
      titleText = `🔥 ${comboCount}连击${milestoneText} ${titleText}`;
    }

    this.titleEl.textContent = titleText;

    this.displayEl.innerHTML = `<span style="font-size: 80px;">${c.icon}</span>`;
    let displayColor = c.rarity.color;
    if (this.hasActiveNightEvent() && this.currentNightEvent) {
      displayColor = this.currentNightEvent.color;
    }
    this.displayEl.style.background = `radial-gradient(circle, rgba(${this.hexToRgb(displayColor)}, 0.4) 0%, transparent 70%)`;
    if (this.hasActiveNightEvent()) {
      this.displayEl.classList.add('night-event-glow');
    }

    if (comboCount >= 3) {
      this.displayEl.classList.add('combo-glow');
      const tier = Math.min(Math.floor(comboCount / 5), 5);
      this.displayEl.style.animation = `comboPulse 0.6s ease-in-out ${tier + 1}`;
      setTimeout(() => {
        this.displayEl.classList.remove('combo-glow');
        this.displayEl.style.animation = '';
      }, 600 * (tier + 2));
    }

    this.quoteEl.textContent = `"${quote}"`;
    if (this.hasActiveNightEvent()) {
      this.quoteEl.classList.add('night-event-quote');
    } else {
      this.quoteEl.classList.remove('night-event-quote');
    }

    this.nameEl.textContent = c.name;
    this.rarityEl.textContent = c.rarity.name;
    this.rarityEl.className = `stat-data ${c.rarity.class}`;

    let valueText = `${actualValue} 金币`;
    if (valueMult > 1.0) {
      valueText += ` (×${valueMult.toFixed(1)} 夜航加成)`;
    }
    if (this.eventBonusCoins > 0) {
      valueText += ` +${this.eventBonusCoins}💰 事件奖励`;
    }

    if (c.affixes && c.affixes.length > 0) {
      const affixNames = c.affixes.map(a => a.name).join('、');
      valueText += ` | ${affixNames}`;
      this.valueEl.style.fontSize = '12px';
      this.valueEl.style.lineHeight = '1.4';
    } else {
      this.valueEl.style.fontSize = '';
      this.valueEl.style.lineHeight = '';
    }

    this.valueEl.textContent = valueText;

    if (comboCount >= 5) {
      this.valueEl.innerHTML = `<span class="combo-value-boost">${this.valueEl.textContent} 🔥连击加成!</span>`;
    }

    this.collectBtn.style.display = '';
    this.releaseBtn.textContent = '放生';

    this.modal.classList.remove('hidden');
    if (this.hasActiveNightEvent()) {
      this.modal.classList.add('night-event-modal');
    } else {
      this.modal.classList.remove('night-event-modal');
    }

    if (comboCount >= 3 && isComboMilestone(comboCount)) {
      this.showComboEffect(comboCount);
    }
  }

  showComboEffect(comboCount) {
    const effect = document.createElement('div');
    effect.className = 'combo-milestone-effect';
    effect.textContent = `${comboCount} COMBO!`;
    effect.style.left = '50%';
    effect.style.top = '30%';
    document.getElementById('game-container').appendChild(effect);
    
    setTimeout(() => {
      effect.remove();
    }, 1500);
  }

  hideModal() {
    this.modal.classList.add('hidden');
  }

  collectCreature() {
    if (!this.currentCreature) return;

    const valueMult = this.getEventValueMultiplier();
    const creature = { ...this.currentCreature };
    if (valueMult > 1.0) {
      creature.value = Math.floor((creature.value || 0) * valueMult);
      creature.nightEventBonus = true;
    }

    this.game.addToBackpack(creature);
    if (this.eventBonusCoins > 0) {
      this.game.updateStats('coins', this.eventBonusCoins);
      this.game.taskSystem.showHint(`夜航事件奖励 +${this.eventBonusCoins}💰`);
    }
    this.game.checkTasks('collect_rarity', this.currentCreature.rarity);
    this.game.checkTasks('unique_collected');
    this.game.checkTasks('night_voyage_catch');

    this.endBattle();
  }

  releaseCreature() {
    if (this.currentCreature) {
      const baseValue = calculateCreatureValue(this.currentCreature, this.currentCreature.tier || 1, this.currentCreature.affixes);
      const valueMult = this.getEventValueMultiplier();
      const actualValue = Math.floor(baseValue * valueMult);
      const bonus = Math.floor(actualValue * 0.3) + this.eventBonusCoins;
      this.game.updateStats('coins', bonus);
      if (this.eventBonusCoins > 0) {
        this.game.taskSystem.showHint(`夜航事件奖励 +${this.eventBonusCoins}💰`);
      }
    }

    this.endBattle();
  }

  endBattle() {
    this.hideModal();
    this.currentCreature = null;
    this.isBattling = false;
  }

  hexToRgb(hex) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `${r}, ${g}, ${b}`;
  }
}
