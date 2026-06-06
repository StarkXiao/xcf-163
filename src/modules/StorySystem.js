import {
  STORY_CHAPTERS,
  STORY_CHARACTERS,
  BROADCAST_UNLOCK_MAP,
  DIALOGUE_TRIGGER_MAP,
  getChapterById,
  getCharacterById,
  getRarityByName
} from '../data/storyChapters.js';
import { CREATURES, RARITY } from '../data/creatures.js';

export class StorySystem {
  constructor(game) {
    this.game = game;

    this.currentChapterId = STORY_CHAPTERS[0]?.id || null;
    this.completedChapters = new Set();
    this.storyFlags = new Set();
    this.triggeredDialogues = new Set();
    this.unlockedBroadcasts = new Set();
    this.shownBroadcasts = new Set();
    this.pendingDialogueQueue = [];
    this.activeDialogue = null;
    this.activeDialogueLineIdx = 0;
    this.chapterObjectives = {};

    this.initUIReferences();
    this.initChapterObjectives();
    this.bindEvents();
  }

  initUIReferences() {
    this.storyButton = document.getElementById('btn-story');
    this.storyModal = document.getElementById('story-modal');
    this.storyCloseBtn = document.getElementById('btn-close-story');
    this.storyTabBtns = document.querySelectorAll('[data-story-tab]');
    this.storyTabContents = document.querySelectorAll('[data-story-tab-content]');

    this.chapterListEl = document.getElementById('story-chapter-list');
    this.chapterDetailEl = document.getElementById('story-chapter-detail');
    this.broadcastListEl = document.getElementById('story-broadcast-list');
    this.dialogueModal = document.getElementById('dialogue-modal');
    this.dialogueSpeakerEl = document.getElementById('dialogue-speaker');
    this.dialogueIconEl = document.getElementById('dialogue-icon');
    this.dialogueTextEl = document.getElementById('dialogue-text');
    this.dialogueChoicesEl = document.getElementById('dialogue-choices');
    this.dialogueNextBtn = document.getElementById('dialogue-next-btn');
    this.dialogueCloseBtn = document.getElementById('dialogue-close-btn');

    this.newBroadcastIndicator = document.getElementById('new-broadcast-indicator');
    this.newStoryIndicator = document.getElementById('new-story-indicator');
  }

  initChapterObjectives() {
    STORY_CHAPTERS.forEach(chapter => {
      this.chapterObjectives[chapter.id] = {};
      chapter.objectives.forEach(obj => {
        this.chapterObjectives[chapter.id][obj.id] = {
          progress: 0,
          completed: false,
          claimed: false
        };
      });
    });
  }

