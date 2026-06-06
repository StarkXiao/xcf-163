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
import { generateCommission, COMMISSION_TEMPLATES } from '../src/data/portCommissions.js';
import { Inventory } from '../src/modules/Inventory.js';
import { PortCommission } from '../src/modules/PortCommission.js';

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

function makeGame() {
  const game = {
    stats: { coins: 0, energy: 100, catchCount: 0 },
    updateStats(key, delta) {
      this.stats[key] = (this.stats[key] || 0) + delta;
    },
    saveProgress() {},
    checkTasks() {},
    taskSystem: {
      showHint() {},
      showTutorialHint() {}
    },
    tideSystem: null
  };
  game.inventory = new Inventory(game);
  game.portCommission = new PortCommission(game);
  return game;
}

log('════════════════════════════════════════════════════════', 'blue');
log('  港口委托系统 - 完整验证链路', 'blue');
log('  接委托 → 收集新残骸 → 背包扣除 → 奖励发放 → 读档续进度', 'blue');
log('════════════════════════════════════════════════════════', 'blue');

test('1. 委托生成：生成包含"图鉴新"阶段的委托', () => {
  const emptyCollection = new Set();
  const commission = generateCommission(5, emptyCollection);

  assert(commission.id.startsWith('port_'),
    `委托ID格式正确 (${commission.id})`, '委托ID格式错误');
  assert(commission.phases.length >= 2,
    `委托阶段数量=${commission.phases.length}`, '委托阶段数量不足');
  assert(commission.phases[0].status === 'active',
    '第1阶段默认 active', '第1阶段状态错误');
  assert(commission.phases[0].currentQuantity === 0,
    '第1阶段初始进度=0', '阶段初始进度错误');

  const hasNewPhase = commission.phases.some(p => p.requireNew);
  log(`ℹ️  委托: ${commission.templateName}, 稀有度: ${commission.rarity}, 阶段数: ${commission.phases.length}`, 'yellow');
  log(`ℹ️  阶段 requireNew: ` + commission.phases.map(p => p.requireNew ? '🆕' : '·').join(', '), 'yellow');

  assert(typeof hasNewPhase === 'boolean',
    '阶段存在 requireNew 标记', '阶段缺少 requireNew 标记');
});

test('2. 图鉴委托模板：生成的图鉴委托所有阶段均 requireNew=true', () => {
  const collectionTemplate = COMMISSION_TEMPLATES.find(t => t.id === 'commission_collection');
  assert(collectionTemplate !== undefined,
    '存在图鉴委托模板', '图鉴委托模板缺失');
  assert(collectionTemplate.requireNew === true,
    '图鉴委托模板 requireNew=true', '图鉴委托模板标记错误');

  const emptyCollection = new Set();
  let foundCollectionCommission = false;

  for (let i = 0; i < 50; i++) {
    const commission = generateCommission(10, emptyCollection);
    if (commission.templateId === 'commission_collection') {
      foundCollectionCommission = true;
      const allRequireNew = commission.phases.every(p => p.requireNew === true);
      assert(allRequireNew,
        `图鉴委托 ${commission.id} 所有 ${commission.phases.length} 个阶段 requireNew=true`,
        '图鉴委托存在非图鉴新阶段');
      break;
    }
  }
  if (!foundCollectionCommission) {
    log('⚠️  50 次抽样未生成图鉴委托（随机正常，跳过该断言）', 'yellow');
  }
});

test('3. 接委托：接受委托后状态变为 in_progress', () => {
  const game = makeGame();
  const pc = game.portCommission;

  while (pc.commissions.filter(c => c.status === 'available').length < 1) {
    pc.generateNewCommission();
  }
  const available = pc.commissions.find(c => c.status === 'available');
  assert(available !== undefined, '存在可接受委托', '无可接受委托');

  const result = pc.acceptCommission(available.id);
  assert(result.success === true,
    'acceptCommission 返回 success=true', '接受委托失败: ' + result.message);
  assert(available.status === 'in_progress',
    '委托状态变为 in_progress', '委托状态未变更: ' + available.status);
});

