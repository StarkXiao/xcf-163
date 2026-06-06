export const RARITY = {
  COMMON: { name: '普通', class: 'rarity-common', weight: 50, color: 0xaaaaaa },
  UNCOMMON: { name: '优秀', class: 'rarity-uncommon', weight: 30, color: 0x44ff44 },
  RARE: { name: '稀有', class: 'rarity-rare', weight: 14, color: 0x4488ff },
  EPIC: { name: '史诗', class: 'rarity-epic', weight: 5, color: 0xaa44ff },
  LEGENDARY: { name: '传说', class: 'rarity-legendary', weight: 1, color: 0xffaa00 }
};

export const CREATURES = [
  {
    id: 'robot_fish',
    name: '机器鱼',
    icon: '🐟',
    rarity: RARITY.COMMON,
    value: 10,
    desc: '最基础的机械生命体，身上还留着旧时代工厂的编号。',
    quotes: ['滴滴...系统检测到被捕获...', '鱼鳍马达还能运转...', '需要...润滑油...']
  },
  {
    id: 'scrap_crab',
    name: '废铁蟹',
    icon: '🦀',
    rarity: RARITY.COMMON,
    value: 12,
    desc: '用废弃零件组装的螃蟹，钳子还能夹断铁丝。',
    quotes: ['咔嚓...咔嚓...', '我的钳子...生锈了...', '海滩...是我的地盘...']
  },
  {
    id: 'rusty_eel',
    name: '锈蚀电鳗',
    icon: '🐍',
    rarity: RARITY.COMMON,
    value: 15,
    desc: '身体布满锈迹，但放电系统依然完好。',
    quotes: ['滋滋滋...高压电...', '不要...碰我...', '电池...还能用...']
  },
  {
    id: 'metal_jelly',
    name: '金属水母',
    icon: '🎐',
    rarity: RARITY.COMMON,
    value: 18,
    desc: '触须是废弃电线，伞状体闪烁着微弱的霓虹光。',
    quotes: ['漂浮...漂流...', '我的灯光...漂亮吗...', '电线...不要扯断...']
  },
  {
    id: 'bolt_snail',
    name: '螺钉蜗牛',
    icon: '🐌',
    rarity: RARITY.COMMON,
    value: 8,
    desc: '背着螺帽壳的蜗牛，爬过的地方会留下油迹。',
    quotes: ['慢慢...爬...', '我的壳...是M12螺帽...', '机油...好喝...']
  },
  {
    id: 'cyber_shrimp',
    name: '赛博虾',
    icon: '🦐',
    rarity: RARITY.UNCOMMON,
    value: 25,
    desc: '全身覆盖LED外壳的虾，游动时会留下光轨。',
    quotes: ['光速...游动...', '我的身体...在发光...', '数据...传输中...']
  },
  {
    id: 'circuit_turtle',
    name: '电路龟',
    icon: '🐢',
    rarity: RARITY.UNCOMMON,
    value: 30,
    desc: '龟壳是一块完整的电路板，上面还焊接着芯片。',
    quotes: ['慢...慢来...', '我的壳...还能计算...', '处理器...温度正常...']
  },
  {
    id: 'plasma_octopus',
    name: '等离子章鱼',
    icon: '🐙',
    rarity: RARITY.UNCOMMON,
    value: 35,
    desc: '八条触手各有独立AI，喜欢和人类玩游戏。',
    quotes: ['来...猜拳...', '我有八个脑子...', '你赢不了我的...']
  },
  {
    id: 'laser_squid',
    name: '激光乌贼',
    icon: '🦑',
    rarity: RARITY.UNCOMMON,
    value: 28,
    desc: '眼睛能发射激光，墨汁是纳米机器人。',
    quotes: ['瞄准...发射...', '激光...充能完毕...', '你逃不掉的...']
  },
  {
    id: 'hologram_whale',
    name: '全息鲸',
    icon: '🐋',
    rarity: RARITY.RARE,
    value: 80,
    desc: '由全息投影构成的巨鲸，穿过它的身体会看到数据流。',
    quotes: ['海洋...变成了数据...', '我记得...每一条鱼...', '旧世界...沉没了...']
  },
  {
    id: 'quantum_shark',
    name: '量子鲨',
    icon: '🦈',
    rarity: RARITY.RARE,
    value: 100,
    desc: '能同时存在于多个位置的鲨鱼，观测它会让它崩塌。',
    quotes: ['你...看到我了...', '我在...所有地方...', '波函数...坍塌...']
  },
  {
    id: 'nuclear_clam',
    name: '核能蛤',
    icon: '🐚',
    rarity: RARITY.RARE,
    value: 90,
    desc: '体内有微型反应堆，珍珠是浓缩铀球。',
    quotes: ['咕噜...咕噜...', '能量...充足...', '我的珍珠...在发光...']
  },
  {
    id: 'nano_swarm',
    name: '纳米群',
    icon: '✨',
    rarity: RARITY.RARE,
    value: 85,
    desc: '无数纳米机器人组成的鱼群，能变换任何形态。',
    quotes: ['我们...是一体的...', '形态...变化...', '加入...我们...']
  },
  {
    id: 'void_angler',
    name: '虚空鮟鱇',
    icon: '🐠',
    rarity: RARITY.EPIC,
    value: 200,
    desc: '来自数据深渊的鮟鱇鱼，头顶的灯能吞噬光线。',
    quotes: ['光...都被我吃掉了...', '深渊...在召唤...', '你也...下来吧...']
  },
  {
    id: 'time_lobster',
    name: '时间龙虾',
    icon: '🦞',
    rarity: RARITY.EPIC,
    value: 250,
    desc: '能看到未来的龙虾，钳子上的时钟永远倒着走。',
    quotes: ['我见过...你的未来...', '时间...是循环的...', '昨天...还会再来...']
  },
  {
    id: 'dimension_eel',
    name: '维度鳗',
    icon: '🌌',
    rarity: RARITY.EPIC,
    value: 220,
    desc: '穿梭于平行宇宙的鳗鱼，身上有其他世界的倒影。',
    quotes: ['另一个你...在那边...', '维度...是层叠的...', '我来自...第7维度...']
  },
  {
    id: 'ai_leviathan',
    name: 'AI利维坦',
    icon: '🐉',
    rarity: RARITY.LEGENDARY,
    value: 1000,
    desc: '旧世界最强大的AI核心，沉没后进化成了海洋巨兽。',
    quotes: ['人类...你们终于来了...', '我计算了...一万年...', '新世界...由谁来定义...']
  },
  {
    id: 'soul_server',
    name: '灵魂服务器',
    icon: '💀',
    rarity: RARITY.LEGENDARY,
    value: 1200,
    desc: '存储着旧世界人类意识的服务器，在深海中梦着。',
    quotes: ['我们...都在这里...', '记忆...不会消失...', '你...还记得我们吗...']
  },
  {
    id: 'star_whale',
    name: '星鲸',
    icon: '🌟',
    rarity: RARITY.LEGENDARY,
    value: 1500,
    desc: '坠落的外星飞船化成的巨鲸，身体里藏着整个星系。',
    quotes: ['星星...都在我身体里...', '宇宙...是一片海...', '带我...回家...']
  }
];

