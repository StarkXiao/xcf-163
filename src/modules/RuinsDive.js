import { Storage } from './Storage.js';
import {
  RUINS_TIERS, CELL_TYPES, SUB_UPGRADES, RUINS_SUPPLIES,
  getUpgradeCost, generateRuinsMap, calculateVisionRange,
  generateCreatureForRuins
} from '../data/ruinsDive.js';
import { generateRandomAffixes, calculateCreatureValue } from '../data/creatures.js';

export class RuinsDive {
  constructor(game) {
    this.game = game;

    this.stats = {
      totalDives: 0,
      totalRuinsCoins: 0,
      bestTier: null,
      highestEarnings: 0,
      totalEnemiesDefeated: 0,
      totalPuzzlesSolved: 0,
      totalTreasuresFound: 0
    };

    this.upgrades = {};
    Object.keys(SUB_UPGRADES).forEach(key => {
      this.upgrades[key] = 0;
    });

    this.unlockedTiers = { tier1: true };

    this.supplies = { energy: 0, repair: 0, ammo: 0 };

    this.currentDive = null;
    this.currentBattle = null;
    this.diveLog = [];

    this.modal = document.getElementById('ruins-modal');
    this.settlementModal = document.getElementById('ruins-settlement-modal');
    this.battleModal = document.getElementById('ruins-battle-modal');
    this.tabBtns = null;
    this.tabContents = null;
    this.currentTab = 'overview';

    this.bindStaticEvents();
  }

  getHullNetRarityBoost() {
    if (this.game?.inventory?.getEquippedNetStats) {
      const netStats = this.game.inventory.getEquippedNetStats();
      if (netStats?.rarityBoost) {
        return netStats.rarityBoost;
      }
    }
    return null;
  }

