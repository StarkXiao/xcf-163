import { getRandomCreature, generateRandomAffixes, calculateCreatureValue, isComboMilestone, getRarityKey, RARITY, CREATURES, COMBO_CONFIG } from '../data/creatures.js';
import { rollNightVoyageEvent, rollBossWreck, generateBossDrops, BOSS_WRECK_LIST } from '../data/deepSeaExpedition.js';

export class BattleSystem {
  constructor(game) {
    this.game = game;
    this.currentCreature = null;
    this.isBattling = false;
    this.currentNightEvent = null;
    this.currentEventBranch = null;
    this.eventBonusCoins = 0;
    this.currentBattleResult = null;

    this.currentBoss = null;
    this.isBossBattle = false;
    this.bossBattleStats = { totalBossesDefeated: 0, bossesDefeated: {} };

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

    this.bossModal = document.getElementById('boss-battle-modal');
    this.bossTitleEl = document.getElementById('boss-battle-title');
    this.bossDisplayEl = document.getElementById('boss-display');
    this.bossQuoteEl = document.getElementById('boss-quote');
    this.bossNameEl = document.getElementById('boss-name');
    this.bossRarityEl = document.getElementById('boss-rarity');
    this.bossDescEl = document.getElementById('boss-desc');
    this.bossHpLabelEl = document.getElementById('boss-hp-label');
    this.bossHpFillEl = document.getElementById('boss-hp-fill');
    this.bossHintEl = document.getElementById('boss-hint');
    this.bossAttackBtn = document.getElementById('btn-boss-attack');
    this.bossFleeBtn = document.getElementById('btn-boss-flee');

    this.bossSettlementModal = document.getElementById('boss-settlement-modal');
    this.bossSettlementContent = document.getElementById('boss-settlement-content');

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
    let hullRarityBoost = null;
    if (inventory && typeof inventory.getNetRarityBoost === 'function') {
      hullRarityBoost = {
        common: inventory.getNetRarityBoost('common'),
        uncommon: inventory.getNetRarityBoost('uncommon'),
        rare: inventory.getNetRarityBoost('rare'),
        epic: inventory.getNetRarityBoost('epic'),
        legendary: inventory.getNetRarityBoost('legendary')
      };
    }
    return getRandomCreature(tideSystem, comboCount, intelEffects, hullRarityBoost);
  }

  bindEvents() {
    this.collectBtn.addEventListener('click', () => this.collectCreature());
    this.releaseBtn.addEventListener('click', () => this.releaseCreature());

    if (this.bossAttackBtn) {
      this.bossAttackBtn.addEventListener('click', () => this.attackBoss());
    }
    if (this.bossFleeBtn) {
      this.bossFleeBtn.addEventListener('click', () => this.fleeBoss());
    }
  }

  hasActiveBossBattle() {
    return this.isBossBattle && this.currentBoss !== null;
  }

  getBossDefeatCount(bossId) {
    return this.bossBattleStats.bossesDefeated[bossId] || 0;
  }

  getTotalBossesDefeated() {
    return this.bossBattleStats.totalBossesDefeated || 0;
  }

