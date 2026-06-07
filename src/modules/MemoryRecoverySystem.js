import { Storage } from './Storage.js';
import {
  MEMORY_CHAPTERS,
  MEMORY_RARITY,
  getMemoryChapterById,
  getMemoryRarityByCatchCount,
  getMemoryRarityByName,
  getFragmentQuote,
  getChapterForCreature,
  getNextMemoryChapter
} from '../data/memoryFragments.js';
import { CREATURES } from '../data/creatures.js';

export class MemoryRecoverySystem {
  constructor(game) {
    this.game = game;

    this.collectedFragments = {};
    this.unlockedClues = new Set();
    this.completedChapters = new Set();
    this.solvedPuzzles = new Set();
    this.claimedRewards = new Set();
    this.unlockedCodex = new Set();
    this.fragmentInventory = [];

    this.memoryLog = [];
    this.stats = {
      totalFragmentsCollected: 0,
      totalCluesUnlocked: 0,
      totalChaptersCompleted: 0,
      totalPuzzlesSolved: 0,
      totalCodexUnlocked: 0,
      totalCoinsEarned: 0,
      totalEnergyEarned: 0
    };

    this.modal = null;
    this.currentTab = 'chapters';
    this.selectedChapterId = null;
    this.pendingFragment = null;

    this.initElements();
    this.bindStaticEvents();
  }

  initElements() {
    this.modal = document.getElementById('memory-modal');
  }

