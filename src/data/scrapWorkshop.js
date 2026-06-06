import { RARITY, MATERIALS, CREATURES } from './creatures.js';

export const SCRAP_PARTS = {
  gear_small: {
    id: 'gear_small',
    name: '小型齿轮',
    icon: '⚙️',
    rarity: RARITY.COMMON,
    value: 5,
    category: 'mechanical',
    desc: '最常见的机械零件，从旧机器上拆下的齿轮。'
  },
  wire_copper: {
    id: 'wire_copper',
    name: '铜线',
    icon: '🔌',
    rarity: RARITY.COMMON,
    value: 3,
    category: 'electronic',
    desc: '剥去绝缘皮的铜线，导电性能良好。'
  },
  metal_plate: {
    id: 'metal_plate',
    name: '金属板',
    icon: '🔩',
    rarity: RARITY.COMMON,
    value: 4,
    category: 'structural',
    desc: '压制成型的金属板，可做外壳。'
  },
  pipe_small: {
    id: 'pipe_small',
    name: '小型管道',
    icon: '🛢️',
    rarity: RARITY.COMMON,
    value: 6,
    category: 'fluid',
    desc: '输送液体或气体的管道。'
  },
  circuit_simple: {
    id: 'circuit_simple',
    name: '简易电路板',
    icon: '📟',
    rarity: RARITY.UNCOMMON,
    value: 15,
    category: 'electronic',
    desc: '基础电路，能实现简单逻辑。'
  },
  servo_motor: {
    id: 'servo_motor',
    name: '伺服马达',
    icon: '🔧',
    rarity: RARITY.UNCOMMON,
    value: 20,
    category: 'mechanical',
    desc: '精准控制角度的马达。'
  },
  pressure_tank: {
    id: 'pressure_tank',
    name: '压力罐',
    icon: '🫧',
    rarity: RARITY.UNCOMMON,
    value: 18,
    category: 'fluid',
    desc: '储存高压气体的容器。'
  },
  armor_plate: {
    id: 'armor_plate',
    name: '装甲板',
    icon: '🛡️',
    rarity: RARITY.UNCOMMON,
    value: 25,
    category: 'structural',
    desc: '经过强化处理的合金装甲。'
  },
  sensor_array: {
    id: 'sensor_array',
    name: '传感器阵列',
    icon: '📡',
    rarity: RARITY.RARE,
    value: 60,
    category: 'electronic',
    desc: '多频段传感器，能探测各种信号。'
  },
  power_cell: {
    id: 'power_cell',
    name: '动力电池',
    icon: '🔋',
    rarity: RARITY.RARE,
    value: 80,
    category: 'electronic',
    desc: '高能量密度的电池单元。'
  },
  hydraulic_joint: {
    id: 'hydraulic_joint',
    name: '液压关节',
    icon: '🦾',
    rarity: RARITY.RARE,
    value: 70,
    category: 'mechanical',
    desc: '高强度液压传动关节。'
  },
  nano_assembler: {
    id: 'nano_assembler',
    name: '纳米组装机',
    icon: '✨',
    rarity: RARITY.EPIC,
    value: 200,
    category: 'mechanical',
    desc: '能在分子级别组装零件的精密设备。'
  },
  ai_core: {
    id: 'ai_core',
    name: 'AI核心',
    icon: '🧠',
    rarity: RARITY.EPIC,
    value: 250,
    category: 'electronic',
    desc: '具备学习能力的人工智能核心。'
  },
  fusion_reactor: {
    id: 'fusion_reactor',
    name: '聚变反应堆',
    icon: '☢️',
    rarity: RARITY.LEGENDARY,
    value: 800,
    category: 'electronic',
    desc: '微型化的核聚变反应堆，近乎无限的能源。'
  },
  void_engine: {
    id: 'void_engine',
    name: '虚空引擎',
    icon: '🌀',
    rarity: RARITY.LEGENDARY,
    value: 1000,
    category: 'mechanical',
    desc: '从虚空中汲取能量的神秘装置。'
  }
};

