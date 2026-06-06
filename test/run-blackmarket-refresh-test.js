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
global.document = {
  getElementById() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {}
};

import { BlackMarket } from '../src/modules/BlackMarket.js';
import { ChamberOfCommerce } from '../src/modules/ChamberOfCommerce.js';
import { BLACK_MARKET_MERCHANTS, BLACK_MARKET_FLUCTUATIONS } from '../src/data/blackMarket.js';
import { CREATURES, RARITY, calculateCreatureValue } from '../src/data/creatures.js';

function makeGame() {
  return {
    stats: { coins: 10000 },
    updateStats(key, delta) {
      this.stats[key] = (this.stats[key] || 0) + delta;
    },
    addToBackpack(item) {
      this.backpack = this.backpack || [];
      this.backpack.push(item);
    },
    backpack: [],
    inventory: {
      backpack: [],
      renderBackpack() {},
      openBackpack() {},
      closeBackpack() {}
    },
    saveProgress() {},
    checkTasks() {},
    taskSystem: { showHint() {} },
    tideSystem: null,
    customerSystem: null
  };
}

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

log('════════════════════════════════════════════════════════', 'blue');
log('  渔港黑市交易日 - 跨天刷新与存档恢复验证', 'blue');
log('════════════════════════════════════════════════════════', 'blue');

test('1. BlackMarket.init() 正确初始化默认商人、订单、lastRefreshDay', () => {
  const game = makeGame();
  const bm = new BlackMarket(game);
  bm.init(3);

  assert(bm.merchant !== null, '商人已初始化', '商人为空');
  assert(bm.fluctuation !== null, '行情已初始化', '行情为空');
  assert(bm.orders.length > 0, `订单已生成 (数量=${bm.orders.length})`, '订单为空');
  assert(bm.lastRefreshDay === 3, `lastRefreshDay 等于传入的经营日 (${bm.lastRefreshDay} === 3)`,
    `lastRefreshDay 异常: ${bm.lastRefreshDay}`);
  assert(bm.stats.daysTraded === 0, 'daysTraded 初始为 0', `daysTraded 异常: ${bm.stats.daysTraded}`);
});

test('2. BlackMarket.onNewDay() 正确切换商人、行情、订单，并推进 lastRefreshDay', () => {
  const game = makeGame();
  const bm = new BlackMarket(game);
  bm.init(1);

  const oldMerchantId = bm.merchant.id;
  const oldFluctId = bm.fluctuation.id;
  const oldOrderIds = bm.orders.map(o => o.id);

  const result = bm.onNewDay(2);

  assert(bm.lastRefreshDay === 2, `lastRefreshDay 更新为 2 (实际=${bm.lastRefreshDay})`, 'lastRefreshDay 未更新');
  assert(bm.stats.daysTraded === 1, `daysTraded 增加 1 (实际=${bm.stats.daysTraded})`, 'daysTraded 未增加');
  assert(result.newMerchant !== null, '返回值中 newMerchant 存在', '返回值中 newMerchant 缺失');

  const changedMerchant = bm.merchant.id !== oldMerchantId;
  const changedFluct = bm.fluctuation.id !== oldFluctId;
  const allOrdersNew = bm.orders.every(o => !oldOrderIds.includes(o.id));
  assert(bm.orders.length === oldOrderIds.length, `新订单数量与旧数量一致 (${bm.orders.length})`,
    `数量异常: 旧=${oldOrderIds.length} 新=${bm.orders.length}`);
  assert(allOrdersNew, '所有订单 ID 全部刷新 (旧订单被清空)', '存在未刷新的旧订单');
  log(`ℹ️  商人是否变化: ${changedMerchant}, 行情是否变化: ${changedFluct}`, 'yellow');
});

test('3. 跨天刷新后订单状态均为 active，且包含奖励金额', () => {
  const game = makeGame();
  const bm = new BlackMarket(game);
  bm.init(1);
  bm.onNewDay(2);

  const active = bm.getActiveOrders();
  assert(active.length === bm.orders.length, `所有订单为 active (${active.length}/${bm.orders.length})`,
    '存在非 active 订单');
  active.forEach(o => {
    assert(o.reward > 0, `订单 ${o.id.substring(0, 15)} 奖励 > 0 (${o.reward})`,
      `订单奖励异常: ${o.reward}`);
    assert(o.requiredQuantity > 0, `订单需求数量 > 0 (${o.requiredQuantity})`,
      `订单需求数量异常: ${o.requiredQuantity}`);
    assert(typeof o.timeRemaining === 'number' && o.timeRemaining > 0,
      `订单 timeRemaining 合法 (${o.timeRemaining})`,
      `订单 timeRemaining 异常: ${o.timeRemaining}`);
  });
});

