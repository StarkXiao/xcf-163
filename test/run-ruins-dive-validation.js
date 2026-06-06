global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};
global.window = {
  devicePixelRatio: 1,
  addEventListener() {},
  removeEventListener() {}
};

const mockElements = {};
function makeEl(id) {
  if (!mockElements[id]) {
    mockElements[id] = {
      classList: {
        _classes: new Set(),
        add(...cls) { cls.forEach(c => this._classes.add(c)); },
        remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
        toggle(c, force) {
          if (force === undefined) this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c);
          else force ? this._classes.add(c) : this._classes.delete(c);
        },
        contains(c) { return this._classes.has(c); }
      },
      innerHTML: '',
      textContent: '',
      value: '',
      style: {},
      dataset: {},
      disabled: false,
      addEventListener() {},
      removeEventListener() {},
      appendChild() {},
      querySelectorAll() { return []; }
    };
  }
  return mockElements[id];
}

global.document = {
  getElementById(id) { return makeEl(id); },
  querySelectorAll() { return []; },
  querySelector() { return null; },
  addEventListener() {},
  createElement() { return makeEl('dynamic_' + Math.random()); }
};

import { RUINS_TIERS, CELL_TYPES, PUZZLE_TYPES, ENEMY_TYPES, SUB_UPGRADES,
  generateRuinsMap, calculateVisionRange, getRandomPuzzle, getRandomEnemy,
  generateCreatureForRuins, getUpgradeCost } from '../src/data/ruinsDive.js';
import { Storage } from '../src/modules/Storage.js';
import { RuinsDive } from '../src/modules/RuinsDive.js';

