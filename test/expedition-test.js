import { DeepSeaExpedition } from '../src/modules/DeepSeaExpedition.js';
import { Storage } from '../src/modules/Storage.js';
import { ROUTES, SUPPLY_ITEMS, getRandomEvent, getRandomWreck, generateCreatureForExpedition } from '../src/data/deepSeaExpedition.js';

console.log('=== 深海远征链路测试 ===\n');

const mockGame = {
  stats: { coins: 10000 },
  updateStats: (key, delta) => {
    mockGame.stats[key] = (mockGame.stats[key] || 0) + delta;
    console.log(`  [Game] ${key}: ${mockGame.stats[key]} (${delta > 0 ? '+' : ''}${delta})`);
  },
  addToBackpack: (item) => {
    console.log(`  [Backpack] 添加: ${item.icon} ${item.name} (${item.value}💰)`);
  },
  saveProgress: () => {
    console.log('  [Save] 进度已保存');
  },
  checkTasks: () => {},
  taskSystem: { showHint: (msg) => console.log(`  [Hint] ${msg}`) },
  tideSystem: null
};

const expedition = new DeepSeaExpedition(mockGame);

console.log('\n--- 步骤1: 购买补给 (近海航线需要 🍖5 ⛽5 🔧2) ---');
expedition.buySupply('food', 20);
expedition.buySupply('fuel', 20);
expedition.buySupply('repair', 10);
console.log('港口库存:', expedition.supplies);

console.log('\n--- 步骤2: 出发近海航线远征 ---');
console.log('出发前 港口库存:', expedition.supplies);
expedition.startExpedition('coastal');
console.log('出发后 港口库存:', expedition.supplies);
console.log('船上补给:', expedition.currentExpedition.supplies);
console.log('每日消耗:', expedition.currentExpedition.dailyCost);

console.log('\n--- 步骤3: 逐日推进 (近海航线3天) ---');
for (let day = 1; day <= 3; day++) {
  console.log(`\n= 第 ${day} 天 =`);
  expedition.advanceDay();
  if (!expedition.currentExpedition) break;
  console.log(`  船上补给: 🍖${expedition.currentExpedition.supplies.food} ⛽${expedition.currentExpedition.supplies.fuel} 🔧${expedition.currentExpedition.supplies.repair}`);
  console.log(`  船体: ${Math.floor(expedition.currentExpedition.hull)}/${expedition.currentExpedition.maxHull}`);
  console.log(`  货物数: ${expedition.currentExpedition.cargo.length} / ${expedition.getMaxCargo()}`);
  console.log(`  额外金币: ${expedition.currentExpedition.bonusCoins}💰`);
  console.log(`  事件数: ${expedition.currentExpedition.eventsEncountered.length}`);
  console.log(`  发现残骸: ${expedition.currentExpedition.wrecksFound}`);
  console.log(`  捕获生物: ${expedition.currentExpedition.creaturesCaught}`);
}

if (expedition.currentExpedition) {
  console.log('\n--- 步骤4: 手动回港查看结算 ---');
  console.log('回港前 港口库存:', expedition.supplies);
  console.log('回港前 船上剩余补给:', expedition.currentExpedition.supplies);
  const remainingFood = expedition.currentExpedition.supplies.food;
  const remainingFuel = expedition.currentExpedition.supplies.fuel;
  const remainingRepair = expedition.currentExpedition.supplies.repair;

  const totalDays = expedition.currentExpedition.totalDays;
  const currentDay = expedition.currentExpedition.currentDay;
  const route = expedition.currentExpedition.route;

  console.log(`\n--- 预期结果校验 ---`);
  console.log(`航线基础奖励: ${route.baseRewardCoins}💰`);
  const expectedBase = Math.floor(route.baseRewardCoins * (currentDay / totalDays));
  console.log(`按天数折算基础奖励: ${expectedBase}💰`);
  const dailyFood = expedition.currentExpedition.dailyCost.food;
  const dailyFuel = expedition.currentExpedition.dailyCost.fuel;
  const expectedFoodUsed = Math.min(currentDay * dailyFood, route.supplyCost.food);
  const expectedFuelUsed = Math.min(currentDay * dailyFuel, Math.ceil(route.supplyCost.fuel * (1 - expedition.getFuelDiscount())));
  console.log(`食物: 带了${route.supplyCost.food}，每日用${dailyFood}，用了${expectedFoodUsed}，预计剩${remainingFood}`);
  console.log(`燃料: 带了${Math.ceil(route.supplyCost.fuel * (1 - expedition.getFuelDiscount()))}，每日用${dailyFuel}，用了${expectedFuelUsed}，预计剩${remainingFuel}`);
  console.log(`是否正常回港: ${!expedition.currentExpedition.returnedEarly ? '是' : '否（紧急）'}`);
  console.log(`船体: ${Math.floor(expedition.currentExpedition.hull)}/${expedition.currentExpedition.maxHull} (>50%免罚金: ${expedition.currentExpedition.hull > expedition.currentExpedition.maxHull * 0.5})`);
}

console.log('\n=== 测试完成 ===');
console.log('当前金币:', mockGame.stats.coins);
console.log('远征累计次数:', expedition.stats.totalExpeditions);
console.log('远征累计收益:', expedition.stats.totalExpeditionCoins);
