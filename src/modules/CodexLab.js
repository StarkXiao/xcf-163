import { CREATURES, CREATURE_ARCHIVES, getUnlockedArchiveStages, getUnlockedVoiceFragments, getUnlockedWorldLineFragments } from '../data/creatures.js';

export class CodexLab {
  constructor(game) {
    this.game = game;

    this.unlockedStages = {};
    this.unlockedVoiceFragments = new Set();
    this.unlockedWorldLineFragments = new Set();
    this.researchLog = [];
    this.stats = {
      totalArchivesUnlocked: 0,
      totalVoicesUnlocked: 0,
      totalWorldLinesUnlocked: 0,
      maxStageReached: 0,
      totalCreaturesResearched: 0
    };

    this.modal = document.getElementById('codex-lab-modal');
    this.currentCreatureId = null;
    this.currentTab = 'overview';

    this.bindStaticEvents();
  }

  bindStaticEvents() {
    const closeBtn = document.getElementById('btn-close-codex-lab');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeLab());
    }

    const tabs = document.querySelectorAll('.codex-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.codexTab;
        this.switchTab(tabId);
      });
    });
  }

  openLab(creatureId = null) {
    if (!this.modal) return;
    this.currentCreatureId = creatureId;
    this.modal.classList.remove('hidden');
    this.game.checkTasks('codex_lab_open');
    this.renderAll();
  }

  closeLab() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    const tabs = document.querySelectorAll('.codex-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.codexTab === tabId);
    });

    const contents = document.querySelectorAll('.codex-tab-content');
    contents.forEach(content => {
      content.classList.toggle('hidden', content.dataset.codexTabContent !== tabId);
    });

    this.renderAll();
  }

  getCollectedCount(creatureId) {
    return this.game.inventory.getCumulativeCreatureCount(creatureId);
  }

  getHighestStage(creatureId) {
    return this.unlockedStages[creatureId] || 0;
  }

  isStageUnlocked(creatureId, stage) {
    return this.getHighestStage(creatureId) >= stage;
  }

  checkAndGrantUnlocks(creatureId) {
    const collected = this.getCollectedCount(creatureId);
    const archive = CREATURE_ARCHIVES[creatureId];
    if (!archive) return;

    const previouslyHighest = this.getHighestStage(creatureId);
    const newlyUnlockedStages = getUnlockedArchiveStages(creatureId, collected)
      .filter(s => s.stage > previouslyHighest);

    if (newlyUnlockedStages.length === 0) return [];

    const newHighest = Math.max(previouslyHighest, ...newlyUnlockedStages.map(s => s.stage));
    this.unlockedStages[creatureId] = newHighest;

    let newUnlocks = [];
    let totalArchiveCount = 0;
    Object.values(this.unlockedStages).forEach(stage => {
      totalArchiveCount += stage;
    });
    this.stats.totalArchivesUnlocked = totalArchiveCount;

    newlyUnlockedStages.forEach(stage => {
      newUnlocks.push({ type: 'archive', id: `${creatureId}_s${stage.stage}`, title: stage.title, text: stage.content });

      const voices = getUnlockedVoiceFragments(creatureId, stage.stage);
      voices.forEach(v => {
        if (!this.unlockedVoiceFragments.has(v.id)) {
          this.unlockedVoiceFragments.add(v.id);
          newUnlocks.push({ type: 'voice', id: v.id, title: '语音片段', text: v.text });
          this.stats.totalVoicesUnlocked++;
        }
      });

      const worldLines = getUnlockedWorldLineFragments(creatureId, stage.stage);
      worldLines.forEach(w => {
        if (!this.unlockedWorldLineFragments.has(w.id)) {
          this.unlockedWorldLineFragments.add(w.id);
          newUnlocks.push({ type: 'worldline', id: w.id, title: w.title, text: w.content });
          this.stats.totalWorldLinesUnlocked++;
        }
      });

      if (stage.stage > this.stats.maxStageReached) {
        this.stats.maxStageReached = stage.stage;
      }
    });

    this.updateResearchStats();

    if (newUnlocks.length > 0) {
      newUnlocks.forEach(unlock => {
        const label = unlock.type === 'archive' ? '档案阶段' : unlock.type === 'voice' ? '语音' : '世界线碎片';
        this.addLog('success', `🔓 解锁新${label}：${unlock.title}`);
        this.game.taskSystem.showHint(`🔓 解锁新${label}！`);
      });

      this.game.checkTasks('archive_unlock_stage', this.stats.maxStageReached);
      this.game.checkTasks('archive_stage_reached', this.stats.maxStageReached);
      this.game.checkTasks('voice_fragments_unlocked', this.stats.totalVoicesUnlocked);
      this.game.checkTasks('worldline_unlocked', this.stats.totalWorldLinesUnlocked);

      const maxStageCount = this.countCreaturesAtMaxStage();
      this.game.checkTasks('all_creatures_max_stage', maxStageCount);
    }

    this.game.saveProgress();
    return newUnlocks;
  }

  countCreaturesAtMaxStage() {
    let count = 0;
    CREATURES.forEach(c => {
      const archive = CREATURE_ARCHIVES[c.id];
      if (!archive) return;
      const maxStage = Math.max(...archive.archiveStages.map(s => s.stage));
      const highest = this.getHighestStage(c.id);
      if (highest >= maxStage) count++;
    });
    return count;
  }

  updateResearchStats() {
    this.stats.totalCreaturesResearched = CREATURES.filter(c => this.game.inventory.getCollection().has(c.id)).length;
  }

  addLog(type, message) {
    const time = new Date().toLocaleTimeString();
    this.researchLog.unshift({ type, message, time });
    if (this.researchLog.length > 100) {
      this.researchLog.pop();
    }
  }

  renderAll() {
    this.renderCreatureSelector();
    this.renderOverview();
    this.renderArchive();
    this.renderVoices();
    this.renderWorldLines();
    this.renderResearchLog();
  }

  renderCreatureSelector() {
    const el = document.getElementById('codex-creature-selector');
    if (!el) return;

    const collection = this.game.inventory.getCollection();

    el.innerHTML = `
      <div class="codex-selector-label">选择研究对象：</div>
      <div class="codex-creature-grid">
        ${CREATURES.map(creature => {
          const collected = collection.has(creature.id);
          const count = this.getCollectedCount(creature.id);
          const highestStage = this.getHighestStage(creature.id);
          const isActive = this.currentCreatureId === creature.id;
          const archive = CREATURE_ARCHIVES[creature.id];
          const maxStage = archive ? Math.max(...archive.archiveStages.map(s => s.stage)) : 0;

          return `
            <div class="codex-creature-slot ${collected ? 'collected ' + creature.rarity.class : 'locked'} ${isActive ? 'active' : ''}"
                 data-creature-id="${creature.id}">
              <div class="slot-rarity-border"></div>
              <span class="slot-icon">${collected ? creature.icon : '❓'}</span>
              ${collected ? `
                <span class="codex-count-badge">×${count}</span>
                ${highestStage > 0 ? `<span class="codex-stage-badge">L${highestStage}/${maxStage}</span>` : ''}
              ` : ''}
              <span class="codex-creature-name">${collected ? creature.name : '???'}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    el.querySelectorAll('[data-creature-id]').forEach(slot => {
      slot.addEventListener('click', () => {
        const creatureId = slot.dataset.creatureId;
        if (this.game.inventory.getCollection().has(creatureId)) {
          this.currentCreatureId = creatureId;
          this.checkAndGrantUnlocks(creatureId);
          this.renderAll();
        }
      });
    });
  }

  renderOverview() {
    const el = document.getElementById('codex-overview');
    if (!el) return;

    if (!this.currentCreatureId) {
      el.innerHTML = `
        <div class="codex-empty-state">
          <div style="font-size: 48px;">🔬</div>
          <p>从左侧选择一个已收集的机械残骸开始研究</p>
          <p class="chamber-stat-sub">收集越多相同残骸，解锁的研究内容越丰富</p>
        </div>
      `;
      return;
    }

    const creature = CREATURES.find(c => c.id === this.currentCreatureId);
    const count = this.getCollectedCount(this.currentCreatureId);
    const highestStage = this.getHighestStage(this.currentCreatureId);
    const archive = CREATURE_ARCHIVES[this.currentCreatureId];
    const maxStage = archive ? Math.max(...archive.archiveStages.map(s => s.stage)) : 0;
    const unlockedVoices = getUnlockedVoiceFragments(this.currentCreatureId, highestStage).length;
    const totalVoices = archive ? archive.voiceFragments.length : 0;
    const unlockedWL = getUnlockedWorldLineFragments(this.currentCreatureId, highestStage).length;
    const totalWL = archive ? archive.worldLineFragments.length : 0;

    el.innerHTML = `
      <div class="codex-overview-header">
        <div class="codex-overview-icon" style="background: radial-gradient(circle, rgba(${this.hexToRgb(creature.rarity.color)}, 0.3) 0%, transparent 70%);">
          <span style="font-size: 64px;">${creature.icon}</span>
        </div>
        <div class="codex-overview-info">
          <h3 class="${creature.rarity.class}">${creature.name}</h3>
          <div class="codex-overview-rarity">稀有度：${creature.rarity.name}</div>
          <div class="codex-overview-desc">${creature.desc}</div>
        </div>
      </div>

      <div class="codex-progress-grid">
        <div class="codex-progress-card">
          <div class="codex-progress-label">收集数量</div>
          <div class="codex-progress-value">${count}</div>
          <div class="codex-progress-sub">继续收集解锁更高级档案</div>
        </div>
        <div class="codex-progress-card">
          <div class="codex-progress-label">档案阶段</div>
          <div class="codex-progress-value">${highestStage} / ${maxStage}</div>
          <div class="chamber-progress">
            <div class="chamber-progress-fill" style="width: ${(highestStage / maxStage) * 100}%"></div>
          </div>
        </div>
        <div class="codex-progress-card">
          <div class="codex-progress-label">语音片段</div>
          <div class="codex-progress-value">${unlockedVoices} / ${totalVoices}</div>
          <div class="chamber-progress">
            <div class="chamber-progress-fill" style="width: ${(totalVoices > 0 ? (unlockedVoices / totalVoices) * 100 : 0)}%"></div>
          </div>
        </div>
        <div class="codex-progress-card">
          <div class="codex-progress-label">世界线碎片</div>
          <div class="codex-progress-value">${unlockedWL} / ${totalWL}</div>
          <div class="chamber-progress">
            <div class="chamber-progress-fill" style="width: ${(totalWL > 0 ? (unlockedWL / totalWL) * 100 : 0)}%"></div>
          </div>
        </div>
      </div>

      <div class="codex-next-unlock">
        <div class="codex-next-label">下一阶段解锁条件：</div>
        ${this.getNextUnlockHint(creature.id, count, highestStage, archive)}
      </div>
    `;
  }

  getNextUnlockHint(creatureId, count, currentStage, archive) {
    if (!archive) return '<div class="codex-hint">暂无更多研究内容</div>';

    const nextStage = archive.archiveStages.find(s => s.stage > currentStage);
    if (!nextStage) {
      return `<div class="codex-hint success">🎉 已解锁该残骸全部研究内容！</div>`;
    }

    const remaining = nextStage.unlockCount - count;
    const voices = archive.voiceFragments.filter(v => v.unlockStage === nextStage.stage);
    const worldLines = archive.worldLineFragments.filter(w => w.unlockStage === nextStage.stage);

    let content = `<div class="codex-hint">还需收集 <strong>${remaining}</strong> 个 ${creatureId}，解锁：</div>`;
    content += `<div class="codex-unlock-preview">`;
    content += `<div class="codex-unlock-item">📄 ${nextStage.title}</div>`;
    voices.forEach(v => {
      content += `<div class="codex-unlock-item">🔊 新语音片段</div>`;
    });
    worldLines.forEach(w => {
      content += `<div class="codex-unlock-item">🌌 ${w.title}</div>`;
    });
    content += `</div>`;

    return content;
  }

  renderArchive() {
    const el = document.getElementById('codex-archive');
    if (!el) return;

    if (!this.currentCreatureId) {
      el.innerHTML = `<div class="codex-empty-state"><p>请先选择一个机械残骸</p></div>`;
      return;
    }

    const creature = CREATURES.find(c => c.id === this.currentCreatureId);
    const count = this.getCollectedCount(this.currentCreatureId);
    const archive = CREATURE_ARCHIVES[this.currentCreatureId];

    if (!archive) {
      el.innerHTML = `<div class="codex-empty-state"><p>该残骸暂无档案资料</p></div>`;
      return;
    }

    el.innerHTML = `
      <h3 class="codex-section-title">📄 ${creature.name} 研究档案</h3>
      <div class="codex-archive-list">
        ${archive.archiveStages.map(stage => {
          const unlocked = this.isStageUnlocked(this.currentCreatureId, stage.stage);
          return `
            <div class="codex-archive-stage ${unlocked ? 'unlocked' : 'locked'}">
              <div class="codex-stage-header">
                <span class="codex-stage-number">阶段 ${stage.stage}</span>
                <span class="codex-stage-title">${unlocked ? stage.title : '???'}</span>
                <span class="codex-stage-status ${unlocked ? 'unlocked' : ''}">
                  ${unlocked ? '✅ 已解锁' : `🔒 累计收集 ${stage.unlockCount} 个解锁 (当前 ${count})`}
                </span>
              </div>
              <div class="codex-stage-content">
                ${unlocked ? stage.content : '档案已加密，请收集更多该类型残骸后解锁。'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderVoices() {
    const el = document.getElementById('codex-voices');
    if (!el) return;

    if (!this.currentCreatureId) {
      el.innerHTML = `<div class="codex-empty-state"><p>请先选择一个机械残骸</p></div>`;
      return;
    }

    const creature = CREATURES.find(c => c.id === this.currentCreatureId);
    const highestStage = this.getHighestStage(this.currentCreatureId);
    const archive = CREATURE_ARCHIVES[this.currentCreatureId];

    if (!archive || archive.voiceFragments.length === 0) {
      el.innerHTML = `<div class="codex-empty-state"><p>该残骸暂无语音记录</p></div>`;
      return;
    }

    el.innerHTML = `
      <h3 class="codex-section-title">🔊 ${creature.name} 语音片段</h3>
      <div class="codex-voice-list">
        ${archive.voiceFragments.map(voice => {
          const unlocked = this.isStageUnlocked(this.currentCreatureId, voice.unlockStage);
          return `
            <div class="codex-voice-item ${unlocked ? 'unlocked' : 'locked'}">
              <div class="codex-voice-header">
                <span class="codex-voice-icon">${unlocked ? '🔊' : '🔒'}</span>
                <span class="codex-voice-label">语音片段 #${archive.voiceFragments.indexOf(voice) + 1}</span>
                <span class="codex-voice-requirement">
                  需解锁档案阶段 ${voice.unlockStage}
                </span>
              </div>
              <div class="codex-voice-text">
                ${unlocked ? `"${voice.text}"` : '■■■■■■■■■■■■■■■（加密）'}
              </div>
              ${unlocked ? `
                <button class="modal-btn secondary codex-play-btn" data-voice-text="${encodeURIComponent(voice.text)}">
                  ▶ 播放语音
                </button>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    el.querySelectorAll('.codex-play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = decodeURIComponent(btn.dataset.voiceText);
        this.game.taskSystem.showHint(`🔊 播放："${text}"`);
      });
    });
  }

  renderWorldLines() {
    const el = document.getElementById('codex-worldlines');
    if (!el) return;

    if (!this.currentCreatureId) {
      el.innerHTML = `<div class="codex-empty-state"><p>请先选择一个机械残骸</p></div>`;
      return;
    }

    const creature = CREATURES.find(c => c.id === this.currentCreatureId);
    const highestStage = this.getHighestStage(this.currentCreatureId);
    const archive = CREATURE_ARCHIVES[this.currentCreatureId];

    if (!archive || archive.worldLineFragments.length === 0) {
      el.innerHTML = `<div class="codex-empty-state"><p>该残骸暂无世界线碎片记录</p></div>`;
      return;
    }

    el.innerHTML = `
      <h3 class="codex-section-title">🌌 ${creature.name} 世界线碎片</h3>
      <div class="codex-worldline-list">
        ${archive.worldLineFragments.map(wl => {
          const unlocked = this.isStageUnlocked(this.currentCreatureId, wl.unlockStage);
          return `
            <div class="codex-worldline-item ${unlocked ? 'unlocked' : 'locked'}">
              <div class="codex-worldline-header">
                <span class="codex-worldline-icon">${unlocked ? '🌌' : '🔒'}</span>
                <span class="codex-worldline-title">${unlocked ? wl.title : '??? 未知碎片'}</span>
                <span class="codex-worldline-requirement">
                  需解锁档案阶段 ${wl.unlockStage}
                </span>
              </div>
              <div class="codex-worldline-content">
                ${unlocked ? wl.content : '这块碎片的内容被时间的迷雾遮蔽了...'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderResearchLog() {
    const el = document.getElementById('codex-lab-log');
    if (!el) return;

    el.innerHTML = `
      <div class="codex-lab-stats">
        <div class="codex-stat-mini">
          <span>📄 已解锁档案阶段</span>
          <strong>${this.stats.totalArchivesUnlocked}</strong>
        </div>
        <div class="codex-stat-mini">
          <span>🔊 语音片段</span>
          <strong>${this.stats.totalVoicesUnlocked}</strong>
        </div>
        <div class="codex-stat-mini">
          <span>🌌 世界线碎片</span>
          <strong>${this.stats.totalWorldLinesUnlocked}</strong>
        </div>
        <div class="codex-stat-mini">
          <span>🏆 最高阶段</span>
          <strong>L${this.stats.maxStageReached}</strong>
        </div>
      </div>
      <div class="chamber-stat-label" style="margin: 8px 0;">研究日志</div>
      <div class="codex-log-content">
        ${this.researchLog.length > 0 ?
          this.researchLog.slice(-20).reverse().map(log => `
            <div class="log-entry ${log.type || ''}">
              <span class="log-time">[${log.time}]</span>
              <span class="log-text">${log.message}</span>
            </div>
          `).join('') :
          '<div style="color:#666;text-align:center;padding:10px;">暂无研究记录，快去收集残骸吧！</div>'
        }
      </div>
    `;
  }

  hexToRgb(hex) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `${r}, ${g}, ${b}`;
  }

  toJSON() {
    return {
      unlockedStages: { ...this.unlockedStages },
      unlockedVoiceFragments: Array.from(this.unlockedVoiceFragments),
      unlockedWorldLineFragments: Array.from(this.unlockedWorldLineFragments),
      researchLog: this.researchLog,
      stats: { ...this.stats }
    };
  }

  loadData(data) {
    if (!data) return;
    if (data.unlockedStages) {
      this.unlockedStages = { ...data.unlockedStages };
    }
    if (data.unlockedVoiceFragments) {
      this.unlockedVoiceFragments = new Set(data.unlockedVoiceFragments);
    }
    if (data.unlockedWorldLineFragments) {
      this.unlockedWorldLineFragments = new Set(data.unlockedWorldLineFragments);
    }
    if (data.researchLog) {
      this.researchLog = data.researchLog;
    }
    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }

    this.retroactiveUnlockRepair();

    if (!data.stats) {
      let total = 0;
      Object.values(this.unlockedStages).forEach(s => total += s);
      this.stats.totalArchivesUnlocked = total;
      this.stats.totalVoicesUnlocked = this.unlockedVoiceFragments.size;
      this.stats.totalWorldLinesUnlocked = this.unlockedWorldLineFragments.size;
    }
  }

  retroactiveUnlockRepair() {
    let anythingChanged = false;
    CREATURES.forEach(c => {
      const cumulative = this.game.inventory.getCumulativeCreatureCount(c.id);
      if (cumulative <= 0) return;
      const stages = getUnlockedArchiveStages(c.id, cumulative);
      const highestFromCatch = stages.length > 0 ? Math.max(...stages.map(s => s.stage)) : 0;
      const current = this.getHighestStage(c.id);
      if (highestFromCatch > current) {
        this.unlockedStages[c.id] = highestFromCatch;
        stages.forEach(stage => {
          const voices = getUnlockedVoiceFragments(c.id, stage.stage);
          voices.forEach(v => {
            if (!this.unlockedVoiceFragments.has(v.id)) {
              this.unlockedVoiceFragments.add(v.id);
              this.stats.totalVoicesUnlocked++;
            }
          });
          const wls = getUnlockedWorldLineFragments(c.id, stage.stage);
          wls.forEach(w => {
            if (!this.unlockedWorldLineFragments.has(w.id)) {
              this.unlockedWorldLineFragments.add(w.id);
              this.stats.totalWorldLinesUnlocked++;
            }
          });
          if (stage.stage > this.stats.maxStageReached) {
            this.stats.maxStageReached = stage.stage;
          }
        });
        anythingChanged = true;
      }
    });

    if (anythingChanged) {
      let totalArchives = 0;
      Object.values(this.unlockedStages).forEach(s => totalArchives += s);
      this.stats.totalArchivesUnlocked = totalArchives;
      this.updateResearchStats();
      this.addLog('info', '🔧 已根据累计捕获记录修复研究解锁状态');
    }
  }
}
