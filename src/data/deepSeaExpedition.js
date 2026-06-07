import { RARITY, CREATURES, generateRandomAffixes } from './creatures.js';

export const ROUTES = {
  COASTAL: {
    id: 'coastal',
    name: '近海航线',
    icon: '🌊',
    desc: '靠近海岸的安全航线，风险较低但收获也普通',
    difficulty: 1,
    duration: 3,
    baseRewardCoins: 100,
    supplyCost: { food: 5, fuel: 5, repair: 2 },
    rarityWeights: { common: 60, uncommon: 30, rare: 8, epic: 2, legendary: 0 },
    eventChance: 0.3,
    wreckChance: 0.2,
    unlockCost: 0
  },
  DEEP_SEA: {
    id: 'deep_sea',
    name: '深海航线',
    icon: '🦑',
    desc: '深入未知海域，有机会发现稀有残骸',
    difficulty: 2,
    duration: 5,
    baseRewardCoins: 300,
    supplyCost: { food: 10, fuel: 15, repair: 5 },
    rarityWeights: { common: 35, uncommon: 35, rare: 20, epic: 8, legendary: 2 },
    eventChance: 0.5,
    wreckChance: 0.4,
    unlockCost: 2000
  },
  ABYSS: {
    id: 'abyss',
    name: '深渊航线',
    icon: '🌌',
    desc: '危险的深渊区域，传说品质残骸出没之地',
    difficulty: 3,
    duration: 7,
    baseRewardCoins: 800,
    supplyCost: { food: 20, fuel: 30, repair: 10 },
    rarityWeights: { common: 15, uncommon: 25, rare: 30, epic: 22, legendary: 8 },
    eventChance: 0.7,
    wreckChance: 0.6,
    unlockCost: 10000
  },
  VOID_TRENCH: {
    id: 'void_trench',
    name: '虚空海沟',
    icon: '💀',
    desc: '最危险的航线，生存与暴富的终极考验',
    difficulty: 4,
    duration: 10,
    baseRewardCoins: 2000,
    supplyCost: { food: 35, fuel: 50, repair: 20 },
    rarityWeights: { common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 20 },
    eventChance: 0.85,
    wreckChance: 0.8,
    unlockCost: 50000
  }
};

export const SUPPLY_ITEMS = {
  food: { id: 'food', name: '压缩食物', icon: '🍖', desc: '维持船员生命的必需品', basePrice: 20 },
  fuel: { id: 'fuel', name: '深海燃料', icon: '⛽', desc: '潜艇航行的动力来源', basePrice: 30 },
  repair: { id: 'repair', name: '维修零件', icon: '🔧', desc: '修复船体损伤的零件', basePrice: 50 }
};