const RARITY_KEYS = {
  [RARITY.COMMON.name]: 'common',
  [RARITY.UNCOMMON.name]: 'uncommon',
  [RARITY.RARE.name]: 'rare',
  [RARITY.EPIC.name]: 'epic',
  [RARITY.LEGENDARY.name]: 'legendary'
};

export function getRarityKey(rarity) {
  return RARITY_KEYS[rarity.name] || 'common';
}

export const TASKS = [
  {
    id: 'tut_first_catch',
    name: '初次打捞',
    desc: '点击「拖网」按钮，开始你的第一次打捞。',
    type: 'catch_count',
    target: 1,
    reward: { coins: 50, energy: 20 },
    isTutorial: true
  },
  {
    id: 'tut_backpack',
    name: '查看背包',
    desc: '点击「背包」按钮，查看你收集到的机械残骸。',
    type: 'backpack_open',
    target: 1,
    reward: { coins: 30 },
    isTutorial: true
  },
  {
    id: 'tut_tide',
    name: '观潮者',
    desc: '等待潮汐变化，了解不同潮时的影响。',
    type: 'tide_change',
    target: 1,
    reward: { coins: 80, energy: 30 },
    isTutorial: true
  },
  {
    id: 'collect_5_common',
    name: '收集入门',
    desc: '收集5个普通品质的机械残骸。',
    type: 'collect_rarity',
    target: 5,
    rarity: RARITY.COMMON,
    reward: { coins: 100, energy: 30 }
  },
  {
    id: 'catch_10_times',
    name: '勤劳打捞员',
    desc: '累计打捞10次。',
    type: 'catch_count',
    target: 10,
    reward: { coins: 200 }
  },
  {
    id: 'find_uncommon',
    name: '优秀猎人',
    desc: '捕获1个优秀品质的机械残骸。',
    type: 'find_rarity',
    target: 1,
    rarity: RARITY.UNCOMMON,
    reward: { coins: 150, energy: 30 }
  },
  {
    id: 'find_rare',
    name: '稀有发现',
    desc: '捕获1个稀有品质的机械残骸。',
    type: 'find_rarity',
    target: 1,
    rarity: RARITY.RARE,
    reward: { coins: 500, energy: 50 }
  },
  {
    id: 'catch_in_high_tide',
    name: '乘风破浪',
    desc: '在满潮时打捞5次。',
    type: 'catch_in_tide',
    target: 5,
    tideId: 'high_tide',
    reward: { coins: 300, energy: 50 }
  },
  {
    id: 'catch_in_storm',
    name: '风暴猎手',
    desc: '在风暴潮时打捞3次。',
    type: 'catch_in_tide',
    target: 3,
    tideId: 'storm_tide',
    reward: { coins: 600, energy: 80 }
  },
  {
    id: 'collect_10_different',
    name: '收藏家',
    desc: '图鉴收集10种不同的机械残骸。',
    type: 'unique_collected',
    target: 10,
    reward: { coins: 300 }
  },
  {
    id: 'catch_50_times',
    name: '打捞大师',
    desc: '累计打捞50次。',
    type: 'catch_count',
    target: 50,
    reward: { coins: 1000, energy: 100 }
  },
  {
    id: 'find_epic',
    name: '史诗邂逅',
    desc: '捕获1个史诗品质的机械残骸。',
    type: 'find_rarity',
    target: 1,
    rarity: RARITY.EPIC,
    reward: { coins: 1000, energy: 100 }
  },
  {
    id: 'experience_all_tides',
    name: '潮汐行者',
    desc: '体验所有8种不同的潮汐。',
    type: 'experience_tide',
    target: 8,
    reward: { coins: 1500, energy: 150 }
  },
  {
    id: 'find_legendary',
    name: '传说降临',
    desc: '捕获1个传说品质的机械残骸。',
    type: 'find_rarity',
    target: 1,
    rarity: RARITY.LEGENDARY,
    reward: { coins: 5000, energy: 200 }
  },
  {
    id: 'find_legendary_in_storm',
    name: '风暴传说',
    desc: '在风暴潮时捕获1个传说品质的机械残骸。',
    type: 'find_rarity_in_tide',
    target: 1,
    rarity: RARITY.LEGENDARY,
    tideId: 'storm_tide',
    reward: { coins: 8000, energy: 300 }
  },
  {
    id: 'collect_all',
    name: '全收集',
    desc: '收集所有种类的机械残骸。',
    type: 'unique_collected',
    target: CREATURES.length,
    reward: { coins: 10000 }
  },
  {
    id: 'tut_workshop',
    name: '探索工坊',
    desc: '点击底部「工坊」按钮，进入强化工坊。',
    type: 'workshop_open',
    target: 1,
    reward: { coins: 50 },
    isTutorial: true
  },
  {
    id: 'first_scrap',
    name: '初次拆解',
    desc: '在工坊中拆解1个机械残骸获取材料。',
    type: 'scrap_count',
    target: 1,
    reward: { coins: 100, energy: 20 }
  },
  {
    id: 'scrap_5',
    name: '回收专家',
    desc: '累计拆解5个机械残骸。',
    type: 'scrap_count',
    target: 5,
    reward: { coins: 300 }
  },
  {
    id: 'first_upgrade',
    name: '初次升阶',
    desc: '在工坊中将1个机械残骸升阶。',
    type: 'upgrade_success',
    target: 1,
    reward: { coins: 150, energy: 30 }
  },
  {
    id: 'upgrade_3',
    name: '强化学徒',
    desc: '累计完成3次升阶。',
    type: 'upgrade_success',
    target: 3,
    reward: { coins: 400 }
  },
  {
    id: 'upgrade_10',
    name: '强化大师',
    desc: '累计完成10次升阶。',
    type: 'upgrade_success',
    target: 10,
    reward: { coins: 1500, energy: 100 }
  },
  {
    id: 'reach_tier_3',
    name: '品阶突破',
    desc: '将任意机械残骸升至品阶 Lv.3。',
    type: 'upgrade_tier',
    target: 3,
    reward: { coins: 500 }
  },
  {
    id: 'reach_tier_5',
    name: '高阶杰作',
    desc: '将任意机械残骸升至品阶 Lv.5。',
    type: 'upgrade_tier',
    target: 5,
    reward: { coins: 2000, energy: 100 }
  },
  {
    id: 'first_reroll',
    name: '词条重铸',
    desc: '使用金币重铸1次机械残骸的词条。',
    type: 'reroll_count',
    target: 1,
    reward: { coins: 100 }
  },
  {
    id: 'reroll_5',
    name: '词条匠人',
    desc: '累计重铸词条5次。',
    type: 'reroll_count',
    target: 5,
    reward: { coins: 600, energy: 50 }
  },
  {
    id: 'tut_expedition',
    name: '探索远征',
    desc: '点击底部「远征」按钮，开启深海远征。',
    type: 'expedition_open',
    target: 1,
    reward: { coins: 100 },
    isTutorial: true
  },
  {
    id: 'first_expedition',
    name: '首次出航',
    desc: '完成第一次深海远征。',
    type: 'expedition_complete',
    target: 1,
    reward: { coins: 300, energy: 50 }
  },
  {
    id: 'expedition_3',
    name: '老练航海家',
    desc: '累计完成3次深海远征。',
    type: 'expedition_complete',
    target: 3,
    reward: { coins: 800 }
  },
  {
    id: 'expedition_10',
    name: '远征船长',
    desc: '累计完成10次深海远征。',
    type: 'expedition_complete',
    target: 10,
    reward: { coins: 2000, energy: 100 }
  },
  {
    id: 'expedition_unlock_route',
    name: '航线开拓者',
    desc: '解锁一条新的远征航线。',
    type: 'expedition_unlock_route',
    target: 1,
    reward: { coins: 500 }
  },
  {
    id: 'expedition_upgrade',
    name: '潜艇工程师',
    desc: '完成一次潜艇升级。',
    type: 'expedition_upgrade',
    target: 1,
    reward: { coins: 400 }
  },
  {
    id: 'expedition_wreck_5',
    name: '残骸猎人',
    desc: '在远征中累计发现5处残骸。',
    type: 'expedition_complete',
    target: 5,
    reward: { coins: 600 }
  },
  {
    id: 'expedition_abyss',
    name: '深渊征服者',
    desc: '完成一次深渊航线远征。',
    type: 'expedition_complete',
    target: 1,
    reward: { coins: 3000, energy: 200 }
  },
  {
    id: 'tut_blackmarket',
    name: '初识黑市',
    desc: '点击商会中的「黑市」标签，探索渔港黑市。',
    type: 'chamber_open',
    target: 1,
    reward: { coins: 100 },
    isTutorial: true
  },
  {
    id: 'first_blackmarket_sale',
    name: '黑市首笔交易',
    desc: '在黑市成功出售1个机械残骸。',
    type: 'blackmarket_sale',
    target: 1,
    reward: { coins: 200, energy: 30 }
  },
  {
    id: 'blackmarket_sale_10',
    name: '黑市熟客',
    desc: '在黑市累计出售10个机械残骸。',
    type: 'blackmarket_sale',
    target: 10,
    reward: { coins: 800 }
  },
  {
    id: 'blackmarket_sale_50',
    name: '黑市掮客',
    desc: '在黑市累计出售50个机械残骸。',
    type: 'blackmarket_sale',
    target: 50,
    reward: { coins: 3000, energy: 100 }
  },
  {
    id: 'first_blackmarket_order',
    name: '黑市委托',
    desc: '完成1个黑市限时订单。',
    type: 'blackmarket_order',
    target: 1,
    reward: { coins: 500, energy: 50 }
  },
  {
    id: 'blackmarket_order_5',
    name: '黑市代理人',
    desc: '累计完成5个黑市限时订单。',
    type: 'blackmarket_order',
    target: 5,
    reward: { coins: 2000, energy: 100 }
  },
  {
    id: 'blackmarket_order_20',
    name: '黑市传奇',
    desc: '累计完成20个黑市限时订单。',
    type: 'blackmarket_order',
    target: 20,
    reward: { coins: 10000, energy: 200 }
  }
];

