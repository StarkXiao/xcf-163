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
    this.currentBattleResult = null;

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
    this.currentBattleResult = null;
  }

  hasActiveNightEvent() {
    return this.currentNightEvent !== null;
  }

  getEventRarityBoost() {
    if (!this.currentNightEvent || !this.currentNightEvent.rarityBoost) return null;
    const boost = { ...this.currentNightEvent.rarityBoost };
    if (this.currentEventBranch && this.currentEventBranch.extraRarityBoost) {
      for (const [k, v] of Object.entries(this.currentEventBranch.extraRarityBoost)) {
        boost[k] = (boost[k] || 1.0) * v;
      }
    }
    return boost;
  }

  getExtraRarityBoosts() {
    const boosts = [];
    if (this.currentNightEvent && this.currentNightEvent.extraRewards) {
      const r = this.currentNightEvent.extraRewards;
      if (r.rareAndAboveBoost) boosts.push({ type: 'rareAndAbove', value: r.rareAndAboveBoost });
      if (r.epicAndAboveBoost) boosts.push({ type: 'epicAndAbove', value: r.epicAndAboveBoost });
    }
    if (this.currentEventBranch && this.currentEventBranch.onSuccess && this.currentBattleResult && this.currentBattleResult.success) {
      const s = this.currentEventBranch.onSuccess;
      if (s.rareAndAboveBoost) boosts.push({ type: 'rareAndAbove', value: s.rareAndAboveBoost });
      if (s.legendaryChanceBoost) boosts.push({ type: 'legendary', value: s.legendaryChanceBoost });
    }
    return boosts;
  }

  getEventValueMultiplier() {
    let mult = 1.0;
    if (this.currentNightEvent && this.currentNightEvent.valueMultiplier) {
      mult *= this.currentNightEvent.valueMultiplier;
    }
    if (this.currentEventBranch && this.currentEventBranch.rewardMultiplier) {
      mult *= this.currentEventBranch.rewardMultiplier;
    }
    if (this.currentBattleResult && this.currentBattleResult.valuePenalty !== undefined) {
      mult *= this.currentBattleResult.valuePenalty;
    }
    return mult;
  }

  rollEventRiskPerBattle() {
    if (!this.currentEventBranch) return { riskRolled: false, success: true };
    const riskChance = this.currentEventBranch.riskChance || 0;
    const riskRolled = Math.random() < riskChance;
    const result = {
      riskRolled,
      success: !riskRolled,
      valuePenalty: 1.0,
      penaltyTag: null,
      successTag: null,
      bonusCoins: 0,
      legendaryChanceBoost: 0,
      hullDamage: 0,
      comboReset: false,
      supplyDrop: null
    };
    if (riskRolled && this.currentEventBranch.onRisk) {
      const r = this.currentEventBranch.onRisk;
      result.valuePenalty = r.valuePenalty !== undefined ? r.valuePenalty : 1.0;
      result.penaltyTag = r.penaltyTag || null;
      result.comboReset = !!r.comboReset;
      if (r.hullDamage) {
        const [mn, mx] = r.hullDamage;
        result.hullDamage = Math.floor(mn + Math.random() * (mx - mn));
      }
    } else if (!riskRolled && this.currentEventBranch.onSuccess) {
      const s = this.currentEventBranch.onSuccess;
      result.successTag = s.successTag || null;
      result.legendaryChanceBoost = s.legendaryChanceBoost || 0;
      if (s.bonusCoins) {
        const [mn, mx] = s.bonusCoins;
        result.bonusCoins = Math.floor(mn + Math.random() * (mx - mn));
      }
      if (s.supplyDrop && Math.random() < s.supplyDrop.chance) {
        const d = s.supplyDrop;
        result.supplyDrop = { supply: d.supply, amount: Math.floor(d.min + Math.random() * (d.max - d.min + 1)) };
      }
    }
    return result;
  }

  getRandomCreatureWithEventBoost(tideSystem, comboCount, intelEffects) {
    const eventBoost = this.getEventRarityBoost();
    const extraBoosts = this.getExtraRarityBoosts();
    const inventory = this.game.inventory;
    if (eventBoost || extraBoosts.length > 0 || inventory) {
      const rarityEntries = Object.entries(RARITY);
      let totalWeight = 0;
      const adjustedWeights = {};
      const baseBoost = eventBoost || {};

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

        if (baseBoost[key]) {
          weight = weight * baseBoost[key];
        }

        if (this.currentEventBranch && this.currentEventBranch.legendaryChanceBoost && rarity === RARITY.LEGENDARY) {
          weight = weight * (1 + this.currentEventBranch.legendaryChanceBoost);
        }

        for (const eb of extraBoosts) {
          if (eb.type === 'rareAndAbove' && (rarity === RARITY.RARE || rarity === RARITY.EPIC || rarity === RARITY.LEGENDARY)) {
            weight = weight * (1 + eb.value);
          } else if (eb.type === 'epicAndAbove' && (rarity === RARITY.EPIC || rarity === RARITY.LEGENDARY)) {
            weight = weight * (1 + eb.value);
          } else if (eb.type === 'legendary' && rarity === RARITY.LEGENDARY) {
            weight = weight * (1 + eb.value);
          }
        }

        if (this.currentBattleResult && this.currentBattleResult.legendaryChanceBoost && rarity === RARITY.LEGENDARY) {
          weight = weight * (1 + this.currentBattleResult.legendaryChanceBoost);
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

        if (inventory && typeof inventory.getNetRarityBoost === 'function') {
          const netBoost = inventory.getNetRarityBoost(key);
          if (netBoost > 1.0) {
            weight = weight * netBoost;
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
    this.currentBattleResult = this.rollEventRiskPerBattle();

    const tideSystem = this.game.tideSystem;
    const currentCombo = this.game.stats.comboCount || 0;
    const tavernSystem = this.game.tavernSystem;
    const intelEffects = tavernSystem ? tavernSystem.getIntelEffects() : null;

    if (this.currentBattleResult.hullDamage && this.currentBattleResult.hullDamage > 0) {
      const dmg = Math.min(this.currentBattleResult.hullDamage, this.game.stats.energy - 1);
      if (dmg > 0) this.game.updateStats('energy', -dmg);
      this.currentBattleResult.hullDamage = dmg;
    }

    if (this.currentBattleResult.comboReset) {
      this.game.resetCombo();
    }

    if (tideSystem) {
      let encounterRate = tideSystem.getAdjustedEncounterRate();
      const inventory = this.game.inventory;
      if (inventory && typeof inventory.getCatchRate === 'function') {
        encounterRate = Math.min(1.0, encounterRate * inventory.getCatchRate());
      }
      let finalEncounterRate = (intelEffects && intelEffects.noEmptyCatch) ? 1.0 : encounterRate;
      if (this.hasActiveNightEvent()) {
        finalEncounterRate = Math.min(1.0, finalEncounterRate + 0.2);
      }
      if (this.currentNightEvent && this.currentNightEvent.extraRewards && this.currentNightEvent.extraRewards.epicAndAboveBoost) {
        finalEncounterRate = Math.min(1.0, finalEncounterRate + 0.1);
      }
      if (Math.random() > finalEncounterRate) {
        this.game.resetCombo();
        this.showEmptyCatch();
        if (tavernSystem) tavernSystem.consumeCatchIntels();
        return;
      }
    }

    const effectiveCombo = this.currentBattleResult.comboReset ? 0 : currentCombo;
    const newCombo = effectiveCombo > 0 ? this.game.incrementCombo() : this.game.incrementCombo();
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
    if (this.currentBattleResult.bonusCoins) {
      this.eventBonusCoins += this.currentBattleResult.bonusCoins;
    }
    if (this.currentBattleResult.valuePenalty !== undefined) {
      this.eventBonusCoins = Math.floor(this.eventBonusCoins * this.currentBattleResult.valuePenalty);
    }

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
    const res = this.currentBattleResult;

    let titleText = c.rarity.name === '传说' ? '传说降临！' :
                    c.rarity.name === '史诗' ? '史诗发现！' :
                    '发现机械残骸！';

    if (this.hasActiveNightEvent() && this.currentNightEvent) {
      titleText = `${this.currentNightEvent.icon} ${this.currentNightEvent.name} · ${titleText}`;
    }

    if (res && res.riskRolled) {
      titleText = `⚠️ ${res.penaltyTag || '风险触发'} · ${titleText}`;
    } else if (res && res.success && res.successTag) {
      titleText = `✨ ${res.successTag} · ${titleText}`;
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
    if (res && res.riskRolled) {
      displayColor = 0xff2222;
    }
    this.displayEl.style.background = `radial-gradient(circle, rgba(${this.hexToRgb(displayColor)}, 0.4) 0%, transparent 70%)`;
    if (this.hasActiveNightEvent()) {
      this.displayEl.classList.add('night-event-glow');
    }
    if (res && res.riskRolled) {
      this.displayEl.style.filter = 'drop-shadow(0 0 20px rgba(255, 50, 50, 0.9)) saturate(1.2)';
    } else if (res && res.success && res.successTag) {
      this.displayEl.style.filter = 'drop-shadow(0 0 20px rgba(100, 255, 150, 0.7)) saturate(1.1)';
    } else {
      this.displayEl.style.filter = '';
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
    if (valueMult > 1.0 || (res && res.valuePenalty && res.valuePenalty < 1.0)) {
      valueText += ` (×${valueMult.toFixed(2)}`;
      if (res && res.valuePenalty && res.valuePenalty < 1.0) {
        valueText += ` 含风险折损${Math.round((1 - res.valuePenalty) * 100)}%)`;
      } else {
        valueText += ` 夜航加成)`;
      }
    }
    if (this.eventBonusCoins > 0) {
      valueText += ` +${this.eventBonusCoins}💰 事件奖励`;
    }
    if (res && res.supplyDrop) {
      const supplyIcons = { food: '🍖', fuel: '⛽', repair: '🔧' };
      const supplyNames = { food: '食物', fuel: '燃料', repair: '维修零件' };
      const si = supplyIcons[res.supplyDrop.supply] || '📦';
      const sn = supplyNames[res.supplyDrop.supply] || res.supplyDrop.supply;
      valueText += ` ${si}+${res.supplyDrop.amount} ${sn}`;
    }
    if (res && res.hullDamage > 0) {
      valueText += ` ⚠️能量-${res.hullDamage}`;
    }
    if (res && res.comboReset) {
      valueText += ` 💔连击中断`;
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
    if (res && res.riskRolled) {
      this.modal.style.borderColor = '#ff3333';
    } else if (res && res.success && res.successTag) {
      this.modal.style.borderColor = '#55ff88';
    } else {
      this.modal.style.borderColor = '';
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
    const res = this.currentBattleResult;

    const valueMult = this.getEventValueMultiplier();
    const creature = { ...this.currentCreature };
    creature.value = Math.floor((creature.value || calculateCreatureValue(creature, creature.tier || 1, creature.affixes)) * valueMult);
    if (this.hasActiveNightEvent()) creature.nightEventBonus = true;
    if (res && res.riskRolled) creature.riskAffected = res.penaltyTag;
    if (res && res.success && res.successTag) creature.successBonus = res.successTag;

    const parts = [];
    const backpackOk = this.game.addToBackpack(creature);
    if (!backpackOk) {
      parts.push(`背包已满，${this.currentCreature.name}直接出售得${creature.value}💰`);
    } else {
      parts.push(`已收集${this.currentCreature.name}`);
    }

    let totalCoins = 0;
    if (this.eventBonusCoins > 0) {
      this.game.updateStats('coins', this.eventBonusCoins);
      totalCoins += this.eventBonusCoins;
      parts.push(`事件奖励 +${this.eventBonusCoins}💰`);
    }

    if (res && res.supplyDrop) {
      const supplyNames = { food: '食物', fuel: '燃料', repair: '维修零件' };
      const sn = supplyNames[res.supplyDrop.supply] || res.supplyDrop.supply;
      if (this.game.expedition) {
        this.game.expedition.addSupply(res.supplyDrop.supply, res.supplyDrop.amount);
      }
      parts.push(`补给掉落 +${res.supplyDrop.amount} ${sn}`);
    }

    if (res && res.riskRolled) {
      if (res.hullDamage > 0) parts.push(`船体损伤 -${res.hullDamage}⚡`);
      if (res.comboReset) parts.push('连击已中断');
      parts.unshift(`⚠️ ${res.penaltyTag || '风险触发'}`);
    } else if (res && res.success && res.successTag) {
      parts.unshift(`✨ ${res.successTag}`);
    }

    if (parts.length > 0) {
      this.game.taskSystem.showHint(parts.join(' · '));
    }

    this.game.checkTasks('collect_rarity', this.currentCreature.rarity);
    this.game.checkTasks('unique_collected');
    this.game.checkTasks('night_voyage_catch');

    this.endBattle();
  }

  releaseCreature() {
    if (this.currentCreature) {
      const res = this.currentBattleResult;
      const baseValue = calculateCreatureValue(this.currentCreature, this.currentCreature.tier || 1, this.currentCreature.affixes);
      const valueMult = this.getEventValueMultiplier();
      const actualValue = Math.floor(baseValue * valueMult);
      const sellBonus = Math.floor(actualValue * 0.3);
      const totalCoins = sellBonus + this.eventBonusCoins;
      this.game.updateStats('coins', totalCoins);

      const parts = [`放生得${sellBonus}💰`];
      if (this.eventBonusCoins > 0) parts.push(`事件奖励 +${this.eventBonusCoins}💰`);

      if (res && res.supplyDrop) {
        const supplyNames = { food: '食物', fuel: '燃料', repair: '维修零件' };
        const sn = supplyNames[res.supplyDrop.supply] || res.supplyDrop.supply;
        if (this.game.expedition) {
          this.game.expedition.addSupply(res.supplyDrop.supply, res.supplyDrop.amount);
        }
        parts.push(`补给掉落 +${res.supplyDrop.amount} ${sn}`);
      }

      if (res && res.riskRolled) {
        if (res.hullDamage > 0) parts.push(`船体损伤 -${res.hullDamage}⚡`);
        if (res.comboReset) parts.push('连击已中断');
        parts.unshift(`⚠️ ${res.penaltyTag || '风险触发'}`);
      } else if (res && res.success && res.successTag) {
        parts.unshift(`✨ ${res.successTag}`);
      }

      if (parts.length > 0) {
        this.game.taskSystem.showHint(parts.join(' · '));
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
