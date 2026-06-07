import { Storage } from './Storage.js';
import {
  SEASON_WEEK_MS,
  COLLECTION_THEMES,
  SEASON_REWARD_TIERS,
  PORT_RANKING_TIERS,
  getThemeById,
  calculateCreatureScore,
  calculatePortCommissionScore,
  getRewardTier,
  getNextRewardTier,
  getPortRank,
  pickWeeklyTheme,
  getWeekNumber,
  getCreaturesForTheme
} from '../data/seasonGoals.js';
import { CREATURES } from '../data/creatures.js';

export class SeasonSystem {
  constructor(game) {
    this.game = game;

    this.currentSeason = null;
    this.collectionProgress = {};
    this.weeklyScore = 0;
    this.claimedRewards = new Set();
    this.seasonHistory = [];

    this.weeklyPortCommissions = 0;
    this.weeklyPortRarityBonus = 0;
    this.weeklyPortScore = 0;
    this.portRankClaimed = false;

    this.modal = null;
    this.tabContents = null;
    this.currentTab = 'overview';

    this.initElements();
    this.bindStaticEvents();
    this.checkWeeklyRefresh();
  }

  initElements() {
    this.modal = document.getElementById('season-modal');
    this.tabBtns = document.querySelectorAll('.season-tab');
    this.tabContents = document.querySelectorAll('.season-tab-content');
  }

