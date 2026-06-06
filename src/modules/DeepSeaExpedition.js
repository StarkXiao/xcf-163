import { Storage } from './Storage.js';
import {
  ROUTES, SUPPLY_ITEMS, RISK_EVENTS, POSITIVE_EVENTS, WRECK_TYPES,
  EXPEDITION_UPGRADES, getUpgradeCost, getRandomWreck, getRandomEvent,
  generateCreatureForExpedition
} from '../data/deepSeaExpedition.js';
import { generateRandomAffixes, calculateCreatureValue } from '../data/creatures.js';

export class DeepSeaExpedition {
  constructor(game) {
    this.game = game;

    this.stats = {
      totalExpeditions: 0,
      totalExpeditionCoins: 0,
      bestRoute: null,
      highestEarnings: 0,
      totalWrecksFound: 0,
      totalCreaturesCaught: 0
    };

    this.upgrades = {};
    Object.keys(EXPEDITION_UPGRADES).forEach(key => {
      this.upgrades[key] = 0;
    });

    this.unlockedRoutes = { coastal: true };

    this.supplies = { food: 0, fuel: 0, repair: 0 };

    this.currentExpedition = null;
    this.expeditionLog = [];

    this.modal = document.getElementById('expedition-modal');
    this.tabBtns = null;
    this.tabContents = null;
    this.currentTab = 'overview';

    this.bindStaticEvents();
  }

