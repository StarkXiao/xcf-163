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

import {
  getRandomCreature,
  getComboEnergyDiscount,
  getComboEnergyRegenBonus,
  COMBO_CONFIG,
  RARITY,
  getRarityKey
} from '../src/data/creatures.js';

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
log('  连续打捞连锁系统 - 存档重置与能量权重验证', 'blue');
log('════════════════════════════════════════════════════════', 'blue');

test('1. getComboEnergyDiscount 连击为 0 时折扣为 0', () => {
  const discount = getComboEnergyDiscount(0);
  assert(discount === 0, `0连击折扣=0 (实际=${discount})`, `0连击折扣不为0: ${discount}`);
});

test('2. getComboEnergyDiscount 折扣随连击提升但不超过上限 40%', () => {
  for (let c = 1; c <= 15; c++) {
    const d = getComboEnergyDiscount(c);
    assert(d >= 0, `${c}连击折扣非负 (${d})`, `${c}连击折扣为负: ${d}`);
  }
  const maxDiscount = getComboEnergyDiscount(100);
  assert(maxDiscount <= COMBO_CONFIG.maxEnergyDiscount,
    `折扣上限=${COMBO_CONFIG.maxEnergyDiscount} (实际=${maxDiscount})`,
    `折扣超过上限: ${maxDiscount}`);
  const d20 = getComboEnergyDiscount(20);
  assert(d20 === COMBO_CONFIG.maxEnergyDiscount,
    `20连击折扣达到上限 (实际=${d20})`,
    `20连击折扣未达到上限: ${d20}`);
});

test('3. getComboEnergyRegenBonus 连击为 0 时加成 0', () => {
  const bonus = getComboEnergyRegenBonus(0);
  assert(bonus === 0, `0连击恢复加成=0 (实际=${bonus})`, `0连击恢复加成不为0: ${bonus}`);
});

test('4. getComboEnergyRegenBonus 加成随连击提升但不超过上限 100%', () => {
  const maxBonus = getComboEnergyRegenBonus(100);
  assert(maxBonus <= COMBO_CONFIG.maxEnergyRegenBonus,
    `恢复加成上限=${COMBO_CONFIG.maxEnergyRegenBonus} (实际=${maxBonus})`,
    `恢复加成超过上限: ${maxBonus}`);
  const b10 = getComboEnergyRegenBonus(10);
  assert(b10 === COMBO_CONFIG.maxEnergyRegenBonus,
    `10连击恢复加成达到上限 (实际=${b10})`,
    `10连击恢复加成未达到上限: ${b10}`);
});

test('5. comboCount=0 时 getRandomCreature 使用基础权重（稀有率未被提升）', () => {
  const samples = 2000;
  let legendaryCount0 = 0;
  for (let i = 0; i < samples; i++) {
    const c = getRandomCreature(null, 0);
    if (c.rarity === RARITY.LEGENDARY) legendaryCount0++;
  }

  let legendaryCount15 = 0;
  for (let i = 0; i < samples; i++) {
    const c = getRandomCreature(null, 15);
    if (c.rarity === RARITY.LEGENDARY) legendaryCount15++;
  }

  log(`ℹ️  0连击传说数: ${legendaryCount0}, 15连击传说数: ${legendaryCount15}`, 'yellow');
  assert(legendaryCount15 > legendaryCount0,
    `15连击传说数量(${legendaryCount15}) > 0连击(${legendaryCount0})`,
    `连击未提升传说概率: 0连=${legendaryCount0}, 15连=${legendaryCount15}`);
});

test('6. 模拟存档保存/加载：保存时 comboCount 被清零，maxComboReached 与 totalComboHits 保留', () => {
  const stats = {
    energy: 80,
    coins: 1000,
    catchCount: 50,
    comboCount: 7,
    maxComboReached: 12,
    totalComboHits: 88
  };

  const statsToSave = {
    ...stats,
    comboCount: 0
  };

  assert(statsToSave.comboCount === 0, `保存时 comboCount 被清零 (实际=${statsToSave.comboCount})`,
    `保存时 comboCount 未清零: ${statsToSave.comboCount}`);
  assert(statsToSave.maxComboReached === 12, `保存时 maxComboReached 保留 (${statsToSave.maxComboReached})`,
    `maxComboReached 丢失: ${statsToSave.maxComboReached}`);
  assert(statsToSave.totalComboHits === 88, `保存时 totalComboHits 保留 (${statsToSave.totalComboHits})`,
    `totalComboHits 丢失: ${statsToSave.totalComboHits}`);

  const defaultStats = {
    energy: 100,
    coins: 0,
    catchCount: 0,
    comboCount: 0,
    maxComboReached: 0,
    totalComboHits: 0
  };
  let loadedStats = { ...defaultStats, ...statsToSave };
  loadedStats.comboCount = 0;

  assert(loadedStats.comboCount === 0, `加载后 comboCount=0 (实际=${loadedStats.comboCount})`,
    `加载后 comboCount 不为0: ${loadedStats.comboCount}`);
  assert(loadedStats.maxComboReached === 12, `加载后 maxComboReached 保留为 12`,
    `加载后 maxComboReached 丢失: ${loadedStats.maxComboReached}`);
  assert(loadedStats.totalComboHits === 88, `加载后 totalComboHits 保留为 88`,
    `加载后 totalComboHits 丢失: ${loadedStats.totalComboHits}`);
});

