import { Storage } from './Storage.js';
import {
  GUILD_WEEK_MS,
  GUILD_GOAL_TYPES,
  getGuildGoalById,
  getGuildCommissionById,
  getGuildEventById,
  getTeammateById,
  getRandomTeammatesForGuild,
  getActivityMultiplier,
  pickWeeklyGuildGoals,
  getWeekNumber,
  GUILD_COLLABORATION_EVENTS,
  GUILD_EXCLUSIVE_COMMISSIONS
} from '../data/guildSystem.js';

export class GuildSystem {
  constructor(game) {
    this.game = game;

    this.guildInfo = {
      id: null,
      name: '赛博渔港公会',
      level: 1,
      exp: 0,
      totalExp: 0,
      foundedAt: null,
      weekNumber: 0,
      weekStartedAt: 0
    };

    this.teammates = [];
    this.activeGoals = [];
    this.goalsProgress = {};
    this.claimedGoalPhases = {};

    this.activeCommissions = [];
    this.commissionsProgress = {};
    this.claimedCommissionPhases = {};

    this.activeEvent = null;
    this.eventEndAt = 0;
    this.eventTimer = null;

    this.playerContribution = {};
    this.teammateContribution = {};

    this.teammateTickTimer = null;
    this.lastTeammateTick = 0;

    this.modal = null;
    this.tabContents = null;
    this.currentTab = 'overview';

    this.initElements();
    this.bindStaticEvents();
    this.checkWeeklyRefresh();
    this.startTeammateTick();
  }

  initElements() {
    this.modal = document.getElementById('guild-modal');
    this.tabBtns = document.querySelectorAll('.guild-tab');
    this.tabContents = document.querySelectorAll('.guild-tab-content');
  }