test('4. BlackMarket.toJSON() / loadData() 完整序列化与反序列化', () => {
  const game = makeGame();
  const bm = new BlackMarket(game);
  bm.init(5);
  bm.stats.totalSales = 42;
  bm.stats.totalRevenue = 8888;
  bm.stats.ordersCompleted = 7;

  const snapshot = bm.toJSON();

  assert(typeof snapshot === 'object', 'toJSON 返回对象', 'toJSON 未返回对象');
  assert(snapshot.merchant === bm.merchant.id, `merchant ID 正确 (${snapshot.merchant})`, 'merchant ID 错误');
  assert(snapshot.fluctuation === bm.fluctuation.id, `fluctuation ID 正确 (${snapshot.fluctuation})`, 'fluctuation ID 错误');
  assert(Array.isArray(snapshot.orders) && snapshot.orders.length === bm.orders.length,
    `orders 数组完整 (${snapshot.orders.length})`, 'orders 数组异常');
  assert(snapshot.lastRefreshDay === 5, `lastRefreshDay=5 (实际=${snapshot.lastRefreshDay})`, 'lastRefreshDay 错误');
  assert(!snapshot.refreshTimer, '不再包含 refreshTimer 字段', '包含旧字段 refreshTimer');
  assert(snapshot.stats.totalSales === 42, 'stats.totalSales=42', 'stats 序列化失败');

  const game2 = makeGame();
  const bm2 = new BlackMarket(game2);
  bm2.loadData(snapshot);

  assert(bm2.merchant.id === bm.merchant.id, 'loadData 后 merchant 一致', 'merchant 不一致');
  assert(bm2.fluctuation.id === bm.fluctuation.id, 'loadData 后 fluctuation 一致', 'fluctuation 不一致');
  assert(bm2.orders.length === bm.orders.length, 'loadData 后订单数量一致', '订单数量不一致');
  assert(bm2.orders[0].id === bm.orders[0].id, 'loadData 后订单 ID 一致', '订单 ID 不一致');
  assert(bm2.orders[0].status === bm.orders[0].status, 'loadData 后订单状态一致', '订单状态不一致');
  assert(bm2.lastRefreshDay === 5, `loadData 后 lastRefreshDay=5 (实际=${bm2.lastRefreshDay})`,
    'lastRefreshDay 不一致');
  assert(bm2.stats.totalRevenue === 8888, 'loadData 后 stats.totalRevenue=8888', 'stats 反序列化失败');
});

test('5. 存档恢复后，订单进度(currentQuantity)与状态完整保留', () => {
  const game = makeGame();
  const bm = new BlackMarket(game);
  bm.init(1);

  const order = bm.orders[0];
  order.currentQuantity = Math.min(3, order.requiredQuantity - 1);
  const order2 = bm.orders[1];
  order2.status = 'completed';
  order2.completedAt = Date.now();
  bm.stats.ordersCompleted = 1;

  const snapshot = bm.toJSON();
  const game2 = makeGame();
  const bm2 = new BlackMarket(game2);
  bm2.loadData(snapshot);

  const restoredOrder = bm2.orders.find(o => o.id === order.id);
  const restoredOrder2 = bm2.orders.find(o => o.id === order2.id);
  assert(restoredOrder.currentQuantity === order.currentQuantity,
    `订单进度保留 (${restoredOrder.currentQuantity} === ${order.currentQuantity})`,
    '订单进度丢失');
  assert(restoredOrder2.status === 'completed', '已完成订单状态保留', '已完成订单状态丢失');
  assert(bm2.getActiveOrders().length === bm.orders.length - 1,
    `活跃订单数量正确 (${bm2.getActiveOrders().length})`, '活跃订单统计异常');
  assert(bm2.stats.ordersCompleted === 1, '订单完成统计保留', '订单完成统计丢失');
});

test('6. ChamberOfCommerce tick 触发 day+1 时自动调用 blackMarket.onNewDay', () => {
  const game = makeGame();
  const chamber = new ChamberOfCommerce(game);
  chamber.isRunning = true;
  chamber.cycleDay = 1;
  chamber.blackMarket.init(1);
  const oldBmMerchantId = chamber.blackMarket.merchant.id;
  const oldOrderIds = chamber.blackMarket.orders.map(o => o.id);

  let shownHint = null;
  game.taskSystem.showHint = (msg) => { shownHint = msg; };
  let saved = false;
  game.saveProgress = () => { saved = true; };

  chamber.cycleTimer = 99999;
  chamber.tick();

  assert(chamber.cycleDay === 2, `chamber.cycleDay 从 1 变为 2 (实际=${chamber.cycleDay})`,
    'cycleDay 未递增');
  assert(chamber.blackMarket.lastRefreshDay === 2,
    `blackMarket.lastRefreshDay 更新为 2 (实际=${chamber.blackMarket.lastRefreshDay})`,
    'blackMarket.lastRefreshDay 未更新');
  const allOrdersNew = chamber.blackMarket.orders.every(o => !oldOrderIds.includes(o.id));
  assert(allOrdersNew, 'Chamber 跨天后黑市订单被刷新', 'Chamber 跨天后订单未刷新');
  assert(shownHint && shownHint.includes('黑市刷新'),
    `跨天提示包含黑市刷新信息 (实际="${shownHint}")`,
    '跨天提示缺失黑市刷新信息');
  assert(saved, '跨天后触发 saveProgress', '跨天后未保存进度');
});