function log(msg, color) {
  const colors = {
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', reset: '\x1b[0m'
  };
  console.log((colors[color] || '') + msg + (colors.reset || ''));
}

function assert(cond, passMsg, failMsg) {
  totalAsserts++;
  if (cond) {
    log('✅ ' + passMsg, 'green');
    return true;
  } else {
    failedAsserts++;
    log('❌ ' + failMsg, 'red');
    throw new Error(failMsg || '断言失败');
  }
}

let passed = 0;
let failed = 0;
let totalAsserts = 0;
let failedAsserts = 0;

function test(title, fn) {
  console.log('\n📝 ' + title);
  try {
    const assertsBefore = totalAsserts;
    const failedBefore = failedAsserts;
    fn();
    passed++;
    const assertsCount = totalAsserts - assertsBefore;
    const failedCount = failedAsserts - failedBefore;
    if (assertsCount === 0) {
      log('⚠️  警告：该测试未包含任何断言', 'yellow');
    } else if (failedCount > 0) {
      log(`⚠️  警告：该测试存在断言失败但未被捕获 (${failedCount}/${assertsCount})`, 'yellow');
    }
  } catch (e) {
    failed++;
    log('💥 测试中断: ' + e.message, 'red');
  }
}

function createGame() {
  const game = {
    stats: {
      energy: 100,
      coins: 10000,
      catchCount: 0,
      comboCount: 0,
      maxComboReached: 0,
      totalComboHits: 0
    },
    updateStats(type, value) {
      switch (type) {
        case 'energy':
          this.stats.energy = Math.max(0, Math.min(100, this.stats.energy + value));
          break;
        case 'coins':
          this.stats.coins = Math.max(0, this.stats.coins + value);
          break;
        case 'catchCount':
          this.stats.catchCount += value;
          break;
      }
    },
    checkTasks() {},
    addToBackpack() { return true; },
    saveProgress() {},
    loadProgress() {},
    taskSystem: {
      showHint() {}
    }
  };
  return game;
}

log('════════════════════════════════════════════════════════', 'blue');
log('  废墟潜航系统 - 完整验证链路', 'blue');
log('  迷雾地图 · 机关互动 · 残骸战斗 · 撤离结算', 'blue');
log('════════════════════════════════════════════════════════', 'blue');

test('1. 数据层：遗迹层级配置完整', () => {
  const tiers = Object.values(RUINS_TIERS);
  assert(tiers.length === 4, `遗迹层级数量=4 (实际=${tiers.length})`, '遗迹层级数量错误');
  assert(tiers[0].unlockCost === 0, `浅层遗迹免费解锁`, '浅层遗迹应有解锁费用');
  assert(tiers[tiers.length - 1].difficulty === 4, `深渊遗迹难度=4`, '最高难度错误');
  tiers.forEach(t => {
    assert(t.id && t.name && t.icon, `${t.name} 配置完整`, `${t.name} 配置缺失`);
  });
});

test('2. 数据层：格子类型定义完整', () => {
  const types = Object.values(CELL_TYPES);
  assert(types.length >= 10, `格子类型数量>=10 (实际=${types.length})`, '格子类型不足');
  assert(CELL_TYPES.START.passable, '入口格子可通行', '入口格子配置错误');
  assert(CELL_TYPES.EXIT.passable, '撤离点格子可通行', '撤离点格子配置错误');
  assert(!CELL_TYPES.WALL.passable, '墙壁格子不可通行', '墙壁格子配置错误');
  assert(CELL_TYPES.FOG.hidden, '迷雾格子隐藏', '迷雾格子配置错误');
});

test('3. 数据层：机关类型和敌人类型', () => {
  assert(PUZZLE_TYPES.length >= 5, `机关类型>=5 (实际=${PUZZLE_TYPES.length})`, '机关类型不足');
  assert(ENEMY_TYPES.length >= 5, `敌人类型>=5 (实际=${ENEMY_TYPES.length})`, '敌人类型不足');
  PUZZLE_TYPES.forEach(p => {
    assert(p.solveEnergyCost > 0, `${p.name} 有能量消耗`, `${p.name} 消耗配置错误`);
    assert(p.successRate > 0 && p.successRate <= 1, `${p.name} 成功率有效`, `${p.name} 成功率错误`);
  });
  ENEMY_TYPES.forEach(e => {
    assert(e.hp > 0 && e.attack > 0, `${e.name} 属性有效`, `${e.name} 属性错误`);
  });
});

test('4. 数据层：升级系统配置', () => {
  const upgrades = Object.values(SUB_UPGRADES);
  assert(upgrades.length === 6, `升级项=6 (实际=${upgrades.length})`, '升级项数量错误');
  upgrades.forEach(u => {
    assert(u.maxLevel > 0 && u.baseCost > 0, `${u.name} 配置完整`, `${u.name} 配置缺失`);
  });
  const cost1 = getUpgradeCost('sonar', 0);
  const cost2 = getUpgradeCost('sonar', 1);
  assert(cost2 > cost1, `升级成本递增 (${cost1}→${cost2})`, '升级成本应递增');
});

test('5. 数据层：地图生成 - 尺寸与出入口', () => {
  for (let i = 0; i < 4; i++) {
    const tier = Object.values(RUINS_TIERS)[i];
    const map = generateRuinsMap(tier);
    const expectedSize = 7 + tier.difficulty;
    assert(map.size === expectedSize, `${tier.name} 地图尺寸=${expectedSize} (实际=${map.size})`, '地图尺寸错误');
    assert(map.grid.length === map.size, `${tier.name} 行数正确`, '行数错误');
    assert(map.grid[0].length === map.size, `${tier.name} 列数正确`, '列数错误');

    const startCell = map.grid[map.startPos.y][map.startPos.x];
    assert(startCell.type === CELL_TYPES.START, `${tier.name} 起点类型正确`, '起点类型错误');
    assert(startCell.explored, `${tier.name} 起点已探索`, '起点应已探索');
    assert(startCell.visible, `${tier.name} 起点可见`, '起点应可见');

    const exitCell = map.grid[map.exitPos.y][map.exitPos.x];
    assert(exitCell.type === CELL_TYPES.EXIT, `${tier.name} 撤离点类型正确`, '撤离点类型错误');
  }
});

test('6. 数据层：地图生成 - 迷雾机制', () => {
  const tier = RUINS_TIERS.TIER_1;
  const map = generateRuinsMap(tier);
  let fogCount = 0;
  let exploredCount = 0;
  for (let y = 0; y < map.size; y++) {
    for (let x = 0; x < map.size; x++) {
      if (!map.grid[y][x].explored) fogCount++;
      else exploredCount++;
    }
  }
  assert(fogCount > 0, `存在未探索区域 (迷雾=${fogCount})`, '应存在迷雾');
  assert(exploredCount >= 1, `至少起点已探索 (已探索=${exploredCount})`, '至少起点应已探索');
});

test('7. 数据层：视野范围计算', () => {
  const range1 = calculateVisionRange(0);
  const range2 = calculateVisionRange(3);
  const range3 = calculateVisionRange(5);
  assert(range1 === 1, `声呐0级视野=1 (实际=${range1})`, '基础视野错误');
  assert(range2 === 4, `声呐3级视野=4 (实际=${range2})`, '视野升级错误');
  assert(range3 === 6, `声呐5级视野=6 (实际=${range3})`, '满级视野错误');
});

test('8. 数据层：随机内容生成', () => {
  const tier = RUINS_TIERS.TIER_2;
  for (let i = 0; i < 10; i++) {
    const puzzle = getRandomPuzzle(tier.difficulty);
    assert(puzzle !== null && puzzle !== undefined, `随机机关生成 ${i + 1}/10`, '机关生成失败');
    const enemy = getRandomEnemy(tier.difficulty);
    assert(enemy !== null && enemy !== undefined, `随机敌人生成 ${i + 1}/10`, '敌人生成失败');
    const creature = generateCreatureForRuins(tier);
    assert(creature !== null && creature !== undefined, `随机残骸生成 ${i + 1}/10`, '残骸生成失败');
  }
});

test('9. 模块层：RuinsDive 初始化与基础属性', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  assert(ruins.unlockedTiers.tier1 === true, `默认解锁浅层遗迹`, '初始解锁错误');
  assert(ruins.unlockedTiers.tier2 !== true, `中层遗迹默认锁定`, '中层不应默认解锁');

  const maxHull = ruins.getMaxHull();
  const maxCargo = ruins.getMaxCargo();
  const attack = ruins.getAttackPower();
  const defense = ruins.getDefensePower();
  const vision = ruins.getVisionRange();
  const moveCost = ruins.getMoveEnergyCost();

  assert(maxHull === 100, `初始船体=100 (实际=${maxHull})`, '初始船体错误');
  assert(maxCargo === 8, `初始货舱=8 (实际=${maxCargo})`, '初始货舱错误');
  assert(attack === 15, `初始攻击=15 (实际=${attack})`, '初始攻击错误');
  assert(defense === 5, `初始防御=5 (实际=${defense})`, '初始防御错误');
  assert(vision === 1, `初始视野=1 (实际=${vision})`, '初始视野错误');
  assert(moveCost === 3, `初始移动耗能=3 (实际=${moveCost})`, '初始移动耗能错误');

  assert(ruins.stats.totalDives === 0, `初始潜航次数=0`, '初始统计错误');
});