  bindEvents() {
    if (this.storyButton) {
      this.storyButton.addEventListener('click', () => this.openStoryPanel());
    }
    if (this.storyCloseBtn) {
      this.storyCloseBtn.addEventListener('click', () => this.closeStoryPanel());
    }
    if (this.storyTabBtns) {
      this.storyTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.storyTab;
          this.switchTab(tab);
        });
      });
    }
    if (this.dialogueNextBtn) {
      this.dialogueNextBtn.addEventListener('click', () => this.advanceDialogue());
    }
    if (this.dialogueCloseBtn) {
      this.dialogueCloseBtn.addEventListener('click', () => this.closeDialogue());
    }
  }

  switchTab(tabName) {
    this.storyTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.storyTab === tabName);
    });
    this.storyTabContents.forEach(content => {
      content.classList.toggle('hidden', content.dataset.storyTabContent !== tabName);
    });

    if (tabName === 'chapters') {
      this.renderChapterList();
    } else if (tabName === 'broadcasts') {
      this.renderBroadcastList();
    }
  }

  openStoryPanel(tabName = 'chapters') {
    if (this.storyModal) {
      this.storyModal.classList.remove('hidden');
    }
    this.switchTab(tabName);
    this.clearNewIndicator();
  }

  closeStoryPanel() {
    if (this.storyModal) {
      this.storyModal.classList.add('hidden');
    }
  }

  clearNewIndicator() {
    if (this.newBroadcastIndicator) this.newBroadcastIndicator.classList.add('hidden');
    if (this.newStoryIndicator) this.newStoryIndicator.classList.add('hidden');
  }

  notify(type = 'both') {
    if (type === 'broadcast' || type === 'both') {
      if (this.newBroadcastIndicator) this.newBroadcastIndicator.classList.remove('hidden');
    }
    if (type === 'story' || type === 'both') {
      if (this.newStoryIndicator) this.newStoryIndicator.classList.remove('hidden');
    }
  }

  startChapter(chapterId) {
    const chapter = getChapterById(chapterId);
    if (!chapter) return false;
    if (this.completedChapters.has(chapterId)) return false;

    this.currentChapterId = chapterId;
    chapter.unlocked = true;

    this.unlockBroadcastsForChapter(chapter, 'chapter_start');
    this.tryTriggerDialogue(chapter, 'chapter_start');

    if (this.game.taskSystem) {
      this.game.taskSystem.showHint(`${chapter.icon} ${chapter.title} 开始！`);
    }

    this.notify('story');
    this.save();
    return true;
  }

  completeChapter(chapterId) {
    const chapter = getChapterById(chapterId);
    if (!chapter) return false;
    if (this.completedChapters.has(chapterId)) return false;

    this.completedChapters.add(chapterId);

    if (chapter.reward) {
      if (chapter.reward.coins) this.game.updateStats('coins', chapter.reward.coins);
      if (chapter.reward.energy) this.game.updateStats('energy', chapter.reward.energy);
    }

    if (chapter.ending) {
      this.pushDialogueToQueue({
        id: `ending_${chapterId}`,
        speaker: chapter.ending.speaker,
        lines: chapter.ending.lines,
        choices: null,
        isEnding: true
      });
    }

    const nextChapter = STORY_CHAPTERS.find(c => c.index === chapter.index + 1);
    if (nextChapter) {
      setTimeout(() => {
        this.startChapter(nextChapter.id);
      }, 1500);
    }

    if (this.game.taskSystem) {
      const rewardText = [];
      if (chapter.reward?.coins) rewardText.push(`💰${chapter.reward.coins}`);
      if (chapter.reward?.energy) rewardText.push(`⚡${chapter.reward.energy}`);
      this.game.taskSystem.showHint(
        `${chapter.icon} ${chapter.title} 完成！${rewardText.length ? '奖励: ' + rewardText.join(' ') : ''}`
      );
    }

    this.notify('story');
    this.save();
    return true;
  }

  checkChapterCompletion(chapterId) {
    if (this.completedChapters.has(chapterId)) return true;
    const chapter = getChapterById(chapterId);
    if (!chapter) return false;

    const objectives = this.chapterObjectives[chapterId];
    if (!objectives) return false;

    const allCompleted = chapter.objectives.every(obj => objectives[obj.id]?.completed);
    if (allCompleted) {
      return this.completeChapter(chapterId);
    }
    return false;
  }

  unlockBroadcastsForChapter(chapter, triggerKey, triggerData = null) {
    chapter.broadcasts.forEach(bc => {
      if (this.unlockedBroadcasts.has(bc.id)) return;
      const unlockCond = BROADCAST_UNLOCK_MAP[bc.unlockAt];
      if (!unlockCond) return;

      if (this.meetsCondition(unlockCond, chapter, triggerKey, triggerData)) {
        this.unlockedBroadcasts.add(bc.id);
        this.showBroadcastToast(bc);
        this.notify('broadcast');
      }
    });
  }

  showBroadcastToast(broadcast) {
    if (!this.game.taskSystem) return;
    this.game.taskSystem.showHint(
      `${broadcast.icon || '📻'} 新广播：${broadcast.title}`
    );
  }

  tryTriggerDialogue(chapter, triggerKey, triggerData = null) {
    chapter.dialogues.forEach(dlg => {
      if (this.triggeredDialogues.has(dlg.id)) return;
      if (dlg.trigger === 'choice') return;

      const triggerCond = DIALOGUE_TRIGGER_MAP[dlg.trigger];
      if (!triggerCond) return;

      if (this.meetsCondition(triggerCond, chapter, triggerKey, triggerData)) {
        this.triggeredDialogues.add(dlg.id);
        this.pushDialogueToQueue(dlg);
      }
    });
  }

  pushDialogueToQueue(dialogue) {
    if (!dialogue) return;
    this.pendingDialogueQueue.push(dialogue);
    this.processDialogueQueue();
  }

  processDialogueQueue() {
    if (this.activeDialogue) return;
    if (this.pendingDialogueQueue.length === 0) return;

    const next = this.pendingDialogueQueue.shift();
    this.showDialogue(next);
  }

  showDialogue(dialogue) {
    this.activeDialogue = dialogue;
    this.activeDialogueLineIdx = 0;

    const character = getCharacterById(dialogue.speaker);
    if (character) {
      if (this.dialogueSpeakerEl) {
        this.dialogueSpeakerEl.textContent = character.name;
        this.dialogueSpeakerEl.style.color = '#' + character.color.toString(16).padStart(6, '0');
      }
      if (this.dialogueIconEl) this.dialogueIconEl.textContent = character.icon;
    }

    this.renderCurrentDialogueLine();
    if (this.dialogueModal) this.dialogueModal.classList.remove('hidden');
  }

  renderCurrentDialogueLine() {
    if (!this.activeDialogue) return;
    const line = this.activeDialogue.lines[this.activeDialogueLineIdx];
    if (this.dialogueTextEl) this.dialogueTextEl.textContent = line || '';

    const isLastLine = this.activeDialogueLineIdx >= this.activeDialogue.lines.length - 1;
    const hasChoices = isLastLine && this.activeDialogue.choices && this.activeDialogue.choices.length > 0;

    if (this.dialogueChoicesEl) {
      this.dialogueChoicesEl.innerHTML = '';
      if (hasChoices) {
        this.activeDialogue.choices.forEach((choice, idx) => {
          const btn = document.createElement('button');
          btn.className = 'dialogue-choice-btn';
          btn.textContent = choice.text;
          btn.addEventListener('click', () => this.onDialogueChoice(idx));
          this.dialogueChoicesEl.appendChild(btn);
        });
        this.dialogueChoicesEl.classList.remove('hidden');
      } else {
        this.dialogueChoicesEl.classList.add('hidden');
      }
    }

    if (this.dialogueNextBtn) {
      this.dialogueNextBtn.style.display = (hasChoices || !isLastLine) ? 'inline-block' : 'none';
      if (isLastLine && !hasChoices) {
        this.dialogueNextBtn.textContent = '结束';
      } else {
        this.dialogueNextBtn.textContent = '继续 ▶';
      }
    }
  }

  advanceDialogue() {
    if (!this.activeDialogue) return;

    const isLastLine = this.activeDialogueLineIdx >= this.activeDialogue.lines.length - 1;
    const hasChoices = isLastLine && this.activeDialogue.choices && this.activeDialogue.choices.length > 0;

    if (!isLastLine) {
      this.activeDialogueLineIdx++;
      this.renderCurrentDialogueLine();
    } else if (!hasChoices) {
      this.closeDialogue();
    }
  }

  onDialogueChoice(choiceIdx) {
    if (!this.activeDialogue) return;
    const choice = this.activeDialogue.choices[choiceIdx];
    if (!choice) return;

    if (choice.flag) {
      this.storyFlags.add(choice.flag);
    }

    const currentChapter = getChapterById(this.currentChapterId);
    if (choice.next && currentChapter) {
      const nextDlg = currentChapter.dialogues.find(d => d.id === choice.next);
      if (nextDlg) {
        this.triggeredDialogues.add(nextDlg.id);
        this.closeDialogue();
        setTimeout(() => {
          this.showDialogue(nextDlg);
        }, 300);
        this.save();
        return;
      }
    }

    this.closeDialogue();
    this.save();
  }

  closeDialogue() {
    if (this.dialogueModal) this.dialogueModal.classList.add('hidden');
    this.activeDialogue = null;
    this.activeDialogueLineIdx = 0;
    this.processDialogueQueue();
  }

  meetsCondition(condition, chapter, triggerKey, triggerData) {
    if (!condition) return false;

    switch (condition.type) {
      case 'chapter_start':
        return triggerKey === 'chapter_start';

      case 'catch_count':
        return (this.game.stats?.catchCount || 0) >= (condition.target || 0);

      case 'unique_collected':
        return (this.game.inventory?.getCollection?.()?.size || 0) >= (condition.target || 0);

      case 'collect_creature':
        return this.game.inventory?.getCollection?.()?.has?.(condition.creatureId);

      case 'collect_rarity': {
        const targetRarityName = condition.rarityName;
        const targetCount = condition.target || 1;
        let count = 0;
        if (this.game.inventory?.collection) {
          for (const id of this.game.inventory.collection) {
            const c = CREATURES.find(x => x.id === id);
            if (c && c.rarity.name === targetRarityName) count++;
          }
        }
        return count >= targetCount;
      }

      case 'tide_phase': {
        const phase = this.game.tideSystem?.getCurrentPhase?.();
        return phase && phase.id === condition.tideId;
      }

      case 'coins':
        return (this.game.stats?.coins || 0) >= (condition.target || 0);

      case 'expedition_complete':
        return (this.game.expedition?.stats?.totalExpeditions || 0) >= (condition.target || 0);

      case 'combo_reach':
        return (this.game.stats?.comboCount || 0) >= (condition.target || 0);

      case 'catch_in_tide': {
        const phase = this.game.tideSystem?.getCurrentPhase?.();
        return phase && phase.id === condition.tideId;
      }

      case 'story_flag':
        return this.storyFlags.has(condition.flag);

      case 'chapter_complete':
        return this.completedChapters.has(condition.chapterId);

      default:
        return false;
    }
  }

  onGameEvent(eventType, eventData = null) {
    let updated = false;

    STORY_CHAPTERS.forEach(chapter => {
      if (this.completedChapters.has(chapter.id)) return;

      if (!chapter.unlocked) {
        const chapterTriggers = chapter.triggers || [];
        const allMet = chapterTriggers.every(t => this.meetsCondition(t, chapter, eventType, eventData));
        if (allMet) {
          this.startChapter(chapter.id);
          updated = true;
        }
        return;
      }

      this.unlockBroadcastsForChapter(chapter, eventType, eventData);
      this.tryTriggerDialogue(chapter, eventType, eventData);
      updated = this.updateObjectives(chapter, eventType, eventData) || updated;
    });

    if (updated) {
      this.save();
    }
  }

  updateObjectives(chapter, eventType, eventData) {
    let updated = false;
    const objState = this.chapterObjectives[chapter.id];
    if (!objState) return false;

    chapter.objectives.forEach(obj => {
      const state = objState[obj.id];
      if (!state || state.completed) return;

      let progress = null;

      switch (obj.type) {
        case 'catch_count':
          progress = this.game.stats?.catchCount || 0;
          break;
        case 'unique_collected':
          progress = this.game.inventory?.getCollection?.()?.size || 0;
          break;
        case 'collect_rarity': {
          let count = 0;
          if (this.game.inventory?.collection) {
            for (const id of this.game.inventory.collection) {
              const c = CREATURES.find(x => x.id === id);
              if (c && c.rarity.name === obj.rarityName) count++;
            }
          }
          progress = count;
          break;
        }
        case 'coins':
          progress = this.game.stats?.coins || 0;
          break;
        case 'combo_reach':
          progress = Math.max(state.progress, this.game.stats?.comboCount || 0);
          break;
        case 'expedition_complete':
          progress = this.game.expedition?.stats?.totalExpeditions || 0;
          break;
        case 'catch_in_tide': {
          if (eventType === 'catch_count' && obj.tideId) {
            const phase = this.game.tideSystem?.getCurrentPhase?.();
            if (phase && phase.id === obj.tideId) {
              progress = state.progress + 1;
            }
          }
          break;
        }
      }

      if (progress !== null && progress !== state.progress) {
        state.progress = Math.min(progress, obj.target);
        updated = true;

        if (state.progress >= obj.target && !state.completed) {
          state.completed = true;
          if (obj.reward) {
            if (obj.reward.coins) this.game.updateStats('coins', obj.reward.coins);
            if (obj.reward.energy) this.game.updateStats('energy', obj.reward.energy);
          }
          if (this.game.taskSystem) {
            const rewardText = [];
            if (obj.reward?.coins) rewardText.push(`💰${obj.reward.coins}`);
            if (obj.reward?.energy) rewardText.push(`⚡${obj.reward.energy}`);
            this.game.taskSystem.showHint(
              `📖 剧情目标完成：${obj.desc}${rewardText.length ? ' (' + rewardText.join(' ') + ')' : ''}`
            );
          }
          this.notify('story');
          this.checkChapterCompletion(chapter.id);
        }
      }
    });

    return updated;
  }

  renderChapterList() {
    if (!this.chapterListEl) return;
    this.chapterListEl.innerHTML = '';

    STORY_CHAPTERS.forEach(chapter => {
      const isCompleted = this.completedChapters.has(chapter.id);
      const isActive = this.currentChapterId === chapter.id && !isCompleted;
      const isLocked = !chapter.unlocked && !isCompleted;

      const item = document.createElement('div');
      item.className = `story-chapter-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;
      const hexColor = '#' + chapter.color.toString(16).padStart(6, '0');
      item.style.borderColor = hexColor;

      const objState = this.chapterObjectives[chapter.id] || {};
      const totalObj = chapter.objectives.length;
      const doneObj = chapter.objectives.filter(o => objState[o.id]?.completed).length;
      const progressPercent = totalObj ? (doneObj / totalObj) * 100 : 0;

      item.innerHTML = `
        <div class="story-chapter-header">
          <span class="story-chapter-icon" style="color: ${hexColor};">${chapter.icon}</span>
          <div class="story-chapter-titles">
            <div class="story-chapter-title" style="color: ${hexColor};">${chapter.title}</div>
            <div class="story-chapter-subtitle">${chapter.subtitle}</div>
          </div>
          <span class="story-chapter-status">
            ${isLocked ? '🔒 未解锁' : isCompleted ? '✓ 已完成' : isActive ? '▶ 进行中' : '可用'}
          </span>
        </div>
        <div class="story-chapter-desc">${chapter.desc}</div>
        ${!isLocked ? `
          <div class="story-objectives">
            <div class="story-objectives-title">目标进度 (${doneObj}/${totalObj})</div>
            <div class="story-progress-bar">
              <div class="story-progress-fill" style="width: ${progressPercent}%; background: ${hexColor};"></div>
            </div>
            <div class="story-objective-list">
              ${chapter.objectives.map(obj => {
                const st = objState[obj.id] || { progress: 0, completed: false };
                const cur = Math.min(st.progress, obj.target);
                const done = st.completed ? '✓' : '○';
                return `<div class="story-objective-item ${st.completed ? 'done' : ''}">
                  <span class="obj-check">${done}</span>
                  <span class="obj-desc">${obj.desc}</span>
                  <span class="obj-progress">(${cur}/${obj.target})</span>
                </div>`;
              }).join('')}
            </div>
          </div>
        ` : ''}
      `;

      this.chapterListEl.appendChild(item);
    });
  }

  renderBroadcastList() {
    if (!this.broadcastListEl) return;
    this.broadcastListEl.innerHTML = '';

    const allBroadcasts = [];
    STORY_CHAPTERS.forEach(chapter => {
      chapter.broadcasts.forEach(bc => {
        allBroadcasts.push({ ...bc, chapterId: chapter.id, chapterColor: chapter.color });
      });
    });

    if (allBroadcasts.length === 0) {
      this.broadcastListEl.innerHTML = '<div class="empty-broadcast">暂无广播记录</div>';
      return;
    }

    allBroadcasts.reverse().forEach(bc => {
      const isUnlocked = this.unlockedBroadcasts.has(bc.id);
      const hexColor = '#' + bc.chapterColor.toString(16).padStart(6, '0');
      const item = document.createElement('div');
      item.className = `broadcast-item ${isUnlocked ? 'unlocked' : 'locked'}`;

      if (isUnlocked) {
        item.innerHTML = `
          <div class="broadcast-header" style="border-color: ${hexColor};">
            <span class="broadcast-icon">${bc.icon || '📻'}</span>
            <span class="broadcast-title" style="color: ${hexColor};">${bc.title}</span>
          </div>
          <div class="broadcast-content">${bc.content}</div>
        `;
      } else {
        item.innerHTML = `
          <div class="broadcast-header locked">
            <span class="broadcast-icon">🔒</span>
            <span class="broadcast-title">??? - 尚未解锁</span>
          </div>
          <div class="broadcast-content locked">继续推进剧情以解锁更多广播...</div>
        `;
      }

      this.broadcastListEl.appendChild(item);
    });
  }

  save() {
    if (this.game?.saveProgress) {
      this.game.saveProgress();
    }
  }

  toJSON() {
    return {
      currentChapterId: this.currentChapterId,
      completedChapters: Array.from(this.completedChapters),
      storyFlags: Array.from(this.storyFlags),
      triggeredDialogues: Array.from(this.triggeredDialogues),
      unlockedBroadcasts: Array.from(this.unlockedBroadcasts),
      chapterObjectives: this.chapterObjectives
    };
  }

  loadData(data) {
    if (!data) return;

    if (data.currentChapterId) this.currentChapterId = data.currentChapterId;
    if (data.completedChapters) this.completedChapters = new Set(data.completedChapters);
    if (data.storyFlags) this.storyFlags = new Set(data.storyFlags);
    if (data.triggeredDialogues) this.triggeredDialogues = new Set(data.triggeredDialogues);
    if (data.unlockedBroadcasts) this.unlockedBroadcasts = new Set(data.unlockedBroadcasts);
    if (data.chapterObjectives) {
      for (const chapterId in data.chapterObjectives) {
        if (!this.chapterObjectives[chapterId]) this.chapterObjectives[chapterId] = {};
        for (const objId in data.chapterObjectives[chapterId]) {
          this.chapterObjectives[chapterId][objId] = data.chapterObjectives[chapterId][objId];
        }
      }
    }

    STORY_CHAPTERS.forEach(chapter => {
      chapter.unlocked = this.completedChapters.has(chapter.id) ||
                        this.currentChapterId === chapter.id ||
                        chapter.index === 1;
    });
  }
}