  startBattle() {
    if (this.isBattling) return;

    if (this.hasActiveBossBattle()) {
      this.attackBoss();
      return;
    }

    if (!this.isBossBattle) {
      const boss = rollBossWreck(this.game);
      if (boss) {
        this.startBossBattle(boss);
        return;
      }
    }

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

  startBossBattle(boss) {
    this.isBattling = true;
    this.isBossBattle = true;
    this.currentBoss = boss;

    this.game.checkTasks('boss_encounter', boss);
    if (this.game.storySystem) {
      this.game.storySystem.onGameEvent('boss_encounter', boss);
    }

    this.showBossModal();
    this.game.taskSystem.showHint(`⚠️ 首领出现！${boss.icon} ${boss.name}！`);
  }

  showBossModal() {
    if (!this.bossModal || !this.currentBoss) return;

    const boss = this.currentBoss;
    const quote = boss.quotes[Math.floor(Math.random() * boss.quotes.length)];
    const hpPercent = (boss.hp / boss.maxHp) * 100;

    this.bossTitleEl.textContent = `⚔️ 首领战！${boss.icon} ${boss.name}`;
    this.bossDisplayEl.innerHTML = `<span style="font-size: 100px;">${boss.icon}</span>`;
    this.bossDisplayEl.style.background = `radial-gradient(circle, rgba(${this.hexToRgb(boss.color)}, 0.5) 0%, transparent 70%)`;
    this.bossDisplayEl.style.filter = `drop-shadow(0 0 30px rgba(${this.hexToRgb(boss.color)}, 0.9)) saturate(1.3)`;
    this.bossQuoteEl.textContent = `"${quote}"`;
    this.bossNameEl.textContent = boss.name;
    this.bossRarityEl.textContent = '首领';
    this.bossRarityEl.className = 'stat-data rarity-boss';
    this.bossDescEl.textContent = boss.desc;
    this.bossHpLabelEl.textContent = `HP: ${boss.hp}/${boss.maxHp}`;
    this.bossHpFillEl.style.width = `${hpPercent}%`;

    const attackCost = this.game.getCurrentEnergyCost ? this.game.getCurrentEnergyCost() : 10;
    this.bossHintEl.textContent = `每次攻击消耗 ${attackCost} 能量，对首领造成 1 点伤害。击败后领取丰厚战利品！`;
    this.bossAttackBtn.textContent = `⚔️ 攻击 (${attackCost}⚡)`;

    this.bossModal.classList.remove('hidden');
  }

  attackBoss() {
    if (!this.currentBoss) return;

    const cost = this.game.getCurrentEnergyCost ? this.game.getCurrentEnergyCost() : 10;
    if (this.game.stats.energy < cost) {
      this.game.taskSystem.showHint(`能量不足！攻击首领需要 ${cost} 能量。`);
      return;
    }

    this.game.updateStats('energy', -cost);
    this.game.updateStats('catchCount', 1);
    this.game.checkTasks('catch_count');

    this.currentBoss.hp -= 1;

    const displayEl = this.bossDisplayEl;
    displayEl.style.animation = 'none';
    displayEl.offsetHeight;
    displayEl.style.animation = 'bossShake 0.4s ease-in-out';

    const tideSystem = this.game.tideSystem;
    if (tideSystem) {
      tideSystem.recordCatch();
    }

    const tavernSystem = this.game.tavernSystem;
    if (tavernSystem) {
      tavernSystem.consumeCatchIntels();
    }

    if (this.currentBoss.hp <= 0) {
      this.defeatBoss();
    } else {
      this.showBossModal();
    }

    this.game.saveProgress();
  }

  defeatBoss() {
    const boss = this.currentBoss;

    this.bossBattleStats.totalBossesDefeated++;
    this.bossBattleStats.bossesDefeated[boss.id] = (this.bossBattleStats.bossesDefeated[boss.id] || 0) + 1;

    const rarityBoost = this.getEventRarityBoost();
    const drops = generateBossDrops(boss, rarityBoost);

    this.game.checkTasks('boss_defeat', boss);
    this.game.checkTasks('boss_defeat_count');
    this.game.checkTasks('boss_defeat_specific', boss);
    this.game.checkTasks('boss_defeat_all');
    if (this.game.tavernSystem) {
      this.game.tavernSystem.checkQuests('boss_defeat', boss);
      this.game.tavernSystem.checkQuests('boss_defeat_specific', boss);
    }
    if (this.game.storySystem) {
      this.game.storySystem.onGameEvent('boss_defeat', boss);
    }

    this.hideBossModal();
    this.showBossSettlement(boss, drops);
  }

  showBossSettlement(boss, drops) {
    const modal = this.bossSettlementModal;
    const content = this.bossSettlementContent;
    if (!modal || !content) return;

    let totalCreatureValue = 0;
    drops.creatures.forEach(c => {
      totalCreatureValue += calculateCreatureValue(c, c.tier || 1, c.affixes);
    });

    let totalSpecialValue = 0;
    drops.specialItems.forEach(s => {
      totalSpecialValue += s.value;
    });

    const totalCoins = drops.coins + totalCreatureValue + totalSpecialValue;

    content.innerHTML = `
      <div class="settlement-header success" style="border-color: #${boss.color.toString(16).padStart(6, '0')};">
        <div style="font-size:64px;">${boss.icon}</div>
        <h2 style="color: #ff6677; text-shadow: 0 0 20px rgba(255, 51, 85, 0.8);">首领已击败！</h2>
        <p style="color: #aaa; margin-top: 8px;">${boss.name}</p>
      </div>
      <div class="settlement-stats">
        <div class="stat-row">
          <span>首领名称</span>
          <span class="rarity-boss">${boss.icon} ${boss.name}</span>
        </div>
        <div class="stat-row">
          <span>击败次数</span>
          <span>第 ${this.getBossDefeatCount(boss.id)} 次</span>
        </div>
        <div class="stat-row">
          <span>累计击败首领</span>
          <span>${this.getTotalBossesDefeated()} 只</span>
        </div>
      </div>
      <div class="settlement-rewards">
        <div class="chamber-stat-label">战利品明细</div>
        <div class="reward-row"><span>击败赏金</span><span style="color: #ffcc44;">+${drops.coins}💰</span></div>
        <div class="reward-row"><span>生物价值</span><span>+${totalCreatureValue}💰</span></div>
        ${totalSpecialValue > 0 ? `<div class="reward-row"><span>特殊战利品</span><span style="color: #ff88ff;">+${totalSpecialValue}💰</span></div>` : ''}
        <div class="reward-row total"><span>总计</span><span style="color: #ffcc44;">${totalCoins}💰</span></div>
      </div>
      ${drops.creatures.length > 0 ? `
        <div class="boss-settlement-reward-section">
          <div class="chamber-stat-label">捕获生物 (${drops.creatures.length}只，已存入背包)</div>
          <div class="boss-reward-grid">
            ${drops.creatures.map(item => `
              <div class="boss-reward-item rarity-${item.rarity?.name?.toLowerCase() || 'common'}">
                <span class="boss-reward-icon">${item.icon}</span>
                <span class="boss-reward-name">${item.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${drops.specialItems.length > 0 ? `
        <div class="boss-settlement-reward-section">
          <div class="chamber-stat-label">✨ 特殊战利品</div>
          <div class="boss-reward-grid">
            ${drops.specialItems.map(item => `
              <div class="boss-reward-item boss-special-item">
                <span class="boss-reward-icon">${item.icon}</span>
                <span class="boss-reward-name">${item.name}</span>
                <span class="boss-reward-name" style="color: #ffcc44;">${item.value}💰</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <div class="modal-footer">
        <button class="modal-btn primary" id="btn-close-boss-settlement">领取战利品</button>
      </div>
    `;

    modal.classList.remove('hidden');

    drops.creatures.forEach(creature => {
      this.game.addToBackpack(creature);
    });

    drops.specialItems.forEach(special => {
      this.game.updateStats('coins', special.value);
    });

    this.game.updateStats('coins', drops.coins);

    const closeBtn = document.getElementById('btn-close-boss-settlement');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        this.endBossBattle();
      });
    }
  }

  fleeBoss() {
    if (!this.currentBoss) return;

    const boss = this.currentBoss;
    this.game.taskSystem.showHint(`从 ${boss.icon} ${boss.name} 的战斗中撤退了...`);
    this.game.resetCombo();
    this.hideBossModal();
    this.endBossBattle();
  }

  hideBossModal() {
    if (this.bossModal) {
      this.bossModal.classList.add('hidden');
    }
  }

  endBossBattle() {
    this.currentBoss = null;
    this.isBossBattle = false;
    this.isBattling = false;
    this.game.saveProgress();
  }

  loadData(data) {
    if (!data) return;
    if (data.bossBattleStats) {
      this.bossBattleStats = {
        totalBossesDefeated: data.bossBattleStats.totalBossesDefeated || 0,
        bossesDefeated: { ...data.bossBattleStats.bossesDefeated || {} }
      };
    }
    if (data.currentBoss) {
      this.currentBoss = data.currentBoss;
      this.isBossBattle = true;
    }
  }

  toJSON() {
    return {
      bossBattleStats: {
        totalBossesDefeated: this.bossBattleStats.totalBossesDefeated,
        bossesDefeated: { ...this.bossBattleStats.bossesDefeated }
      },
      currentBoss: this.currentBoss,
      isBossBattle: this.isBossBattle
    };
  }
}
