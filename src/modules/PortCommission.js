import { CREATURES, RARITY } from '../data/creatures.js';
import {
  generateCommission,
  CREATURE_CATEGORIES,
  getCategoryCreatures
} from '../data/portCommissions.js';

export class PortCommission {
  constructor(game) {
    this.game = game;
    this.commissions = [];
    this.completedHistory = [];
    this.stats = {
      totalCreated: 0,
      totalCompleted: 0,
      totalPhasesCompleted: 0,
      totalCoinReward: 0,
      totalEnergyReward: 0,
      playerLevel: 1,
      playerExp: 0,
      expToNextLevel: 100
    };
    this.maxActiveCommissions = 3;
    this.refreshCooldown = 0;
    this.refreshInterval = 180;

    this.modal = null;
    this.tabsEl = null;
    this.tabContents = null;
    this.currentTab = 'active';

    this.initElements();
    this.bindStaticEvents();
  }

  initElements() {
    this.modal = document.getElementById('port-commission-modal');
    this.tabsEl = document.querySelectorAll('.port-tab');
    this.tabContents = document.querySelectorAll('.port-tab-content');
  }

  bindStaticEvents() {
    const btn = document.getElementById('btn-port-commission');
    if (btn) {
      btn.addEventListener('click', () => this.open());
    }
    const closeBtn = document.getElementById('btn-close-port-commission');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    const refreshBtn = document.getElementById('btn-port-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshCommissions());
    }
  }

