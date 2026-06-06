import { calculateCreatureValue } from '../data/creatures.js';
import { PRICE_MODIFIERS, getRandomMarketModifier } from '../data/chamber.js';

export class PricingSystem {
  constructor(game) {
    this.game = game;
    this.currentModifier = PRICE_MODIFIERS.MARKET_NORMAL;
    this.priceHistory = [];
    this.stats = {
      totalSales: 0,
      totalRevenue: 0,
      highestSale: 0,
      modifierChanges: 0
    };
  }

  getCurrentModifier() {
    return this.currentModifier;
  }

  setModifier(modifier) {
    this.currentModifier = modifier || PRICE_MODIFIERS.MARKET_NORMAL;
    this.stats.modifierChanges++;
    this.priceHistory.push({
      modifierId: this.currentModifier.id,
      timestamp: Date.now()
    });
    if (this.priceHistory.length > 50) this.priceHistory.shift();
  }

  randomizeModifier() {
    const newMod = getRandomMarketModifier();
    this.setModifier(newMod);
    return newMod;
  }

  calculateBasePrice(item) {
    const tier = item.tier || 1;
    const affixes = item.affixes || [];
    return calculateCreatureValue(item, tier, affixes);
  }

  calculateMarketMultiplier(item) {
    const mod = this.currentModifier;
    let mult = 1;
    if (mod.rarity) {
      if (item.rarity.name === mod.rarity) {
        mult *= mod.priceMult;
      }
    } else {
      mult *= mod.priceMult;
    }
    return mult;
  }

  calculateStallMultiplier(item) {
    if (!this.game.stallSystem) return 1;
    const stall = this.game.stallSystem.findBestStallForRarity(item.rarity.name);
    if (!stall) return 1;
    return 1 + stall.priceBonus;
  }

  calculateCustomerMultiplier(item, customer) {
    if (!customer) return 1;
    let mult = 1;
    const rarityName = item.rarity.name;
    if (customer.preferredRarities && customer.preferredRarities.includes(rarityName)) {
      mult *= 1.15;
    }
    if (customer.dislikedRarities && customer.dislikedRarities.includes(rarityName)) {
      mult *= 0.8;
    }
    const affixes = item.affixes || [];
    if (customer.preferredAffixCategories && customer.preferredAffixCategories.length > 0 && affixes.length > 0) {
      const matchCount = affixes.filter(a => customer.preferredAffixCategories.includes(a.category)).length;
      if (matchCount > 0) {
        mult *= 1 + matchCount * 0.1;
      }
    }
    if (customer.tipMultiplier) {
      mult *= 1 + customer.tipMultiplier;
    }
    return mult;
  }

  calculateFinalPrice(item, customer = null, stallBonus = true) {
    const base = this.calculateBasePrice(item);
    const marketMult = this.calculateMarketMultiplier(item);
    const stallMult = stallBonus ? this.calculateStallMultiplier(item) : 1;
    const customerMult = this.calculateCustomerMultiplier(item, customer);
    const finalPrice = Math.floor(base * marketMult * stallMult * customerMult);
    return {
      basePrice: base,
      marketMultiplier: marketMult,
      stallMultiplier: stallMult,
      customerMultiplier: customerMult,
      finalPrice: Math.max(1, finalPrice)
    };
  }

  recordSale(item, customer = null) {
    const price = this.calculateFinalPrice(item, customer);
    this.stats.totalSales++;
    this.stats.totalRevenue += price.finalPrice;
    if (price.finalPrice > this.stats.highestSale) {
      this.stats.highestSale = price.finalPrice;
    }
    return price;
  }

  getPriceBreakdownText(item, customer = null) {
    const p = this.calculateFinalPrice(item, customer);
    const parts = [`基础价: ${p.basePrice}`];
    if (p.marketMultiplier !== 1) {
      parts.push(`市场: x${p.marketMultiplier.toFixed(2)}`);
    }
    if (p.stallMultiplier !== 1) {
      parts.push(`摊位: x${p.stallMultiplier.toFixed(2)}`);
    }
    if (p.customerMultiplier !== 1) {
      parts.push(`顾客: x${p.customerMultiplier.toFixed(2)}`);
    }
    parts.push(`最终: ${p.finalPrice} 💰`);
    return parts.join(' | ');
  }

  toJSON() {
    return {
      currentModifier: this.currentModifier?.id,
      priceHistory: this.priceHistory,
      stats: this.stats
    };
  }

  loadData(data) {
    if (data) {
      if (data.currentModifier) {
        const mod = Object.values(PRICE_MODIFIERS).find(m => m.id === data.currentModifier);
        if (mod) this.currentModifier = mod;
      }
      if (data.priceHistory) this.priceHistory = data.priceHistory;
      if (data.stats) this.stats = { ...this.stats, ...data.stats };
    }
  }
}
