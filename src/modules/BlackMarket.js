import { CREATURES, calculateCreatureValue, RARITY } from '../data/creatures.js';
import {
  BLACK_MARKET_MERCHANTS,
  getRandomBlackMarketMerchant,
  BLACK_MARKET_ORDER_TEMPLATES,
  getRandomBlackMarketOrderTemplate,
  BLACK_MARKET_FLUCTUATIONS,
  getRandomBlackMarketFluctuation,
  BLACK_MARKET_DAILY_REFRESH_INTERVAL,
  BLACK_MARKET_ORDER_COUNT
} from '../data/blackMarket.js';

export class BlackMarket {
  constructor(game) {
    this.game = game;
    this.merchant = null;
    this.fluctuation = BLACK_MARKET_FLUCTUATIONS[1];
    this.orders = [];
    this.refreshTimer = 0;
    this.lastRefreshDay = 0;
    this.stats = {
      totalSales: 0,
      totalRevenue: 0,
      ordersCompleted: 0,
      ordersFailed: 0,
      highestSale: 0,
      daysTraded: 0,
      luckyHits: 0
    };
    this._sellMode = false;
    this._fulfillOrderMode = null;
  }

  init() {
    if (!this.merchant) {
      this.merchant = getRandomBlackMarketMerchant();
    }
    if (this.orders.length === 0) {
      this.generateOrders();
    }
  }

  refreshDaily(force = false) {
    const currentDay = this.game.chamber ? this.game.chamber.cycleDay : 1;
    if (force || currentDay !== this.lastRefreshDay) {
      this.lastRefreshDay = currentDay;
      this.merchant = getRandomBlackMarketMerchant();
      this.fluctuation = getRandomBlackMarketFluctuation();
      this.orders = [];
      this.generateOrders();
      this.stats.daysTraded++;
      return true;
    }
    return false;
  }

  generateOrders() {
    for (let i = 0; i < BLACK_MARKET_ORDER_COUNT; i++) {
      const template = getRandomBlackMarketOrderTemplate();
      const quantity = Math.floor(Math.random() * (template.maxQuantity - template.minQuantity + 1)) + template.minQuantity;

      let targetCreature = null;
      const allowedCreatures = CREATURES.filter(c => template.rarityFilter.includes(c.rarity.name));
      if (allowedCreatures.length > 0 && Math.random() < 0.6) {
        targetCreature = allowedCreatures[Math.floor(Math.random() * allowedCreatures.length)];
      }

      const baseReward = targetCreature
        ? targetCreature.value * quantity * template.rewardMult
        : 50 * quantity * template.rewardMult;
      const finalReward = Math.floor(baseReward) + (template.bonusCoins || 0);

      this.orders.push({
        id: `bmo_${Date.now()}_${i}_${Math.floor(Math.random() * 10000)}`,
        templateId: template.id,
        templateName: template.name,
        targetCreatureId: targetCreature ? targetCreature.id : null,
        targetCreatureName: targetCreature ? targetCreature.name : null,
        targetCreatureIcon: targetCreature ? targetCreature.icon : null,
        targetRarity: targetCreature ? targetCreature.rarity.name : template.rarityFilter[0],
        requiredQuantity: quantity,
        currentQuantity: 0,
        requireAffixes: template.requireAffixes || false,
        minTier: template.minTier || 1,
        reward: finalReward,
        bonusCoins: template.bonusCoins || 0,
        timeLimit: template.timeLimit,
        timeRemaining: template.timeLimit,
        status: 'active',
        createdAt: Date.now()
      });
    }
  }

  getActiveOrders() {
    return this.orders.filter(o => o.status === 'active');
  }

