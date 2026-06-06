import { RARITY, CREATURES } from './creatures.js';

export const RUINS_TIERS = {
  TIER_1: { id: 'tier1', name: '浅层遗迹', icon: '🏚️', depth: 100, difficulty: 1, unlockCost: 0 },
  TIER_2: { id: 'tier2', name: '中层遗迹', icon: '🏛️', depth: 300, difficulty: 2, unlockCost: 5000 },
  TIER_3: { id: 'tier3', name: '深层遗迹', icon: '⛩️', depth: 600, difficulty: 3, unlockCost: 20000 },
  TIER_4: { id: 'tier4', name: '深渊遗迹', icon: '🗿', depth: 1000, difficulty: 4, unlockCost: 80000 }
};

export const CELL_TYPES = {
  EMPTY: { id: 'empty', name: '空区域', icon: '·', passable: true },
  START: { id: 'start', name: '入口', icon: '🚪', passable: true },
  EXIT: { id: 'exit', name: '撤离点', icon: '⬆️', passable: true },
  WRECK: { id: 'wreck', name: '残骸', icon: '📦', passable: true, interactable: true },
  PUZZLE: { id: 'puzzle', name: '机关', icon: '⚙️', passable: true, interactable: true },
  ENEMY: { id: 'enemy', name: '敌对残骸', icon: '👾', passable: true, interactable: true },
  TREASURE: { id: 'treasure', name: '宝藏', icon: '💰', passable: true, interactable: true },
  SUPPLY: { id: 'supply', name: '补给箱', icon: '🔋', passable: true, interactable: true },
  WALL: { id: 'wall', name: '遗迹墙壁', icon: '🧱', passable: false },
  FOG: { id: 'fog', name: '迷雾', icon: '🌫️', passable: true, hidden: true }
};

export const PUZZLE_TYPES = [
  {
    id: 'pressure_plate',
    name: '压力板',
    icon: '🔲',
    desc: '需要正确的重量才能触发',
    solveEnergyCost: 15,
    successRate: 0.7,
    rewards: { coins: [80, 200], supplyDrop: { chance: 0.4, type: 'energy', amount: [10, 25] } }
  },
  {
    id: 'circuit',
    name: '电路回路',
    icon: '🔌',
    desc: '修复损坏的电路才能开启',
    solveEnergyCost: 20,
    successRate: 0.6,
    rewards: { coins: [150, 350], creatureDrop: { chance: 0.5, rarityBoost: 0.2 } }
  },
  {
    id: 'cipher',
    name: '古代密码',
    icon: '🔐',
    desc: '破译远古文明的密码',
    solveEnergyCost: 25,
    successRate: 0.5,
    rewards: { coins: [200, 500], treasureUnlock: true }
  },
  {
    id: 'lever',
    name: '组合拉杆',
    icon: '🎚️',
    desc: '按正确顺序拉动拉杆',
    solveEnergyCost: 10,
    successRate: 0.8,
    rewards: { coins: [50, 150], revealArea: true }
  },
  {
    id: 'sonar',
    name: '声呐共振',
    icon: '📡',
    desc: '调整声呐频率与遗迹共鸣',
    solveEnergyCost: 30,
    successRate: 0.4,
    rewards: { coins: [300, 800], revealArea: true, creatureDrop: { chance: 0.7, rarityBoost: 0.4 } }
  }
];

export const ENEMY_TYPES = [
  {
    id: 'scrap_drone',
    name: '废料无人机',
    icon: '🤖',
    desc: '失控的自动防御无人机',
    hp: 30,
    attack: 8,
    defense: 2,
    rewardCoins: [30, 80],
    creatureDropChance: 0.3,
    difficulty: 1
  },
  {
    id: 'rust_sentinel',
    name: '锈蚀哨兵',
    icon: '🛡️',
    desc: '遗迹门口的机械守卫',
    hp: 60,
    attack: 15,
    defense: 8,
    rewardCoins: [80, 200],
    creatureDropChance: 0.5,
    rarityBoost: 0.1,
    difficulty: 2
  },
  {
    id: 'abyss_crawler',
    name: '深渊爬行者',
    icon: '🦀',
    desc: '在遗迹管道中爬行的机械生物',
    hp: 100,
    attack: 22,
    defense: 12,
    rewardCoins: [150, 350],
    creatureDropChance: 0.6,
    rarityBoost: 0.2,
    difficulty: 3
  },
  {
    id: 'forged_guardian',
    name: '锻造守卫者',
    icon: '🗿',
    desc: '远古文明锻造的石像守卫',
    hp: 180,
    attack: 35,
    defense: 20,
    rewardCoins: [300, 600],
    creatureDropChance: 0.8,
    rarityBoost: 0.35,
    difficulty: 4
  },
  {
    id: 'void_leviathan',
    name: '虚空巨兽',
    icon: '🐙',
    desc: '盘踞在遗迹深处的终极存在',
    hp: 300,
    attack: 50,
    defense: 30,
    rewardCoins: [600, 1200],
    creatureDropChance: 1.0,
    rarityBoost: 0.5,
    difficulty: 5
  }
];

