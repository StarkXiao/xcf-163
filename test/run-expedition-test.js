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

import { DeepSeaExpedition } from '../src/modules/DeepSeaExpedition.js';
import { ROUTES, SUPPLY_ITEMS } from '../src/data/deepSeaExpedition.js';

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
    saveProgress() {},
    checkTasks() {},
    taskSystem: { showHint() {} },
    tideSystem: null
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

console.log('\n=== 深海远征完整链路测试 ===\n');
let allPass = true;

// 测试1: 购买补给
log('--- 测试1: 购买补给 ---', 'blue');
const game1 = makeGame();
const exp1 = new DeepSeaExpedition(game1);
const initCoins = game1.stats.coins;
exp1.buySupply('food', 20);
exp1.buySupply('fuel', 20);
exp1.buySupply('repair', 10);
console.log(`库存: 🍖${exp1.supplies.food} ⛽${exp1.supplies.fuel} 🔧${exp1.supplies.repair} 💰${game1.stats.coins}`);
allPass &= assert(exp1.supplies.food === 20 && exp1.supplies.fuel === 20 && exp1.supplies.repair === 10,
  '补给购买数量正确', '补给购买数量错误');
allPass &= assert(game1.stats.coins === initCoins - (20 * 20 + 20 * 30 + 10 * 50),
  '金币扣除正确', '金币扣除错误');

// 测试2: 出发 - 验证补给从港口扣除并带上船
log('\n--- 测试2: 出发近海航线（补给带船上）---', 'blue');
const game2 = makeGame();
const exp2 = new DeepSeaExpedition(game2);
exp2.supplies = { food: 10, fuel: 10, repair: 5 };
console.log('出发前港口:', JSON.stringify(exp2.supplies));
exp2.startExpedition('coastal');
console.log('出发后港口:', JSON.stringify(exp2.supplies));
console.log('船上补给:', JSON.stringify(exp2.currentExpedition.supplies));
console.log('每日消耗:', JSON.stringify(exp2.currentExpedition.dailyCost));
allPass &= assert(exp2.supplies.food === 5 && exp2.supplies.fuel === 5 && exp2.supplies.repair === 3,
  '港口库存扣减正确（扣5食物5燃料2零件）', '港口扣减错误');
allPass &= assert(exp2.currentExpedition.supplies.food === 5,
  '船上食物=5（近海要求）', '船上食物错误');
allPass &= assert(exp2.currentExpedition.supplies.fuel >= 5,
  `船上燃料≥5（近海要求，当前${exp2.currentExpedition.supplies.fuel}）`, '船上燃料错误');
allPass &= assert(exp2.currentExpedition.supplies.repair === 2,
  '船上零件=2（近海要求）', '船上零件错误');
allPass &= assert(exp2.currentExpedition.dailyCost.food === Math.max(1, Math.ceil(5 / 3)),
  '每日食物消耗计算正确', '每日食物消耗错误');

// 测试3: 按日推进 - 验证消耗、风险事件、残骸遭遇
log('\n--- 测试3: 推进3天（近海航线）---', 'blue');
const game3 = makeGame();
const exp3 = new DeepSeaExpedition(game3);
exp3.supplies = { food: 5, fuel: 5, repair: 2 };
exp3.startExpedition('coastal');
const requiredFood = exp3.currentExpedition.supplies.food;
const requiredFuel = exp3.currentExpedition.supplies.fuel;
let day = 0;
while (exp3.currentExpedition && day < 10) {
  day++;
  const before = exp3.currentExpedition ? {
    food: exp3.currentExpedition.supplies.food,
    fuel: exp3.currentExpedition.supplies.fuel,
    hull: exp3.currentExpedition.hull,
    cargo: exp3.currentExpedition.cargo.length,
    wrecks: exp3.currentExpedition.wrecksFound,
    events: exp3.currentExpedition.eventsEncountered.length,
    coins: exp3.currentExpedition.bonusCoins,
    creatures: exp3.currentExpedition.creaturesCaught
  } : null;
  const logLen = exp3.expeditionLog.length;
  exp3.advanceDay();
  if (!exp3.currentExpedition) {
    log(`第${day}天：远征已结束`, 'yellow');
    break;
  }
  const a = exp3.currentExpedition;
  const dailyFood = a.dailyCost.food;
  const dailyFuel = a.dailyCost.fuel;
  log(`第${a.currentDay}天结束: 🍖${a.supplies.food}(预期:${Math.max(0, before.food - dailyFood)}) ⛽${a.supplies.fuel}(预期:${Math.max(0, before.fuel - dailyFuel)}) 船体${Math.floor(a.hull)} 货物${a.cargo.length} 残骸${a.wrecksFound} 事件${a.eventsEncountered.length} 额外金币${a.bonusCoins}💰 捕获${a.creaturesCaught}`, 'blue');
  if (a.supplies.food > 0) {
    allPass &= assert(a.supplies.food === before.food - dailyFood,
      `第${a.currentDay}天食物消耗正确（${before.food}-${dailyFood}=${before.food-dailyFood}）`,
      `食物错误: ${before.food}-${dailyFood}≠${a.supplies.food}`);
  }
}
log(`共推进 ${exp3.expeditionLog.slice(0, 30).length} 条日志`, 'blue');
exp3.expeditionLog.slice(0, 15).reverse().forEach(l => {
  const color = l.type === 'danger' ? 'red' : l.type === 'success' ? 'green' : 'yellow';
  log(`  📜 [${l.time}] ${l.message}`, color);
});

