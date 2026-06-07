import { CREATURES, calculateCreatureValue } from './creatures.js';

export const AUCTION_RIVALS = [
  {
    id: 'collector_chen',
    name: '收藏家老陈',
    icon: '🧔',
    desc: '痴迷于稀有机械生物的退休工程师。',
    personality: 'conservative',
    preferredRarities: ['稀有', '史诗'],
    budgetMultiplier: 1.2,
    aggression: 0.4,
    quitThreshold: 1.8
  },
  {
    id: 'baroness_violet',
    name: '紫罗兰男爵夫人',
    icon: '👩‍🦳',
    desc: '来自上层区的神秘贵族，只收传说级珍品。',
    personality: 'snobbish',
    preferredRarities: ['史诗', '传说'],
    budgetMultiplier: 2.0,
    aggression: 0.6,
    quitThreshold: 2.5
  },
  {
    id: 'scrapper_mike',
    name: '拾荒者迈克',
    icon: '🧑‍🔧',
    desc: '废品堆里的精明商人，捡漏是他的拿手好戏。',
    personality: 'aggressive',
    preferredRarities: ['普通', '优秀', '稀有'],
    budgetMultiplier: 0.8,
    aggression: 0.8,
    quitThreshold: 1.3
  },
  {
    id: 'ai_curator',
    name: 'AI策展人Ω',
    icon: '🤖',
    desc: '古老的收藏管理AI，估价精准到小数点后六位。',
    personality: 'calculating',
    preferredRarities: ['稀有', '史诗', '传说'],
    budgetMultiplier: 1.5,
    aggression: 0.5,
    quitThreshold: 2.2
  },
  {
    id: 'professor_nautilus',
    name: '鹦鹉螺教授',
    icon: '🧑‍🏫',
    desc: '深海考古学家，对历史遗物有近乎偏执的热爱。',
    personality: 'passionate',
    preferredRarities: ['优秀', '稀有', '史诗'],
    budgetMultiplier: 1.3,
    aggression: 0.7,
    quitThreshold: 2.0
  }
];

export const AUCTION_MARKET_EVENTS = [
  {
    id: 'boom',
    name: '拍卖热潮',
    icon: '📈',
    priceMult: 1.3,
    rivalExtraAggression: 0.15,
    desc: '买家们情绪高涨，出价普遍更激进！'
  },
  {
    id: 'normal',
    name: '行情平稳',
    icon: '➖',
    priceMult: 1.0,
    rivalExtraAggression: 0,
    desc: '市场平淡，一切按部就班。'
  },
  {
    id: 'slump',
    name: '市场低迷',
    icon: '📉',
    priceMult: 0.8,
    rivalExtraAggression: -0.1,
    desc: '买家观望情绪浓厚，捡漏的好时机。'
  },
  {
    id: 'rarity_craze',
    name: '珍品疯抢',
    icon: '💎',
    priceMult: 1.0,
    priceMultByRarity: { '稀有': 1.2, '史诗': 1.4, '传说': 1.6 },
    rivalExtraAggression: 0.1,
    desc: '高稀有度残骸受到追捧！'
  }
];

export const AUCTION_DURATION = {
  SHORT: { id: 'short', name: '快速', seconds: 30, bidInterval: 3000 },
  NORMAL: { id: 'normal', name: '标准', seconds: 60, bidInterval: 5000 },
  LONG: { id: 'long', name: '持久战', seconds: 120, bidInterval: 8000 }
};

export const CONSIGNMENT_FEE_RATE = 0.05;
export const AUCTION_HOUSE_CUT_RATE = 0.1;

