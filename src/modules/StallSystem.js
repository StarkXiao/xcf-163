import { STALL_TYPES, getStallUpgradeCost } from '../data/chamber.js';

export class StallSystem {
  constructor(game) {
    this.game = game;
    this.stalls = {};
    this.stats = {
      totalUpgrades: 0,
      totalUnlocked: 1
    };
    this.initDefaultStalls();
  }

  initDefaultStalls() {
    Object.keys(STALL_TYPES).forEach(key => {
      const type = STALL_TYPES[key];
      if (!this.stalls[key]) {
        this.stalls[key] = {
          unlocked: type.baseUnlockCost === 0,
          level: type.baseUnlockCost === 0 ? 1 : 0
        };
      }
    });
  }

  getStallInfo(stallKey) {
    const type = STALL_TYPES[stallKey];
    const state = this.stalls[stallKey];
    if (!type || !state) return null;
    return {
      ...type,
      ...state,
      isUnlocked: state.unlocked,
      currentLevel: state.level,
      maxLevel: type.maxLevel,
      canUpgrade: state.unlocked && state.level < type.maxLevel,
      upgradeCost: getStallUpgradeCost(stallKey, state.level),
      unlockCost: type.baseUnlockCost,
      priceBonus: state.level * type.priceMultiplierBonus,
      orderSlotBonus: state.level > 0 ? Math.floor((state.level - 1) / 2) + type.orderSlotBonus : 0
    };
  }

  getAllStalls() {
    return Object.keys(STALL_TYPES).map(key => this.getStallInfo(key)).filter(Boolean);
  }

  isUnlocked(stallKey) {
    return this.stalls[stallKey]?.unlocked || false;
  }

  getLevel(stallKey) {
    return this.stalls[stallKey]?.level || 0;
  }

  getTotalOrderSlots() {
    let slots = 2;
    Object.keys(this.stalls).forEach(key => {
      const info = this.getStallInfo(key);
      if (info && info.isUnlocked) {
        slots += info.orderSlotBonus;
      }
    });
    return slots;
  }

  getAveragePriceBonus() {
    let total = 0;
    let count = 0;
    Object.keys(this.stalls).forEach(key => {
      const info = this.getStallInfo(key);
      if (info && info.isUnlocked) {
        total += info.priceBonus;
        count++;
      }
    });
    return count > 0 ? total / count : 0;
  }

  unlockStall(stallKey) {
    const type = STALL_TYPES[stallKey];
    const state = this.stalls[stallKey];
    if (!type || !state) return { success: false, message: '摊位不存在' };
    if (state.unlocked) return { success: false, message: '摊位已解锁' };

    const cost = type.baseUnlockCost;
    if (this.game.stats.coins < cost) {
      return { success: false, message: `金币不足！需要 ${cost} 金币` };
    }

    this.game.updateStats('coins', -cost);
    state.unlocked = true;
    state.level = 1;
    this.stats.totalUnlocked++;
    this.game.saveProgress();
    this.game.checkTasks('stall_unlock');
    return { success: true, message: `${type.name} 解锁成功！` };
  }

  upgradeStall(stallKey) {
    const info = this.getStallInfo(stallKey);
    if (!info) return { success: false, message: '摊位不存在' };
    if (!info.isUnlocked) return { success: false, message: '请先解锁摊位' };
    if (!info.canUpgrade) return { success: false, message: '已达最高等级' };

    const cost = info.upgradeCost;
    if (this.game.stats.coins < cost.coins) {
      return { success: false, message: `金币不足！需要 ${cost.coins} 金币` };
    }

    this.game.updateStats('coins', -cost.coins);
    this.stalls[stallKey].level++;
    this.stats.totalUpgrades++;
    this.game.saveProgress();
    this.game.checkTasks('stall_upgrade');
    return {
      success: true,
      message: `${info.name} 升级到 Lv.${this.stalls[stallKey].level}！`
    };
  }

  findBestStallForRarity(rarityName) {
    const candidates = Object.keys(STALL_TYPES)
      .map(key => this.getStallInfo(key))
      .filter(s => s && s.isUnlocked && (s.allowedRarities === null || s.allowedRarities.includes(rarityName)));
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.priceBonus - a.priceBonus);
    return candidates[0];
  }

  toJSON() {
    return {
      stalls: this.stalls,
      stats: this.stats
    };
  }

  loadData(data) {
    if (data) {
      if (data.stalls) {
        Object.keys(data.stalls).forEach(key => {
          if (this.stalls[key]) {
            this.stalls[key] = { ...this.stalls[key], ...data.stalls[key] };
          }
        });
      }
      if (data.stats) {
        this.stats = { ...this.stats, ...data.stats };
      }
    }
  }
}
