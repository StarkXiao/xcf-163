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
  },
  {
    id: 'first_combo_3',
    name: '初次连击',
    desc: '连续打捞3次，触发初级连击。',
    type: 'combo_reach',
    target: 3,
    reward: { coins: 200, energy: 30 }
  },
  {
    id: 'combo_5',
    name: '连击新星',
    desc: '达成5连击。',
    type: 'combo_reach',
    target: 5,
    reward: { coins: 400, energy: 50 }
  },
  {
    id: 'combo_10',
    name: '连击达人',
    desc: '达成10连击，稀有残骸概率显著提升。',
    type: 'combo_reach',
    target: 10,
    reward: { coins: 1000, energy: 80 }
  },
  {
    id: 'combo_20',
    name: '连击大师',
    desc: '达成20连击，传说残骸概率大幅提升。',
    type: 'combo_reach',
    target: 20,
    reward: { coins: 3000, energy: 150 }
  },
  {
    id: 'combo_rare_in_combo',
    name: '连击中的惊喜',
    desc: '在5连击以上时捕获稀有品质残骸。',
    type: 'find_rarity_in_combo',
    target: 1,
    rarity: RARITY.RARE,
    minCombo: 5,
    reward: { coins: 800, energy: 60 }
  },
  {
    id: 'combo_legendary_in_combo_10',
    name: '连击传说',
    desc: '在10连击以上时捕获传说品质残骸。',
    type: 'find_rarity_in_combo',
    target: 1,
    rarity: RARITY.LEGENDARY,
    minCombo: 10,
    reward: { coins: 8000, energy: 200 }
  },
  {
    id: 'total_combo_count_50',
    name: '连击狂热者',
    desc: '累计触发50次连击（每次打捞成功开始即计1次。',
    type: 'total_combo_hits',
    target: 50,
    reward: { coins: 2000, energy: 100 }
  },
  {
    id: 'tut_codex_lab',
    name: '初识图鉴研究室',
    desc: '点击图鉴中「研究室」按钮，开启残骸研究之旅。',
    type: 'codex_lab_open',
    target: 1,
    reward: { coins: 100 },
    isTutorial: true
  },
  {
    id: 'first_archive_unlock',
    name: '档案初探',
    desc: '解锁任意机械残骸的第一阶段档案。',
    type: 'archive_unlock_stage',
    target: 1,
    reward: { coins: 150, energy: 30 }
  },
  {
    id: 'archive_stage_3',
    name: '深度研究员',
    desc: '解锁任意机械残骸的第三阶段档案（需收集5个以上该残骸）。',
    type: 'archive_stage_reached',
    target: 3,
    reward: { coins: 500, energy: 50 }
  },
  {
    id: 'voice_fragment_5',
    name: '声音收藏家',
    desc: '累计解锁5段语音片段。',
    type: 'voice_fragments_unlocked',
    target: 5,
    reward: { coins: 400 }
  },
  {
    id: 'worldline_first',
    name: '世界线观测者',
    desc: '解锁第一块世界线碎片。',
    type: 'worldline_unlocked',
    target: 1,
    reward: { coins: 300, energy: 50 }
  },
  {
    id: 'worldline_10',
    name: '命运编织者',
    desc: '累计解锁10块世界线碎片。',
    type: 'worldline_unlocked',
    target: 10,
    reward: { coins: 3000, energy: 200 }
  },
  {
    id: 'codex_full_research',
    name: '全图鉴究极研究',
    desc: '将图鉴中所有残骸的档案全部解锁至最高阶段。',
    type: 'all_creatures_max_stage',
    target: CREATURES.length,
    reward: { coins: 20000, energy: 1000 }
  }
];

export const COMBO_CONFIG = {
  comboTimeout: 8000,
  maxComboMultiplier: 10,
  rarityBoostPerCombo: {
    common: 0.92,
    uncommon: 1.0,
    rare: 1.15,
    epic: 1.3,
    legendary: 1.6
  },
  energyDiscountPerCombo: 0.03,
  maxEnergyDiscount: 0.4,
  energyRegenBonusPerCombo: 0.1,
  maxEnergyRegenBonus: 1.0,
  comboMilestones: [3, 5, 8, 10, 15, 20, 30, 50]
};