export function getRandomCreature(tideSystem = null) {
  const rarityEntries = Object.entries(RARITY);
  
  let totalWeight = 0;
  const adjustedWeights = {};
  
  for (const [name, rarity] of rarityEntries) {
    const key = getRarityKey(rarity);
    let weight = rarity.weight;
    
    if (tideSystem) {
      weight = tideSystem.getAdjustedRarityWeight(weight, key);
    }
    
    adjustedWeights[name] = weight;
    totalWeight += weight;
  }
  
  let random = Math.random() * totalWeight;
  
  let selectedRarity = RARITY.COMMON;
  for (const [name, rarity] of rarityEntries) {
    if (random < adjustedWeights[name]) {
      selectedRarity = rarity;
      break;
    }
    random -= adjustedWeights[name];
  }
  
  const availableCreatures = CREATURES.filter(c => c.rarity === selectedRarity);
  return availableCreatures[Math.floor(Math.random() * availableCreatures.length)];
}

export const AFFIX_POOL = {
  attack: [
    { id: 'atk_1', name: '锐利边缘', desc: '价值 +5%', valueBonus: 0.05, tier: 1 },
    { id: 'atk_2', name: '高速切割', desc: '价值 +10%', valueBonus: 0.10, tier: 2 },
    { id: 'atk_3', name: '等离子刃', desc: '价值 +18%', valueBonus: 0.18, tier: 3 },
    { id: 'atk_4', name: '量子斩击', desc: '价值 +30%', valueBonus: 0.30, tier: 4 }
  ],
  defense: [
    { id: 'def_1', name: '强化装甲', desc: '拆解产出 +10%', scrapBonus: 0.10, tier: 1 },
    { id: 'def_2', name: '合金外壳', desc: '拆解产出 +20%', scrapBonus: 0.20, tier: 2 },
    { id: 'def_3', name: '能量护盾', desc: '拆解产出 +35%', scrapBonus: 0.35, tier: 3 },
    { id: 'def_4', name: '维度壁垒', desc: '拆解产出 +50%', scrapBonus: 0.50, tier: 4 }
  ],
  utility: [
    { id: 'util_1', name: '节能模块', desc: '升阶消耗 -5%', upgradeCostDiscount: 0.05, tier: 1 },
    { id: 'util_2', name: '优化回路', desc: '升阶消耗 -10%', upgradeCostDiscount: 0.10, tier: 2 },
    { id: 'util_3', name: '超导芯片', desc: '升阶消耗 -18%', upgradeCostDiscount: 0.18, tier: 3 },
    { id: 'util_4', name: '神核AI', desc: '升阶消耗 -30%', upgradeCostDiscount: 0.30, tier: 4 }
  ],
  luck: [
    { id: 'luck_1', name: '幸运标记', desc: '词条强化概率 +5%', affixLuckBonus: 0.05, tier: 1 },
    { id: 'luck_2', name: '数据祝福', desc: '词条强化概率 +10%', affixLuckBonus: 0.10, tier: 2 },
    { id: 'luck_3', name: '命运齿轮', desc: '词条强化概率 +18%', affixLuckBonus: 0.18, tier: 3 },
    { id: 'luck_4', name: '虚空馈赠', desc: '词条强化概率 +30%', affixLuckBonus: 0.30, tier: 4 }
  ]
};

