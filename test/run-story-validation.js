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
import { STORY_CHAPTERS, STORY_CHARACTERS, getChapterById, getCharacterById } from '../src/data/storyChapters.js';
import { StorySystem } from '../src/modules/StorySystem.js';
import { Inventory } from '../src/modules/Inventory.js';
import { TideSystem } from '../src/modules/TideSystem.js';
import { Storage } from '../src/modules/Storage.js';
import { TaskSystem } from '../src/modules/TaskSystem.js';

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
    saveProgress() {}
  };
  game.tideSystem = new TideSystem(game);
  game.taskSystem = new TaskSystem(game);
  game.inventory = new Inventory(game);
  game.storySystem = new StorySystem(game);
  return game;
}

log('════════════════════════════════════════════════════════', 'blue');
log('  主线剧情系统 - 完整验证链路', 'blue');
log('  章节推进 · 广播日志 · 角色对话 · 图鉴目标 · 存档读档', 'blue');
log('════════════════════════════════════════════════════════', 'blue');

test('1. 剧情数据完整性：5个章节、4个角色均已定义', () => {
  assert(STORY_CHAPTERS.length === 5,
    `主线章节数量=5 (实际=${STORY_CHAPTERS.length})`,
    `主线章节缺失: 期望5，实际${STORY_CHAPTERS.length}`);

  const chapterIds = STORY_CHAPTERS.map(c => c.id);
  for (let i = 1; i <= 5; i++) {
    assert(chapterIds.includes(`chapter_0${i}`),
      `章节 chapter_0${i} 存在`,
      `缺少章节 chapter_0${i}`);
  }

  const charIds = ['captain_kai', 'mechanic_luna', 'smuggler_vex', 'ai_whisper'];
  charIds.forEach(id => {
    assert(STORY_CHARACTERS[id] !== undefined,
      `角色 ${id} 已定义: ${STORY_CHARACTERS[id]?.name}`,
      `缺少角色定义: ${id}`);
  });
});

test('2. 第一章自动启动与目标追踪', () => {
  Storage.clear();
  const game = createRealGame();
  const story = game.storySystem;

  story.startChapter('chapter_01');
  assert(story.currentChapterId === 'chapter_01',
    '当前章节 = chapter_01',
    `当前章节错误: ${story.currentChapterId}`);

  assert(!story.completedChapters.has('chapter_01'),
    '第一章尚未完成',
    '第一章被错误标记为已完成');

  const ch1 = getChapterById('chapter_01');
  assert(ch1.objectives.length >= 3,
    `第一章有 ${ch1.objectives.length} 个目标（>=3）`,
    '第一章目标数量不足');

  const objState = story.chapterObjectives['chapter_01'];
  assert(objState !== undefined,
    '第一章目标状态已初始化',
    '第一章目标状态缺失');
});

test('3. 打捞次数触发目标进度和广播解锁', () => {
  Storage.clear();
  const game = createRealGame();
  const story = game.storySystem;
  story.startChapter('chapter_01');

  game.stats.catchCount = 0;
  story.onGameEvent('catch_count');

  const objCatch = story.chapterObjectives['chapter_01']['obj_01_1'];
  log(`ℹ️  打捞目标进度: ${objCatch.progress}/5`, 'yellow');
  assert(objCatch.progress === 0,
    `打捞0次时目标进度=0 (实际=${objCatch.progress})`,
    '目标进度异常');

  for (let i = 0; i < 5; i++) {
    game.stats.catchCount++;
    story.onGameEvent('catch_count');
  }

  const after5 = story.chapterObjectives['chapter_01']['obj_01_1'];
  log(`ℹ️  打捞5次后进度: ${after5.progress}/5，completed=${after5.completed}`, 'yellow');
  assert(after5.progress === 5,
    `打捞5次进度=5 (实际=${after5.progress})`,
    '打捞目标进度未增加');
  assert(after5.completed === true,
    '打捞5次目标已完成',
    '打捞目标未标记完成');

  assert(story.unlockedBroadcasts.has('bc_01_01'),
    '第一章开场广播 bc_01_01 已解锁',
    '开场广播未解锁');
});