export const PART_CATEGORIES = {
  mechanical: { name: '机械', icon: '⚙️' },
  electronic: { name: '电子', icon: '📟' },
  structural: { name: '结构', icon: '🏗️' },
  fluid: { name: '流体', icon: '💧' }
};

export const CREATURE_DISASSEMBLE_MAP = {
  robot_fish: [
    { part: 'gear_small', min: 1, max: 3 },
    { part: 'wire_copper', min: 1, max: 2 }
  ],
  scrap_crab: [
    { part: 'metal_plate', min: 1, max: 2 },
    { part: 'gear_small', min: 0, max: 2 }
  ],
  rusty_eel: [
    { part: 'wire_copper', min: 2, max: 4 },
    { part: 'power_cell', min: 0, max: 1 }
  ],
  metal_jelly: [
    { part: 'wire_copper', min: 1, max: 3 },
    { part: 'circuit_simple', min: 0, max: 1 }
  ],
  bolt_snail: [
    { part: 'gear_small', min: 1, max: 2 },
    { part: 'metal_plate', min: 1, max: 1 }
  ],
  cyber_shrimp: [
    { part: 'circuit_simple', min: 1, max: 2 },
    { part: 'wire_copper', min: 2, max: 3 },
    { part: 'sensor_array', min: 0, max: 1 }
  ],
  circuit_turtle: [
    { part: 'circuit_simple', min: 1, max: 3 },
    { part: 'armor_plate', min: 1, max: 2 }
  ],
  plasma_octopus: [
    { part: 'servo_motor', min: 2, max: 4 },
    { part: 'circuit_simple', min: 1, max: 2 },
    { part: 'ai_core', min: 0, max: 1 }
  ],
  laser_squid: [
    { part: 'wire_copper', min: 3, max: 5 },
    { part: 'power_cell', min: 1, max: 2 }
  ],
  hologram_whale: [
    { part: 'circuit_simple', min: 2, max: 4 },
    { part: 'sensor_array', min: 1, max: 2 },
    { part: 'ai_core', min: 0, max: 1 }
  ],
  quantum_shark: [
    { part: 'hydraulic_joint', min: 2, max: 3 },
    { part: 'sensor_array', min: 1, max: 2 },
    { part: 'nano_assembler', min: 0, max: 1 }
  ],
  nuclear_clam: [
    { part: 'armor_plate', min: 2, max: 3 },
    { part: 'power_cell', min: 2, max: 3 },
    { part: 'fusion_reactor', min: 0, max: 1 }
  ],
  nano_swarm: [
    { part: 'nano_assembler', min: 1, max: 2 },
    { part: 'circuit_simple', min: 2, max: 4 }
  ],
  void_angler: [
    { part: 'sensor_array', min: 2, max: 3 },
    { part: 'nano_assembler', min: 1, max: 2 },
    { part: 'ai_core', min: 1, max: 1 }
  ],
  time_lobster: [
    { part: 'hydraulic_joint', min: 2, max: 3 },
    { part: 'ai_core', min: 1, max: 2 },
    { part: 'void_engine', min: 0, max: 1 }
  ],
  dimension_eel: [
    { part: 'wire_copper', min: 4, max: 6 },
    { part: 'nano_assembler', min: 1, max: 2 },
    { part: 'void_engine', min: 0, max: 1 }
  ],
  ai_leviathan: [
    { part: 'ai_core', min: 2, max: 3 },
    { part: 'fusion_reactor', min: 1, max: 2 },
    { part: 'void_engine', min: 1, max: 2 }
  ],
  soul_server: [
    { part: 'ai_core', min: 2, max: 4 },
    { part: 'circuit_simple', min: 4, max: 6 },
    { part: 'fusion_reactor', min: 1, max: 1 }
  ],
  star_whale: [
    { part: 'void_engine', min: 1, max: 2 },
    { part: 'fusion_reactor', min: 2, max: 3 },
    { part: 'nano_assembler', min: 2, max: 3 }
  ]
};

export const EQUIPMENT_TYPES = {
  weapon: { name: '武器', icon: '⚔️' },
  armor: { name: '护甲', icon: '🛡️' },
  utility: { name: '工具', icon: '🔧' },
  accessory: { name: '饰品', icon: '💍' }
};