  bindStaticEvents() {
    const btn = document.getElementById('btn-season');
    if (btn) {
      btn.addEventListener('click', () => this.open());
    }
    const closeBtn = document.getElementById('btn-close-season');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    const claimBtn = document.getElementById('btn-season-claim-all');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => this.claimAllAvailableRewards());
    }
    const settleBtn = document.getElementById('btn-season-settle');
    if (settleBtn) {
      settleBtn.addEventListener('click', () => this.manualSettleWeek());
    }
  }

  bindDynamicEvents() {
    this.tabBtns = document.querySelectorAll('.season-tab');
    this.tabContents = document.querySelectorAll('.season-tab-content');

    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          this.switchTab(tab);
        });
      });
    }

    this.bindRewardClaimEvents();
    this.bindPortRankClaimEvents();
  }

  bindRewardClaimEvents() {
    const claimBtns = document.querySelectorAll('[data-season-reward-claim]');
    claimBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = parseInt(btn.dataset.seasonRewardClaim);
        this.claimTierReward(tier);
      });
    });
  }

  bindPortRankClaimEvents() {
    const claimBtn = document.querySelector('[data-port-rank-claim]');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        this.claimPortRankReward();
      });
    }
  }

  checkWeeklyRefresh() {
    const now = Date.now();
    const weekNumber = getWeekNumber(now);

    if (!this.currentSeason || this.currentSeason.weekNumber !== weekNumber) {
      if (this.currentSeason) {
        this.settleWeek(false);
      }
      this.startNewWeek(now, weekNumber);
    } else if (now - this.currentSeason.startedAt >= SEASON_WEEK_MS) {
      this.settleWeek(false);
      this.startNewWeek(now, weekNumber);
    }
  }

  startNewWeek(timestamp, weekNumber) {
    const prevThemeId = this.currentSeason?.themeId;
    const theme = pickWeeklyTheme(prevThemeId);

    this.currentSeason = {
      id: `season_${timestamp}_${Math.floor(Math.random() * 10000)}`,
      weekNumber: weekNumber,
      themeId: theme.id,
      startedAt: timestamp,
      endsAt: timestamp + SEASON_WEEK_MS
    };

    this.collectionProgress = {};
    this.weeklyScore = 0;
    this.claimedRewards = new Set();
    this.weeklyPortCommissions = 0;
    this.weeklyPortRarityBonus = 0;
    this.weeklyPortScore = 0;
    this.portRankClaimed = false;

    const themeCreatures = getCreaturesForTheme(theme, this.game.inventory?.getCollection() || new Set(), true);
    themeCreatures.forEach(c => {
      this.collectionProgress[c.id] = {
        caught: 0,
        isNew: false,
        bestTier: 1
      };
    });

    this.game.saveProgress();

    if (this.game.taskSystem) {
      this.game.taskSystem.showHint(`🎯 新赛季主题：${theme.icon} ${theme.name}！`);
    }
  }

  settleWeek(showNotification = true) {
    if (!this.currentSeason) return;

    const finalScore = this.weeklyScore;
    const rewardTier = getRewardTier(finalScore);
    const theme = getThemeById(this.currentSeason.themeId);
    const portRank = getPortRank(this.weeklyPortCommissions, this.weeklyPortRarityBonus);

    SEASON_REWARD_TIERS.forEach(tier => {
      const unlocked = finalScore >= tier.minScore;
      if (unlocked && !this.claimedRewards.has(tier.tier)) {
        this.claimedRewards.add(tier.tier);
        if (tier.reward.coins) {
          this.game.updateStats('coins', tier.reward.coins);
        }
        if (tier.reward.energy) {
          this.game.updateStats('energy', tier.reward.energy);
        }
      }
    });

    const portRankUnlocked = this.weeklyPortCommissions >= portRank.minCommissions &&
                            this.weeklyPortRarityBonus >= portRank.minRarityBonus;
    if (portRankUnlocked && !this.portRankClaimed) {
      this.portRankClaimed = true;
      if (portRank.reward.coins) {
        this.game.updateStats('coins', portRank.reward.coins);
      }
      if (portRank.reward.energy) {
        this.game.updateStats('energy', portRank.reward.energy);
      }
    }

    const settlement = {
      id: this.currentSeason.id,
      weekNumber: this.currentSeason.weekNumber,
      themeId: this.currentSeason.themeId,
      themeName: theme?.name || '未知主题',
      themeIcon: theme?.icon || '🎯',
      startedAt: this.currentSeason.startedAt,
      endedAt: Date.now(),
      finalScore: finalScore,
      rewardTier: rewardTier.tier,
      rewardTierName: rewardTier.name,
      totalCoinsEarned: 0,
      totalEnergyEarned: 0,
      creaturesCaught: this.getTotalCreaturesCaught(),
      newCreatures: this.getNewCreaturesCount(),
      portCommissions: this.weeklyPortCommissions,
      portRank: portRank.rank,
      portRankName: portRank.name,
      portScore: this.weeklyPortScore,
      claimedRewards: Array.from(this.claimedRewards),
      portRankClaimed: this.portRankClaimed
    };

    SEASON_REWARD_TIERS.forEach(tier => {
      const unlocked = finalScore >= tier.minScore;
      if (unlocked) {
        settlement.totalCoinsEarned += tier.reward.coins;
        settlement.totalEnergyEarned += tier.reward.energy;
      }
    });

    if (portRankUnlocked) {
      settlement.totalCoinsEarned += portRank.reward.coins;
      settlement.totalEnergyEarned += portRank.reward.energy;
    }

    this.seasonHistory.unshift(settlement);
    if (this.seasonHistory.length > 12) {
      this.seasonHistory = this.seasonHistory.slice(0, 12);
    }

    Storage.saveSeasonSettlement(settlement.id, settlement);

    if (showNotification && this.game.taskSystem) {
      this.game.taskSystem.showHint(
        `📊 赛季结算：${settlement.themeIcon} ${settlement.themeName} · 得分 ${finalScore} · ${settlement.rewardTierName}`
      );
      this.game.taskSystem.checkTasks('season_reward_claimed');
    }

    this.game.saveProgress();
  }

  manualSettleWeek() {
    if (!this.currentSeason) return;
    this.settleWeek(true);
    const now = Date.now();
    const weekNumber = getWeekNumber(now);
    this.startNewWeek(now, weekNumber);
    this.renderAll();
  }

  getCurrentTheme() {
    if (!this.currentSeason) return null;
    return getThemeById(this.currentSeason.themeId);
  }

  getTimeRemaining() {
    if (!this.currentSeason) return 0;
    return Math.max(0, this.currentSeason.endsAt - Date.now());
  }

  recordCreatureCatch(creature, isNewToCollection = false, tier = 1) {
    this.checkWeeklyRefresh();

    const theme = this.getCurrentTheme();
    const score = calculateCreatureScore(creature, theme, isNewToCollection, tier);
    this.weeklyScore += score;

    if (!this.collectionProgress[creature.id]) {
      this.collectionProgress[creature.id] = {
        caught: 0,
        isNew: false,
        bestTier: 1
      };
    }

    const progress = this.collectionProgress[creature.id];
    progress.caught++;
    if (isNewToCollection) {
      progress.isNew = true;
    }
    if (tier > progress.bestTier) {
      progress.bestTier = tier;
    }

    this.game.saveProgress();

    if (this.game.taskSystem) {
      this.game.taskSystem.checkTasks('season_score');
      this.game.taskSystem.checkTasks('season_creature');
      if (isNewToCollection) {
        this.game.taskSystem.checkTasks('season_new_creature');
      }
    }

    return score;
  }

  recordPortCommissionComplete(commission) {
    this.checkWeeklyRefresh();

    this.weeklyPortCommissions++;
    const score = calculatePortCommissionScore(commission);
    this.weeklyPortScore += score;
    this.weeklyScore += score;

    const rarityWeights = { '普通': 1, '优秀': 1.2, '稀有': 1.5, '史诗': 2.0, '传说': 3.0 };
    const weight = rarityWeights[commission.rarity] || 1;
    const total = this.weeklyPortCommissions;
    this.weeklyPortRarityBonus = (this.weeklyPortRarityBonus * (total - 1) + weight) / total;

    this.game.saveProgress();

    if (this.game.taskSystem) {
      this.game.taskSystem.checkTasks('season_score');
      this.game.taskSystem.checkTasks('season_port_commission');
    }

    return score;
  }

  getTotalCreaturesCaught() {
    return Object.values(this.collectionProgress).reduce((sum, p) => sum + p.caught, 0);
  }

  getNewCreaturesCount() {
    return Object.values(this.collectionProgress).filter(p => p.isNew).length;
  }

  getThemeCreaturesProgress() {
    const theme = this.getCurrentTheme();
    if (!theme) return [];
    const collection = this.game.inventory?.getCollection() || new Set();
    const themeCreatures = getCreaturesForTheme(theme, collection, true);
    return themeCreatures.map(c => ({
      creature: c,
      collected: collection.has(c.id),
      progress: this.collectionProgress[c.id] || { caught: 0, isNew: false, bestTier: 1 }
    }));
  }

  claimTierReward(tier) {
    if (this.claimedRewards.has(tier)) return false;

    const rewardTier = SEASON_REWARD_TIERS.find(t => t.tier === tier);
    if (!rewardTier) return false;

    if (this.weeklyScore < rewardTier.minScore) return false;

    this.claimedRewards.add(tier);

    if (rewardTier.reward.coins) {
      this.game.updateStats('coins', rewardTier.reward.coins);
    }
    if (rewardTier.reward.energy) {
      this.game.updateStats('energy', rewardTier.reward.energy);
    }

    if (this.game.taskSystem) {
      this.game.taskSystem.showHint(
        `🎁 领取奖励：${rewardTier.name} · 💰${rewardTier.reward.coins || 0} ⚡${rewardTier.reward.energy || 0}`
      );
      this.game.taskSystem.checkTasks('season_reward_claimed');
    }

    this.game.saveProgress();
    this.renderAll();
    return true;
  }

  claimPortRankReward() {
    if (this.portRankClaimed) return false;

    const rank = getPortRank(this.weeklyPortCommissions, this.weeklyPortRarityBonus);
    if (!rank) return false;

    if (this.weeklyPortCommissions < rank.minCommissions) return false;

    this.portRankClaimed = true;

    if (rank.reward.coins) {
      this.game.updateStats('coins', rank.reward.coins);
    }
    if (rank.reward.energy) {
      this.game.updateStats('energy', rank.reward.energy);
    }

    if (this.game.taskSystem) {
      this.game.taskSystem.showHint(
        `🏆 港口排名奖励：${rank.name} · 💰${rank.reward.coins || 0} ⚡${rank.reward.energy || 0}`
      );
    }

    this.game.saveProgress();
    this.renderAll();
    return true;
  }

  claimAllAvailableRewards() {
    let claimed = 0;

    SEASON_REWARD_TIERS.forEach(tier => {
      if (!this.claimedRewards.has(tier.tier) && this.weeklyScore >= tier.minScore) {
        this.claimTierReward(tier.tier);
        claimed++;
      }
    });

    const rank = getPortRank(this.weeklyPortCommissions, this.weeklyPortRarityBonus);
    if (!this.portRankClaimed && this.weeklyPortCommissions >= rank.minCommissions) {
      this.claimPortRankReward();
      claimed++;
    }

    if (claimed === 0 && this.game.taskSystem) {
      this.game.taskSystem.showHint('暂无可领取的奖励');
    }

    return claimed;
  }

  open() {
    if (!this.modal) return;
    this.checkWeeklyRefresh();
    this.modal.classList.remove('hidden');
    this.game.checkTasks('season_open');
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
    this.renderThemeProgress();
    this.renderRewards();
    this.renderPortRanking();
    this.renderHistory();
    this.renderTimer();
  }

  renderTimer() {
    const el = document.getElementById('season-timer');
    if (!el) return;

    const remaining = this.getTimeRemaining();
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    el.textContent = days > 0
      ? `${days}天 ${hours}时 ${minutes}分`
      : `${hours}时 ${minutes}分`;
  }

  renderOverview() {
    const el = document.getElementById('season-overview');
    if (!el) return;

    const theme = this.getCurrentTheme();
    const currentTier = getRewardTier(this.weeklyScore);
    const nextTier = getNextRewardTier(this.weeklyScore);
    const portRank = getPortRank(this.weeklyPortCommissions, this.weeklyPortRarityBonus);

    const progressPercent = nextTier
      ? Math.min(100, (this.weeklyScore / nextTier.minScore) * 100)
      : 100;

    const themeColor = theme ? '#' + theme.startColor.toString(16).padStart(6, '0') : '#00ffff';

    el.innerHTML = `
      <div class="season-theme-header" style="border-color: ${themeColor};">
        <div class="season-theme-icon">${theme?.icon || '🎯'}</div>
        <div class="season-theme-info">
          <div class="season-theme-name">${theme?.name || '加载中...'}</div>
          <div class="season-theme-desc">${theme?.desc || ''}</div>
          <div class="season-theme-timer">
            ⏱️ 剩余时间：<span id="season-timer">--</span>
          </div>
        </div>
      </div>

      <div class="season-score-section">
        <div class="season-score-display">
          <div class="season-score-label">本周积分</div>
          <div class="season-score-value" style="color: ${themeColor};">${this.weeklyScore}</div>
          <div class="season-score-tier">${currentTier.name}${nextTier ? ` → ${nextTier.name}` : ''}</div>
        </div>
        <div class="season-progress-bar">
          <div class="season-progress-fill" style="width: ${progressPercent}%; background: linear-gradient(90deg, ${themeColor}, #00ffff);"></div>
        </div>
        <div class="season-progress-text">
          ${nextTier ? `${this.weeklyScore} / ${nextTier.minScore} (${nextTier.name})` : '已达最高等级！'}
        </div>
      </div>

      <div class="season-stats-grid">
        <div class="season-stat-card">
          <div class="season-stat-icon">🐟</div>
          <div class="season-stat-value">${this.getTotalCreaturesCaught()}</div>
          <div class="season-stat-label">收集数量</div>
        </div>
        <div class="season-stat-card">
          <div class="season-stat-icon">✨</div>
          <div class="season-stat-value">${this.getNewCreaturesCount()}</div>
          <div class="season-stat-label">图鉴新增</div>
        </div>
        <div class="season-stat-card">
          <div class="season-stat-icon">⚓</div>
          <div class="season-stat-value">${this.weeklyPortCommissions}</div>
          <div class="season-stat-label">港口委托</div>
        </div>
        <div class="season-stat-card">
          <div class="season-stat-icon">🏆</div>
          <div class="season-stat-value">${portRank.name}</div>
          <div class="season-stat-label">港口排名</div>
        </div>
      </div>

      <div class="season-action-bar">
        <button class="modal-btn accent full-width" id="btn-season-claim-all">🎁 一键领取所有奖励</button>
        <button class="modal-btn secondary full-width" id="btn-season-settle">🔄 立即结算（测试用）</button>
      </div>
    `;

    const claimBtn = document.getElementById('btn-season-claim-all');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => this.claimAllAvailableRewards());
    }
    const settleBtn = document.getElementById('btn-season-settle');
    if (settleBtn) {
      settleBtn.addEventListener('click', () => this.manualSettleWeek());
    }
  }

  renderThemeProgress() {
    const el = document.getElementById('season-theme-progress');
    if (!el) return;

    const theme = this.getCurrentTheme();
    const progressList = this.getThemeCreaturesProgress();

    if (progressList.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px;color:#666;">
          <p style="font-size:48px;margin-bottom:16px;">📋</p>
          <p>暂无主题目标生物</p>
        </div>
      `;
      return;
    }

    const isRequireNewTheme = theme?.requireNew;

    el.innerHTML = `
      <p class="season-hint">${theme?.desc || '收集本周主题生物获取更多积分！'}</p>
      <div class="season-creature-list">
        ${progressList.map(({ creature, collected, progress }) => {
          const isNew = progress.isNew;
          const caught = progress.caught;
          const bestTier = progress.bestTier;
          const targetCount = 5;
          const progressPercent = Math.min(100, (caught / targetCount) * 100);
          const needCollectTag = isRequireNewTheme && !collected;
          
          return `
            <div class="season-creature-card ${creature.rarity.class} ${needCollectTag ? 'need-collect' : ''}">
              <div class="season-creature-header">
                <span class="season-creature-icon">${creature.icon}</span>
                <div class="season-creature-info">
                  <div class="season-creature-name">${creature.name}</div>
                  <div class="season-creature-rarity">${creature.rarity.name}</div>
                </div>
                ${isNew ? '<span class="season-new-badge">NEW</span>' : ''}
                ${needCollectTag ? '<span class="season-need-collect-badge">未收集</span>' : ''}
              </div>
              <div class="season-creature-progress">
                <div class="season-creature-progress-bar">
                  <div class="season-creature-progress-fill" style="width: ${progressPercent}%;"></div>
                </div>
                <div class="season-creature-progress-text">${caught}/${targetCount}${bestTier > 1 ? ` · 最佳品阶 +${bestTier - 1}` : ''}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderRewards() {
    const el = document.getElementById('season-rewards');
    if (!el) return;

    el.innerHTML = `
      <p class="season-hint">累计积分达到对应等级即可领取奖励，每周结算时重置</p>
      <div class="season-reward-list">
        ${SEASON_REWARD_TIERS.map(tier => {
          const unlocked = this.weeklyScore >= tier.minScore;
          const claimed = this.claimedRewards.has(tier.tier);
          const progressPercent = Math.min(100, (this.weeklyScore / tier.minScore) * 100);
          
          let statusClass = 'locked';
          let statusText = '未解锁';
          let actionBtn = '';
          
          if (claimed) {
            statusClass = 'claimed';
            statusText = '已领取 ✓';
          } else if (unlocked) {
            statusClass = 'available';
            statusText = '可领取';
            actionBtn = `<button class="modal-btn primary full-width" data-season-reward-claim="${tier.tier}">🎁 领取</button>`;
          }
          
          return `
            <div class="season-reward-card ${statusClass}">
              <div class="season-reward-header">
                <div class="season-reward-tier">Tier ${tier.tier}</div>
                <div class="season-reward-name">${tier.name}</div>
                <div class="season-reward-status">${statusText}</div>
              </div>
              <div class="season-reward-progress">
                <div class="season-reward-progress-bar">
                  <div class="season-reward-progress-fill" style="width: ${progressPercent}%;"></div>
                </div>
                <div class="season-reward-progress-text">
                  ${Math.min(this.weeklyScore, tier.minScore)} / ${tier.minScore}
                </div>
              </div>
              <div class="season-reward-items">
                ${tier.reward.coins ? `<span class="season-reward-item">💰 ${tier.reward.coins}</span>` : ''}
                ${tier.reward.energy ? `<span class="season-reward-item">⚡ ${tier.reward.energy}</span>` : ''}
              </div>
              ${actionBtn}
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindRewardClaimEvents();
  }

  renderPortRanking() {
    const el = document.getElementById('season-port-ranking');
    if (!el) return;

    const currentRank = getPortRank(this.weeklyPortCommissions, this.weeklyPortRarityBonus);

    el.innerHTML = `
      <p class="season-hint">完成港口委托获取排名积分，品质越高排名越高</p>
      
      <div class="port-rank-current">
        <div class="port-rank-current-title">当前排名</div>
        <div class="port-rank-current-info">
          <span class="port-rank-current-icon">🏆</span>
          <div>
            <div class="port-rank-current-name">${currentRank.name}</div>
            <div class="port-rank-current-sub">
              委托 ${this.weeklyPortCommissions} · 品质加成 ${this.weeklyPortRarityBonus.toFixed(2)}×
            </div>
          </div>
        </div>
        <div class="port-rank-current-reward">
          奖励：💰${currentRank.reward.coins} ⚡${currentRank.reward.energy}
        </div>
        ${this.portRankClaimed 
          ? '<button class="modal-btn secondary full-width" disabled>✓ 已领取</button>'
          : this.weeklyPortCommissions >= currentRank.minCommissions
            ? `<button class="modal-btn primary full-width" data-port-rank-claim>🎁 领取排名奖励</button>`
            : `<button class="modal-btn secondary full-width" disabled>需完成 ${currentRank.minCommissions} 个委托</button>`
        }
      </div>

      <div class="port-rank-list">
        <div class="port-rank-list-title">排名等级</div>
        ${PORT_RANKING_TIERS.map(rank => {
          const achieved = this.weeklyPortCommissions >= rank.minCommissions && 
                         this.weeklyPortRarityBonus >= rank.minRarityBonus;
          return `
            <div class="port-rank-card ${achieved ? 'achieved' : ''} ${currentRank.rank === rank.rank ? 'current' : ''}">
              <div class="port-rank-card-rank">No.${rank.rank}</div>
              <div class="port-rank-card-info">
                <div class="port-rank-card-name">${rank.name}</div>
                <div class="port-rank-card-req">
                  委托 ≥${rank.minCommissions} · 品质 ≥${rank.minRarityBonus}×
                </div>
              </div>
              <div class="port-rank-card-reward">
                💰${rank.reward.coins} ⚡${rank.reward.energy}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindPortRankClaimEvents();
  }

  renderHistory() {
    const el = document.getElementById('season-history');
    if (!el) return;

    const history = Storage.listSeasonSettlements();

    if (history.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px;color:#666;">
          <p style="font-size:48px;margin-bottom:16px;">📜</p>
          <p>暂无赛季记录</p>
          <p style="font-size:12px;margin-top:8px;">完成第一周赛季后将在此显示</p>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="season-history-list">
        ${history.map(h => `
          <div class="season-history-card">
            <div class="season-history-header">
              <span class="season-history-icon">${h.themeIcon}</span>
              <div class="season-history-info">
                <div class="season-history-theme">${h.themeName}</div>
                <div class="season-history-time">第${h.weekNumber}周 · ${this.formatDate(h.endedAt)}</div>
              </div>
              <div class="season-history-score">${h.finalScore}分</div>
            </div>
            <div class="season-history-stats">
              <span>🏅 ${h.rewardTierName}</span>
              <span>🐟 ${h.creaturesCaught}</span>
              <span>✨ ${h.newCreatures}</span>
              <span>⚓ ${h.portCommissions}</span>
              <span>🏆 ${h.portRankName}</span>
            </div>
            <div class="season-history-earnings">
              赛季总收益：💰${h.totalCoinsEarned} ⚡${h.totalEnergyEarned}
            </div>
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
    
    if (data.currentSeason) {
      this.currentSeason = data.currentSeason;
    }
    if (data.collectionProgress) {
      this.collectionProgress = { ...data.collectionProgress };
    }
    if (typeof data.weeklyScore === 'number') {
      this.weeklyScore = data.weeklyScore;
    }
    if (data.claimedRewards) {
      this.claimedRewards = new Set(data.claimedRewards);
    }
    if (data.seasonHistory) {
      this.seasonHistory = [...data.seasonHistory];
    }
    if (typeof data.weeklyPortCommissions === 'number') {
      this.weeklyPortCommissions = data.weeklyPortCommissions;
    }
    if (typeof data.weeklyPortRarityBonus === 'number') {
      this.weeklyPortRarityBonus = data.weeklyPortRarityBonus;
    }
    if (typeof data.weeklyPortScore === 'number') {
      this.weeklyPortScore = data.weeklyPortScore;
    }
    if (typeof data.portRankClaimed === 'boolean') {
      this.portRankClaimed = data.portRankClaimed;
    }

    this.checkWeeklyRefresh();
  }

  toJSON() {
    return {
      currentSeason: this.currentSeason,
      collectionProgress: { ...this.collectionProgress },
      weeklyScore: this.weeklyScore,
      claimedRewards: Array.from(this.claimedRewards),
      seasonHistory: this.seasonHistory,
      weeklyPortCommissions: this.weeklyPortCommissions,
      weeklyPortRarityBonus: this.weeklyPortRarityBonus,
      weeklyPortScore: this.weeklyPortScore,
      portRankClaimed: this.portRankClaimed
    };
  }
}