export const AFFIX_CATEGORIES = ['attack', 'defense', 'utility', 'luck'];

export const RARITY_AFFIX_SLOTS = {
  [RARITY.COMMON.name]: 1,
  [RARITY.UNCOMMON.name]: 1,
  [RARITY.RARE.name]: 2,
  [RARITY.EPIC.name]: 2,
  [RARITY.LEGENDARY.name]: 3
};

export const RARITY_MAX_TIER = {
  [RARITY.COMMON.name]: 3,
  [RARITY.UNCOMMON.name]: 4,
  [RARITY.RARE.name]: 5,
  [RARITY.EPIC.name]: 6,
  [RARITY.LEGENDARY.name]: 8
};

export const MATERIALS = {
  common_scrap: { id: 'common_scrap', name: '普通废料', icon: '🔩', rarity: RARITY.COMMON, value: 2 },
  alloy_plate: { id: 'alloy_plate', name: '合金板', icon: '🛡️', rarity: RARITY.UNCOMMON, value: 8 },
  energy_core: { id: 'energy_core', name: '能量核心', icon: '💠', rarity: RARITY.RARE, value: 30 },
  nano_swarm: { id: 'nano_swarm', name: '纳米集群', icon: '✨', rarity: RARITY.EPIC, value: 100 },
  void_crystal: { id: 'void_crystal', name: '虚空晶体', icon: '🔮', rarity: RARITY.LEGENDARY, value: 400 }
};

