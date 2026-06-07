import { RARITY } from './creatures.js';

export const HULL_MOD_CATEGORIES = {
  net: { name: '拖网', icon: '🎣', desc: '决定拖网范围和捕获能力' },
  core: { name: '动力核心', icon: '💠', desc: '决定能量恢复和效率' }
};

export const HULL_NETS = {
  basic_net: {
    id: 'basic_net',
    name: '基础拖网',
    icon: '🎣',
    category: 'net',
    rarity: RARITY.COMMON,
    tier: 1,
    price: 0,
    desc: '渔港标配的拖网，中规中矩。',
    stats: {
      netRange: 1.0,
      catchRate: 1.0,
      rarityBoost: {}
    }
  },
  wide_net: {
    id: 'wide_net',
    name: '宽口拖网',
    icon: '🕸️',
    category: 'net',
    rarity: RARITY.UNCOMMON,
    tier: 2,
    price: 800,
    desc: '加宽网口设计，覆盖范围更大，但网眼较疏。',
    stats: {
      netRange: 1.4,
      catchRate: 0.9,
      rarityBoost: {}
    }
  },
  precision_net: {
    id: 'precision_net',
    name: '精准拖网',
    icon: '🔍',
    category: 'net',
    rarity: RARITY.UNCOMMON,
    tier: 2,
    price: 1000,
    desc: '高密度网眼，能有效留住稀有残骸。',
    stats: {
      netRange: 0.9,
      catchRate: 1.1,
      rarityBoost: {
        rare: 1.15
      }
    }
  },
  deep_sea_net: {
    id: 'deep_sea_net',
    name: '深海拖网',
    icon: '🌊',
    category: 'net',
    rarity: RARITY.RARE,
    tier: 3,
    price: 3000,
    desc: '特制深海拖网，能抵达普通拖网无法企及的深度。',
    stats: {
      netRange: 1.2,
      catchRate: 1.05,
      rarityBoost: {
        rare: 1.25,
        epic: 1.2
      }
    }
  },
  quantum_net: {
    id: 'quantum_net',
    name: '量子拖网',
    icon: '🌀',
    category: 'net',
    rarity: RARITY.EPIC,
    tier: 4,
    price: 8000,
    desc: '利用量子纠缠原理制成的拖网，能同时存在于多个位置。',
    stats: {
      netRange: 1.6,
      catchRate: 1.15,
      rarityBoost: {
        rare: 1.3,
        epic: 1.3,
        legendary: 1.2
      }
    }
  },
  abyss_net: {
    id: 'abyss_net',
    name: '深渊拖网',
    icon: '🌌',
    category: 'net',
    rarity: RARITY.LEGENDARY,
    tier: 5,
    price: 25000,
    desc: '来自数据深渊的神秘拖网，传说能捞起沉眠于最深处的传说残骸。',
    stats: {
      netRange: 2.0,
      catchRate: 1.25,
      rarityBoost: {
        rare: 1.4,
        epic: 1.5,
        legendary: 1.8
      }
    }
  }
};

export const HULL_CORES = {
  basic_core: {
    id: 'basic_core',
    name: '基础动力核心',
    icon: '🔋',
    category: 'core',
    rarity: RARITY.COMMON,
    tier: 1,
    price: 0,
    desc: '渔港标配的动力核心，稳定可靠。',
    stats: {
      energyRegenRate: 1.0,
      energyCostMultiplier: 1.0,
      maxEnergyBonus: 0
    }
  },
  efficient_core: {
    id: 'efficient_core',
    name: '节能动力核心',
    icon: '⚡',
    category: 'core',
    rarity: RARITY.UNCOMMON,
    tier: 2,
    price: 800,
    desc: '优化能耗设计，拖网消耗更低。',
    stats: {
      energyRegenRate: 1.0,
      energyCostMultiplier: 0.85,
      maxEnergyBonus: 0
    }
  },
  fast_charge_core: {
    id: 'fast_charge_core',
    name: '快充动力核心',
    icon: '💡',
    category: 'core',
    rarity: RARITY.UNCOMMON,
    tier: 2,
    price: 1000,
    desc: '快速充能设计，能量恢复速度显著提升。',
    stats: {
      energyRegenRate: 1.5,
      energyCostMultiplier: 1.0,
      maxEnergyBonus: 0
    }
  },
  high_capacity_core: {
    id: 'high_capacity_core',
    name: '高容动力核心',
    icon: '🔌',
    category: 'core',
    rarity: RARITY.RARE,
    tier: 3,
    price: 2500,
    desc: '大容量设计，能量上限大幅提高。',
    stats: {
      energyRegenRate: 1.1,
      energyCostMultiplier: 0.95,
      maxEnergyBonus: 50
    }
  },
  plasma_core: {
    id: 'plasma_core',
    name: '等离子核心',
    icon: '🔥',
    category: 'core',
    rarity: RARITY.EPIC,
    tier: 4,
    price: 7500,
    desc: '等离子聚变核心，同时具备高效能和高容量。',
    stats: {
      energyRegenRate: 1.8,
      energyCostMultiplier: 0.8,
      maxEnergyBonus: 30
    }
  },
  void_core: {
    id: 'void_core',
    name: '虚空核心',
    icon: '🌀',
    category: 'core',
    rarity: RARITY.LEGENDARY,
    tier: 5,
    price: 25000,
    desc: '从虚空中汲取能量的神秘装置，近乎无限的能源。',
    stats: {
      energyRegenRate: 2.5,
      energyCostMultiplier: 0.7,
      maxEnergyBonus: 100
    }
  }
};

export const ALL_HULL_MODS = { ...HULL_NETS, ...HULL_CORES };

export function getHullModById(id) {
  return ALL_HULL_MODS[id];
}

export function getHullNets() {
  return Object.values(HULL_NETS);
}

export function getHullCores() {
  return Object.values(HULL_CORES);
}

export function getModsByCategory(category) {
  if (category === 'net') return getHullNets();
  if (category === 'core') return getHullCores();
  return [];
}

export function calculateNetRange(equippedNet) {
  if (!equippedNet) return 1.0;
  return equippedNet.stats?.netRange || 1.0;
}

export function calculateCatchRate(equippedNet) {
  if (!equippedNet) return 1.0;
  return equippedNet.stats?.catchRate || 1.0;
}

export function calculateNetRarityBoost(equippedNet, rarityKey) {
  if (!equippedNet || !equippedNet.stats?.rarityBoost) return 1.0;
  return equippedNet.stats.rarityBoost[rarityKey] || 1.0;
}

export function calculateEnergyRegenRate(equippedCore) {
  if (!equippedCore) return 1.0;
  return equippedCore.stats?.energyRegenRate || 1.0;
}

export function calculateEnergyCostMultiplier(equippedCore) {
  if (!equippedCore) return 1.0;
  return equippedCore.stats?.energyCostMultiplier || 1.0;
}

export function calculateMaxEnergyBonus(equippedCore) {
  if (!equippedCore) return 0;
  return equippedCore.stats?.maxEnergyBonus || 0;
}
