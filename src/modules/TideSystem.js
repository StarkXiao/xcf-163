export const TIDE_PHASES = {
  HIGH_TIDE: {
    id: 'high_tide',
    name: '满潮',
    icon: '🌊',
    desc: '海水上涨，深海生物浮出水面',
    duration: 60000,
    rarityWeights: { common: 0.7, uncommon: 1.0, rare: 1.3, epic: 1.6, legendary: 2.0 },
    energyCostMultiplier: 1.2,
    encounterRate: 1.0,
    color: 0x0066ff,
    bgTint: 0x001133
  },
  LOW_TIDE: {
    id: 'low_tide',
    name: '干潮',
    icon: '🏖️',
    desc: '海水退去，近海残骸暴露',
    duration: 60000,
    rarityWeights: { common: 1.5, uncommon: 1.2, rare: 0.9, epic: 0.6, legendary: 0.3 },
    energyCostMultiplier: 0.8,
    encounterRate: 1.0,
    color: 0xffaa00,
    bgTint: 0x332200
  },
  FLOOD_TIDE: {
    id: 'flood_tide',
    name: '涨潮',
    icon: '⬆️',
    desc: '潮水上涨，生物逐渐活跃',
    duration: 45000,
    rarityWeights: { common: 1.0, uncommon: 1.0, rare: 1.1, epic: 1.2, legendary: 1.3 },
    energyCostMultiplier: 1.0,
    encounterRate: 1.1,
    color: 0x00ccff,
    bgTint: 0x002244
  },
  EBB_TIDE: {
    id: 'ebb_tide',
    name: '落潮',
    icon: '⬇️',
    desc: '潮水退去，留下岸边宝物',
    duration: 45000,
    rarityWeights: { common: 1.2, uncommon: 1.1, rare: 1.0, epic: 0.9, legendary: 0.7 },
    energyCostMultiplier: 0.9,
    encounterRate: 1.0,
    color: 0xffcc66,
    bgTint: 0x222211
  },
  NEAP_TIDE: {
    id: 'neap_tide',
    name: '小潮',
    icon: '🌤️',
    desc: '潮汐平缓，风平浪静',
    duration: 50000,
    rarityWeights: { common: 1.1, uncommon: 1.0, rare: 1.0, epic: 1.0, legendary: 0.9 },
    energyCostMultiplier: 0.9,
    encounterRate: 0.9,
    color: 0x88ccff,
    bgTint: 0x111122
  },
  SPRING_TIDE: {
    id: 'spring_tide',
    name: '大潮',
    icon: '🌪️',
    desc: '潮汐汹涌，稀有生物涌现',
    duration: 50000,
    rarityWeights: { common: 0.8, uncommon: 0.9, rare: 1.2, epic: 1.5, legendary: 1.8 },
    energyCostMultiplier: 1.1,
    encounterRate: 1.2,
    color: 0x6644ff,
    bgTint: 0x110033
  },
  STORM_TIDE: {
    id: 'storm_tide',
    name: '风暴潮',
    icon: '⛈️',
    desc: '风暴来袭！危险与机遇并存',
    duration: 30000,
    rarityWeights: { common: 0.5, uncommon: 0.8, rare: 1.4, epic: 1.8, legendary: 2.5 },
    energyCostMultiplier: 1.5,
    encounterRate: 1.3,
    color: 0xff4444,
    bgTint: 0x220000
  },
  CALM_SEA: {
    id: 'calm_sea',
    name: '静海',
    icon: '🌙',
    desc: '海面平静，适合休息',
    duration: 40000,
    rarityWeights: { common: 1.3, uncommon: 1.1, rare: 0.9, epic: 0.7, legendary: 0.5 },
    energyCostMultiplier: 0.7,
    encounterRate: 0.7,
    color: 0x6688aa,
    bgTint: 0x0a0a1a
  }
};