export const EQUIPMENT_RECIPES = [
  {
    id: 'rusty_blade',
    name: '锈蚀利刃',
    icon: '🗡️',
    type: 'weapon',
    rarity: RARITY.COMMON,
    value: 50,
    desc: '用废料打磨的刀刃，意外地锋利。',
    parts: [
      { part: 'metal_plate', count: 2 },
      { part: 'gear_small', count: 1 }
    ],
    successRate: 0.9,
    effect: '打捞能量消耗 -5%'
  },
  {
    id: 'copper_probe',
    name: '铜制探针',
    icon: '📏',
    type: 'utility',
    rarity: RARITY.COMMON,
    value: 40,
    desc: '简易探测工具，能感知附近金属。',
    parts: [
      { part: 'wire_copper', count: 3 },
      { part: 'gear_small', count: 1 }
    ],
    successRate: 0.9,
    effect: '普通残骸掉落率 +5%'
  },
  {
    id: 'scrap_shield',
    name: '废料护盾',
    icon: '🛡️',
    type: 'armor',
    rarity: RARITY.UNCOMMON,
    value: 120,
    desc: '拼接废料制成的护盾，防护性能不错。',
    parts: [
      { part: 'metal_plate', count: 3 },
      { part: 'armor_plate', count: 1 },
      { part: 'wire_copper', count: 2 }
    ],
    successRate: 0.8,
    effect: '试验失败惩罚 -30%'
  },
  {
    id: 'circuit_gloves',
    name: '电路手套',
    icon: '🧤',
    type: 'accessory',
    rarity: RARITY.UNCOMMON,
    value: 150,
    desc: '内置电路的手套，能稳定操作精密零件。',
    parts: [
      { part: 'circuit_simple', count: 2 },
      { part: 'wire_copper', count: 3 },
      { part: 'servo_motor', count: 1 }
    ],
    successRate: 0.75,
    effect: '拼装成功率 +10%'
  },
  {
    id: 'pressure_cutter',
    name: '液压切割器',
    icon: '✂️',
    type: 'weapon',
    rarity: RARITY.RARE,
    value: 400,
    desc: '利用高压液体切割的工业级工具。',
    parts: [
      { part: 'hydraulic_joint', count: 1 },
      { part: 'pressure_tank', count: 2 },
      { part: 'metal_plate', count: 3 },
      { part: 'circuit_simple', count: 1 }
    ],
    successRate: 0.65,
    effect: '拆解产出 +25%'
  },
  {
    id: 'sensor_visor',
    name: '传感目镜',
    icon: '🥽',
    type: 'accessory',
    rarity: RARITY.RARE,
    value: 450,
    desc: '连接传感器阵列的护目镜，视野大开。',
    parts: [
      { part: 'sensor_array', count: 2 },
      { part: 'circuit_simple', count: 2 },
      { part: 'armor_plate', count: 1 }
    ],
    successRate: 0.6,
    effect: '稀有残骸概率 +10%'
  },
  {
    id: 'powered_exosuit',
    name: '动力外骨骼',
    icon: '🦾',
    type: 'armor',
    rarity: RARITY.EPIC,
    value: 1200,
    desc: '动力辅助外骨骼，大幅提升体力。',
    parts: [
      { part: 'hydraulic_joint', count: 3 },
      { part: 'power_cell', count: 3 },
      { part: 'armor_plate', count: 4 },
      { part: 'nano_assembler', count: 1 }
    ],
    successRate: 0.45,
    effect: '能量上限 +50，恢复速度 +50%'
  },
  {
    id: 'nano_forge',
    name: '纳米锻炉',
    icon: '🔥',
    type: 'utility',
    rarity: RARITY.EPIC,
    value: 1500,
    desc: '纳米级精密锻造设备，废品也能出神装。',
    parts: [
      { part: 'nano_assembler', count: 2 },
      { part: 'ai_core', count: 1 },
      { part: 'power_cell', count: 2 },
      { part: 'circuit_simple', count: 4 }
    ],
    successRate: 0.4,
    effect: '所有装备属性 +15%'
  },
  {
    id: 'void_blade',
    name: '虚空之刃',
    icon: '⚔️',
    type: 'weapon',
    rarity: RARITY.LEGENDARY,
    value: 5000,
    desc: '以虚空引擎为核心锻造的神兵，切割空间。',
    parts: [
      { part: 'void_engine', count: 1 },
      { part: 'fusion_reactor', count: 1 },
      { part: 'nano_assembler', count: 2 },
      { part: 'hydraulic_joint', count: 3 }
    ],
    successRate: 0.25,
    effect: '传说残骸概率 +5%，所有稀有度概率提升'
  },
  {
    id: 'omniscient_crown',
    name: '全知王冠',
    icon: '👑',
    type: 'accessory',
    rarity: RARITY.LEGENDARY,
    value: 6000,
    desc: '融合顶级AI核心的头饰，洞察一切可能。',
    parts: [
      { part: 'ai_core', count: 3 },
      { part: 'fusion_reactor', count: 1 },
      { part: 'sensor_array', count: 3 },
      { part: 'nano_assembler', count: 2 }
    ],
    successRate: 0.2,
    effect: '图鉴反查显示隐藏配方，试验成功率 +20%'
  }
];

