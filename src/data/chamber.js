import { RARITY, CREATURES } from './creatures.js';

export const STALL_TYPES = {
  SCRAP: {
    id: 'scrap',
    name: '废料摊位',
    icon: '🔩',
    desc: '出售普通和优秀品质的机械残骸',
    baseUnlockCost: 0,
    allowedRarities: [RARITY.COMMON.name, RARITY.UNCOMMON.name],
    maxLevel: 5,
    priceMultiplierBonus: 0.05,
    orderSlotBonus: 0
  },
  REFINERY: {
    id: 'refinery',
    name: '精炼摊位',
    icon: '⚗️',
    desc: '出售稀有品质的机械残骸',
    baseUnlockCost: 500,
    allowedRarities: [RARITY.RARE.name],
    maxLevel: 5,
    priceMultiplierBonus: 0.08,
    orderSlotBonus: 1
  },
  BOUTIQUE: {
    id: 'boutique',
    name: '精品摊位',
    icon: '💎',
    desc: '出售史诗品质的机械残骸',
    baseUnlockCost: 2000,
    allowedRarities: [RARITY.EPIC.name],
    maxLevel: 5,
    priceMultiplierBonus: 0.10,
    orderSlotBonus: 1
  },
  LEGENDARY: {
    id: 'legendary',
    name: '传说摊位',
    icon: '👑',
    desc: '出售传说品质的机械残骸',
    baseUnlockCost: 10000,
    allowedRarities: [RARITY.LEGENDARY.name],
    maxLevel: 5,
    priceMultiplierBonus: 0.15,
    orderSlotBonus: 2
  },
  AUCTION: {
    id: 'auction',
    name: '拍卖摊位',
    icon: '🏛️',
    desc: '接受全品类特殊订单，奖励更丰厚',
    baseUnlockCost: 5000,
    allowedRarities: null,
    maxLevel: 5,
    priceMultiplierBonus: 0.20,
    orderSlotBonus: 2
  }
};

export function getStallUpgradeCost(stallType, currentLevel) {
  const type = STALL_TYPES[stallType];
  if (!type) return { coins: Infinity, materials: [] };
  const baseCoins = {
    SCRAP: 100,
    REFINERY: 300,
    BOUTIQUE: 800,
    LEGENDARY: 2000,
    AUCTION: 1500
  }[stallType] || 100;
  const coins = Math.floor(baseCoins * Math.pow(1.8, currentLevel - 1));
  return { coins, materials: [] };
}

export const CUSTOMER_TYPES = {
  SCAVENGER: {
    id: 'scavenger',
    name: '拾荒者',
    icon: '🧑‍🔧',
    desc: '只买便宜货，对普通残骸有偏好',
    preferredRarities: [RARITY.COMMON.name],
    dislikedRarities: [RARITY.EPIC.name, RARITY.LEGENDARY.name],
    preferredAffixCategories: [],
    patience: 60,
    tipMultiplier: 0.05,
    personality: 'thrifty'
  },
  TECHNICIAN: {
    id: 'technician',
    name: '机械技师',
    icon: '👨‍🔧',
    desc: '需要优秀和稀有残骸做零件，偏好拆解词条',
    preferredRarities: [RARITY.UNCOMMON.name, RARITY.RARE.name],
    dislikedRarities: [],
    preferredAffixCategories: ['defense'],
    patience: 90,
    tipMultiplier: 0.10,
    personality: 'practical'
  },
  MERCHANT: {
    id: 'merchant',
    name: '行商',
    icon: '🧔',
    desc: '什么都要，但只出公道价',
    preferredRarities: [RARITY.COMMON.name, RARITY.UNCOMMON.name, RARITY.RARE.name],
    dislikedRarities: [],
    preferredAffixCategories: ['utility'],
    patience: 75,
    tipMultiplier: 0.08,
    personality: 'fair'
  },
  COLLECTOR: {
    id: 'collector',
    name: '收藏家',
    icon: '👩‍🎨',
    desc: '专收稀有以上，愿意为词条溢价',
    preferredRarities: [RARITY.RARE.name, RARITY.EPIC.name],
    dislikedRarities: [RARITY.COMMON.name],
    preferredAffixCategories: ['attack', 'luck'],
    patience: 120,
    tipMultiplier: 0.20,
    personality: 'discerning'
  },
  MEGACORP: {
    id: 'megacorp',
    name: '巨型企业',
    icon: '🏢',
    desc: '只要传说品质，不计代价',
    preferredRarities: [RARITY.LEGENDARY.name],
    dislikedRarities: [RARITY.COMMON.name, RARITY.UNCOMMON.name],
    preferredAffixCategories: ['attack', 'luck'],
    patience: 180,
    tipMultiplier: 0.30,
    personality: 'lavish'
  },
  HACKER: {
    id: 'hacker',
    name: '数据黑客',
    icon: '🥷',
    desc: '喜欢带词条的所有品质，偏爱稀有',
    preferredRarities: [RARITY.RARE.name],
    dislikedRarities: [],
    preferredAffixCategories: ['luck', 'attack', 'defense', 'utility'],
    patience: 80,
    tipMultiplier: 0.15,
    personality: 'eccentric'
  },
  SMUGGLER: {
    id: 'smuggler',
    name: '黑市走私者',
    icon: '🦹',
    desc: '出价狠但交易快，偏好史诗品质',
    preferredRarities: [RARITY.EPIC.name],
    dislikedRarities: [RARITY.COMMON.name],
    preferredAffixCategories: ['attack'],
    patience: 45,
    tipMultiplier: 0.25,
    personality: 'impatient'
  }
};