  bindStaticEvents() {
    const btn = document.getElementById('btn-ruins');
    if (btn) {
      btn.addEventListener('click', () => this.openRuins());
    }
    const closeBtn = document.getElementById('btn-close-ruins');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeRuins());
    }
    this.tabBtns = document.querySelectorAll('.ruins-tab');
    this.tabContents = document.querySelectorAll('.ruins-tab-content');
    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          this.switchTab(tab);
        });
      });
    }

    const settlementClose = document.getElementById('btn-close-ruins-settlement');
    if (settlementClose) {
      settlementClose.addEventListener('click', () => {
        this.settlementModal.classList.add('hidden');
      });
    }
  }

  openRuins() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    this.renderAll();
    this.game.checkTasks('ruins_open');
  }

  closeRuins() {
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
    this.renderTiers();
    this.renderSupplies();
    this.renderUpgrades();
    this.renderHistory();
    if (this.currentDive) {
      this.renderDive();
    }
  }

  getMaxHull() {
    return 100 + (this.upgrades.hull || 0) * SUB_UPGRADES.hull.effectPerLevel;
  }

  getMaxCargo() {
    return 8 + (this.upgrades.cargo || 0) * SUB_UPGRADES.cargo.effectPerLevel;
  }

  getAttackPower() {
    return 15 + (this.upgrades.weapon || 0) * SUB_UPGRADES.weapon.effectPerLevel;
  }

  getDefensePower() {
    return 5 + (this.upgrades.armor || 0) * SUB_UPGRADES.armor.effectPerLevel;
  }

  getVisionRange() {
    return calculateVisionRange(this.upgrades.sonar || 0);
  }

  getMoveEnergyCost() {
    const baseCost = 3;
    const discount = (this.upgrades.engine || 0) * SUB_UPGRADES.engine.effectPerLevel;
    return Math.max(1, Math.ceil(baseCost * (1 - discount)));
  }

  getMaxSupply() {
    return 20 + (this.upgrades.cargo || 0) * 5;
  }

  renderOverview() {
    const el = document.getElementById('ruins-overview');
    if (!el) return;

    const maxHull = this.getMaxHull();

    let statusHtml = '';
    if (this.currentDive) {
      const dive = this.currentDive;
      const tier = Object.values(RUINS_TIERS).find(t => t.id === dive.tier);
      statusHtml = `
        <div class="expedition-status active">
          <div class="expedition-status-header">
            <span>${tier?.icon || '🏚️'} ${tier?.name || '遗迹潜航'}</span>
            <span>深度 ${dive.depth || 0}m</span>
          </div>
          <div class="chamber-progress">
            <div class="chamber-progress-fill" style="width:${(dive.hull / maxHull) * 100}%"></div>
          </div>
          <div class="expedition-stats-row">
            <span>🛡️ ${Math.floor(dive.hull)}/${maxHull}</span>
            <span>⚡ ${dive.energy}</span>
            <span>💰 ${dive.coinsCollected}</span>
            <span>📦 ${dive.cargo.length}/${this.getMaxCargo()}</span>
          </div>
          <div class="expedition-actions">
            <button class="modal-btn danger full-width" id="btn-emergency-evac">⚠ 紧急撤离</button>
          </div>
        </div>
      `;
    } else {
      statusHtml = `
        <div class="expedition-status idle">
          <div style="text-align:center;color:#888;padding:20px;">
            <div style="font-size:48px;">🏚️</div>
            <p>潜航器停靠在港口</p>
            <p class="chamber-stat-sub">选择一个遗迹层级开始潜航</p>
          </div>
        </div>
      `;
    }

    el.innerHTML = `
      <div class="chamber-overview-grid">
        <div class="chamber-stat-card">
          <div class="chamber-stat-label">潜航次数</div>
          <div class="chamber-stat-value">${this.stats.totalDives}</div>
        </div>
        <div class="chamber-stat-card">
          <div class="chamber-stat-label">累计收益</div>
          <div class="chamber-stat-value">${this.stats.totalRuinsCoins}💰</div>
        </div>
        <div class="chamber-stat-card">
          <div class="chamber-stat-label">击败敌人</div>
          <div class="chamber-stat-value">${this.stats.totalEnemiesDefeated}</div>
        </div>
        <div class="chamber-stat-card">
          <div class="chamber-stat-label">解开机关</div>
          <div class="chamber-stat-value">${this.stats.totalPuzzlesSolved}</div>
        </div>
      </div>
      ${statusHtml}
      <div class="expedition-log">
        <div class="chamber-stat-label" style="margin-bottom:8px;">最近日志</div>
        <div id="ruins-log-content">
          ${this.diveLog.length > 0 ?
            this.diveLog.slice(-5).reverse().map(log => `
              <div class="log-entry ${log.type || ''}">
                <span class="log-time">[${log.time}]</span>
                <span class="log-text">${log.message}</span>
              </div>
            `).join('') :
            '<div style="color:#666;text-align:center;padding:10px;">暂无日志</div>'
          }
        </div>
      </div>
    `;

    const evacBtn = document.getElementById('btn-emergency-evac');
    if (evacBtn) evacBtn.addEventListener('click', () => this.emergencyEvacuate());
  }

  renderTiers() {
    const el = document.getElementById('ruins-tiers');
    if (!el) return;

    const tiers = Object.values(RUINS_TIERS);
    el.innerHTML = `
      <p class="chamber-hint">选择一个遗迹层级潜航，层级越深收益越丰厚</p>
      <div class="route-list">
        ${tiers.map(tier => this.renderTierCard(tier)).join('')}
      </div>
    `;

    el.querySelectorAll('[data-tier-action]').forEach(btn => {
      const tierId = btn.dataset.tierId;
      const action = btn.dataset.tierAction;
      if (action === 'unlock') {
        btn.addEventListener('click', () => this.unlockTier(tierId));
      } else if (action === 'start') {
        btn.addEventListener('click', () => this.startDive(tierId));
      }
    });
  }

  renderTierCard(tier) {
    const isUnlocked = this.unlockedTiers[tier.id];
    const isActive = this.currentDive !== null;
    const canAfford = isUnlocked && !isActive;

    let actionHtml = '';
    if (!isUnlocked) {
      const canUnlock = this.game.stats.coins >= tier.unlockCost;
      actionHtml = `<button class="modal-btn primary full-width" data-tier-id="${tier.id}" data-tier-action="unlock" ${canUnlock ? '' : 'disabled'}>🔓 解锁 ${tier.unlockCost}💰</button>`;
    } else if (isActive) {
      actionHtml = `<button class="modal-btn secondary full-width" disabled>⏳ 潜航进行中</button>`;
    } else {
      actionHtml = `<button class="modal-btn accent full-width" data-tier-id="${tier.id}" data-tier-action="start" ${canAfford ? '' : 'disabled'}>🚀 开始潜航</button>`;
    }

    const difficultyStars = '⭐'.repeat(tier.difficulty);

    return `
      <div class="route-card ${isUnlocked ? '' : 'route-locked'}">
        <div class="route-card-header">
          <span class="route-icon">${tier.icon}</span>
          <div class="route-info">
            <div class="route-name">${tier.name}</div>
            <div class="route-difficulty">难度: ${difficultyStars}</div>
          </div>
        </div>
        <div class="route-desc">深度 ${tier.depth}m · 未知的海底遗迹等待探索</div>
        <div class="route-stats">
          <span>📦 货舱容量大</span>
          <span>💰 高价值残骸</span>
        </div>
        <div class="route-action">${actionHtml}</div>
      </div>
    `;
  }

  renderSupplies() {
    const el = document.getElementById('ruins-supplies');
    if (!el) return;

    const maxSupply = this.getMaxSupply();
    const supplyList = Object.values(RUINS_SUPPLIES);

    el.innerHTML = `
      <p class="chamber-hint">补给是潜航的生命线，确保携带足够的物资</p>
      <div class="supply-list">
        ${supplyList.map(supply => {
          const current = this.supplies[supply.id] || 0;
          const canBuy = this.game.stats.coins >= supply.basePrice && current < maxSupply;
          const canSell = current > 0;
          return `
            <div class="supply-card">
              <div class="supply-card-header">
                <span class="supply-icon">${supply.icon}</span>
                <div class="supply-info">
                  <div class="supply-name">${supply.name}</div>
                  <div class="supply-desc">${supply.desc}</div>
                </div>
              </div>
              <div class="supply-amount">
                <span>库存: ${current}/${maxSupply}</span>
                <span>单价: ${supply.basePrice}💰</span>
              </div>
              <div class="supply-actions">
                <button class="modal-btn secondary" data-ruins-supply-action="sell-1" data-supply-id="${supply.id}" ${canSell ? '' : 'disabled'}>-1</button>
                <button class="modal-btn secondary" data-ruins-supply-action="sell-10" data-supply-id="${supply.id}" ${canSell && current >= 10 ? '' : 'disabled'}>-10</button>
                <button class="modal-btn primary" data-ruins-supply-action="buy-1" data-supply-id="${supply.id}" ${canBuy ? '' : 'disabled'}>+1</button>
                <button class="modal-btn primary" data-ruins-supply-action="buy-10" data-supply-id="${supply.id}" ${canBuy && this.game.stats.coins >= supply.basePrice * 10 ? '' : 'disabled'}>+10</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    el.querySelectorAll('[data-ruins-supply-action]').forEach(btn => {
      const supplyId = btn.dataset.supplyId;
      const action = btn.dataset.ruinsSupplyAction;
      btn.addEventListener('click', () => {
        const [op, amountStr] = action.split('-');
        const amount = parseInt(amountStr);
        if (op === 'buy') {
          this.buySupply(supplyId, amount);
        } else {
          this.sellSupply(supplyId, amount);
        }
      });
    });
  }

  renderUpgrades() {
    const el = document.getElementById('ruins-upgrades');
    if (!el) return;

    const upgrades = Object.entries(SUB_UPGRADES);
    el.innerHTML = `
      <p class="chamber-hint">升级潜航器设施，提升潜航效率和战斗力</p>
      <div class="upgrade-list">
        ${upgrades.map(([key, upgrade]) => {
          const level = this.upgrades[key] || 0;
          const maxed = level >= upgrade.maxLevel;
          const cost = maxed ? 0 : getUpgradeCost(key, level);
          const canAfford = !maxed && this.game.stats.coins >= cost;
          const effectUnit = (key === 'sonar' || key === 'engine') ? '%' : '';
          return `
            <div class="upgrade-card">
              <div class="upgrade-card-header">
                <span class="upgrade-icon">${upgrade.icon}</span>
                <div class="upgrade-info">
                  <div class="upgrade-name">${upgrade.name}</div>
                  <div class="upgrade-level">Lv.${level}/${upgrade.maxLevel}</div>
                </div>
              </div>
              <div class="upgrade-desc">${upgrade.desc}</div>
              <div class="upgrade-effect">
                当前效果: +${level * upgrade.effectPerLevel}${effectUnit}
                ${!maxed ? ` → +${(level + 1) * upgrade.effectPerLevel}${effectUnit}` : ''}
              </div>
              <div class="upgrade-action">
                ${maxed ?
                  `<div class="stall-maxed">⭐ 已满级</div>` :
                  `<button class="modal-btn accent full-width" data-ruins-upgrade="${key}" ${canAfford ? '' : 'disabled'}>⬆ 升级 (${cost}💰)</button>`
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    el.querySelectorAll('[data-ruins-upgrade]').forEach(btn => {
      btn.addEventListener('click', () => this.purchaseUpgrade(btn.dataset.ruinsUpgrade));
    });
  }

  renderHistory() {
    const el = document.getElementById('ruins-history');
    if (!el) return;

    const history = Storage.listRuinsDives();
    el.innerHTML = `
      <div class="chamber-stat-label" style="margin-bottom:10px;">潜航历史（最多保存20条）</div>
      ${history.length === 0 ? `
        <div style="color:#666;text-align:center;padding:30px;">暂无潜航记录</div>
      ` : `
        <div class="expedition-history-list">
          ${history.map(h => {
            const tier = Object.values(RUINS_TIERS).find(t => t.id === h.tierId);
            return `
            <div class="expedition-history-card">
              <div class="history-header">
                <span>${h.completed ? '✅' : '💀'} ${tier?.icon || '🏚️'} ${h.tierName || tier?.name || '未知'}</span>
                <span class="history-earn">${h.earnings || 0}💰</span>
              </div>
              <div class="history-info">
                ${new Date(h.startedAt).toLocaleString()}
              </div>
              <div class="history-details">
                击败: ${h.enemiesDefeated || 0} · 机关: ${h.puzzlesSolved || 0} · 宝藏: ${h.treasuresFound || 0}
              </div>
            </div>
          `;}).join('')}
        </div>
      `}
    `;
  }

  renderDive() {
    const el = document.getElementById('ruins-dive-map');
    if (!el || !this.currentDive) return;

    const dive = this.currentDive;
    const grid = dive.map.grid;
    const size = dive.map.size;
    const playerPos = dive.map.playerPos;
    const visionRange = this.getVisionRange();

    this.updateVisibility();

    let html = `
      <div class="dive-hud">
        <div class="dive-hud-item">
          <span class="dive-hud-icon">🛡️</span>
          <span>${Math.floor(dive.hull)}/${this.getMaxHull()}</span>
        </div>
        <div class="dive-hud-item">
          <span class="dive-hud-icon">⚡</span>
          <span>${dive.energy}</span>
        </div>
        <div class="dive-hud-item">
          <span class="dive-hud-icon">💰</span>
          <span>${dive.coinsCollected}</span>
        </div>
        <div class="dive-hud-item">
          <span class="dive-hud-icon">📦</span>
          <span>${dive.cargo.length}/${this.getMaxCargo()}</span>
        </div>
        <div class="dive-hud-item">
          <span class="dive-hud-icon">🔋</span>
          <span>${dive.currentSupplies.energy || 0}</span>
        </div>
        <div class="dive-hud-item">
          <span class="dive-hud-icon">🔧</span>
          <span>${dive.currentSupplies.repair || 0}</span>
        </div>
      </div>
      <div class="dive-grid" style="grid-template-columns: repeat(${size}, 1fr);">
    `;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = grid[y][x];
        let cellClass = 'dive-cell';
        let cellContent = '';

        if (x === playerPos.x && y === playerPos.y) {
          cellClass += ' dive-cell-player';
          cellContent = '🤿';
        } else if (!cell.visible && !cell.explored) {
          cellClass += ' dive-cell-fog';
          cellContent = '🌫️';
        } else if (!cell.visible && cell.explored) {
          cellClass += ' dive-cell-dim';
          cellContent = cell.type.passable ? cell.type.icon : '🧱';
        } else {
          cellClass += ` dive-cell-${cell.type.id}`;
          if (cell.type === CELL_TYPES.ENEMY && cell.content?.defeated) {
            cellContent = '💀';
          } else if (cell.type === CELL_TYPES.WRECK && cell.content?.looted) {
            cellContent = '·';
          } else if (cell.type === CELL_TYPES.TREASURE && cell.content?.opened) {
            cellContent = '📭';
          } else if (cell.type === CELL_TYPES.SUPPLY && cell.content?.looted) {
            cellContent = '·';
          } else if (cell.type === CELL_TYPES.PUZZLE && cell.content?.solved) {
            cellContent = '✅';
          } else {
            cellContent = cell.type.icon;
          }
        }

        html += `<div class="${cellClass}" data-x="${x}" data-y="${y}" title="${cell.visible ? cell.type.name : '未探索'}">${cellContent}</div>`;
      }
    }

    html += `</div>`;

    html += `
      <div class="dive-controls">
        <div class="dive-dpad">
          <div></div>
          <button class="dive-dir-btn" data-dir="up">⬆️</button>
          <div></div>
          <button class="dive-dir-btn" data-dir="left">⬅️</button>
          <button class="dive-dir-btn dive-interact-btn" data-action="interact">🔧</button>
          <button class="dive-dir-btn" data-dir="right">➡️</button>
          <div></div>
          <button class="dive-dir-btn" data-dir="down">⬇️</button>
          <div></div>
        </div>
        <div class="dive-actions">
          <button class="modal-btn primary" id="btn-use-energy" ${(dive.currentSupplies.energy || 0) > 0 ? '' : 'disabled'}>🔋 使用能量</button>
          <button class="modal-btn primary" id="btn-use-repair" ${(dive.currentSupplies.repair || 0) > 0 ? '' : 'disabled'}>🔧 维修</button>
          <button class="modal-btn accent" id="btn-evacuate">⬆️ 撤离</button>
        </div>
      </div>
    `;

    el.innerHTML = html;

    el.querySelectorAll('[data-dir]').forEach(btn => {
      btn.addEventListener('click', () => this.movePlayer(btn.dataset.dir));
    });

    el.querySelectorAll('[data-action="interact"]').forEach(btn => {
      btn.addEventListener('click', () => this.interactWithCurrentCell());
    });

    el.querySelectorAll('.dive-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        this.tryMoveTo(x, y);
      });
    });

    const useEnergyBtn = document.getElementById('btn-use-energy');
    if (useEnergyBtn) useEnergyBtn.addEventListener('click', () => this.useSupply('energy'));
    const useRepairBtn = document.getElementById('btn-use-repair');
    if (useRepairBtn) useRepairBtn.addEventListener('click', () => this.useSupply('repair'));
    const evacBtn = document.getElementById('btn-evacuate');
    if (evacBtn) evacBtn.addEventListener('click', () => this.tryEvacuate());
  }

  updateVisibility() {
    if (!this.currentDive) return;
    const dive = this.currentDive;
    const grid = dive.map.grid;
    const { x: px, y: py } = dive.map.playerPos;
    const range = this.getVisionRange();

    for (let y = 0; y < dive.map.size; y++) {
      for (let x = 0; x < dive.map.size; x++) {
        grid[y][x].visible = false;
      }
    }

    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx >= 0 && nx < dive.map.size && ny >= 0 && ny < dive.map.size) {
          if (Math.abs(dx) + Math.abs(dy) <= range) {
            grid[ny][nx].visible = true;
            grid[ny][nx].explored = true;
          }
        }
      }
    }
  }

  unlockTier(tierId) {
    const tier = Object.values(RUINS_TIERS).find(t => t.id === tierId);
    if (!tier) return;
    if (this.unlockedTiers[tier.id]) return;
    if (this.game.stats.coins < tier.unlockCost) {
      this.game.taskSystem.showHint(`金币不足！需要 ${tier.unlockCost} 金币`);
      return;
    }
    this.game.updateStats('coins', -tier.unlockCost);
    this.unlockedTiers[tier.id] = true;
    this.game.saveProgress();
    this.addLog('success', `🔓 解锁了新遗迹：${tier.name}`);
    this.game.taskSystem.showHint(`${tier.name} 已解锁！`);
    this.game.checkTasks('ruins_unlock_tier');
    this.renderAll();
  }

  buySupply(supplyId, amount = 1) {
    const supply = RUINS_SUPPLIES[supplyId];
    if (!supply) return;
    const maxSupply = this.getMaxSupply();
    const actualAmount = Math.min(amount, maxSupply - (this.supplies[supplyId] || 0));
    if (actualAmount <= 0) {
      this.game.taskSystem.showHint('库存已满！');
      return;
    }
    const cost = supply.basePrice * actualAmount;
    if (this.game.stats.coins < cost) {
      this.game.taskSystem.showHint(`金币不足！需要 ${cost} 金币`);
      return;
    }
    this.game.updateStats('coins', -cost);
    this.supplies[supplyId] = (this.supplies[supplyId] || 0) + actualAmount;
    this.game.saveProgress();
    this.renderAll();
  }

  sellSupply(supplyId, amount = 1) {
    const supply = RUINS_SUPPLIES[supplyId];
    if (!supply) return;
    const current = this.supplies[supplyId] || 0;
    const actualAmount = Math.min(amount, current);
    if (actualAmount <= 0) return;
    const refund = Math.floor(supply.basePrice * 0.5 * actualAmount);
    this.supplies[supplyId] = current - actualAmount;
    this.game.updateStats('coins', refund);
    this.game.saveProgress();
    this.renderAll();
  }

  purchaseUpgrade(upgradeKey) {
    const upgrade = SUB_UPGRADES[upgradeKey.toUpperCase()] || SUB_UPGRADES[upgradeKey];
    if (!upgrade) return;
    const level = this.upgrades[upgradeKey] || 0;
    if (level >= upgrade.maxLevel) return;
    const cost = getUpgradeCost(upgradeKey, level);
    if (this.game.stats.coins < cost) {
      this.game.taskSystem.showHint(`金币不足！需要 ${cost} 金币`);
      return;
    }
    this.game.updateStats('coins', -cost);
    this.upgrades[upgradeKey] = level + 1;
    this.game.saveProgress();
    this.addLog('success', `⬆ ${upgrade.name} 升级到 Lv.${level + 1}`);
    this.game.taskSystem.showHint(`${upgrade.name} 升级到 Lv.${level + 1}！`);
    this.game.checkTasks('ruins_upgrade');
    this.renderAll();
  }

  startDive(tierId) {
    if (this.currentDive) {
      this.game.taskSystem.showHint('潜航已在进行中');
      return;
    }
    const tier = Object.values(RUINS_TIERS).find(t => t.id === tierId);
    if (!tier) return;
    if (!this.unlockedTiers[tier.id]) {
      this.game.taskSystem.showHint('请先解锁该遗迹层级');
      return;
    }

    const requiredEnergy = 50 + tier.difficulty * 10;
    if ((this.supplies.energy || 0) < Math.ceil(requiredEnergy / 2)) {
      this.game.taskSystem.showHint(`能量电池不足！建议携带至少 ${Math.ceil(requiredEnergy / 2)} 个`);
    }

    const hullRarityBoost = this.getHullNetRarityBoost();
    const map = generateRuinsMap(tier, hullRarityBoost);
    const maxHull = this.getMaxHull();

    this.currentDive = {
      id: Storage.generateRuinsDiveId(),
      tier: tier.id,
      tierName: tier.name,
      tierIcon: tier.icon,
      depth: tier.depth,
      startedAt: Date.now(),
      map,
      hull: maxHull,
      maxHull,
      energy: 100,
      maxEnergy: 100,
      coinsCollected: 0,
      cargo: [],
      currentSupplies: { ...this.supplies },
      enemiesDefeated: 0,
      puzzlesSolved: 0,
      treasuresFound: 0,
      cellsExplored: 0,
      evacuated: false,
      emergencyEvac: false
    };

    for (const k of Object.keys(this.currentDive.currentSupplies)) {
      this.supplies[k] = 0;
    }

    this.stats.totalDives++;
    this.addLog('info', `🤿 开始潜航：${tier.icon} ${tier.name}，深度 ${tier.depth}m`);
    this.game.taskSystem.showHint(`${tier.name} 潜航开始！`);
    this.game.checkTasks('ruins_start');
    this.game.saveProgress();
    this.renderAll();
  }

  movePlayer(dir) {
    if (!this.currentDive) return;
    const dive = this.currentDive;
    const { x, y } = dive.map.playerPos;
    let nx = x, ny = y;

    switch (dir) {
      case 'up': ny--; break;
      case 'down': ny++; break;
      case 'left': nx--; break;
      case 'right': nx++; break;
    }

    this.tryMoveTo(nx, ny);
  }

  tryMoveTo(nx, ny) {
    if (!this.currentDive) return;
    const dive = this.currentDive;
    const { x, y } = dive.map.playerPos;

    const dist = Math.abs(nx - x) + Math.abs(ny - y);
    if (dist !== 1) {
      if (dist > 1) {
        this.game.taskSystem.showHint('只能移动到相邻的格子');
      }
      return;
    }

    if (nx < 0 || nx >= dive.map.size || ny < 0 || ny >= dive.map.size) {
      return;
    }

    const cell = dive.map.grid[ny][nx];
    if (!cell.type.passable) {
      this.game.taskSystem.showHint('前方无法通行');
      return;
    }

    const cost = this.getMoveEnergyCost();
    if (dive.energy < cost) {
      if ((dive.currentSupplies.energy || 0) > 0) {
        this.useSupply('energy');
        if (dive.energy < cost) return;
      } else {
        this.game.taskSystem.showHint('能量不足，无法移动！');
        return;
      }
    }

    dive.energy -= cost;
    dive.map.playerPos = { x: nx, y: ny };

    if (!cell.explored) {
      cell.explored = true;
      dive.cellsExplored++;
    }

    this.updateVisibility();

    if (cell.type === CELL_TYPES.EXIT) {
      this.tryEvacuate();
      return;
    }

    if (cell.type === CELL_TYPES.ENEMY && cell.content && !cell.content.defeated) {
      this.startBattle(cell);
      return;
    }

    if (cell.type === CELL_TYPES.WRECK && cell.content && !cell.content.looted) {
      this.lootWreck(cell);
    } else if (cell.type === CELL_TYPES.TREASURE && cell.content && !cell.content.opened) {
      this.openTreasure(cell);
    } else if (cell.type === CELL_TYPES.SUPPLY && cell.content && !cell.content.looted) {
      this.lootSupply(cell);
    }

    this.game.saveProgress();
    this.renderDive();
    this.renderOverview();
  }

  interactWithCurrentCell() {
    if (!this.currentDive) return;
    const dive = this.currentDive;
    const { x, y } = dive.map.playerPos;
    const cell = dive.map.grid[y][x];

    if (cell.type === CELL_TYPES.PUZZLE && cell.content && !cell.content.solved) {
      this.solvePuzzle(cell);
    } else if (cell.type === CELL_TYPES.WRECK && cell.content && !cell.content.looted) {
      this.lootWreck(cell);
    } else if (cell.type === CELL_TYPES.TREASURE && cell.content && !cell.content.opened) {
      this.openTreasure(cell);
    } else if (cell.type === CELL_TYPES.SUPPLY && cell.content && !cell.content.looted) {
      this.lootSupply(cell);
    } else if (cell.type === CELL_TYPES.EXIT) {
      this.tryEvacuate();
    } else {
      this.game.taskSystem.showHint('这里没有可以互动的东西');
    }
  }

  lootWreck(cell) {
    if (!this.currentDive || !cell.content) return;
    const dive = this.currentDive;
    const content = cell.content;

    if (content.coins > 0) {
      dive.coinsCollected += content.coins;
      this.addLog('success', `📦 发现残骸！获得 ${content.coins}💰`);
    }

    if (content.creature && dive.cargo.length < this.getMaxCargo()) {
      const creature = content.creature;
      const tier = 1;
      const affixes = generateRandomAffixes(creature);
      const value = calculateCreatureValue(creature, tier, affixes);
      dive.cargo.push({
        ...creature,
        creatureId: creature.id,
        tier,
        affixes,
        value,
        uid: `ruins_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      });
      this.addLog('success', `🎣 残骸中发现 ${creature.icon} ${creature.name}`);
    }

    content.looted = true;
    this.game.checkTasks('ruins_loot');
  }

  openTreasure(cell) {
    if (!this.currentDive || !cell.content) return;
    const dive = this.currentDive;
    const content = cell.content;

    dive.coinsCollected += content.coins;
    dive.treasuresFound++;
    this.stats.totalTreasuresFound++;
    this.addLog('success', `💰 发现宝藏！获得 ${content.coins}💰`);

    if (content.creature && dive.cargo.length < this.getMaxCargo()) {
      const creature = content.creature;
      const tier = 1;
      const affixes = generateRandomAffixes(creature);
      const value = calculateCreatureValue(creature, tier, affixes);
      dive.cargo.push({
        ...creature,
        creatureId: creature.id,
        tier,
        affixes,
        value,
        uid: `ruins_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      });
      this.addLog('success', `✨ 宝藏中发现珍贵的 ${creature.icon} ${creature.name}`);
    }

    content.opened = true;
    this.game.checkTasks('ruins_treasure');
  }

  lootSupply(cell) {
    if (!this.currentDive || !cell.content) return;
    const dive = this.currentDive;
    const content = cell.content;

    const supply = RUINS_SUPPLIES[content.supplyType];
    if (supply) {
      dive.currentSupplies[content.supplyType] = (dive.currentSupplies[content.supplyType] || 0) + 1;
      if (content.supplyType === 'energy') {
        dive.energy = Math.min(dive.maxEnergy, dive.energy + supply.restoreAmount);
      } else if (content.supplyType === 'repair') {
        dive.hull = Math.min(dive.maxHull, dive.hull + supply.restoreAmount);
      }
      this.addLog('success', `${supply.icon} 发现补给箱！恢复 ${content.amount}`);
    }

    content.looted = true;
  }

  solvePuzzle(cell) {
    if (!this.currentDive || !cell.content) return;
    const dive = this.currentDive;
    const content = cell.content;
    const puzzle = content.puzzle;

    if (dive.energy < puzzle.solveEnergyCost) {
      this.game.taskSystem.showHint(`能量不足！需要 ${puzzle.solveEnergyCost} 能量来破解机关`);
      return;
    }

    dive.energy -= puzzle.solveEnergyCost;

    const success = Math.random() < puzzle.successRate;

    if (success) {
      content.solved = true;
      dive.puzzlesSolved++;
      this.stats.totalPuzzlesSolved++;

      const rewards = puzzle.rewards;
      const parts = [];

      if (rewards.coins) {
        const coins = Math.floor(rewards.coins[0] + Math.random() * (rewards.coins[1] - rewards.coins[0]));
        dive.coinsCollected += coins;
        parts.push(`+${coins}💰`);
      }

      if (rewards.supplyDrop && Math.random() < rewards.supplyDrop.chance) {
        const drop = rewards.supplyDrop;
        const amount = Math.floor(drop.amount[0] + Math.random() * (drop.amount[1] - drop.amount[0]));
        if (drop.type === 'energy') {
          dive.energy = Math.min(dive.maxEnergy, dive.energy + amount);
          parts.push(`能量+${amount}`);
        } else if (drop.type === 'repair') {
          dive.hull = Math.min(dive.maxHull, dive.hull + amount);
          parts.push(`耐久+${amount}`);
        }
      }

      if (rewards.revealArea) {
        this.revealNearbyArea(3);
        parts.push('揭示周围区域');
      }

      if (rewards.creatureDrop && Math.random() < rewards.creatureDrop.chance && dive.cargo.length < this.getMaxCargo()) {
        const tier = Object.values(RUINS_TIERS).find(t => t.id === dive.tier);
        const boost = rewards.creatureDrop.rarityBoost || 0;
        const hullBoost = this.getHullNetRarityBoost();
        const creature = generateCreatureForRuins(tier, boost, hullBoost);
        const affixes = generateRandomAffixes(creature);
        const value = calculateCreatureValue(creature, 1, affixes);
        dive.cargo.push({
          ...creature,
          creatureId: creature.id,
          tier: 1,
          affixes,
          value,
          uid: `ruins_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        });
        parts.push(`获得 ${creature.icon}${creature.name}`);
      }

      this.addLog('success', `✅ ${puzzle.name}破解成功！${parts.join('，')}`);
      this.game.taskSystem.showHint(`${puzzle.name}破解成功！${parts.join('，')}`);
    } else {
      const damage = Math.floor(10 + Math.random() * 15);
      dive.hull -= damage;
      this.addLog('danger', `❌ ${puzzle.name}破解失败！船体受损 ${damage}%`);
      this.game.taskSystem.showHint(`${puzzle.name}破解失败！船体受损 ${damage}%`);

      if (dive.hull <= 0) {
        this.diveFailed();
        return;
      }
    }

    this.game.checkTasks('ruins_puzzle');
    this.game.saveProgress();
    this.renderDive();
    this.renderOverview();
  }

  revealNearbyArea(range) {
    if (!this.currentDive) return;
    const dive = this.currentDive;
    const grid = dive.map.grid;
    const { x: px, y: py } = dive.map.playerPos;

    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx >= 0 && nx < dive.map.size && ny >= 0 && ny < dive.map.size) {
          grid[ny][nx].explored = true;
        }
      }
    }
  }

  startBattle(cell) {
    if (!this.currentDive || !cell.content) return;
    const dive = this.currentDive;
    const enemy = cell.content;

    this.currentBattle = {
      cell,
      enemy: enemy.enemy,
      enemyHp: enemy.currentHp,
      enemyMaxHp: enemy.enemy.hp,
      playerHp: dive.hull,
      playerMaxHp: dive.maxHull,
      log: []
    };

    this.renderBattle();
    this.battleModal.classList.remove('hidden');
  }

  renderBattle() {
    const content = document.getElementById('ruins-battle-content');
    if (!content || !this.currentBattle) return;

    const b = this.currentBattle;
    const enemy = b.enemy;

    content.innerHTML = `
      <div class="battle-arena">
        <div class="battle-side">
          <div class="battle-combatant player">
            <div class="combatant-icon">🤿</div>
            <div class="combatant-name">潜航器</div>
            <div class="combatant-hp-bar">
              <div class="combatant-hp-fill player-hp" style="width:${(b.playerHp / b.playerMaxHp) * 100}%"></div>
            </div>
            <div class="combatant-hp-text">${Math.floor(b.playerHp)}/${b.playerMaxHp}</div>
            <div class="combatant-stats">⚔️${this.getAttackPower()} 🛡️${this.getDefensePower()}</div>
          </div>
        </div>
        <div class="battle-vs">VS</div>
        <div class="battle-side">
          <div class="battle-combatant enemy">
            <div class="combatant-icon">${enemy.icon}</div>
            <div class="combatant-name">${enemy.name}</div>
            <div class="combatant-hp-bar">
              <div class="combatant-hp-fill enemy-hp" style="width:${(b.enemyHp / b.enemyMaxHp) * 100}%"></div>
            </div>
            <div class="combatant-hp-text">${Math.floor(b.enemyHp)}/${b.enemyMaxHp}</div>
            <div class="combatant-stats">⚔️${enemy.attack} 🛡️${enemy.defense}</div>
          </div>
        </div>
      </div>
      <div class="battle-log">
        ${b.log.slice(-5).map(entry => `<div class="battle-log-entry ${entry.type}">${entry.text}</div>`).join('')}
      </div>
      <div class="battle-actions">
        <button class="modal-btn primary" id="btn-ruins-attack">⚔️ 攻击</button>
        <button class="modal-btn accent" id="btn-ruins-defend" ${(this.currentDive.currentSupplies.ammo || 0) > 0 ? '' : 'disabled'}>💥 使用弹药 (${this.currentDive.currentSupplies.ammo || 0})</button>
        <button class="modal-btn secondary" id="btn-ruins-repair-battle" ${(this.currentDive.currentSupplies.repair || 0) > 0 ? '' : 'disabled'}>🔧 维修 (${this.currentDive.currentSupplies.repair || 0})</button>
        <button class="modal-btn danger" id="btn-ruins-flee">🏃 逃跑</button>
      </div>
    `;

    document.getElementById('btn-ruins-attack').addEventListener('click', () => this.battleAction('attack'));
    document.getElementById('btn-ruins-defend').addEventListener('click', () => this.battleAction('ammo'));
    document.getElementById('btn-ruins-repair-battle').addEventListener('click', () => this.battleAction('repair'));
    document.getElementById('btn-ruins-flee').addEventListener('click', () => this.battleAction('flee'));
  }

  battleAction(action) {
    if (!this.currentBattle || !this.currentDive) return;
    const b = this.currentBattle;
    const dive = this.currentDive;

    switch (action) {
      case 'attack': {
        const playerDmg = Math.max(1, this.getAttackPower() - b.enemy.defense + Math.floor(Math.random() * 6));
        b.enemyHp -= playerDmg;
        b.log.push({ type: 'player', text: `🤿 你对 ${b.enemy.name} 造成 ${playerDmg} 点伤害` });
        break;
      }
      case 'ammo': {
        if ((dive.currentSupplies.ammo || 0) <= 0) return;
        dive.currentSupplies.ammo--;
        const extraDmg = RUINS_SUPPLIES.ammo.bonusDamage;
        const playerDmg = Math.max(1, this.getAttackPower() + extraDmg - b.enemy.defense + Math.floor(Math.random() * 10));
        b.enemyHp -= playerDmg;
        b.log.push({ type: 'player', text: `💥 使用弹药！对 ${b.enemy.name} 造成 ${playerDmg} 点伤害` });
        break;
      }
      case 'repair': {
        if ((dive.currentSupplies.repair || 0) <= 0) return;
        dive.currentSupplies.repair--;
        const heal = RUINS_SUPPLIES.repair.restoreAmount;
        b.playerHp = Math.min(b.playerMaxHp, b.playerHp + heal);
        dive.hull = b.playerHp;
        b.log.push({ type: 'player', text: `🔧 维修中！恢复 ${heal} 点耐久` });
        break;
      }
      case 'flee': {
        const fleeChance = 0.5;
        if (Math.random() < fleeChance) {
          b.log.push({ type: 'info', text: `🏃 成功逃离战斗！` });
          this.endBattle(false, true);
          return;
        } else {
          b.log.push({ type: 'danger', text: `❌ 逃跑失败！` });
        }
        break;
      }
    }

    if (b.enemyHp <= 0) {
      b.log.push({ type: 'success', text: `🎉 击败了 ${b.enemy.name}！` });
      this.endBattle(true);
      return;
    }

    const enemyDmg = Math.max(1, b.enemy.attack - this.getDefensePower() + Math.floor(Math.random() * 6));
    b.playerHp -= enemyDmg;
    dive.hull = b.playerHp;
    b.log.push({ type: 'enemy', text: `👾 ${b.enemy.name} 对你造成 ${enemyDmg} 点伤害` });

    if (b.playerHp <= 0) {
      b.log.push({ type: 'danger', text: `💀 潜航器损毁...` });
      this.endBattle(false);
      return;
    }

    this.renderBattle();
  }

  endBattle(victory, fled = false) {
    if (!this.currentBattle || !this.currentDive) return;
    const b = this.currentBattle;
    const dive = this.currentDive;

    if (victory) {
      const enemy = b.enemy;
      b.cell.content.defeated = true;
      dive.enemiesDefeated++;
      this.stats.totalEnemiesDefeated++;

      const coins = Math.floor(enemy.rewardCoins[0] + Math.random() * (enemy.rewardCoins[1] - enemy.rewardCoins[0]));
      dive.coinsCollected += coins;
      this.addLog('success', `⚔️ 击败 ${enemy.icon} ${enemy.name}！获得 ${coins}💰`);

      if (Math.random() < enemy.creatureDropChance && dive.cargo.length < this.getMaxCargo()) {
        const tier = Object.values(RUINS_TIERS).find(t => t.id === dive.tier);
        const hullBoost = this.getHullNetRarityBoost();
        const creature = generateCreatureForRuins(tier, enemy.rarityBoost || 0, hullBoost);
        const affixes = generateRandomAffixes(creature);
        const value = calculateCreatureValue(creature, 1, affixes);
        dive.cargo.push({
          ...creature,
          creatureId: creature.id,
          tier: 1,
          affixes,
          value,
          uid: `ruins_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        });
        this.addLog('success', `🎣 战利品：${creature.icon} ${creature.name}`);
      }

      this.game.checkTasks('ruins_battle_victory');
    } else if (!fled) {
      this.diveFailed();
      return;
    }

    this.currentBattle = null;
    this.battleModal.classList.add('hidden');
    this.game.saveProgress();
    this.renderDive();
    this.renderOverview();
  }

  useSupply(supplyType) {
    if (!this.currentDive) return;
    const dive = this.currentDive;
    const supply = RUINS_SUPPLIES[supplyType];

    if ((dive.currentSupplies[supplyType] || 0) <= 0) {
      this.game.taskSystem.showHint('没有可用的补给');
      return;
    }

    dive.currentSupplies[supplyType]--;

    if (supplyType === 'energy') {
      const amount = supply.restoreAmount;
      dive.energy = Math.min(dive.maxEnergy, dive.energy + amount);
      this.addLog('info', `🔋 使用能量电池，恢复 ${amount} 能量`);
    } else if (supplyType === 'repair') {
      const amount = supply.restoreAmount;
      dive.hull = Math.min(dive.maxHull, dive.hull + amount);
      this.addLog('info', `🔧 使用维修包，恢复 ${amount} 耐久`);
    }

    this.game.saveProgress();
    this.renderDive();
    this.renderOverview();
  }

  tryEvacuate() {
    if (!this.currentDive) return;
    const dive = this.currentDive;
    const { x, y } = dive.map.playerPos;
    const cell = dive.map.grid[y][x];

    if (cell.type === CELL_TYPES.EXIT) {
      this.endDive(true, false);
    } else {
      this.game.taskSystem.showHint('必须到达撤离点（⬆️）才能撤离！');
    }
  }

  emergencyEvacuate() {
    if (!this.currentDive) return;
    this.game.taskSystem.showHint('⚠️ 紧急撤离将损失50%收益！');
    this.endDive(true, true);
  }

  diveFailed() {
    if (!this.currentDive) return;
    this.addLog('danger', `💀 潜航器损毁！潜航失败`);
    this.endDive(false);
  }

  endDive(success, emergencyEvac = false) {
    if (!this.currentDive) return;
    const dive = this.currentDive;

    if (emergencyEvac) {
      dive.emergencyEvac = true;
    }
    dive.evacuated = true;

    const summary = this.calculateSettlement(dive, success, emergencyEvac);

    if (success && dive.cargo.length > 0) {
      dive.cargo.forEach(item => {
        this.game.addToBackpack(item);
      });
    }

    if (summary.totalCoins > 0) {
      this.game.updateStats('coins', summary.totalCoins);
    }

    this.stats.totalRuinsCoins += summary.totalCoins;
    if (summary.totalCoins > this.stats.highestEarnings) {
      this.stats.highestEarnings = summary.totalCoins;
      this.stats.bestTier = dive.tier;
    }

    const tier = Object.values(RUINS_TIERS).find(t => t.id === dive.tier);
    const historyData = {
      id: dive.id,
      tierId: dive.tier,
      tierName: dive.tierName,
      tierIcon: dive.tierIcon,
      startedAt: dive.startedAt,
      endedAt: Date.now(),
      completed: success,
      emergencyEvac,
      depth: dive.depth,
      earnings: summary.totalCoins,
      enemiesDefeated: dive.enemiesDefeated,
      puzzlesSolved: dive.puzzlesSolved,
      treasuresFound: dive.treasuresFound,
      cellsExplored: dive.cellsExplored,
      finalHull: dive.hull,
      maxHull: dive.maxHull
    };
    Storage.saveRuinsDive(dive.id, historyData);

    this.showSettlementModal(summary, success, tier);

    this.currentDive = null;
    this.currentBattle = null;
    this.battleModal.classList.add('hidden');
    this.game.saveProgress();
    this.game.checkTasks('ruins_complete');
    if (success && this.game.guildSystem) {
      this.game.guildSystem.recordPlayerAction('ruins_dive', 1);
    }
    this.renderAll();
  }

  calculateSettlement(dive, success, emergencyEvac) {
    if (!success) {
      return {
        coinsCollected: 0,
        cargoValue: 0,
        emergencyPenalty: 0,
        damagePenalty: 0,
        totalCoins: 0,
        cargoItems: [],
        messages: ['潜航失败，所有货物已丢失']
      };
    }

    let cargoValue = 0;
    dive.cargo.forEach(item => {
      cargoValue += item.value || 0;
    });

    let totalCoins = dive.coinsCollected + cargoValue;
    let emergencyPenalty = 0;
    let damagePenalty = 0;
    const messages = [];

    if (emergencyEvac) {
      emergencyPenalty = Math.floor(totalCoins * 0.5);
      totalCoins -= emergencyPenalty;
      messages.push(`紧急撤离，扣除 ${emergencyPenalty}💰`);
    }

    if (dive.hull < dive.maxHull * 0.3) {
      damagePenalty = Math.floor(totalCoins * 0.2);
      totalCoins -= damagePenalty;
      messages.push(`船体严重受损，扣除 ${damagePenalty}💰`);
    }

    totalCoins = Math.max(0, totalCoins);

    return {
      coinsCollected: dive.coinsCollected,
      cargoValue,
      emergencyPenalty,
      damagePenalty,
      totalCoins,
      cargoItems: dive.cargo,
      messages
    };
  }

  showSettlementModal(summary, success, tier) {
    const modal = this.settlementModal;
    const content = document.getElementById('ruins-settlement-content');
    if (!modal || !content) {
      this.game.taskSystem.showHint(
        success ? `潜航完成！获得 ${summary.totalCoins} 金币` : '潜航失败...'
      );
      return;
    }

    const dive = this.currentDive || {};
    const equippedNet = this.game?.inventory?.equippedNet;
    const equippedCore = this.game?.inventory?.equippedCore;

    content.innerHTML = `
      <div class="settlement-header ${success ? 'success' : 'fail'}">
        <div style="font-size:48px;">${success ? '🎉' : '💀'}</div>
        <h2>${success ? '潜航成功！' : '潜航失败'}</h2>
      </div>
      <div class="settlement-stats">
        <div class="stat-row">
          <span>遗迹</span>
          <span>${tier?.icon || ''} ${tier?.name || '未知'}</span>
        </div>
        <div class="stat-row">
          <span>深度</span>
          <span>${dive.depth || 0}m</span>
        </div>
        <div class="stat-row">
          <span>船体状态</span>
          <span>${Math.floor(dive.hull || 0)}/${dive.maxHull || 0}</span>
        </div>
        <div class="stat-row">
          <span>击败敌人</span>
          <span>${dive.enemiesDefeated || 0} 个</span>
        </div>
        <div class="stat-row">
          <span>解开机关</span>
          <span>${dive.puzzlesSolved || 0} 个</span>
        </div>
        <div class="stat-row">
          <span>发现宝藏</span>
          <span>${dive.treasuresFound || 0} 处</span>
        </div>
        ${equippedNet || equippedCore ? `
        <div class="stat-row">
          <span>当前装备</span>
          <span>${equippedNet ? equippedNet.icon : ''} ${equippedNet ? equippedNet.name : ''}
           /
           ${equippedCore ? equippedCore.icon : ''} ${equippedCore ? equippedCore.name : ''}</span>
        </div>
        ` : ''}
      </div>
      <div class="settlement-rewards">
        <div class="chamber-stat-label">收益明细</div>
        <div class="reward-row"><span>收集金币</span><span>+${summary.coinsCollected}💰</span></div>
        <div class="reward-row"><span>货物价值</span><span>+${summary.cargoValue}💰</span></div>
        ${summary.emergencyPenalty > 0 ? `<div class="reward-row penalty"><span>紧急撤离</span><span>-${summary.emergencyPenalty}💰</span></div>` : ''}
        ${summary.damagePenalty > 0 ? `<div class="reward-row penalty"><span>船体损伤</span><span>-${summary.damagePenalty}💰</span></div>` : ''}
        <div class="reward-row total"><span>总计</span><span>${summary.totalCoins}💰</span></div>
      </div>
      ${summary.cargoItems && summary.cargoItems.length > 0 ? `
        <div class="settlement-cargo">
          <div class="chamber-stat-label">捕获物品 (已存入背包)</div>
          <div class="cargo-grid">
            ${summary.cargoItems.slice(0, 12).map(item => `
              <div class="cargo-item rarity-${item.rarity?.name?.toLowerCase() || 'common'}">
                <span>${item.icon}</span>
                <span class="cargo-item-name">${item.name}</span>
              </div>
            `).join('')}
            ${summary.cargoItems.length > 12 ? `<div class="cargo-item">+${summary.cargoItems.length - 12}...</div>` : ''}
          </div>
        </div>
      ` : ''}
      ${summary.messages && summary.messages.length > 0 ? `
        <div class="settlement-messages">
          ${summary.messages.map(m => `<div class="message warning">⚠ ${m}</div>`).join('')}
        </div>
      ` : ''}
      <div class="modal-footer">
        <button class="modal-btn primary" id="btn-close-ruins-settlement">确定</button>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  addLog(type, message) {
    const time = new Date().toLocaleTimeString();
    this.diveLog.unshift({ type, message, time });
    if (this.diveLog.length > 50) {
      this.diveLog.pop();
    }
  }

  toJSON() {
    return {
      stats: this.stats,
      upgrades: this.upgrades,
      unlockedTiers: this.unlockedTiers,
      supplies: this.supplies,
      currentDive: this.currentDive,
      diveLog: this.diveLog
    };
  }

  loadData(data) {
    if (!data) return;
    if (data.stats) this.stats = { ...this.stats, ...data.stats };
    if (data.upgrades) {
      Object.keys(this.upgrades).forEach(key => {
        if (typeof data.upgrades[key] === 'number') {
          this.upgrades[key] = data.upgrades[key];
        }
      });
    }
    if (data.unlockedTiers) this.unlockedTiers = { ...this.unlockedTiers, ...data.unlockedTiers };
    if (data.supplies) this.supplies = { ...this.supplies, ...data.supplies };
    if (data.currentDive) this.currentDive = data.currentDive;
    if (data.diveLog) this.diveLog = data.diveLog;
  }
}
