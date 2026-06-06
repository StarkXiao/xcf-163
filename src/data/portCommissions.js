import { RARITY, CREATURES, getRarityKey } from './creatures.js';
import { PART_CATEGORIES } from './scrapWorkshop.js';

export const COMMISSION_RARITY_WEIGHTS = {
  [RARITY.COMMON.name]: 40,
  [RARITY.UNCOMMON.name]: 35,
  [RARITY.RARE.name]: 18,
  [RARITY.EPIC.name]: 6,
  [RARITY.LEGENDARY.name]: 1
};

export const CREATURE_CATEGORIES = {
  fish_like: {
    name: '鱼类残骸',
    icon: '🐟',
    desc: '各种鱼形机械生命体',
    creatureIds: ['robot_fish', 'rusty_eel', 'laser_squid', 'void_angler', 'dimension_eel']
  },
  crustacean: {
    name: '甲壳类残骸',
    icon: '🦀',
    desc: '螃蟹、虾、龙虾等带甲壳的机械',
    creatureIds: ['scrap_crab', 'cyber_shrimp', 'time_lobster']
  },
  mollusk: {
    name: '软体类残骸',
    icon: '🐙',
    desc: '章鱼、水母、蜗牛等软体机械',
    creatureIds: ['metal_jelly', 'bolt_snail', 'plasma_octopus', 'nuclear_clam']
  },
  reptile: {
    name: '爬行类残骸',
    icon: '🐢',
    desc: '龟、蛇等爬行形态机械',
    creatureIds: ['circuit_turtle']
  },
  giant: {
    name: '巨型残骸',
    icon: '🐋',
    desc: '鲸、鲨等大型海洋机械',
    creatureIds: ['hologram_whale', 'quantum_shark', 'ai_leviathan', 'star_whale']
  },
  swarm: {
    name: '集群类残骸',
    icon: '✨',
    desc: '纳米集群、特殊形态机械',
    creatureIds: ['nano_swarm', 'soul_server']
  }
};

export const COMMISSION_PHASE_CONFIG = {
  phaseCount: {
    [RARITY.COMMON.name]: 2,
    [RARITY.UNCOMMON.name]: 3,
    [RARITY.RARE.name]: 3,
    [RARITY.EPIC.name]: 4,
    [RARITY.LEGENDARY.name]: 5
  },
  rewardMultiplierPerPhase: {
    [RARITY.COMMON.name]: [1.0, 1.5],
    [RARITY.UNCOMMON.name]: [1.0, 1.3, 1.8],
    [RARITY.RARE.name]: [1.0, 1.4, 2.0],
    [RARITY.EPIC.name]: [1.0, 1.3, 1.8, 2.5],
    [RARITY.LEGENDARY.name]: [1.0, 1.2, 1.6, 2.2, 3.0]
  }
};

export const COMMISSION_TEMPLATES = [
  {
    id: 'commission_simple',
    name: '简单回收',
    desc: '回收指定类型的机械残骸',
    minRarity: RARITY.COMMON,
    categoryBias: null
  },
  {
    id: 'commission_quality',
    name: '品质回收',
    desc: '回收指定品质以上的机械残骸',
    minRarity: RARITY.UNCOMMON,
    categoryBias: null
  },
  {
    id: 'commission_category',
    name: '分类回收',
    desc: '回收指定类别的机械残骸',
    minRarity: RARITY.COMMON,
    categoryBias: true
  },
  {
    id: 'commission_collection',
    name: '图鉴委托',
    desc: '收集新的机械残骸种类',
    minRarity: RARITY.RARE,
    categoryBias: null,
    requireNew: true
  },
  {
    id: 'commission_premium',
    name: '高级委托',
    desc: '回收高价值稀有机械残骸',
    minRarity: RARITY.EPIC,
    categoryBias: null
  },
  {
    id: 'commission_legendary',
    name: '传说委托',
    desc: '寻找传说级别的机械残骸',
    minRarity: RARITY.LEGENDARY,
    categoryBias: null
  }
];

function getCommissionRarity(playerLevel = 1) {
  const entries = Object.entries(COMMISSION_RARITY_WEIGHTS);
  let totalWeight = 0;
  const adjustedWeights = {};

  for (const [rarityName, baseWeight] of entries) {
    let weight = baseWeight;
    if (playerLevel > 1) {
      const levelBonus = Math.min(playerLevel * 0.05, 0.5);
      if (rarityName === RARITY.RARE.name) weight *= (1 + levelBonus);
      if (rarityName === RARITY.EPIC.name) weight *= (1 + levelBonus * 1.5);
      if (rarityName === RARITY.LEGENDARY.name) weight *= (1 + levelBonus * 2);
    }
    adjustedWeights[rarityName] = weight;
    totalWeight += weight;
  }

  let random = Math.random() * totalWeight;
  for (const [rarityName, weight] of entries) {
    random -= adjustedWeights[rarityName];
    if (random <= 0) {
      return Object.values(RARITY).find(r => r.name === rarityName);
    }
  }
  return RARITY.COMMON;
}

