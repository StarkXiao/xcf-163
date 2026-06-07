const GUILD_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const GUILD_GOAL_TYPES = {
  CATCH_COUNT: 'catch_count',
  COINS_EARNED: 'coins_earned',
  PORT_COMMISSIONS: 'port_commissions',
  COMMON_CREATURES: 'common_creatures',
  RARE_CREATURES: 'rare_creatures',
  HIGH_TIER_CREATURES: 'high_tier_creatures',
  EXPEDITION_COMPLETE: 'expedition_complete',
  TAVERN_QUESTS: 'tavern_quests',
  RUINS_DIVE: 'ruins_dive',
  REINFORCE_SUCCESS: 'reinforce_success'
};

const GUILD_SHARED_GOALS = [
  {
    id: 'guild_goal_001',
    name: '全员打捞',
    icon: '🎣',
    desc: '公会成员累计打捞指定次数',
    type: GUILD_GOAL_TYPES.CATCH_COUNT,
    targetValue: 200,
    phases: [
      { phase: 1, threshold: 50, reward: { coins: 200, energy: 20 } },
      { phase: 2, threshold: 100, reward: { coins: 500, energy: 50 } },
      { phase: 3, threshold: 200, reward: { coins: 1000, energy: 100 } }
    ]
  },
  {
    id: 'guild_goal_002',
    name: '金币洪流',
    icon: '💰',
    desc: '公会成员累计赚取金币',
    type: GUILD_GOAL_TYPES.COINS_EARNED,
    targetValue: 50000,
    phases: [
      { phase: 1, threshold: 10000, reward: { coins: 500, energy: 30 } },
      { phase: 2, threshold: 25000, reward: { coins: 1500, energy: 80 } },
      { phase: 3, threshold: 50000, reward: { coins: 3000, energy: 150 } }
    ]
  },
  {
    id: 'guild_goal_003',
    name: '港口协力',
    icon: '⚓',
    desc: '公会成员累计完成港口委托',
    type: GUILD_GOAL_TYPES.PORT_COMMISSIONS,
    targetValue: 30,
    phases: [
      { phase: 1, threshold: 10, reward: { coins: 300, energy: 30 } },
      { phase: 2, threshold: 20, reward: { coins: 800, energy: 70 } },
      { phase: 3, threshold: 30, reward: { coins: 1800, energy: 150 } }
    ]
  },
  {
    id: 'guild_goal_004',
    name: '稀有猎手',
    icon: '✨',
    desc: '公会成员累计捕获稀有及以上生物',
    type: GUILD_GOAL_TYPES.RARE_CREATURES,
    targetValue: 50,
    phases: [
      { phase: 1, threshold: 10, reward: { coins: 400, energy: 25 } },
      { phase: 2, threshold: 25, reward: { coins: 1000, energy: 70 } },
      { phase: 3, threshold: 50, reward: { coins: 2500, energy: 150 } }
    ]
  },
  {
    id: 'guild_goal_005',
    name: '深海远征',
    icon: '🚢',
    desc: '公会成员累计完成远征',
    type: GUILD_GOAL_TYPES.EXPEDITION_COMPLETE,
    targetValue: 10,
    phases: [
      { phase: 1, threshold: 3, reward: { coins: 600, energy: 40 } },
      { phase: 2, threshold: 6, reward: { coins: 1500, energy: 100 } },
      { phase: 3, threshold: 10, reward: { coins: 3500, energy: 200 } }
    ]
  }
];

const GUILD_EXCLUSIVE_COMMISSIONS = [
  {
    id: 'guild_comm_001',
    name: '巨型机械章鱼回收',
    icon: '🐙',
    desc: '需要公会成员协作回收巨型机械章鱼残骸',
    requiredContribution: 10,
    phases: [
      { phase: 1, threshold: 3, reward: { coins: 500, energy: 30 } },
      { phase: 2, threshold: 6, reward: { coins: 1200, energy: 70 } },
      { phase: 3, threshold: 10, reward: { coins: 2500, energy: 150 } }
    ],
    durationMs: 3 * 24 * 60 * 60 * 1000,
    unlockLevel: 1
  },
  {
    id: 'guild_comm_002',
    name: '深海数据核心收集',
    icon: '💾',
    desc: '收集散落的深海数据核心碎片',
    requiredContribution: 15,
    phases: [
      { phase: 1, threshold: 5, reward: { coins: 800, energy: 50 } },
      { phase: 2, threshold: 10, reward: { coins: 2000, energy: 120 } },
      { phase: 3, threshold: 15, reward: { coins: 4000, energy: 250 } }
    ],
    durationMs: 5 * 24 * 60 * 60 * 1000,
    unlockLevel: 2
  },
  {
    id: 'guild_comm_003',
    name: '古代遗迹勘探',
    icon: '🏛️',
    desc: '协助勘探古代海洋文明遗迹',
    requiredContribution: 20,
    phases: [
      { phase: 1, threshold: 7, reward: { coins: 1000, energy: 60 } },
      { phase: 2, threshold: 14, reward: { coins: 2500, energy: 150 } },
      { phase: 3, threshold: 20, reward: { coins: 5000, energy: 300 } }
    ],
    durationMs: 7 * 24 * 60 * 60 * 1000,
    unlockLevel: 3
  }
];