test('7. tick 推进时间不会在未跨天时触发黑市刷新', () => {
  const game = makeGame();
  const chamber = new ChamberOfCommerce(game);
  chamber.isRunning = true;
  chamber.cycleDay = 5;
  chamber.blackMarket.init(5);
  const oldBmMerchantId = chamber.blackMarket.merchant.id;
  const oldOrderIds = chamber.blackMarket.orders.map(o => o.id);

  chamber.cycleTimer = 1;
  chamber.lastTick = 0;
  chamber.tick();

  assert(chamber.cycleDay === 5, `cycleDay 保持为 5 (实际=${chamber.cycleDay})`,
    'cycleDay 不应变化');
  assert(chamber.blackMarket.lastRefreshDay === 5,
    `blackMarket.lastRefreshDay 保持 5 (实际=${chamber.blackMarket.lastRefreshDay})`,
    'lastRefreshDay 不应变化');
  assert(chamber.blackMarket.merchant.id === oldBmMerchantId,
    '商人 ID 在未跨天时保持不变', '商人被错误刷新');
  const orderIdsSame = chamber.blackMarket.orders.every(o => oldOrderIds.includes(o.id));
  assert(orderIdsSame, '订单在未跨天时保持不变', '订单被错误刷新');
});

test('8. ChamberOfCommerce toJSON/loadData 完整保留黑市状态', () => {
  const game = makeGame();
  const chamber = new ChamberOfCommerce(game);
  chamber.cycleDay = 3;
  chamber.blackMarket.init(3);
  chamber.blackMarket.stats.totalSales = 100;
  chamber.blackMarket.orders[0].currentQuantity = 2;

  const snapshot = chamber.toJSON();
  assert(snapshot.blackMarket, '快照包含 blackMarket 字段', '快照缺少 blackMarket');
  assert(!snapshot.blackMarketTimer, '快照不再包含 blackMarketTimer 旧字段', '存在旧字段 blackMarketTimer');

  const game2 = makeGame();
  const chamber2 = new ChamberOfCommerce(game2);
  chamber2.loadData(snapshot);

  assert(chamber2.cycleDay === 3, `loadData 后 cycleDay=3 (实际=${chamber2.cycleDay})`, 'cycleDay 丢失');
  assert(chamber2.blackMarket.lastRefreshDay === 3,
    `loadData 后 blackMarket.lastRefreshDay=3 (实际=${chamber2.blackMarket.lastRefreshDay})`,
    'blackMarket.lastRefreshDay 丢失');
  assert(chamber2.blackMarket.merchant.id === chamber.blackMarket.merchant.id,
    'loadData 后黑市商人一致', '黑市商人不一致');
  assert(chamber2.blackMarket.stats.totalSales === 100,
    'loadData 后黑市销售统计保留', '黑市销售统计丢失');
  assert(chamber2.blackMarket.orders[0].currentQuantity === 2,
    'loadData 后订单进度保留', '订单进度丢失');
});

test('9. 订单 tick 超时机制依然有效 (与跨天刷新无关)', () => {
  const game = makeGame();
  const bm = new BlackMarket(game);
  bm.init(1);

  const order = bm.orders[0];
  order.timeRemaining = 1;
  bm.tick(5);

  assert(order.status === 'failed', `timeRemaining 归零后订单变为 failed (实际=${order.status})`,
    '订单未超时失败');
  assert(bm.stats.ordersFailed >= 1, `stats.ordersFailed >= 1 (实际=${bm.stats.ordersFailed})`,
    'ordersFailed 未增加');
});

console.log('\n════════════════════════════════════════════════════════');
if (failed === 0) {
  log(`🎉 全部 ${passed} 个测试通过!`, 'green');
} else {
  log(`⚠️  ${passed} 通过, ${failed} 失败`, 'red');
}
log('════════════════════════════════════════════════════════\n');

process.exit(failed === 0 ? 0 : 1);
