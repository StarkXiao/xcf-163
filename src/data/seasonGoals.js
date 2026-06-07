import { RARITY, CREATURES } from './creatures.js';
import { CREATURE_CATEGORIES } from './portCommissions.js';

export const SEASON_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const COLLECTION_THEMES = [
  {
    id: 'theme_fish_week',
    name: '鱼类狂欢周',
    icon: '🐟',
    desc: '打捞各种鱼形机械残骸，充实你的图鉴！',
    category: 'fish_like',
    bonusRarity: 'common',
    startColor: 0x44aaff,
    endColor: 0x00ffff
  },
  {
    id: 'theme_crustacean_week',
    name: '甲壳集结周',
    icon: '🦀',
    desc: '收集螃蟹、虾、龙虾等带甲壳的机械残骸！',
    category: 'crustacean',
    bonusRarity: 'uncommon',
    startColor: 0xff6644,
    endColor: 0xffaa00
  },
  {
    id: 'theme_mollusk_week',
    name: '软体探秘周',
    icon: '🐙',
    desc: '探索章鱼、水母、蜗牛等软体机械的奥秘！',
    category: 'mollusk',
    bonusRarity: 'rare',
    startColor: 0xaa44ff,
    endColor: 0xff44aa
  },
  {
    id: 'theme_giant_week',
    name: '巨兽狩猎周',
    icon: '🐋',
    desc: '挑战巨型海洋机械，追寻传说级生物！',
    category: 'giant',
    bonusRarity: 'epic',
    startColor: 0x44ffaa,
    endColor: 0x44ff44
  },
  {
    id: 'theme_rare_week',
    name: '稀有狩猎周',
    icon: '💎',
    desc: '专注收集稀有以上品质的机械残骸！',
    category: null,
    minRarity: 'rare',
    bonusRarity: 'epic',
    startColor: 0xffaa00,
    endColor: 0xff4444
  },
  {
    id: 'theme_legendary_week',
    name: '传说追寻周',
    icon: '🌟',
    desc: '目标只有一个——捕捉传说级机械残骸！',
    category: null,
    minRarity: 'epic',
    bonusRarity: 'legendary',
    startColor: 0xffaa00,
    endColor: 0xffee44
  },
  {
    id: 'theme_new_collector',
    name: '图鉴补完周',
    icon: '📖',
    desc: '收集尚未解锁的机械残骸，完成图鉴！',
    category: null,
    requireNew: true,
    bonusRarity: 'rare',
    startColor: 0x44ffee,
    endColor: 0x4488ff
  },
  {
    id: 'theme_swarm_week',
    name: '集群探索周',
    icon: '✨',
    desc: '捕捉纳米集群等特殊形态机械！',
    category: 'swarm',
    bonusRarity: 'rare',
    startColor: 0xffff44,
    endColor: 0xff88ff
  }
];

export const SEASON_REWARD_TIERS = [
  { tier: 1, name: '入门', minScore: 50, reward: { coins: 100, energy: 20 } },
  { tier: 2, name: '学徒', minScore: 500, reward: { coins: 300, energy: 50 } },
  { tier: 3, name: '熟练', minScore: 1500, reward: { coins: 800, energy: 100 } },
  { tier: 4, name: '精通', minScore: 3500, reward: { coins: 2000, energy: 200 } },
  { tier: 5, name: '大师', minScore: 7000, reward: { coins: 5000, energy: 400 } },
  { tier: 6, name: '传奇', minScore: 12000, reward: { coins: 12000, energy: 800 } }
];

export const PORT_RANKING_TIERS = [
  { rank: 1, name: '港口之星', minCommissions: 15, minRarityBonus: 1.5, reward: { coins: 2000, energy: 200 } },
  { rank: 2, name: '精英回收者', minCommissions: 10, minRarityBonus: 1.2, reward: { coins: 1000, energy: 100 } },
  { rank: 3, name: '熟练打捞员', minCommissions: 6, minRarityBonus: 1.0, reward: { coins: 500, energy: 50 } },
  { rank: 4, name: '新手船员', minCommissions: 3, minRarityBonus: 0, reward: { coins: 200, energy: 20 } },
  { rank: 5, name: '港口过客', minCommissions: 1, minRarityBonus: 0, reward: { coins: 50, energy: 10 } }
];

export const PORT_MINIMUM_COMMISSIONS = 1;