test('10. 模块层：购买补给与升级', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  const beforeCoins = game.stats.coins;
  ruins.buySupply('energy', 5);
  assert(ruins.supplies.energy === 5, `购买5个能量电池 (实际=${ruins.supplies.energy})`, '补给购买失败');
  assert(game.stats.coins < beforeCoins, `金币扣除正确 (${beforeCoins}→${game.stats.coins})`, '金币未扣除');

  const beforeLevel = ruins.upgrades.sonar;
  ruins.purchaseUpgrade('sonar');
  assert(ruins.upgrades.sonar === beforeLevel + 1, `声呐升级成功 Lv.${beforeLevel + 1}`, '升级失败');
  assert(ruins.getVisionRange() === 2, `升级后视野=2 (实际=${ruins.getVisionRange()})`, '视野未提升');
});

test('11. 模块层：解锁遗迹层级', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  assert(!ruins.unlockedTiers.tier2, `中层遗迹初始锁定`, '初始状态错误');

  ruins.unlockTier('tier2');
  assert(ruins.unlockedTiers.tier2, `中层遗迹解锁成功`, '解锁失败');
  assert(game.stats.coins < 10000, `解锁金币已扣除`, '金币未扣除');
});

test('12. 模块层：开始潜航 - 状态初始化', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  ruins.supplies.energy = 10;
  ruins.supplies.repair = 5;
  ruins.startDive('tier1');

  assert(ruins.currentDive !== null, `潜航已启动`, '潜航未启动');
  assert(ruins.currentDive.tier === 'tier1', `潜航层级正确`, '层级错误');
  assert(ruins.currentDive.hull === ruins.getMaxHull(), `船体满血 (实际=${ruins.currentDive.hull})`, '船体未满血');
  assert(ruins.currentDive.energy === 100, `能量满值 (实际=${ruins.currentDive.energy})`, '能量未满');
  assert(ruins.currentDive.currentSupplies.energy === 10, `补给带入潜航`, '补给未带入');
  assert(ruins.stats.totalDives === 1, `潜航次数+1`, '统计未更新');
});