  calculatePrice(item, merchant = null) {
    const m = merchant || this.merchant;
    if (!m) return { finalPrice: 0, breakdown: {} };

    const tier = item.tier || 1;
    const affixes = item.affixes || [];
    const baseValue = calculateCreatureValue(item, tier, affixes);

    let mult = 1;
    const breakdown = { base: baseValue };

    mult *= m.basePriceMult;
    breakdown.merchantBase = m.basePriceMult;

    const rarityName = item.rarity.name;
    if (m.preferredRarities && m.preferredRarities.includes(rarityName)) {
      mult *= 1.15;
      breakdown.preferredRarity = 1.15;
    }

    if (m.bonusRarity && rarityName === m.bonusRarity) {
      mult *= m.bonusMult;
      breakdown.bonusRarity = m.bonusMult;
    }

    if (m.requireAffixes) {
      if (affixes.length > 0) {
        mult *= m.bonusMult;
        breakdown.affixBonus = m.bonusMult;
      } else {
        mult *= 0.5;
        breakdown.noAffixPenalty = 0.5;
      }
    }

    if (this.fluctuation) {
      mult *= this.fluctuation.mult;
      breakdown.market = this.fluctuation.mult;
      if (this.fluctuation.rarityBonus && rarityName === this.fluctuation.rarityBonus) {
        mult *= this.fluctuation.rarityMult;
        breakdown.marketRarityBonus = this.fluctuation.rarityMult;
      }
    }

    if (m.luckyChance && Math.random() < m.luckyChance) {
      mult *= m.luckyMult;
      breakdown.lucky = m.luckyMult;
      this.stats.luckyHits++;
    }

    const finalPrice = Math.max(1, Math.floor(baseValue * mult));
    return { finalPrice, breakdown, baseValue };
  }

  verifyItemForMerchant(item, merchant = null) {
    const m = merchant || this.merchant;
    if (!m) return { accept: false, reason: '没有黑市商人在场' };

    const rarityName = item.rarity.name;
    if (m.preferredRarities && !m.preferredRarities.includes(rarityName)) {
      return { accept: false, reason: `${m.name}不收${rarityName}品质的残骸` };
    }

    if (m.requireAffixes) {
      const affixes = item.affixes || [];
      if (affixes.length === 0) {
        return { accept: false, reason: `${m.name}只收带词条的残骸` };
      }
    }

    return { accept: true };
  }

  sellItem(item, inventoryIndex) {
    const verify = this.verifyItemForMerchant(item);
    if (!verify.accept) {
      return { success: false, message: verify.reason };
    }

    const priceInfo = this.calculatePrice(item);
    const backpackItem = this.game.inventory.backpack[inventoryIndex];
    if (!backpackItem) {
      return { success: false, message: '物品不存在' };
    }

    if (backpackItem.count > 1) {
      backpackItem.count--;
    } else {
      this.game.inventory.backpack.splice(inventoryIndex, 1);
    }

    this.game.updateStats('coins', priceInfo.finalPrice);
    this.stats.totalSales++;
    this.stats.totalRevenue += priceInfo.finalPrice;
    if (priceInfo.finalPrice > this.stats.highestSale) {
      this.stats.highestSale = priceInfo.finalPrice;
    }

    this.game.inventory.renderBackpack();
    this.game.saveProgress();
    this.game.checkTasks('blackmarket_sale');

    const lucky = priceInfo.breakdown.lucky ? ' 🎲幸运暴击！' : '';
    return {
      success: true,
      message: `出售成功！获得 ${priceInfo.finalPrice} 金币${lucky}`,
      price: priceInfo.finalPrice,
      priceInfo
    };
  }

  trySellFromBackpack(item, inventoryIndex) {
    if (!this._sellMode) return false;
    this._sellMode = false;
    const result = this.sellItem(item, inventoryIndex);
    this.game.taskSystem.showHint(result.message);
    this.game.inventory.closeBackpack();
    return true;
  }

  itemMatchesOrder(item, order) {
    if (order.status !== 'active') return false;
    if (order.targetCreatureId && item.id !== order.targetCreatureId) {
      if (!order.targetRarity || item.rarity.name !== order.targetRarity) {
        return false;
      }
    }
    if (order.targetRarity && item.rarity.name !== order.targetRarity && !order.targetCreatureId) {
      return false;
    }
    const tier = item.tier || 1;
    if (order.minTier && tier < order.minTier) return false;
    if (order.requireAffixes) {
      const affixes = item.affixes || [];
      if (affixes.length === 0) return false;
    }
    return true;
  }

