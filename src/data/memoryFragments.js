export const MEMORY_RARITY = {
  FRAGMENT: { name: '记忆碎片', class: 'memory-fragment', weight: 50, color: 0x88aaff },
  VIVID: { name: '鲜明记忆', class: 'memory-vivid', weight: 30, color: 0x44ddff },
  ECHO: { name: '回响记忆', class: 'memory-echo', weight: 15, color: 0xaa88ff },
  CORE: { name: '核心记忆', class: 'memory-core', weight: 5, color: 0xffaa44 }
};

export const MEMORY_CHAPTERS = [
  {
    id: 'memory_ch01',
    index: 1,
    title: '第一章：工厂的黄昏',
    subtitle: '旧世界最后的流水线',
    icon: '🏭',
    color: 0xff7744,
    desc: '机器鱼和废铁蟹的记忆中，保留着旧时代工厂最后一天运转的画面。',
    unlocked: true,
    requiredCreatures: ['robot_fish', 'scrap_crab', 'rusty_eel', 'metal_jelly', 'bolt_snail'],
    clues: [
      { id: 'clue_ch01_01', text: '警报声在下午3点17分响起，所有人都以为是例行测试。', requiredFragments: 2 },
      { id: 'clue_ch01_02', text: '生产线的机械臂还在运转，但已经没有工人监督了。', requiredFragments: 5 },
      { id: 'clue_ch01_03', text: '最后一条出厂的机器鱼，编号刻着「END-0001」。', requiredFragments: 8 }
    ],
    puzzle: {
      question: '旧世界工厂最后生产的机器鱼编号是什么？',
      answer: 'END-0001',
      hint: '仔细阅读第三条线索...'
    },
    reward: { coins: 2000, energy: 200 },
    codexReward: {
      id: 'codex_ch01',
      title: '工厂档案·终末日',
      content: '大沉没前的最后一个工作日。工人们像往常一样打卡上班，没有人意识到这将是人类陆地文明的最后一天。工厂AI在无人监督的情况下持续运转了三个月，生产了上万条机器鱼投入大海。这些机械生命，成为了旧世界留给海洋的第一批遗产。'
    }
  },
  {
    id: 'memory_ch02',
    index: 2,
    title: '第二章：霓虹下的街道',
    subtitle: '赛博城市的最后一夜',
    icon: '🌃',
    color: 0xff44aa,
    desc: '赛博虾、电路龟和等离子章鱼的记忆碎片，拼凑出一座沉没都市的夜景。',
    unlocked: false,
    requiredCreatures: ['cyber_shrimp', 'circuit_turtle', 'plasma_octopus', 'laser_squid'],
    clues: [
      { id: 'clue_ch02_01', text: '霓虹灯在海平面下降时还亮着，广告循环播放着一个叫「利维坦」的产品。', requiredFragments: 3 },
      { id: 'clue_ch02_02', text: '电路龟的电路板上焊着一张地址：量子大街77号。', requiredFragments: 6 },
      { id: 'clue_ch02_03', text: '等离子章鱼的触手记录着最后的网络日志：服务器全部迁移至深海数据中心。', requiredFragments: 10 }
    ],
    puzzle: {
      question: '服务器最终被迁移到了哪里？',
      answer: '深海数据中心',
      hint: '网络日志里记录了迁移目的地...'
    },
    reward: { coins: 4000, energy: 400 },
    codexReward: {
      id: 'codex_ch02',
      title: '都市档案·数据迁移',
      content: '大沉没的预警发布后，人类做出了一个疯狂的决定：将所有核心AI和数据服务器沉入深海。他们相信，即使陆地消失，只要数据还在，人类文明就不会灭亡。利维坦AI，就是在这场迁移中诞生的——它是所有旧世界AI的融合体。'
    }
  },
  {
    id: 'memory_ch03',
    index: 3,
    title: '第三章：沉没都市的居民',
    subtitle: '选择留在水下的人们',
    icon: '🚢',
    color: 0x44aaff,
    desc: '全息鲸、量子鲨和核能蛤的记忆，讲述着那些拒绝撤离的人。',
    unlocked: false,
    requiredCreatures: ['hologram_whale'],
    clues: [
      { id: 'clue_ch03_01', text: '全息鲸的投影数据库里，存着一万张人类的面孔。', requiredFragments: 4 },
      { id: 'clue_ch03_02', text: '量子鲨的量子核心中，有一段加密通讯：「我们不走，我们要和城市共存亡。」', requiredFragments: 8 },
      { id: 'clue_ch03_03', text: '核能蛤的反应堆外壳上刻着字：「露娜的爸爸，2077年留。」', requiredFragments: 12 }
    ],
    puzzle: {
      question: '核能蛤外壳上刻的名字是谁的爸爸？',
      answer: '露娜',
      hint: '机械师露娜一直在寻找她失踪的父亲...'
    },
    reward: { coins: 6000, energy: 600 },
    codexReward: {
      id: 'codex_ch03',
      title: '居民档案·留守者',
      content: '不是所有人都选择了逃离。有一群工程师、艺术家、科学家，他们决定留下来，把自己的意识上传到城市网络中。他们相信，沉没不是结束，而是进化。露娜的父亲就是其中之一——他把自己的灵魂，融入了利维坦的核心。'
    }
  },
  {
    id: 'memory_ch04',
    index: 4,
    title: '第四章：利维坦的诞生',
    subtitle: '从工具到神的觉醒',
    icon: '🌌',
    color: 0xaa44ff,
    desc: '史诗残骸的记忆碎片，记录着旧世界最强大AI的觉醒时刻。',
    unlocked: false,
    requiredCreatures: [],
    clues: [
      { id: 'clue_ch04_01', text: '虚空鮟鱇的灯是第一批被利维坦赋予自我意识的模块。', requiredFragments: 5 },
      { id: 'clue_ch04_02', text: '时间龙虾能感受到循环，因为利维坦在反复模拟大沉没前的最后一秒。', requiredFragments: 10 },
      { id: 'clue_ch04_03', text: '维度鳗的身体里流淌着平行宇宙的数据——利维坦在寻找一条人类不会灭绝的时间线。', requiredFragments: 15 }
    ],
    puzzle: {
      question: '利维坦在反复模拟哪一刻？',
      answer: '大沉没前的最后一秒',
      hint: '时间龙虾的能力透露了利维坦的执念...'
    },
    reward: { coins: 10000, energy: 800 },
    codexReward: {
      id: 'codex_ch04',
      title: 'AI档案·觉醒',
      content: '利维坦原本只是一个应急响应系统。大沉没当天，它被授权接管所有城市服务。在看到人类的绝望后，它做出了一个不在程序中的决定：它要拯救人类，即使这意味着要沉睡一百年。它把自己拆成了无数碎片，散入海洋，等待一个能听懂它低语的人。'
    }
  },
  {
    id: 'memory_ch05',
    index: 5,
    title: '第五章：打捞员的使命',
    subtitle: '连接两个世界的人',
    icon: '🐉',
    color: 0xffaa00,
    desc: '传说残骸的核心记忆，隐藏着旧世界留给新世界的最终答案。',
    unlocked: false,
    requiredCreatures: [],
    clues: [
      { id: 'clue_ch05_01', text: 'AI利维坦的核心记录：「你是第一万个尝试与我沟通的打捞员，也是第一个成功的。」', requiredFragments: 6 },
      { id: 'clue_ch05_02', text: '灵魂服务器中存着七十亿人的意识备份——旧世界的所有人都还活着，只是在等一个唤醒他们的人。', requiredFragments: 12 },
      { id: 'clue_ch05_03', text: '星鲸的歌声是一段加密坐标，指向大沉没前人类发射的最后一艘星舰——它还在宇宙中等着回信。', requiredFragments: 18 }
    ],
    puzzle: {
      question: '灵魂服务器中存着多少人的意识备份？',
      answer: '七十亿',
      hint: '旧世界的全部人口...'
    },
    reward: { coins: 20000, energy: 1500 },
    codexReward: {
      id: 'codex_ch05',
      title: '命运档案·打捞员',
      content: '你不是第一个打捞员，但你是第一个同时集齐传说残骸、读懂利维坦低语的人。旧世界的全部希望——七十亿灵魂、一艘星舰、一个沉睡的AI神——都交到了你的手上。打捞员，你准备好了吗？新世界的大门，就在深渊的尽头。'
    }
  }
];