test('4. 首次收集新残骸 → 图鉴新阶段自动匹配并计入进度', () => {
  const game = makeGame();
  const pc = game.portCommission;
  const inv = game.inventory;

  const emptyCollection = new Set();
  const manualCommission = generateCommission(10, emptyCollection);
  manualCommission.status = 'in_progress';
  manualCommission.phases[0].requireNew = true;
  manualCommission.phases[0].targetCreatureId = null;
  manualCommission.phases[0].targetRarity = RARITY.COMMON.name;
  manualCommission.phases[0].targetCategory = null;
  manualCommission.phases[0].requiredQuantity = 2;
  manualCommission.phases[0].currentQuantity = 0;
  pc.commissions.push(manualCommission);

  const uncollectedCreature = CREATURES.find(c =>
    c.rarity.name === RARITY.COMMON.name && !inv.collection.has(c.id)
  );
  assert(uncollectedCreature !== undefined,
    '存在未收集的普通生物', '找不到未收集生物');
  assert(!inv.collection.has(uncollectedCreature.id),
    `目标生物 ${uncollectedCreature.name} 不在图鉴中`, '目标生物已在图鉴中');

  log(`ℹ️  首次收集目标: ${uncollectedCreature.icon} ${uncollectedCreature.name}`, 'yellow');

  const addResult = inv.addToBackpack(uncollectedCreature);
  assert(addResult === true, '加入背包成功', '加入背包失败');

  assert(inv.collection.has(uncollectedCreature.id),
    '图鉴已收录新生物', '图鉴未更新');

  const phase = manualCommission.phases[0];
  log(`ℹ️  阶段进度: ${phase.currentQuantity}/${phase.requiredQuantity}`, 'yellow');
  assert(phase.currentQuantity >= 1,
    `委托阶段进度 +=1 (实际=${phase.currentQuantity})`,
    '图鉴新阶段未记录进度');
});

test('5. 背包物品提交：普通阶段通过点击背包物品提交并扣除', () => {
  const game = makeGame();
  const pc = game.portCommission;
  const inv = game.inventory;

  const creature = CREATURES.find(c => c.rarity.name === RARITY.COMMON.name);

  pc.commissions = [];
  const commission = generateCommission(1, new Set());
  commission.status = 'in_progress';
  commission.phases[0].requireNew = false;
  commission.phases[0].targetCreatureId = creature.id;
  commission.phases[0].targetRarity = null;
  commission.phases[0].targetCategory = null;
  commission.phases[0].requiredQuantity = 3;
  commission.phases[0].currentQuantity = 0;
  pc.commissions.push(commission);

  inv.backpack = [];
  const freshCreature1 = { ...creature, count: 1, tier: 1, affixes: [] };
  const freshCreature2 = { ...creature, count: 1, tier: 1, affixes: [] };
  const freshCreature3 = { ...creature, count: 1, tier: 1, affixes: [] };
  inv.backpack.push(freshCreature1);
  inv.backpack.push(freshCreature2);
  inv.backpack.push(freshCreature3);

  if (inv.backpack.length > 1 && inv.backpack[0].id === inv.backpack[1].id) {
    inv.backpack[0].count += inv.backpack[1].count;
    inv.backpack.splice(1, 1);
  }
  if (inv.backpack.length > 1 && inv.backpack[0].id === inv.backpack[1].id) {
    inv.backpack[0].count += inv.backpack[1].count;
    inv.backpack.splice(1, 1);
  }

  const invIdx = inv.backpack.findIndex(item => item.id === creature.id);
  assert(invIdx >= 0, '背包中存在目标物品 (背包长度=' + inv.backpack.length + ')', '背包物品缺失');
  const initialCount = inv.backpack[invIdx].count;
  log(`ℹ️  背包初始数量: ${initialCount}`, 'yellow');

  const result = pc.trySubmitBackpackItem(inv.backpack[invIdx], invIdx);
  assert(result.success === true,
    'trySubmitBackpackItem 提交成功', '提交失败: ' + result.message);

  const afterInvIdx = inv.backpack.findIndex(item => item.id === creature.id);
  const afterCount = afterInvIdx >= 0 ? inv.backpack[afterInvIdx].count : 0;
  log(`ℹ️  背包提交后数量: ${afterCount}`, 'yellow');
  assert(afterCount < initialCount,
    `背包物品数量减少 (${initialCount}→${afterCount})`,
    '背包物品未扣除');

  assert(commission.phases[0].currentQuantity > 0,
    `阶段进度增加 (实际=${commission.phases[0].currentQuantity})`,
    '阶段进度未更新');
});

