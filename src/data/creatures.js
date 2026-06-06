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
    id: 'find_legendary',
    name: '传说降临',
    desc: '捕获1个传说品质的机械残骸。',
    type: 'find_rarity',
    target: 1,
    rarity: RARITY.LEGENDARY,
    reward: { coins: 5000, energy: 200 }
  },
  {
    id: 'collect_all',
    name: '全收集',
    desc: '收集所有种类的机械残骸。',
    type: 'unique_collected',
    target: CREATURES.length,
    reward: { coins: 10000 }
  }
];

export function getRandomCreature() {
  const totalWeight = Object.values(RARITY).reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;
  
  let selectedRarity = RARITY.COMMON;
  for (const rarity of Object.values(RARITY)) {
    if (random < rarity.weight) {
      selectedRarity = rarity;
      break;
    }
    random -= rarity.weight;
  }
  
  const availableCreatures = CREATURES.filter(c => c.rarity === selectedRarity);
  return availableCreatures[Math.floor(Math.random() * availableCreatures.length)];
}