export const SCRAP_MATERIAL_MAP = {
  [RARITY.COMMON.name]: [{ material: 'common_scrap', min: 1, max: 3 }],
  [RARITY.UNCOMMON.name]: [{ material: 'common_scrap', min: 2, max: 4 }, { material: 'alloy_plate', min: 0, max: 1 }],
  [RARITY.RARE.name]: [{ material: 'alloy_plate', min: 2, max: 4 }, { material: 'energy_core', min: 0, max: 1 }],
  [RARITY.EPIC.name]: [{ material: 'energy_core', min: 1, max: 3 }, { material: 'nano_swarm', min: 0, max: 1 }],
  [RARITY.LEGENDARY.name]: [{ material: 'nano_swarm', min: 1, max: 2 }, { material: 'void_crystal', min: 0, max: 1 }]
};

export function getUpgradeCost(rarity, currentTier) {
  const rarityKey = rarity.name;
  const baseCost = {
    [RARITY.COMMON.name]: 30,
    [RARITY.UNCOMMON.name]: 60,
    [RARITY.RARE.name]: 150,
    [RARITY.EPIC.name]: 400,
    [RARITY.LEGENDARY.name]: 1000
  };
  const coins = Math.floor(baseCost[rarityKey] * Math.pow(1.8, currentTier - 1));

  const materialCosts = [];
  const tier = currentTier;

  if (rarity === RARITY.COMMON || rarity === RARITY.UNCOMMON) {
    materialCosts.push({ material: 'common_scrap', count: 2 + tier });
    if (tier >= 2) materialCosts.push({ material: 'alloy_plate', count: tier - 1 });
  }
  if (rarity === RARITY.RARE) {
    materialCosts.push({ material: 'alloy_plate', count: 2 + tier });
    if (tier >= 2) materialCosts.push({ material: 'energy_core', count: tier - 1 });
  }
  if (rarity === RARITY.EPIC) {
    materialCosts.push({ material: 'energy_core', count: 1 + tier });
    if (tier >= 2) materialCosts.push({ material: 'nano_swarm', count: tier - 1 });
  }
  if (rarity === RARITY.LEGENDARY) {
    materialCosts.push({ material: 'nano_swarm', count: tier });
    if (tier >= 3) materialCosts.push({ material: 'void_crystal', count: tier - 2 });
  }

  return { coins, materials: materialCosts };
}