const TIDE_CYCLE = [
  TIDE_PHASES.CALM_SEA,
  TIDE_PHASES.FLOOD_TIDE,
  TIDE_PHASES.HIGH_TIDE,
  TIDE_PHASES.SPRING_TIDE,
  TIDE_PHASES.EBB_TIDE,
  TIDE_PHASES.LOW_TIDE,
  TIDE_PHASES.NEAP_TIDE,
  TIDE_PHASES.STORM_TIDE
];

export class TideSystem {
  constructor(game) {
    this.game = game;
    this.currentPhase = TIDE_PHASES.CALM_SEA;
    this.phaseStartTime = Date.now();
    this.cycleIndex = 0;
    this.listeners = [];
    this.tideStats = {
      totalCatchesByTide: {},
      totalTimeByTide: {}
    };
    this.updateInterval = null;
  }

  init(savedData = null) {
    if (savedData) {
      if (savedData.currentPhaseId) {
        const phase = Object.values(TIDE_PHASES).find(p => p.id === savedData.currentPhaseId);
        if (phase) {
          this.currentPhase = phase;
        }
      }
      if (savedData.phaseStartTime) {
        this.phaseStartTime = savedData.phaseStartTime;
      }
      if (savedData.cycleIndex !== undefined) {
        this.cycleIndex = savedData.cycleIndex % TIDE_CYCLE.length;
      }
      if (savedData.tideStats) {
        this.tideStats = savedData.tideStats;
      }
    }

    this.startTicker();
    this.notifyListeners();
  }

  startTicker() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.updateInterval = setInterval(() => this.update(), 1000);
  }

  update() {
    const now = Date.now();
    const elapsed = now - this.phaseStartTime;

    if (elapsed >= this.currentPhase.duration) {
      this.advancePhase();
    }
  }

  advancePhase() {
    this.cycleIndex = (this.cycleIndex + 1) % TIDE_CYCLE.length;
    this.currentPhase = TIDE_CYCLE[this.cycleIndex];
    this.phaseStartTime = Date.now();

    if (!this.tideStats.totalTimeByTide[this.currentPhase.id]) {
      this.tideStats.totalTimeByTide[this.currentPhase.id] = 0;
    }

    this.notifyListeners();

    if (this.game && this.game.taskSystem) {
      this.game.taskSystem.checkTasks('tide_change', this.currentPhase);
    }

    if (this.game && this.game.mapScene) {
      this.game.mapScene.applyTideEffect(this.currentPhase);
    }
  }

  getCurrentPhase() {
    return this.currentPhase;
  }

  getPhaseRemainingTime() {
    const elapsed = Date.now() - this.phaseStartTime;
    return Math.max(0, this.currentPhase.duration - elapsed);
  }

  getPhaseProgress() {
    const elapsed = Date.now() - this.phaseStartTime;
    return Math.min(1, elapsed / this.currentPhase.duration);
  }

  getAdjustedRarityWeight(baseWeight, rarityKey) {
    const multiplier = this.currentPhase.rarityWeights[rarityKey] || 1.0;
    return baseWeight * multiplier;
  }

  getAdjustedEnergyCost(baseCost) {
    return Math.ceil(baseCost * this.currentPhase.energyCostMultiplier);
  }

  getAdjustedEncounterRate() {
    return this.currentPhase.encounterRate;
  }

  recordCatch() {
    const phaseId = this.currentPhase.id;
    if (!this.tideStats.totalCatchesByTide[phaseId]) {
      this.tideStats.totalCatchesByTide[phaseId] = 0;
    }
    this.tideStats.totalCatchesByTide[phaseId]++;
  }

  getCatchesInCurrentTide() {
    return this.tideStats.totalCatchesByTide[this.currentPhase.id] || 0;
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentPhase);
      } catch (e) {
        console.error('Tide listener error:', e);
      }
    });
  }

  toJSON() {
    return {
      currentPhaseId: this.currentPhase.id,
      phaseStartTime: this.phaseStartTime,
      cycleIndex: this.cycleIndex,
      tideStats: this.tideStats
    };
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.listeners = [];
  }
}
