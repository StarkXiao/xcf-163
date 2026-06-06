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

import { ScrapWorkshop } from '../src/modules/ScrapWorkshop.js';
import { ChamberOfCommerce } from '../src/modules/ChamberOfCommerce.js';
import { DeepSeaExpedition } from '../src/modules/DeepSeaExpedition.js';

function makeGame() {
  return {
    stats: { coins: 1000, energy: 100, catchCount: 0 },
    updateStats(key, delta) {
      this.stats[key] = (this.stats[key] || 0) + delta;
    },
    addToBackpack(item) {
      this.backpack = this.backpack || [];
      this.backpack.push(item);
    },
    backpack: [],
    inventory: {
      getBackpackItems() { return []; },
      renderBackpack() {},
      backpack: []
    },
    saveProgress() {},
    checkTasks() {},
    taskSystem: { showHint() {} },
    tideSystem: null,
    reinforceSystem: null
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

console.log('\n=== 主界面入口点击验证测试（残骸工坊/商会/远征）===\n');
let allPass = true;

log('--- 测试1: 残骸工坊 ScrapWorkshop.open() ---', 'blue');
try {
  const game = makeGame();
  const workshop = new ScrapWorkshop(game);
  log('  → ScrapWorkshop 实例创建成功', 'blue');
  workshop.open();
  log('  → open() 执行无异常', 'blue');
  const modal = mockElements['scrap-workshop-modal'];
  allPass &= assert(!modal.classList.contains('hidden'),
    '残骸工坊模态框已显示（hidden class 已移除）',
    '残骸工坊模态框未显示');
  allPass &= assert(workshop.modal !== undefined,
    'ScrapWorkshop.modal 引用正常',
    'ScrapWorkshop.modal 缺失');
  log('  → 残骸工坊入口点击验证通过', 'green');
} catch (e) {
  allPass = false;
  log('  ❌ 残骸工坊入口异常: ' + e.message, 'red');
  console.error(e.stack);
}

log('\n--- 测试2: 商会 ChamberOfCommerce.openChamber() ---', 'blue');
try {
  const game = makeGame();
  const chamber = new ChamberOfCommerce(game);
  log('  → ChamberOfCommerce 实例创建成功', 'blue');
  chamber.openChamber();
  log('  → openChamber() 执行无异常', 'blue');
  const modal = mockElements['chamber-modal'];
  allPass &= assert(!modal.classList.contains('hidden'),
    '商会模态框已显示（hidden class 已移除）',
    '商会模态框未显示');
  allPass &= assert(chamber.modal !== undefined,
    'ChamberOfCommerce.modal 引用正常',
    'ChamberOfCommerce.modal 缺失');
  log('  → 商会入口点击验证通过', 'green');
} catch (e) {
  allPass = false;
  log('  ❌ 商会入口异常: ' + e.message, 'red');
  console.error(e.stack);
}

log('\n--- 测试3: 远征 DeepSeaExpedition.openExpedition() ---', 'blue');
try {
  const game = makeGame();
  const expedition = new DeepSeaExpedition(game);
  log('  → DeepSeaExpedition 实例创建成功', 'blue');
  expedition.openExpedition();
  log('  → openExpedition() 执行无异常', 'blue');
  const modal = mockElements['expedition-modal'];
  allPass &= assert(!modal.classList.contains('hidden'),
    '远征模态框已显示（hidden class 已移除）',
    '远征模态框未显示');
  allPass &= assert(expedition.modal !== undefined,
    'DeepSeaExpedition.modal 引用正常',
    'DeepSeaExpedition.modal 缺失');
  log('  → 远征入口点击验证通过', 'green');
} catch (e) {
  allPass = false;
  log('  ❌ 远征入口异常: ' + e.message, 'red');
  console.error(e.stack);
}

log('\n--- 测试4: 连续切换三个入口（模拟用户快速切换）---', 'blue');
try {
  const game = makeGame();
  const workshop = new ScrapWorkshop(game);
  const chamber = new ChamberOfCommerce(game);
  const expedition = new DeepSeaExpedition(game);

  workshop.open();
  chamber.openChamber();
  expedition.openExpedition();
  chamber.openChamber();
  workshop.open();

  log('  → 5 次连续切换 open() 均无异常', 'green');
  allPass &= assert(true, '连续切换无异常抛出', '连续切换出现异常');
} catch (e) {
  allPass = false;
  log('  ❌ 连续切换异常: ' + e.message, 'red');
  console.error(e.stack);
}

log('\n--- 测试5: 三个入口 toJSON/loadData 存档链路 ---', 'blue');
try {
  const game = makeGame();
  const workshop = new ScrapWorkshop(game);
  const chamber = new ChamberOfCommerce(game);
  const expedition = new DeepSeaExpedition(game);

  const wData = workshop.toJSON();
  const cData = chamber.toJSON();
  const eData = expedition.toJSON();

  log('  → ScrapWorkshop.toJSON() keys: ' + Object.keys(wData).join(', '), 'blue');
  log('  → ChamberOfCommerce.toJSON() keys: ' + Object.keys(cData || {}).join(', '), 'blue');
  log('  → DeepSeaExpedition.toJSON() keys: ' + Object.keys(eData || {}).join(', '), 'blue');

  workshop.loadData(wData);
  chamber.loadData(cData);
  expedition.loadData(eData);

  allPass &= assert(true, 'toJSON → loadData 往返无异常', '存档链路异常');
  log('  → 存档链路验证通过', 'green');
} catch (e) {
  allPass = false;
  log('  ❌ 存档链路异常: ' + e.message, 'red');
  console.error(e.stack);
}

console.log('\n=== 测试总结 ===');
log(allPass ? '🎉 残骸工坊 / 商会 / 远征 三大入口全部验证通过！' : '⚠️ 部分验证失败', allPass ? 'green' : 'red');
console.log('');
process.exit(allPass ? 0 : 1);