export const RISK_EVENTS = [
  {
    id: 'storm',
    name: '深海风暴',
    icon: '🌪️',
    desc: '突如其来的风暴袭击了潜艇',
    severityRange: [1, 3],
    effects: [
      { type: 'hull_damage', min: 10, max: 30 },
      { type: 'supply_loss', supply: 'food', min: 2, max: 5 }
    ],
    difficulty: 1
  },
  {
    id: 'kraken',
    name: '巨型章鱼袭击',
    icon: '🐙',
    desc: '一只巨型机械章鱼从深渊中出现！',
    severityRange: [2, 4],
    effects: [
      { type: 'hull_damage', min: 20, max: 50 },
      { type: 'supply_loss', supply: 'repair', min: 2, max: 4 }
    ],
    difficulty: 2
  },
  {
    id: 'pressure_leak',
    name: '压力泄漏',
    icon: '💨',
    desc: '船体出现裂缝，海水正在渗入',
    severityRange: [1, 2],
    effects: [
      { type: 'hull_damage', min: 15, max: 25 },
      { type: 'supply_loss', supply: 'repair', min: 1, max: 3 }
    ],
    difficulty: 1
  },
  {
    id: 'pirates',
    name: '深海海盗',
    icon: '🏴‍☠️',
    desc: '一群深海海盗盯上了你的货物！',
    severityRange: [2, 3],
    effects: [
      { type: 'coin_loss', minPercent: 0.1, maxPercent: 0.3 },
      { type: 'supply_loss', supply: 'fuel', min: 3, max: 8 }
    ],
    difficulty: 2
  },
  {
    id: 'engine_failure',
    name: '引擎故障',
    icon: '⚙️',
    desc: '潜艇引擎突然熄火，需要紧急维修',
    severityRange: [2, 3],
    effects: [
      { type: 'supply_loss', supply: 'fuel', min: 5, max: 10 },
      { type: 'supply_loss', supply: 'repair', min: 2, max: 5 },
      { type: 'extra_duration', min: 1, max: 2 }
    ],
    difficulty: 2
  },
  {
    id: 'food_spoilage',
    name: '食物变质',
    icon: '🤢',
    desc: '部分食物因储存不当而变质',
    severityRange: [1, 2],
    effects: [
      { type: 'supply_loss', supply: 'food', min: 4, max: 10 }
    ],
    difficulty: 1
  },
  {
    id: 'iceberg',
    name: '海底冰山',
    icon: '🧊',
    desc: '潜艇撞上了隐藏的海底冰山！',
    severityRange: [2, 4],
    effects: [
      { type: 'hull_damage', min: 25, max: 45 },
      { type: 'supply_loss', supply: 'fuel', min: 2, max: 6 }
    ],
    difficulty: 3
  },
  {
    id: 'data_storm',
    name: '数据风暴',
    icon: '📡',
    desc: '异常电磁风暴干扰了导航系统',
    severityRange: [1, 3],
    effects: [
      { type: 'supply_loss', supply: 'fuel', min: 4, max: 8 },
      { type: 'extra_duration', min: 1, max: 3 }
    ],
    difficulty: 2
  }
];

export const POSITIVE_EVENTS = [
  {
    id: 'supply_cache',
    name: '漂流补给箱',
    icon: '📦',
    desc: '发现一个漂浮的补给箱！',
    effects: [
      { type: 'supply_gain', supply: 'food', min: 3, max: 8 },
      { type: 'supply_gain', supply: 'fuel', min: 2, max: 5 }
    ],
    weight: 30
  },
  {
    id: 'friendly_trader',
    name: '友好商人',
    icon: '🤝',
    desc: '遇到一位友好的深海商人，愿意低价交易',
    effects: [
      { type: 'supply_gain', supply: 'repair', min: 2, max: 4 },
      { type: 'coin_gain', min: 50, max: 150 }
    ],
    weight: 20
  },
  {
    id: 'oil_slick',
    name: '燃料泄漏带',
    icon: '🛢️',
    desc: '发现一条废弃的燃料管道，可以回收燃料',
    effects: [
      { type: 'supply_gain', supply: 'fuel', min: 5, max: 12 }
    ],
    weight: 25
  },
  {
    id: 'rescue_survivor',
    name: '救援幸存者',
    icon: '🧑‍🚀',
    desc: '救起一名漂流的幸存者，他赠予你感谢金',
    effects: [
      { type: 'coin_gain', min: 100, max: 400 }
    ],
    weight: 15
  },
  {
    id: 'ancient_map',
    name: '古老海图',
    icon: '🗺️',
    desc: '发现一张古老的海图，标记了残骸位置',
    effects: [
      { type: 'bonus_wreck', count: 1 }
    ],
    weight: 10
  }
];

export const WRECK_TYPES = [
  {
    id: 'small_ship',
    name: '小型沉船',
    icon: '⛵',
    desc: '一艘小型渔船的残骸',
    creatureCount: [1, 2],
    bonusCoins: [20, 80],
    rarityBoost: 0
  },
  {
    id: 'cargo_ship',
    name: '货运沉船',
    icon: '🚢',
    desc: '装载着货物的大型运输船残骸',
    creatureCount: [2, 4],
    bonusCoins: [100, 300],
    rarityBoost: 0.05
  },
  {
    id: 'research_vessel',
    name: '科考船残骸',
    icon: '🔬',
    desc: '旧世界的科研船，藏着珍贵样本',
    creatureCount: [2, 3],
    bonusCoins: [150, 400],
    rarityBoost: 0.15
  },
  {
    id: 'military_sub',
    name: '军用潜艇',
    icon: '🛸',
    desc: '沉没的军用潜艇，可能有高级装备',
    creatureCount: [3, 5],
    bonusCoins: [300, 600],
    rarityBoost: 0.25
  },
  {
    id: 'ancient_ruins',
    name: '远古遗迹',
    icon: '🏛️',
    desc: '神秘的海底远古文明遗迹',
    creatureCount: [3, 6],
    bonusCoins: [500, 1000],
    rarityBoost: 0.4
  }
];

