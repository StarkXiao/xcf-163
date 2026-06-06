import { RARITY, MATERIALS } from './creatures.js';

export const TAVERN_CHARACTERS = [
  {
    id: 'old_fisher',
    name: '老渔夫',
    icon: '🧙‍♂️',
    desc: '在渔港待了50年的老水手，熟知每一片海域的脾气。',
    reputation: 0,
    maxReputation: 100,
    unlockCost: 0,
    specialties: ['情报', '潮汐'],
    greetings: [
      '年轻人，今天的海可不简单啊...',
      '想听点老骨头的经验吗？',
      '我见过的风暴，比你吃的饭还多。'
    ]
  },
  {
    id: 'scrap_merchant',
    name: '废铁商',
    icon: '💰',
    desc: '游走于各个港口的材料商人，什么破烂都能回收利用。',
    reputation: 0,
    maxReputation: 100,
    unlockCost: 200,
    specialties: ['材料交换', '情报'],
    greetings: [
      '嘿！有什么好货要出手吗？',
      '我这里什么材料都收，价格公道！',
      '想找点稀罕零件？找我就对了。'
    ]
  },
  {
    id: 'cyber_pirate',
    name: '赛博海盗',
    icon: '🏴‍☠️',
    desc: '被数据海洋放逐的前黑客，掌握着深海禁区的秘密坐标。',
    reputation: 0,
    maxReputation: 100,
    unlockCost: 500,
    specialties: ['支线任务', '稀有情报'],
    greetings: [
      '哟，又见面了，捞到什么好东西？',
      '我知道一些官方海图上没有的地方...',
      '想赚大钱？就得冒大险。'
    ]
  },
  {
    id: 'tavern_keeper',
    name: '酒馆老板',
    icon: '🍺',
    desc: '渔港酒馆的老板娘，耳朵里装着整个港口的八卦。',
    reputation: 0,
    maxReputation: 100,
    unlockCost: 100,
    specialties: ['情报', '任务'],
    greetings: [
      '欢迎光临！今天想听点什么消息？',
      '来来来，喝一杯再说。',
      '最近渔港里可是发生了不少事哦...'
    ]
  },
  {
    id: 'engineer',
    name: '流浪工程师',
    icon: '🔧',
    desc: '从旧世界逃出来的工程师，精通各种机械改装。',
    reputation: 0,
    maxReputation: 100,
    unlockCost: 300,
    specialties: ['材料交换', '装备'],
    greetings: [
      '嗯？你身上有不错的零件气息...',
      '想改装你的装备？我可以帮你。',
      '旧世界的技术，可不止你看到的那些。'
    ]
  },
  {
    id: 'mystic',
    name: '深海占卜师',
    icon: '🔮',
    desc: '据说能与数据深渊沟通的神秘人物，预言从未落空。',
    reputation: 0,
    maxReputation: 100,
    unlockCost: 800,
    specialties: ['传说情报', '支线任务'],
    greetings: [
      '我看到了...你的命运里有星光...',
      '深海在呼唤你，你听到了吗？',
      '命运的齿轮，已经开始转动了。'
    ]
  }
];

export const INTEL_TYPES = {
  TIDE_BOOST: 'tide_boost',
  RARITY_BOOST: 'rarity_boost',
  CREATURE_HOTSPOT: 'creature_hotspot',
  COMBO_BOOST: 'combo_boost',
  ENERGY_BOOST: 'energy_boost'
};