const GUILD_COLLABORATION_EVENTS = [
  {
    id: 'guild_event_001',
    name: '渔获大丰收',
    icon: '🌊',
    desc: '公会成员打捞价值翻倍！',
    type: 'bonus',
    effect: { valueMultiplier: 2 },
    durationMs: 30 * 60 * 1000,
    trigger: {
      type: 'catch_count',
      threshold: 50
    }
  },
  {
    id: 'guild_event_002',
    name: '能量涌流',
    icon: '⚡',
    desc: '能量消耗减半！',
    type: 'energy_saver',
    effect: { energyDiscount: 0.5 },
    durationMs: 20 * 60 * 1000,
    trigger: {
      type: 'coins_earned',
      threshold: 10000
    }
  },
  {
    id: 'guild_event_003',
    name: '稀有潮汐',
    icon: '✨',
    desc: '稀有生物出现率提升！',
    type: 'rare',
    effect: { rarityBoost: 0.3 },
    durationMs: 25 * 60 * 1000,
    trigger: {
      type: 'port_commissions',
      threshold: 15
    }
  },
  {
    id: 'guild_event_004',
    name: '紧急援助',
    icon: '🤝',
    desc: '队友援助到来，全员加速！',
    type: 'teammate_boost',
    effect: { teammateContribBoost: 2 },
    durationMs: 60 * 60 * 1000,
    trigger: {
      type: 'random',
      chance: 0.1
    }
  }
];

const GUILD_TEAMMATES = [
  {
    id: 'teammate_001',
    name: '老渔夫杰克',
    icon: '🧔',
    role: '打捞专家',
    specialty: GUILD_GOAL_TYPES.CATCH_COUNT,
    baseEfficiency: 1.2,
    activityLevel: 'high',
    quote: '这片海，我比我还熟悉。'
  },
  {
    id: 'teammate_002',
    name: '机械师莉娜',
    icon: '👩‍🔧',
    role: '工程师',
    specialty: GUILD_GOAL_TYPES.REINFORCE_SUCCESS,
    baseEfficiency: 1.0,
    activityLevel: 'medium',
    quote: '机械的灵魂，在于精密。'
  },
  {
    id: 'teammate_003',
    name: '航海家马库斯',
    icon: '🧭',
    role: '远征队长',
    specialty: GUILD_GOAL_TYPES.EXPEDITION_COMPLETE,
    baseEfficiency: 1.1,
    activityLevel: 'medium',
    quote: '每一次航行都是新的冒险。'
  },
  {
    id: 'teammate_004',
    name: '商人索菲亚',
    icon: '💰',
    role: '商会代表',
    specialty: GUILD_GOAL_TYPES.COINS_EARNED,
    baseEfficiency: 1.3,
    activityLevel: 'high',
    quote: '金币会说话，我会听。'
  },
  {
    id: 'teammate_005',
    name: '考古学家艾琳',
    icon: '📜',
    role: '遗迹学者',
    specialty: GUILD_GOAL_TYPES.RUINS_DIVE,
    baseEfficiency: 0.9,
    activityLevel: 'low',
    quote: '历史在深海中沉睡。'
  }
];

function getGuildGoalById(id) {
  return GUILD_SHARED_GOALS.find(g => g.id === id);
}

function getGuildCommissionById(id) {
  return GUILD_EXCLUSIVE_COMMISSIONS.find(c => c.id === id);
}

function getGuildEventById(id) {
  return GUILD_COLLABORATION_EVENTS.find(e => e.id === id);
}

function getTeammateById(id) {
  return GUILD_TEAMMATES.find(t => t.id === id);
}

function getRandomTeammatesForGuild(guildLevel = 1) {
  const count = Math.min(2 + guildLevel, GUILD_TEAMMATES.length);
  const shuffled = [...GUILD_TEAMMATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getActivityMultiplier(activityLevel) {
  switch (activityLevel) {
    case 'high': return 1.5;
    case 'medium': return 1.0;
    case 'low': return 0.5;
    default: return 1.0;
  }
}

function pickWeeklyGuildGoals(count = 3) {
  const shuffled = [...GUILD_SHARED_GOALS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getWeekNumber(timestamp) {
  const start = new Date(timestamp);
  const onejan = new Date(start.getFullYear(), 0, 1);
  return Math.ceil(((start - onejan) / 86400000 + onejan.getDay() + 1) / 7);
}

export {
  GUILD_WEEK_MS,
  GUILD_GOAL_TYPES,
  GUILD_SHARED_GOALS,
  GUILD_EXCLUSIVE_COMMISSIONS,
  GUILD_COLLABORATION_EVENTS,
  GUILD_TEAMMATES,
  getGuildGoalById,
  getGuildCommissionById,
  getGuildEventById,
  getTeammateById,
  getRandomTeammatesForGuild,
  getActivityMultiplier,
  pickWeeklyGuildGoals,
  getWeekNumber
};