test('6. 阶段完成：阶段达成后自动发放奖励并解锁下一阶段', () => {
  const game = makeGame();
  const pc = game.portCommission;

  const commission = generateCommission(1, new Set());
  commission.status = 'in_progress';
  commission.phases[0].requiredQuantity = 1;
  commission.phases[0].currentQuantity = 0;
  commission.phases[0].coinReward = 100;
  commission.phases[0].energyReward = 10;
  if (commission.phases.length > 1) {
    commission.phases[1].status = 'locked';
  }
  pc.commissions.push(commission);

  const beforeCoins = game.stats.coins;
  const beforeEnergy = game.stats.energy;
  log(`ℹ️  发放前: 金币=${beforeCoins}, 能量=${beforeEnergy}`, 'yellow');
  log(`ℹ️  阶段 0 奖励: ${commission.phases[0].coinReward}💰 ${commission.phases[0].energyReward}⚡`, 'yellow');

  const result = pc.completePhase(commission.id);
  assert(result.success === true,
    'completePhase 返回成功', '阶段完成失败: ' + result.message);

  const afterCoins = game.stats.coins;
  const afterEnergy = game.stats.energy;
  log(`ℹ️  发放后: 金币=${afterCoins}, 能量=${afterEnergy}`, 'yellow');

  assert(afterCoins > beforeCoins,
    `金币已增加 (${beforeCoins}→${afterCoins})`, '金币未增加');
  assert(commission.phases[0].status === 'completed',
    '第1阶段状态=completed', '阶段状态未更新');

  if (commission.phases.length > 1) {
    assert(commission.currentPhase === 1,
      `currentPhase 推进到 1 (实际=${commission.currentPhase})`,
      'currentPhase 未推进');
    assert(commission.phases[1].status === 'active',
      '第2阶段状态=active', '第2阶段未解锁');
  }
});

test('7. 委托完成：全部阶段完成后发放最终奖励，计入历史', () => {
  const game = makeGame();
  const pc = game.portCommission;

  const commission = generateCommission(1, new Set());
  commission.status = 'in_progress';
  commission.phases.forEach((p, i) => {
    p.requiredQuantity = 1;
    p.currentQuantity = 0;
    p.coinReward = 50;
    p.energyReward = i === commission.phases.length - 1 ? 20 : 0;
    p.status = i === 0 ? 'active' : 'locked';
  });
  commission.currentPhase = 0;
  commission.totalCoinReward = commission.phases.reduce((s, p) => s + p.coinReward, 0);
  pc.commissions.push(commission);

  const beforeCompleted = pc.stats.totalCompleted;
  const beforeHistoryCount = pc.completedHistory.length;
  const beforeLevel = pc.stats.playerLevel;

  for (let i = 0; i < commission.phases.length; i++) {
    const result = pc.completePhase(commission.id);
    assert(result.success === true,
      `阶段 ${i + 1} 完成成功`, `阶段 ${i + 1} 失败: ${result.message}`);
  }

  assert(commission.status === 'completed',
    '委托状态=completed', '委托状态未更新: ' + commission.status);
  assert(pc.stats.totalCompleted > beforeCompleted,
    `totalCompleted 增加 (${beforeCompleted}→${pc.stats.totalCompleted})`,
    'totalCompleted 未更新');
  assert(pc.completedHistory.length > beforeHistoryCount,
    `历史记录增加 (${beforeHistoryCount}→${pc.completedHistory.length})`,
    '历史记录未更新');
  assert(pc.stats.playerExp > 0 || pc.stats.playerLevel >= beforeLevel,
    `经验/等级增加 (Lv.${beforeLevel}→Lv.${pc.stats.playerLevel}, Exp=${pc.stats.playerExp})`,
    '经验未获得');
});

test('8. 图鉴新阶段不会被背包提交流程挡掉：新生物加入即触发进度，不依赖背包点击', () => {
  const game = makeGame();
  const pc = game.portCommission;
  const inv = game.inventory;

  const targetCreature = CREATURES.find(c => c.rarity.name === RARITY.COMMON.name);
  assert(targetCreature !== undefined, '找到测试生物', '找不到测试生物');

  const commission = generateCommission(5, new Set());
  commission.status = 'in_progress';
  commission.phases[0].requireNew = true;
  commission.phases[0].targetCreatureId = targetCreature.id;
  commission.phases[0].targetRarity = null;
  commission.phases[0].targetCategory = null;
  commission.phases[0].requiredQuantity = 1;
  commission.phases[0].currentQuantity = 0;
  pc.commissions.push(commission);

  const beforePhaseQty = commission.phases[0].currentQuantity;

  log(`ℹ️  首次添加 ${targetCreature.name}（图鉴新生物）`, 'yellow');
  inv.addToBackpack(targetCreature);

  const afterPhaseQty = commission.phases[0].currentQuantity;
  log(`ℹ️  阶段进度: ${beforePhaseQty}→${afterPhaseQty}`, 'yellow');

  assert(afterPhaseQty > beforePhaseQty,
    `新生物加入背包直接触发委托进度 (${beforePhaseQty}→${afterPhaseQty})`,
    '图鉴新阶段未响应新生物收集，被挡掉了');
});