// 测试4: 回港结算 - 验证补给归还、金币发放、货物入背包
log('\n--- 测试4: 回港结算 ---', 'blue');
let resultSummary = null;
const game4 = makeGame();
const exp4 = new DeepSeaExpedition(game4);
exp4.showSettlementModal = function(summary, success) {
  resultSummary = summary;
  log(`结算结果: 总计${summary.totalCoins}💰  基础${summary.baseReward}  额外${summary.bonusCoins}  货物${summary.cargoValue}  船体罚${summary.hullPenalty}  提前罚${summary.earlyPenalty}`, 'yellow');
  if (summary.returnedSupplies) {
    log(`归还补给: ${JSON.stringify(summary.returnedSupplies)}`, 'yellow');
  }
  if (summary.messages) summary.messages.forEach(m => log(`  ⚠️ ${m}`, 'yellow'));
  if (summary.cargoItems) log(`捕获物品数: ${summary.cargoItems.length}`, 'yellow');
};
exp4.supplies = { food: 5, fuel: 5, repair: 2 };
exp4.startExpedition('coastal');
const portBefore = { ...exp4.supplies };
for (let i = 0; i < 10; i++) {
  if (!exp4.currentExpedition) break;
  exp4.advanceDay();
}
log(`回港前港口: 🍖${portBefore.food} ⛽${portBefore.fuel} 🔧${portBefore.repair}`, 'blue');
log(`回港后港口: 🍖${exp4.supplies.food} ⛽${exp4.supplies.fuel} 🔧${exp4.supplies.repair}`, 'blue');
if (resultSummary && resultSummary.returnedSupplies) {
  allPass &= assert(
    exp4.supplies.food >= portBefore.food &&
    exp4.supplies.fuel >= portBefore.fuel &&
    exp4.supplies.repair >= portBefore.repair,
    '剩余补给已归还港口', '补给未正确归还港口');
}
allPass &= assert(resultSummary && typeof resultSummary.totalCoins === 'number',
  '结算金币有效', '结算金币无效');
allPass &= assert(game4.backpack.length > 0 || resultSummary.cargoItems.length === 0,
  `捕获物品入背包（实际:${game4.backpack.length}件）`, '物品未入背包');

// 测试5: 紧急回港 - 验证提前回港罚金
log('\n--- 测试5: 紧急回港（罚金测试）---', 'blue');
let result5 = null;
const game5 = makeGame();
const exp5 = new DeepSeaExpedition(game5);
exp5.showSettlementModal = function(s) { result5 = s; };
exp5.supplies = { food: 10, fuel: 10, repair: 5 };
exp5.startExpedition('deep_sea');
exp5.advanceDay();
exp5.returnToPort(true);
if (result5) {
  log(`总收益: ${result5.totalCoins}💰  提前罚金: ${result5.earlyPenalty}💰`, 'yellow');
  allPass &= assert(result5.earlyPenalty > 0, '提前回港有罚金', '提前回港无罚金');
}

// 测试6: 失败测试 - 船体损毁
log('\n--- 测试6: 船体损毁（远征失败）---', 'blue');
let result6 = null;
const game6 = makeGame();
const exp6 = new DeepSeaExpedition(game6);
exp6.showSettlementModal = function(s) { result6 = s; };
exp6.supplies = { food: 5, fuel: 5, repair: 2 };
exp6.startExpedition('coastal');
exp6.currentExpedition.supplies.food = 0;
exp6.currentExpedition.supplies.fuel = 0;
exp6.currentExpedition.hull = 5;
log('强制设置: 食物=0 燃料=0 船体=5', 'yellow');
exp6.advanceDay();
if (result6) {
  log(`结果: ${result6.totalCoins}💰 ${result6.messages[0] || ''}`, 'yellow');
  allPass &= assert(result6.totalCoins === 0, '远征失败无收益', '远征失败仍有收益');
}

console.log('\n=== 测试总结 ===');
log(allPass ? '🎉 所有关键断言通过！' : '⚠️ 部分断言失败', allPass ? 'green' : 'red');