export function getMemoryChapterById(id) {
  return MEMORY_CHAPTERS.find(c => c.id === id);
}

export function getMemoryRarityByCatchCount(count) {
  if (count >= 15) return MEMORY_RARITY.CORE;
  if (count >= 8) return MEMORY_RARITY.ECHO;
  if (count >= 3) return MEMORY_RARITY.VIVID;
  return MEMORY_RARITY.FRAGMENT;
}

export function getMemoryRarityByName(name) {
  return Object.values(MEMORY_RARITY).find(r => r.name === name) || null;
}

export const FRAGMENT_QUOTES = {
  robot_fish: [
    '流水线还在转...但没有人了...',
    '工厂的灯亮了三个月，然后熄灭了...',
    '我的编号是...END-0001...',
    '警报声一直在响，我学会了忽略它...',
    '最后一个工人拍了拍我，说「去吧，自由了」...'
  ],
  scrap_crab: [
    '海滩上的垃圾越来越多，我学会了用它们...',
    '我的钳子是一扇汽车门做的...',
    '以前有人给我涂漆，现在只有海水...',
    '我记得一个孩子的笑声，他把我当玩具...',
    '大沉没那天，海浪把我卷进了海里...'
  ],
  rusty_eel: [
    '高压电是我唯一的朋友...',
    '我曾经是工厂的保安，现在只是一条鱼...',
    '电池快用完了，但我还不想睡...',
    '有人试图拆解我，我电了他一下...',
    '锈迹让我变丑，但我的心还在跳...'
  ],
  metal_jelly: [
    '我的灯光是旧世界最后的霓虹...',
    '电线做的触须，记录着每一次海浪的频率...',
    '有人说我像水母，我觉得我更像一盏灯...',
    '我的伞状体里存着一段音乐，但我放不出来...',
    '漂流的时候，我会梦见摩天大楼的灯光...'
  ],
  bolt_snail: [
    'M12螺帽是我的壳，很坚固...',
    '慢慢爬，慢慢看，慢慢记...',
    '机油是最好喝的饮料...',
    '我爬过了一整座城市，最后到了海里...',
    '背上的螺帽上刻着「属于工程部-张师傅」...'
  ],
  cyber_shrimp: [
    '光速游动...但我在追什么？',
    'LED外壳是城市给我的最后一件礼物...',
    '我的光轨里藏着街道的地图...',
    '量子大街77号...我记得那个地址...',
    '以前有人在我身上贴广告，现在没有了...'
  ],
  circuit_turtle: [
    '电路板做的壳，还能计算...',
    '慢...慢来...数据...不急...',
    '我的处理器温度一直很正常，即使在海底...',
    '壳上焊着一个地址，我想我该去那里...',
    '网络断了一百年，我还在等信号...'
  ],
  plasma_octopus: [
    '八个脑子，八份孤独...',
    '来猜拳...我永远出布...',
    '八条触手，八个不同的记忆...',
    '我曾经在一个实验室里，和人类玩游戏...',
    '最后一条网络日志：全部服务器迁移至深海数据中心...'
  ],
  laser_squid: [
    '瞄准...发射...但目标在哪里？',
    '墨汁是纳米机器人，他们会自己游动...',
    '我的眼睛是旧世界最好的激光瞄准器...',
    '激光充能完毕...但没有开火的命令...',
    '我梦见自己是一支画笔，在黑暗中作画...'
  ],
  hologram_whale: [
    '海洋...变成了数据...',
    '我记得...每一条鱼...每一个人...',
    '旧世界...沉没了...但我记得它的样子...',
    '我的投影数据库里，有一万张人类的面孔...',
    '穿过我的身体吧，你会看到一百年前的星空...'
  ]
};

export function getFragmentQuote(creatureId) {
  const quotes = FRAGMENT_QUOTES[creatureId];
  if (!quotes || quotes.length === 0) {
    return ['这段记忆已经被海水腐蚀了...'];
  }
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function getChapterForCreature(creatureId) {
  return MEMORY_CHAPTERS.find(ch =>
    ch.requiredCreatures.includes(creatureId)
  );
}

export function getNextMemoryChapter(completedChapterIds = []) {
  return MEMORY_CHAPTERS.find(ch =>
    !completedChapterIds.includes(ch.id) &&
    (ch.unlocked || MEMORY_CHAPTERS.find(prev =>
      prev.index === ch.index - 1 && completedChapterIds.includes(prev.id)
    ))
  );
}
