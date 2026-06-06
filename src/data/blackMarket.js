import { RARITY, CREATURES } from './creatures.js';

export const BLACK_MARKET_MERCHANTS = {
  FENCE: {
    id: 'fence',
    name: '鬼市掮客',
    icon: '🦹',
    desc: '什么都收，价低量多，专收普通和优秀品质。',
    preferredRarities: [RARITY.COMMON.name, RARITY.UNCOMMON.name],
    bonusRarity: RARITY.UNCOMMON.name,
    basePriceMult: 0.85,
    bonusMult: 1.3,
    personality: 'thrifty'
  },
  SMUGGLER: {
    id: 'smuggler',
    name: '深海走私者',
    icon: '🏴‍☠️',
    desc: '专收稀有和史诗，敢冒险就敢出价。',
    preferredRarities: [RARITY.RARE.name, RARITY.EPIC.name],
    bonusRarity: RARITY.EPIC.name,
    basePriceMult: 1.0,
    bonusMult: 1.5,
    personality: 'risky'
  },
  COLLECTOR: {
    id: 'collector',
    name: '神秘收藏家',
    icon: '🎭',
    desc: '只要传说品质，出价惊人，行踪诡秘。',
    preferredRarities: [RARITY.LEGENDARY.name],
    bonusRarity: RARITY.LEGENDARY.name,
    basePriceMult: 1.2,
    bonusMult: 2.0,
    personality: 'discerning'
  },
  ENGINEER: {
    id: 'engineer',
    name: '地下工程师',
    icon: '⚙️',
    desc: '带词条的残骸全部高价收购，尤其偏爱功能词条。',
    preferredRarities: [RARITY.RARE.name, RARITY.EPIC.name],
    bonusRarity: null,
    requireAffixes: true,
    basePriceMult: 1.1,
    bonusMult: 1.6,
    personality: 'technical'
  },
  HACKER: {
    id: 'hacker',
    name: '数据黑客',
    icon: '🥷',
    desc: '所有品质都要，但只出公道价，偶尔会出惊人高价。',
    preferredRarities: [RARITY.COMMON.name, RARITY.UNCOMMON.name, RARITY.RARE.name, RARITY.EPIC.name],
    bonusRarity: null,
    basePriceMult: 0.95,
    bonusMult: 1.2,
    luckyChance: 0.1,
    luckyMult: 3.0,
    personality: 'eccentric'
  }
};

export const BLACK_MARKET_MERCHANT_WEIGHTS = {
  FENCE: 30,
  SMUGGLER: 25,
  ENGINEER: 20,
  HACKER: 20,
  COLLECTOR: 5
};

export function getRandomBlackMarketMerchant() {
  const entries = Object.entries(BLACK_MARKET_MERCHANT_WEIGHTS);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, weight] of entries) {
    r -= weight;
    if (r <= 0) return BLACK_MARKET_MERCHANTS[key];
  }
  return BLACK_MARKET_MERCHANTS.FENCE;
}

export const BLACK_MARKET_ORDER_TEMPLATES = [
  {
    id: 'bm_bulk_common',
    name: '黑市大宗废料',
    minQuantity: 8,
    maxQuantity: 15,
    rarityFilter: [RARITY.COMMON.name],
    rewardMult: 1.5,
    timeLimit: 180,
    bonusCoins: 100
  },
  {
    id: 'bm_uncommon_batch',
    name: '黑市优质零件',
    minQuantity: 5,
    maxQuantity: 10,
    rarityFilter: [RARITY.UNCOMMON.name],
    rewardMult: 1.6,
    timeLimit: 200,
    bonusCoins: 200
  },
  {
    id: 'bm_rare_haul',
    name: '黑市稀有货物',
    minQuantity: 2,
    maxQuantity: 5,
    rarityFilter: [RARITY.RARE.name],
    rewardMult: 1.8,
    timeLimit: 240,
    bonusCoins: 500
  },
  {
    id: 'bm_epic_find',
    name: '黑市史诗委托',
    minQuantity: 1,
    maxQuantity: 2,
    rarityFilter: [RARITY.EPIC.name],
    rewardMult: 2.0,
    timeLimit: 300,
    bonusCoins: 1500
  },
  {
    id: 'bm_legendary_quest',
    name: '黑市传说交易',
    minQuantity: 1,
    maxQuantity: 1,
    rarityFilter: [RARITY.LEGENDARY.name],
    rewardMult: 2.5,
    timeLimit: 600,
    bonusCoins: 5000
  },
  {
    id: 'bm_affix_collection',
    name: '黑市词条收集',
    minQuantity: 3,
    maxQuantity: 6,
    rarityFilter: [RARITY.UNCOMMON.name, RARITY.RARE.name, RARITY.EPIC.name],
    requireAffixes: true,
    rewardMult: 1.9,
    timeLimit: 260,
    bonusCoins: 800
  },
  {
    id: 'bm_high_tier',
    name: '黑市高阶收购',
    minQuantity: 1,
    maxQuantity: 3,
    rarityFilter: [RARITY.RARE.name, RARITY.EPIC.name],
    minTier: 2,
    rewardMult: 2.2,
    timeLimit: 320,
    bonusCoins: 1200
  },
  {
    id: 'bm_mixed_cargo',
    name: '黑市混合货物',
    minQuantity: 6,
    maxQuantity: 12,
    rarityFilter: [RARITY.COMMON.name, RARITY.UNCOMMON.name, RARITY.RARE.name],
    rewardMult: 1.55,
    timeLimit: 220,
    bonusCoins: 400
  }
];

export function getRandomBlackMarketOrderTemplate() {
  return BLACK_MARKET_ORDER_TEMPLATES[Math.floor(Math.random() * BLACK_MARKET_ORDER_TEMPLATES.length)];
}

export const BLACK_MARKET_FLUCTUATIONS = [
  { id: 'boom', name: '黑市热潮', icon: '🔥', mult: 1.4, desc: '黑市需求暴涨，全部物品加价40%' },
  { id: 'normal', name: '平稳交易', icon: '➡️', mult: 1.0, desc: '黑市交易平稳' },
  { id: 'crash', name: '黑市萧条', icon: '📉', mult: 0.7, desc: '黑市严打，全部物品降价30%' },
  { id: 'rare_boom', name: '稀有追捧', icon: '💎', mult: 1.0, rarityBonus: RARITY.RARE.name, rarityMult: 1.8, desc: '稀有品质残骸加价80%' },
  { id: 'epic_craze', name: '史诗风潮', icon: '🌀', mult: 1.0, rarityBonus: RARITY.EPIC.name, rarityMult: 2.0, desc: '史诗品质残骸加价100%' },
  { id: 'legend_frenzy', name: '传说狂热', icon: '👑', mult: 1.0, rarityBonus: RARITY.LEGENDARY.name, rarityMult: 2.5, desc: '传说品质残骸加价150%' }
];

export function getRandomBlackMarketFluctuation() {
  const roll = Math.random();
  if (roll < 0.15) return BLACK_MARKET_FLUCTUATIONS[0];
  if (roll < 0.25) return BLACK_MARKET_FLUCTUATIONS[2];
  if (roll < 0.40) return BLACK_MARKET_FLUCTUATIONS[3];
  if (roll < 0.50) return BLACK_MARKET_FLUCTUATIONS[4];
  if (roll < 0.55) return BLACK_MARKET_FLUCTUATIONS[5];
  return BLACK_MARKET_FLUCTUATIONS[1];
}

export const BLACK_MARKET_DAILY_REFRESH_INTERVAL = 120;
export const BLACK_MARKET_ORDER_COUNT = 3;