export const CUSTOMER_WEIGHTS = {
  SCAVENGER: 25,
  TECHNICIAN: 20,
  MERCHANT: 20,
  COLLECTOR: 15,
  HACKER: 10,
  SMUGGLER: 7,
  MEGACORP: 3
};

export function getRandomCustomer() {
  const entries = Object.entries(CUSTOMER_WEIGHTS);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, weight] of entries) {
    r -= weight;
    if (r <= 0) return CUSTOMER_TYPES[key];
  }
  return CUSTOMER_TYPES.SCAVENGER;
}

export const PRICE_MODIFIERS = {
  MARKET_BULL: { id: 'bull', name: '牛市', icon: '📈', priceMult: 1.30, desc: '市场繁荣，所有残骸涨价30%' },
  MARKET_BEAR: { id: 'bear', name: '熊市', icon: '📉', priceMult: 0.75, desc: '市场低迷，所有残骸跌价25%' },
  MARKET_NORMAL: { id: 'normal', name: '平稳', icon: '➡️', priceMult: 1.0, desc: '市场平稳' },
  RARITY_BOOM_COMMON: { id: 'boom_common', name: '废料热销', icon: '🔥', priceMult: 1.5, rarity: RARITY.COMMON.name, desc: '普通残骸价格暴涨50%' },
  RARITY_BOOM_UNCOMMON: { id: 'boom_uncommon', name: '零件紧俏', icon: '🔥', priceMult: 1.5, rarity: RARITY.UNCOMMON.name, desc: '优秀残骸价格暴涨50%' },
  RARITY_BOOM_RARE: { id: 'boom_rare', name: '稀有追捧', icon: '🔥', priceMult: 1.5, rarity: RARITY.RARE.name, desc: '稀有残骸价格暴涨50%' },
  RARITY_BOOM_EPIC: { id: 'boom_epic', name: '史诗风潮', icon: '🔥', priceMult: 1.5, rarity: RARITY.EPIC.name, desc: '史诗残骸价格暴涨50%' },
  RARITY_BOOM_LEGENDARY: { id: 'boom_legendary', name: '传说狂热', icon: '🔥', priceMult: 1.5, rarity: RARITY.LEGENDARY.name, desc: '传说残骸价格暴涨50%' }
};