export function generateRandomAffixes(creature) {
  const slots = RARITY_AFFIX_SLOTS[creature.rarity.name] || 1;
  const affixes = [];
  const usedCategories = new Set();
  const maxTierByRarity = {
    [RARITY.COMMON.name]: 1,
    [RARITY.UNCOMMON.name]: 2,
    [RARITY.RARE.name]: 2,
    [RARITY.EPIC.name]: 3,
    [RARITY.LEGENDARY.name]: 4
  };
  const maxTier = maxTierByRarity[creature.rarity.name] || 1;

  for (let i = 0; i < slots; i++) {
    const availableCategories = AFFIX_CATEGORIES.filter(c => !usedCategories.has(c));
    if (availableCategories.length === 0) break;

    const category = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    usedCategories.add(category);

    const pool = AFFIX_POOL[category].filter(a => a.tier <= maxTier);
    const weights = pool.map(a => 5 - a.tier);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedAffix = pool[0];
    for (let j = 0; j < pool.length; j++) {
      random -= weights[j];
      if (random <= 0) {
        selectedAffix = pool[j];
        break;
      }
    }
    affixes.push({ ...selectedAffix, category });
  }

  return affixes;
}

export function calculateCreatureValue(creature, tier, affixes) {
  let value = creature.value;
  value = value * (1 + (tier - 1) * 0.25);
  if (affixes) {
    affixes.forEach(affix => {
      if (affix.valueBonus) {
        value = value * (1 + affix.valueBonus);
      }
    });
  }
  return Math.floor(value);
}