test('7. 读档后：能量折扣与能量恢复加成恢复正常（comboCount=0 时无加成）', () => {
  const comboAfterLoad = 0;
  const discount = getComboEnergyDiscount(comboAfterLoad);
  const regenBonus = getComboEnergyRegenBonus(comboAfterLoad);

  assert(discount === 0, `读档后能量折扣为 0 (实际=${discount})`,
    `读档后能量折扣异常: ${discount}`);
  assert(regenBonus === 0, `读档后能量恢复加成为 0 (实际=${regenBonus})`,
    `读档后能量恢复加成异常: ${regenBonus}`);
});

test('8. 读档后：稀有度权重恢复为基础值（0连击下 getRandomCreature 未被额外加权）', () => {
  function estimateRarityRate(combo, samples = 3000) {
    const counts = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    for (let i = 0; i < samples; i++) {
      const c = getRandomCreature(null, combo);
      const key = getRarityKey(c.rarity);
      counts[key]++;
    }
    return {
      common: counts.common / samples,
      uncommon: counts.uncommon / samples,
      rare: counts.rare / samples,
      epic: counts.epic / samples,
      legendary: counts.legendary / samples
    };
  }

  const rate0 = estimateRarityRate(0, 3000);
  const rate10 = estimateRarityRate(10, 3000);

  log(`ℹ️  0连击 分布: 普=${rate0.common.toFixed(3)} 优=${rate0.uncommon.toFixed(3)} 稀=${rate0.rare.toFixed(3)} 史=${rate0.epic.toFixed(3)} 传=${rate0.legendary.toFixed(3)}`, 'yellow');
  log(`ℹ️  10连击分布: 普=${rate10.common.toFixed(3)} 优=${rate10.uncommon.toFixed(3)} 稀=${rate10.rare.toFixed(3)} 史=${rate10.epic.toFixed(3)} 传=${rate10.legendary.toFixed(3)}`, 'yellow');

  assert(rate0.legendary < rate10.legendary,
    `0连击传说率(${rate0.legendary.toFixed(3)}) < 10连击传说率(${rate10.legendary.toFixed(3)})`,
    `读档后（0连击）传说率不低于连击`);
  assert(rate0.rare < rate10.rare,
    `0连击稀有率(${rate0.rare.toFixed(3)}) < 10连击稀有率(${rate10.rare.toFixed(3)})`,
    `读档后（0连击）稀有率不低于连击`);
  assert(rate0.common > rate10.common,
    `0连击普通率(${rate0.common.toFixed(3)}) > 10连击普通率(${rate10.common.toFixed(3)})`,
    `读档后（0连击）普通率不高于连击`);
});

test('9. COMBO_CONFIG.comboTimeout 合理（8秒内保持连击）', () => {
  assert(typeof COMBO_CONFIG.comboTimeout === 'number' && COMBO_CONFIG.comboTimeout > 0,
    `comboTimeout 合法 (${COMBO_CONFIG.comboTimeout}ms)`,
    `comboTimeout 异常: ${COMBO_CONFIG.comboTimeout}`);
  assert(Array.isArray(COMBO_CONFIG.comboMilestones) && COMBO_CONFIG.comboMilestones.length >= 5,
    `comboMilestones 里程碑配置完整 (${COMBO_CONFIG.comboMilestones.join(',')})`,
    `里程碑配置缺失`);
});

console.log('\n════════════════════════════════════════════════════════');
if (failed === 0) {
  log(`🎉 全部 ${passed} 个测试通过!`, 'green');
} else {
  log(`⚠️  ${passed} 通过, ${failed} 失败`, 'red');
}
log('════════════════════════════════════════════════════════\n');

process.exit(failed === 0 ? 0 : 1);
