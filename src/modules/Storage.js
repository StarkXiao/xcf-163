const STORAGE_KEY = 'cyber_harbor_save';
const CHAMBER_CYCLE_KEY_PREFIX = 'cyber_harbor_cycle_';
const CHAMBER_META_KEY = 'cyber_harbor_chamber_meta';
const EXPEDITION_KEY_PREFIX = 'cyber_harbor_expedition_';
const EXPEDITION_META_KEY = 'cyber_harbor_expedition_meta';
const RUINS_KEY_PREFIX = 'cyber_harbor_ruins_';
const RUINS_META_KEY = 'cyber_harbor_ruins_meta';
const SEASON_KEY_PREFIX = 'cyber_harbor_season_';
const SEASON_META_KEY = 'cyber_harbor_season_meta';
const AUCTION_KEY_PREFIX = 'cyber_harbor_auction_';
const AUCTION_META_KEY = 'cyber_harbor_auction_meta';
const GUILD_KEY_PREFIX = 'cyber_harbor_guild_';
const GUILD_META_KEY = 'cyber_harbor_guild_meta';

export class Storage {
  static save(data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, json);
      return true;
    } catch (e) {
      console.error('保存失败:', e);
      return false;
    }
  }

  static load() {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) return null;
      return JSON.parse(json);
    } catch (e) {
      console.error('读取失败:', e);
      return null;
    }
  }

  static clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('清除失败:', e);
      return false;
    }
  }

  static hasSave() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  static saveCycle(cycleId, data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(CHAMBER_CYCLE_KEY_PREFIX + cycleId, json);
      const meta = this.getChamberMeta();
      if (!meta.cycleHistory.includes(cycleId)) {
        meta.cycleHistory.unshift(cycleId);
        meta.cycleHistory = meta.cycleHistory.slice(0, 20);
      }
      meta.lastCycleId = cycleId;
      meta.updatedAt = Date.now();
      localStorage.setItem(CHAMBER_META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) {
      console.error('周目保存失败:', e);
      return false;
    }
  }

  static loadCycle(cycleId) {
    try {
      const json = localStorage.getItem(CHAMBER_CYCLE_KEY_PREFIX + cycleId);
      if (!json) return null;
      return JSON.parse(json);
    } catch (e) {
      console.error('周目读取失败:', e);
      return null;
    }
  }

  static deleteCycle(cycleId) {
    try {
      localStorage.removeItem(CHAMBER_CYCLE_KEY_PREFIX + cycleId);
      const meta = this.getChamberMeta();
      meta.cycleHistory = meta.cycleHistory.filter(id => id !== cycleId);
      if (meta.lastCycleId === cycleId) {
        meta.lastCycleId = meta.cycleHistory[0] || null;
      }
      localStorage.setItem(CHAMBER_META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) {
      console.error('周目删除失败:', e);
      return false;
    }
  }

  static listCycles() {
    const meta = this.getChamberMeta();
    const cycles = [];
    meta.cycleHistory.forEach(id => {
      try {
        const json = localStorage.getItem(CHAMBER_CYCLE_KEY_PREFIX + id);
        if (json) {
          const data = JSON.parse(json);
          cycles.push({
            id,
            summary: data.summary || {},
            startedAt: data.startedAt,
            endedAt: data.endedAt || null,
            completed: !!data.endedAt
          });
        }
      } catch (e) {
      }
    });
    return cycles;
  }

  static getChamberMeta() {
    try {
      const json = localStorage.getItem(CHAMBER_META_KEY);
      if (!json) {
        return { cycleHistory: [], lastCycleId: null, updatedAt: null };
      }
      return JSON.parse(json);
    } catch (e) {
      return { cycleHistory: [], lastCycleId: null, updatedAt: null };
    }
  }

  static clearAllCycles() {
    try {
      const meta = this.getChamberMeta();
      meta.cycleHistory.forEach(id => {
        localStorage.removeItem(CHAMBER_CYCLE_KEY_PREFIX + id);
      });
      localStorage.removeItem(CHAMBER_META_KEY);
      return true;
    } catch (e) {
      console.error('清除周目失败:', e);
      return false;
    }
  }

  static generateCycleId() {
    return `cycle_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  static saveExpedition(expeditionId, data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(EXPEDITION_KEY_PREFIX + expeditionId, json);
      const meta = this.getExpeditionMeta();
      if (!meta.history.includes(expeditionId)) {
        meta.history.unshift(expeditionId);
        meta.history = meta.history.slice(0, 20);
      }
      meta.lastExpeditionId = expeditionId;
      meta.updatedAt = Date.now();
      localStorage.setItem(EXPEDITION_META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) {
      console.error('远征保存失败:', e);
      return false;
    }
  }

  static loadExpedition(expeditionId) {
    try {
      const json = localStorage.getItem(EXPEDITION_KEY_PREFIX + expeditionId);
      if (!json) return null;
      return JSON.parse(json);
    } catch (e) {
      console.error('远征读取失败:', e);
      return null;
    }
  }

  static deleteExpedition(expeditionId) {
    try {
      localStorage.removeItem(EXPEDITION_KEY_PREFIX + expeditionId);
      const meta = this.getExpeditionMeta();
      meta.history = meta.history.filter(id => id !== expeditionId);
      if (meta.lastExpeditionId === expeditionId) {
        meta.lastExpeditionId = meta.history[0] || null;
      }
      localStorage.setItem(EXPEDITION_META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) {
      console.error('远征删除失败:', e);
      return false;
    }
  }

  static listExpeditions() {
    const meta = this.getExpeditionMeta();
    const expeditions = [];
    meta.history.forEach(id => {
      try {
        const json = localStorage.getItem(EXPEDITION_KEY_PREFIX + id);
        if (json) {
          const data = JSON.parse(json);
          expeditions.push({
            id,
            routeId: data.routeId,
            routeName: data.routeName,
            routeIcon: data.routeIcon,
            startedAt: data.startedAt,
            endedAt: data.endedAt || null,
            completed: !!data.completed,
            returnedEarly: data.returnedEarly,
            daysTravelled: data.daysTravelled,
            earnings: data.earnings || 0,
            wrecksFound: data.wrecksFound || 0,
            creaturesCaught: data.creaturesCaught || 0,
            finalHull: data.finalHull || 0
          });
        }
      } catch (e) {
      }
    });
    return expeditions;
  }

  static getExpeditionMeta() {
    try {
      const json = localStorage.getItem(EXPEDITION_META_KEY);
      if (!json) {
        return { history: [], lastExpeditionId: null, updatedAt: null };
      }
      return JSON.parse(json);
    } catch (e) {
      return { history: [], lastExpeditionId: null, updatedAt: null };
    }
  }

  static clearAllExpeditions() {
    try {
      const meta = this.getExpeditionMeta();
      meta.history.forEach(id => {
        localStorage.removeItem(EXPEDITION_KEY_PREFIX + id);
      });
      localStorage.removeItem(EXPEDITION_META_KEY);
      return true;
    } catch (e) {
      console.error('清除远征记录失败:', e);
      return false;
    }
  }

  static generateExpeditionId() {
    return `exp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  static saveRuinsDive(diveId, data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(RUINS_KEY_PREFIX + diveId, json);
      const meta = this.getRuinsMeta();
      if (!meta.history.includes(diveId)) {
        meta.history.unshift(diveId);
        meta.history = meta.history.slice(0, 20);
      }
      meta.lastDiveId = diveId;
      meta.updatedAt = Date.now();
      localStorage.setItem(RUINS_META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) {
      console.error('废墟潜航保存失败:', e);
      return false;
    }
  }

  static loadRuinsDive(diveId) {
    try {
      const json = localStorage.getItem(RUINS_KEY_PREFIX + diveId);
      if (!json) return null;
      return JSON.parse(json);
    } catch (e) {
      console.error('废墟潜航读取失败:', e);
      return null;
    }
  }

  static deleteRuinsDive(diveId) {
    try {
      localStorage.removeItem(RUINS_KEY_PREFIX + diveId);
      const meta = this.getRuinsMeta();
      meta.history = meta.history.filter(id => id !== diveId);
      if (meta.lastDiveId === diveId) {
        meta.lastDiveId = meta.history[0] || null;
      }
      localStorage.setItem(RUINS_META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) {
      console.error('废墟潜航删除失败:', e);
      return false;
    }
  }

  static listRuinsDives() {
    const meta = this.getRuinsMeta();
    const dives = [];
    meta.history.forEach(id => {
      try {
        const json = localStorage.getItem(RUINS_KEY_PREFIX + id);
        if (json) {
          const data = JSON.parse(json);
          dives.push({
            id,
            tierId: data.tierId,
            tierName: data.tierName,
            tierIcon: data.tierIcon,
            startedAt: data.startedAt,
            endedAt: data.endedAt || null,
            completed: !!data.completed,
            emergencyEvac: data.emergencyEvac,
            depth: data.depth,
            earnings: data.earnings || 0,
            enemiesDefeated: data.enemiesDefeated || 0,
            puzzlesSolved: data.puzzlesSolved || 0,
            treasuresFound: data.treasuresFound || 0
          });
        }
      } catch (e) {
      }
    });
    return dives;
  }

  static getRuinsMeta() {
    try {
      const json = localStorage.getItem(RUINS_META_KEY);
      if (!json) {
        return { history: [], lastDiveId: null, updatedAt: null };
      }
      return JSON.parse(json);
    } catch (e) {
      return { history: [], lastDiveId: null, updatedAt: null };
    }
  }

  static clearAllRuinsDives() {
    try {
      const meta = this.getRuinsMeta();
      meta.history.forEach(id => {
        localStorage.removeItem(RUINS_KEY_PREFIX + id);
      });
      localStorage.removeItem(RUINS_META_KEY);
      return true;
    } catch (e) {
      console.error('清除废墟潜航记录失败:', e);
      return false;
    }
  }

  static generateRuinsDiveId() {
    return `ruins_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  static saveSeasonSettlement(settlementId, data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(SEASON_KEY_PREFIX + settlementId, json);
      const meta = this.getSeasonMeta();
      if (!meta.history.includes(settlementId)) {
        meta.history.unshift(settlementId);
        meta.history = meta.history.slice(0, 24);
      }
      meta.lastSettlementId = settlementId;
      meta.updatedAt = Date.now();
      localStorage.setItem(SEASON_META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) {
      console.error('赛季结算保存失败:', e);
      return false;
    }
  }

  static loadSeasonSettlement(settlementId) {
    try {
      const json = localStorage.getItem(SEASON_KEY_PREFIX + settlementId);
      if (!json) return null;
      return JSON.parse(json);
    } catch (e) {
      console.error('赛季结算读取失败:', e);
      return null;
    }
  }

  static deleteSeasonSettlement(settlementId) {
    try {
      localStorage.removeItem(SEASON_KEY_PREFIX + settlementId);
      const meta = this.getSeasonMeta();
      meta.history = meta.history.filter(id => id !== settlementId);
      if (meta.lastSettlementId === settlementId) {
        meta.lastSettlementId = meta.history[0] || null;
      }
      localStorage.setItem(SEASON_META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) {
      console.error('赛季结算删除失败:', e);
      return false;
    }
  }

  static listSeasonSettlements() {
    const meta = this.getSeasonMeta();
    const settlements = [];
    meta.history.forEach(id => {
      try {
        const json = localStorage.getItem(SEASON_KEY_PREFIX + id);
        if (json) {
          const data = JSON.parse(json);
          settlements.push({
            id,
            weekNumber: data.weekNumber,
            themeId: data.themeId,
            themeName: data.themeName,
            themeIcon: data.themeIcon,
            startedAt: data.startedAt,
            endedAt: data.endedAt,
            finalScore: data.finalScore,
            rewardTier: data.rewardTier,
            rewardTierName: data.rewardTierName,
            totalCoinsEarned: data.totalCoinsEarned,
            totalEnergyEarned: data.totalEnergyEarned,
            creaturesCaught: data.creaturesCaught,
            newCreatures: data.newCreatures,
            portCommissions: data.portCommissions,
            portRank: data.portRank,
            portRankName: data.portRankName
          });
        }
      } catch (e) {
      }
    });
    return settlements;
  }

  static getSeasonMeta() {
    try {
      const json = localStorage.getItem(SEASON_META_KEY);
      if (!json) {
        return { history: [], lastSettlementId: null, updatedAt: null };
      }
      return JSON.parse(json);
    } catch (e) {
      return { history: [], lastSettlementId: null, updatedAt: null };
    }
  }

  static clearAllSeasonSettlements() {
    try {
      const meta = this.getSeasonMeta();
      meta.history.forEach(id => {
        localStorage.removeItem(SEASON_KEY_PREFIX + id);
      });
      localStorage.removeItem(SEASON_META_KEY);
      return true;
    } catch (e) {
      console.error('清除赛季记录失败:', e);
      return false;
    }
  }

  static generateSeasonId() {
    return `season_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  static saveAuctionRecord(recordId, data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(AUCTION_KEY_PREFIX + recordId, json);
      const meta = this.getAuctionMeta();
      if (!meta.history.includes(recordId)) {
        meta.history.unshift(recordId);
        meta.history = meta.history.slice(0, 50);
      }
      meta.lastRecordId = recordId;
      meta.updatedAt = Date.now();
      localStorage.setItem(AUCTION_META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) {
      console.error('拍卖记录保存失败:', e);
      return false;
    }
  }

  static loadAuctionRecord(recordId) {
    try {
      const json = localStorage.getItem(AUCTION_KEY_PREFIX + recordId);
      if (!json) return null;
      return JSON.parse(json);
    } catch (e) {
      console.error('拍卖记录读取失败:', e);
      return null;
    }
  }

  static deleteAuctionRecord(recordId) {
    try {
      localStorage.removeItem(AUCTION_KEY_PREFIX + recordId);
      const meta = this.getAuctionMeta();
      meta.history = meta.history.filter(id => id !== recordId);
      if (meta.lastRecordId === recordId) {
        meta.lastRecordId = meta.history[0] || null;
      }
      localStorage.setItem(AUCTION_META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) {
      console.error('拍卖记录删除失败:', e);
      return false;
    }
  }

  static listAuctionRecords() {
    const meta = this.getAuctionMeta();
    const records = [];
    meta.history.forEach(id => {
      try {
        const json = localStorage.getItem(AUCTION_KEY_PREFIX + id);
        if (json) {
          const data = JSON.parse(json);
          records.push({
            id,
            type: data.type,
            creatureId: data.creatureId,
            creatureName: data.creatureName,
            creatureIcon: data.creatureIcon,
            creatureRarity: data.creatureRarity,
            finalPrice: data.finalPrice,
            won: data.won,
            sold: data.sold,
            createdAt: data.createdAt,
            settledAt: data.settledAt || null
          });
        }
      } catch (e) {
      }
    });
    return records;
  }

  static getAuctionMeta() {
    try {
      const json = localStorage.getItem(AUCTION_META_KEY);
      if (!json) {
        return { history: [], lastRecordId: null, updatedAt: null };
      }
      return JSON.parse(json);
    } catch (e) {
      return { history: [], lastRecordId: null, updatedAt: null };
    }
  }

  static clearAllAuctionRecords() {
    try {
      const meta = this.getAuctionMeta();
      meta.history.forEach(id => {
        localStorage.removeItem(AUCTION_KEY_PREFIX + id);
      });
      localStorage.removeItem(AUCTION_META_KEY);
      return true;
    } catch (e) {
      console.error('清除拍卖记录失败:', e);
      return false;
    }
  }

  static generateAuctionRecordId() {
    return `auction_rec_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  static saveGuildSettlement(settlementId, data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(GUILD_KEY_PREFIX + settlementId, json);
      const meta = this.getGuildMeta();
      if (!meta.history.includes(settlementId)) {
        meta.history.unshift(settlementId);
        meta.history = meta.history.slice(0, 24);
      }
      meta.lastSettlementId = settlementId;
      meta.updatedAt = Date.now();
      localStorage.setItem(GUILD_META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) {
      console.error('公会结算保存失败:', e);
      return false;
    }
  }

  static loadGuildSettlement(settlementId) {
    try {
      const json = localStorage.getItem(GUILD_KEY_PREFIX + settlementId);
      if (!json) return null;
      return JSON.parse(json);
    } catch (e) {
      console.error('公会结算读取失败:', e);
      return null;
    }
  }

  static deleteGuildSettlement(settlementId) {
    try {
      localStorage.removeItem(GUILD_KEY_PREFIX + settlementId);
      const meta = this.getGuildMeta();
      meta.history = meta.history.filter(id => id !== settlementId);
      if (meta.lastSettlementId === settlementId) {
        meta.lastSettlementId = meta.history[0] || null;
      }
      localStorage.setItem(GUILD_META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) {
      console.error('公会结算删除失败:', e);
      return false;
    }
  }

  static listGuildSettlements() {
    const meta = this.getGuildMeta();
    const settlements = [];
    meta.history.forEach(id => {
      try {
        const json = localStorage.getItem(GUILD_KEY_PREFIX + id);
        if (json) {
          const data = JSON.parse(json);
          settlements.push({
            id,
            weekNumber: data.weekNumber,
            level: data.level,
            completedGoals: data.completedGoals || 0,
            commissionsCompleted: data.commissionsCompleted || 0,
            coinsEarned: data.coinsEarned || 0,
            energyEarned: data.energyEarned || 0,
            endedAt: data.endedAt
          });
        }
      } catch (e) {
      }
    });
    return settlements;
  }

  static getGuildMeta() {
    try {
      const json = localStorage.getItem(GUILD_META_KEY);
      if (!json) {
        return { history: [], lastSettlementId: null, updatedAt: null };
      }
      return JSON.parse(json);
    } catch (e) {
      return { history: [], lastSettlementId: null, updatedAt: null };
    }
  }

  static clearAllGuildSettlements() {
    try {
      const meta = this.getGuildMeta();
      meta.history.forEach(id => {
        localStorage.removeItem(GUILD_KEY_PREFIX + id);
      });
      localStorage.removeItem(GUILD_META_KEY);
      return true;
    } catch (e) {
      console.error('清除公会记录失败:', e);
      return false;
    }
  }

  static generateGuildId() {
    return `guild_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }
}