  bindStaticEvents() {
    const btn = document.getElementById('btn-memory');
    if (btn) {
      btn.addEventListener('click', () => this.open());
    }
    const closeBtn = document.getElementById('btn-close-memory');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  bindDynamicEvents() {
    const tabBtns = document.querySelectorAll('[data-memory-tab]');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.memoryTab;
        this.switchTab(tab);
      });
    });

    const chapterCards = document.querySelectorAll('[data-memory-chapter]');
    chapterCards.forEach(card => {
      card.addEventListener('click', () => {
        const chapterId = card.dataset.memoryChapter;
        this.selectChapter(chapterId);
      });
    });

    const claimBtns = document.querySelectorAll('[data-memory-reward-claim]');
    claimBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const chapterId = btn.dataset.memoryRewardClaim;
        this.claimChapterReward(chapterId);
      });
    });

    const puzzleSubmitBtns = document.querySelectorAll('[data-memory-puzzle-submit]');
    puzzleSubmitBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const chapterId = btn.dataset.memoryPuzzleSubmit;
        this.submitPuzzleAnswer(chapterId);
      });
    });

    const fragmentViewBtns = document.querySelectorAll('[data-fragment-view]');
    fragmentViewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const fragmentId = btn.dataset.fragmentView;
        this.viewFragmentDetail(fragmentId);
      });
    });
  }

  open(tabName = 'chapters') {
    if (!this.modal) return;
    this.checkChapterUnlocks();
    this.modal.classList.remove('hidden');
    this.game.checkTasks('memory_open');
    this.switchTab(tabName);
    this.renderAll();
    this.bindDynamicEvents();
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    const tabBtns = document.querySelectorAll('[data-memory-tab]');
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.memoryTab === tabName);
    });

    const contents = document.querySelectorAll('[data-memory-tab-content]');
    contents.forEach(content => {
      content.classList.toggle('hidden', content.dataset.memoryTabContent !== tabName);
    });

    this.renderAll();
  }

  selectChapter(chapterId) {
    this.selectedChapterId = chapterId;
    this.renderAll();
    this.bindDynamicEvents();
  }

  onCreatureCaught(creature, cumulativeCount) {
    const chapter = getChapterForCreature(creature.id);
    if (!chapter) return null;

    const chapterFragments = this.collectedFragments[chapter.id] || 0;
    const totalForCreature = cumulativeCount;
    const memoryRarity = getMemoryRarityByCatchCount(totalForCreature);

    const fragmentId = `frag_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const fragmentQuote = getFragmentQuote(creature.id);

    const fragment = {
      id: fragmentId,
      creatureId: creature.id,
      creatureName: creature.name,
      creatureIcon: creature.icon,
      creatureRarity: creature.rarity,
      memoryRarity: memoryRarity,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      content: fragmentQuote,
      collectedAt: Date.now(),
      isNew: chapterFragments === 0
    };

    this.fragmentInventory.unshift(fragment);
    if (this.fragmentInventory.length > 200) {
      this.fragmentInventory = this.fragmentInventory.slice(0, 200);
    }

    this.collectedFragments[chapter.id] = chapterFragments + 1;
    this.stats.totalFragmentsCollected++;

    this.addLog('fragment', `📜 从${creature.name}读取到${memoryRarity.name}：「${fragmentQuote.substring(0, 20)}...」`);

    const unlockedClues = this.checkClueUnlocks(chapter);
    const chapterCompleted = this.checkChapterCompletion(chapter);

    if (this.game.taskSystem) {
      this.game.taskSystem.checkTasks('memory_fragment', this.stats.totalFragmentsCollected);
      if (unlockedClues.length > 0) {
        this.game.taskSystem.showHint(`🔍 解锁新线索：${unlockedClues[0].text.substring(0, 20)}...`);
        this.game.taskSystem.checkTasks('memory_clue', this.stats.totalCluesUnlocked);
      }
      if (chapterCompleted) {
        this.game.taskSystem.showHint(`🧩 记忆章节「${chapter.title}」线索全部收集！尝试解谜吧！`);
      }
    }

    if (this.game.storySystem) {
      this.game.storySystem.onGameEvent('memory_fragment', fragment);
    }

    this.game.saveProgress();

    return { fragment, unlockedClues, chapterCompleted };
  }

  checkClueUnlocks(chapter) {
    const unlocked = [];
    const fragmentCount = this.collectedFragments[chapter.id] || 0;

    chapter.clues.forEach(clue => {
      const clueKey = `${chapter.id}_${clue.id}`;
      if (!this.unlockedClues.has(clueKey) && fragmentCount >= clue.requiredFragments) {
        this.unlockedClues.add(clueKey);
        this.stats.totalCluesUnlocked++;
        unlocked.push(clue);
        this.addLog('clue', `🔍 解锁线索：${clue.text}`);
      }
    });

    return unlocked;
  }

  checkChapterCompletion(chapter) {
    const allCluesUnlocked = chapter.clues.every(clue =>
      this.unlockedClues.has(`${chapter.id}_${clue.id}`)
    );

    if (allCluesUnlocked && !this.completedChapters.has(chapter.id)) {
      this.completedChapters.add(chapter.id);
      this.stats.totalChaptersCompleted++;
      this.addLog('chapter', `📖 章节「${chapter.title}」线索收集完成！`);

      const nextChapter = MEMORY_CHAPTERS.find(c => c.index === chapter.index + 1);
      if (nextChapter) {
        nextChapter.unlocked = true;
        this.addLog('unlock', `🔓 解锁新记忆章节：${nextChapter.title}`);
        if (this.game.taskSystem) {
          this.game.taskSystem.showHint(`🔓 新记忆章节解锁：${nextChapter.icon} ${nextChapter.title}`);
        }
      }

      this.game.taskSystem?.checkTasks('memory_chapter', this.stats.totalChaptersCompleted);
      return true;
    }
    return false;
  }

  checkChapterUnlocks() {
    MEMORY_CHAPTERS.forEach(chapter => {
      if (chapter.unlocked) return;
      const prevChapter = MEMORY_CHAPTERS.find(c => c.index === chapter.index - 1);
      if (prevChapter && this.completedChapters.has(prevChapter.id)) {
        chapter.unlocked = true;
      }
    });
  }

  submitPuzzleAnswer(chapterId) {
    const chapter = getMemoryChapterById(chapterId);
    if (!chapter) return false;
    if (this.solvedPuzzles.has(chapterId)) return false;

    const inputEl = document.querySelector(`[data-memory-puzzle-input="${chapterId}"]`);
    if (!inputEl) return false;

    const userAnswer = inputEl.value.trim();
    const isCorrect = userAnswer === chapter.puzzle.answer;

    if (isCorrect) {
      this.solvedPuzzles.add(chapterId);
      this.stats.totalPuzzlesSolved++;
      this.addLog('puzzle', `🧩 解谜成功：${chapter.title}`);

      if (chapter.codexReward) {
        this.unlockedCodex.add(chapter.codexReward.id);
        this.stats.totalCodexUnlocked++;
      }

      if (this.game.taskSystem) {
        this.game.taskSystem.showHint(`🎉 解谜成功！章节「${chapter.title}」档案已解锁！`);
        this.game.taskSystem.checkTasks('memory_puzzle', this.stats.totalPuzzlesSolved);
        this.game.taskSystem.checkTasks('memory_codex', this.stats.totalCodexUnlocked);
      }

      this.game.saveProgress();
      this.renderAll();
      this.bindDynamicEvents();
      return true;
    } else {
      if (this.game.taskSystem) {
        this.game.taskSystem.showHint(`❌ 答案不对...再想想？提示：${chapter.puzzle.hint}`);
      }
      return false;
    }
  }

  claimChapterReward(chapterId) {
    const chapter = getMemoryChapterById(chapterId);
    if (!chapter) return false;
    if (this.claimedRewards.has(chapterId)) return false;
    if (!this.solvedPuzzles.has(chapterId)) return false;

    this.claimedRewards.add(chapterId);

    if (chapter.reward?.coins) {
      this.game.updateStats('coins', chapter.reward.coins);
      this.stats.totalCoinsEarned += chapter.reward.coins;
    }
    if (chapter.reward?.energy) {
      this.game.updateStats('energy', chapter.reward.energy);
      this.stats.totalEnergyEarned += chapter.reward.energy;
    }

    this.addLog('reward', `🎁 领取奖励：${chapter.title} · 💰${chapter.reward?.coins || 0} ⚡${chapter.reward?.energy || 0}`);

    if (this.game.taskSystem) {
      this.game.taskSystem.showHint(
        `🎁 领取奖励：${chapter.title} · 💰${chapter.reward?.coins || 0} ⚡${chapter.reward?.energy || 0}`
      );
    }

    this.game.saveProgress();
    this.renderAll();
    this.bindDynamicEvents();
    return true;
  }

  viewFragmentDetail(fragmentId) {
    const fragment = this.fragmentInventory.find(f => f.id === fragmentId);
    if (!fragment) return;

    if (this.game.taskSystem) {
      this.game.taskSystem.showHint(`📜 ${fragment.memoryRarity.name}：「${fragment.content}」`);
    }
  }

  addLog(type, message) {
    const time = new Date().toLocaleTimeString();
    this.memoryLog.unshift({ type, message, time });
    if (this.memoryLog.length > 100) {
      this.memoryLog.pop();
    }
  }

  getChapterProgress(chapter) {
    const fragmentCount = this.collectedFragments[chapter.id] || 0;
    const totalClues = chapter.clues.length;
    const unlockedClues = chapter.clues.filter(c =>
      this.unlockedClues.has(`${chapter.id}_${c.id}`)
    ).length;
    const isSolved = this.solvedPuzzles.has(chapter.id);
    const isRewardClaimed = this.claimedRewards.has(chapter.id);
    const isCompleted = this.completedChapters.has(chapter.id);

    const totalRequiredFragments = Math.max(...chapter.clues.map(c => c.requiredFragments));
    const fragmentProgress = Math.min(100, (fragmentCount / totalRequiredFragments) * 100);

    return {
      fragmentCount,
      totalRequiredFragments,
      fragmentProgress,
      unlockedClues,
      totalClues,
      clueProgress: totalClues ? (unlockedClues / totalClues) * 100 : 0,
      isCompleted,
      isSolved,
      isRewardClaimed
    };
  }

  renderAll() {
    this.renderChapters();
    this.renderChapterDetail();
    this.renderFragments();
    this.renderCodex();
    this.renderStats();
    this.renderLog();
  }

  renderChapters() {
    const el = document.getElementById('memory-chapter-list');
    if (!el) return;

    this.checkChapterUnlocks();

    el.innerHTML = MEMORY_CHAPTERS.map(chapter => {
      const progress = this.getChapterProgress(chapter);
      const isLocked = !chapter.unlocked;
      const isSelected = this.selectedChapterId === chapter.id;
      const hexColor = '#' + chapter.color.toString(16).padStart(6, '0');

      let statusIcon = '📖';
      let statusText = '进行中';
      if (isLocked) { statusIcon = '🔒'; statusText = '未解锁'; }
      else if (progress.isRewardClaimed) { statusIcon = '🏆'; statusText = '已完成'; }
      else if (progress.isSolved) { statusIcon = '✅'; statusText = '待领取'; }
      else if (progress.isCompleted) { statusIcon = '🧩'; statusText = '可解谜'; }

      return `
        <div class="memory-chapter-card ${isLocked ? 'locked' : ''} ${isSelected ? 'active' : ''} ${progress.isRewardClaimed ? 'completed' : ''}"
             data-memory-chapter="${chapter.id}"
             style="border-color: ${isLocked ? '#333' : hexColor};">
          <div class="memory-chapter-header">
            <span class="memory-chapter-icon" style="color: ${isLocked ? '#666' : hexColor};">${chapter.icon}</span>
            <div class="memory-chapter-info">
              <div class="memory-chapter-title" style="color: ${isLocked ? '#666' : hexColor};">
                ${isLocked ? '??? 未知章节' : chapter.title}
              </div>
              <div class="memory-chapter-subtitle">${isLocked ? '完成前一章节解锁' : chapter.subtitle}</div>
            </div>
            <span class="memory-chapter-status">${statusIcon} ${statusText}</span>
          </div>
          ${!isLocked ? `
            <div class="memory-chapter-progress">
              <div class="memory-progress-bar">
                <div class="memory-progress-fill" style="width: ${progress.clueProgress}%; background: ${hexColor};"></div>
              </div>
              <div class="memory-progress-text">
                线索 ${progress.unlockedClues}/${progress.totalClues} · 碎片 ${progress.fragmentCount}/${progress.totalRequiredFragments}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  renderChapterDetail() {
    const el = document.getElementById('memory-chapter-detail');
    if (!el) return;

    if (!this.selectedChapterId) {
      el.innerHTML = `
        <div class="memory-empty-state">
          <div style="font-size: 48px;">📖</div>
          <p>从左侧选择一个记忆章节</p>
          <p class="memory-empty-sub">捕获残骸读取记忆碎片，收集线索解锁章节</p>
        </div>
      `;
      return;
    }

    const chapter = getMemoryChapterById(this.selectedChapterId);
    if (!chapter) return;

    const progress = this.getChapterProgress(chapter);
    const hexColor = '#' + chapter.color.toString(16).padStart(6, '0');

    let cluesHtml = chapter.clues.map(clue => {
      const isUnlocked = this.unlockedClues.has(`${chapter.id}_${clue.id}`);
      return `
        <div class="memory-clue-item ${isUnlocked ? 'unlocked' : 'locked'}">
          <span class="memory-clue-icon">${isUnlocked ? '🔍' : '🔒'}</span>
          <div class="memory-clue-content">
            ${isUnlocked ? clue.text : `需要收集 ${clue.requiredFragments} 个碎片解锁 (当前 ${progress.fragmentCount})`}
          </div>
        </div>
      `;
    }).join('');

    let puzzleHtml = '';
    if (progress.isCompleted) {
      if (progress.isSolved) {
        puzzleHtml = `
          <div class="memory-puzzle-section solved">
            <div class="memory-section-title">🧩 章节解谜</div>
            <div class="memory-puzzle-question"><strong>Q:</strong> ${chapter.puzzle.question}</div>
            <div class="memory-puzzle-answer success"><strong>A:</strong> ${chapter.puzzle.answer}</div>
            <div class="memory-puzzle-status">✅ 已解谜！</div>
          </div>
        `;
      } else {
        puzzleHtml = `
          <div class="memory-puzzle-section">
            <div class="memory-section-title">🧩 章节解谜</div>
            <div class="memory-puzzle-question"><strong>Q:</strong> ${chapter.puzzle.question}</div>
            <div class="memory-puzzle-hint">💡 提示：${chapter.puzzle.hint}</div>
            <div class="memory-puzzle-input-row">
              <input type="text" class="memory-puzzle-input" 
                     data-memory-puzzle-input="${chapter.id}" 
                     placeholder="输入你的答案...">
              <button class="modal-btn primary" data-memory-puzzle-submit="${chapter.id}">提交答案</button>
            </div>
          </div>
        `;
      }
    }

    let rewardHtml = '';
    if (progress.isSolved) {
      if (progress.isRewardClaimed) {
        rewardHtml = `
          <div class="memory-reward-section claimed">
            <div class="memory-section-title">🎁 章节奖励</div>
            <div class="memory-reward-items">
              ${chapter.reward?.coins ? `<span class="memory-reward-item">💰 ${chapter.reward.coins}</span>` : ''}
              ${chapter.reward?.energy ? `<span class="memory-reward-item">⚡ ${chapter.reward.energy}</span>` : ''}
            </div>
            <div class="memory-reward-status">✅ 奖励已领取</div>
          </div>
        `;
      } else {
        rewardHtml = `
          <div class="memory-reward-section available">
            <div class="memory-section-title">🎁 章节奖励</div>
            <div class="memory-reward-items">
              ${chapter.reward?.coins ? `<span class="memory-reward-item">💰 ${chapter.reward.coins}</span>` : ''}
              ${chapter.reward?.energy ? `<span class="memory-reward-item">⚡ ${chapter.reward.energy}</span>` : ''}
            </div>
            <button class="modal-btn accent full-width" data-memory-reward-claim="${chapter.id}">🎁 领取奖励</button>
          </div>
        `;
      }
    }

    let codexHtml = '';
    if (progress.isSolved && chapter.codexReward) {
      codexHtml = `
        <div class="memory-codex-section">
          <div class="memory-section-title">📚 章节档案</div>
          <div class="memory-codex-card" style="border-color: ${hexColor};">
            <div class="memory-codex-title" style="color: ${hexColor};">${chapter.codexReward.title}</div>
            <div class="memory-codex-content">${chapter.codexReward.content}</div>
          </div>
        </div>
      `;
    }

    const relatedCreatures = chapter.requiredCreatures.map(id => {
      const creature = CREATURES.find(c => c.id === id);
      const count = this.game.inventory?.getCumulativeCreatureCount(id) || 0;
      return creature ? `
        <div class="memory-creature-tag">
          <span>${creature.icon}</span>
          <span>${creature.name}</span>
          <span class="memory-creature-count">×${count}</span>
        </div>
      ` : '';
    }).join('');

    el.innerHTML = `
      <div class="memory-detail-header" style="border-color: ${hexColor};">
        <span class="memory-detail-icon">${chapter.icon}</span>
        <div>
          <h3 class="memory-detail-title" style="color: ${hexColor};">${chapter.title}</h3>
          <div class="memory-detail-subtitle">${chapter.subtitle}</div>
        </div>
      </div>

      <div class="memory-detail-desc">${chapter.desc}</div>

      ${relatedCreatures ? `
        <div class="memory-section-title">🎯 相关残骸（捕获读取记忆）</div>
        <div class="memory-creature-tags">${relatedCreatures}</div>
      ` : ''}

      <div class="memory-section-title">📜 线索收集 (${progress.unlockedClues}/${progress.totalClues})</div>
      <div class="memory-clue-list">${cluesHtml}</div>

      ${puzzleHtml}
      ${rewardHtml}
      ${codexHtml}
    `;
  }

  renderFragments() {
    const el = document.getElementById('memory-fragments');
    if (!el) return;

    if (this.fragmentInventory.length === 0) {
      el.innerHTML = `
        <div class="memory-empty-state">
          <div style="font-size: 48px;">📜</div>
          <p>还没有收集到任何记忆碎片</p>
          <p class="memory-empty-sub">去打捞残骸吧，每个残骸都可能藏着旧世界的记忆</p>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="memory-fragment-list">
        ${this.fragmentInventory.slice(0, 50).map(fragment => {
          const rarityClass = fragment.memoryRarity.class;
          const hexColor = '#' + fragment.memoryRarity.color.toString(16).padStart(6, '0');
          return `
            <div class="memory-fragment-card ${rarityClass}" data-fragment-view="${fragment.id}">
              <div class="memory-fragment-header">
                <span class="memory-fragment-icon">${fragment.creatureIcon}</span>
                <div class="memory-fragment-info">
                  <div class="memory-fragment-source">${fragment.creatureName}</div>
                  <div class="memory-fragment-rarity" style="color: ${hexColor};">${fragment.memoryRarity.name}</div>
                </div>
              </div>
              <div class="memory-fragment-content">「${fragment.content}」</div>
              <div class="memory-fragment-time">${new Date(fragment.collectedAt).toLocaleString()}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderCodex() {
    const el = document.getElementById('memory-codex');
    if (!el) return;

    const unlockedChapters = MEMORY_CHAPTERS.filter(ch => this.solvedPuzzles.has(ch.id));

    if (unlockedChapters.length === 0) {
      el.innerHTML = `
        <div class="memory-empty-state">
          <div style="font-size: 48px;">📚</div>
          <p>还没有解锁任何章节档案</p>
          <p class="memory-empty-sub">收集线索，完成解谜，解锁旧世界的秘密档案</p>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="memory-codex-list">
        ${unlockedChapters.map(chapter => {
          if (!chapter.codexReward) return '';
          const hexColor = '#' + chapter.color.toString(16).padStart(6, '0');
          return `
            <div class="memory-codex-card full" style="border-color: ${hexColor};">
              <div class="memory-codex-header" style="border-color: ${hexColor};">
                <span>${chapter.icon}</span>
                <div class="memory-codex-title" style="color: ${hexColor};">${chapter.codexReward.title}</div>
              </div>
              <div class="memory-codex-content">${chapter.codexReward.content}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderStats() {
    const el = document.getElementById('memory-stats');
    if (!el) return;

    const totalChapters = MEMORY_CHAPTERS.length;
    const totalPossibleClues = MEMORY_CHAPTERS.reduce((sum, ch) => sum + ch.clues.length, 0);

    el.innerHTML = `
      <div class="memory-stats-grid">
        <div class="memory-stat-card">
          <div class="memory-stat-icon">📜</div>
          <div class="memory-stat-value">${this.stats.totalFragmentsCollected}</div>
          <div class="memory-stat-label">记忆碎片</div>
        </div>
        <div class="memory-stat-card">
          <div class="memory-stat-icon">🔍</div>
          <div class="memory-stat-value">${this.stats.totalCluesUnlocked}/${totalPossibleClues}</div>
          <div class="memory-stat-label">解锁线索</div>
        </div>
        <div class="memory-stat-card">
          <div class="memory-stat-icon">🧩</div>
          <div class="memory-stat-value">${this.stats.totalPuzzlesSolved}/${totalChapters}</div>
          <div class="memory-stat-label">解谜完成</div>
        </div>
        <div class="memory-stat-card">
          <div class="memory-stat-icon">📚</div>
          <div class="memory-stat-value">${this.stats.totalCodexUnlocked}</div>
          <div class="memory-stat-label">档案解锁</div>
        </div>
        <div class="memory-stat-card">
          <div class="memory-stat-icon">💰</div>
          <div class="memory-stat-value">${this.stats.totalCoinsEarned}</div>
          <div class="memory-stat-label">累计金币</div>
        </div>
        <div class="memory-stat-card">
          <div class="memory-stat-icon">⚡</div>
          <div class="memory-stat-value">${this.stats.totalEnergyEarned}</div>
          <div class="memory-stat-label">累计能量</div>
        </div>
      </div>
    `;
  }

  renderLog() {
    const el = document.getElementById('memory-log');
    if (!el) return;

    el.innerHTML = `
      <div class="memory-log-content">
        ${this.memoryLog.length > 0 ?
          this.memoryLog.slice(-30).reverse().map(log => `
            <div class="log-entry ${log.type || ''}">
              <span class="log-time">[${log.time}]</span>
              <span class="log-text">${log.message}</span>
            </div>
          `).join('') :
          '<div style="color:#666;text-align:center;padding:10px;">暂无记忆记录，快去打捞残骸吧！</div>'
        }
      </div>
    `;
  }

  toJSON() {
    return {
      collectedFragments: { ...this.collectedFragments },
      unlockedClues: Array.from(this.unlockedClues),
      completedChapters: Array.from(this.completedChapters),
      solvedPuzzles: Array.from(this.solvedPuzzles),
      claimedRewards: Array.from(this.claimedRewards),
      unlockedCodex: Array.from(this.unlockedCodex),
      fragmentInventory: [...this.fragmentInventory],
      memoryLog: this.memoryLog,
      stats: { ...this.stats }
    };
  }

  loadData(data) {
    if (!data) return;

    if (data.collectedFragments) {
      this.collectedFragments = { ...data.collectedFragments };
    }
    if (data.unlockedClues) {
      this.unlockedClues = new Set(data.unlockedClues);
    }
    if (data.completedChapters) {
      this.completedChapters = new Set(data.completedChapters);
    }
    if (data.solvedPuzzles) {
      this.solvedPuzzles = new Set(data.solvedPuzzles);
    }
    if (data.claimedRewards) {
      this.claimedRewards = new Set(data.claimedRewards);
    }
    if (data.unlockedCodex) {
      this.unlockedCodex = new Set(data.unlockedCodex);
    }
    if (data.fragmentInventory) {
      this.fragmentInventory = [...data.fragmentInventory];
    }
    if (data.memoryLog) {
      this.memoryLog = data.memoryLog;
    }
    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }

    MEMORY_CHAPTERS.forEach(chapter => {
      chapter.unlocked = chapter.index === 1 ||
        this.completedChapters.has(chapter.id) ||
        MEMORY_CHAPTERS.some(prev =>
          prev.index === chapter.index - 1 && this.completedChapters.has(prev.id)
        );
    });
  }
}