  tryFulfillOrderFromBackpack(item, inventoryIndex, preferredOrderId = null) {
    if (!this._fulfillOrderMode) return false;
    const orderId = this._fulfillOrderMode;
    this._fulfillOrderMode = null;

    let eligibleOrders = this.orders.filter(o => o.status === 'active' && this.itemMatchesOrder(item, o));
    if (preferredOrderId || orderId) {
      const targetId = preferredOrderId || orderId;
      const preferred = eligibleOrders.find(o => o.id === targetId);
      if (preferred) eligibleOrders = [preferred];
    }

    if (eligibleOrders.length === 0) {
      this.game.taskSystem.showHint('没有匹配的黑市订单');
      this.game.inventory.closeBackpack();
      return true;
    }

    const order = eligibleOrders[0];
    const backpackItem = this.game.inventory.backpack[inventoryIndex];
    if (!backpackItem) {
      this.game.taskSystem.showHint('物品不存在');
      this.game.inventory.closeBackpack();
      return true;
    }

    const useCount = Math.min(backpackItem.count, order.requiredQuantity - order.currentQuantity);
    if (backpackItem.count > useCount) {
      backpackItem.count -= useCount;
    } else {
      this.game.inventory.backpack.splice(inventoryIndex, 1);
    }

    order.currentQuantity += useCount;
    this.game.inventory.renderBackpack();

    if (order.currentQuantity >= order.requiredQuantity) {
      const result = this.completeOrder(order.id);
      this.game.taskSystem.showHint(result.message);
    } else {
      this.game.taskSystem.showHint(`黑市订单进度：${order.currentQuantity}/${order.requiredQuantity}`);
      this.game.saveProgress();
    }

    this.game.inventory.closeBackpack();
    return true;
  }

  completeOrder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: '订单不存在' };
    if (order.status !== 'active') return { success: false, message: '订单状态异常' };

    order.status = 'completed';
    order.completedAt = Date.now();
    this.stats.ordersCompleted++;
    this.game.updateStats('coins', order.reward);

    if (this.game.customerSystem) {
      this.game.customerSystem.adjustReputation(5);
    }

    this.game.saveProgress();
    this.game.checkTasks('blackmarket_order');

    return {
      success: true,
      message: `黑市订单完成！获得 ${order.reward} 金币奖励`,
      order,
      reward: order.reward
    };
  }

  cancelOrder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: '订单不存在' };
    if (order.status !== 'active') return { success: false, message: '订单状态异常' };
    order.status = 'cancelled';
    if (this.game.customerSystem) {
      this.game.customerSystem.adjustReputation(-5);
    }
    this.game.saveProgress();
    return { success: true, message: '黑市订单已取消，声望下降' };
  }

  tick(deltaSeconds) {
    this.refreshTimer += deltaSeconds;
    if (this.refreshTimer >= BLACK_MARKET_DAILY_REFRESH_INTERVAL) {
      this.refreshTimer = 0;
      if (this.refreshDaily()) {
        if (this.game.taskSystem) {
          this.game.taskSystem.showHint(`🌙 黑市交易日刷新！新商人：${this.merchant.icon} ${this.merchant.name}`);
        }
      }
    }

    let expired = 0;
    this.orders.forEach(order => {
      if (order.status === 'active') {
        order.timeRemaining -= deltaSeconds;
        if (order.timeRemaining <= 0) {
          order.status = 'failed';
          this.stats.ordersFailed++;
          expired++;
        }
      }
    });

    return expired;
  }

  toJSON() {
    return {
      merchant: this.merchant ? this.merchant.id : null,
      fluctuation: this.fluctuation ? this.fluctuation.id : null,
      orders: this.orders,
      refreshTimer: this.refreshTimer,
      lastRefreshDay: this.lastRefreshDay,
      stats: this.stats
    };
  }

  loadData(data) {
    if (!data) return;
    if (data.merchant) {
      const found = Object.values(BLACK_MARKET_MERCHANTS).find(m => m.id === data.merchant);
      if (found) this.merchant = found;
    }
    if (data.fluctuation) {
      const found = BLACK_MARKET_FLUCTUATIONS.find(f => f.id === data.fluctuation);
      if (found) this.fluctuation = found;
    }
    if (data.orders) this.orders = data.orders;
    if (typeof data.refreshTimer === 'number') this.refreshTimer = data.refreshTimer;
    if (typeof data.lastRefreshDay === 'number') this.lastRefreshDay = data.lastRefreshDay;
    if (data.stats) this.stats = { ...this.stats, ...data.stats };
  }
}