export const SUB_UPGRADES = {
  sonar: {
    id: 'sonar',
    name: '声呐强化',
    icon: '📡',
    desc: '扩大探测范围，揭示更多迷雾区域',
    maxLevel: 5,
    baseCost: 800,
    effectPerLevel: 1
  },
  hull: {
    id: 'hull',
    name: '装甲强化',
    icon: '🛡️',
    desc: '增加潜航器最大耐久度',
    maxLevel: 5,
    baseCost: 1000,
    effectPerLevel: 30
  },
  weapon: {
    id: 'weapon',
    name: '武器系统',
    icon: '⚔️',
    desc: '提升战斗攻击力',
    maxLevel: 5,
    baseCost: 1200,
    effectPerLevel: 5
  },
  armor: {
    id: 'armor',
    name: '装甲涂层',
    icon: '🔩',
    desc: '提升战斗防御力',
    maxLevel: 5,
    baseCost: 900,
    effectPerLevel: 3
  },
  cargo: {
    id: 'cargo',
    name: '货舱扩容',
    icon: '📦',
    desc: '增加可携带的物品数量',
    maxLevel: 5,
    baseCost: 700,
    effectPerLevel: 3
  },
  engine: {
    id: 'engine',
    name: '引擎优化',
    icon: '⚡',
    desc: '减少移动能量消耗',
    maxLevel: 5,
    baseCost: 850,
    effectPerLevel: 0.08
  }
};

export const RUINS_SUPPLIES = {
  energy: { id: 'energy', name: '能量电池', icon: '🔋', desc: '恢复潜航器能量', basePrice: 30, restoreAmount: 20 },
  repair: { id: 'repair', name: '维修包', icon: '🔧', desc: '修复潜航器耐久', basePrice: 50, restoreAmount: 30 },
  ammo: { id: 'ammo', name: '弹药箱', icon: '💥', desc: '战斗中额外伤害加成', basePrice: 40, bonusDamage: 15 }
};

export function getUpgradeCost(upgradeId, currentLevel) {
  const upgrade = SUB_UPGRADES[upgradeId.toUpperCase()] || SUB_UPGRADES[upgradeId];
  if (!upgrade) return Infinity;
  return Math.floor(upgrade.baseCost * Math.pow(1.6, currentLevel));
}

function weightedRandom(items, weightFn) {
  const total = items.reduce((s, i) => s + weightFn(i), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= weightFn(item);
    if (r <= 0) return item;
  }
  return items[0];
}

export function getRandomPuzzle(difficulty) {
  const pool = PUZZLE_TYPES.filter(p => p.solveEnergyCost <= difficulty * 15 + 15);
  if (pool.length === 0) return PUZZLE_TYPES[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRandomEnemy(difficulty) {
  const pool = ENEMY_TYPES.filter(e => e.difficulty <= difficulty);
  if (pool.length === 0) return ENEMY_TYPES[0];
  return weightedRandom(pool, e => Math.max(1, 6 - e.difficulty));
}

export function generateRuinsMap(tier) {
  const size = 7 + tier.difficulty;
  const grid = [];

  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      row.push({
        x, y,
        type: CELL_TYPES.EMPTY,
        explored: false,
        visible: false,
        content: null
      });
    }
    grid.push(row);
  }

  const startX = Math.floor(size / 2);
  const startY = size - 1;
  grid[startY][startX].type = CELL_TYPES.START;
  grid[startY][startX].explored = true;
  grid[startY][startX].visible = true;

  let exitX, exitY;
  do {
    exitX = Math.floor(Math.random() * size);
    exitY = Math.floor(Math.random() * Math.floor(size / 3));
  } while (Math.abs(exitX - startX) < 2);
  grid[exitY][exitX].type = CELL_TYPES.EXIT;

  const wallCount = Math.floor(size * size * 0.15);
  for (let i = 0; i < wallCount; i++) {
    const wx = Math.floor(Math.random() * size);
    const wy = Math.floor(Math.random() * size);
    if (grid[wy][wx].type === CELL_TYPES.EMPTY) {
      grid[wy][wx].type = CELL_TYPES.WALL;
    }
  }

  const placeables = [
    { type: CELL_TYPES.WRECK, count: 4 + tier.difficulty * 2 },
    { type: CELL_TYPES.PUZZLE, count: 2 + tier.difficulty },
    { type: CELL_TYPES.ENEMY, count: 3 + tier.difficulty * 2 },
    { type: CELL_TYPES.TREASURE, count: 1 + Math.floor(tier.difficulty / 2) },
    { type: CELL_TYPES.SUPPLY, count: 2 + tier.difficulty }
  ];

  for (const { type, count } of placeables) {
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < 200) {
      const px = Math.floor(Math.random() * size);
      const py = Math.floor(Math.random() * size);
      if (grid[py][px].type === CELL_TYPES.EMPTY) {
        grid[py][px].type = type;
        grid[py][px].content = generateCellContent(type, tier);
        placed++;
      }
      attempts++;
    }
  }

  ensurePassableAround(grid, size, startX, startY);
  ensurePassableAround(grid, size, exitX, exitY);
  if (!hasPath(grid, size, startX, startY, exitX, exitY)) {
    clearPath(grid, size, startX, startY, exitX, exitY);
  }

  return {
    size,
    grid,
    playerPos: { x: startX, y: startY },
    exitPos: { x: exitX, y: exitY },
    startPos: { x: startX, y: startY },
    tier: tier.id,
    difficulty: tier.difficulty
  };
}