export const EXPERIMENT_PENALTIES = {
  minor: {
    name: '轻微故障',
    coinLoss: 0.1,
    partLoss: 0.2,
    desc: '拼装出了点小问题，损失了部分材料。'
  },
  moderate: {
    name: '设备过载',
    coinLoss: 0.25,
    partLoss: 0.5,
    desc: '电路过载，半数材料被烧毁。'
  },
  severe: {
    name: '剧烈爆炸',
    coinLoss: 0.5,
    partLoss: 1.0,
    desc: '糟糕！配方完全错误，所有材料都炸没了！'
  },
  critical: {
    name: '虚空反噬',
    coinLoss: 0.5,
    partLoss: 1.0,
    energyLoss: 30,
    desc: '虚空能量失控！损失材料、金币和能量！'
  }
};

export function getDisassembleParts(creature) {
  return CREATURE_DISASSEMBLE_MAP[creature.id] || [
    { part: 'gear_small', min: 0, max: 2 },
    { part: 'wire_copper', min: 0, max: 1 }
  ];
}

export function getPartsByCategory(category) {
  return Object.values(SCRAP_PARTS).filter(p => p.category === category);
}

export function findRecipesByParts(partIds) {
  const partSet = new Set(partIds);
  return EQUIPMENT_RECIPES.filter(recipe => {
    return recipe.parts.every(rp => partSet.has(rp.part));
  });
}

export function findRecipesBySinglePart(partId) {
  return EQUIPMENT_RECIPES.filter(recipe =>
    recipe.parts.some(rp => rp.part === partId)
  );
}

export function hasAllParts(inventoryParts, recipe) {
  return recipe.parts.every(rp => {
    const owned = inventoryParts[rp.part] || 0;
    return owned >= rp.count;
  });
}

export function calculateExperimentPenalty(successRate) {
  const roll = Math.random();
  if (successRate >= 0.7) {
    if (roll < 0.7) return EXPERIMENT_PENALTIES.minor;
    return EXPERIMENT_PENALTIES.moderate;
  } else if (successRate >= 0.4) {
    if (roll < 0.5) return EXPERIMENT_PENALTIES.minor;
    if (roll < 0.85) return EXPERIMENT_PENALTIES.moderate;
    return EXPERIMENT_PENALTIES.severe;
  } else {
    if (roll < 0.3) return EXPERIMENT_PENALTIES.moderate;
    if (roll < 0.75) return EXPERIMENT_PENALTIES.severe;
    return EXPERIMENT_PENALTIES.critical;
  }
}

export function getRecipeValue(recipe) {
  let baseValue = 0;
  recipe.parts.forEach(rp => {
    const part = SCRAP_PARTS[rp.part];
    if (part) baseValue += part.value * rp.count;
  });
  return Math.floor(baseValue * 1.5);
}