export function getRandomRivals(count = 3) {
  const shuffled = [...AUCTION_RIVALS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getRandomMarketEvent() {
  const weights = [0.2, 0.5, 0.2, 0.1];
  const roll = Math.random();
  let cumulative = 0;
  for (let i = 0; i < AUCTION_MARKET_EVENTS.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) return AUCTION_MARKET_EVENTS[i];
  }
  return AUCTION_MARKET_EVENTS[1];
}

export function calculateStartingBid(creature, tier = 1, affixes = [], marketEvent = null) {
  const baseValue = calculateCreatureValue(creature, tier, affixes);
  let mult = 0.8;

  if (marketEvent) {
    mult *= marketEvent.priceMult || 1.0;
    if (marketEvent.priceMultByRarity && marketEvent.priceMultByRarity[creature.rarity.name]) {
      mult *= marketEvent.priceMultByRarity[creature.rarity.name];
    }
  }

  return Math.max(10, Math.floor(baseValue * mult));
}

export function calculateRivalBid(rival, currentBid, creature, tier = 1, affixes = [], marketEvent = null) {
  if (!rival) return null;

  const baseValue = calculateCreatureValue(creature, tier, affixes);
  const maxWilling = baseValue * rival.budgetMultiplier * rival.quitThreshold;

  if (currentBid >= maxWilling) return null;

  const prefersThis = rival.preferredRarities.includes(creature.rarity.name);
  let aggression = rival.aggression;
  if (prefersThis) aggression += 0.15;
  if (marketEvent && marketEvent.rivalExtraAggression) {
    aggression += marketEvent.rivalExtraAggression;
  }
  aggression = Math.max(0.1, Math.min(0.95, aggression));

  const remainingBudget = maxWilling - currentBid;
  const minIncrement = Math.max(5, Math.floor(currentBid * 0.05));
  const maxIncrement = Math.floor(remainingBudget * 0.4);

  if (maxIncrement <= minIncrement) {
    return currentBid + minIncrement < maxWilling ? currentBid + minIncrement : null;
  }

  const aggressionRoll = Math.random();
  let bidIncrement;

  if (rival.personality === 'calculating') {
    bidIncrement = minIncrement + Math.floor((maxIncrement - minIncrement) * (0.3 + Math.random() * 0.2));
  } else if (rival.personality === 'aggressive') {
    bidIncrement = aggressionRoll < aggression
      ? minIncrement + Math.floor((maxIncrement - minIncrement) * (0.6 + Math.random() * 0.4))
      : minIncrement + Math.floor((maxIncrement - minIncrement) * Math.random() * 0.3);
  } else if (rival.personality === 'passionate') {
    bidIncrement = aggressionRoll < aggression
      ? minIncrement + Math.floor((maxIncrement - minIncrement) * (0.7 + Math.random() * 0.3))
      : minIncrement + Math.floor((maxIncrement - minIncrement) * Math.random() * 0.5);
  } else if (rival.personality === 'snobbish') {
    bidIncrement = aggressionRoll < aggression
      ? minIncrement + Math.floor((maxIncrement - minIncrement) * (0.5 + Math.random() * 0.3))
      : minIncrement;
  } else {
    bidIncrement = minIncrement + Math.floor((maxIncrement - minIncrement) * (0.2 + Math.random() * 0.4));
  }

  bidIncrement = Math.max(minIncrement, Math.min(maxIncrement, bidIncrement));
  const nextBid = currentBid + bidIncrement;

  return nextBid < maxWilling ? nextBid : null;
}

export function getRarityTierCreatures(minRarityName = '稀有') {
  const rarityOrder = ['普通', '优秀', '稀有', '史诗', '传说'];
  const minIdx = rarityOrder.indexOf(minRarityName);
  return CREATURES.filter(c => {
    const idx = rarityOrder.indexOf(c.rarity.name);
    return idx >= minIdx;
  });
}

export function generateRandomAuctionItem() {
  const eligible = getRarityTierCreatures('稀有');
  if (eligible.length === 0) return null;

  const weights = eligible.map(c => {
    if (c.rarity.name === '稀有') return 60;
    if (c.rarity.name === '史诗') return 30;
    if (c.rarity.name === '传说') return 10;
    return 1;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let selected = eligible[0];
  for (let i = 0; i < eligible.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      selected = eligible[i];
      break;
    }
  }

  const tier = selected.rarity.name === '传说'
    ? (Math.random() < 0.5 ? 2 : 1)
    : selected.rarity.name === '史诗'
      ? (Math.random() < 0.3 ? 2 : 1)
      : 1;

  return {
    creature: selected,
    tier,
    affixes: []
  };
}

export function generateConsignmentId() {
  return `consign_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export function generateAuctionId() {
  return `auction_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}