test('13. 模块层：迷雾地图 - 移动与视野更新', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  ruins.upgrades.sonar = 2;
  ruins.startDive('tier1');
  const dive = ruins.currentDive;
  const startPos = { ...dive.map.playerPos };

  let exploredBefore = 0;
  for (let y = 0; y < dive.map.size; y++) {
    for (let x = 0; x < dive.map.size; x++) {
      if (dive.map.grid[y][x].explored) exploredBefore++;
    }
  }

  const dirs = [
    { dir: 'up', dx: 0, dy: -1 },
    { dir: 'down', dx: 0, dy: 1 },
    { dir: 'left', dx: -1, dy: 0 },
    { dir: 'right', dx: 1, dy: 0 }
  ];

  let availableDir = null;
  for (const d of dirs) {
    const nx = startPos.x + d.dx;
    const ny = startPos.y + d.dy;
    if (nx >= 0 && nx < dive.map.size && ny >= 0 && ny < dive.map.size
      && dive.map.grid[ny][nx].type.passable) {
      availableDir = d;
      break;
    }
  }
  assert(availableDir !== null, `找到可通行方向 (${availableDir ? availableDir.dir : '无'})`, '出生点周围无可通行方向');

  ruins.movePlayer(availableDir.dir);
  const moved = dive.map.playerPos.y !== startPos.y || dive.map.playerPos.x !== startPos.x;
  assert(moved, `移动成功 (${startPos.x},${startPos.y})→(${dive.map.playerPos.x},${dive.map.playerPos.y})`, '移动未执行');

  let exploredAfter = 0;
  for (let y = 0; y < dive.map.size; y++) {
    for (let x = 0; x < dive.map.size; x++) {
      if (dive.map.grid[y][x].explored) exploredAfter++;
    }
  }
  assert(exploredAfter >= exploredBefore, `探索区域不减少 (${exploredBefore}→${exploredAfter})`, '探索区域错误');
});

test('14. 模块层：互动 - 机关破解', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  ruins.startDive('tier1');
  const dive = ruins.currentDive;

  const { x, y } = dive.map.playerPos;
  dive.map.grid[y][x].type = CELL_TYPES.PUZZLE;
  dive.map.grid[y][x].content = {
    puzzle: PUZZLE_TYPES[0],
    solved: false
  };

  const energyBefore = dive.energy;
  const puzzlesBefore = ruins.stats.totalPuzzlesSolved;
  ruins.interactWithCurrentCell();

  assert(dive.energy < energyBefore || dive.map.grid[y][x].content.solved,
    `机关互动消耗能量或成功 (能量=${energyBefore}→${dive.energy})`,
    '机关互动未执行');
});