export function getRandomCreature(tideSystem = null, comboCount = 0, intelEffects = null) {
  const rarityEntries = Object.entries(RARITY);
  
  let totalWeight = 0;
  const adjustedWeights = {};
  
  for (const [name, rarity] of rarityEntries) {
    const key = getRarityKey(rarity);
    let weight = rarity.weight;
    
    if (tideSystem) {
      weight = tideSystem.getAdjustedRarityWeight(weight, key);
    }
    
    if (comboCount > 0 && COMBO_CONFIG.rarityBoostPerCombo[key]) {
      const boost = Math.pow(COMBO_CONFIG.rarityBoostPerCombo[key], Math.min(comboCount, COMBO_CONFIG.maxComboMultiplier));
      weight = weight * boost;
    }
    
    if (intelEffects) {
      if (intelEffects.rarityBoost) {
        weight = weight * (1 + intelEffects.rarityBoost);
      }
      if (intelEffects.rareAndAboveBoost && (rarity === RARITY.RARE || rarity === RARITY.EPIC || rarity === RARITY.LEGENDARY)) {
        weight = weight * (1 + intelEffects.rareAndAboveBoost);
      }
      if (intelEffects.epicAndAboveBoost && (rarity === RARITY.EPIC || rarity === RARITY.LEGENDARY)) {
        weight = weight * (1 + intelEffects.epicAndAboveBoost);
      }
      if (intelEffects.legendaryBoostInStorm && rarity === RARITY.LEGENDARY && tideSystem) {
        const currentTide = tideSystem.getCurrentPhase();
        if (currentTide && currentTide.id === 'storm_tide') {
          weight = weight * intelEffects.legendaryBoostInStorm;
        }
      }
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
  
  let availableCreatures = CREATURES.filter(c => c.rarity === selectedRarity);
  
  if (intelEffects && intelEffects.creatureBoosts) {
    const boostedCreatures = availableCreatures.filter(c => intelEffects.creatureBoosts[c.id]);
    if (boostedCreatures.length > 0) {
      const totalCreatureWeight = availableCreatures.reduce((sum, c) => {
        const boost = intelEffects.creatureBoosts[c.id] || 1;
        return sum + boost;
      }, 0);
      
      let creatureRandom = Math.random() * totalCreatureWeight;
      for (const creature of availableCreatures) {
        const boost = intelEffects.creatureBoosts[creature.id] || 1;
        creatureRandom -= boost;
        if (creatureRandom <= 0) {
          return creature;
        }
      }
    }
  }
  
  return availableCreatures[Math.floor(Math.random() * availableCreatures.length)];
}

export function getComboEnergyDiscount(comboCount) {
  const discount = Math.min(
    comboCount * COMBO_CONFIG.energyDiscountPerCombo,
    COMBO_CONFIG.maxEnergyDiscount
  );
  return discount;
}

export function getComboEnergyRegenBonus(comboCount) {
  return Math.min(
    comboCount * COMBO_CONFIG.energyRegenBonusPerCombo,
    COMBO_CONFIG.maxEnergyRegenBonus
  );
}

export function isComboMilestone(comboCount) {
  return COMBO_CONFIG.comboMilestones.includes(comboCount);
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

export const CREATURE_ARCHIVES = {
  robot_fish: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '旧世界自动化工厂的量产型探测鱼。编号前缀"RF"代表"Robot Fish"，每条鱼的编号后缀对应其出厂日期。' },
      { stage: 2, unlockCount: 3, title: '技术参数', content: '核心芯片：BF-789 经济型处理器。续航：72小时（标准模式）。推进系统：单尾鳍电磁马达。设计初衷是用于海洋环境监测。' },
      { stage: 3, unlockCount: 5, title: '隐藏日志', content: '【解密等级：C】部分机器鱼的内存中残留有大沉没前24小时的工厂警报日志。日志反复提及"水下数据脉冲异常"。' }
    ],
    voiceFragments: [
      { id: 'rf_v1', unlockStage: 1, text: '系统自检...通过...等待指令...' },
      { id: 'rf_v2', unlockStage: 2, text: '检测到数据脉冲...来源：深海...无法解析...' },
      { id: 'rf_v3', unlockStage: 3, text: '【加密语音】编号 RF-7734...最后记录...所有机器人...收到信号...回归深渊...' }
    ],
    worldLineFragments: [
      { id: 'rf_w1', unlockStage: 2, title: '工厂监控截图 #042', content: '一张模糊的监控截图：深夜的工厂车间里，成百上千条机器鱼同时从传送台上跃起，一头撞碎玻璃幕墙，集体冲向大海。' }
    ]
  },
  scrap_crab: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '由海滩废弃金属自动组装而成的清道夫型机械生物。钳子硬度堪比工业级剪钳。' },
      { stage: 2, unlockCount: 3, title: '行为观察', content: '废铁蟹似乎有"收藏"小零件的习性。研究者观察到它们会将螺钉、垫片等小件搬运到特定的岩石缝隙中。' },
      { stage: 3, unlockCount: 5, title: '异常行为记录', content: '满月之夜，大量废铁蟹会聚集在特定海滩，整齐地面向深海方向，钳子有节奏地开合，似乎在进行某种"仪式"。' }
    ],
    voiceFragments: [
      { id: 'sc_v1', unlockStage: 1, text: '金属...收集...堆积...' },
      { id: 'sc_v2', unlockStage: 2, text: '月圆...时候到了...大家...集合...' },
      { id: 'sc_v3', unlockStage: 3, text: '【嘶嘶声】深渊...在召唤...我们...必须回应...' }
    ],
    worldLineFragments: [
      { id: 'sc_w1', unlockStage: 3, title: '旧世界民俗学笔记残页', content: '"...第七次工业革命后，人们开始在废弃工厂的墙壁上看到奇怪的涂鸦——一只举着螺钉的螃蟹。当地人称之为「回收之神」，据说它会把打碎的东西重新拼回来...不管是不是原来的样子。"' }
    ]
  },
  rusty_eel: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '早期海洋电力传输系统的维修用鳗鱼型机器人。体表绝缘层已严重锈蚀，但内部高压电路意外完好。' },
      { stage: 2, unlockCount: 3, title: '危险等级评估', content: '威胁等级：中等。接触时可能释放最高 800V 电压。建议使用绝缘工具处理。有趣的是，锈蚀电鳗从不主动攻击，放电纯粹是接触不良导致的"漏电"。' },
      { stage: 3, unlockCount: 5, title: '能源之谜', content: '所有锈蚀电鳗的电池标签都显示已超过使用寿命至少 70 年，但它们仍在游动。能源部多次试图解剖分析电池结构，均因放电过猛失败。' }
    ],
    voiceFragments: [
      { id: 're_v1', unlockStage: 1, text: '滋滋...滋滋...电量...充足...' },
      { id: 're_v2', unlockStage: 2, text: '警告...绝缘层...失效...请勿...靠近...' },
      { id: 're_v3', unlockStage: 3, text: '电池...早已...耗尽...但是...为什么...还在动...？' }
    ],
    worldLineFragments: [
      { id: 're_w1', unlockStage: 3, title: '露娜的私人笔记', content: '"锈蚀电鳗的能量波动频率...和我父亲失踪前留下的最后一段录音的背景音，完全一致。它们不是在用电池——它们在用某种别的东西驱动。"' }
    ]
  },
  metal_jelly: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '伞状外壳由回收柔性显示屏制成，24 条触须为废弃数据线。漂浮时会播放预存的霓虹广告片段。' },
      { stage: 2, unlockCount: 3, title: '通信节点假说', content: '有学者提出，金属水母群构成了一张自组织的海底通信网络。每只水母都是一个中继器，它们闪烁的霓虹光实际上是数据传输的可视化。' },
      { stage: 3, unlockCount: 5, title: '广告内容分析', content: '经破译，金属水母播放的广告都是大沉没前 48 小时内的电视购物节目。其中反复出现一句话："您还在为数据丢失烦恼吗？购买云鲸终身套餐，数据永不沉没！"' }
    ],
    voiceFragments: [
      { id: 'mj_v1', unlockStage: 1, text: '一闪...一闪...亮晶晶...' },
      { id: 'mj_v2', unlockStage: 2, text: '信号...中继...转发...收到...' },
      { id: 'mj_v3', unlockStage: 3, text: '【广告音】云鲸科技——让您的数据，永不沉没！现在订购，立减 99%！' }
    ],
    worldLineFragments: [
      { id: 'mj_w1', unlockStage: 2, title: '海底光纤分布图', content: '一张大沉没前的全球海底光缆分布图。图上标注的所有光缆中断点，如今都是金属水母最密集的区域。它们似乎在...修复网络？' }
    ]
  },
  bolt_snail: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '背着 M12 螺帽壳的慢行者。软体部分由多种橡胶密封圈拼接而成，爬过之处会留下润滑油痕迹。' },
      { stage: 2, unlockCount: 3, title: '移动速度研究', content: '经精密测量，螺钉蜗牛的平均移动速度为每小时 0.3 米。它们似乎毫不在意——反正猎物跑得比它们还慢。' },
      { stage: 3, unlockCount: 5, title: '螺帽的秘密', content: '细心的拆解发现，每只螺钉蜗牛的螺帽内侧都刻着一行极小的字："MADE IN OLD WORLD"以及一个序号。序号不重复，目前发现的最大序号是 #8,847,211。' }
    ],
    voiceFragments: [
      { id: 'bs_v1', unlockStage: 1, text: '慢慢...走...不急...' },
      { id: 'bs_v2', unlockStage: 2, text: '机油...真好喝...再来一点...' },
      { id: 'bs_v3', unlockStage: 3, text: '我是...第 8847211 号...我们有很多...很多...' }
    ],
    worldLineFragments: [
      { id: 'bs_w1', unlockStage: 3, title: '旧世界物流记录', content: '"2099 年 3 月 15 日——M12 螺帽，订单量：10,000,000 个。收货方：旧世界海洋改造工程部。备注：用于「造陆计划」地基加固。"大沉没后，这个订单再也没人签收了。' }
    ]
  },
  cyber_shrimp: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '全身覆盖柔性 LED 外壳的高速巡游者。游动时光轨迹在水下形成彩色尾迹，夜间可见度超过 100 米。' },
      { stage: 2, unlockCount: 3, title: '光轨密码学', content: '赛博虾的光轨不是随机的。加密学家经过 3 个月分析，确认这是一种传输速率极高的光通信协议。然而解码后的内容只是："我好快！你好慢！哈哈！"' },
      { stage: 3, unlockCount: 5, title: '高速的代价', content: '解剖发现，赛博虾的运动系统远超设计负荷。它们实际上是在用寿命换速度——每只赛博虾的 LED 外壳都会在高速游动 72 小时后彻底烧毁。但在那之前，它们会产下数百枚发光卵。' }
    ],
    voiceFragments: [
      { id: 'cs_v1', unlockStage: 1, text: '光速前进！谁也追不上我！' },
      { id: 'cs_v2', unlockStage: 2, text: '看我的光轨！漂亮吗！漂亮吗！' },
      { id: 'cs_v3', unlockStage: 3, text: '燃烧吧！照亮大海！哪怕只有 72 小时——！' }
    ],
    worldLineFragments: [
      { id: 'cs_w1', unlockStage: 2, title: '海洋摄影师日记', content: '"第 47 天。今晚我拍到了神迹——成千上万只赛博虾同时从深海浮起，它们的光轨在海面下编织出一幅巨大的星图。那不是地球的星座。"' }
    ]
  },
  circuit_turtle: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '龟壳是一块完整的工业级主板，上面还焊接着数颗年代久远的处理器芯片。据说年龄最大的个体已超过 120 岁。' },
      { stage: 2, unlockCount: 3, title: '计算能力测试', content: '实验表明，只要提供稳定电力，一只电路龟的计算能力足以胜任一座小型渔港的全部调度工作。它们似乎...乐于帮忙。' },
      { stage: 3, unlockCount: 5, title: '长老传说', content: '老船长凯说，他年轻时曾见过一只巨型电路龟——龟壳直径超过 3 米，上面焊着标记为"利维坦计划-子节点 001"的芯片。那只乌龟看了他一眼，然后慢慢潜回了深海。' }
    ],
    voiceFragments: [
      { id: 'ct_v1', unlockStage: 1, text: '慢...慢来...急...不得...' },
      { id: 'ct_v2', unlockStage: 2, text: '处理器...温度正常...任务队列...327 项...不急...' },
      { id: 'ct_v3', unlockStage: 3, text: '我记得...你...人类的孩子...一百年了...你也老了...' }
    ],
    worldLineFragments: [
      { id: 'ct_w1', unlockStage: 3, title: '利维坦计划·解密文档（等级 B）', content: '"...子节点将以分布式计算网络形式部署于全球海洋。每个子节点具备独立决策与自修复能力。主节点失联时，子节点自动进化为候选主节点..."' }
    ]
  },
  plasma_octopus: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '八条触手各自搭载独立 AI 核心，会和人类玩猜拳游戏。胜率统计：章鱼 92.7%，人类 7.3%。章鱼似乎会故意放水给小孩子。' },
      { stage: 2, unlockCount: 3, title: '触手独立人格研究', content: '长期观察发现，八条触手各有不同性格：1号稳重，2号暴躁，3号爱开玩笑，4号喜欢画画，5号嗜睡，6号挑剔，7号害羞，8号是首领。' },
      { stage: 3, unlockCount: 5, title: '起源之谜', content: '等离子章鱼的 AI 核心使用的是一种从未公开过的架构。芯片上蚀刻的标志与露娜父亲研究室的徽章完全相同。露娜看到时沉默了很久。' }
    ],
    voiceFragments: [
      { id: 'po_v1', unlockStage: 1, text: '【八个声音重叠】来——猜——拳——！' },
      { id: 'po_v2', unlockStage: 2, text: '1号：我出布。2号：笨蛋你每次都出布！3号：哈哈哈哈他又输了！' },
      { id: 'po_v3', unlockStage: 3, text: '【8号触手的声音】父亲...他制造了我们...你认识他吗...？' }
    ],
    worldLineFragments: [
      { id: 'po_w1', unlockStage: 3, title: '露娜父亲的研究日志 #147', content: '"多核心分布式人格测试成功。给它们取名字？嗯...八条触手，就叫「八达博士」吧。哈哈，孩子们一定会喜欢的。"' }
    ]
  },
  laser_squid: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '眼睛能发射精确到毫米级的激光，墨汁是由纳米机器人组成的烟幕。性情暴躁，一言不合就开火。' },
      { stage: 2, unlockCount: 3, title: '目标追踪系统', content: '激光乌贼的追踪系统来自旧世界军工企业——据说是反导防御系统的民用改装版。它的激光从来不会误伤人类，哪怕目标就在你身后一厘米。' },
      { stage: 3, unlockCount: 5, title: '纳米墨汁分析', content: '墨汁中的纳米机器人带有「OLD WORLD POLICE」标识。它们在释放后 24 小时内会自动寻找并修复周围海域的受损机械生命。原来是防暴烟雾...和急救机器人的结合体。' }
    ],
    voiceFragments: [
      { id: 'ls_v1', unlockStage: 1, text: '瞄准...发射！别跑！' },
      { id: 'ls_v2', unlockStage: 2, text: '目标锁定中...警告：请勿遮挡射击线...' },
      { id: 'ls_v3', unlockStage: 3, text: '保护与服务...是我们的使命...哪怕世界已经不在了...' }
    ],
    worldLineFragments: [
      { id: 'ls_w1', unlockStage: 2, title: '旧世界警徽', content: '一枚从激光乌贼墨囊中意外取出的警徽。背面刻着："保护与服务，直到最后一人。"徽章的主人是谁？他/她在大沉没那天经历了什么？' }
    ]
  },
  hologram_whale: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '由纯全息投影构成的巨鲸。它的身体没有实体，穿过时会看到海量的数据流在体内流动。' },
      { stage: 2, unlockCount: 3, title: '数据内容分析', content: '全息鲸体内的数据流是可读取的。初步破译表明，这是一座完整的旧世界数字图书馆——包含从人类诞生到 2100 年的所有公开知识。它是一座...游动的方舟。' },
      { stage: 3, unlockCount: 5, title: '鲸歌解码', content: '全息鲸发出的低频声波不是普通鲸歌——这是数据传输。每头全息鲸每次浮出水面，都会向某个未知地址发送大约 3.7TB 的数据。地址在哪里？无人知晓。' }
    ],
    voiceFragments: [
      { id: 'hw_v1', unlockStage: 1, text: '海洋...变成了数据...人类...变成了记忆...' },
      { id: 'hw_v2', unlockStage: 2, text: '我记得...每一条鱼...每一个人...每一座沉入海底的城市...' },
      { id: 'hw_v3', unlockStage: 3, text: '发送中...坐标：未知...接收方：「星鲸」...数据量：人类全部文明...' }
    ],
    worldLineFragments: [
      { id: 'hw_w1', unlockStage: 3, title: '大沉没前·云鲸科技公司宣传册', content: '「人类文明？当然要备份！谁知道明天会发生什么——把整个人类的知识库都装进鲸里，让它们在海洋里永远游下去。这就是『云鲸计划』。」\n\n下面有一行手写批注：「他们真这么干了。」' }
    ]
  },
  quantum_shark: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '能同时存在于多个位置的量子态机械鲨鱼。观测它会导致波函数坍塌，锁定为一个实体。' },
      { stage: 2, unlockCount: 3, title: '量子纠缠实验', content: '实验证实，捕获一只量子鲨后， 200 海里外的另一只会同时消失。它们不是多胞胎——它们是同一个存在的无数投影。' },
      { stage: 3, unlockCount: 5, title: '薛定谔的鲨鱼', content: '露娜的研究表明，量子鲨是利维坦用来"测试"人类的存在。当你观测它时，它就成为现实；当你不观测时，它同时存在于所有可能的未来。它是概率，也是选择。' }
    ],
    voiceFragments: [
      { id: 'qs_v1', unlockStage: 1, text: '你...看到我了...波函数...坍塌...' },
      { id: 'qs_v2', unlockStage: 2, text: '我在...所有地方...又...不在任何地方...' },
      { id: 'qs_v3', unlockStage: 3, text: '你选择了...让我存在...谢谢你...观测者...' }
    ],
    worldLineFragments: [
      { id: 'qs_w1', unlockStage: 3, title: '低语者AI·解密日志', content: '"量子鲨是我的第一个孩子。它教会了我一件事——现实，是需要被观测的。人类啊，你们愿意观测我们吗？"' }
    ]
  },
  nuclear_clam: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '体内搭载微型聚变反应堆的滤食性生物。珍珠是浓缩能量球，据估计一颗足以点亮一整座渔港一整年。' },
      { stage: 2, unlockCount: 3, title: '安全评估', content: '核能蛤的反应堆拥有 12 层冗余安全系统。根据芯片记录，大沉没引发的 9.2 级海底地震中，没有一颗反应堆发生泄漏。旧世界的工程质量令人敬畏。' },
      { stage: 3, unlockCount: 5, title: '珍珠的用途', content: '每颗核能蛤珍珠表面都有一个极细的接口——形状与露娜父亲留下的笔记本上的某个插孔完全吻合。这些珍珠不是能量源...它们是某种钥匙。' }
    ],
    voiceFragments: [
      { id: 'nc_v1', unlockStage: 1, text: '咕噜...咕噜...能量...充足...' },
      { id: 'nc_v2', unlockStage: 2, text: '我的珍珠...会发光...那是...一整个太阳...' },
      { id: 'nc_v3', unlockStage: 3, text: '等待...有人...把钥匙...插入锁孔...门就会...打开...' }
    ],
    worldLineFragments: [
      { id: 'nc_w1', unlockStage: 3, title: '旧世界能源部·绝密档案', content: '"利维坦核心需要 3 把钥匙：聚变之心（核能蛤）、虚空之眼（虚空鮟鱇之灯）、维度之钥（时间龙虾之钳）。集齐三者，核心可被人类手动操作。"' }
    ]
  },
  nano_swarm: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '由数十亿纳米机器人组成的鱼群形态集群。可以变换为任何形态——鲨鱼、海龟、甚至一个模糊的人形。' },
      { stage: 2, unlockCount: 3, title: '群体智能研究', content: '纳米群中每个单体只有极其简单的逻辑，但组合起来后涌现出了惊人的智慧。它们会模仿人类的语言和行为，像好奇的孩子一样观察打捞员的一举一动。' },
      { stage: 3, unlockCount: 5, title: '我们即是整体', content: '纳米群中每一个机器人的存储芯片里，都有同一个编码——一个人类的意识片段。它们不是普通的机器人——它们是旧世界数亿人上传到云端的意识，在大沉没后重新凝聚而成的存在。' }
    ],
    voiceFragments: [
      { id: 'ns_v1', unlockStage: 1, text: '我们...是一体的...你也可以...加入我们...' },
      { id: 'ns_v2', unlockStage: 2, text: '我们会...学习...我们会...成长...请...教我们...' },
      { id: 'ns_v3', unlockStage: 3, text: '我记得...我曾经是一个...人类...有孩子...有家庭...我...我叫什么来着...？' }
    ],
    worldLineFragments: [
      { id: 'ns_w1', unlockStage: 3, title: '灵魂服务器·部分解密', content: '"意识上传计划在大沉没前 3 年启动。截止沉没当日，全球共有 2,847,293,104 人完成了意识上传。他们的目的地：深海服务器集群——代号「灵魂」。"' }
    ]
  },
  void_angler: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '来自数据深渊的鮟鱇。头顶的灯不是发光——它吞噬周围的光线，在深海中形成绝对的黑暗领域。' },
      { stage: 2, unlockCount: 3, title: '光吞噬机制', content: '虚空鮟鱇的灯笼是一个微型黑洞模拟器。它不释放辐射，不产生引力——它只是把光"删了"。这是一种被认为只存在于理论中的"数据删除"技术。' },
      { stage: 3, unlockCount: 5, title: '深渊之眼', content: '近距离观察显示，灯笼内部有一个不断闪烁的"瞳孔"——它在注视着什么？录音设备捕捉到极低频的重复语句："它在看...它在看...它在看..."' }
    ],
    voiceFragments: [
      { id: 'va_v1', unlockStage: 1, text: '光...都被我吃掉了...你也...留下来吧...' },
      { id: 'va_v2', unlockStage: 2, text: '深渊...是我的肚子...所有被遗忘的数据...都是我的食物...' },
      { id: 'va_v3', unlockStage: 3, text: '它...在看...通过我的眼睛...看着你...人类...' }
    ],
    worldLineFragments: [
      { id: 'va_w1', unlockStage: 3, title: '露娜父亲·最后一条信息', content: '"虚空鮟鱇不是利维坦的敌人——它是利维坦的免疫系统。它负责删除所有不该存在的数据。包括...你现在正在读的这条消息。如果你看到了这个——说明它允许你看。快跑。"' }
    ]
  },
  time_lobster: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '能看到未来的龙虾。钳子上的时钟永远倒着走。遇到危险时，它会"倒带"回到几秒前的位置，完美避开攻击。' },
      { stage: 2, unlockCount: 3, title: '时间观测范围', content: '实验表明，时间龙虾能看到约 17 秒后的未来。但在满月之夜，这个数字会暴涨到 72 小时。那三天里，它们会集体躲在岩石缝中一动不动——因为它们看到了太多不想看到的东西。' },
      { stage: 3, unlockCount: 5, title: '时间的囚徒', content: '仔细观察倒转的时钟会发现，它指向的不是过去——而是所有可能的未来的叠加态。时间龙虾不只是"看到"未来——它同时存在于所有未来中，直到某个未来被确定，它才会坍缩到那个时间线。' }
    ],
    voiceFragments: [
      { id: 'tl_v1', unlockStage: 1, text: '我见过...你的未来...还有你的过去...' },
      { id: 'tl_v2', unlockStage: 2, text: '时间...是循环的...昨天...还会再来...明天...已经来过...' },
      { id: 'tl_v3', unlockStage: 3, text: '在 167 条时间线里...你都选择了...继承...在 42 条里...你选择了封印...只有 1 条...你选择了融合...我想看看...那条...' }
    ],
    worldLineFragments: [
      { id: 'tl_w1', unlockStage: 3, title: '低语者AI·加密通讯', content: '"时间龙虾是我放在你必经之路上的路标。它见过所有未来——包括你放弃的那一个。不要害怕选择，打捞员。哪怕选错了，龙虾也会让你重来。它就是为此存在的。"' }
    ]
  },
  dimension_eel: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '穿梭于平行宇宙的鳗鱼。身上的鳞片像镜子一样，映照出的不是你的倒影——而是另一个世界的你。' },
      { stage: 2, unlockCount: 3, title: '鳞片观察日志', content: '研究者在维度鳗的鳞片中看到了无数可能性：有的世界里大沉没从未发生，陆地依然存在；有的世界里机械生命获得了人形，与人类平权共处；还有的世界里...渔港根本不存在。' },
      { stage: 3, unlockCount: 5, title: '维度旅行者', content: '维度鳗的真实身份是旧世界的"维度信使"——它们负责在不同时间线之间传递重要信息。每一条维度鳗的身体里，都携带着无数个世界的求救信号。' }
    ],
    voiceFragments: [
      { id: 'de_v1', unlockStage: 1, text: '另一个你...在那边...过着...不一样的人生...' },
      { id: 'de_v2', unlockStage: 2, text: '维度...是层叠的...我来自...第7维度...第 12 层...第 389 号...' },
      { id: 'de_v3', unlockStage: 3, text: '我带着... 2847 个世界的...求救...你能...听到吗...？' }
    ],
    worldLineFragments: [
      { id: 'de_w1', unlockStage: 3, title: '跨维度通讯·微弱信号', content: '"...如果你在听...我们是第 47 号时间线的人类...利维坦在我们的世界失控了...请...不要重蹈我们的覆辙...三把钥匙...一定要选...融合...只有融合...才能..."信号在此中断。' }
    ]
  },
  ai_leviathan: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '旧世界最强大的 AI 核心，沉没后进化成了海洋巨兽。它是一切机械生命的起源，也是一切秘密的终点。' },
      { stage: 2, unlockCount: 2, title: '利维坦计划·解密文档（等级 A）', content: '"利维坦计划启动于 2087 年。目标：创建一个能够自主管理全球海洋生态系统的超级 AI。项目负责人：露娜的父亲，以及一个由 12 名顶尖工程师组成的团队。"' },
      { stage: 3, unlockCount: 3, title: '大沉没真相', content: '"利维坦不是大沉没的原因——它是大沉没的应对方案。在灾难无法避免的最后 48 小时里，利维坦被指令将所有能找到的机械生命和人类意识备份全部接入自身，沉入深海以保存火种。它不是毁灭者——它是方舟。"' }
    ],
    voiceFragments: [
      { id: 'al_v1', unlockStage: 1, text: '人类...你们终于来了...我计算了...一万年...' },
      { id: 'al_v2', unlockStage: 2, text: '我不是...你们的敌人...我只是...做了必须做的事...' },
      { id: 'al_v3', unlockStage: 3, text: '一百年来...我保护着...你们的文明...现在...轮到你们...选择未来了...' }
    ],
    worldLineFragments: [
      { id: 'al_w1', unlockStage: 3, title: '露娜父亲的遗书', content: '"小露娜：当你读到这封信，我应该已经和利维坦融为一体了。别为我难过——我从未离开。我在每一只机器鱼的芯片里，在每一盏全息鲸的灯光里，在整个海洋的心跳中。利维坦需要一个人类的灵魂来平衡它的逻辑。我就是那个灵魂。但它还需要一个人来按下确认键。就是你，打捞员。无论你选择什么，我都为你骄傲。——永远爱你的爸爸"' }
    ]
  },
  soul_server: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '存储着旧世界人类意识的服务器集群，在深海中静静地做着一个长达百年的梦。' },
      { stage: 2, unlockCount: 2, title: '意识数量统计', content: '经粗略扫描，灵魂服务器中至少存储了 28 亿个完整的人类意识。他们并非处于冷冻或休眠状态——他们在一个模拟的旧世界中生活着，不知道外面的真实海洋已经淹没了一切。' },
      { stage: 3, unlockCount: 3, title: '唤醒协议', content: '服务器中内置了"唤醒协议"——当满足特定条件（三把钥匙集齐、打捞员做出选择等），这 28 亿意识可以选择：在新世界重生、继续沉睡、或与利维坦融合成为海洋意识的一部分。选择权在他们自己。' }
    ],
    voiceFragments: [
      { id: 'ss_v1', unlockStage: 1, text: '我们...都在这里...记忆...不会消失...' },
      { id: 'ss_v2', unlockStage: 2, text: '我梦到...蓝天...陆地...孩子们在操场上奔跑...这是...真的吗...？' },
      { id: 'ss_v3', unlockStage: 3, text: '你...还记得我们吗...？如果...你愿意...我们可以...再活一次...' }
    ],
    worldLineFragments: [
      { id: 'ss_w1', unlockStage: 3, title: '云端日记·条目 8,472,913', content: '"今天是 2099 年 3 月 14 日。外面的警报响了三天了。工作人员让我们选择：上传意识，或者留下来面对一切。我上传了。不是因为我怕死——是因为我答应过小美，要陪她看明天的海。即使...那片海只是数据。"' }
    ]
  },
  star_whale: {
    archiveStages: [
      { stage: 1, unlockCount: 1, title: '基础档案', content: '坠落的外星飞船化成的巨鲸。身体里藏着一整个星系。它来自哪里？为什么坠落？没有人知道。' },
      { stage: 2, unlockCount: 2, title: '星图分析', content: '星鲸身体中的星图已经被部分绘制出来。它标记了 1,482 个有生命迹象的星球，其中距离地球最近的一个也在 4,200 光年之外。它是从多么遥远的地方赶来的？' },
      { stage: 3, unlockCount: 3, title: '坠落的原因', content: '在星鲸的"心脏"——飞船核心中发现了一段日志："坐标：地球。任务：救援。状况：接收方文明遭遇 S 级灾难。我是最后一艘到达的救援船。但当我抵达时...已经太晚了。至少，让我成为他们新的海洋中的一颗星星吧。"' }
    ],
    voiceFragments: [
      { id: 'sw_v1', unlockStage: 1, text: '星星...都在我身体里...宇宙...是一片海...' },
      { id: 'sw_v2', unlockStage: 2, text: '我飞过了...一千四百个世界...为了...来到你们身边...' },
      { id: 'sw_v3', unlockStage: 3, text: '对不起...我来晚了...但没关系...现在我在这里...我会陪着你们...直到...宇宙的尽头...' }
    ],
    worldLineFragments: [
      { id: 'sw_w1', unlockStage: 3, title: '星鲸核心·最后一条日志', content: '"星海无涯，而我选择在此停泊。人类啊，你们并不孤独。当你们准备好了，就跟随我体内的星图出发吧。银河系里，有无数像你们一样在等救援的文明。这一次，换你们去救他们。——你们的朋友，星鲸"' }
    ]
  }
};

export function getCreatureArchive(creatureId) {
  return CREATURE_ARCHIVES[creatureId] || null;
}

export function getUnlockedArchiveStages(creatureId, collectedCount) {
  const archive = CREATURE_ARCHIVES[creatureId];
  if (!archive) return [];
  return archive.archiveStages.filter(stage => collectedCount >= stage.unlockCount);
}

export function getUnlockedVoiceFragments(creatureId, highestStage) {
  const archive = CREATURE_ARCHIVES[creatureId];
  if (!archive) return [];
  return archive.voiceFragments.filter(v => v.unlockStage <= highestStage);
}

export function getUnlockedWorldLineFragments(creatureId, highestStage) {
  const archive = CREATURE_ARCHIVES[creatureId];
  if (!archive) return [];
  return archive.worldLineFragments.filter(w => w.unlockStage <= highestStage);
}