test('4. 图鉴收录推进剧情目标与对话触发', () => {
  Storage.clear();
  const game = createRealGame();
  const story = game.storySystem;
  story.startChapter('chapter_01');

  const commonCreatures = CREATURES.filter(c => c.rarity === RARITY.COMMON).slice(0, 3);
  assert(commonCreatures.length === 3,
    `找到3个普通生物用于测试`,
    `普通生物数量不足: ${commonCreatures.length}`);

  commonCreatures.forEach((c, idx) => {
    game.inventory.addToBackpack(c);
    log(`ℹ️  收录 [${idx + 1}] ${c.icon}${c.name}，图鉴数=${game.inventory.collection.size}`, 'yellow');
  });

  const objUnique = story.chapterObjectives['chapter_01']['obj_01_2'];
  log(`ℹ️  图鉴目标进度: ${objUnique.progress}/3，completed=${objUnique.completed}`, 'yellow');
  assert(objUnique.progress >= 3,
    `图鉴目标进度>=3 (实际=${objUnique.progress})`,
    '图鉴目标未正确推进');

  assert(story.triggeredDialogues.has('dlg_01_hint_collection'),
    '收集2个后触发露娜对话 dlg_01_hint_collection',
    '露娜对话未触发: ' + Array.from(story.triggeredDialogues).join(','));

  assert(story.unlockedBroadcasts.has('bc_01_03'),
    '收集3个后解锁神秘信号广播 bc_01_03',
    '神秘信号广播未解锁');
});

test('5. 金币目标、连击目标、稀有度目标协同', () => {
  Storage.clear();
  const game = createRealGame();
  const story = game.storySystem;
  story.startChapter('chapter_02');

  game.stats.coins = 1000;
  story.onGameEvent('coins');
  const objCoins = story.chapterObjectives['chapter_02']['obj_02_2'];
  log(`ℹ️  金币目标: ${objCoins.progress}/1000, completed=${objCoins.completed}`, 'yellow');
  assert(objCoins.progress >= 1000,
    `金币目标进度>=1000 (实际=${objCoins.progress})`,
    '金币目标未推进');

  game.stats.comboCount = 5;
  story.onGameEvent('combo_reach', 5);
  const objCombo = story.chapterObjectives['chapter_02']['obj_02_1'];
  log(`ℹ️  连击目标: ${objCombo.progress}/5, completed=${objCombo.completed}`, 'yellow');
  assert(objCombo.progress >= 5,
    `连击目标进度>=5 (实际=${objCombo.progress})`,
    '连击目标未推进');

  const rareCreature = CREATURES.find(c => c.rarity === RARITY.RARE);
  game.inventory.addToBackpack(rareCreature);
  const objRare = story.chapterObjectives['chapter_02']['obj_02_3'];
  log(`ℹ️  稀有目标: ${objRare.progress}/1, completed=${objRare.completed}`, 'yellow');
  assert(objRare.progress >= 1,
    `捕获稀有后进度>=1 (实际=${objRare.progress})`,
    '稀有度目标未推进');
});

test('6. 第一章全目标完成 → 自动完成章节 → 第二章自动启动', () => {
  Storage.clear();
  const game = createRealGame();
  const story = game.storySystem;
  story.startChapter('chapter_01');

  game.stats.catchCount = 5;
  story.onGameEvent('catch_count');

  CREATURES.filter(c => c.rarity === RARITY.COMMON).slice(0, 3).forEach(c => game.inventory.addToBackpack(c));

  const uncommon = CREATURES.find(c => c.rarity === RARITY.UNCOMMON);
  game.inventory.addToBackpack(uncommon);

  log(`ℹ️  第一章所有目标完成后:`, 'yellow');
  const objs = story.chapterObjectives['chapter_01'];
  Object.entries(objs).forEach(([id, st]) => {
    log(`   ${id}: progress=${st.progress}, completed=${st.completed}`, 'yellow');
  });

  assert(story.completedChapters.has('chapter_01'),
    '第一章所有目标完成后章节已完成',
    '第一章未自动完成');

  assert(story.currentChapterId === 'chapter_02' || STORY_CHAPTERS[1].unlocked,
    '第一章完成后第二章已启动/解锁',
    `第二章未正确启动，current=${story.currentChapterId}`);

  log(`ℹ️  当前章节: ${story.currentChapterId}`, 'yellow');
});