export const SCORE_CONFIG = {
  rarityMultiplier: {
    common: 1,
    uncommon: 3,
    rare: 10,
    epic: 30,
    legendary: 100
  },
  categoryBonus: 2,
  newCreatureBonus: 5,
  tierBonus: 1.5,
  portCommissionBase: 50,
  portRarityBonus: 1.5
};

export function getThemeById(themeId) {
  return COLLECTION_THEMES.find(t => t.id === themeId);
}

export function getCreaturesForTheme(theme, collection = new Set(), includeCollected = true) {
  let creatures = [...CREATURES];
  
  if (theme.category) {
    const category = CREATURE_CATEGORIES[theme.category];
    if (category) {
      creatures = creatures.filter(c => category.creatureIds.includes(c.id));
    }
  }
  
  if (theme.minRarity) {
    const minRarityWeight = RARITY[theme.minRarity.toUpperCase()]?.weight || 0;
    creatures = creatures.filter(c => c.rarity.weight <= minRarityWeight);
  }
  
  if (theme.requireNew && !includeCollected) {
    creatures = creatures.filter(c => !collection.has(c.id));
  }
  
  return creatures;
}

export function calculateCreatureScore(creature, theme, isNew = false, tier = 1) {
  let score = 0;
  const rarityKey = getRarityKey(creature.rarity);
  const baseScore = SCORE_CONFIG.rarityMultiplier[rarityKey] || 1;
  
  score = baseScore;
  
  if (theme) {
    if (theme.category) {
      const category = CREATURE_CATEGORIES[theme.category];
      if (category && category.creatureIds.includes(creature.id)) {
        score *= SCORE_CONFIG.categoryBonus;
      }
    }
    if (theme.bonusRarity && rarityKey === theme.bonusRarity) {
      score *= 1.5;
    }
  }
  
  if (isNew) {
    score += SCORE_CONFIG.newCreatureBonus;
  }
  
  if (tier > 1) {
    score *= Math.pow(SCORE_CONFIG.tierBonus, tier - 1);
  }
  
  return Math.floor(score);
}

export function calculatePortCommissionScore(commission) {
  let score = SCORE_CONFIG.portCommissionBase;
  const rarityKey = getRarityKeyByName(commission.rarity);
  const rarityMult = SCORE_CONFIG.rarityMultiplier[rarityKey] || 1;
  score *= rarityMult * SCORE_CONFIG.portRarityBonus;
  return Math.floor(score);
}

function getRarityKey(rarity) {
  const map = {
    [RARITY.COMMON.name]: 'common',
    [RARITY.UNCOMMON.name]: 'uncommon',
    [RARITY.RARE.name]: 'rare',
    [RARITY.EPIC.name]: 'epic',
    [RARITY.LEGENDARY.name]: 'legendary'
  };
  return map[rarity?.name] || 'common';
}

function getRarityKeyByName(rarityName) {
  const map = {
    '普通': 'common',
    '优秀': 'uncommon',
    '稀有': 'rare',
    '史诗': 'epic',
    '传说': 'legendary'
  };
  return map[rarityName] || 'common';
}

export function getRewardTier(score) {
  let currentTier = SEASON_REWARD_TIERS[0];
  for (const tier of SEASON_REWARD_TIERS) {
    if (score >= tier.minScore) {
      currentTier = tier;
    }
  }
  return currentTier;
}

export function getNextRewardTier(score) {
  for (const tier of SEASON_REWARD_TIERS) {
    if (score < tier.minScore) {
      return tier;
    }
  }
  return null;
}

export function getPortRank(commissionsCompleted, rarityBonus) {
  for (const rank of PORT_RANKING_TIERS) {
    if (commissionsCompleted >= rank.minCommissions && rarityBonus >= rank.minRarityBonus) {
      return rank;
    }
  }
  return PORT_RANKING_TIERS[PORT_RANKING_TIERS.length - 1];
}

export function isPortRankUnlocked(portRank, commissionsCompleted, rarityBonus) {
  if (!portRank) return false;
  if (commissionsCompleted < PORT_MINIMUM_COMMISSIONS) return false;
  return commissionsCompleted >= portRank.minCommissions && rarityBonus >= portRank.minRarityBonus;
}

export function isAnyPortRankUnlocked(commissionsCompleted) {
  return commissionsCompleted >= PORT_MINIMUM_COMMISSIONS;
}

export function pickWeeklyTheme(excludeId = null) {
  let pool = COLLECTION_THEMES;
  if (excludeId) {
    pool = COLLECTION_THEMES.filter(t => t.id !== excludeId);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getWeekNumber(timestamp = Date.now()) {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
