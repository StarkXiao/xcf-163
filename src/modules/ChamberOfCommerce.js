import { StallSystem } from './StallSystem.js';
import { PricingSystem } from './PricingSystem.js';
import { CustomerSystem } from './CustomerSystem.js';
import { OrderSystem } from './OrderSystem.js';
import { Storage } from './Storage.js';
import { CYCLE_LENGTH_SECONDS, MARKET_CHANGE_INTERVAL, CUSTOMER_ARRIVAL_INTERVAL, DAILY_BONUSES } from '../data/chamber.js';

export class ChamberOfCommerce {
  constructor(game) {
    this.game = game;
    this.stallSystem = new StallSystem(game);
    this.pricingSystem = new PricingSystem(game);
    this.customerSystem = new CustomerSystem(game);
    this.orderSystem = new OrderSystem(game);

    this.currentCycleId = null;
    this.cycleStartTime = 0;
    this.cycleElapsed = 0;
    this.cycleDay = 1;
    this.isRunning = false;

    this.marketTimer = 0;
    this.customerTimer = 0;
    this.cycleTimer = 0;
    this.lastTick = 0;

    this.stats = {
      totalCyclesCompleted: 0,
      bestReputation: 50,
      totalEarnings: 0,
      highestCycleEarnings: 0
    };

    this.modal = document.getElementById('chamber-modal');
    this.tabBtns = document.querySelectorAll('.chamber-tab');
    this.tabContents = document.querySelectorAll('.chamber-tab-content');
    this.currentTab = 'overview';

    this._serveMode = false;
    this._fulfillOrderMode = null;
    this._claimedBonuses = [];

    this.bindStaticEvents();
  }