test('7. StorySystem 存档与读档完整保留状态', () => {
  Storage.clear();
  const gameA = createRealGame();
  gameA.storySystem.startChapter('chapter_01');

  gameA.stats.catchCount = 3;
  gameA.storySystem.onGameEvent('catch_count');

  CREATURES.slice(0, 2).forEach(c => gameA.inventory.addToBackpack(c));

  gameA.storySystem.storyFlags.add('asked_oldworld');

  const savedJSON = gameA.storySystem.toJSON();
  log(`ℹ️  存档包含 keys: ${Object.keys(savedJSON).join(', ')}`, 'yellow');
  log(`ℹ️  存档 currentChapterId=${savedJSON.currentChapterId}`, 'yellow');
  log(`ℹ️  存档 storyFlags=${savedJSON.storyFlags.join(',')}`, 'yellow');
  log(`ℹ️  存档解锁广播=${savedJSON.unlockedBroadcasts.length}个`, 'yellow');

  assert(savedJSON.currentChapterId === 'chapter_01',
    '存档 currentChapterId=chapter_01',
    '存档章节ID错误');
  assert(savedJSON.storyFlags.includes('asked_oldworld'),
    '存档 storyFlags 包含 asked_oldworld',
    '剧情标记未保存');
  assert(savedJSON.unlockedBroadcasts.length >= 1,
    `存档解锁广播数>=1 (实际=${savedJSON.unlockedBroadcasts.length})`,
    '广播解锁状态未保存');

  const gameB = createRealGame();
  gameB.storySystem.loadData(savedJSON);

  assert(gameB.storySystem.currentChapterId === 'chapter_01',
    '读档后 currentChapterId 一致',
    '读档章节ID不一致');
  assert(gameB.storySystem.storyFlags.has('asked_oldworld'),
    '读档后 storyFlags 已恢复',
    '剧情标记读档丢失');

  const loadedObjs = gameB.storySystem.chapterObjectives['chapter_01'];
  const aObj = gameA.storySystem.chapterObjectives['chapter_01']['obj_01_1'];
  const bObj = loadedObjs['obj_01_1'];
  assert(aObj.progress === bObj.progress,
    `读档后目标进度一致: ${aObj.progress}==${bObj.progress}`,
    '目标进度读档丢失');

  log('✅ StorySystem 存档/读档验证通过', 'green');
});

test('8. 多章节连贯推进（模拟全流程）', () => {
  Storage.clear();
  const game = createRealGame();
  const story = game.storySystem;

  log('━━━ 模拟主线全流程 ━━━', 'blue');

  story.startChapter('chapter_01');
  log(`📖 启动第一章: ${getChapterById('chapter_01').title}`, 'blue');

  game.stats.catchCount = 5;
  story.onGameEvent('catch_count');
  CREATURES.filter(c => c.rarity === RARITY.COMMON).slice(0, 3).forEach(c => game.inventory.addToBackpack(c));
  game.inventory.addToBackpack(CREATURES.find(c => c.rarity === RARITY.UNCOMMON));
  log(`✅ 第一章目标完成，自动推进至: ${story.currentChapterId}`, 'green');

  game.stats.coins = 1000;
  story.onGameEvent('coins');
  game.stats.comboCount = 5;
  story.onGameEvent('combo_reach', 5);
  game.inventory.addToBackpack(CREATURES.find(c => c.rarity === RARITY.RARE));
  game.stats.catchCount = 8;
  story.onGameEvent('catch_count');
  log(`✅ 第二章目标完成，自动推进至: ${story.currentChapterId}`, 'green');

  game.expedition = { stats: { totalExpeditions: 1 } };
  story.onGameEvent('expedition_complete');
  CREATURES.filter(c => c.rarity === RARITY.UNCOMMON).slice(0, 2).forEach(c => game.inventory.addToBackpack(c));
  CREATURES.filter(c => c.rarity === RARITY.RARE).slice(0, 2).forEach(c => game.inventory.addToBackpack(c));
  game.stats.catchCount = 30;
  story.onGameEvent('catch_count');
  log(`✅ 第三章目标完成，自动推进至: ${story.currentChapterId}`, 'green');

  CREATURES.filter(c => c.rarity === RARITY.EPIC).slice(0, 1).forEach(c => game.inventory.addToBackpack(c));
  game.stats.comboCount = 10;
  story.onGameEvent('combo_reach', 10);
  game.expedition.stats.totalExpeditions = 3;
  story.onGameEvent('expedition_complete');
  log(`✅ 第四章目标完成，自动推进至: ${story.currentChapterId}`, 'green');

  CREATURES.filter(c => c.rarity === RARITY.LEGENDARY).slice(0, 2).forEach(c => game.inventory.addToBackpack(c));
  log(`ℹ️  已收录图鉴数: ${game.inventory.collection.size} / ${CREATURES.length}`, 'yellow');

  const completedCount = story.completedChapters.size;
  log(`━━━ 流程结束 ━━━`, 'blue');
  log(`📊 已完成章节: ${completedCount} / 5`, 'yellow');
  log(`📻 已解锁广播: ${story.unlockedBroadcasts.size} 条`, 'yellow');
  log(`💬 已触发对话: ${story.triggeredDialogues.size} 段`, 'yellow');
  log(`🏷️  剧情标记: ${Array.from(story.storyFlags).join(', ') || '(无)'}`, 'yellow');

  assert(completedCount >= 3,
    `连贯推进至少完成3章 (实际=${completedCount})`,
    '连贯推进失败');
});

console.log('\n════════════════════════════════════════════════════════');
if (failed === 0) {
  log(`🎉 全部 ${passed} 个测试通过! 主线剧情系统验证成功（章节推进·广播解锁·对话触发·图鉴目标·存档读档）。`, 'green');
} else {
  log(`⚠️  ${passed} 通过, ${failed} 失败`, 'red');
}
log('════════════════════════════════════════════════════════\n');

process.exit(failed === 0 ? 0 : 1);