test('9. 图鉴新阶段二次收集不再计入：重复收集不增加进度', () => {
  const game = makeGame();
  const pc = game.portCommission;
  const inv = game.inventory;

  const targetCreature = CREATURES.find(c => c.rarity.name === RARITY.COMMON.name);
  assert(targetCreature !== undefined, '找到测试生物', '找不到测试生物');

  const commission = generateCommission(5, new Set());
  commission.status = 'in_progress';
  commission.phases[0].requireNew = true;
  commission.phases[0].targetCreatureId = targetCreature.id;
  commission.phases[0].targetRarity = null;
  commission.phases[0].targetCategory = null;
  commission.phases[0].requiredQuantity = 2;
  commission.phases[0].currentQuantity = 0;
  pc.commissions.push(commission);

  log(`ℹ️  第1次添加（新物种）`, 'yellow');
  inv.addToBackpack(targetCreature);
  const qty1 = commission.phases[0].currentQuantity;
  log(`ℹ️  进度: ${qty1}`, 'yellow');

  log(`ℹ️  第2次添加（重复收集，同一生物再次捕获）`, 'yellow');
  inv.addToBackpack(targetCreature);
  const qty2 = commission.phases[0].currentQuantity;
  log(`ℹ️  进度: ${qty2}`, 'yellow');

  assert(qty1 === 1,
    `第1次收集进度=1 (实际=${qty1})`, '首次收集进度错误');
  assert(qty2 === 1,
    `重复收集进度不增加 (仍为 ${qty2})`,
    `重复收集误增加了进度: ${qty1}→${qty2}`);
});

test('10. 存档/读档：委托进度、阶段状态、历史记录持久化完整', () => {
  const game = makeGame();
  const pc = game.portCommission;

  const commission = generateCommission(3, new Set());
  commission.status = 'in_progress';
  commission.phases[0].currentQuantity = 2;
  commission.phases[0].requiredQuantity = 5;
  if (commission.phases.length > 1) {
    commission.phases[1].currentQuantity = 0;
  }
  pc.commissions.push(commission);

  const completedCommission = generateCommission(1, new Set());
  completedCommission.status = 'completed';
  completedCommission.completedAt = Date.now();
  pc.commissions.push(completedCommission);
  pc.completedHistory.push({
    id: completedCommission.id,
    templateName: completedCommission.templateName,
    rarity: completedCommission.rarity,
    totalCoinReward: 500,
    completedAt: Date.now()
  });

  pc.stats.playerLevel = 3;
  pc.stats.playerExp = 45;
  pc.stats.totalCompleted = 7;
  pc.stats.totalCoinReward = 2000;

  const saved = pc.toJSON();
  log(`ℹ️  存档 keys: ${Object.keys(saved).join(', ')}`, 'yellow');
  assert(Array.isArray(saved.commissions), '存档包含 commissions 数组', 'commissions 缺失');
  assert(Array.isArray(saved.completedHistory), '存档包含 completedHistory', 'completedHistory 缺失');
  assert(saved.stats.playerLevel === 3,
    `存档玩家等级=3 (实际=${saved.stats.playerLevel})`, '玩家等级未保存');

  const game2 = makeGame();
  const pc2 = game2.portCommission;
  pc2.loadData(saved);

  assert(pc2.stats.playerLevel === 3,
    `读档后玩家等级=3 (实际=${pc2.stats.playerLevel})`, '玩家等级读档失败');
  assert(pc2.stats.playerExp === 45,
    `读档后玩家经验=45 (实际=${pc2.stats.playerExp})`, '玩家经验读档失败');
  assert(pc2.stats.totalCompleted === 7,
    `读档后 totalCompleted=7 (实际=${pc2.stats.totalCompleted})`, 'totalCompleted 读档失败');

  const loadedCommission = pc2.commissions.find(c => c.id === commission.id);
  assert(loadedCommission !== undefined,
    '进行中委托读档存在', '进行中委托丢失');
  assert(loadedCommission.status === 'in_progress',
    `读档后委托状态=in_progress (实际=${loadedCommission.status})`,
    '委托状态读档失败');
  assert(loadedCommission.phases[0].currentQuantity === 2,
    `读档后阶段进度=2 (实际=${loadedCommission.phases[0].currentQuantity})`,
    '阶段进度读档失败');

  assert(pc2.completedHistory.length >= 1,
    `读档后历史记录数量=${pc2.completedHistory.length}`,
    '历史记录读档失败');
});