test('15. 模块层：战斗系统 - 战斗启动', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  ruins.startDive('tier1');
  const dive = ruins.currentDive;
  const { x, y } = dive.map.playerPos;

  const enemy = ENEMY_TYPES[0];
  dive.map.grid[y][x].type = CELL_TYPES.ENEMY;
  dive.map.grid[y][x].content = {
    enemy: { ...enemy },
    currentHp: enemy.hp,
    defeated: false
  };

  ruins.startBattle(dive.map.grid[y][x]);

  assert(ruins.currentBattle !== null, `战斗已启动`, '战斗未启动');
  assert(ruins.currentBattle.enemyHp === enemy.hp, `敌人HP正确 (实际=${ruins.currentBattle.enemyHp})`, '敌人HP错误');
  assert(ruins.currentBattle.playerHp === dive.hull, `玩家HP正确`, '玩家HP错误');
});

test('16. 模块层：战斗系统 - 攻击与伤害', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  ruins.startDive('tier1');
  const dive = ruins.currentDive;
  const { x, y } = dive.map.playerPos;

  const enemy = ENEMY_TYPES[0];
  dive.map.grid[y][x].type = CELL_TYPES.ENEMY;
  dive.map.grid[y][x].content = {
    enemy: { ...enemy },
    currentHp: enemy.hp,
    defeated: false
  };

  ruins.startBattle(dive.map.grid[y][x]);
  const enemyHpBefore = ruins.currentBattle.enemyHp;
  const playerHpBefore = ruins.currentBattle.playerHp;

  let simRounds = 0;
  while (ruins.currentBattle && simRounds < 50) {
    ruins.battleAction('attack');
    simRounds++;
    if (!ruins.currentBattle) break;
  }

  assert(simRounds > 0, `战斗进行了 ${simRounds} 回合`, '战斗未进行');

  if (dive.map.grid[y][x].content.defeated) {
    assert(ruins.stats.totalEnemiesDefeated >= 1, `击败敌人统计+1`, '击败统计未更新');
  }
});

test('17. 模块层：撤离结算 - 正常撤离', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  ruins.startDive('tier1');
  const dive = ruins.currentDive;
  dive.coinsCollected = 500;
  const { x, y } = dive.map.exitPos;
  dive.map.playerPos = { x, y };
  dive.map.grid[y][x].type = CELL_TYPES.EXIT;

  const coinsBefore = game.stats.coins;
  ruins.tryEvacuate();

  assert(ruins.currentDive === null, `潜航已结束`, '潜航未结束');
  assert(game.stats.coins > coinsBefore, `结算金币入账 (${coinsBefore}→${game.stats.coins})`, '金币未结算');
});

test('18. 模块层：撤离结算 - 紧急撤离扣除50%', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  ruins.startDive('tier1');
  const dive = ruins.currentDive;
  dive.coinsCollected = 1000;

  const summaryNormal = ruins.calculateSettlement(dive, true, false);
  const summaryEmergency = ruins.calculateSettlement(dive, true, true);

  assert(summaryEmergency.totalCoins < summaryNormal.totalCoins,
    `紧急撤离收益更低 (正常=${summaryNormal.totalCoins}, 紧急=${summaryEmergency.totalCoins})`,
    '紧急撤离应有扣减');
  assert(summaryEmergency.emergencyPenalty > 0,
    `紧急撤离有罚金=${summaryEmergency.emergencyPenalty}`,
    '紧急撤离罚金缺失');
});

test('19. 模块层：潜航失败 - 船体归零', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  ruins.startDive('tier1');
  const dive = ruins.currentDive;
  dive.coinsCollected = 1000;
  dive.hull = 0;

  const summary = ruins.calculateSettlement(dive, false);
  assert(summary.totalCoins === 0, `失败收益=0 (实际=${summary.totalCoins})`, '失败应无收益');
  assert(summary.cargoItems.length === 0, `失败无货物 (实际=${summary.cargoItems.length})`, '失败货物应丢失');
});