  bindStaticEvents() {
    const btn = document.getElementById('btn-expedition');
    if (btn) {
      btn.addEventListener('click', () => this.openExpedition());
    }
    const closeBtn = document.getElementById('btn-close-expedition');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeExpedition());
    }
    this.tabBtns = document.querySelectorAll('.expedition-tab');
    this.tabContents = document.querySelectorAll('.expedition-tab-content');
    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          this.switchTab(tab);
        });
      });
    }
  }

  openExpedition() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    this.renderAll();
    this.game.checkTasks('expedition_open');
  }

  closeExpedition() {
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
    this.renderRoutes();
    this.renderSupplies();
    this.renderUpgrades();
    this.renderHistory();
  }

  getMaxHull() {
    return 100 + (this.upgrades.hull || 0) * EXPEDITION_UPGRADES.hull.effectPerLevel;
  }

  getMaxCargo() {
    return 5 + (this.upgrades.cargo || 0) * EXPEDITION_UPGRADES.cargo.effectPerLevel;
  }

  getMaxSupply() {
    return 30 + (this.upgrades.storage || 0) * EXPEDITION_UPGRADES.storage.effectPerLevel;
  }

  getRadarBonus() {
    return (this.upgrades.radar || 0) * EXPEDITION_UPGRADES.radar.effectPerLevel;
  }

  getFuelDiscount() {
    return (this.upgrades.engine || 0) * EXPEDITION_UPGRADES.engine.effectPerLevel;
  }

  renderOverview() {
    const el = document.getElementById('expedition-overview');
    if (!el) return;

    const maxHull = this.getMaxHull();
    const maxCargo = this.getMaxCargo();
    const maxSupply = this.getMaxSupply();

    let statusHtml = '';
    if (this.currentExpedition) {
      const exp = this.currentExpedition;
      const progress = Math.min(100, (exp.currentDay / exp.totalDays) * 100);
      statusHtml = `
        <div class="expedition-status active">
          <div class="expedition-status-header">
            <span>${exp.route.icon} ${exp.route.name}</span>
            <span>第 ${exp.currentDay}/${exp.totalDays} 天</span>
          </div>
          <div class="chamber-progress">
            <div class="chamber-progress-fill" style="width:${progress}%"></div>
          </div>
          <div class="expedition-stats-row">
            <span>🛡️ ${Math.floor(exp.hull)}/${maxHull}</span>
            <span>🍖 ${exp.supplies.food}</span>
            <span>⛽ ${exp.supplies.fuel}</span>
            <span>🔧 ${exp.supplies.repair}</span>
          </div>
          <div class="expedition-actions">
            <button class="modal-btn primary full-width" id="btn-advance-day">▶ 推进一天</button>
            <button class="modal-btn danger full-width" id="btn-return-early">⏹ 紧急回港</button>
          </div>
        </div>
      `;
    } else {
      statusHtml = `
        <div class="expedition-status idle">
          <div style="text-align:center;color:#888;padding:20px;">
            <div style="font-size:48px;">⚓</div>
            <p>潜艇停靠在港口</p>
            <p class="chamber-stat-sub">选择一条航线开始远征</p>
          </div>
        </div>
      `;
    }

    el.innerHTML = `
      <div class="chamber-overview-grid">
        <div class="chamber-stat-card">
          <div class="chamber-stat-label">远征次数</div>
          <div class="chamber-stat-value">${this.stats.totalExpeditions}</div>
        </div>
        <div class="chamber-stat-card">
          <div class="chamber-stat-label">累计收益</div>
          <div class="chamber-stat-value">${this.stats.totalExpeditionCoins}💰</div>
        </div>
        <div class="chamber-stat-card">
          <div class="chamber-stat-label">最高收益</div>
          <div class="chamber-stat-value" style="color:#ffaa00;">${this.stats.highestEarnings}💰</div>
        </div>
        <div class="chamber-stat-card">
          <div class="chamber-stat-label">发现残骸</div>
          <div class="chamber-stat-value">${this.stats.totalWrecksFound}</div>
        </div>
      </div>
      ${statusHtml}
      <div class="expedition-log">
        <div class="chamber-stat-label" style="margin-bottom:8px;">最近日志</div>
        <div id="expedition-log-content">
          ${this.expeditionLog.length > 0 ?
            this.expeditionLog.slice(-5).reverse().map(log => `
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

    const advanceBtn = document.getElementById('btn-advance-day');
    if (advanceBtn) advanceBtn.addEventListener('click', () => this.advanceDay());
    const returnBtn = document.getElementById('btn-return-early');
    if (returnBtn) returnBtn.addEventListener('click', () => this.returnToPort(true));
  }

  renderRoutes() {
    const el = document.getElementById('expedition-routes');
    if (!el) return;

    const routes = Object.values(ROUTES);
    el.innerHTML = `
      <p class="chamber-hint">选择一条航线开始远征，难度越高收益越丰厚</p>
      <div class="route-list">
        ${routes.map(route => this.renderRouteCard(route)).join('')}
      </div>
    `;

    el.querySelectorAll('[data-route-action]').forEach(btn => {
      const routeId = btn.dataset.routeId;
      const action = btn.dataset.routeAction;
      if (action === 'unlock') {
        btn.addEventListener('click', () => this.unlockRoute(routeId));
      } else if (action === 'start') {
        btn.addEventListener('click', () => this.startExpedition(routeId));
      }
    });
  }

  renderRouteCard(route) {
    const isUnlocked = this.unlockedRoutes[route.id];
    const isActive = this.currentExpedition !== null;
    const fuelDiscount = this.getFuelDiscount();
    const adjustedCost = {
      food: route.supplyCost.food,
      fuel: Math.ceil(route.supplyCost.fuel * (1 - fuelDiscount)),
      repair: route.supplyCost.repair
    };
    const canAfford = isUnlocked && !isActive &&
      this.supplies.food >= adjustedCost.food &&
      this.supplies.fuel >= adjustedCost.fuel &&
      this.supplies.repair >= adjustedCost.repair;

    let actionHtml = '';
    if (!isUnlocked) {
      const canUnlock = this.game.stats.coins >= route.unlockCost;
      actionHtml = `<button class="modal-btn primary full-width" data-route-id="${route.id}" data-route-action="unlock" ${canUnlock ? '' : 'disabled'}>🔓 解锁 ${route.unlockCost}💰</button>`;
    } else if (isActive) {
      actionHtml = `<button class="modal-btn secondary full-width" disabled>⏳ 远征进行中</button>`;
    } else {
      actionHtml = `<button class="modal-btn accent full-width" data-route-id="${route.id}" data-route-action="start" ${canAfford ? '' : 'disabled'}>🚀 出发远征</button>`;
    }

    const difficultyStars = '⭐'.repeat(route.difficulty);

    return `
      <div class="route-card ${isUnlocked ? '' : 'route-locked'}">
        <div class="route-card-header">
          <span class="route-icon">${route.icon}</span>
          <div class="route-info">
            <div class="route-name">${route.name}</div>
            <div class="route-difficulty">难度: ${difficultyStars}</div>
          </div>
        </div>
        <div class="route-desc">${route.desc}</div>
        <div class="route-stats">
          <span>📅 ${route.duration}天</span>
          <span>💰 ${route.baseRewardCoins}+</span>
        </div>
        <div class="route-cost">
          <span>🍖 ${adjustedCost.food}</span>
          <span>⛽ ${adjustedCost.fuel}</span>
          <span>🔧 ${adjustedCost.repair}</span>
        </div>
        <div class="route-action">${actionHtml}</div>
      </div>
    `;
  }

  renderSupplies() {
    const el = document.getElementById('expedition-supplies');
    if (!el) return;

    const maxSupply = this.getMaxSupply();
    const supplyList = Object.values(SUPPLY_ITEMS);

    el.innerHTML = `
      <p class="chamber-hint">补给是远征的生命线，确保携带足够的物资</p>
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
                <button class="modal-btn secondary" data-supply-action="sell-1" data-supply-id="${supply.id}" ${canSell ? '' : 'disabled'}>-1</button>
                <button class="modal-btn secondary" data-supply-action="sell-10" data-supply-id="${supply.id}" ${canSell && current >= 10 ? '' : 'disabled'}>-10</button>
                <button class="modal-btn primary" data-supply-action="buy-1" data-supply-id="${supply.id}" ${canBuy ? '' : 'disabled'}>+1</button>
                <button class="modal-btn primary" data-supply-action="buy-10" data-supply-id="${supply.id}" ${canBuy && this.game.stats.coins >= supply.basePrice * 10 ? '' : 'disabled'}>+10</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    el.querySelectorAll('[data-supply-action]').forEach(btn => {
      const supplyId = btn.dataset.supplyId;
      const action = btn.dataset.supplyAction;
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
    const el = document.getElementById('expedition-upgrades');
    if (!el) return;

    const upgrades = Object.entries(EXPEDITION_UPGRADES);
    el.innerHTML = `
      <p class="chamber-hint">升级潜艇设施，提升远征效率和安全性</p>
      <div class="upgrade-list">
        ${upgrades.map(([key, upgrade]) => {
          const level = this.upgrades[key] || 0;
          const maxed = level >= upgrade.maxLevel;
          const cost = maxed ? 0 : getUpgradeCost(key, level);
          const canAfford = !maxed && this.game.stats.coins >= cost;
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
                当前效果: +${level * upgrade.effectPerLevel}${key === 'radar' || key === 'engine' ? '%' : ''}
                ${!maxed ? ` → +${(level + 1) * upgrade.effectPerLevel}${key === 'radar' || key === 'engine' ? '%' : ''}` : ''}
              </div>
              <div class="upgrade-action">
                ${maxed ?
                  `<div class="stall-maxed">⭐ 已满级</div>` :
                  `<button class="modal-btn accent full-width" data-upgrade="${key}" ${canAfford ? '' : 'disabled'}>⬆ 升级 (${cost}💰)</button>`
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    el.querySelectorAll('[data-upgrade]').forEach(btn => {
      btn.addEventListener('click', () => this.purchaseUpgrade(btn.dataset.upgrade));
    });
  }

  renderHistory() {
    const el = document.getElementById('expedition-history');
    if (!el) return;

    const history = Storage.listExpeditions();
    el.innerHTML = `
      <div class="chamber-stat-label" style="margin-bottom:10px;">远征历史（最多保存20条）</div>
      ${history.length === 0 ? `
        <div style="color:#666;text-align:center;padding:30px;">暂无远征记录</div>
      ` : `
        <div class="expedition-history-list">
          ${history.map(h => `
            <div class="expedition-history-card">
              <div class="history-header">
                <span>${h.completed ? '✅' : '💀'} ${h.routeIcon} ${h.routeName}</span>
                <span class="history-earn">${h.earnings || 0}💰</span>
              </div>
              <div class="history-info">
                ${new Date(h.startedAt).toLocaleString()} · ${h.daysTravelled}天
              </div>
              <div class="history-details">
                残骸: ${h.wrecksFound || 0} · 捕获: ${h.creaturesCaught || 0} · 船体: ${Math.floor(h.finalHull || 0)}%
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  unlockRoute(routeId) {
    const route = ROUTES[routeId.toUpperCase()] || Object.values(ROUTES).find(r => r.id === routeId);
    if (!route) return;
    if (this.unlockedRoutes[route.id]) return;
    if (this.game.stats.coins < route.unlockCost) {
      this.game.taskSystem.showHint(`金币不足！需要 ${route.unlockCost} 金币`);
      return;
    }
    this.game.updateStats('coins', -route.unlockCost);
    this.unlockedRoutes[route.id] = true;
    this.game.saveProgress();
    this.addLog('success', `🔓 解锁了新航线：${route.name}`);
    this.game.taskSystem.showHint(`${route.name} 已解锁！`);
    this.game.checkTasks('expedition_unlock_route');
    this.renderAll();
  }

  buySupply(supplyId, amount = 1) {
    const supply = SUPPLY_ITEMS[supplyId];
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
    const supply = SUPPLY_ITEMS[supplyId];
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
    const upgrade = EXPEDITION_UPGRADES[upgradeKey.toUpperCase()] || EXPEDITION_UPGRADES[upgradeKey];
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
    this.game.checkTasks('expedition_upgrade');
    this.renderAll();
  }

  startExpedition(routeId) {
    if (this.currentExpedition) {
      this.game.taskSystem.showHint('远征已在进行中');
      return;
    }
    const route = ROUTES[routeId.toUpperCase()] || Object.values(ROUTES).find(r => r.id === routeId);
    if (!route) return;
    if (!this.unlockedRoutes[route.id]) {
      this.game.taskSystem.showHint('请先解锁该航线');
      return;
    }

    const fuelDiscount = this.getFuelDiscount();
    const requiredSupplies = {
      food: route.supplyCost.food,
      fuel: Math.ceil(route.supplyCost.fuel * (1 - fuelDiscount)),
      repair: route.supplyCost.repair
    };

    for (const [key, amount] of Object.entries(requiredSupplies)) {
      if ((this.supplies[key] || 0) < amount) {
        const supply = SUPPLY_ITEMS[key];
        this.game.taskSystem.showHint(`补给不足！${supply.name}需要 ${amount}，当前 ${this.supplies[key] || 0}`);
        return;
      }
    }

    for (const [key, amount] of Object.entries(requiredSupplies)) {
      this.supplies[key] -= amount;
    }

    const maxHull = this.getMaxHull();
    this.currentExpedition = {
      id: Storage.generateExpeditionId(),
      route: route,
      routeId: route.id,
      routeName: route.name,
      routeIcon: route.icon,
      startedAt: Date.now(),
      totalDays: route.duration,
      currentDay: 0,
      hull: maxHull,
      maxHull: maxHull,
      supplies: { ...this.supplies },
      cargo: [],
      bonusCoins: 0,
      wrecksFound: 0,
      creaturesCaught: 0,
      eventsEncountered: [],
      extraDays: 0,
      returnedEarly: false
    };

    this.supplies = { food: 0, fuel: 0, repair: 0 };

    this.stats.totalExpeditions++;
    this.addLog('info', `🚀 开始远征：${route.icon} ${route.name}`);
    this.game.taskSystem.showHint(`${route.name} 远征开始！`);
    this.game.checkTasks('expedition_start');
    this.game.saveProgress();
    this.renderAll();
  }

  advanceDay() {
    if (!this.currentExpedition) return;

    const exp = this.currentExpedition;
    const route = exp.route;
    exp.currentDay++;

    const dailyFoodCost = Math.max(1, Math.ceil(route.supplyCost.food / route.duration));
    const dailyFuelCost = Math.max(1, Math.ceil(route.supplyCost.fuel / route.duration));

    if (exp.supplies.food >= dailyFoodCost) {
      exp.supplies.food -= dailyFoodCost;
    } else {
      const hullDamage = 10 * (dailyFoodCost - exp.supplies.food);
      exp.hull -= hullDamage;
      exp.supplies.food = 0;
      this.addLog('danger', `🍖 食物不足！船体受损 ${hullDamage}%`);
    }

    if (exp.supplies.fuel >= dailyFuelCost) {
      exp.supplies.fuel -= dailyFuelCost;
    } else {
      exp.hull -= 15;
      this.addLog('danger', `⛽ 燃料耗尽！船体受损 15%`);
    }

    if (exp.hull <= 0) {
      this.addLog('danger', `💥 船体损毁！远征失败`);
      this.endExpedition(false);
      return;
    }

    if (Math.random() < 0.15) {
      this.tryRepair();
    }

    const radarBonus = this.getRadarBonus();

    const eventRoll = Math.random();
    if (eventRoll < route.eventChance * 0.5) {
      this.triggerRiskEvent();
    } else if (eventRoll < route.eventChance * (0.5 + radarBonus * 0.3)) {
      this.triggerPositiveEvent();
    }

    const wreckChance = route.wreckChance + radarBonus;
    if (Math.random() < wreckChance && exp.cargo.length < this.getMaxCargo()) {
      this.discoverWreck();
    }

    if (Math.random() < 0.4 && exp.cargo.length < this.getMaxCargo()) {
      this.catchCreature();
    }

    if (exp.currentDay >= exp.totalDays + exp.extraDays) {
      this.addLog('success', `⚓ 完成航线，准备回港`);
      this.returnToPort(false);
      return;
    }

    this.addLog('info', `📅 第 ${exp.currentDay} 天结束`);
    this.game.saveProgress();
    this.renderAll();
  }

  tryRepair() {
    const exp = this.currentExpedition;
    if (!exp) return;
    if (exp.supplies.repair > 0 && exp.hull < exp.maxHull) {
      const repairAmount = Math.min(10, exp.maxHull - exp.hull, exp.supplies.repair * 5);
      exp.hull = Math.min(exp.maxHull, exp.hull + repairAmount);
      exp.supplies.repair -= Math.ceil(repairAmount / 5);
      this.addLog('success', `🔧 自动修复船体 +${repairAmount}%`);
    }
  }

  triggerRiskEvent() {
    const exp = this.currentExpedition;
    if (!exp) return;
    const event = getRandomEvent(exp.route.difficulty, false);
    if (!event) return;

    const severity = event.severityRange[0] +
      Math.floor(Math.random() * (event.severityRange[1] - event.severityRange[0] + 1));

    let logMsg = `${event.icon} ${event.name}：`;
    const effects = [];

    event.effects.forEach(effect => {
      switch (effect.type) {
        case 'hull_damage': {
          const dmg = Math.floor((effect.min + Math.random() * (effect.max - effect.min)) * severity / 2);
          exp.hull -= dmg;
          effects.push(`船体-${dmg}%`);
          break;
        }
        case 'supply_loss': {
          const loss = Math.min(
            exp.supplies[effect.supply] || 0,
            Math.floor(effect.min + Math.random() * (effect.max - effect.min))
          );
          exp.supplies[effect.supply] = (exp.supplies[effect.supply] || 0) - loss;
          const supply = SUPPLY_ITEMS[effect.supply];
          effects.push(`${supply.icon}-${loss}`);
          break;
        }
        case 'coin_loss': {
          const loss = Math.floor(exp.bonusCoins * (effect.minPercent + Math.random() * (effect.maxPercent - effect.minPercent)));
          exp.bonusCoins = Math.max(0, exp.bonusCoins - loss);
          effects.push(`金币-${loss}💰`);
          break;
        }
        case 'extra_duration': {
          const extra = Math.floor(effect.min + Math.random() * (effect.max - effect.min));
          exp.extraDays += extra;
          effects.push(`延期+${extra}天`);
          break;
        }
      }
    });

    logMsg += effects.join('，');
    this.addLog('danger', logMsg);
    exp.eventsEncountered.push({ type: 'risk', eventId: event.id, severity });

    if (exp.hull <= 0) {
      this.addLog('danger', `💥 船体损毁！远征失败`);
      this.endExpedition(false);
    }
  }

  triggerPositiveEvent() {
    const exp = this.currentExpedition;
    if (!exp) return;
    const event = getRandomEvent(exp.route.difficulty, true);
    if (!event) return;

    let logMsg = `${event.icon} ${event.name}：`;
    const effects = [];

    event.effects.forEach(effect => {
      switch (effect.type) {
        case 'supply_gain': {
          const gain = Math.floor(effect.min + Math.random() * (effect.max - effect.min));
          const maxSupply = this.getMaxSupply();
          exp.supplies[effect.supply] = Math.min(maxSupply, (exp.supplies[effect.supply] || 0) + gain);
          const supply = SUPPLY_ITEMS[effect.supply];
          effects.push(`${supply.icon}+${gain}`);
          break;
        }
        case 'coin_gain': {
          const gain = Math.floor(effect.min + Math.random() * (effect.max - effect.min));
          exp.bonusCoins += gain;
          effects.push(`金币+${gain}💰`);
          break;
        }
        case 'bonus_wreck': {
          for (let i = 0; i < effect.count && exp.cargo.length < this.getMaxCargo(); i++) {
            this.discoverWreck();
          }
          effects.push(`额外残骸+${effect.count}`);
          break;
        }
      }
    });

    logMsg += effects.join('，');
    this.addLog('success', logMsg);
    exp.eventsEncountered.push({ type: 'positive', eventId: event.id });
  }

  discoverWreck() {
    const exp = this.currentExpedition;
    if (!exp) return;
    const wreck = getRandomWreck(exp.route.difficulty);
    if (!wreck) return;

    const maxCargo = this.getMaxCargo();
    const creatureCount = wreck.creatureCount[0] +
      Math.floor(Math.random() * (wreck.creatureCount[1] - wreck.creatureCount[0] + 1));

    const creaturesFound = [];
    for (let i = 0; i < creatureCount && exp.cargo.length < maxCargo; i++) {
      const creature = generateCreatureForExpedition(exp.route);
      const tier = 1;
      const affixes = generateRandomAffixes(creature);
      const value = calculateCreatureValue(creature, tier, affixes);
      const item = {
        ...creature,
        creatureId: creature.id,
        tier,
        affixes,
        value,
        uid: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      };
      exp.cargo.push(item);
      creaturesFound.push(creature.name);
      exp.creaturesCaught++;
    }

    const coins = Math.floor(wreck.bonusCoins[0] + Math.random() * (wreck.bonusCoins[1] - wreck.bonusCoins[0]));
    exp.bonusCoins += coins;
    exp.wrecksFound++;
    this.stats.totalWrecksFound++;

    this.addLog('success', `${wreck.icon} 发现${wreck.name}！获得 ${creaturesFound.join('、') || '空'}，+${coins}💰`);
  }

  catchCreature() {
    const exp = this.currentExpedition;
    if (!exp) return;
    const creature = generateCreatureForExpedition(exp.route);
    const tier = 1;
    const affixes = generateRandomAffixes(creature);
    const value = calculateCreatureValue(creature, tier, affixes);
    const item = {
      ...creature,
      creatureId: creature.id,
      tier,
      affixes,
      value,
      uid: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    };
    exp.cargo.push(item);
    exp.creaturesCaught++;
    this.stats.totalCreaturesCaught++;
    this.addLog('info', `🎣 捕获 ${creature.icon} ${creature.name}`);
  }

  returnToPort(early = false) {
    if (!this.currentExpedition) return;
    if (early) {
      this.currentExpedition.returnedEarly = true;
      this.addLog('warning', `⏹ 紧急回港，收益将减少50%`);
    }
    this.endExpedition(true);
  }

  endExpedition(success) {
    const exp = this.currentExpedition;
    if (!exp) return;

    const summary = this.calculateSettlement(exp, success);

    if (success && exp.cargo.length > 0) {
      exp.cargo.forEach(item => {
        this.game.addToBackpack(item);
      });
    }

    if (summary.totalCoins > 0) {
      this.game.updateStats('coins', summary.totalCoins);
    }

    this.stats.totalExpeditionCoins += summary.totalCoins;
    if (summary.totalCoins > this.stats.highestEarnings) {
      this.stats.highestEarnings = summary.totalCoins;
      this.stats.bestRoute = exp.routeId;
    }

    const historyData = {
      id: exp.id,
      routeId: exp.routeId,
      routeName: exp.routeName,
      routeIcon: exp.routeIcon,
      startedAt: exp.startedAt,
      endedAt: Date.now(),
      completed: success,
      returnedEarly: exp.returnedEarly,
      daysTravelled: exp.currentDay,
      totalDays: exp.totalDays,
      earnings: summary.totalCoins,
      wrecksFound: exp.wrecksFound,
      creaturesCaught: exp.creaturesCaught,
      finalHull: exp.hull,
      maxHull: exp.maxHull,
      eventCount: exp.eventsEncountered.length
    };
    Storage.saveExpedition(exp.id, historyData);

    this.showSettlementModal(summary, success);

    this.currentExpedition = null;
    this.game.saveProgress();
    this.game.checkTasks('expedition_complete');
    this.renderAll();
  }

  calculateSettlement(exp, success) {
    if (!success) {
      return {
        baseReward: 0,
        bonusCoins: 0,
        cargoValue: 0,
        hullPenalty: 0,
        earlyPenalty: 0,
        totalCoins: 0,
        cargoItems: [],
        messages: ['远征失败，所有货物已丢失']
      };
    }

    let cargoValue = 0;
    exp.cargo.forEach(item => {
      cargoValue += item.value || 0;
    });

    let baseReward = Math.floor(exp.route.baseRewardCoins * (exp.currentDay / exp.totalDays));
    let bonusCoins = exp.bonusCoins || 0;
    let hullPenalty = 0;
    let earlyPenalty = 0;

    if (exp.hull < exp.maxHull * 0.5) {
      hullPenalty = Math.floor((baseReward + cargoValue) * 0.2);
    }

    if (exp.returnedEarly) {
      earlyPenalty = Math.floor((baseReward + cargoValue + bonusCoins) * 0.5);
    }

    const totalCoins = Math.max(0, baseReward + bonusCoins + cargoValue - hullPenalty - earlyPenalty);

    const messages = [];
    if (hullPenalty > 0) messages.push(`船体损伤严重，扣除 ${hullPenalty}💰`);
    if (earlyPenalty > 0) messages.push(`提前回港，扣除 ${earlyPenalty}💰`);

    return {
      baseReward,
      bonusCoins,
      cargoValue,
      hullPenalty,
      earlyPenalty,
      totalCoins,
      cargoItems: exp.cargo,
      messages
    };
  }

  showSettlementModal(summary, success) {
    const modal = document.getElementById('expedition-settlement-modal');
    if (!modal) {
      this.game.taskSystem.showHint(
        success ? `远征完成！获得 ${summary.totalCoins} 金币` : '远征失败...'
      );
      return;
    }

    const exp = this.currentExpedition || {};
    const content = document.getElementById('expedition-settlement-content');
    if (!content) return;

    content.innerHTML = `
      <div class="settlement-header ${success ? 'success' : 'fail'}">
        <div style="font-size:48px;">${success ? '🎉' : '💀'}</div>
        <h2>${success ? '远征成功！' : '远征失败'}</h2>
      </div>
      <div class="settlement-stats">
        <div class="stat-row">
          <span>航线</span>
          <span>${exp.routeIcon || ''} ${exp.routeName || '未知'}</span>
        </div>
        <div class="stat-row">
          <span>航行天数</span>
          <span>${exp.currentDay || 0}/${exp.totalDays || 0} 天</span>
        </div>
        <div class="stat-row">
          <span>船体状态</span>
          <span>${Math.floor(exp.hull || 0)}/${exp.maxHull || 0}</span>
        </div>
        <div class="stat-row">
          <span>发现残骸</span>
          <span>${exp.wrecksFound || 0} 处</span>
        </div>
        <div class="stat-row">
          <span>捕获生物</span>
          <span>${exp.creaturesCaught || 0} 只</span>
        </div>
      </div>
      <div class="settlement-rewards">
        <div class="chamber-stat-label">收益明细</div>
        <div class="reward-row"><span>基础奖励</span><span>+${summary.baseReward}💰</span></div>
        <div class="reward-row"><span>额外金币</span><span>+${summary.bonusCoins}💰</span></div>
        <div class="reward-row"><span>货物价值</span><span>+${summary.cargoValue}💰</span></div>
        ${summary.hullPenalty > 0 ? `<div class="reward-row penalty"><span>船体损伤</span><span>-${summary.hullPenalty}💰</span></div>` : ''}
        ${summary.earlyPenalty > 0 ? `<div class="reward-row penalty"><span>提前回港</span><span>-${summary.earlyPenalty}💰</span></div>` : ''}
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
        <button class="modal-btn primary" id="btn-close-settlement">确定</button>
      </div>
    `;

    modal.classList.remove('hidden');

    const closeBtn = document.getElementById('btn-close-settlement');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }
  }

  addLog(type, message) {
    const time = new Date().toLocaleTimeString();
    this.expeditionLog.unshift({ type, message, time });
    if (this.expeditionLog.length > 50) {
      this.expeditionLog.pop();
    }
  }

  toJSON() {
    return {
      stats: this.stats,
      upgrades: this.upgrades,
      unlockedRoutes: this.unlockedRoutes,
      supplies: this.supplies,
      currentExpedition: this.currentExpedition,
      expeditionLog: this.expeditionLog
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
    if (data.unlockedRoutes) this.unlockedRoutes = { ...this.unlockedRoutes, ...data.unlockedRoutes };
    if (data.supplies) this.supplies = { ...this.supplies, ...data.supplies };
    if (data.currentExpedition) this.currentExpedition = data.currentExpedition;
    if (data.expeditionLog) this.expeditionLog = data.expeditionLog;
  }
}