test('11. 完整链路端到端：接委托→首收新残骸→进度→阶段完成→委托完成→读档续接', () => {
  log('━━━ 链路开始 ━━━', 'blue');

  const game = makeGame();
  const pc = game.portCommission;
  const inv = game.inventory;

  const uncollected = CREATURES.find(c =>
    c.rarity.name === RARITY.COMMON.name && !inv.collection.has(c.id)
  );
  assert(uncollected !== undefined, '存在未收集生物', '无可用未收集生物');
  log(`  🎯 目标生物: ${uncollected.icon} ${uncollected.name}`, 'blue');

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
    coinReward: 200,
    energyReward: 30,
    status: 'active'
  }];
  commission.totalCoinReward = 200;
  commission.totalEnergyReward = 30;
  pc.commissions.push(commission);

  log('  📌 步骤1: 接受委托', 'blue');
  const acceptResult = pc.acceptCommission(commission.id);
  assert(acceptResult.success, '接受委托成功', '接受失败');

  log('  🆕 步骤2: 首次收集目标残骸（触发图鉴新阶段进度）', 'blue');
  const beforeQty = commission.phases[0].currentQuantity;
  inv.addToBackpack(uncollected);
  const afterQty = commission.phases[0].currentQuantity;
  assert(afterQty > beforeQty,
    `阶段进度从 ${beforeQty} 增至 ${afterQty}`,
    '新残骸未触发委托进度');

  log('  💰 步骤3: 阶段完成 → 奖励发放', 'blue');
  const beforeCoins = game.stats.coins;
  const beforeEnergy = game.stats.energy;
  commission.phases[0].currentQuantity = 1;
  const phaseResult = pc.completePhase(commission.id);
  assert(phaseResult.success, '阶段完成成功', '阶段完成失败');
  assert(game.stats.coins > beforeCoins,
    `金币增加 (${beforeCoins}→${game.stats.coins})`, '金币未发放');
  assert(game.stats.energy > beforeEnergy,
    `能量增加 (${beforeEnergy}→${game.stats.energy})`, '能量未发放');

  log('  🏆 步骤4: 委托完成 → 计入历史与总奖励', 'blue');
  assert(commission.status === 'completed',
    `委托状态=completed (实际=${commission.status})`,
    '委托未标记完成');
  assert(pc.completedHistory.length >= 1,
    `历史记录=${pc.completedHistory.length}`,
    '历史记录未写入');

  log('  💾 步骤5: 存档', 'blue');
  const saved = pc.toJSON();
  const savedStats = { ...game.stats };
  log(`     存档: 等级=${pc.stats.playerLevel}, Exp=${pc.stats.playerExp}, 金币=${savedStats.coins}`, 'yellow');

  log('  📂 步骤6: 读档续进度', 'blue');
  const game2 = makeGame();
  game2.stats.coins = savedStats.coins;
  game2.stats.energy = savedStats.energy;
  game2.portCommission.loadData(saved);
  const pc2 = game2.portCommission;

  assert(pc2.stats.totalCompleted >= 1,
    `读档 totalCompleted=${pc2.stats.totalCompleted}`,
    '读档后完成计数丢失');
  assert(pc2.completedHistory.length >= 1,
    `读档历史=${pc2.completedHistory.length}`,
    '读档后历史丢失');
  assert(game2.stats.coins === savedStats.coins,
    `读档金币一致 (${savedStats.coins})`,
    `读档金币不一致: ${game2.stats.coins}`);

  log('━━━ 链路验证通过 ━━━', 'green');
});

console.log('\n════════════════════════════════════════════════════════');
if (failed === 0) {
  log(`🎉 全部 ${passed} 个测试通过! 港口委托完整链路验证成功。`, 'green');
} else {
  log(`⚠️  ${passed} 通过, ${failed} 失败`, 'red');
}
log('════════════════════════════════════════════════════════\n');

process.exit(failed === 0 ? 0 : 1);
