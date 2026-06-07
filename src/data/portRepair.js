export const REPAIR_MATERIALS = {
  steel_plate: {
    id: 'steel_plate',
    name: '合金钢板',
    icon: '🛡️',
    desc: '用于修复船体耐久',
    rarity: { name: '普通', class: 'rarity-common', color: 0xaaaaaa, weight: 100 },
    basePrice: 30,
    repairType: 'hull',
    repairAmount: 20
  },
  nano_wire: {
    id: 'nano_wire',
    name: '纳米缆绳',
    icon: '🧵',
    desc: '用于修补拖网损耗',
    rarity: { name: '优秀', class: 'rarity-uncommon', color: 0x44ff44, weight: 60 },
    basePrice: 80,
    repairType: 'net',
    repairAmount: 25
  },
  power_cell: {
    id: 'power_cell',
    name: '能量电芯',
    icon: '🔋',
    desc: '用于降低电池负载',
    rarity: { name: '稀有', class: 'rarity-rare', color: 0x4488ff, weight: 30 },
    basePrice: 200,
    repairType: 'battery',
    repairAmount: 30
  },
  advanced_alloy: {
    id: 'advanced_alloy',
    name: '高级合金',
    icon: '⚙️',
    desc: '高级船体修复材料',
    rarity: { name: '史诗', class: 'rarity-epic', color: 0xaa44ff, weight: 10 },
    basePrice: 500,
    repairType: 'hull',
    repairAmount: 60
  },
  quantum_net: {
    id: 'quantum_net',
    name: '量子纤维',
    icon: '🕸️',
    desc: '用于完全修复网具损耗',
    rarity: { name: '史诗', class: 'rarity-epic', color: 0xaa44ff, weight: 10 },
    basePrice: 600,
    repairType: 'net',
    repairAmount: 80
  },
  fusion_core: {
    id: 'fusion_core',
    name: '聚变核心',
    icon: '⚡',
    desc: '完全修复电池负载',
    rarity: { name: '传说', class: 'rarity-legendary', color: 0xffaa00, weight: 5 },
    basePrice: 1500,
    repairType: 'battery',
    repairAmount: 100
  }
};

export const REPAIR_UPGRADES = {
  repair_speed: {
    id: 'repair_speed',
    name: '维修速度',
    icon: '🔧',
    desc: '提升维修效率，每次维修恢复更多',
    maxLevel: 5,
    baseCost: 500,
    effectPerLevel: 0.1
  },
  repair_discount: {
    id: 'repair_discount',
    name: '材料折扣',
    icon: '💰',
    desc: '降低维修材料的商店价格',
    maxLevel: 5,
    baseCost: 800,
    effectPerLevel: 0.08
  },
  max_hull: {
    id: 'max_hull',
    name: '船体强化',
    icon: '🛡️',
    desc: '提升船体最大耐久度',
    maxLevel: 5,
    baseCost: 600,
    effectPerLevel: 20
  },
  max_net: {
    id: 'max_net',
    name: '网具强化',
    icon: '🎣',
    desc: '提升网具最大耐久度',
    maxLevel: 5,
    baseCost: 700,
    effectPerLevel: 20
  },
  max_battery: {
    id: 'max_battery',
    name: '电池扩容',
    icon: '🔋',
    desc: '提升电池最大容量',
    maxLevel: 5,
    baseCost: 900,
    effectPerLevel: 20
  },
  auto_repair: {
    id: 'auto_repair',
    name: '自动维修',
    icon: '🤖',
    desc: '每次打捞后自动小幅恢复',
    maxLevel: 3,
    baseCost: 2000,
    effectPerLevel: 5
  }
};