test('20. 存档系统：Storage 废墟潜航历史记录', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();

  const testId = Storage.generateRuinsDiveId();
  assert(testId.startsWith('ruins_'), `ID前缀正确 (${testId})`, 'ID格式错误');

  const testData = {
    id: testId,
    tierId: 'tier1',
    tierName: '浅层遗迹',
    tierIcon: '🏚️',
    startedAt: Date.now(),
    endedAt: Date.now(),
    completed: true,
    emergencyEvac: false,
    depth: 100,
    earnings: 500,
    enemiesDefeated: 3,
    puzzlesSolved: 2,
    treasuresFound: 1
  };

  const saveOk = Storage.saveRuinsDive(testId, testData);
  assert(saveOk, `保存潜航记录成功`, '保存失败');

  const loaded = Storage.loadRuinsDive(testId);
  assert(loaded !== null, `读取潜航记录成功`, '读取失败');
  assert(loaded.earnings === 500, `读取收益正确 (实际=${loaded.earnings})`, '数据损坏');

  const list = Storage.listRuinsDives();
  assert(list.length >= 1, `列表包含记录 (实际=${list.length})`, '列表错误');

  const delOk = Storage.deleteRuinsDive(testId);
  assert(delOk, `删除潜航记录成功`, '删除失败');
  assert(Storage.loadRuinsDive(testId) === null, `删除后无法读取`, '记录未删除');
});

test('21. 模块层：toJSON/loadData 序列化完整', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins1 = new RuinsDive(game);

  ruins1.stats.totalDives = 5;
  ruins1.stats.totalRuinsCoins = 10000;
  ruins1.stats.totalEnemiesDefeated = 20;
  ruins1.upgrades.sonar = 3;
  ruins1.upgrades.hull = 2;
  ruins1.unlockedTiers.tier2 = true;
  ruins1.unlockedTiers.tier3 = true;
  ruins1.supplies.energy = 15;
  ruins1.supplies.repair = 8;
  ruins1.addLog('success', '测试日志');

  const json = ruins1.toJSON();
  assert(typeof json === 'object', `toJSON 返回对象`, '序列化失败');
  assert(json.stats.totalDives === 5, `统计序列化正确`, '统计序列化失败');
  assert(json.upgrades.sonar === 3, `升级序列化正确`, '升级序列化失败');
  assert(json.unlockedTiers.tier3 === true, `解锁序列化正确`, '解锁序列化失败');
  assert(json.supplies.energy === 15, `补给序列化正确`, '补给序列化失败');
  assert(Array.isArray(json.diveLog), `日志序列化正确`, '日志序列化失败');

  const ruins2 = new RuinsDive(game);
  ruins2.loadData(json);
  assert(ruins2.stats.totalDives === 5, `loadData 统计恢复`, '统计恢复失败');
  assert(ruins2.upgrades.sonar === 3, `loadData 升级恢复`, '升级恢复失败');
  assert(ruins2.unlockedTiers.tier3 === true, `loadData 解锁恢复`, '解锁恢复失败');
  assert(ruins2.supplies.energy === 15, `loadData 补给恢复`, '补给恢复失败');
  assert(ruins2.diveLog.length >= 1, `loadData 日志恢复`, '日志恢复失败');
});

test('22. 模块层：使用补给恢复能量和耐久', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  ruins.startDive('tier1');
  const dive = ruins.currentDive;

  dive.currentSupplies.energy = 3;
  dive.currentSupplies.repair = 3;
  dive.energy = 30;
  dive.hull = 50;
  const maxHull = ruins.getMaxHull();

  ruins.useSupply('energy');
  assert(dive.energy > 30, `能量恢复 (30→${dive.energy})`, '能量未恢复');
  assert(dive.currentSupplies.energy === 2, `能量补给消耗 (实际=${dive.currentSupplies.energy})`, '补给未消耗');

  ruins.useSupply('repair');
  assert(dive.hull > 50 && dive.hull <= maxHull, `耐久恢复 (50→${dive.hull})`, '耐久未恢复');
  assert(dive.currentSupplies.repair === 2, `维修补给消耗 (实际=${dive.currentSupplies.repair})`, '补给未消耗');
});