function getRandomCategory() {
  const categoryKeys = Object.keys(CREATURE_CATEGORIES);
  return CREATURE_CATEGORIES[categoryKeys[Math.floor(Math.random() * categoryKeys.length)]];
}

function getCreaturesByRarityAndCategory(rarity, category) {
  return CREATURES.filter(c => {
    if (c.rarity.name !== rarity.name) return false;
    if (category && !category.creatureIds.includes(c.id)) return false;
    return true;
  });
}

export function generateCommissionPhases(rarity, category, collection) {
  const phaseCount = COMMISSION_PHASE_CONFIG.phaseCount[rarity.name] || 2;
  const phases = [];
  const usedCreatureIds = new Set();

  for (let i = 0; i < phaseCount; i++) {
    const phaseRarity = i === phaseCount - 1 && rarity !== RARITY.LEGENDARY
      ? upgradeRarity(rarity)
      : rarity;

    let availableCreatures = getCreaturesByRarityAndCategory(phaseRarity, category);
    availableCreatures = availableCreatures.filter(c => !usedCreatureIds.has(c.id));

    if (availableCreatures.length === 0) {
      availableCreatures = getCreaturesByRarityAndCategory(phaseRarity, null);
      availableCreatures = availableCreatures.filter(c => !usedCreatureIds.has(c.id));
    }

    if (availableCreatures.length === 0) {
      availableCreatures = CREATURES.filter(c => c.rarity.name === phaseRarity.name);
    }

    const targetCreature = availableCreatures[Math.floor(Math.random() * availableCreatures.length)];
    if (targetCreature) {
      usedCreatureIds.add(targetCreature.id);
    }

    const baseQuantity = i === phaseCount - 1 ? 1 : Math.max(1, 3 - i);
    const quantity = Math.max(1, baseQuantity + Math.floor(Math.random() * 2));

    const requireNew = i >= Math.floor(phaseCount / 2) && rarity !== RARITY.COMMON;

    const baseReward = targetCreature
      ? targetCreature.value * quantity
      : 50 * quantity;
    const phaseMult = COMMISSION_PHASE_CONFIG.rewardMultiplierPerPhase[rarity.name][i] || 1.0;
    const bonusMult = 1 + i * 0.2;

    phases.push({
      phaseIndex: i,
      targetCreatureId: targetCreature ? targetCreature.id : null,
      targetCreatureName: targetCreature ? targetCreature.name : null,
      targetCreatureIcon: targetCreature ? targetCreature.icon : null,
      targetRarity: phaseRarity.name,
      targetCategory: category ? category.name : null,
      targetCategoryIcon: category ? category.icon : null,
      requiredQuantity: quantity,
      currentQuantity: 0,
      requireNew: requireNew,
      baseReward: Math.floor(baseReward * phaseMult * bonusMult),
      coinReward: Math.floor(baseReward * phaseMult * bonusMult),
      energyReward: i === phaseCount - 1 ? 20 + i * 10 : 0,
      status: i === 0 ? 'active' : 'locked'
    });
  }

  return phases;
}

function upgradeRarity(rarity) {
  const rarityOrder = [RARITY.COMMON, RARITY.UNCOMMON, RARITY.RARE, RARITY.EPIC, RARITY.LEGENDARY];
  const idx = rarityOrder.findIndex(r => r.name === rarity.name);
  return rarityOrder[Math.min(idx + 1, rarityOrder.length - 1)];
}

export function generateCommission(playerLevel = 1, collection = new Set()) {
  const rarity = getCommissionRarity(playerLevel);
  const eligibleTemplates = COMMISSION_TEMPLATES.filter(t =>
    t.minRarity.weight >= rarity.weight
  );
  const template = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)];

  const useCategory = template.categoryBias || (Math.random() < 0.4);
  const category = useCategory ? getRandomCategory() : null;

  const phases = generateCommissionPhases(rarity, category, collection);

  const totalCoinReward = phases.reduce((sum, p) => sum + p.coinReward, 0);
  const totalEnergyReward = phases.reduce((sum, p) => sum + p.energyReward, 0);

  const categoryText = category
    ? `${category.icon} ${category.name}`
    : '全类型';

  return {
    id: `port_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    templateId: template.id,
    templateName: template.name,
    templateDesc: template.desc,
    rarity: rarity.name,
    rarityClass: rarity.class,
    rarityColor: rarity.color,
    category: category ? category.name : null,
    categoryIcon: category ? category.icon : null,
    targetText: `${categoryText} · ${rarity.name}以上`,
    phases: phases,
    currentPhase: 0,
    totalCoinReward: totalCoinReward,
    totalEnergyReward: totalEnergyReward,
    status: 'active',
    createdAt: Date.now(),
    claimed: false
  };
}

export function getCategoryCreatures(categoryName) {
  const category = Object.values(CREATURE_CATEGORIES).find(c => c.name === categoryName);
  if (!category) return [];
  return CREATURES.filter(c => category.creatureIds.includes(c.id));
}