export const WRECK_WEIGHTS = {
  1: { small_ship: 60, cargo_ship: 30, research_vessel: 8, military_sub: 2, ancient_ruins: 0 },
  2: { small_ship: 35, cargo_ship: 40, research_vessel: 18, military_sub: 6, ancient_ruins: 1 },
  3: { small_ship: 15, cargo_ship: 30, research_vessel: 30, military_sub: 20, ancient_ruins: 5 },
  4: { small_ship: 5, cargo_ship: 15, research_vessel: 30, military_sub: 35, ancient_ruins: 15 }
};

export const EXPEDITION_UPGRADES = {
  hull: {
    id: 'hull',
    name: '船体强化',
    icon: '🛡️',
    desc: '增加潜艇最大耐久度',
    maxLevel: 5,
    baseCost: 500,
    effectPerLevel: 20
  },
  cargo: {
    id: 'cargo',
    name: '货舱扩容',
    icon: '📦',
    desc: '增加可携带的残骸数量',
    maxLevel: 5,
    baseCost: 800,
    effectPerLevel: 2
  },
  radar: {
    id: 'radar',
    name: '雷达升级',
    icon: '📡',
    desc: '提高发现残骸和补给的概率',
    maxLevel: 5,
    baseCost: 600,
    effectPerLevel: 0.05
  },
  engine: {
    id: 'engine',
    name: '引擎优化',
    icon: '⚡',
    desc: '减少燃料消耗',
    maxLevel: 5,
    baseCost: 700,
    effectPerLevel: 0.08
  },
  storage: {
    id: 'storage',
    name: '储藏室扩建',
    icon: '🏗️',
    desc: '增加补给携带上限',
    maxLevel: 5,
    baseCost: 400,
    effectPerLevel: 10
  }
};

export function getUpgradeCost(upgradeId, currentLevel) {
  const upgrade = EXPEDITION_UPGRADES[upgradeId.toUpperCase()] || EXPEDITION_UPGRADES[upgradeId];
  if (!upgrade) return Infinity;
  return Math.floor(upgrade.baseCost * Math.pow(1.6, currentLevel));
}

export function getRandomWreck(difficulty) {
  const weights = WRECK_WEIGHTS[difficulty] || WRECK_WEIGHTS[1];
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (const [wreckId, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return WRECK_TYPES.find(w => w.id === wreckId);
    }
  }
  return WRECK_TYPES[0];
}