test('23. 模块层：视野更新揭示周围迷雾', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();
  const game = createGame();
  const ruins = new RuinsDive(game);

  ruins.upgrades.sonar = 2;
  ruins.startDive('tier1');
  const dive = ruins.currentDive;

  const visionRange = ruins.getVisionRange();
  assert(visionRange === 3, `声呐2级视野=3 (实际=${visionRange})`, '视野升级错误');

  const { x: px, y: py } = dive.map.playerPos;
  for (let dy = -visionRange; dy <= visionRange; dy++) {
    for (let dx = -visionRange; dx <= visionRange; dx++) {
      if (Math.abs(dx) + Math.abs(dy) <= visionRange) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx >= 0 && nx < dive.map.size && ny >= 0 && ny < dive.map.size) {
          assert(dive.map.grid[ny][nx].visible, `视野内格子可见 (${nx},${ny})`, '视野揭示错误');
        }
      }
    }
  }
});

test('24. 数据层：地图可达性 - 起点不被墙堵死且有路径到撤离点', () => {
  Storage.clear();
  Storage.clearAllRuinsDives();

  const testRounds = 50;
  let blockedCount = 0;
  let noPathCount = 0;

  for (let i = 0; i < testRounds; i++) {
    for (const tier of Object.values(RUINS_TIERS)) {
      const map = generateRuinsMap(tier);
      const { startPos, exitPos, grid, size } = map;

      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      let hasPassable = false;
      for (const [dx, dy] of dirs) {
        const nx = startPos.x + dx, ny = startPos.y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size
          && grid[ny][nx].type.passable) {
          hasPassable = true;
          break;
        }
      }
      if (!hasPassable) blockedCount++;

      const visited = Array.from({ length: size }, () => Array(size).fill(false));
      const queue = [[startPos.x, startPos.y]];
      visited[startPos.y][startPos.x] = true;
      let reachable = false;
      while (queue.length > 0) {
        const [x, y] = queue.shift();
        if (x === exitPos.x && y === exitPos.y) {
          reachable = true;
          break;
        }
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size
            && !visited[ny][nx] && grid[ny][nx].type.passable) {
            visited[ny][nx] = true;
            queue.push([nx, ny]);
          }
        }
      }
      if (!reachable) noPathCount++;
    }
  }

  assert(blockedCount === 0, `出生点不被墙堵死 (${testRounds * 4}次生成 堵死=${blockedCount})`, '出生点存在被堵死的情况');
  assert(noPathCount === 0, `起点可达撤离点 (${testRounds * 4}次生成 无路径=${noPathCount})`, '存在起点无法到达撤离点的地图');
});

console.log('\n════════════════════════════════════════════════════════');
const allOk = failed === 0 && failedAsserts === 0;
log(`  测试套件: ${passed} 通过 / ${failed} 失败  (共 ${passed + failed} 个)`, allOk ? 'green' : 'red');
log(`  断言统计: ${totalAsserts - failedAsserts} 通过 / ${failedAsserts} 失败  (共 ${totalAsserts} 个)`, allOk ? 'green' : 'red');
if (allOk) {
  log(`🎉 全部测试通过! 废墟潜航系统验证成功（迷雾地图 · 机关互动 · 残骸战斗 · 撤离结算）。`, 'green');
} else {
  log(`⚠️  存在失败项，请检查上方红色日志`, 'red');
}
log('════════════════════════════════════════════════════════\n');

process.exit(allOk ? 0 : 1);