function ensurePassableAround(grid, size, cx, cy) {
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const blocked = dirs.filter(([dx, dy]) => {
    const nx = cx + dx, ny = cy + dy;
    if (nx < 0 || nx >= size || ny < 0 || ny >= size) return true;
    return !grid[ny][nx].type.passable;
  });
  if (blocked.length === 4) {
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        grid[ny][nx].type = CELL_TYPES.EMPTY;
        grid[ny][nx].content = null;
        return;
      }
    }
  }
}

function hasPath(grid, size, sx, sy, ex, ey) {
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const queue = [[sx, sy]];
  visited[sy][sx] = true;
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  while (queue.length > 0) {
    const [x, y] = queue.shift();
    if (x === ex && y === ey) return true;
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size
        && !visited[ny][nx] && grid[ny][nx].type.passable) {
        visited[ny][nx] = true;
        queue.push([nx, ny]);
      }
    }
  }
  return false;
}

function clearPath(grid, size, sx, sy, ex, ey) {
  let cx = sx, cy = sy;
  while (cx !== ex || cy !== ey) {
    if (cx < ex) {
      cx++;
    } else if (cx > ex) {
      cx--;
    } else if (cy < ey) {
      cy++;
    } else if (cy > ey) {
      cy--;
    }
    if (grid[cy][cx].type !== CELL_TYPES.START && grid[cy][cx].type !== CELL_TYPES.EXIT) {
      grid[cy][cx].type = CELL_TYPES.EMPTY;
      grid[cy][cx].content = null;
    }
  }
}

function generateCellContent(type, tier) {
  switch (type.id) {
    case 'wreck':
      return {
        creature: generateCreatureForRuins(tier),
        coins: Math.floor(20 + Math.random() * 50 * tier.difficulty),
        looted: false
      };
    case 'puzzle':
      return {
        puzzle: getRandomPuzzle(tier.difficulty),
        solved: false
      };
    case 'enemy':
      const enemy = getRandomEnemy(tier.difficulty);
      return {
        enemy: { ...enemy },
        currentHp: enemy.hp,
        defeated: false
      };
    case 'treasure':
      return {
        coins: Math.floor(200 + Math.random() * 400 * tier.difficulty),
        creature: generateCreatureForRuins(tier, 0.3),
        opened: false
      };
    case 'supply':
      return {
        supplyType: Math.random() < 0.5 ? 'energy' : 'repair',
        amount: Math.floor(15 + Math.random() * 20 * tier.difficulty),
        looted: false
      };
    default:
      return null;
  }
}

export function generateCreatureForRuins(tier, extraRarityBoost = 0) {
  const tierWeights = {
    tier1: { common: 55, uncommon: 30, rare: 12, epic: 3, legendary: 0 },
    tier2: { common: 35, uncommon: 35, rare: 20, epic: 8, legendary: 2 },
    tier3: { common: 20, uncommon: 30, rare: 28, epic: 17, legendary: 5 },
    tier4: { common: 8, uncommon: 20, rare: 30, epic: 28, legendary: 14 }
  };
  const weights = { ...tierWeights[tier.id] };

  if (extraRarityBoost > 0) {
    weights.rare *= (1 + extraRarityBoost);
    weights.epic *= (1 + extraRarityBoost);
    weights.legendary *= (1 + extraRarityBoost * 2);
  }

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let selectedRarityKey = 'common';
  for (const [key, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) {
      selectedRarityKey = key;
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

export function calculateVisionRange(sonarLevel) {
  return 1 + sonarLevel;
}