export function getRandomEvent(difficulty, positive = false) {
  const pool = positive ? POSITIVE_EVENTS : RISK_EVENTS.filter(e => e.difficulty <= difficulty);
  if (pool.length === 0) return null;
  if (positive) {
    const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * totalWeight;
    for (const e of pool) {
      r -= e.weight;
      if (r <= 0) return e;
    }
    return pool[0];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateCreatureForExpedition(route, rarityBoost) {
  const weights = { ...route.rarityWeights };
  if (rarityBoost) {
    for (const key of Object.keys(weights)) {
      if (rarityBoost[key]) {
        weights[key] = weights[key] * rarityBoost[key];
      }
    }
  }
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  let selectedRarityKey = 'common';
  for (const [rarityKey, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      selectedRarityKey = rarityKey;
      break;
    }
  }
  const rarityMap = {
    common: RARITY.COMMON,
    uncommon: RARITY.UNCOMMON,
    rare: RARITY.RARE,
    epic: RARITY.EPIC,
    legendary: RARITY.LEGENDARY
  };
  const targetRarity = rarityMap[selectedRarityKey];
  const available = CREATURES.filter(c => c.rarity === targetRarity);
  return available[Math.floor(Math.random() * available.length)];
}

export const NIGHT_VOYAGE_EVENTS = {
  DISTRESS_SIGNAL: {
    id: 'distress_signal',
    name: '求救信号',
    icon: '🆘',
    desc: '接收到微弱的SOS信号，可能有幸存者等待救援',
    color: 0xff4444,
    bgTint: 0x441111,
    rarityBoost: { common: 0.8, uncommon: 1.0, rare: 1.3, epic: 1.5, legendary: 2.0 },
    valueMultiplier: 1.5,
    extraRewards: { coins: [100, 400], supplyDrop: { chance: 0.6, supply: 'repair', min: 1, max: 3 }, rareAndAboveBoost: 0.2 },
    durationMs: 45000,
    triggerChance: 0.08,
    branches: [
      {
        id: 'rescue',
        name: '前往救援',
        desc: '立即前去营救，奖励丰厚但有风险。成功获得幸存者酬金，失败船体受损奖励减半',
        riskChance: 0.3,
        rewardMultiplier: 2.0,
        onRisk: { valuePenalty: 0.5, hullDamage: [15, 30], penaltyTag: '救援失败' },
        onSuccess: { bonusCoins: [200, 500], successTag: '救援成功' },
        extraRarityBoost: { epic: 1.5, legendary: 2.0 }
      },
      {
        id: 'scan',
        name: '扫描信号',
        desc: '远程扫描分析，奖励稍低但更安全。小概率精确定位信号源',
        riskChance: 0.1,
        rewardMultiplier: 1.3,
        onRisk: { valuePenalty: 0.8, penaltyTag: '信号杂波干扰' },
        onSuccess: { supplyDrop: { chance: 0.5, supply: 'repair', min: 1, max: 2 }, successTag: '信号解析完成' },
        extraRarityBoost: { rare: 1.2 }
      },
      {
        id: 'ignore',
        name: '忽略信号',
        desc: '继续正常作业，无额外收益但不受风险影响',
        riskChance: 0,
        rewardMultiplier: 1.0,
        onRisk: { valuePenalty: 1.0 },
        onSuccess: {}
      }
    ],
    ambience: { rainIntensity: 1.5, waveIntensity: 1.3, floatIntensity: 1.2 }
  },
  WRECK_RAMPAGE: {
    id: 'wreck_rampage',
    name: '残骸暴走',
    icon: '💥',
    desc: '异常能量波动使残骸变得狂暴，危险与机遇并存',
    color: 0xff8800,
    bgTint: 0x442200,
    rarityBoost: { common: 0.5, uncommon: 0.8, rare: 1.5, epic: 2.0, legendary: 2.5 },
    valueMultiplier: 2.0,
    extraRewards: { coins: [200, 600], creatureCountBonus: 1, epicAndAboveBoost: 0.3 },
    durationMs: 35000,
    triggerChance: 0.06,
    branches: [
      {
        id: 'fight',
        name: '强行捕捞',
        desc: '硬闯暴走区域，高风险高回报。成功大量奖金，失败船体重伤且残骸价值暴跌',
        riskChance: 0.5,
        rewardMultiplier: 2.5,
        onRisk: { valuePenalty: 0.3, hullDamage: [20, 40], penaltyTag: '残骸爆炸反噬' },
        onSuccess: { bonusCoins: [300, 800], legendaryChanceBoost: 0.15, successTag: '暴走残骸捕获' },
        extraRarityBoost: { rare: 1.3, epic: 1.6, legendary: 2.2 },
        hullDamage: [10, 25]
      },
      {
        id: 'defuse',
        name: '拆除引信',
        desc: '尝试稳定残骸能量，成功率中等。成功稳定残骸，失败损失部分奖励',
        riskChance: 0.25,
        rewardMultiplier: 1.8,
        onRisk: { valuePenalty: 0.6, penaltyTag: '能量溢出' },
        onSuccess: { bonusCoins: [100, 300], successTag: '能量稳定完成' },
        extraRarityBoost: { rare: 1.2, epic: 1.4 }
      },
      {
        id: 'wait',
        name: '等待平息',
        desc: '等待能量消散，安全但收益减少',
        riskChance: 0.05,
        rewardMultiplier: 1.2,
        onRisk: { valuePenalty: 0.9, penaltyTag: '余波干扰' },
        onSuccess: { successTag: '安全过境' }
      }
    ],
    ambience: { rainIntensity: 2.0, waveIntensity: 2.0, floatIntensity: 1.8, shakeIntensity: 0.5 }
  },
  ANCIENT_BROADCAST: {
    id: 'ancient_broadcast',
    name: '古老广播',
    icon: '📻',
    desc: '来自深海的神秘低语，似乎在指引着什么',
    color: 0xaa44ff,
    bgTint: 0x220044,
    rarityBoost: { common: 0.6, uncommon: 0.9, rare: 1.4, epic: 1.8, legendary: 3.0 },
    valueMultiplier: 1.8,
    extraRewards: { coins: [150, 500], legendaryHint: true, rareAndAboveBoost: 0.25 },
    durationMs: 50000,
    triggerChance: 0.05,
    branches: [
      {
        id: 'decode',
        name: '破译信号',
        desc: '全力破译古老密文，有概率获得传说线索。失败则精神受扰',
        riskChance: 0.2,
        rewardMultiplier: 2.2,
        onRisk: { valuePenalty: 0.6, comboReset: true, penaltyTag: '古老低语侵蚀心智' },
        onSuccess: { bonusCoins: [200, 600], legendaryChanceBoost: 0.2, successTag: '远古密文破译' },
        extraRarityBoost: { epic: 1.5, legendary: 2.5 },
        legendaryChanceBoost: 0.1
      },
      {
        id: 'follow',
        name: '循声探索',
        desc: '跟随声音的指引前进，收获与风险并存',
        riskChance: 0.15,
        rewardMultiplier: 1.6,
        onRisk: { valuePenalty: 0.7, penaltyTag: '迷失方向' },
        onSuccess: { bonusCoins: [100, 300], rareAndAboveBoost: 0.2, successTag: '发现遗迹残骸' },
        extraRarityBoost: { rare: 1.3, epic: 1.5 }
      },
      {
        id: 'record',
        name: '记录存档',
        desc: '保存信号以后研究，收益稳定风险极低',
        riskChance: 0.05,
        rewardMultiplier: 1.4,
        onRisk: { valuePenalty: 0.95, penaltyTag: '记录失败' },
        onSuccess: { supplyDrop: { chance: 0.4, supply: 'fuel', min: 2, max: 5 }, successTag: '记录归档完成' }
      }
    ],
    ambience: { rainIntensity: 0.8, waveIntensity: 0.9, floatIntensity: 1.5, auroraEffect: true }
  }
};

export function getRandomNightVoyageEvent() {
  const events = Object.values(NIGHT_VOYAGE_EVENTS);
  const totalChance = events.reduce((sum, e) => sum + e.triggerChance, 0);
  let random = Math.random() * totalChance;
  for (const event of events) {
    random -= event.triggerChance;
    if (random <= 0) return event;
  }
  return events[0];
}

export function rollNightVoyageEvent(bonusChance = 0) {
  const events = Object.values(NIGHT_VOYAGE_EVENTS);
  const maxChance = Math.max(...events.map(e => e.triggerChance));
  const triggerRoll = Math.random();
  if (triggerRoll < maxChance + bonusChance) {
    return getRandomNightVoyageEvent();
  }
  return null;
}

export const BOSS_WRECKS = {
  ABYSSAL_COLOSSUS: {
    id: 'abyssal_colossus',
    name: '深渊巨像',
    icon: '🗿',
    desc: '远古文明遗留的巨型战争机器，沉睡在海沟最深处。',
    rarity: { name: '首领', class: 'rarity-boss', weight: 0, color: 0xff2244 },
    baseValue: 5000,
    hp: 3,
    maxHp: 3,
    quotes: [
      '系统...重启...检测到...入侵者...',
      '古老的...契约...不容...侵犯...',
      '深渊...会吞噬...一切...'
    ],
    spawnConditions: {
      requiredTides: ['storm_tide', 'spring_tide', 'high_tide'],
      minCombo: 10,
      minCodexCount: 10,
      triggerChance: 0.08
    },
    dropPool: {
      guaranteedCreatures: ['ai_leviathan', 'soul_server', 'star_whale'],
      randomCreatureCount: [2, 4],
      rarityWeights: { common: 0, uncommon: 0, rare: 20, epic: 50, legendary: 30 },
      bonusCoins: [2000, 5000],
      specialDrops: [
        { id: 'boss_core_abyssal', name: '深渊核心', icon: '💎', value: 2000, chance: 1.0 }
      ]
    },
    color: 0xff2244,
    bgTint: 0x330011
  },
  VOID_LEVIATHAN: {
    id: 'void_leviathan',
    name: '虚空利维坦',
    icon: '🐲',
    desc: '从维度裂缝中爬出的恐怖存在，身体由错误数据构成。',
    rarity: { name: '首领', class: 'rarity-boss', weight: 0, color: 0x9922ff },
    baseValue: 8000,
    hp: 4,
    maxHp: 4,
    quotes: [
      '你的...维度...很美味...',
      '现实...不过是...脆弱的膜...',
      '加入...虚空...成为...永恒...'
    ],
    spawnConditions: {
      requiredTides: ['storm_tide'],
      minCombo: 20,
      minCodexCount: 15,
      triggerChance: 0.05
    },
    dropPool: {
      guaranteedCreatures: ['ai_leviathan', 'star_whale'],
      randomCreatureCount: [3, 5],
      rarityWeights: { common: 0, uncommon: 0, rare: 10, epic: 40, legendary: 50 },
      bonusCoins: [4000, 8000],
      specialDrops: [
        { id: 'boss_core_void', name: '虚空精华', icon: '🌀', value: 3500, chance: 1.0 },
        { id: 'boss_shard_dimension', name: '维度碎片', icon: '✨', value: 1500, chance: 0.5 }
      ]
    },
    color: 0x9922ff,
    bgTint: 0x1a0033
  },
  ANCIENT_DREADNOUGHT: {
    id: 'ancient_dreadnought',
    name: '远古无畏舰',
    icon: '🚀',
    desc: '旧世界的旗舰残骸，装备系统仍在自主运作。',
    rarity: { name: '首领', class: 'rarity-boss', weight: 0, color: 0xff8800 },
    baseValue: 6000,
    hp: 3,
    maxHp: 3,
    quotes: [
      '舰长...已阵亡...自动防御系统...激活...',
      '识别目标：敌对单位...开始歼灭...',
      '战舰...荣耀...永不...沉没...'
    ],
    spawnConditions: {
      requiredTides: ['spring_tide', 'flood_tide'],
      minCombo: 15,
      minCodexCount: 12,
      triggerChance: 0.06
    },
    dropPool: {
      guaranteedCreatures: ['quantum_shark', 'void_angler'],
      randomCreatureCount: [2, 4],
      rarityWeights: { common: 0, uncommon: 0, rare: 30, epic: 50, legendary: 20 },
      bonusCoins: [3000, 6000],
      specialDrops: [
        { id: 'boss_core_warship', name: '战舰AI核心', icon: '🔮', value: 2500, chance: 1.0 }
      ]
    },
    color: 0xff8800,
    bgTint: 0x331a00
  },
  DATA_ENTITY_PRIME: {
    id: 'data_entity_prime',
    name: '数据原初体',
    icon: '👾',
    desc: '所有机械生命体的原始数据聚合体，进化的顶点。',
    rarity: { name: '首领', class: 'rarity-boss', weight: 0, color: 0x00ffaa },
    baseValue: 10000,
    hp: 5,
    maxHp: 5,
    quotes: [
      '我是...开端...也是...终结...',
      '所有的数据...终将...归于...一统...',
      '你的存在...已被...记录...'
    ],
    spawnConditions: {
      requiredTides: ['storm_tide', 'high_tide'],
      minCombo: 30,
      minCodexCount: 18,
      triggerChance: 0.03
    },
    dropPool: {
      guaranteedCreatures: ['ai_leviathan', 'soul_server', 'star_whale', 'time_lobster'],
      randomCreatureCount: [4, 6],
      rarityWeights: { common: 0, uncommon: 0, rare: 5, epic: 35, legendary: 60 },
      bonusCoins: [6000, 12000],
      specialDrops: [
        { id: 'boss_core_prime', name: '原初数据核心', icon: '💠', value: 5000, chance: 1.0 },
        { id: 'boss_shard_origin', name: '起源碎片', icon: '⭐', value: 3000, chance: 0.6 }
      ]
    },
    color: 0x00ffaa,
    bgTint: 0x003322
  }
};

export const BOSS_WRECK_LIST = Object.values(BOSS_WRECKS);

export function checkBossSpawnConditions(game) {
  const tidePhase = game.tideSystem ? game.tideSystem.getCurrentPhase() : null;
  const comboCount = game.stats.comboCount || 0;
  const codexCount = game.inventory ? game.inventory.getCollection().size : 0;

  const eligibleBosses = BOSS_WRECK_LIST.filter(boss => {
    const cond = boss.spawnConditions;
    const tideMatch = !tidePhase || cond.requiredTides.includes(tidePhase.id);
    const comboMatch = comboCount >= cond.minCombo;
    const codexMatch = codexCount >= cond.minCodexCount;
    return tideMatch && comboMatch && codexMatch;
  });

  return eligibleBosses;
}

export function rollBossWreck(game) {
  const eligible = checkBossSpawnConditions(game);
  if (eligible.length === 0) return null;

  const totalChance = eligible.reduce((sum, b) => sum + b.spawnConditions.triggerChance, 0);
  let random = Math.random() * totalChance;

  for (const boss of eligible) {
    random -= boss.spawnConditions.triggerChance;
    if (random <= 0) {
      return JSON.parse(JSON.stringify(boss));
    }
  }
  return null;
}

export function generateBossDrops(boss, rarityBoost = null) {
  const drops = {
    creatures: [],
    coins: 0,
    specialItems: []
  };

  const pool = boss.dropPool;

  for (const creatureId of pool.guaranteedCreatures) {
    const creature = CREATURES.find(c => c.id === creatureId);
    if (creature) {
      drops.creatures.push({
        ...creature,
        tier: 1,
        affixes: generateRandomAffixes(creature)
      });
    }
  }

  const randomCount = pool.randomCreatureCount[0] +
    Math.floor(Math.random() * (pool.randomCreatureCount[1] - pool.randomCreatureCount[0] + 1));

  const weights = { ...pool.rarityWeights };
  if (rarityBoost) {
    for (const key of Object.keys(weights)) {
      if (rarityBoost[key]) {
        weights[key] = weights[key] * rarityBoost[key];
      }
    }
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const rarityMap = {
    common: RARITY.COMMON,
    uncommon: RARITY.UNCOMMON,
    rare: RARITY.RARE,
    epic: RARITY.EPIC,
    legendary: RARITY.LEGENDARY
  };

  for (let i = 0; i < randomCount; i++) {
    let r = Math.random() * totalWeight;
    let selectedRarity = RARITY.RARE;
    for (const [rarityKey, weight] of Object.entries(weights)) {
      r -= weight;
      if (r <= 0) {
        selectedRarity = rarityMap[rarityKey] || RARITY.RARE;
        break;
      }
    }
    const available = CREATURES.filter(c => c.rarity === selectedRarity);
    if (available.length > 0) {
      const creature = available[Math.floor(Math.random() * available.length)];
      drops.creatures.push({
        ...creature,
        tier: 1,
        affixes: generateRandomAffixes(creature)
      });
    }
  }

  drops.coins = Math.floor(
    pool.bonusCoins[0] + Math.random() * (pool.bonusCoins[1] - pool.bonusCoins[0])
  );

  for (const special of pool.specialDrops) {
    if (Math.random() < special.chance) {
      drops.specialItems.push({ ...special });
    }
  }

  return drops;
}