export const REPAIR_TYPES = {
  hull: {
    id: 'hull',
    name: '船体耐久',
    icon: '🛡️',
    desc: '船体耐久低于阈值时，打捞效率下降，遭遇战斗时额外受伤',
    catchPenaltyThreshold: 0.5,
    catchPenaltyPerPercent: 0.005,
    minCatchRate: 0.4,
    battleDamageMultiplier: 1.5
  },
  net: {
    id: 'net',
    name: '网具损耗',
    icon: '🎣',
    desc: '网具损耗影响捕获率和稀有度加成',
    catchPenaltyThreshold: 0.4,
    catchPenaltyPerPercent: 0.008,
    rarityPenaltyPerPercent: 0.003,
    minRarityBoost: 0.6
  },
  battery: {
    id: 'battery',
    name: '电池负载',
    icon: '🔋',
    desc: '电池负载过高会增加能量消耗，降低恢复速度',
    energyPenaltyThreshold: 0.3,
    energyCostPerPercent: 0.006,
    regenPenaltyPerPercent: 0.004,
    maxEnergyCostMultiplier: 2.0
  }
};

export function getRepairMaterial(id) {
  return REPAIR_MATERIALS[id] || null;
}

export function getAllRepairMaterials() {
  return Object.values(REPAIR_MATERIALS);
}

export function getMaterialsByType(type) {
  return Object.values(REPAIR_MATERIALS).filter(m => m.repairType === type);
}

export function getRepairUpgradeCost(upgradeId, currentLevel) {
  const upgrade = REPAIR_UPGRADES[upgradeId];
  if (!upgrade) return Infinity;
  return Math.floor(upgrade.baseCost * Math.pow(1.7, currentLevel));
}

export function getRepairUpgradeEffect(upgradeId, level) {
  const upgrade = REPAIR_UPGRADES[upgradeId];
  if (!upgrade) return 0;
  return upgrade.effectPerLevel * level;
}

export function calculateCatchEfficiencyPenalty(hullPercent, netPercent) {
  const hullType = REPAIR_TYPES.hull;
  const netType = REPAIR_TYPES.net;
  let penalty = 1.0;

  if (hullPercent < hullType.catchPenaltyThreshold) {
    const penaltyPercent = (hullType.catchPenaltyThreshold - hullPercent) * 100;
    penalty *= Math.max(hullType.minCatchRate, 1 - penaltyPercent * hullType.catchPenaltyPerPercent);
  }

  if (netPercent < netType.catchPenaltyThreshold) {
    const penaltyPercent = (netType.catchPenaltyThreshold - netPercent) * 100;
    penalty *= Math.max(netType.minCatchRate || 0.5, 1 - penaltyPercent * netType.catchPenaltyPerPercent);
  }

  return penalty;
}

export function calculateRarityPenalty(netPercent) {
  const netType = REPAIR_TYPES.net;
  if (netPercent >= netType.catchPenaltyThreshold) return 1.0;
  const penaltyPercent = (netType.catchPenaltyThreshold - netPercent) * 100;
  return Math.max(netType.minRarityBoost, 1 - penaltyPercent * netType.rarityPenaltyPerPercent);
}

export function calculateEnergyCostPenalty(batteryPercent) {
  const batteryType = REPAIR_TYPES.battery;
  if (batteryPercent >= batteryType.energyPenaltyThreshold) return 1.0;
  const penaltyPercent = (batteryType.energyPenaltyThreshold - batteryPercent) * 100;
  return Math.min(batteryType.maxEnergyCostMultiplier, 1 + penaltyPercent * batteryType.energyCostPerPercent);
}

export function calculateEnergyRegenPenalty(batteryPercent) {
  const batteryType = REPAIR_TYPES.battery;
  if (batteryPercent >= batteryType.energyPenaltyThreshold) return 1.0;
  const penaltyPercent = (batteryType.energyPenaltyThreshold - batteryPercent) * 100;
  return Math.max(0.3, 1 - penaltyPercent * batteryType.regenPenaltyPerPercent);
}

export function calculateBattleDamageMultiplier(hullPercent) {
  const hullType = REPAIR_TYPES.hull;
  if (hullPercent >= hullType.catchPenaltyThreshold) return 1.0;
  return hullType.battleDamageMultiplier;
}