export const INTEL_POOL = [
  {
    id: 'intel_tide_high',
    type: INTEL_TYPES.TIDE_BOOST,
    name: '满潮预警',
    desc: '接下来的3次打捞，稀有度概率+20%',
    duration: 3,
    source: ['old_fisher', 'tavern_keeper'],
    effect: { rarityBoost: 0.2 },
    reputationRequired: 10,
    cost: { coins: 50 }
  },
  {
    id: 'intel_storm_sight',
    type: INTEL_TYPES.TIDE_BOOST,
    name: '风暴之眼',
    desc: '下次风暴潮时，传说概率翻倍',
    duration: -1,
    source: ['old_fisher', 'mystic'],
    effect: { legendaryBoostInStorm: 2.0 },
    reputationRequired: 40,
    cost: { coins: 300 }
  },
  {
    id: 'intel_rare_hunt',
    type: INTEL_TYPES.RARITY_BOOST,
    name: '稀有追踪',
    desc: '接下来5次打捞，稀有及以上概率+30%',
    duration: 5,
    source: ['scrap_merchant', 'cyber_pirate'],
    effect: { rareAndAboveBoost: 0.3 },
    reputationRequired: 20,
    cost: { coins: 150 }
  },
  {
    id: 'intel_epic_radar',
    type: INTEL_TYPES.RARITY_BOOST,
    name: '史诗雷达',
    desc: '接下来3次打捞，史诗及以上概率+50%',
    duration: 3,
    source: ['cyber_pirate', 'mystic'],
    effect: { epicAndAboveBoost: 0.5 },
    reputationRequired: 50,
    cost: { coins: 400 }
  },
  {
    id: 'intel_hotspot_common',
    type: INTEL_TYPES.CREATURE_HOTSPOT,
    name: '鱼群聚集',
    desc: '接下来的打捞必定获得机械残骸',
    duration: 3,
    source: ['tavern_keeper', 'old_fisher'],
    effect: { noEmptyCatch: true },
    reputationRequired: 5,
    cost: { coins: 30 }
  },
  {
    id: 'intel_hotspot_whale',
    type: INTEL_TYPES.CREATURE_HOTSPOT,
    name: '鲸歌回响',
    desc: '接下来5次打捞，全息鲸出现概率大幅提升',
    duration: 5,
    source: ['mystic'],
    effect: { creatureBoost: 'hologram_whale', multiplier: 5.0 },
    reputationRequired: 60,
    cost: { coins: 500 }
  },
  {
    id: 'intel_combo_master',
    type: INTEL_TYPES.COMBO_BOOST,
    name: '连击秘术',
    desc: '连击时间窗口延长50%，持续3分钟',
    duration: 180,
    source: ['cyber_pirate', 'engineer'],
    effect: { comboTimeoutExtend: 0.5 },
    reputationRequired: 30,
    cost: { coins: 200 }
  },
  {
    id: 'intel_energy_saver',
    type: INTEL_TYPES.ENERGY_BOOST,
    name: '节能模式',
    desc: '接下来10次打捞能量消耗-30%',
    duration: 10,
    source: ['engineer', 'tavern_keeper'],
    effect: { energyDiscount: 0.3 },
    reputationRequired: 15,
    cost: { coins: 80 }
  }
];

export const MATERIAL_EXCHANGES = [
  {
    id: 'exchange_common_to_uncommon',
    name: '废料精炼',
    desc: '用5个普通废料换1个合金板',
    source: ['scrap_merchant', 'engineer'],
    input: { common_scrap: 5 },
    output: { alloy_plate: 1 },
    reputationRequired: 10
  },
  {
    id: 'exchange_uncommon_to_rare',
    name: '合金熔铸',
    desc: '用4个合金板换1个能量核心',
    source: ['scrap_merchant', 'engineer'],
    input: { alloy_plate: 4 },
    output: { energy_core: 1 },
    reputationRequired: 25
  },
  {
    id: 'exchange_rare_to_epic',
    name: '核心聚合',
    desc: '用3个能量核心换1个纳米集群',
    source: ['scrap_merchant', 'cyber_pirate'],
    input: { energy_core: 3 },
    output: { nano_swarm: 1 },
    reputationRequired: 45
  },
  {
    id: 'exchange_epic_to_legendary',
    name: '虚空结晶',
    desc: '用2个纳米集群换1个虚空晶体',
    source: ['mystic', 'cyber_pirate'],
    input: { nano_swarm: 2 },
    output: { void_crystal: 1 },
    reputationRequired: 70
  },
  {
    id: 'exchange_scrap_to_coins',
    name: '废料回收',
    desc: '10个普通废料换30金币',
    source: ['scrap_merchant'],
    input: { common_scrap: 10 },
    output: { coins: 30 },
    reputationRequired: 0
  },
  {
    id: 'exchange_alloy_to_coins',
    name: '合金收购',
    desc: '5个合金板换100金币',
    source: ['scrap_merchant'],
    input: { alloy_plate: 5 },
    output: { coins: 100 },
    reputationRequired: 20
  },
  {
    id: 'exchange_energy_upgrade',
    name: '能量注入',
    desc: '2个能量核心换80点能量',
    source: ['engineer', 'tavern_keeper'],
    input: { energy_core: 2 },
    output: { energy: 80 },
    reputationRequired: 30
  }
];