  bindDynamicEvents() {
    this.tabsEl = document.querySelectorAll('.port-tab');
    this.tabContents = document.querySelectorAll('.port-tab-content');

    if (this.tabsEl) {
      this.tabsEl.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          this.switchTab(tab);
        });
      });
    }
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    this.game.checkTasks('port_commission_open');
    this.ensureEnoughCommissions();
    this.renderAll();
    this.bindDynamicEvents();
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
  }

  switchTab(tab) {
    this.currentTab = tab;
    if (this.tabsEl) {
      this.tabsEl.forEach(btn => {
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
    this.renderActiveCommissions();
    this.renderAvailableCommissions();
    this.renderHistory();
    this.renderPlayerStats();
  }

  renderPlayerStats() {
    const el = document.getElementById('port-player-stats');
    if (!el) return;

    const expPercent = (this.stats.playerExp / this.stats.expToNextLevel) * 100;

    el.innerHTML = `
      <div class="port-stats-bar">
        <div class="port-stat-item">
          <span class="port-stat-label">委托等级</span>
          <span class="port-stat-value">Lv.${this.stats.playerLevel}</span>
        </div>
        <div class="port-stat-item">
          <span class="port-stat-label">经验</span>
          <span class="port-stat-value">${this.stats.playerExp}/${this.stats.expToNextLevel}</span>
        </div>
        <div class="port-stat-item">
          <span class="port-stat-label">已完成</span>
          <span class="port-stat-value">${this.stats.totalCompleted}</span>
        </div>
      </div>
      <div class="port-exp-bar">
        <div class="port-exp-fill" style="width: ${expPercent}%"></div>
      </div>
    `;
  }

  ensureEnoughCommissions() {
    const activeCount = this.commissions.filter(c => c.status === 'active' || c.status === 'in_progress').length;
    const availableCount = this.commissions.filter(c => c.status === 'available').length;

    if (availableCount < this.maxActiveCommissions - activeCount) {
      const needed = this.maxActiveCommissions - activeCount - availableCount;
      for (let i = 0; i < needed; i++) {
        this.generateNewCommission();
      }
    }
  }

  generateNewCommission() {
    const collection = this.game.inventory ? this.game.inventory.getCollection() : new Set();
    const commission = generateCommission(this.stats.playerLevel, collection);
    commission.status = 'available';
    this.commissions.push(commission);
    this.stats.totalCreated++;
    this.game.saveProgress();
    return commission;
  }

  acceptCommission(commissionId) {
    const commission = this.commissions.find(c => c.id === commissionId);
    if (!commission || commission.status !== 'available') {
      return { success: false, message: '委托不存在或不可接受' };
    }

    const activeCount = this.commissions.filter(c => c.status === 'in_progress').length;
    if (activeCount >= this.maxActiveCommissions) {
      return { success: false, message: '进行中的委托已达上限' };
    }

    commission.status = 'in_progress';
    this.game.saveProgress();
    this.game.taskSystem.showHint(`📋 接受委托：${commission.templateName}`);
    this.game.checkTasks('port_commission_accept');
    this.renderAll();
    return { success: true, message: '委托已接受' };
  }

  checkItemMatchesPhase(item, phase) {
    if (!phase || phase.status !== 'active') return false;

    if (phase.targetCreatureId && item.id !== phase.targetCreatureId) {
      return false;
    }

    if (phase.targetRarity) {
      const targetRarity = Object.values(RARITY).find(r => r.name === phase.targetRarity);
      if (targetRarity && item.rarity.weight > targetRarity.weight) {
        return false;
      }
    }

    if (phase.targetCategory) {
      const category = Object.values(CREATURE_CATEGORIES).find(c => c.name === phase.targetCategory);
      if (category && !category.creatureIds.includes(item.id)) {
        return false;
      }
    }

    if (phase.requireNew) {
      const collection = this.game.inventory ? this.game.inventory.getCollection() : new Set();
      if (collection.has(item.id)) {
        return false;
      }
    }

    return true;
  }

  trySubmitBackpackItem(item, inventoryIndex, preferredCommissionId = null) {
    let eligibleCommissions = this.commissions.filter(c =>
      c.status === 'in_progress' && c.currentPhase < c.phases.length
    ).map(c => ({
      commission: c,
      phase: c.phases[c.currentPhase]
    })).filter(({ phase }) =>
      this.checkItemMatchesPhase(item, phase)
    );

    if (preferredCommissionId) {
      const preferred = eligibleCommissions.find(({ commission }) => commission.id === preferredCommissionId);
      if (preferred) eligibleCommissions = [preferred];
    }

    if (eligibleCommissions.length === 0) {
      return { success: false, message: '没有匹配的委托阶段' };
    }

    const { commission, phase } = eligibleCommissions[0];
    const backpackItem = this.game.inventory.backpack[inventoryIndex];
    if (!backpackItem) return { success: false, message: '物品不存在' };

    const needCount = phase.requiredQuantity - phase.currentQuantity;
    const useCount = Math.min(backpackItem.count, needCount);

    if (backpackItem.count > useCount) {
      backpackItem.count -= useCount;
    } else {
      this.game.inventory.backpack.splice(inventoryIndex, 1);
    }

    phase.currentQuantity += useCount;

    if (phase.currentQuantity >= phase.requiredQuantity) {
      return this.completePhase(commission.id);
    }

    this.game.saveProgress();
    this.game.inventory.renderBackpack();
    this.renderAll();

    return {
      success: true,
      message: `委托进度：${phase.currentQuantity}/${phase.requiredQuantity}`,
      commissionId: commission.id,
      partial: true
    };
  }

  completePhase(commissionId) {
    const commission = this.commissions.find(c => c.id === commissionId);
    if (!commission) return { success: false, message: '委托不存在' };

    const phase = commission.phases[commission.currentPhase];
    if (!phase) return { success: false, message: '阶段不存在' };

    if (phase.coinReward) {
      this.game.updateStats('coins', phase.coinReward);
      this.stats.totalCoinReward += phase.coinReward;
    }
    if (phase.energyReward) {
      this.game.updateStats('energy', phase.energyReward);
      this.stats.totalEnergyReward += phase.energyReward;
    }

    this.stats.totalPhasesCompleted++;
    this.addExp(Math.floor(phase.coinReward * 0.1) + 10);

    phase.status = 'completed';

    const phaseRewards = [];
    if (phase.coinReward) phaseRewards.push(`${phase.coinReward}💰`);
    if (phase.energyReward) phaseRewards.push(`${phase.energyReward}⚡`);

    if (commission.currentPhase < commission.phases.length - 1) {
      commission.currentPhase++;
      commission.phases[commission.currentPhase].status = 'active';
      this.game.saveProgress();
      this.game.taskSystem.showHint(`✅ 阶段完成！获得 ${phaseRewards.join(' ')}，下一阶段已解锁。`);
      this.game.checkTasks('port_commission_phase');
      this.renderAll();
      this.game.inventory.renderBackpack();
      return {
        success: true,
        message: `阶段完成，获得 ${phaseRewards.join(' ')}`,
        commissionId: commission.id,
        phaseComplete: true
      };
    } else {
      return this.completeCommission(commissionId, phaseRewards);
    }
  }

  completeCommission(commissionId, lastPhaseRewards = []) {
    const commission = this.commissions.find(c => c.id === commissionId);
    if (!commission) return { success: false, message: '委托不存在' };

    commission.status = 'completed';
    commission.claimed = true;
    commission.completedAt = Date.now();
    this.stats.totalCompleted++;

    const bonusCoins = Math.floor(commission.totalCoinReward * 0.3);
    if (bonusCoins > 0) {
      this.game.updateStats('coins', bonusCoins);
      this.stats.totalCoinReward += bonusCoins;
    }

    this.addExp(50 + this.stats.playerLevel * 10);

    this.completedHistory.unshift({
      id: commission.id,
      templateName: commission.templateName,
      rarity: commission.rarity,
      totalCoinReward: commission.totalCoinReward + bonusCoins,
      completedAt: commission.completedAt
    });

    if (this.completedHistory.length > 50) {
      this.completedHistory = this.completedHistory.slice(0, 50);
    }

    this.game.saveProgress();
    this.game.checkTasks('port_commission_complete');
    this.game.checkTasks('port_commission_rarity', commission.rarity);

    const allRewards = [...lastPhaseRewards];
    if (bonusCoins > 0) allRewards.push(`额外${bonusCoins}💰`);

    this.game.taskSystem.showHint(`🎉 委托完成！${commission.templateName}，获得 ${allRewards.join(' ')}`);
    this.renderAll();
    this.game.inventory.renderBackpack();

    return {
      success: true,
      message: `委托完成，获得 ${allRewards.join(' ')}`,
      commission,
      allComplete: true
    };
  }

  addExp(amount) {
    this.stats.playerExp += amount;
    while (this.stats.playerExp >= this.stats.expToNextLevel) {
      this.stats.playerExp -= this.stats.expToNextLevel;
      this.stats.playerLevel++;
      this.stats.expToNextLevel = Math.floor(100 * Math.pow(1.3, this.stats.playerLevel - 1));
      this.game.taskSystem.showHint(`⬆️ 委托等级提升！当前 Lv.${this.stats.playerLevel}`);
      this.game.checkTasks('port_level_up');
    }
    this.game.saveProgress();
  }

  abandonCommission(commissionId) {
    const commission = this.commissions.find(c => c.id === commissionId);
    if (!commission || (commission.status !== 'in_progress' && commission.status !== 'available')) {
      return { success: false, message: '委托不存在或无法放弃' };
    }

    commission.status = 'abandoned';
    this.game.saveProgress();
    this.game.taskSystem.showHint('已放弃委托');
    this.renderAll();
    return { success: true, message: '委托已放弃' };
  }

  checkCollectionUpdate(creature) {
    if (!creature) return;

    this.commissions.forEach(commission => {
      if (commission.status !== 'in_progress') return;
      const phase = commission.phases[commission.currentPhase];
      if (!phase || phase.status !== 'active') return;
      if (!phase.requireNew) return;
      if (phase.targetCreatureId && creature.id !== phase.targetCreatureId) return;
      if (phase.targetCategory) {
        const category = Object.values(CREATURE_CATEGORIES).find(c => c.name === phase.targetCategory);
        if (category && !category.creatureIds.includes(creature.id)) return;
      }
    });
  }

  renderActiveCommissions() {
    const el = document.getElementById('port-active-commissions');
    if (!el) return;

    const active = this.commissions.filter(c => c.status === 'in_progress');

    if (active.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px;color:#666;">
          <p style="font-size:48px;margin-bottom:16px;">📋</p>
          <p>暂无进行中的委托</p>
          <p style="font-size:12px;margin-top:8px;">切换到「可接委托」标签接受新委托</p>
        </div>
      `;
      return;
    }

    el.innerHTML = active.map(c => this.renderCommissionCard(c, 'active')).join('');

    el.querySelectorAll('[data-port-abandon]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.abandonCommission(btn.dataset.portAbandon);
      });
    });
  }

  renderAvailableCommissions() {
    const el = document.getElementById('port-available-commissions');
    if (!el) return;

    const available = this.commissions.filter(c => c.status === 'available');

    if (available.length === 0) {
      this.generateNewCommission();
      return;
    }

    el.innerHTML = available.map(c => this.renderCommissionCard(c, 'available')).join('');

    el.querySelectorAll('[data-port-accept]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.acceptCommission(btn.dataset.portAccept);
      });
    });

    el.querySelectorAll('[data-port-refresh]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.refreshCommissions();
      });
    });
  }

  refreshCommissions() {
    this.commissions = this.commissions.filter(c => c.status !== 'available');
    for (let i = 0; i < this.maxActiveCommissions; i++) {
      this.generateNewCommission();
    }
    this.game.taskSystem.showHint('🔄 已刷新可接委托');
    this.renderAll();
  }

  renderCommissionCard(commission, type) {
    const isActive = type === 'active';
    const currentPhase = commission.phases[commission.currentPhase];
    const phaseCount = commission.phases.length;

    const phasesHtml = commission.phases.map((p, i) => {
      let statusClass = '';
      let statusText = '';
      if (p.status === 'completed') {
        statusClass = 'phase-completed';
        statusText = '✓';
      } else if (p.status === 'active') {
        statusClass = 'phase-active';
        statusText = '进行中';
      } else {
        statusClass = 'phase-locked';
        statusText = '🔒';
      }

      const progressPercent = p.requiredQuantity > 0
        ? (p.currentQuantity / p.requiredQuantity) * 100
        : 0;

      const creature = CREATURES.find(c => c.id === p.targetCreatureId);

      return `
        <div class="port-phase ${statusClass}">
          <div class="port-phase-header">
            <span class="port-phase-index">阶段 ${i + 1}</span>
            <span class="port-phase-status">${statusText}</span>
          </div>
          <div class="port-phase-target">
            ${p.targetCreatureIcon ? `<span class="port-phase-icon">${p.targetCreatureIcon}</span>` : ''}
            <span class="port-phase-name">${p.targetCreatureName || p.targetRarity || '指定目标'}</span>
            <span class="port-phase-quantity">${p.currentQuantity}/${p.requiredQuantity}</span>
          </div>
          ${p.status === 'active' ? `
            <div class="port-phase-progress">
              <div class="port-phase-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
          ` : ''}
          <div class="port-phase-reward">
            ${p.coinReward ? `<span>💰${p.coinReward}</span>` : ''}
            ${p.energyReward ? `<span>⚡${p.energyReward}</span>` : ''}
            ${p.requireNew ? '<span class="port-require-new">图鉴新</span>' : ''}
          </div>
        </div>
      `;
    }).join('');

    let actionHtml = '';
    if (isActive) {
      actionHtml = `<button class="modal-btn danger full-width" data-port-abandon="${commission.id}">放弃委托</button>`;
    } else {
      actionHtml = `<button class="modal-btn primary full-width" data-port-accept="${commission.id}">接受委托</button>`;
    }

    return `
      <div class="port-commission-card ${commission.rarityClass}">
        <div class="port-commission-header">
          <div class="port-commission-title">
            <span class="port-commission-rarity">${commission.rarity}</span>
            <span class="port-commission-name">${commission.templateName}</span>
          </div>
          <div class="port-commission-meta">
            ${commission.categoryIcon ? `<span>${commission.categoryIcon}</span>` : ''}
            <span>阶段 ${commission.currentPhase + 1}/${phaseCount}</span>
          </div>
        </div>
        <div class="port-commission-desc">${commission.templateDesc}</div>
        <div class="port-commission-target">
          目标：${commission.targetText}
        </div>
        <div class="port-phases-list">
          ${phasesHtml}
        </div>
        <div class="port-commission-total-reward">
          <span>总奖励：💰${commission.totalCoinReward}</span>
          ${commission.totalEnergyReward > 0 ? `<span>⚡${commission.totalEnergyReward}</span>` : ''}
        </div>
        <div class="port-commission-action">
          ${actionHtml}
        </div>
      </div>
    `;
  }

  renderHistory() {
    const el = document.getElementById('port-commission-history');
    if (!el) return;

    if (this.completedHistory.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px;color:#666;">
          <p style="font-size:48px;margin-bottom:16px;">📜</p>
          <p>暂无完成记录</p>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="port-history-list">
        ${this.completedHistory.map(h => `
          <div class="port-history-item">
            <span class="port-history-name">${h.templateName}</span>
            <span class="port-history-rarity">${h.rarity}</span>
            <span class="port-history-reward">💰${h.totalCoinReward}</span>
            <span class="port-history-time">${this.formatTime(h.completedAt)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hour}:${min}`;
  }

  findMatchingCommissionsForItem(item) {
    return this.commissions.filter(c => {
      if (c.status !== 'in_progress') return false;
      const phase = c.phases[c.currentPhase];
      return this.checkItemMatchesPhase(item, phase);
    });
  }

  toJSON() {
    return {
      commissions: this.commissions,
      completedHistory: this.completedHistory,
      stats: this.stats,
      refreshCooldown: this.refreshCooldown
    };
  }

  loadData(data) {
    if (!data) return;
    if (data.commissions) this.commissions = data.commissions;
    if (data.completedHistory) this.completedHistory = data.completedHistory;
    if (data.stats) this.stats = { ...this.stats, ...data.stats };
    if (typeof data.refreshCooldown === 'number') this.refreshCooldown = data.refreshCooldown;
  }
}