export function getRandomMarketModifier() {
  const roll = Math.random();
  if (roll < 0.1) return PRICE_MODIFIERS.MARKET_BULL;
  if (roll < 0.2) return PRICE_MODIFIERS.MARKET_BEAR;
  if (roll < 0.3) {
    const booms = [
      PRICE_MODIFIERS.RARITY_BOOM_COMMON,
      PRICE_MODIFIERS.RARITY_BOOM_UNCOMMON,
      PRICE_MODIFIERS.RARITY_BOOM_RARE,
      PRICE_MODIFIERS.RARITY_BOOM_EPIC,
      PRICE_MODIFIERS.RARITY_BOOM_LEGENDARY
    ];
    return booms[Math.floor(Math.random() * booms.length)];
  }
  return PRICE_MODIFIERS.MARKET_NORMAL;
}

export const ORDER_TEMPLATES = [
  {
    id: 'tpl_single_common',
    name: '单个普通残骸',
    minQuantity: 1,
    maxQuantity: 3,
    rarityFilter: [RARITY.COMMON.name],
    rewardMult: 1.1,
    timeLimit: 120,
    minStallLevel: 1
  },
  {
    id: 'tpl_single_uncommon',
    name: '单个优秀残骸',
    minQuantity: 1,
    maxQuantity: 2,
    rarityFilter: [RARITY.UNCOMMON.name],
    rewardMult: 1.2,
    timeLimit: 150,
    minStallLevel: 1
  },
  {
    id: 'tpl_bulk_scrap',
    name: '批量废料采购',
    minQuantity: 5,
    maxQuantity: 10,
    rarityFilter: [RARITY.COMMON.name],
    rewardMult: 1.3,
    timeLimit: 240,
    minStallLevel: 2
  },
  {
    id: 'tpl_rare_specific',
    name: '稀有残骸求购',
    minQuantity: 1,
    maxQuantity: 2,
    rarityFilter: [RARITY.RARE.name],
    rewardMult: 1.4,
    timeLimit: 200,
    minStallLevel: 2
  },
  {
    id: 'tpl_mixed_haul',
    name: '混合货物',
    minQuantity: 3,
    maxQuantity: 6,
    rarityFilter: [RARITY.COMMON.name, RARITY.UNCOMMON.name],
    rewardMult: 1.25,
    timeLimit: 180,
    minStallLevel: 2
  },
  {
    id: 'tpl_epic_find',
    name: '史诗级订单',
    minQuantity: 1,
    maxQuantity: 1,
    rarityFilter: [RARITY.EPIC.name],
    rewardMult: 1.6,
    timeLimit: 300,
    minStallLevel: 3
  },
  {
    id: 'tpl_affix_hunt',
    name: '词条收藏家',
    minQuantity: 2,
    maxQuantity: 4,
    rarityFilter: [RARITY.UNCOMMON.name, RARITY.RARE.name],
    requireAffixes: true,
    rewardMult: 1.5,
    timeLimit: 220,
    minStallLevel: 3
  },
  {
    id: 'tpl_tier_upgrade',
    name: '高阶品求购',
    minQuantity: 1,
    maxQuantity: 2,
    rarityFilter: [RARITY.RARE.name, RARITY.EPIC.name],
    minTier: 2,
    rewardMult: 1.7,
    timeLimit: 280,
    minStallLevel: 4
  },
  {
    id: 'tpl_legendary_quest',
    name: '传说级委托',
    minQuantity: 1,
    maxQuantity: 1,
    rarityFilter: [RARITY.LEGENDARY.name],
    rewardMult: 2.0,
    timeLimit: 600,
    minStallLevel: 5
  }
];

export function getEligibleOrderTemplates(stallLevels) {
  return ORDER_TEMPLATES.filter(t => {
    const maxLevel = Math.max(...Object.values(stallLevels || {}), 0);
    return maxLevel >= t.minStallLevel;
  });
}

export const CYCLE_LENGTH_SECONDS = 300;
export const MARKET_CHANGE_INTERVAL = 60;
export const CUSTOMER_ARRIVAL_INTERVAL = 20;

export const DAILY_BONUSES = [
  { id: 'd1', name: '开市大吉', desc: '首日经营奖励', coins: 200 },
  { id: 'd3', name: '三日之约', desc: '连续经营3天', coins: 500 },
  { id: 'd7', name: '一周传奇', desc: '连续经营7天', coins: 1500 },
  { id: 'd30', name: '商会支柱', desc: '连续经营30天', coins: 10000 }
];