export const SIDEQUESTS = [
  {
    id: 'sq_old_fisher_1',
    name: '老人的回忆',
    desc: '老渔夫想要看看传说中的AI利维坦，帮他捕获1只。',
    source: 'old_fisher',
    type: 'find_creature',
    target: { creatureId: 'ai_leviathan', count: 1 },
    reward: { coins: 2000, reputation: 20, materials: { void_crystal: 2 } },
    reputationRequired: 30,
    unlockHint: '与老渔夫的好感度达到30后解锁'
  },
  {
    id: 'sq_scrap_merchant_1',
    name: '大订单',
    desc: '废铁商需要20个合金板来完成客户的订单。',
    source: 'scrap_merchant',
    type: 'collect_materials',
    target: { materialId: 'alloy_plate', count: 20 },
    reward: { coins: 800, reputation: 15, materials: { energy_core: 3 } },
    reputationRequired: 15,
    unlockHint: '与废铁商的好感度达到15后解锁'
  },
  {
    id: 'sq_cyber_pirate_1',
    name: '深海坐标',
    desc: '赛博海盗给了你一个神秘坐标，在风暴潮时捕获1只传说品质的残骸。',
    source: 'cyber_pirate',
    type: 'find_rarity_in_tide',
    target: { rarity: RARITY.LEGENDARY, tideId: 'storm_tide', count: 1 },
    reward: { coins: 5000, reputation: 25, materials: { nano_swarm: 3 } },
    reputationRequired: 50,
    unlockHint: '与赛博海盗的好感度达到50后解锁'
  },
  {
    id: 'sq_tavern_keeper_1',
    name: '酒馆的招牌菜',
    desc: '酒馆老板需要5只机器鱼来做她的招牌菜「赛博鱼脍」。',
    source: 'tavern_keeper',
    type: 'collect_creature',
    target: { creatureId: 'robot_fish', count: 5 },
    reward: { coins: 200, reputation: 10, energy: 50 },
    reputationRequired: 5,
    unlockHint: '与酒馆老板的好感度达到5后解锁'
  },
  {
    id: 'sq_engineer_1',
    name: '改装计划',
    desc: '流浪工程师需要10个能量核心来完成他的神秘改装。',
    source: 'engineer',
    type: 'collect_materials',
    target: { materialId: 'energy_core', count: 10 },
    reward: { coins: 1500, reputation: 20, materials: { nano_swarm: 2 } },
    reputationRequired: 35,
    unlockHint: '与流浪工程师的好感度达到35后解锁'
  },
  {
    id: 'sq_mystic_1',
    name: '深渊的呼唤',
    desc: '占卜师说你必须在连击达到10以上时捕获1只史诗品质的残骸。',
    source: 'mystic',
    type: 'find_rarity_in_combo',
    target: { rarity: RARITY.EPIC, minCombo: 10, count: 1 },
    reward: { coins: 3000, reputation: 30, materials: { void_crystal: 1, nano_swarm: 2 } },
    reputationRequired: 60,
    unlockHint: '与深海占卜师的好感度达到60后解锁'
  },
  {
    id: 'sq_old_fisher_2',
    name: '收藏家',
    desc: '老渔夫想看看所有种类的机械残骸，收集图鉴完成度达到80%。',
    source: 'old_fisher',
    type: 'unique_collected',
    target: { count: 15 },
    reward: { coins: 5000, reputation: 30 },
    reputationRequired: 60,
    unlockHint: '与老渔夫的好感度达到60后解锁'
  },
  {
    id: 'sq_cyber_pirate_2',
    name: '连击挑战',
    desc: '赛博海盗打赌你无法达成20连击。证明给他看！',
    source: 'cyber_pirate',
    type: 'combo_reach',
    target: { count: 20 },
    reward: { coins: 4000, reputation: 20, energy: 200 },
    reputationRequired: 70,
    unlockHint: '与赛博海盗的好感度达到70后解锁'
  }
];

export const REPUTATION_REWARDS = [
  { level: 10, desc: '解锁基础情报' },
  { level: 20, desc: '解锁稀有材料交换' },
  { level: 30, desc: '解锁第一个支线任务' },
  { level: 40, desc: '解锁高级情报' },
  { level: 50, desc: '解锁史诗级情报' },
  { level: 60, desc: '解锁专属支线任务' },
  { level: 80, desc: '解锁传说级材料交换' },
  { level: 100, desc: '获得角色专属称号和奖励' }
];
