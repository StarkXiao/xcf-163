import { CREATURES, RARITY } from '../data/creatures.js';
import { ORDER_TEMPLATES, getEligibleOrderTemplates, getRandomCustomer } from '../data/chamber.js';

export class OrderSystem {
  constructor(game) {
    this.game = game;
    this.orders = [];
    this.completedHistory = [];
    this.stats = {
      totalCreated: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalRewardCoins: 0
    };
  }

  getMaxSlots() {
    if (this.game.stallSystem) {
      return this.game.stallSystem.getTotalOrderSlots();
    }
    return 2;
  }

  getActiveOrders() {
    return this.orders.filter(o => o.status === 'active');
  }

  generateOrder() {
    const maxSlots = this.getMaxSlots();
    if (this.getActiveOrders().length >= maxSlots) {
      return null;
    }
    const stallLevels = {};
    if (this.game.stallSystem) {
      Object.keys(this.game.stallSystem.stalls).forEach(k => {
        stallLevels[k] = this.game.stallSystem.getLevel(k);
      });
    }
    const templates = getEligibleOrderTemplates(stallLevels);
    if (templates.length === 0) return null;
    const template = templates[Math.floor(Math.random() * templates.length)];
    const customer = getRandomCustomer();
    const quantity = Math.floor(Math.random() * (template.maxQuantity - template.minQuantity + 1)) + template.minQuantity;
    const allowedCreatures = CREATURES.filter(c =>
      template.rarityFilter.includes(c.rarity.name)
    );
    const targetCreature = allowedCreatures.length > 0
      ? allowedCreatures[Math.floor(Math.random() * allowedCreatures.length)]
      : null;
    const baseReward = targetCreature
      ? targetCreature.value * quantity * template.rewardMult
      : 50 * quantity * template.rewardMult;
    const bonusMult = 1 + (customer.tipMultiplier || 0);
    const finalReward = Math.floor(baseReward * bonusMult);
    const order = {
      id: `ord_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      templateId: template.id,
      templateName: template.name,
      customer: {
        id: customer.id,
        name: customer.name,
        icon: customer.icon
      },
      targetCreatureId: targetCreature ? targetCreature.id : null,
      targetCreatureName: targetCreature ? targetCreature.name : null,
      targetCreatureIcon: targetCreature ? targetCreature.icon : null,
      targetRarity: targetCreature ? targetCreature.rarity.name : template.rarityFilter[0],
      requiredQuantity: quantity,
      currentQuantity: 0,
      requireAffixes: template.requireAffixes || false,
      minTier: template.minTier || 1,
      reward: finalReward,
      rewardMult: template.rewardMult,
      timeLimit: template.timeLimit,
      timeRemaining: template.timeLimit,
      status: 'active',
      createdAt: Date.now()
    };
    this.orders.push(order);
    this.stats.totalCreated++;
    return order;
  }

  tick(deltaSeconds) {
    let expired = 0;
    this.orders.forEach(order => {
      if (order.status === 'active') {
        order.timeRemaining -= deltaSeconds;
        if (order.timeRemaining <= 0) {
          order.status = 'failed';
          this.stats.totalFailed++;
          expired++;
        }
      }
    });
    this.cleanupOld();
    return expired;
  }

  cleanupOld() {
    const now = Date.now();
    this.orders = this.orders.filter(o => o.status === 'active' || (now - o.createdAt < 120000));
    if (this.completedHistory.length > 50) {
      this.completedHistory = this.completedHistory.slice(-50);
    }
  }

  tryFulfillWithBackpackItem(item, inventoryIndex) {
    const eligibleOrders = this.orders.filter(o => o.status === 'active' && this.itemMatchesOrder(item, o));
    if (eligibleOrders.length === 0) {
      return { success: false, message: '没有匹配的订单' };
    }
    const order = eligibleOrders[0];
    const backpackItem = this.game.inventory.backpack[inventoryIndex];
    if (!backpackItem) return { success: false, message: '物品不存在' };
    const useCount = Math.min(backpackItem.count, order.requiredQuantity - order.currentQuantity);
    if (backpackItem.count > useCount) {
      backpackItem.count -= useCount;
    } else {
      this.game.inventory.backpack.splice(inventoryIndex, 1);
    }
    order.currentQuantity += useCount;
    if (order.currentQuantity >= order.requiredQuantity) {
      return this.completeOrder(order.id);
    }
    this.game.saveProgress();
    this.game.inventory.renderBackpack();
    return {
      success: true,
      message: `订单进度：${order.currentQuantity}/${order.requiredQuantity}`,
      orderId: order.id,
      partial: true
    };
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

  completeOrder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: '订单不存在' };
    if (order.status !== 'active') return { success: false, message: '订单状态异常' };
    order.status = 'completed';
    order.completedAt = Date.now();
    this.stats.totalCompleted++;
    this.stats.totalRewardCoins += order.reward;
    this.game.updateStats('coins', order.reward);
    if (this.game.customerSystem) {
      this.game.customerSystem.adjustReputation(3);
    }
    this.completedHistory.push({
      id: order.id,
      name: order.templateName,
      reward: order.reward,
      completedAt: order.completedAt
    });
    this.game.saveProgress();
    this.game.checkTasks('order_complete');
    return {
      success: true,
      message: `订单完成！获得 ${order.reward} 金币奖励`,
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
      this.game.customerSystem.adjustReputation(-3);
    }
    this.game.saveProgress();
    return { success: true, message: '订单已取消，声望下降' };
  }

  findMatchingOrdersForItem(item) {
    return this.orders.filter(o => o.status === 'active' && this.itemMatchesOrder(item, o));
  }

  toJSON() {
    return {
      orders: this.orders.map(o => ({
        ...o
      })),
      completedHistory: this.completedHistory,
      stats: this.stats
    };
  }

  loadData(data) {
    if (data) {
      if (data.orders) this.orders = data.orders;
      if (data.completedHistory) this.completedHistory = data.completedHistory;
      if (data.stats) this.stats = { ...this.stats, ...data.stats };
    }
  }
}
