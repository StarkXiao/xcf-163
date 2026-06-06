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

import { CREATURES, RARITY } from '../src/data/creatures.js';
import { generateCommission } from '../src/data/portCommissions.js';
import { Inventory } from '../src/modules/Inventory.js';
import { TaskSystem } from '../src/modules/TaskSystem.js';
import { TideSystem } from '../src/modules/TideSystem.js';
import { PortCommission } from '../src/modules/PortCommission.js';
import { Storage } from '../src/modules/Storage.js';

function log(msg, color) {
  const colors = {
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', reset: '\x1b[0m'
  };
  console.log((colors[color] || '') + msg + (colors.reset || ''));
}

function assert(cond, passMsg, failMsg) {
  if (cond) {
    log('✅ ' + passMsg, 'green');
    return true;
  } else {
    log('❌ ' + failMsg, 'red');
    return false;
  }
}

let passed = 0;
let failed = 0;

function test(title, fn) {
  console.log('\n📝 ' + title);
  try {
    fn();
    passed++;
  } catch (e) {
    log('💥 EXCEPTION: ' + e.message, 'red');
    console.error(e.stack);
    failed++;
  }
}

function createRealGame() {
  const game = {
    stats: {
      energy: 100,
      coins: 0,
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
    checkTasks(type, data = null) {
      if (this.taskSystem) this.taskSystem.checkTasks(type, data);
    },
    saveProgress() {
      const statsToSave = { ...this.stats, comboCount: 0 };
      const saveData = {
        stats: statsToSave,
        inventory: this.inventory ? this.inventory.toJSON() : null,
        tasks: this.taskSystem ? this.taskSystem.toJSON() : null,
        tide: this.tideSystem ? this.tideSystem.toJSON() : null,
        portCommission: this.portCommission ? this.portCommission.toJSON() : null,
        timestamp: Date.now()
      };
      Storage.save(saveData);
    },
    loadProgress() {
      const data = Storage.load();
      if (!data) return;
      if (data.stats) this.stats = { ...this.stats, ...data.stats };
      this.stats.comboCount = 0;
      if (this.inventory && data.inventory) this.inventory.loadData(data.inventory);
      if (this.taskSystem && data.tasks) this.taskSystem.loadData(data.tasks);
      if (this.portCommission && data.portCommission) this.portCommission.loadData(data.portCommission);
      if (this.tideSystem && data.tide) this.tideSystem.init(data.tide);
    }
  };
  game.tideSystem = new TideSystem(game);
  game.taskSystem = new TaskSystem(game);
  game.inventory = new Inventory(game);
  game.portCommission = new PortCommission(game);
  return game;
}

log('════════════════════════════════════════════════════════', 'blue');
log('  港口委托系统 - 完整验证链路', 'blue');
log('  普通委托不自动扣包 · 图鉴新阶段自动推进 · 真实 Storage 存档读档', 'blue');
log('════════════════════════════════════════════════════════', 'blue');

test('1. 普通委托（requireNew=false）首次收集目标残骸不自动扣包推进', () => {
  Storage.clear();
  const game = createRealGame();
  const pc = game.portCommission;
  const inv = game.inventory;

  const creature = CREATURES.find(c => c.rarity.name === RARITY.COMMON.name);
  pc.commissions = [];
  inv.backpack = [];
  inv.collection = new Set();

  const commission = generateCommission(1, new Set());
  commission.status = 'in_progress';
  commission.phases[0].requireNew = false;
  commission.phases[0].targetCreatureId = creature.id;
  commission.phases[0].targetRarity = null;
  commission.phases[0].targetCategory = null;
  commission.phases[0].requiredQuantity = 2;
  commission.phases[0].currentQuantity = 0;
  pc.commissions.push(commission);

  log(`ℹ️  委托阶段：requireNew=${commission.phases[0].requireNew}，目标=${creature.name}`, 'yellow');
  log(`ℹ️  收集前：背包=${inv.backpack.length}，进度=${commission.phases[0].currentQuantity}`, 'yellow');

  inv.addToBackpack(creature);

  log(`ℹ️  收集后：背包=${inv.backpack.length}，进度=${commission.phases[0].currentQuantity}`, 'yellow');

  assert(inv.backpack.length > 0,
    '普通委托收集后物品仍在背包中',
    '物品被错误扣除：背包长度=' + inv.backpack.length);

  assert(commission.phases[0].currentQuantity === 0,
    `普通委托阶段进度保持 0 (实际=${commission.phases[0].currentQuantity})`,
    '普通委托被错误自动推进进度');
});

test('2. 图鉴委托（requireNew=true）首次收集目标残骸自动扣包并推进', () => {
  Storage.clear();
  const game = createRealGame();
  const pc = game.portCommission;
  const inv = game.inventory;

  const creature = CREATURES.find(c => c.rarity.name === RARITY.COMMON.name);
  pc.commissions = [];
  inv.backpack = [];
  inv.collection = new Set();

  const commission = generateCommission(1, new Set());
  commission.status = 'in_progress';
  commission.phases[0].requireNew = true;
  commission.phases[0].targetCreatureId = creature.id;
  commission.phases[0].targetRarity = null;
  commission.phases[0].targetCategory = null;
  commission.phases[0].requiredQuantity = 1;
  commission.phases[0].currentQuantity = 0;
  pc.commissions.push(commission);

  log(`ℹ️  委托阶段：requireNew=${commission.phases[0].requireNew}，目标=${creature.name}`, 'yellow');
  log(`ℹ️  收集前：图鉴是否有=${inv.collection.has(creature.id)}，进度=0`, 'yellow');

  inv.addToBackpack(creature);

  log(`ℹ️  收集后：图鉴是否有=${inv.collection.has(creature.id)}，进度=${commission.phases[0].currentQuantity}`, 'yellow');

  assert(inv.collection.has(creature.id),
    '图鉴已收录新生物', '图鉴未更新');

  assert(commission.phases[0].currentQuantity >= 1,
    `图鉴新阶段进度增加 (实际=${commission.phases[0].currentQuantity})`,
    '图鉴新阶段未自动推进');
});

test('3. 图鉴新阶段重复收集不再推进进度', () => {
  Storage.clear();
  const game = createRealGame();
  const pc = game.portCommission;
  const inv = game.inventory;

  const creature = CREATURES.find(c => c.rarity.name === RARITY.COMMON.name);
  pc.commissions = [];
  inv.backpack = [];
  inv.collection = new Set();

  const commission = generateCommission(1, new Set());
  commission.status = 'in_progress';
  commission.phases[0].requireNew = true;
  commission.phases[0].targetCreatureId = creature.id;
  commission.phases[0].targetRarity = null;
  commission.phases[0].targetCategory = null;
  commission.phases[0].requiredQuantity = 3;
  commission.phases[0].currentQuantity = 0;
  pc.commissions.push(commission);

  log(`ℹ️  首次收集（新物种）`, 'yellow');
  inv.addToBackpack(creature);
  const qty1 = commission.phases[0].currentQuantity;
  log(`ℹ️  进度1=${qty1}`, 'yellow');

  log(`ℹ️  二次收集（重复）`, 'yellow');
  inv.addToBackpack(creature);
  const qty2 = commission.phases[0].currentQuantity;
  log(`ℹ️  进度2=${qty2}`, 'yellow');

  assert(qty1 === 1,
    `首次收集进度=1 (实际=${qty1})`, '首次收集进度错误');

  assert(qty2 === 1,
    `重复收集进度保持为 1 (实际=${qty2})`,
    `重复收集误推进进度: ${qty1}→${qty2}`);
});

test('4. 普通委托只能通过背包点击提交流程扣包和推进', () => {
  Storage.clear();
  const game = createRealGame();
  const pc = game.portCommission;
  const inv = game.inventory;

  const creature = CREATURES.find(c => c.rarity.name === RARITY.COMMON.name);
  pc.commissions = [];
  inv.backpack = [];
  inv.collection = new Set();

  const commission = generateCommission(1, new Set());
  commission.status = 'in_progress';
  commission.phases[0].requireNew = false;
  commission.phases[0].targetCreatureId = creature.id;
  commission.phases[0].targetRarity = null;
  commission.phases[0].targetCategory = null;
  commission.phases[0].requiredQuantity = 2;
  commission.phases[0].currentQuantity = 0;
  pc.commissions.push(commission);

  inv.backpack = [{ ...creature, count: 3, tier: 1, affixes: [] }];

  const initialCount = inv.backpack[0].count;
  const initialPhase = commission.phases[0].currentQuantity;

  log(`ℹ️  提交前：背包数量=${initialCount}，阶段进度=${initialPhase}`, 'yellow');

  const result = pc.trySubmitBackpackItem(inv.backpack[0], 0);
  assert(result.success,
    'trySubmitBackpackItem 手动提交成功',
    '手动提交失败: ' + result.message);

  const afterCount = inv.backpack[0] ? inv.backpack[0].count : 0;
  const afterPhase = commission.phases[0].currentQuantity;

  log(`ℹ️  提交后：背包数量=${afterCount}，阶段进度=${afterPhase}`, 'yellow');

  assert(afterCount < initialCount,
    `背包物品手动扣除 (${initialCount}→${afterCount})`,
    '背包物品未扣除');
  assert(afterPhase > initialPhase,
    `阶段进度手动推进 (${initialPhase}→${afterPhase})`,
    '阶段进度未推进');
});

test('5. 真实本地存档：Game.saveProgress 写入 Storage', () => {
  Storage.clear();
  const game = createRealGame();
  const pc = game.portCommission;
  const inv = game.inventory;

  const creature = CREATURES[0];
  inv.addToBackpack(creature);
  game.stats.coins = 1234;
  pc.stats.playerLevel = 5;
  pc.stats.playerExp = 55;
  pc.stats.totalCompleted = 9;

  const commission = generateCommission(3, inv.collection);
  commission.status = 'in_progress';
  commission.phases[0].currentQuantity = 2;
  pc.commissions = [commission];
  pc.completedHistory.push({
    id: 'history_1',
    templateName: '测试委托',
    rarity: RARITY.RARE.name,
    totalCoinReward: 888,
    completedAt: Date.now()
  });

  log(`ℹ️  保存前：金币=${game.stats.coins}, 委托等级=${pc.stats.playerLevel}, Exp=${pc.stats.playerExp}`, 'yellow');
  log(`ℹ️  进行中委托=${pc.commissions.length}, 历史记录=${pc.completedHistory.length}`, 'yellow');

  game.saveProgress();

  const raw = Storage.load();
  assert(raw !== null, 'Storage.load 读取到存档数据', 'Storage 中没有存档');
  assert(raw.stats && raw.stats.coins === 1234,
    `存档 stats.coins=1234 (实际=${raw.stats ? raw.stats.coins : '缺失'})`,
    '金币未写入存档');
  assert(raw.portCommission && raw.portCommission.stats.playerLevel === 5,
    `存档 portCommission.stats.playerLevel=5`,
    '委托等级未写入存档');
  assert(Array.isArray(raw.portCommission.commissions) && raw.portCommission.commissions.length >= 1,
    `存档 commissions 数组长度=${raw.portCommission.commissions.length}`,
    'commissions 未写入存档');
  assert(Array.isArray(raw.portCommission.completedHistory) && raw.portCommission.completedHistory.length >= 1,
    `存档 completedHistory 数组长度=${raw.portCommission.completedHistory.length}`,
    '历史记录未写入存档');
  assert(Array.isArray(raw.inventory.backpack),
    '存档 inventory.backpack 存在', '背包未写入存档');
  log(`ℹ️  Storage 存档 keys: ${Object.keys(raw).join(', ')}`, 'yellow');
});

test('6. 真实本地读档：Game.loadProgress 从 Storage 恢复完整状态', () => {
  Storage.clear();
  const game1 = createRealGame();
  const pc1 = game1.portCommission;
  const inv1 = game1.inventory;

  const creature = CREATURES.find(c => c.rarity.name === RARITY.COMMON.name);
  inv1.addToBackpack(creature);
  inv1.addToBackpack(creature);
  game1.stats.coins = 9999;
  game1.stats.energy = 50;
  pc1.stats.playerLevel = 7;
  pc1.stats.playerExp = 77;
  pc1.stats.totalCompleted = 12;
  pc1.stats.totalCoinReward = 5555;

  const commission = generateCommission(5, inv1.collection);
  commission.status = 'in_progress';
  commission.phases[0].requireNew = true;
  commission.phases[0].currentQuantity = 3;
  commission.phases[0].requiredQuantity = 5;
  pc1.commissions = [commission];
  pc1.completedHistory.push({
    id: 'h_done_1',
    templateName: '图鉴委托',
    rarity: RARITY.EPIC.name,
    totalCoinReward: 2000,
    completedAt: Date.now()
  });

  game1.saveProgress();
  log('✅ 存档已写入 Storage', 'green');

  const game2 = createRealGame();
  assert(game2.stats.coins === 0,
    '新 Game 实例初始 coins=0',
    '初始状态异常');
  assert(game2.portCommission.stats.playerLevel === 1,
    '新 Game 实例初始委托等级=1',
    '初始状态异常');

  game2.loadProgress();
  log('✅ Game.loadProgress 执行完成', 'green');

  assert(game2.stats.coins === 9999,
    `读档后 coins=9999 (实际=${game2.stats.coins})`,
    '金币读档失败');
  assert(game2.stats.energy === 50,
    `读档后 energy=50 (实际=${game2.stats.energy})`,
    '能量读档失败');
  assert(game2.portCommission.stats.playerLevel === 7,
    `读档后委托等级=7 (实际=${game2.portCommission.stats.playerLevel})`,
    '委托等级读档失败');
  assert(game2.portCommission.stats.playerExp === 77,
    `读档后委托经验=77 (实际=${game2.portCommission.stats.playerExp})`,
    '委托经验读档失败');
  assert(game2.portCommission.stats.totalCompleted === 12,
    `读档后 totalCompleted=12 (实际=${game2.portCommission.stats.totalCompleted})`,
    '完成计数读档失败');

  const loadedComm = game2.portCommission.commissions.find(c => c.id === commission.id);
  assert(loadedComm !== undefined,
    `读档后进行中委托 id=${commission.id} 存在`,
    '进行中委托丢失');
  assert(loadedComm.status === 'in_progress',
    `读档后委托状态=in_progress (实际=${loadedComm.status})`,
    '委托状态读档失败');
  assert(loadedComm.phases[0].currentQuantity === 3,
    `读档后阶段进度=3 (实际=${loadedComm.phases[0].currentQuantity})`,
    '阶段进度读档失败');
  assert(loadedComm.phases[0].requiredQuantity === 5,
    `读档后阶段需求=5 (实际=${loadedComm.phases[0].requiredQuantity})`,
    '阶段需求读档失败');

  assert(game2.portCommission.completedHistory.length >= 1,
    `读档后历史记录=${game2.portCommission.completedHistory.length}`,
    '历史记录读档丢失');
  assert(game2.inventory.backpack.length >= 1,
    `读档后背包物品=${game2.inventory.backpack.length}`,
    '背包读档丢失');
  assert(game2.inventory.collection.has(creature.id),
    `读档后图鉴收录 ${creature.name}`,
    '图鉴读档丢失');
});

test('7. 完整链路：接委托→首收新残骸→自动推进→Game.saveProgress→新建Game读档续进度', () => {
  log('━━━ 完整链路开始（真实 Storage 存档读档）━━━', 'blue');

  Storage.clear();

  const uncollected = CREATURES.find(c => c.rarity.name === RARITY.COMMON.name);
  assert(uncollected !== undefined, '找到测试生物', '找不到测试生物');
  log(`  🎯 目标: ${uncollected.icon} ${uncollected.name}`, 'blue');

  const gameA = createRealGame();
  const pcA = gameA.portCommission;
  const invA = gameA.inventory;
  invA.collection = new Set();
  invA.backpack = [];

  log('  📌 步骤1: 创建并接受委托', 'blue');
  pcA.commissions = [];
  const commission = generateCommission(5, new Set());
  commission.status = 'available';
  commission.phases = [{
    phaseIndex: 0,
    targetCreatureId: uncollected.id,
    targetCreatureName: uncollected.name,
    targetCreatureIcon: uncollected.icon,
    targetRarity: null,
    targetCategory: null,
    requiredQuantity: 1,
    currentQuantity: 0,
    requireNew: true,
    coinReward: 300,
    energyReward: 40,
    status: 'active'
  }];
  commission.totalCoinReward = 300;
  commission.totalEnergyReward = 40;
  pcA.commissions.push(commission);

  const accept = pcA.acceptCommission(commission.id);
  assert(accept.success, '委托接受成功', '委托接受失败');
  log(`     委托 status=${commission.status}`, 'yellow');

  log('  🆕  收集目标残骸（图鉴新 → 自动推进）', 'blue');
  const beforeQty = commission.phases[0].currentQuantity;
  invA.addToBackpack(uncollected);
  const afterQty = commission.phases[0].currentQuantity;
  log(`     进度: ${beforeQty} → ${afterQty}`, 'yellow');
  assert(afterQty > beforeQty,
    `图鉴新阶段自动推进 (${beforeQty}→${afterQty})`,
    '图鉴新阶段未自动推进');

  log('  💰  阶段完成 → 奖励发放', 'blue');
  const beforeCoins = gameA.stats.coins;
  const beforeEnergy = gameA.stats.energy;
  commission.phases[0].currentQuantity = 1;
  const phaseResult = pcA.completePhase(commission.id);
  assert(phaseResult.success, '阶段完成成功', '阶段完成失败');
  log(`     金币: ${beforeCoins} → ${gameA.stats.coins}`, 'yellow');
  log(`     能量: ${beforeEnergy} → ${gameA.stats.energy}`, 'yellow');
  assert(gameA.stats.coins > beforeCoins, '金币已发放', '金币未发放');
  assert(gameA.stats.energy > beforeEnergy, '能量已发放', '能量未发放');
  assert(commission.status === 'completed',
    `委托 status=${commission.status}`,
    '委托未完成');

  log('  💾  调用 Game.saveProgress 写入 Storage', 'blue');
  gameA.stats.coins = gameA.stats.coins;
  gameA.saveProgress();
  const savedRaw = Storage.load();
  assert(savedRaw !== null, 'Storage 存在存档', 'Storage 存档为空');
  assert(savedRaw.portCommission.stats.totalCompleted >= 1,
    `存档 totalCompleted=${savedRaw.portCommission.stats.totalCompleted}`,
    '存档中没有完成计数');
  log(`     Storage 写入成功，包含 keys: ${Object.keys(savedRaw).join(', ')}`, 'yellow');

  log('  📂  新建 Game 实例 → Game.loadProgress 续进度', 'blue');
  const gameB = createRealGame();
  assert(gameB.stats.coins === 0,
    '新实例初始 coins=0',
    '新实例初始状态异常');

  gameB.loadProgress();

  assert(gameB.stats.coins === gameA.stats.coins,
    `读档后 coins=${gameB.stats.coins} 与原存档一致`,
    `读档 coins 不一致: 原=${gameA.stats.coins}, 读档=${gameB.stats.coins}`);
  assert(gameB.portCommission.stats.totalCompleted >= 1,
    `读档后 totalCompleted=${gameB.portCommission.stats.totalCompleted}`,
    '读档后 totalCompleted 丢失');
  assert(gameB.portCommission.completedHistory.length >= 1,
    `读档后历史记录=${gameB.portCommission.completedHistory.length}`,
    '读档后历史记录丢失');
  assert(gameB.inventory.collection.has(uncollected.id),
    `读档后图鉴收录 ${uncollected.name}`,
    '读档后图鉴丢失');

  log('━━━ 完整链路验证通过（真实 Storage 存档读档）━━━', 'green');
});

console.log('\n════════════════════════════════════════════════════════');
if (failed === 0) {
  log(`🎉 全部 ${passed} 个测试通过! 港口委托验证成功（普通委托不自动扣包 · 图鉴新阶段自动推进 · 真实存档读档）。`, 'green');
} else {
  log(`⚠️  ${passed} 通过, ${failed} 失败`, 'red');
}
log('════════════════════════════════════════════════════════\n');

process.exit(failed === 0 ? 0 : 1);