  bindStaticEvents() {
    const btn = document.getElementById('btn-guild');
    if (btn) {
      btn.addEventListener('click', () => this.open());
    }
    const closeBtn = document.getElementById('btn-close-guild');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  bindDynamicEvents() {
    this.tabBtns = document.querySelectorAll('.guild-tab');
    this.tabContents = document.querySelectorAll('.guild-tab-content');

    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          this.switchTab(tab);
        });
      });
    }

    this.bindGoalClaimEvents();
    this.bindCommissionEvents();
  }

  bindGoalClaimEvents() {
    const claimBtns = document.querySelectorAll('[data-guild-goal-claim]');
    claimBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const goalId = btn.dataset.guildGoalClaim;
        const phase = parseInt(btn.dataset.guildGoalPhase);
        this.claimGoalPhaseReward(goalId, phase);
      });
    });
  }

  bindCommissionEvents() {
    const acceptBtns = document.querySelectorAll('[data-guild-commission-accept]');
    acceptBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const commId = btn.dataset.guildCommissionAccept;
        this.acceptCommission(commId);
      });
    });

    const contributeBtns = document.querySelectorAll('[data-guild-commission-contribute]');
    contributeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const commId = btn.dataset.guildCommissionContribute;
        this.contributeToCommission(commId);
      });
    });

    const claimBtns = document.querySelectorAll('[data-guild-commission-claim]');
    claimBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const commId = btn.dataset.guildCommissionClaim;
        const phase = parseInt(btn.dataset.guildCommissionPhase);
        this.claimCommissionPhaseReward(commId, phase);
      });
    });
  }

  checkWeeklyRefresh() {
    const now = Date.now();
    const weekNumber = getWeekNumber(now);

    if (!this.guildInfo.id) {
      this.initGuild(now, weekNumber);
      return;
    }

    if (this.guildInfo.weekNumber !== weekNumber) {
      this.settleWeek(false);
      this.startNewWeek(now, weekNumber);
    } else if (now - this.guildInfo.weekStartedAt >= GUILD_WEEK_MS) {
      this.settleWeek(false);
      this.startNewWeek(now, weekNumber);
    }
  }

  initGuild(timestamp, weekNumber) {
    this.guildInfo = {
      id: `guild_${timestamp}_${Math.floor(Math.random() * 10000)}`,
      name: '赛博渔港公会',
      level: 1,
      exp: 0,
      totalExp: 0,
      foundedAt: timestamp,
      weekStartedAt: timestamp,
      weekNumber: weekNumber
    };

    this.teammates = getRandomTeammatesForGuild(1);
    this.teammates.forEach(t => {
      this.teammateContribution[t.id] = { totalContribution: 0, lastActive: timestamp };
    });

    this.startNewWeek(timestamp, weekNumber);

    this.activeEvent = null;
    this.playerContribution = {};

    this.game.saveProgress();
  }

  startNewWeek(timestamp, weekNumber) {
    this.guildInfo.weekNumber = weekNumber;
    this.guildInfo.weekStartedAt = timestamp;

    const weeklyGoals = pickWeeklyGuildGoals(3);
    this.activeGoals = weeklyGoals.map(g => g.id);
    this.goalsProgress = {};
    this.claimedGoalPhases = {};

    weeklyGoals.forEach(g => {
      this.goalsProgress[g.id] = {
        currentValue: 0,
        playerValue: 0,
        lastUpdated: timestamp
      };
      this.claimedGoalPhases[g.id] = new Set();
    });

    this.activeCommissions = GUILD_EXCLUSIVE_COMMISSIONS
      .filter(c => c.unlockLevel <= this.guildInfo.level)
      .map(c => ({
        ...c,
        startedAt: timestamp,
        endsAt: timestamp + c.durationMs,
        progress: 0,
        playerContribution: 0,
        claimedPhases: new Set()
      }));

    this.teammates.forEach(t => {
      if (!this.teammateContribution[t.id]) {
        this.teammateContribution[t.id] = { totalContribution: 0, lastActive: timestamp };
      }
    });

    this.activeEvent = null;
    this.eventEndAt = 0;

    if (this.game.taskSystem) {
      this.game.taskSystem.showHint(`🏰 新的公会周开始！本周 ${weeklyGoals.length} 个共享目标等待完成！`);
    }

    this.game.saveProgress();
  }

  settleWeek(showNotification = true) {
    let completedGoals = 0;
    let totalPhaseRewards = { coins: 0, energy: 0 };
    let completedCommissions = 0;

    this.activeGoals.forEach(goalId => {
      const goal = getGuildGoalById(goalId);
      if (!goal) return;

      const progress = this.goalsProgress[goalId] || { currentValue: 0 };

      goal.phases.forEach(phase => {
        if (progress.currentValue >= phase.threshold && !this.claimedGoalPhases[goalId]?.has(phase.phase)) {
          if (!this.claimedGoalPhases[goalId]) this.claimedGoalPhases[goalId] = new Set();
          this.claimedGoalPhases[goalId].add(phase.phase);
          totalPhaseRewards.coins += phase.reward.coins || 0;
          totalPhaseRewards.energy += phase.reward.energy || 0;
          if (phase.reward.coins) this.game.updateStats('coins', phase.reward.coins);
          if (phase.reward.energy) this.game.updateStats('energy', phase.reward.energy);
        }
      });

      if (progress.currentValue >= goal.targetValue) {
        completedGoals++;
      }
    });

    this.activeCommissions.forEach(comm => {
      if (comm.progress >= comm.requiredContribution) {
        completedCommissions++;
      }
    });

    const expGained = completedGoals * 100 + completedCommissions * 150;
    this.addGuildExp(expGained);

    const settlement = {
      id: `guild_settle_${Date.now()}`,
      weekNumber: this.guildInfo.weekNumber,
      level: this.guildInfo.level,
      completedGoals,
      commissionsCompleted: completedCommissions,
      coinsEarned: totalPhaseRewards.coins,
      energyEarned: totalPhaseRewards.energy,
      endedAt: Date.now()
    };
    Storage.saveGuildSettlement(settlement.id, settlement);

    if (showNotification && this.game.taskSystem) {
      this.game.taskSystem.showHint(
        `🏰 公会周结算：完成 ${completedGoals}/${this.activeGoals.length} 目标 · 💰${totalPhaseRewards.coins} ⚡${totalPhaseRewards.energy} · 经验 +${expGained}`
      );
    }

    this.game.saveProgress();
  }

  addGuildExp(amount) {
    this.guildInfo.exp += amount;
    this.guildInfo.totalExp += amount;

    let expNeeded = this.getExpForLevel(this.guildInfo.level);
    while (this.guildInfo.exp >= expNeeded) {
      this.guildInfo.exp -= expNeeded;
      this.guildInfo.level++;

      if (this.game.taskSystem) {
        this.game.taskSystem.showHint(`🎉 公会升级！当前等级：Lv.${this.guildInfo.level}`);
      }
      if (this.teammates.length < 5) {
        const newTeammates = getRandomTeammatesForGuild(this.guildInfo.level);
        newTeammates.forEach(t => {
          if (!this.teammates.find(tm => tm.id === t.id)) {
            this.teammates.push(t);
            this.teammateContribution[t.id] = { totalContribution: 0, lastActive: Date.now() };
          }
        });
      }
      expNeeded = this.getExpForLevel(this.guildInfo.level);
    }
  }

  getExpForLevel(level) {
    return 500 + (level - 1) * 300;
  }

  startTeammateTick() {
    if (this.teammateTickTimer) return;

    this.teammateTickTimer = setInterval(() => {
      this.simulateTeammateProgress();
    }, 10000);
  }

  simulateTeammateProgress() {
    const now = Date.now();
    const teammateBoost = this.activeEvent?.type === 'teammate_boost'
      ? (this.activeEvent.effect.teammateContribBoost || 1)
      : 1;

    this.teammates.forEach(teammate => {
      const activityMult = getActivityMultiplier(teammate.activityLevel);
      const shouldAct = Math.random() < (0.3 * activityMult);
      if (!shouldAct) return;

      let goalContribution = Math.ceil(teammate.baseEfficiency * activityMult * teammateBoost);

      this.activeGoals.forEach(goalId => {
        const goal = getGuildGoalById(goalId);
        if (!goal) return;

        const progress = this.goalsProgress[goalId];
        if (!progress) return;

        let value = goalContribution;
        if (teammate.specialty === goal.type) {
          value = Math.ceil(value * 1.5);
        }

        progress.currentValue += value;
        if (progress.currentValue > goal.targetValue) {
          progress.currentValue = goal.targetValue;
        }
        progress.lastUpdated = now;
      });

      this.activeCommissions.forEach(comm => {
        if (now > comm.endsAt) return;
        const value = Math.ceil(goalContribution * 0.5);
        comm.progress += value;
        if (comm.progress > comm.requiredContribution) {
          comm.progress = comm.requiredContribution;
        }
      });

      if (!this.teammateContribution[teammate.id]) {
        this.teammateContribution[teammate.id] = { totalContribution: 0, lastActive: now };
      }
      this.teammateContribution[teammate.id].totalContribution += goalContribution;
      this.teammateContribution[teammate.id].lastActive = now;
    });

    this.tryTriggerRandomEvent();

    this.game.saveProgress();

    if (this.modal && !this.modal.classList.contains('hidden')) {
      this.renderAll();
    }
  }

  tryTriggerRandomEvent() {
    if (this.activeEvent && Date.now() < this.eventEndAt) return;

    if (Math.random() < 0.05) {
      const randomEvent = GUILD_COLLABORATION_EVENTS.find(e => e.trigger.type === 'random');
      if (randomEvent && Math.random() < (randomEvent.trigger.chance || 0.1)) {
        this.triggerCollaborationEvent(randomEvent);
      }
    }

    this.activeGoals.forEach(goalId => {
      const progress = this.goalsProgress[goalId];
      if (!progress) return;

      GUILD_COLLABORATION_EVENTS.forEach(event => {
        if (event.trigger.type === 'random') return;
        if (event.trigger.type !== goalId) return;
        if (progress.currentValue >= event.trigger.threshold) {
          this.triggerCollaborationEvent(event);
        }
      });
    });
  }

  triggerCollaborationEvent(event) {
    if (this.activeEvent && Date.now() < this.eventEndAt) return;

    this.activeEvent = event;
    this.eventEndAt = Date.now() + event.durationMs;

    if (this.game.taskSystem) {
      this.game.taskSystem.showHint(`${event.icon} ${event.name}！${event.desc}`);
    }

    if (this.eventTimer) clearTimeout(this.eventTimer);
    this.eventTimer = setTimeout(() => {
      this.activeEvent = null;
      this.eventEndAt = 0;
      this.game.saveProgress();
      if (this.modal && !this.modal.classList.contains('hidden')) {
        this.renderAll();
      }
    }, event.durationMs);

    this.game.saveProgress();
  }

  recordPlayerAction(actionType, value = 1) {
    const now = Date.now();

    this.activeGoals.forEach(goalId => {
      const goal = getGuildGoalById(goalId);
      if (!goal) return;
      if (goal.type !== actionType) return;

      const progress = this.goalsProgress[goalId];
      if (!progress) return;

      progress.currentValue += value;
      progress.playerValue += value;
      if (progress.currentValue > goal.targetValue) {
        progress.currentValue = goal.targetValue;
      }
      progress.lastUpdated = now;

      if (!this.playerContribution[goalId]) {
        this.playerContribution[goalId] = 0;
      }
      this.playerContribution[goalId] += value;

      goal.phases.forEach(phase => {
        if (progress.currentValue >= phase.threshold && !this.claimedGoalPhases[goalId]?.has(phase.phase) && this.game.taskSystem) {
          this.game.taskSystem.showHint(`🎯 公会目标阶段达成：${goal.name} 阶段 ${phase.phase}！`);
        }
      });
    });

    this.game.saveProgress();
  }

  acceptCommission(commissionId) {
    const commissionDef = getGuildCommissionById(commissionId);
    if (!commissionDef) return false;

    const existing = this.activeCommissions.find(c => c.id === commissionId);
    if (existing) return false;

    if (commissionDef.unlockLevel > this.guildInfo.level) return false;

    const now = Date.now();
    this.activeCommissions.push({
      ...commissionDef,
      startedAt: now,
      endsAt: now + commissionDef.durationMs,
      progress: 0,
      playerContribution: 0,
      claimedPhases: new Set()
    });

    if (this.game.taskSystem) {
      this.game.taskSystem.showHint(`📋 已接受专属委托：${commissionDef.name}`);
    }

    this.game.saveProgress();
    this.renderAll();
    return true;
  }

  contributeToCommission(commissionId, amount = 1) {
    const comm = this.activeCommissions.find(c => c.id === commissionId);
    if (!comm) return false;

    const now = Date.now();
    if (now > comm.endsAt) return false;

    comm.progress += amount;
    comm.playerContribution += amount;
    if (comm.progress > comm.requiredContribution) {
      comm.progress = comm.requiredContribution;
    }

    comm.phases.forEach(phase => {
      if (comm.progress >= phase.threshold && !comm.claimedPhases.has(phase.phase) && this.game.taskSystem) {
        this.game.taskSystem.showHint(`📋 委托阶段达成：${comm.name} 阶段 ${phase.phase}！`);
      }
    });

    this.game.saveProgress();
    this.renderAll();
    return true;
  }

  claimGoalPhaseReward(goalId, phase) {
    const goal = getGuildGoalById(goalId);
    if (!goal) return false;

    const progress = this.goalsProgress[goalId];
    if (!progress) return false;

    if (!this.claimedGoalPhases[goalId]) {
      this.claimedGoalPhases[goalId] = new Set();
    }
    if (this.claimedGoalPhases[goalId].has(phase)) return false;

    const phaseData = goal.phases.find(p => p.phase === phase);
    if (!phaseData) return false;

    if (progress.currentValue < phaseData.threshold) return false;

    this.claimedGoalPhases[goalId].add(phase);

    if (phaseData.reward.coins) {
      this.game.updateStats('coins', phaseData.reward.coins);
    }
    if (phaseData.reward.energy) {
      this.game.updateStats('energy', phaseData.reward.energy);
    }

    if (this.game.taskSystem) {
      this.game.taskSystem.showHint(
        `🎁 领取公会奖励：${goal.name} 阶段${phase} · 💰${phaseData.reward.coins || 0} ⚡${phaseData.reward.energy || 0}`
      );
    }

    this.game.saveProgress();
    this.renderAll();
    return true;
  }

  claimCommissionPhaseReward(commissionId, phase) {
    const comm = this.activeCommissions.find(c => c.id === commissionId);
    if (!comm) return false;

    if (comm.claimedPhases.has(phase)) return false;

    const phaseData = comm.phases.find(p => p.phase === phase);
    if (!phaseData) return false;

    if (comm.progress < phaseData.threshold) return false;

    comm.claimedPhases.add(phase);

    if (phaseData.reward.coins) {
      this.game.updateStats('coins', phaseData.reward.coins);
    }
    if (phaseData.reward.energy) {
      this.game.updateStats('energy', phaseData.reward.energy);
    }

    if (this.game.taskSystem) {
      this.game.taskSystem.showHint(
        `🎁 领取委托奖励：${comm.name} 阶段${phase} · 💰${phaseData.reward.coins || 0} ⚡${phaseData.reward.energy || 0}`
      );
    }

    this.game.saveProgress();
    this.renderAll();
    return true;
  }

  getEventEffects() {
    if (this.activeEvent && Date.now() < this.eventEndAt) {
      return this.activeEvent.effect || {};
    }
    return {};
  }

  getValueMultiplier() {
    const effects = this.getEventEffects();
    return effects.valueMultiplier || 1;
  }

  getEnergyDiscount() {
    const effects = this.getEventEffects();
    return effects.energyDiscount || 0;
  }

  getRarityBoost() {
    const effects = this.getEventEffects();
    return effects.rarityBoost || 0;
  }

  open() {
    if (!this.modal) return;
    this.checkWeeklyRefresh();
    this.modal.classList.remove('hidden');
    this.renderAll();
    this.bindDynamicEvents();
  }

  close() {
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
    this.renderOverview();
    this.renderGoals();
    this.renderCommissions();
    this.renderTeammates();
    this.renderEvents();
    this.renderHistory();
    this.renderEventIndicator();
  }

  renderEventIndicator() {
    const el = document.getElementById('guild-event-indicator');
    if (!el) return;

    if (this.activeEvent && Date.now() < this.eventEndAt) {
      const remaining = Math.max(0, this.eventEndAt - Date.now());
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      el.classList.remove('hidden');
      el.innerHTML = `
        <span class="guild-event-icon">${this.activeEvent.icon}</span>
        <span class="guild-event-name">${this.activeEvent.name}</span>
        <span class="guild-event-timer">${minutes}:${seconds.toString().padStart(2, '0')}</span>
      `;
    } else {
      el.classList.add('hidden');
    }
  }

  renderOverview() {
    const el = document.getElementById('guild-overview');
    if (!el) return;

    const weekRemaining = Math.max(0, this.guildInfo.weekStartedAt + GUILD_WEEK_MS - Date.now());
    const days = Math.floor(weekRemaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((weekRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((weekRemaining % (60 * 60 * 1000)) / (60 * 1000));

    const expNeeded = this.getExpForLevel(this.guildInfo.level);
    const expPercent = Math.min(100, (this.guildInfo.exp / expNeeded) * 100);

    let totalGoalsProgress = 0;
    this.activeGoals.forEach(goalId => {
      const goal = getGuildGoalById(goalId);
      const progress = this.goalsProgress[goalId];
      if (goal && progress) {
        totalGoalsProgress += Math.min(1, progress.currentValue / goal.targetValue);
      }
    });
    const avgGoalPercent = this.activeGoals.length > 0 ? (totalGoalsProgress / this.activeGoals.length) * 100 : 0;

    el.innerHTML = `
      <div class="guild-header">
        <div class="guild-info">
          <div class="guild-name">${this.guildInfo.name}</div>
          <div class="guild-level">Lv.${this.guildInfo.level} · 经验 ${this.guildInfo.exp}/${expNeeded}</div>
          <div class="guild-exp-bar">
            <div class="guild-exp-fill" style="width: ${expPercent}%;"></div>
          </div>
        </div>
        <div class="guild-week-info">
          <div class="guild-week-title">第${this.guildInfo.weekNumber}周</div>
          <div class="guild-week-timer">剩余 ${days}天${hours}时${minutes}分</div>
        </div>
      </div>

      <div class="guild-stats-grid">
        <div class="guild-stat-card">
          <div class="guild-stat-icon">🎯</div>
          <div class="guild-stat-value">${this.activeGoals.length}</div>
          <div class="guild-stat-label">共享目标</div>
        </div>
        <div class="guild-stat-card">
          <div class="guild-stat-icon">📊</div>
          <div class="guild-stat-value">${Math.round(avgGoalPercent)}%</div>
          <div class="guild-stat-label">平均进度</div>
        </div>
        <div class="guild-stat-card">
          <div class="guild-stat-icon">👥</div>
          <div class="guild-stat-value">${this.teammates.length}</div>
          <div class="guild-stat-label">公会成员</div>
        </div>
        <div class="guild-stat-card">
          <div class="guild-stat-icon">📋</div>
          <div class="guild-stat-value">${this.activeCommissions.length}</div>
          <div class="guild-stat-label">进行中委托</div>
        </div>
      </div>

      ${this.activeEvent && Date.now() < this.eventEndAt
        ? `<div class="guild-active-event">
            <div class="guild-event-banner">
              <span class="guild-event-icon-large">${this.activeEvent.icon}</span>
              <div>
                <div class="guild-event-name-large">${this.activeEvent.name}</div>
                <div class="guild-event-desc">${this.activeEvent.desc}</div>
              </div>
            </div>
          </div>`
        : ''}
    `;
  }

  renderGoals() {
    const el = document.getElementById('guild-goals');
    if (!el) return;

    if (this.activeGoals.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px;color:#666;">
          <p style="font-size:48px;margin-bottom:16px;">🎯</p>
          <p>暂无共享目标</p>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <p class="guild-hint">与公会成员共同完成目标，达成阶段领取奖励</p>
      <div class="guild-goal-list">
        ${this.activeGoals.map(goalId => {
          const goal = getGuildGoalById(goalId);
          if (!goal) return '';
          const progress = this.goalsProgress[goalId] || { currentValue: 0, playerValue: 0 };
          const playerContrib = this.playerContribution[goalId] || 0;
          const goalPercent = Math.min(100, (progress.currentValue / goal.targetValue) * 100);

          return `
            <div class="guild-goal-card">
              <div class="guild-goal-header">
                <span class="guild-goal-icon">${goal.icon}</span>
                <div class="guild-goal-info">
                  <div class="guild-goal-name">${goal.name}</div>
                  <div class="guild-goal-desc">${goal.desc}</div>
                </div>
              </div>
              <div class="guild-goal-progress">
                <div class="guild-goal-progress-bar">
                  <div class="guild-goal-progress-fill" style="width: ${goalPercent}%;"></div>
                </div>
                <div class="guild-goal-progress-text">
                  ${progress.currentValue} / ${goal.targetValue}
                </div>
              </div>
              <div class="guild-goal-contrib">
                <span class="guild-goal-player">你的贡献: ${playerContrib}</span>
                <span class="guild-goal-teammate">队友贡献: ${Math.max(0, progress.currentValue - playerContrib)}</span>
              </div>
              <div class="guild-goal-phases">
                ${goal.phases.map(phase => {
                  const achieved = progress.currentValue >= phase.threshold;
                  const claimed = this.claimedGoalPhases[goalId]?.has(phase.phase);
                  let statusClass = 'locked';
                  let statusText = '未达成';
                  let btn = '';

                  if (claimed) {
                    statusClass = 'claimed';
                    statusText = '已领取 ✓';
                  } else if (achieved) {
                    statusClass = 'available';
                    statusText = '可领取';
                    btn = `<button class="modal-btn primary" data-guild-goal-claim="${goalId}" data-guild-goal-phase="${phase.phase}">🎁 领取</button>`;
                  }

                  return `
                    <div class="guild-phase-card ${statusClass}">
                      <div class="guild-phase-info">
                        <div class="guild-phase-name">阶段 ${phase.phase}</div>
                        <div class="guild-phase-threshold">${phase.threshold}</div>
                        <div class="guild-phase-reward">
                          ${phase.reward.coins ? `<span>💰${phase.reward.coins}</span>` : ''}
                          ${phase.reward.energy ? `<span>⚡${phase.reward.energy}</span>` : ''}
                        </div>
                      </div>
                      <div class="guild-phase-status">${statusText}</div>
                      ${btn}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindGoalClaimEvents();
  }

  renderCommissions() {
    const el = document.getElementById('guild-commissions');
    if (!el) return;

    const now = Date.now();
    const available = GUILD_EXCLUSIVE_COMMISSIONS.filter(c => {
      const alreadyActive = this.activeCommissions.find(ac => ac.id === c.id);
      return !alreadyActive && c.unlockLevel <= this.guildInfo.level;
    });

    el.innerHTML = `
      <p class="guild-hint">专属委托需要全公会协力完成，有时间限制</p>

      <div class="guild-commission-section">
        <div class="guild-section-title">📋 进行中</div>
        ${this.activeCommissions.length === 0
          ? `<div style="text-align:center;padding:20px;color:#666;font-size:12px;">暂无进行中的委托</div>`
          : `<div class="guild-commission-list">
            ${this.activeCommissions.map(comm => {
              const remaining = Math.max(0, comm.endsAt - now);
              const hours = Math.floor(remaining / (60 * 60 * 1000));
              const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
              const expired = remaining <= 0;
              const commPercent = Math.min(100, (comm.progress / comm.requiredContribution) * 100);

              return `
                <div class="guild-commission-card ${expired ? 'expired' : ''}">
                  <div class="guild-commission-header">
                    <span class="guild-commission-icon">${comm.icon}</span>
                    <div class="guild-commission-info">
                      <div class="guild-commission-name">${comm.name}</div>
                      <div class="guild-commission-desc">${comm.desc}</div>
                      <div class="guild-commission-timer">${expired ? '已结束' : `剩余 ${hours}时${minutes}分`}</div>
                    </div>
                  </div>
                  <div class="guild-commission-progress">
                    <div class="guild-commission-progress-bar">
                      <div class="guild-commission-progress-fill" style="width: ${commPercent}%;"></div>
                    </div>
                    <div class="guild-commission-progress-text">
                      ${comm.progress} / ${comm.requiredContribution}
                    </div>
                  </div>
                  <div class="guild-commission-contrib">
                    <span>你的贡献: ${comm.playerContribution}</span>
                    <span>队友贡献: ${Math.max(0, comm.progress - comm.playerContribution)}</span>
                  </div>
                  <div class="guild-commission-actions">
                    <button class="modal-btn accent" data-guild-commission-contribute="${comm.id}" ${expired ? 'disabled' : ''}>➕ 贡献 (+1)</button>
                  </div>
                  <div class="guild-commission-phases">
                    ${comm.phases.map(phase => {
                      const achieved = comm.progress >= phase.threshold;
                      const claimed = comm.claimedPhases.has(phase.phase);
                      let statusClass = 'locked';
                      let statusText = '未达成';
                      let btn = '';

                      if (claimed) {
                        statusClass = 'claimed';
                        statusText = '已领取 ✓';
                      } else if (achieved) {
                        statusClass = 'available';
                        statusText = '可领取';
                        btn = `<button class="modal-btn primary" data-guild-commission-claim="${comm.id}" data-guild-commission-phase="${phase.phase}">🎁 领取</button>`;
                      }

                      return `
                        <div class="guild-phase-card ${statusClass}">
                          <div class="guild-phase-info">
                            <div class="guild-phase-name">阶段 ${phase.phase}</div>
                            <div class="guild-phase-threshold">${phase.threshold}</div>
                            <div class="guild-phase-reward">
                              ${phase.reward.coins ? `<span>💰${phase.reward.coins}</span>` : ''}
                              ${phase.reward.energy ? `<span>⚡${phase.reward.energy}</span>` : ''}
                            </div>
                          </div>
                          <div class="guild-phase-status">${statusText}</div>
                          ${btn}
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>`
        }
      </div>

      <div class="guild-commission-section">
        <div class="guild-section-title">📌 可接委托</div>
        ${available.length === 0
          ? `<div style="text-align:center;padding:20px;color:#666;font-size:12px;">暂无可接委托（提升公会等级解锁更多）</div>`
          : `<div class="guild-commission-list">
            ${available.map(comm => `
              <div class="guild-commission-card available">
                <div class="guild-commission-header">
                  <span class="guild-commission-icon">${comm.icon}</span>
                  <div class="guild-commission-info">
                    <div class="guild-commission-name">${comm.name}</div>
                    <div class="guild-commission-desc">${comm.desc}</div>
                    <div class="guild-commission-duration">时长: ${Math.floor(comm.durationMs / (24 * 60 * 60 * 1000))}天</div>
                  </div>
                </div>
                <div class="guild-commission-actions">
                  <button class="modal-btn primary" data-guild-commission-accept="${comm.id}">📋 接受委托</button>
                </div>
              </div>
            `).join('')}
          </div>`
        }
      </div>
    `;

    this.bindCommissionEvents();
  }

  renderTeammates() {
    const el = document.getElementById('guild-teammates');
    if (!el) return;

    el.innerHTML = `
      <p class="guild-hint">队友会自动协助推进公会目标（模拟AI队友）</p>
      <div class="guild-teammate-list">
        ${this.teammates.map(teammate => {
          const contrib = this.teammateContribution[teammate.id] || { totalContribution: 0, lastActive: 0 };
          const activityColor = teammate.activityLevel === 'high' ? '#4caf50' : teammate.activityLevel === 'medium' ? '#ff9800' : '#9e9e9e';

          return `
            <div class="guild-teammate-card">
              <div class="guild-teammate-header">
                <span class="guild-teammate-icon">${teammate.icon}</span>
                <div class="guild-teammate-info">
                  <div class="guild-teammate-name">${teammate.name}</div>
                  <div class="guild-teammate-role">${teammate.role}</div>
                </div>
                <div class="guild-teammate-activity" style="color: ${activityColor};">
                  ● ${teammate.activityLevel === 'high' ? '活跃' : teammate.activityLevel === 'medium' ? '普通' : '休闲'}
                </div>
              </div>
              <div class="guild-teammate-quote">"${teammate.quote}"</div>
              <div class="guild-teammate-stats">
                <div class="guild-teammate-efficiency">
                  <span>效率: ${Math.round(teammate.baseEfficiency * 100)}%</span>
                  <span>专长: ${this.getGoalTypeName(teammate.specialty)}</span>
                </div>
                <div class="guild-teammate-contrib">累计贡献: ${contrib.totalContribution}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  getGoalTypeName(type) {
    const names = {
      [GUILD_GOAL_TYPES.CATCH_COUNT]: '打捞',
      [GUILD_GOAL_TYPES.COINS_EARNED]: '金币',
      [GUILD_GOAL_TYPES.PORT_COMMISSIONS]: '港口委托',
      [GUILD_GOAL_TYPES.RARE_CREATURES]: '稀有生物',
      [GUILD_GOAL_TYPES.EXPEDITION_COMPLETE]: '远征',
      [GUILD_GOAL_TYPES.RUINS_DIVE]: '废墟潜航',
      [GUILD_GOAL_TYPES.REINFORCE_SUCCESS]: '强化成功'
    };
    return names[type] || '通用';
  }

  renderEvents() {
    const el = document.getElementById('guild-events');
    if (!el) return;

    const now = Date.now();
    const activeRemaining = this.activeEvent && now < this.eventEndAt
      ? this.eventEndAt - now
      : 0;

    el.innerHTML = `
      <p class="guild-hint">完成目标或随机触发协作事件，获得临时加成</p>

      ${this.activeEvent && now < this.eventEndAt
        ? `<div class="guild-event-active">
            <div class="guild-event-active-card">
              <div class="guild-event-active-header">
                <span class="guild-event-icon-large">${this.activeEvent.icon}</span>
                <div>
                  <div class="guild-event-name-large">${this.activeEvent.name}</div>
                  <div class="guild-event-desc">${this.activeEvent.desc}</div>
                  <div class="guild-event-remaining">
                    剩余: ${Math.floor(activeRemaining / 60000)}分${Math.floor((activeRemaining % 60000) / 1000)}秒
                  </div>
                </div>
              </div>
              <div class="guild-event-effects">
                ${this.activeEvent.effect.valueMultiplier ? `<div class="guild-event-effect">打捞价值 ×${this.activeEvent.effect.valueMultiplier}</div>` : ''}
                ${this.activeEvent.effect.energyDiscount ? `<div class="guild-event-effect">能量消耗 -${Math.round(this.activeEvent.effect.energyDiscount * 100)}%</div>` : ''}
                ${this.activeEvent.effect.rarityBoost ? `<div class="guild-event-effect">稀有率 +${Math.round(this.activeEvent.effect.rarityBoost * 100)}%</div>` : ''}
                ${this.activeEvent.effect.teammateContribBoost ? `<div class="guild-event-effect">队友贡献 ×${this.activeEvent.effect.teammateContribBoost}</div>` : ''}
              </div>
            </div>
          </div>`
        : `<div class="guild-event-none">
            <div style="text-align:center;padding:20px;color:#666;">
              <p style="font-size:32px;margin-bottom:8px;">⏳</p>
              <p>暂无进行中的协作事件</p>
              <p style="font-size:11px;margin-top:4px;">完成目标或随机触发</p>
            </div>
          </div>`
      }

      <div class="guild-section-title">📜 所有协作事件</div>
      <div class="guild-event-list">
        ${GUILD_COLLABORATION_EVENTS.map(event => {
          const triggerText = event.trigger.type === 'random'
            ? `随机 ${Math.round(event.trigger.chance * 100)}%`
            : `${this.getGoalTypeName(event.trigger.type)} 达到 ${event.trigger.threshold}`;

          return `
          <div class="guild-event-card">
            <div class="guild-event-card-header">
              <span class="guild-event-card-icon">${event.icon}</span>
              <div class="guild-event-card-info">
                <div class="guild-event-card-name">${event.name}</div>
                <div class="guild-event-card-desc">${event.desc}</div>
              </div>
              <div class="guild-event-card-trigger">
                触发: ${triggerText}
              </div>
            </div>
            <div class="guild-event-card-effects">
              ${event.effect.valueMultiplier ? `<span>价值×${event.effect.valueMultiplier}</span>` : ''}
              ${event.effect.energyDiscount ? `<span>能量-${Math.round(event.effect.energyDiscount * 100)}%</span>` : ''}
              ${event.effect.rarityBoost ? `<span>稀有+${Math.round(event.effect.rarityBoost * 100)}%</span>` : ''}
              ${event.effect.teammateContribBoost ? `<span>队友×${event.effect.teammateContribBoost}</span>` : ''}
              <span>持续${Math.floor(event.durationMs / 60000)}分钟</span>
            </div>
          </div>
        `;
        }).join('')}
      </div>
    `;
  }

  renderHistory() {
    const el = document.getElementById('guild-history');
    if (!el) return;

    const history = Storage.listGuildSettlements();

    if (history.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px;color:#666;">
          <p style="font-size:48px;margin-bottom:16px;">📜</p>
          <p>暂无公会历史</p>
          <p style="font-size:12px;margin-top:8px;">完成第一周后将显示</p>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="guild-history-list">
        ${history.map(h => `
          <div class="guild-history-card">
            <div class="guild-history-header">
              <div class="guild-history-week">第${h.weekNumber}周</div>
              <div class="guild-history-level">Lv.${h.level}</div>
            </div>
            <div class="guild-history-stats">
              <span>🎯 ${h.completedGoals}目标</span>
              <span>💰 ${h.coinsEarned}</span>
              <span>⚡ ${h.energyEarned}</span>
              <span>📋 ${h.commissionsCompleted}委托</span>
            </div>
            <div class="guild-history-date">${this.formatDate(h.endedAt)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  formatDate(timestamp) {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  loadData(data) {
    if (!data) return;

    if (data.guildInfo) {
      this.guildInfo = { ...data.guildInfo };
    }
    if (data.teammates) {
      this.teammates = [...data.teammates];
    }
    if (data.activeGoals) {
      this.activeGoals = [...data.activeGoals];
    }
    if (data.goalsProgress) {
      this.goalsProgress = { ...data.goalsProgress };
    }
    if (data.claimedGoalPhases) {
      this.claimedGoalPhases = {};
      Object.entries(data.claimedGoalPhases).forEach(([k, v]) => {
        this.claimedGoalPhases[k] = new Set(v);
      });
    }
    if (data.activeCommissions) {
      this.activeCommissions = data.activeCommissions.map(c => ({
        ...c,
        claimedPhases: new Set(c.claimedPhases || [])
      }));
    }
    if (data.playerContribution) {
      this.playerContribution = { ...data.playerContribution };
    }
    if (data.teammateContribution) {
      this.teammateContribution = { ...data.teammateContribution };
    }
    if (data.activeEvent) {
      this.activeEvent = data.activeEvent;
      this.eventEndAt = data.eventEndAt || 0;
    }

    this.checkWeeklyRefresh();
  }

  toJSON() {
    return {
      guildInfo: { ...this.guildInfo },
      teammates: [...this.teammates],
      activeGoals: [...this.activeGoals],
      goalsProgress: { ...this.goalsProgress },
      claimedGoalPhases: Object.fromEntries(
        Object.entries(this.claimedGoalPhases).map(([k, v]) => [k, Array.from(v)])
      ),
      activeCommissions: this.activeCommissions.map(c => ({
        ...c,
        claimedPhases: Array.from(c.claimedPhases)
      })),
      playerContribution: { ...this.playerContribution },
      teammateContribution: { ...this.teammateContribution },
      activeEvent: this.activeEvent,
      eventEndAt: this.eventEndAt
    };
  }
}