  bindStaticEvents() {
    const btnChamber = document.getElementById('btn-chamber');
    if (btnChamber) {
      btnChamber.addEventListener('click', () => this.openChamber());
    }
    const btnClose = document.getElementById('btn-close-chamber');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeChamber());
    }
    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          this.switchTab(tab);
        });
      });
    }
  }

  openChamber() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    this.renderAll();
    this.game.checkTasks('chamber_open');
    if (!this.isRunning && !this.currentCycleId) {
      this.tryResumeCycle();
    }
  }

  closeChamber() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
  }

  switchTab(tab) {
    this.currentTab = tab;
    this.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    this.tabContents.forEach(content => {
      content.classList.toggle('hidden', content.dataset.tab !== tab);
    });
    this.renderAll();
  }

  renderAll() {
    this.renderOverview();
    this.renderStalls();
    this.renderMarket();
    this.renderCustomer();
    this.renderOrders();
    this.renderCycles();
  }

  renderOverview() {
    const el = document.getElementById('chamber-overview');
    if (!el) return;

    const rep = this.customerSystem.getReputation();
    const repTitle = this.customerSystem.getReputationTitle();
    const mod = this.pricingSystem.getCurrentModifier();
    const cycleProgress = this.isRunning
      ? Math.min(100, (this.cycleElapsed / CYCLE_LENGTH_SECONDS) * 100)
      : 0;
    const cycleRemaining = Math.max(0, CYCLE_LENGTH_SECONDS - this.cycleElapsed);

    el.innerHTML = `
      <div class="chamber-overview-grid">
        <div class="chamber-stat-card">
          <div class="chamber-stat-label">经营周目</div>
          <div class="chamber-stat-value">${this.isRunning ? `第 ${this.cycleDay} 天` : '未开始'}</div>
          ${this.isRunning ? `
            <div class="chamber-progress">
              <div class="chamber-progress-fill" style="width:${cycleProgress}%"></div>
            </div>
            <div class="chamber-stat-sub">剩余 ${Math.floor(cycleRemaining)}s</div>
          ` : '<div class="chamber-stat-sub" style="color:#888;">点击下方开始经营</div>'}
        </div>
        <div class="chamber-stat-card">
          <div class="chamber-stat-label">商会声望</div>
          <div class="chamber-stat-value" style="color:#ffaa00;">${repTitle}</div>
          <div class="chamber-progress">
            <div class="chamber-progress-fill reputation-fill" style="width:${rep}%"></div>
          </div>
          <div class="chamber-stat-sub">${rep} / 100</div>
        </div>
        <div class="chamber-stat-card">
          <div class="chamber-stat-label">市场行情</div>
          <div class="chamber-stat-value">${mod.icon} ${mod.name}</div>
          <div class="chamber-stat-sub">${mod.desc}</div>
        </div>
        <div class="chamber-stat-card">
          <div class="chamber-stat-label">订单槽位</div>
          <div class="chamber-stat-value">${this.orderSystem.getActiveOrders().length} / ${this.orderSystem.getMaxSlots()}</div>
          <div class="chamber-stat-sub">升级摊位解锁更多槽位</div>
        </div>
      </div>
      <div class="chamber-actions">
        ${this.isRunning ? `
          <button class="modal-btn danger full-width" id="btn-end-cycle-action">⏹ 结束经营周目</button>
        ` : `
          <button class="modal-btn primary full-width" id="btn-start-cycle-action">▶ 开始新经营周目</button>
        `}
      </div>
      <div id="chamber-daily-bonuses"></div>
    `;

    const startBtn = document.getElementById('btn-start-cycle-action');
    if (startBtn) startBtn.addEventListener('click', () => this.startNewCycle());
    const endBtn = document.getElementById('btn-end-cycle-action');
    if (endBtn) endBtn.addEventListener('click', () => this.endCurrentCycle());

    this.renderDailyBonuses();
  }

  renderDailyBonuses() {
    const el = document.getElementById('chamber-daily-bonuses');
    if (!el) return;
    const claimable = DAILY_BONUSES.filter(b => {
      const dayNum = parseInt(b.id.replace('d', ''));
      return this.cycleDay >= dayNum && !(this._claimedBonuses || []).includes(b.id);
    });
    if (claimable.length === 0) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = claimable.map(b => `
      <div class="bonus-card">
        <div>
          <div class="bonus-name">🎁 ${b.name}</div>
          <div class="bonus-desc">${b.desc}</div>
        </div>
        <button class="modal-btn accent" data-bonus="${b.id}">领取 ${b.coins}💰</button>
      </div>
    `).join('');
    el.querySelectorAll('[data-bonus]').forEach(btn => {
      btn.addEventListener('click', () => this.claimBonus(btn.dataset.bonus));
    });
  }

  claimBonus(bonusId) {
    const bonus = DAILY_BONUSES.find(b => b.id === bonusId);
    if (!bonus) return;
    if (!this._claimedBonuses) this._claimedBonuses = [];
    if (this._claimedBonuses.includes(bonusId)) return;
    this._claimedBonuses.push(bonusId);
    this.game.updateStats('coins', bonus.coins);
    this.game.taskSystem.showHint(`领取奖励：${bonus.name} +${bonus.coins} 金币`);
    this.game.saveProgress();
    this.renderOverview();
  }

  renderStalls() {
    const el = document.getElementById('chamber-stalls');
    if (!el) return;
    const stalls = this.stallSystem.getAllStalls();
    el.innerHTML = `
      <p class="chamber-hint">升级摊位可以提高售价加成并解锁更多订单槽位</p>
      <div class="stall-list">
        ${stalls.map(s => this.renderStallCard(s)).join('')}
      </div>
    `;
    el.querySelectorAll('[data-stall-action]').forEach(btn => {
      const key = btn.dataset.stallKey;
      const action = btn.dataset.stallAction;
      btn.addEventListener('click', () => {
        if (action === 'unlock') {
          const r = this.stallSystem.unlockStall(key);
          this.game.taskSystem.showHint(r.message);
        } else if (action === 'upgrade') {
          const r = this.stallSystem.upgradeStall(key);
          this.game.taskSystem.showHint(r.message);
        }
        this.renderStalls();
        this.renderOverview();
        this.renderOrders();
      });
    });
  }

  renderStallCard(s) {
    const priceBonus = (s.priceBonus * 100).toFixed(0);
    let statusHtml = '';
    const stallKey = s.key;
    if (!s.isUnlocked) {
      const canAfford = this.game.stats.coins >= s.unlockCost;
      statusHtml = `<button class="modal-btn primary full-width" data-stall-key="${stallKey}" data-stall-action="unlock" ${canAfford ? '' : 'disabled'}>🔓 解锁 ${s.unlockCost}💰</button>`;
    } else if (s.canUpgrade) {
      const cost = s.upgradeCost;
      const canAfford = this.game.stats.coins >= cost.coins;
      statusHtml = `<button class="modal-btn accent full-width" data-stall-key="${stallKey}" data-stall-action="upgrade" ${canAfford ? '' : 'disabled'}>⬆ 升级 Lv.${s.currentLevel + 1} (${cost.coins}💰)</button>`;
    } else {
      statusHtml = `<div class="stall-maxed">⭐ 已满级 Lv.${s.currentLevel}</div>`;
    }
    return `
      <div class="stall-card ${s.isUnlocked ? '' : 'stall-locked'}">
        <div class="stall-card-header">
          <span class="stall-icon">${s.icon}</span>
          <div class="stall-info">
            <div class="stall-name">${s.name}</div>
            <div class="stall-level">${s.isUnlocked ? `Lv.${s.currentLevel} / ${s.maxLevel}` : '未解锁'}</div>
          </div>
        </div>
        <div class="stall-desc">${s.desc}</div>
        <div class="stall-stats">
          <span>💰 售价加成: +${priceBonus}%</span>
          <span>📋 订单槽: +${s.orderSlotBonus}</span>
        </div>
        <div class="stall-action">${statusHtml}</div>
      </div>
    `;
  }

  renderMarket() {
    const el = document.getElementById('chamber-market');
    if (!el) return;
    const mod = this.pricingSystem.getCurrentModifier();
    const nextChange = Math.max(0, MARKET_CHANGE_INTERVAL - this.marketTimer);
    el.innerHTML = `
      <div class="market-current">
        <div class="market-icon">${mod.icon}</div>
        <div>
          <div class="market-name">${mod.name}</div>
          <div class="market-desc">${mod.desc}</div>
        </div>
      </div>
      <div class="market-timer">
        下次行情变化: <span style="color:#ffaa00;">${Math.ceil(nextChange)}s</span>
      </div>
      <div class="market-history">
        <div class="chamber-stat-label">近期行情记录</div>
        ${this.pricingSystem.priceHistory.length > 0 ? `
          <div class="history-list">
            ${this.pricingSystem.priceHistory.slice(-5).reverse().map(h => `
              <div class="history-item">
                <span>${new Date(h.timestamp).toLocaleTimeString()}</span>
                <span>行情变化</span>
              </div>
            `).join('')}
          </div>
        ` : '<div style="color:#666;text-align:center;padding:15px;">暂无记录</div>'}
      </div>
      <div class="market-stats-row">
        <div class="mini-stat">
          <span class="mini-stat-label">累计销售</span>
          <span class="mini-stat-value">${this.pricingSystem.stats.totalSales}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-label">总收入</span>
          <span class="mini-stat-value">${this.pricingSystem.stats.totalRevenue}💰</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-label">最高单笔</span>
          <span class="mini-stat-value">${this.pricingSystem.stats.highestSale}💰</span>
        </div>
      </div>
    `;
  }

  renderCustomer() {
    const el = document.getElementById('chamber-customer');
    if (!el) return;
    const c = this.customerSystem.getCurrentCustomer();
    const nextArrival = Math.max(0, CUSTOMER_ARRIVAL_INTERVAL - this.customerTimer);

    if (!c) {
      el.innerHTML = `
        <div class="customer-empty">
          <div style="font-size:48px;">🚶</div>
          <p>暂无顾客</p>
          <p class="chamber-stat-sub">下一位顾客: ${Math.ceil(nextArrival)}s</p>
          <p class="chamber-hint" style="margin-top:20px;">开启经营周目后，顾客会自动来访</p>
          <button class="modal-btn primary full-width" id="btn-serve-from-bp-main">🎒 从背包选货出售</button>
        </div>
      `;
      const btn = document.getElementById('btn-serve-from-bp-main');
      if (btn) btn.addEventListener('click', () => this.openBackpackToServe());
      return;
    }

    const patiencePct = Math.max(0, (this.customerSystem.getPatience() / c.patience) * 100);
    el.innerHTML = `
      <div class="customer-card">
        <div class="customer-header">
          <span class="customer-icon">${c.icon}</span>
          <div class="customer-info">
            <div class="customer-name">${c.name}</div>
            <div class="customer-desc">${c.desc}</div>
          </div>
        </div>
        <div class="customer-patience">
          <div class="chamber-stat-label">耐心值</div>
          <div class="chamber-progress">
            <div class="chamber-progress-fill ${patiencePct < 30 ? 'danger-fill' : ''}" style="width:${patiencePct}%"></div>
          </div>
          <div class="chamber-stat-sub">${Math.ceil(Math.max(0, this.customerSystem.getPatience()))}s</div>
        </div>
        <div class="customer-preferences">
          ${c.preferredRarities && c.preferredRarities.length > 0 ? `
            <div class="pref-row">
              <span class="pref-label">偏好品质</span>
              <span class="pref-values">${c.preferredRarities.join('、')}</span>
            </div>
          ` : ''}
          ${c.dislikedRarities && c.dislikedRarities.length > 0 ? `
            <div class="pref-row">
              <span class="pref-label">不喜欢</span>
              <span class="pref-values" style="color:#ff6666;">${c.dislikedRarities.join('、')}</span>
            </div>
          ` : ''}
          ${c.preferredAffixCategories && c.preferredAffixCategories.length > 0 ? `
            <div class="pref-row">
              <span class="pref-label">偏好词条</span>
              <span class="pref-values">${c.preferredAffixCategories.map(cat => this.translateAffixCategory(cat)).join('、')}</span>
            </div>
          ` : ''}
          <div class="pref-row">
            <span class="pref-label">小费比例</span>
            <span class="pref-values" style="color:#44ff44;">+${((c.tipMultiplier || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div class="customer-actions">
          <button class="modal-btn accent" id="btn-haggle-main" ${c.haggled ? 'disabled' : ''}>💬 砍价${c.haggled ? '(已砍)' : ''}</button>
          <button class="modal-btn primary" id="btn-serve-from-bp-cust">🎒 选货出售</button>
          <button class="modal-btn secondary" id="btn-dismiss-cust">👋 打发</button>
        </div>
      </div>
    `;

    const haggle = document.getElementById('btn-haggle-main');
    if (haggle) haggle.addEventListener('click', () => this.handleHaggle());
    const serve = document.getElementById('btn-serve-from-bp-cust');
    if (serve) serve.addEventListener('click', () => this.openBackpackToServe());
    const dismiss = document.getElementById('btn-dismiss-cust');
    if (dismiss) dismiss.addEventListener('click', () => this.handleDismissCustomer());
  }

  translateAffixCategory(cat) {
    const map = { attack: '攻击', defense: '防御', utility: '功能', luck: '幸运' };
    return map[cat] || cat;
  }

  handleHaggle() {
    const r = this.customerSystem.haggle();
    this.game.taskSystem.showHint(r.message);
    this.game.saveProgress();
    this.renderCustomer();
  }

  handleDismissCustomer() {
    this.customerSystem.dismissCustomer();
    this.game.taskSystem.showHint('顾客已打发，声望 -1');
    this.game.saveProgress();
    this.renderCustomer();
    this.renderOverview();
  }

  openBackpackToServe() {
    this._serveMode = true;
    this.closeChamber();
    this.game.inventory.openBackpack();
    setTimeout(() => {
      this.game.taskSystem.showHint('选择一个物品出售给当前顾客');
    }, 300);
  }

  tryServeItemFromBackpack(item, inventoryIndex) {
    if (!this._serveMode) return false;
    this._serveMode = false;
    const customer = this.customerSystem.getCurrentCustomer();
    if (!customer) {
      this.game.taskSystem.showHint('顾客已经离开了');
      return true;
    }
    const verify = this.customerSystem.verifyItemMatchesPreference(item);
    if (!verify.accept) {
      this.game.taskSystem.showHint(verify.reason);
      return true;
    }
    const priceInfo = this.pricingSystem.recordSale(item, customer);
    const serveResult = this.customerSystem.serveCustomer(item, priceInfo.finalPrice);
    this.game.updateStats('coins', priceInfo.finalPrice);

    const backpackItem = this.game.inventory.backpack[inventoryIndex];
    if (backpackItem) {
      if (backpackItem.count > 1) {
        backpackItem.count--;
      } else {
        this.game.inventory.backpack.splice(inventoryIndex, 1);
      }
    }

    this.game.inventory.renderBackpack();
    this.game.inventory.closeBackpack();
    this.game.saveProgress();
    this.game.checkTasks('chamber_sale');

    const repSign = serveResult.reputationDelta >= 0 ? '+' : '';
    this.game.taskSystem.showHint(`${serveResult.message}（声望 ${repSign}${serveResult.reputationDelta}）`);
    this.openChamber();
    return true;
  }

  renderOrders() {
    const el = document.getElementById('chamber-orders');
    if (!el) return;
    const orders = this.orderSystem.getActiveOrders();
    const maxSlots = this.orderSystem.getMaxSlots();

    el.innerHTML = `
      <div class="orders-header">
        <span>当前订单 ${orders.length}/${maxSlots}</span>
        <button class="modal-btn accent" id="btn-refresh-orders" ${orders.length >= maxSlots ? 'disabled' : ''}>➕ 刷新订单</button>
      </div>
      ${orders.length === 0 ? `
        <div style="color:#666;text-align:center;padding:30px;">
          暂无订单<br><br>
          <button class="modal-btn primary" id="btn-first-order">生成第一个订单</button>
        </div>
      ` : `
        <div class="order-list">
          ${orders.map(o => this.renderOrderCard(o)).join('')}
        </div>
      `}
      <div class="chamber-stats-row" style="margin-top:15px;">
        <div class="mini-stat">
          <span class="mini-stat-label">已完成</span>
          <span class="mini-stat-value" style="color:#44ff44;">${this.orderSystem.stats.totalCompleted}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-label">已失败</span>
          <span class="mini-stat-value" style="color:#ff6666;">${this.orderSystem.stats.totalFailed}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-label">累计奖励</span>
          <span class="mini-stat-value">${this.orderSystem.stats.totalRewardCoins}💰</span>
        </div>
      </div>
    `;

    const btn = document.getElementById('btn-refresh-orders') || document.getElementById('btn-first-order');
    if (btn) btn.addEventListener('click', () => this.generateNewOrder());

    el.querySelectorAll('[data-order-action]').forEach(btn => {
      const orderId = btn.dataset.orderId;
      const action = btn.dataset.orderAction;
      if (action === 'cancel') {
        btn.addEventListener('click', () => {
          const r = this.orderSystem.cancelOrder(orderId);
          this.game.taskSystem.showHint(r.message);
          this.renderOrders();
          this.renderOverview();
        });
      } else if (action === 'fulfill') {
        btn.addEventListener('click', () => {
          this._fulfillOrderMode = orderId;
          this.closeChamber();
          this.game.inventory.openBackpack();
          setTimeout(() => this.game.taskSystem.showHint('选择物品交付订单'), 300);
        });
      }
    });
  }

  renderOrderCard(o) {
    const timePct = Math.max(0, (o.timeRemaining / o.timeLimit) * 100);
    const progressPct = Math.max(0, (o.currentQuantity / o.requiredQuantity) * 100);
    return `
      <div class="order-card">
        <div class="order-header">
          <span class="order-customer">${o.customer.icon} ${o.customer.name}</span>
          <span class="order-reward">${o.reward}💰</span>
        </div>
        <div class="order-target">
          ${o.targetCreatureIcon ? `<span class="order-icon">${o.targetCreatureIcon}</span>` : ''}
          <div>
            <div class="order-name">${o.templateName}</div>
            <div class="order-target-info">
              ${o.targetCreatureName ? o.targetCreatureName : o.targetRarity}
              ${o.minTier > 1 ? ` · Lv.${o.minTier}+` : ''}
              ${o.requireAffixes ? ' · 需词条' : ''}
            </div>
          </div>
        </div>
        <div class="order-progress-row">
          <span>进度</span>
          <div class="chamber-progress small">
            <div class="chamber-progress-fill" style="width:${progressPct}%"></div>
          </div>
          <span>${o.currentQuantity}/${o.requiredQuantity}</span>
        </div>
        <div class="order-progress-row">
          <span>时间</span>
          <div class="chamber-progress small">
            <div class="chamber-progress-fill ${timePct < 30 ? 'danger-fill' : ''}" style="width:${timePct}%"></div>
          </div>
          <span>${Math.ceil(Math.max(0, o.timeRemaining))}s</span>
        </div>
        <div class="order-actions">
          <button class="modal-btn primary" data-order-id="${o.id}" data-order-action="fulfill">📦 交付</button>
          <button class="modal-btn secondary" data-order-id="${o.id}" data-order-action="cancel">✖ 取消</button>
        </div>
      </div>
    `;
  }

  generateNewOrder() {
    const o = this.orderSystem.generateOrder();
    if (!o) {
      this.game.taskSystem.showHint('订单槽已满或暂无可生成订单');
    } else {
      this.game.taskSystem.showHint(`新订单：${o.templateName}`);
      this.game.saveProgress();
    }
    this.renderOrders();
    this.renderOverview();
  }

  tryFulfillOrderFromBackpack(item, inventoryIndex) {
    if (!this._fulfillOrderMode) return false;
    const orderId = this._fulfillOrderMode;
    this._fulfillOrderMode = null;
    const r = this.orderSystem.tryFulfillWithBackpackItem(item, inventoryIndex, orderId);
    this.game.inventory.renderBackpack();
    this.game.inventory.closeBackpack();
    this.game.taskSystem.showHint(r.message);
    if (r.success && !r.partial) {
      this.game.saveProgress();
    }
    this.openChamber();
    return true;
  }

  renderCycles() {
    const el = document.getElementById('chamber-cycles');
    if (!el) return;
    const cycles = Storage.listCycles();
    el.innerHTML = `
      <div class="chamber-stat-label" style="margin-bottom:10px;">周目存档（最多保存20个）</div>
      ${cycles.length === 0 ? `
        <div style="color:#666;text-align:center;padding:30px;">暂无历史周目</div>
      ` : `
        <div class="cycle-list">
          ${cycles.map(c => `
            <div class="cycle-card">
              <div class="cycle-header">
                <span>${c.completed ? '✅' : '⏳'} ${new Date(c.startedAt).toLocaleDateString()}</span>
                <span class="cycle-earn">${c.summary.totalEarnings || 0}💰</span>
              </div>
              <div class="cycle-info">
                声望: ${c.summary.finalReputation || 0} · 销售: ${c.summary.totalSales || 0}笔 · 订单: ${c.summary.ordersCompleted || 0}
              </div>
              <div class="cycle-actions">
                ${!c.completed ? `
                  <button class="modal-btn primary" data-cycle-resume="${c.id}">▶ 继续</button>
                ` : ''}
                <button class="modal-btn danger" data-cycle-delete="${c.id}">🗑 删除</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
    el.querySelectorAll('[data-cycle-resume]').forEach(btn => {
      btn.addEventListener('click', () => this.resumeCycle(btn.dataset.cycleResume));
    });
    el.querySelectorAll('[data-cycle-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.deleteCycle(btn.dataset.cycleDelete);
        this.game.taskSystem.showHint('周目存档已删除');
        this.renderCycles();
      });
    });
  }

  showCyclesList() {
    this.switchTab('cycles');
  }

  startNewCycle() {
    if (this.isRunning) return;
    this.currentCycleId = Storage.generateCycleId();
    this.cycleStartTime = Date.now();
    this.cycleElapsed = 0;
    this.cycleDay = 1;
    this.isRunning = true;
    this._claimedBonuses = [];
    this.game.taskSystem.showHint('🎪 新经营周目开始！');
    this.game.checkTasks('cycle_start');
    this.game.saveProgress();
    this.saveCycleState();
    this.renderAll();
  }

  endCurrentCycle() {
    if (!this.isRunning) return;
    this.isRunning = false;
    const summary = this.getCycleSummary();
    this.stats.totalCyclesCompleted++;
    if (summary.totalEarnings > this.stats.highestCycleEarnings) {
      this.stats.highestCycleEarnings = summary.totalEarnings;
    }
    this.saveCycleState(true);
    this.game.taskSystem.showHint(`经营周目结束！总收入 ${summary.totalEarnings} 金币`);
    this.game.checkTasks('cycle_end');
    this.game.saveProgress();
    this.currentCycleId = null;
    this.renderAll();
  }

  getCycleSummary() {
    return {
      totalEarnings: this.pricingSystem.stats.totalRevenue + this.orderSystem.stats.totalRewardCoins,
      totalSales: this.pricingSystem.stats.totalSales,
      ordersCompleted: this.orderSystem.stats.totalCompleted,
      ordersFailed: this.orderSystem.stats.totalFailed,
      finalReputation: this.customerSystem.getReputation(),
      stallsUnlocked: this.stallSystem.stats.totalUnlocked,
      stallsUpgraded: this.stallSystem.stats.totalUpgrades,
      customersServed: this.customerSystem.stats.totalServed,
      customersLost: this.customerSystem.stats.totalLost,
      cycleDay: this.cycleDay
    };
  }

  saveCycleState(completed = false) {
    if (!this.currentCycleId) return;
    const data = {
      id: this.currentCycleId,
      startedAt: this.cycleStartTime,
      endedAt: completed ? Date.now() : null,
      completed,
      cycleDay: this.cycleDay,
      cycleElapsed: this.cycleElapsed,
      summary: this.getCycleSummary(),
      _claimedBonuses: this._claimedBonuses || [],
      chambers: {
        stall: this.stallSystem.toJSON(),
        pricing: this.pricingSystem.toJSON(),
        customer: this.customerSystem.toJSON(),
        order: this.orderSystem.toJSON(),
        stats: this.stats
      }
    };
    Storage.saveCycle(this.currentCycleId, data);
  }

  tryResumeCycle() {
    const meta = Storage.getChamberMeta();
    if (!meta.lastCycleId) return false;
    const data = Storage.loadCycle(meta.lastCycleId);
    if (!data || data.completed) return false;
    return this.resumeCycle(meta.lastCycleId);
  }

  resumeCycle(cycleId) {
    const data = Storage.loadCycle(cycleId);
    if (!data) return false;
    this.currentCycleId = cycleId;
    this.cycleStartTime = data.startedAt;
    this.cycleElapsed = data.cycleElapsed || 0;
    this.cycleDay = data.cycleDay || 1;
    this._claimedBonuses = data._claimedBonuses || [];
    if (data.chambers) {
      if (data.chambers.stall) this.stallSystem.loadData(data.chambers.stall);
      if (data.chambers.pricing) this.pricingSystem.loadData(data.chambers.pricing);
      if (data.chambers.customer) this.customerSystem.loadData(data.chambers.customer);
      if (data.chambers.order) this.orderSystem.loadData(data.chambers.order);
      if (data.chambers.stats) this.stats = { ...this.stats, ...data.chambers.stats };
    }
    this.isRunning = !data.completed;
    this.game.taskSystem.showHint('继续上次经营周目');
    this.game.saveProgress();
    this.renderAll();
    return true;
  }

  tick() {
    const now = Date.now();
    if (this.lastTick === 0) this.lastTick = now;
    const delta = (now - this.lastTick) / 1000;
    this.lastTick = now;
    if (!this.isRunning) return;

    this.cycleElapsed += delta;
    this.cycleTimer += delta;
    this.marketTimer += delta;
    this.customerTimer += delta;

    if (this.cycleTimer >= CYCLE_LENGTH_SECONDS / 7) {
      this.cycleTimer = 0;
      this.cycleDay++;
      this.game.taskSystem.showHint(`🌅 第 ${this.cycleDay} 天开始了`);
    }

    if (this.cycleElapsed >= CYCLE_LENGTH_SECONDS) {
      this.endCurrentCycle();
      return;
    }

    if (this.marketTimer >= MARKET_CHANGE_INTERVAL) {
      this.marketTimer = 0;
      const mod = this.pricingSystem.randomizeModifier();
      this.game.taskSystem.showHint(`市场变化：${mod.icon} ${mod.name}`);
      this.game.saveProgress();
    }

    if (!this.customerSystem.getCurrentCustomer() && this.customerTimer >= CUSTOMER_ARRIVAL_INTERVAL) {
      this.customerTimer = 0;
      this.customerSystem.generateCustomer();
      this.game.taskSystem.showHint(`顾客来访：${this.customerSystem.getCurrentCustomer().icon} ${this.customerSystem.getCurrentCustomer().name}`);
      this.game.saveProgress();
    }

    if (this.customerSystem.getCurrentCustomer()) {
      const lost = this.customerSystem.tickPatience(delta);
      if (lost) {
        this.game.taskSystem.showHint('顾客失去耐心离开了...');
        this.game.saveProgress();
      }
    }

    if (this.orderSystem.tick(delta) > 0) {
      this.game.taskSystem.showHint('部分订单已超时');
      this.game.saveProgress();
    }

    if (this.cycleElapsed >= 30 && Math.floor(this.cycleElapsed) % 30 < delta) {
      this.saveCycleState();
    }

    if (this.modal && !this.modal.classList.contains('hidden')) {
      this.renderOverview();
      this.renderMarket();
      this.renderCustomer();
      this.renderOrders();
    }
  }

  toJSON() {
    return {
      currentCycleId: this.currentCycleId,
      cycleStartTime: this.cycleStartTime,
      cycleElapsed: this.cycleElapsed,
      cycleDay: this.cycleDay,
      isRunning: this.isRunning,
      marketTimer: this.marketTimer,
      customerTimer: this.customerTimer,
      cycleTimer: this.cycleTimer,
      stats: this.stats,
      _claimedBonuses: this._claimedBonuses || [],
      stall: this.stallSystem.toJSON(),
      pricing: this.pricingSystem.toJSON(),
      customer: this.customerSystem.toJSON(),
      order: this.orderSystem.toJSON()
    };
  }

  loadData(data) {
    if (!data) return;
    if (data.currentCycleId) this.currentCycleId = data.currentCycleId;
    if (data.cycleStartTime) this.cycleStartTime = data.cycleStartTime;
    if (typeof data.cycleElapsed === 'number') this.cycleElapsed = data.cycleElapsed;
    if (typeof data.cycleDay === 'number') this.cycleDay = data.cycleDay;
    if (typeof data.isRunning === 'boolean') this.isRunning = data.isRunning;
    if (typeof data.marketTimer === 'number') this.marketTimer = data.marketTimer;
    if (typeof data.customerTimer === 'number') this.customerTimer = data.customerTimer;
    if (typeof data.cycleTimer === 'number') this.cycleTimer = data.cycleTimer;
    if (data.stats) this.stats = { ...this.stats, ...data.stats };
    if (data._claimedBonuses) this._claimedBonuses = data._claimedBonuses;
    if (data.stall) this.stallSystem.loadData(data.stall);
    if (data.pricing) this.pricingSystem.loadData(data.pricing);
    if (data.customer) this.customerSystem.loadData(data.customer);
    if (data.order) this.orderSystem.loadData(data.order);
  }
}
