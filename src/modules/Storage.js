const STORAGE_KEY = 'cyber_harbor_save';
const CHAMBER_CYCLE_KEY_PREFIX = 'cyber_harbor_cycle_';
const CHAMBER_META_KEY = 'cyber_harbor_chamber_meta';
const EXPEDITION_KEY_PREFIX = 'cyber_harbor_expedition_';
const EXPEDITION_META_KEY = 'cyber_harbor_expedition_meta';

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
}
