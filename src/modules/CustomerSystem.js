import { CUSTOMER_TYPES, getRandomCustomer } from '../data/chamber.js';

export class CustomerSystem {
  constructor(game) {
    this.game = game;
    this.currentCustomer = null;
    this.customerPatienceRemaining = 0;
    this.servedHistory = [];
    this.reputation = 50;
    this.stats = {
      totalServed: 0,
      totalLost: 0,
      totalHaggled: 0,
      reputationPeak: 50
    };
  }

  getCurrentCustomer() {
    return this.currentCustomer;
  }

  getPatience() {
    return this.customerPatienceRemaining;
  }

  getReputation() {
    return this.reputation;
  }

  generateCustomer() {
    const type = getRandomCustomer();
    const patience = type.patience;
    this.currentCustomer = {
      ...type,
      arrivedAt: Date.now(),
      instanceId: `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      haggled: false
    };
    this.customerPatienceRemaining = patience;
    return this.currentCustomer;
  }

  tickPatience(deltaSeconds) {
    if (!this.currentCustomer) return false;
    this.customerPatienceRemaining -= deltaSeconds;
    if (this.customerPatienceRemaining <= 0) {
      this.loseCustomer();
      return true;
    }
    return false;
  }

  loseCustomer() {
    if (!this.currentCustomer) return;
    this.stats.totalLost++;
    this.adjustReputation(-2);
    this.servedHistory.push({
      customerId: this.currentCustomer.id,
      customerName: this.currentCustomer.name,
      outcome: 'lost',
      timestamp: Date.now()
    });
    if (this.servedHistory.length > 100) this.servedHistory.shift();
    this.currentCustomer = null;
    this.customerPatienceRemaining = 0;
  }

  serveCustomer(item, finalPrice) {
    if (!this.currentCustomer) return { success: false, message: '没有顾客' };
    const result = this.verifyItemMatchesPreference(item);
    if (!result.accept) {
      return { success: false, message: result.reason };
    }
    this.stats.totalServed++;
    this.adjustReputation(result.reputationDelta);
    this.servedHistory.push({
      customerId: this.currentCustomer.id,
      customerName: this.currentCustomer.name,
      outcome: 'served',
      itemId: item.id,
      itemName: item.name,
      price: finalPrice,
      reputationDelta: result.reputationDelta,
      timestamp: Date.now()
    });
    if (this.servedHistory.length > 100) this.servedHistory.shift();
    this.currentCustomer = null;
    this.customerPatienceRemaining = 0;
    return { success: true, message: `交易成功！获得 ${finalPrice} 金币`, reputationDelta: result.reputationDelta };
  }

  verifyItemMatchesPreference(item) {
    if (!this.currentCustomer) return { accept: false, reason: '没有顾客', reputationDelta: 0 };
    const c = this.currentCustomer;
    let repDelta = 0;
    const rarityName = item.rarity.name;
    if (c.dislikedRarities && c.dislikedRarities.includes(rarityName)) {
      return { accept: false, reason: `${c.name}不喜欢${item.rarity.name}品质的残骸`, reputationDelta: 0 };
    }
    if (c.preferredRarities && c.preferredRarities.length > 0 && !c.preferredRarities.includes(rarityName)) {
      repDelta -= 1;
    }
    if (c.preferredRarities && c.preferredRarities.includes(rarityName)) {
      repDelta += 2;
    }
    const affixes = item.affixes || [];
    if (c.preferredAffixCategories && c.preferredAffixCategories.length > 0) {
      if (affixes.length === 0) {
        repDelta -= 1;
      } else {
        const matchCount = affixes.filter(a => c.preferredAffixCategories.includes(a.category)).length;
        repDelta += matchCount;
      }
    }
    const tier = item.tier || 1;
    if (tier >= 3) repDelta += 1;
    if (tier >= 5) repDelta += 1;
    return { accept: true, reason: '', reputationDelta: repDelta };
  }

  haggle() {
    if (!this.currentCustomer) return { success: false, message: '没有顾客' };
    if (this.currentCustomer.haggled) return { success: false, message: '已经砍过价了' };
    this.currentCustomer.haggled = true;
    this.stats.totalHaggled++;
    const personality = this.currentCustomer.personality;
    let tipChange = 0;
    let patienceChange = 0;
    switch (personality) {
      case 'thrifty':
        tipChange = -0.03;
        patienceChange = -10;
        break;
      case 'fair':
        tipChange = 0;
        patienceChange = -5;
        break;
      case 'practical':
        tipChange = 0.02;
        patienceChange = -5;
        break;
      case 'discerning':
        tipChange = 0.05;
        patienceChange = -15;
        break;
      case 'lavish':
        tipChange = 0.10;
        patienceChange = -20;
        break;
      case 'eccentric':
        tipChange = Math.random() > 0.5 ? 0.08 : -0.05;
        patienceChange = -10;
        break;
      case 'impatient':
        tipChange = -0.05;
        patienceChange = -25;
        break;
      default:
        tipChange = 0;
        patienceChange = -5;
    }
    this.currentCustomer.tipMultiplier = Math.max(0, (this.currentCustomer.tipMultiplier || 0) + tipChange);
    this.customerPatienceRemaining = Math.max(5, this.customerPatienceRemaining + patienceChange);
    const sign = tipChange >= 0 ? '+' : '';
    return {
      success: true,
      message: `砍价结果：小费 ${sign}${(tipChange * 100).toFixed(0)}%，耐心 ${patienceChange}s`
    };
  }

  adjustReputation(delta) {
    this.reputation = Math.max(0, Math.min(100, this.reputation + delta));
    if (this.reputation > this.stats.reputationPeak) {
      this.stats.reputationPeak = this.reputation;
    }
  }

  getReputationTitle() {
    if (this.reputation >= 90) return '传奇商会';
    if (this.reputation >= 75) return '金字招牌';
    if (this.reputation >= 55) return '颇有口碑';
    if (this.reputation >= 30) return '小有名气';
    if (this.reputation >= 10) return '刚刚起步';
    return '臭名昭著';
  }

  dismissCustomer() {
    if (!this.currentCustomer) return;
    this.adjustReputation(-1);
    this.stats.totalLost++;
    this.currentCustomer = null;
    this.customerPatienceRemaining = 0;
  }

  toJSON() {
    return {
      reputation: this.reputation,
      stats: this.stats,
      servedHistory: this.servedHistory,
      currentCustomer: this.currentCustomer ? {
        id: this.currentCustomer.id,
        instanceId: this.currentCustomer.instanceId,
        haggled: this.currentCustomer.haggled,
        tipMultiplier: this.currentCustomer.tipMultiplier,
        patienceRemaining: this.customerPatienceRemaining
      } : null
    };
  }

  loadData(data) {
    if (data) {
      if (typeof data.reputation === 'number') this.reputation = data.reputation;
      if (data.stats) this.stats = { ...this.stats, ...data.stats };
      if (data.servedHistory) this.servedHistory = data.servedHistory;
      if (data.currentCustomer) {
        const type = Object.values(CUSTOMER_TYPES).find(t => t.id === data.currentCustomer.id);
        if (type) {
          this.currentCustomer = {
            ...type,
            instanceId: data.currentCustomer.instanceId,
            haggled: data.currentCustomer.haggled || false,
            tipMultiplier: data.currentCustomer.tipMultiplier ?? type.tipMultiplier,
            arrivedAt: Date.now()
          };
          this.customerPatienceRemaining = data.currentCustomer.patienceRemaining || type.patience;
        }
      }
    }
  }
}
