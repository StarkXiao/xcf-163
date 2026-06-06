import { TAVERN_CHARACTERS, INTEL_POOL, MATERIAL_EXCHANGES, SIDEQUESTS, INTEL_TYPES } from '../data/tavern.js';

export class TavernSystem {
  constructor(game) {
    this.game = game;
    this.characters = [];
    this.activeIntels = [];
    this.availableIntels = [];
    this.sideQuests = [];
    this.exchangeCooldowns = {};
    this.unlockedCharacters = new Set();
    
    this.modal = document.getElementById('tavern-modal');
    this.tabBtns = null;
    this.tabContents = null;
    this.currentTab = 'characters';
    
    this.init();
  }

  init() {
    this.characters = TAVERN_CHARACTERS.map(char => ({
      ...char,
      reputation: 0,
      unlocked: char.unlockCost === 0
    }));
    
    this.characters.forEach(char => {
      if (char.unlocked) {
        this.unlockedCharacters.add(char.id);
      }
    });
    
    this.sideQuests = SIDEQUESTS.map(q => ({
      ...q,
      progress: 0,
      completed: false,
      claimed: false,
      active: false
    }));
    
    this.refreshAvailableIntels();
    this.bindStaticEvents();
  }

  bindStaticEvents() {
    const btnTavern = document.getElementById('btn-tavern');
    if (btnTavern) {
      btnTavern.addEventListener('click', () => this.openTavern());
    }
    const btnClose = document.getElementById('btn-close-tavern');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeTavern());
    }
  }

  bindDynamicEvents() {
    this.tabBtns = document.querySelectorAll('.tavern-tab');
    this.tabContents = document.querySelectorAll('.tavern-tab-content');
    
    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          this.switchTab(tab);
        });
      });
    }
  }

  openTavern() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    this.game.checkTasks('tavern_open');
    this.refreshAvailableIntels();
    this.renderAll();
    this.bindDynamicEvents();
  }

  closeTavern() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
  }

  switchTab(tab) {
    this.currentTab = tab;
    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
      });
    }
    if (this.tabContents) {
      this.tabContents.forEach(content => {
        content.classList.toggle('hidden', content.dataset.tab !== tab);
      });
    }
    this.renderAll();
  }

  renderAll() {
    this.renderCharacters();
    this.renderIntels();
    this.renderExchanges();
    this.renderQuests();
  }

  renderCharacters() {
    const el = document.getElementById('tavern-characters');
    if (!el) return;
    
    el.innerHTML = `
      <p class="chamber-hint">与酒馆角色建立人脉，获取情报、材料交换和专属任务</p>
      <div class="character-list">
        ${this.characters.map(char => this.renderCharacterCard(char)).join('')}
      </div>
    `;
    
    el.querySelectorAll('[data-character-action]').forEach(btn => {
      const charId = btn.dataset.characterId;
      const action = btn.dataset.characterAction;
      btn.addEventListener('click', () => {
        if (action === 'unlock') {
          this.unlockCharacter(charId);
        } else if (action === 'talk') {
          this.talkToCharacter(charId);
        }
      });
    });
  }

  renderCharacterCard(char) {
    const repPct = (char.reputation / char.maxReputation) * 100;
    const specialties = char.specialties.join('、');
    const greeting = char.greetings[Math.floor(Math.random() * char.greetings.length)];
    
    let actionHtml = '';
    if (!char.unlocked) {
      const canAfford = this.game.stats.coins >= char.unlockCost;
      actionHtml = `<button class="modal-btn primary full-width" data-character-id="${char.id}" data-character-action="unlock" ${canAfford ? '' : 'disabled'}>🔓 结识 (${char.unlockCost}💰)</button>`;
    } else {
      actionHtml = `<button class="modal-btn accent full-width" data-character-id="${char.id}" data-character-action="talk">💬 交谈</button>`;
    }
    
    return `
      <div class="character-card ${char.unlocked ? '' : 'character-locked'}">
        <div class="character-header">
          <span class="character-icon">${char.icon}</span>
          <div class="character-info">
            <div class="character-name">${char.name}${char.unlocked ? '' : ' 🔒'}</div>
            <div class="character-specialties">专长: ${specialties}</div>
          </div>
        </div>
        <div class="character-desc">${char.desc}</div>
        ${char.unlocked ? `
          <div class="character-reputation">
            <div class="chamber-stat-label">好感度</div>
            <div class="chamber-progress">
              <div class="chamber-progress-fill reputation-fill" style="width:${repPct}%"></div>
            </div>
            <div class="chamber-stat-sub">${char.reputation} / ${char.maxReputation}</div>
          </div>
          <div class="character-greeting">"${greeting}"</div>
        ` : ''}
        <div class="character-action">${actionHtml}</div>
      </div>
    `;
  }

  unlockCharacter(charId) {
    const char = this.characters.find(c => c.id === charId);
    if (!char || char.unlocked) return;
    
    if (this.game.stats.coins < char.unlockCost) {
      this.game.taskSystem.showHint('金币不足！');
      return;
    }
    
    this.game.updateStats('coins', -char.unlockCost);
    char.unlocked = true;
    this.unlockedCharacters.add(charId);
    this.game.taskSystem.showHint(`🎉 结识了 ${char.icon} ${char.name}！`);
    this.game.saveProgress();
    this.renderCharacters();
  }

  talkToCharacter(charId) {
    const char = this.characters.find(c => c.id === charId);
    if (!char || !char.unlocked) return;
    
    this.addReputation(charId, 1);
    const greeting = char.greetings[Math.floor(Math.random() * char.greetings.length)];
    this.game.taskSystem.showHint(`${char.icon} ${char.name}: "${greeting}"`);
    
    this.checkUnlockQuests(charId);
    this.renderCharacters();
  }

  addReputation(charId, amount) {
    const char = this.characters.find(c => c.id === charId);
    if (!char) return;
    
    char.reputation = Math.min(char.maxReputation, char.reputation + amount);
    this.game.saveProgress();
  }

  getReputation(charId) {
    const char = this.characters.find(c => c.id === charId);
    return char ? char.reputation : 0;
  }

  refreshAvailableIntels() {
    this.availableIntels = INTEL_POOL.filter(intel => {
      return intel.source.some(src => {
        const char = this.characters.find(c => c.id === src);
        return char && char.unlocked && char.reputation >= (intel.reputationRequired || 0);
      });
    });
  }

  renderIntels() {
    const el = document.getElementById('tavern-intels');
    if (!el) return;
    
    const activeIntelsHtml = this.activeIntels.length > 0 ? `
      <div class="active-intels-section">
        <div class="chamber-stat-label" style="margin-bottom:10px;">生效中的情报</div>
        <div class="active-intel-list">
          ${this.activeIntels.map((intel, idx) => `
            <div class="active-intel-card">
              <div class="active-intel-name">${intel.name}</div>
              <div class="active-intel-desc">${intel.desc}</div>
              <div class="active-intel-duration">
                ${intel.duration > 0 ? `剩余: ${intel.remainingDuration}${intel.durationType === 'time' ? 's' : ' 次'}` : '永久生效(一次性)'}
              </div>
              <button class="modal-btn secondary" data-intel-remove="${idx}">取消</button>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';
    
    el.innerHTML = `
      ${activeIntelsHtml}
      <p class="chamber-hint">购买情报可以临时改变打捞池概率</p>
      <div class="intel-list">
        ${this.availableIntels.length === 0 ? `
          <div style="color:#666;text-align:center;padding:30px;">
            暂无可购买情报<br><br>
            结识更多酒馆角色并提升好感度来解锁情报
          </div>
        ` : this.availableIntels.map(intel => this.renderIntelCard(intel)).join('')}
      </div>
    `;
    
    el.querySelectorAll('[data-intel-buy]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.buyIntel(btn.dataset.intelBuy);
      });
    });
    
    el.querySelectorAll('[data-intel-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.intelRemove);
        if (idx >= 0 && idx < this.activeIntels.length) {
          this.activeIntels.splice(idx, 1);
          this.game.saveProgress();
          this.renderIntels();
        }
      });
    });
  }

  renderIntelCard(intel) {
    const sources = intel.source.map(srcId => {
      const char = this.characters.find(c => c.id === srcId);
      return char ? `${char.icon}${char.name}` : srcId;
    }).join('、');
    
    const costText = intel.cost.coins ? `${intel.cost.coins}💰` : '';
    const canAfford = !intel.cost.coins || this.game.stats.coins >= intel.cost.coins;
    
    const alreadyActive = this.activeIntels.some(ai => ai.id === intel.id);
    
    return `
      <div class="intel-card">
        <div class="intel-header">
          <div class="intel-name">${intel.name}</div>
          <div class="intel-cost">${costText}</div>
        </div>
        <div class="intel-desc">${intel.desc}</div>
        <div class="intel-source">来源: ${sources}</div>
        <div class="intel-duration">
          ${intel.duration > 0 ? `持续: ${intel.duration}${intel.type === INTEL_TYPES.COMBO_BOOST ? '秒' : ' 次打捞'}` : '单次触发'}
        </div>
        <div class="intel-action">
          <button class="modal-btn primary full-width" data-intel-buy="${intel.id}" ${canAfford && !alreadyActive ? '' : 'disabled'}>
            ${alreadyActive ? '已生效' : `购买情报`}
          </button>
        </div>
      </div>
    `;
  }

  buyIntel(intelId) {
    const intel = INTEL_POOL.find(i => i.id === intelId);
    if (!intel) return;
    
    if (this.activeIntels.some(ai => ai.id === intelId)) {
      this.game.taskSystem.showHint('该情报已在生效中！');
      return;
    }
    
    if (intel.cost && intel.cost.coins) {
      if (this.game.stats.coins < intel.cost.coins) {
        this.game.taskSystem.showHint('金币不足！');
        return;
      }
      this.game.updateStats('coins', -intel.cost.coins);
    }
    
    const activeIntel = {
      ...intel,
      remainingDuration: intel.duration,
      durationType: intel.type === INTEL_TYPES.COMBO_BOOST ? 'time' : 'catch'
    };
    
    this.activeIntels.push(activeIntel);
    
    if (intel.type === INTEL_TYPES.COMBO_BOOST) {
      setTimeout(() => {
        const idx = this.activeIntels.findIndex(ai => ai.id === intelId);
        if (idx >= 0) {
          this.activeIntels.splice(idx, 1);
          this.game.taskSystem.showHint(`情报「${intel.name}」已失效`);
        }
      }, intel.duration * 1000);
    }
    
    this.game.taskSystem.showHint(`📡 获得情报：${intel.name}`);
    this.game.saveProgress();
    this.renderIntels();
  }

  consumeCatchIntels() {
    this.activeIntels = this.activeIntels.filter(intel => {
      if (intel.durationType === 'catch' && intel.remainingDuration > 0) {
        intel.remainingDuration--;
        if (intel.remainingDuration <= 0) {
          this.game.taskSystem.showHint(`情报「${intel.name}」已用完`);
          return false;
        }
      }
      return true;
    });
    this.game.saveProgress();
  }

  getIntelEffects() {
    const effects = {
      rarityBoost: 0,
      rareAndAboveBoost: 0,
      epicAndAboveBoost: 0,
      legendaryBoostInStorm: 1,
      noEmptyCatch: false,
      creatureBoosts: {},
      comboTimeoutExtend: 0,
      energyDiscount: 0
    };
    
    this.activeIntels.forEach(intel => {
      if (intel.effect) {
        if (intel.effect.rarityBoost) effects.rarityBoost += intel.effect.rarityBoost;
        if (intel.effect.rareAndAboveBoost) effects.rareAndAboveBoost += intel.effect.rareAndAboveBoost;
        if (intel.effect.epicAndAboveBoost) effects.epicAndAboveBoost += intel.effect.epicAndAboveBoost;
        if (intel.effect.legendaryBoostInStorm) effects.legendaryBoostInStorm *= intel.effect.legendaryBoostInStorm;
        if (intel.effect.noEmptyCatch) effects.noEmptyCatch = true;
        if (intel.effect.creatureBoost && intel.effect.multiplier) {
          effects.creatureBoosts[intel.effect.creatureBoost] = (effects.creatureBoosts[intel.effect.creatureBoost] || 1) * intel.effect.multiplier;
        }
        if (intel.effect.comboTimeoutExtend) effects.comboTimeoutExtend += intel.effect.comboTimeoutExtend;
        if (intel.effect.energyDiscount) effects.energyDiscount = Math.max(effects.energyDiscount, intel.effect.energyDiscount);
      }
    });
    
    return effects;
  }

  renderExchanges() {
    const el = document.getElementById('tavern-exchanges');
    if (!el) return;
    
    const availableExchanges = MATERIAL_EXCHANGES.filter(ex => {
      return ex.source.some(src => {
        const char = this.characters.find(c => c.id === src);
        return char && char.unlocked && char.reputation >= (ex.reputationRequired || 0);
      });
    });
    
    el.innerHTML = `
      <p class="chamber-hint">通过材料交换获取稀有资源</p>
      <div class="materials-bar" id="tavern-materials-bar"></div>
      <div class="exchange-list">
        ${availableExchanges.length === 0 ? `
          <div style="color:#666;text-align:center;padding:30px;">
            暂无可交换项目<br><br>
            结识更多酒馆角色并提升好感度来解锁交换
          </div>
        ` : availableExchanges.map(ex => this.renderExchangeCard(ex)).join('')}
      </div>
    `;
    
    this.renderMaterialsBar('tavern-materials-bar');
    
    el.querySelectorAll('[data-exchange-do]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.doExchange(btn.dataset.exchangeDo);
      });
    });
  }

  renderExchangeCard(ex) {
    const sources = ex.source.map(srcId => {
      const char = this.characters.find(c => c.id === srcId);
      return char ? `${char.icon}${char.name}` : srcId;
    }).join('、');
    
    const inputParts = Object.entries(ex.input).map(([id, count]) => {
      if (id === 'coins') return `${count}💰`;
      const mat = this.getMaterialInfo(id);
      return mat ? `${count}× ${mat.icon}${mat.name}` : `${count}× ${id}`;
    }).join(' + ');
    
    const outputParts = Object.entries(ex.output).map(([id, count]) => {
      if (id === 'coins') return `${count}💰`;
      if (id === 'energy') return `${count}⚡`;
      const mat = this.getMaterialInfo(id);
      return mat ? `${count}× ${mat.icon}${mat.name}` : `${count}× ${id}`;
    }).join(' + ');
    
    const canDo = this.canDoExchange(ex);
    
    return `
      <div class="exchange-card">
        <div class="exchange-header">
          <div class="exchange-name">${ex.name}</div>
          <div class="exchange-source">${sources}</div>
        </div>
        <div class="exchange-desc">${ex.desc}</div>
        <div class="exchange-trade">
          <div class="exchange-input">${inputParts}</div>
          <div class="exchange-arrow">➡️</div>
          <div class="exchange-output">${outputParts}</div>
        </div>
        <div class="exchange-action">
          <button class="modal-btn primary full-width" data-exchange-do="${ex.id}" ${canDo ? '' : 'disabled'}>
            交换
          </button>
        </div>
      </div>
    `;
  }

  getMaterialInfo(matId) {
    const materials = {
      common_scrap: { id: 'common_scrap', name: '普通废料', icon: '🔩' },
      alloy_plate: { id: 'alloy_plate', name: '合金板', icon: '🛡️' },
      energy_core: { id: 'energy_core', name: '能量核心', icon: '💠' },
      nano_swarm: { id: 'nano_swarm', name: '纳米集群', icon: '✨' },
      void_crystal: { id: 'void_crystal', name: '虚空晶体', icon: '🔮' }
    };
    return materials[matId] || null;
  }

  canDoExchange(ex) {
    for (const [id, count] of Object.entries(ex.input)) {
      if (id === 'coins') {
        if (this.game.stats.coins < count) return false;
      } else {
        const owned = this.game.inventory.getMaterialCount ? this.game.inventory.getMaterialCount(id) : 0;
        if (owned < count) return false;
      }
    }
    return true;
  }

  doExchange(exId) {
    const ex = MATERIAL_EXCHANGES.find(e => e.id === exId);
    if (!ex) return;
    
    if (!this.canDoExchange(ex)) {
      this.game.taskSystem.showHint('材料不足！');
      return;
    }
    
    for (const [id, count] of Object.entries(ex.input)) {
      if (id === 'coins') {
        this.game.updateStats('coins', -count);
      } else if (this.game.inventory.removeMaterial) {
        this.game.inventory.removeMaterial(id, count);
      }
    }
    
    for (const [id, count] of Object.entries(ex.output)) {
      if (id === 'coins') {
        this.game.updateStats('coins', count);
      } else if (id === 'energy') {
        this.game.updateStats('energy', count);
      } else if (this.game.inventory.addMaterial) {
        this.game.inventory.addMaterial(id, count);
      }
    }
    
    const sourceChar = ex.source.find(s => this.unlockedCharacters.has(s));
    if (sourceChar) {
      this.addReputation(sourceChar, 2);
    }
    
    this.game.taskSystem.showHint(`✅ 交换成功：${ex.name}`);
    this.game.checkTasks('tavern_exchange');
    this.game.saveProgress();
    this.renderExchanges();
  }

  renderMaterialsBar(elementId) {
    const el = document.getElementById(elementId);
    if (!el || !this.game.inventory || !this.game.inventory.materials) return;
    
    const materials = ['common_scrap', 'alloy_plate', 'energy_core', 'nano_swarm', 'void_crystal'];
    el.innerHTML = materials.map(matId => {
      const mat = this.getMaterialInfo(matId);
      const count = this.game.inventory.materials[matId] || 0;
      return `
        <span class="material-chip">
          <span class="material-icon">${mat.icon}</span>
          <span class="material-name">${mat.name}</span>
          <span class="material-count">${count}</span>
        </span>
      `;
    }).join('');
  }

  checkUnlockQuests(charId) {
    const char = this.characters.find(c => c.id === charId);
    if (!char) return;
    
    this.sideQuests.forEach(quest => {
      if (quest.source === charId && !quest.active && !quest.completed && char.reputation >= (quest.reputationRequired || 0)) {
        quest.active = true;
        this.game.taskSystem.showHint(`📜 解锁新支线：${quest.name}`);
      }
    });
  }

  renderQuests() {
    const el = document.getElementById('tavern-quests');
    if (!el) return;
    
    const activeQuests = this.sideQuests.filter(q => q.active && !q.completed);
    const completedQuests = this.sideQuests.filter(q => q.completed);
    const lockedQuests = this.sideQuests.filter(q => !q.active && !q.completed);
    
    el.innerHTML = `
      <p class="chamber-hint">完成酒馆角色的支线任务获得丰厚奖励</p>
      
      <div class="quest-section">
        <div class="chamber-stat-label" style="margin-bottom:10px;">进行中 (${activeQuests.length})</div>
        ${activeQuests.length === 0 ? `
          <div style="color:#666;text-align:center;padding:15px;">暂无进行中的任务</div>
        ` : activeQuests.map(q => this.renderQuestCard(q, 'active')).join('')}
      </div>
      
      <div class="quest-section">
        <div class="chamber-stat-label" style="margin-bottom:10px;">已完成 (${completedQuests.length})</div>
        ${completedQuests.length === 0 ? `
          <div style="color:#666;text-align:center;padding:15px;">暂无已完成任务</div>
        ` : completedQuests.map(q => this.renderQuestCard(q, 'completed')).join('')}
      </div>
      
      <div class="quest-section">
        <div class="chamber-stat-label" style="margin-bottom:10px;">未解锁 (${lockedQuests.length})</div>
        ${lockedQuests.length === 0 ? `
          <div style="color:#666;text-align:center;padding:15px;">所有任务已解锁</div>
        ` : lockedQuests.map(q => this.renderQuestCard(q, 'locked')).join('')}
      </div>
    `;
    
    el.querySelectorAll('[data-quest-claim]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.claimQuestReward(btn.dataset.questClaim);
      });
    });
  }

  renderQuestCard(quest, state) {
    const sourceChar = this.characters.find(c => c.id === quest.source);
    const sourceText = sourceChar ? `${sourceChar.icon} ${sourceChar.name}` : quest.source;
    
    const targetCount = quest.target.count || 1;
    const progress = Math.min(quest.progress, targetCount);
    const progressPct = (progress / targetCount) * 100;
    
    let rewardParts = [];
    if (quest.reward.coins) rewardParts.push(`${quest.reward.coins}💰`);
    if (quest.reward.energy) rewardParts.push(`${quest.reward.energy}⚡`);
    if (quest.reward.reputation) rewardParts.push(`好感+${quest.reward.reputation}`);
    if (quest.reward.materials) {
      Object.entries(quest.reward.materials).forEach(([id, count]) => {
        const mat = this.getMaterialInfo(id);
        rewardParts.push(mat ? `${count}× ${mat.icon}${mat.name}` : `${count}× ${id}`);
      });
    }
    const rewardText = rewardParts.join('  ');
    
    if (state === 'locked') {
      return `
        <div class="quest-card quest-locked">
          <div class="quest-header">
            <span class="quest-source">🔒 ${sourceText}</span>
          </div>
          <div class="quest-name">${quest.name}</div>
          <div class="quest-hint">${quest.unlockHint}</div>
        </div>
      `;
    }
    
    if (state === 'completed') {
      return `
        <div class="quest-card quest-completed">
          <div class="quest-header">
            <span class="quest-source">${sourceText}</span>
            <span class="quest-status">${quest.claimed ? '✅ 已领取' : '🎉 可领取'}</span>
          </div>
          <div class="quest-name">${quest.name} ✓</div>
          <div class="quest-desc">${quest.desc}</div>
          <div class="quest-reward">奖励: ${rewardText}</div>
          ${quest.claimed ? '' : `
            <div class="quest-action">
              <button class="modal-btn accent full-width" data-quest-claim="${quest.id}">领取奖励</button>
            </div>
          `}
        </div>
      `;
    }
    
    return `
      <div class="quest-card quest-active">
        <div class="quest-header">
          <span class="quest-source">${sourceText}</span>
        </div>
        <div class="quest-name">${quest.name}</div>
        <div class="quest-desc">${quest.desc}</div>
        <div class="chamber-progress">
          <div class="chamber-progress-fill" style="width:${progressPct}%"></div>
        </div>
        <div class="quest-progress-text">${progress} / ${targetCount}</div>
        <div class="quest-reward">奖励: ${rewardText}</div>
      </div>
    `;
  }

  claimQuestReward(questId) {
    const quest = this.sideQuests.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;
    
    if (quest.reward.coins) {
      this.game.updateStats('coins', quest.reward.coins);
    }
    if (quest.reward.energy) {
      this.game.updateStats('energy', quest.reward.energy);
    }
    if (quest.reward.reputation && quest.source) {
      this.addReputation(quest.source, quest.reward.reputation);
    }
    if (quest.reward.materials && this.game.inventory.addMaterial) {
      Object.entries(quest.reward.materials).forEach(([id, count]) => {
        this.game.inventory.addMaterial(id, count);
      });
    }
    
    quest.claimed = true;
    this.game.taskSystem.showHint(`🎁 领取奖励：${quest.name}`);
    this.game.saveProgress();
    this.renderQuests();
  }

  checkQuests(type, data = null) {
    let updated = false;
    
    this.sideQuests.forEach(quest => {
      if (!quest.active || quest.completed) return;
      
      let shouldUpdate = false;
      let progressValue = 0;
      const targetCount = quest.target.count || 1;
      
      switch (quest.type) {
        case 'find_creature':
          if (type === 'find_creature' && data && data.id === quest.target.creatureId) {
            shouldUpdate = true;
            progressValue = quest.progress + 1;
          }
          break;
          
        case 'collect_creature':
          if (type === 'collect_creature' && data && data.id === quest.target.creatureId) {
            shouldUpdate = true;
            if (this.game.inventory.getCreatureCount) {
              progressValue = this.game.inventory.getCreatureCount(quest.target.creatureId);
            } else {
              progressValue = quest.progress + 1;
            }
          }
          break;
          
        case 'collect_materials':
          if (type === 'material_change' && data && data.id === quest.target.materialId) {
            shouldUpdate = true;
            if (this.game.inventory.getMaterialCount) {
              progressValue = this.game.inventory.getMaterialCount(quest.target.materialId);
            } else {
              progressValue = quest.progress + (data.change || 0);
            }
          }
          break;
          
        case 'find_rarity':
          if (type === 'find_rarity' && data && data.name === quest.target.rarity.name) {
            shouldUpdate = true;
            progressValue = quest.progress + 1;
          }
          break;
          
        case 'find_rarity_in_tide':
          if (type === 'find_rarity_in_tide' && data) {
            if (data.rarity && data.rarity.name === quest.target.rarity.name && 
                data.tide && data.tide.id === quest.target.tideId) {
              shouldUpdate = true;
              progressValue = quest.progress + 1;
            }
          }
          break;
          
        case 'find_rarity_in_combo':
          if (type === 'find_rarity_in_combo' && data) {
            const minCombo = quest.target.minCombo || 1;
            if (data.rarity && data.rarity.name === quest.target.rarity.name && 
                data.combo >= minCombo) {
              shouldUpdate = true;
              progressValue = quest.progress + 1;
            }
          }
          break;
          
        case 'unique_collected':
          if (type === 'unique_collected') {
            shouldUpdate = true;
            progressValue = this.game.inventory.getCollection().size;
          }
          break;
          
        case 'combo_reach':
          if (type === 'combo_reach' && typeof data === 'number') {
            shouldUpdate = true;
            progressValue = Math.max(quest.progress, data >= quest.target.count ? quest.target.count : quest.progress);
          }
          break;
      }
      
      if (shouldUpdate) {
        quest.progress = Math.min(progressValue, targetCount);
        updated = true;
        
        if (quest.progress >= targetCount && !quest.completed) {
          quest.completed = true;
          this.game.taskSystem.showHint(`🎉 支线完成：${quest.name}！可在酒馆领取奖励。`);
        }
      }
    });
    
    if (updated) {
      this.game.saveProgress();
    }
    
    return updated;
  }

  toJSON() {
    return {
      characters: this.characters.map(c => ({
        id: c.id,
        reputation: c.reputation,
        unlocked: c.unlocked
      })),
      activeIntels: this.activeIntels,
      sideQuests: this.sideQuests.map(q => ({
        id: q.id,
        progress: q.progress,
        completed: q.completed,
        claimed: q.claimed,
        active: q.active
      })),
      unlockedCharacters: Array.from(this.unlockedCharacters)
    };
  }

  loadData(data) {
    if (!data) return;
    
    if (data.characters) {
      data.characters.forEach(savedChar => {
        const char = this.characters.find(c => c.id === savedChar.id);
        if (char) {
          char.reputation = savedChar.reputation || 0;
          char.unlocked = savedChar.unlocked || false;
        }
      });
    }
    
    if (data.activeIntels) {
      this.activeIntels = data.activeIntels;
    }
    
    if (data.sideQuests) {
      data.sideQuests.forEach(savedQuest => {
        const quest = this.sideQuests.find(q => q.id === savedQuest.id);
        if (quest) {
          quest.progress = savedQuest.progress || 0;
          quest.completed = savedQuest.completed || false;
          quest.claimed = savedQuest.claimed || false;
          quest.active = savedQuest.active || false;
        }
      });
    }
    
    if (data.unlockedCharacters) {
      this.unlockedCharacters = new Set(data.unlockedCharacters);
    }
  }
}
