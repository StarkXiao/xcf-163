import { TASKS } from '../data/creatures.js';

export class TaskSystem {
  constructor(game) {
    this.game = game;
    this.tasks = [];
    this.experiencedTides = new Set();
    this.taskHint = document.getElementById('task-hint');
    this.taskText = document.getElementById('task-text');
    this.taskModal = document.getElementById('task-modal');
    this.taskList = document.getElementById('task-list');
    
    this.initTasks();
    this.bindEvents();
  }

  initTasks() {
    this.tasks = TASKS.map(task => ({
      ...task,
      progress: 0,
      completed: false,
      claimed: false
    }));
  }

  bindEvents() {
    document.getElementById('close-task').addEventListener('click', () => this.hideHint());
    document.getElementById('btn-close-task').addEventListener('click', () => this.closeTaskList());
  }

  checkTasks(type, data = null) {
    let updated = false;
    
    this.tasks.forEach(task => {
      if (task.completed) return;
      
      let shouldUpdate = false;
      let progressValue = 0;
      
      switch (type) {
        case 'catch_count':
          if (task.type === 'catch_count') {
            shouldUpdate = true;
            progressValue = this.game.stats.catchCount;
          }
          break;
          
        case 'backpack_open':
          if (task.type === 'backpack_open') {
            shouldUpdate = true;
            progressValue = 1;
          }
          break;
          
        case 'workshop_open':
          if (task.type === 'workshop_open') {
            shouldUpdate = true;
            progressValue = 1;
          }
          break;
          
        case 'find_rarity':
          if (task.type === 'find_rarity' && data === task.rarity) {
            shouldUpdate = true;
            progressValue = task.progress + 1;
          }
          break;
          
        case 'collect_rarity':
          if (task.type === 'collect_rarity' && data === task.rarity) {
            shouldUpdate = true;
            progressValue = this.game.inventory.getRarityCount(task.rarity);
          }
          break;
          
        case 'unique_collected':
          if (task.type === 'unique_collected') {
            shouldUpdate = true;
            progressValue = this.game.inventory.getCollection().size;
          }
          break;
          
        case 'tide_change':
          if (task.type === 'tide_change') {
            shouldUpdate = true;
            progressValue = task.progress + 1;
          }
          if (task.type === 'experience_tide' && data) {
            this.experiencedTides.add(data.id);
            shouldUpdate = true;
            progressValue = this.experiencedTides.size;
          }
          break;
          
        case 'catch_in_tide':
          if (task.type === 'catch_in_tide' && data && data.id === task.tideId) {
            shouldUpdate = true;
            progressValue = task.progress + 1;
          }
          break;
          
        case 'find_rarity_in_tide':
          if (task.type === 'find_rarity_in_tide' && data) {
            if (data.rarity === task.rarity && data.tide && data.tide.id === task.tideId) {
              shouldUpdate = true;
              progressValue = task.progress + 1;
            }
          }
          break;

        case 'scrap_count':
          if (task.type === 'scrap_count') {
            shouldUpdate = true;
            progressValue = task.progress + 1;
          }
          break;

        case 'upgrade_success':
          if (task.type === 'upgrade_success') {
            shouldUpdate = true;
            progressValue = task.progress + 1;
          }
          break;

        case 'upgrade_tier':
          if (task.type === 'upgrade_tier' && typeof data === 'number') {
            shouldUpdate = true;
            progressValue = Math.max(task.progress, data);
          }
          break;

        case 'reroll_count':
          if (task.type === 'reroll_count') {
            shouldUpdate = true;
            progressValue = task.progress + 1;
          }
          break;

        case 'chamber_open':
          if (task.type === 'chamber_open') {
            shouldUpdate = true;
            progressValue = 1;
          }
          break;

        case 'stall_unlock':
        case 'stall_upgrade':
        case 'chamber_sale':
        case 'cycle_start':
        case 'cycle_end':
        case 'blackmarket_sale':
        case 'blackmarket_order':
          if (task.type === type) {
            shouldUpdate = true;
            progressValue = task.progress + 1;
          }
          break;

        case 'expedition_open':
          if (task.type === 'expedition_open') {
            shouldUpdate = true;
            progressValue = 1;
          }
          break;

        case 'expedition_start':
          if (task.type === 'expedition_start') {
            shouldUpdate = true;
            progressValue = task.progress + 1;
          }
          break;

        case 'expedition_complete':
          if (task.type === 'expedition_complete') {
            shouldUpdate = true;
            progressValue = this.game.expedition ? this.game.expedition.stats.totalExpeditions : 0;
          }
          break;

        case 'expedition_unlock_route':
          if (task.type === 'expedition_unlock_route') {
            shouldUpdate = true;
            progressValue = task.progress + 1;
          }
          break;

        case 'expedition_upgrade':
          if (task.type === 'expedition_upgrade') {
            shouldUpdate = true;
            progressValue = task.progress + 1;
          }
          break;

        case 'combo_reach':
          if (task.type === 'combo_reach' && typeof data === 'number') {
            shouldUpdate = true;
            progressValue = Math.max(task.progress, data);
          }
          break;

        case 'find_rarity_in_combo':
          if (task.type === 'find_rarity_in_combo' && data) {
            const minCombo = task.minCombo || 1;
            if (data.rarity === task.rarity && data.combo >= minCombo) {
              shouldUpdate = true;
              progressValue = task.progress + 1;
            }
          }
          break;

        case 'total_combo_hits':
          if (task.type === 'total_combo_hits') {
            shouldUpdate = true;
            progressValue = this.game.stats.totalComboHits || 0;
          }
          break;

        case 'codex_lab_open':
          if (task.type === 'codex_lab_open') {
            shouldUpdate = true;
            progressValue = 1;
          }
          break;

        case 'archive_unlock_stage':
        case 'archive_stage_reached':
          if (task.type === type && typeof data === 'number') {
            shouldUpdate = true;
            progressValue = Math.max(task.progress, data);
          }
          break;

        case 'voice_fragments_unlocked':
          if (task.type === 'voice_fragments_unlocked') {
            shouldUpdate = true;
            progressValue = this.game.codexLab ? this.game.codexLab.stats.totalVoicesUnlocked : 0;
          }
          break;

        case 'worldline_unlocked':
          if (task.type === 'worldline_unlocked') {
            shouldUpdate = true;
            progressValue = this.game.codexLab ? this.game.codexLab.stats.totalWorldLinesUnlocked : 0;
          }
          break;

        case 'all_creatures_max_stage':
          if (task.type === 'all_creatures_max_stage' && typeof data === 'number') {
            shouldUpdate = true;
            progressValue = data;
          }
          break;

        case 'boss_encounter':
          if (task.type === 'boss_encounter') {
            shouldUpdate = true;
            progressValue = task.progress + 1;
          }
          break;

        case 'boss_defeat':
        case 'boss_defeat_count':
          if (task.type === 'boss_defeat_count' || task.type === 'boss_defeat') {
            shouldUpdate = true;
            progressValue = this.game.battleSystem ? this.game.battleSystem.getTotalBossesDefeated() : 0;
          }
          break;

        case 'boss_defeat_specific':
          if (task.type === 'boss_defeat_specific' && data) {
            const bossId = typeof data === 'object' ? data.id : data;
            if (task.bossId === bossId) {
              shouldUpdate = true;
              progressValue = this.game.battleSystem ? this.game.battleSystem.getBossDefeatCount(task.bossId) : 0;
            }
          }
          break;

        case 'boss_defeat_all':
          if (task.type === 'boss_defeat_all') {
            shouldUpdate = true;
            const battleSys = this.game.battleSystem;
            if (battleSys) {
              let uniqueDefeated = 0;
              const bossIds = ['abyssal_colossus', 'void_leviathan', 'ancient_dreadnought', 'data_entity_prime'];
              bossIds.forEach(id => {
                if (battleSys.getBossDefeatCount(id) > 0) uniqueDefeated++;
              });
              progressValue = uniqueDefeated;
            }
          }
          break;

        case 'season_open':
          if (task.type === 'season_open') {
            shouldUpdate = true;
            progressValue = 1;
          }
          break;

        case 'season_score':
          if (task.type === 'season_score' && this.game.seasonSystem) {
            shouldUpdate = true;
            progressValue = this.game.seasonSystem.weeklyScore;
          }
          break;

        case 'season_creature':
          if (task.type === 'season_creature' && this.game.seasonSystem) {
            shouldUpdate = true;
            progressValue = this.game.seasonSystem.getTotalCreaturesCaught();
          }
          break;

        case 'season_new_creature':
          if (task.type === 'season_new_creature' && this.game.seasonSystem) {
            shouldUpdate = true;
            progressValue = this.game.seasonSystem.getNewCreaturesCount();
          }
          break;

        case 'season_port_commission':
          if (task.type === 'season_port_commission' && this.game.seasonSystem) {
            shouldUpdate = true;
            progressValue = this.game.seasonSystem.weeklyPortCommissions;
          }
          break;

        case 'season_reward_claimed':
          if (task.type === 'season_reward_claimed' && this.game.seasonSystem) {
            shouldUpdate = true;
            progressValue = this.game.seasonSystem.claimedRewards.size;
          }
          break;
      }
      
      if (shouldUpdate) {
        task.progress = Math.min(progressValue, task.target);
        updated = true;
        
        if (task.progress >= task.target && !task.completed) {
          task.completed = true;
          this.claimReward(task);
          this.showHint(`任务完成：${task.name}！奖励已发放。`);
        }
      }
    });
    
    if (updated) {
      this.game.saveProgress();
    }
    
    return updated;
  }

  claimReward(task) {
    if (task.reward) {
      if (task.reward.coins) {
        this.game.updateStats('coins', task.reward.coins);
      }
      if (task.reward.energy) {
        this.game.updateStats('energy', task.reward.energy);
      }
    }
    task.claimed = true;
  }

  getActiveTask() {
    return this.tasks.find(task => !task.completed);
  }

  getTutorialTasks() {
    return this.tasks.filter(task => task.isTutorial && !task.completed);
  }

  showTutorialHint() {
    const tutorial = this.getTutorialTasks()[0];
    if (tutorial) {
      this.showHint(tutorial.desc);
    }
  }

  showHint(text) {
    this.taskText.textContent = text;
    this.taskHint.classList.remove('hidden');
    
    clearTimeout(this.hintTimeout);
    this.hintTimeout = setTimeout(() => {
      this.hideHint();
    }, 5000);
  }

  hideHint() {
    this.taskHint.classList.add('hidden');
    clearTimeout(this.hintTimeout);
  }

  openTaskList() {
    this.renderTaskList();
    this.taskModal.classList.remove('hidden');
  }

  closeTaskList() {
    this.taskModal.classList.add('hidden');
  }

  renderTaskList() {
    this.taskList.innerHTML = '';
    
    this.tasks.forEach(task => {
      const item = document.createElement('div');
      item.className = `task-item ${task.completed ? 'completed' : 'active'}`;
      
      const progress = Math.min(task.progress, task.target);
      const progressPercent = (progress / task.target) * 100;
      
      let rewardText = '';
      if (task.reward) {
        const rewards = [];
        if (task.reward.coins) rewards.push(`💰 ${task.reward.coins}`);
        if (task.reward.energy) rewards.push(`⚡ ${task.reward.energy}`);
        rewardText = rewards.join('  ');
      }
      
      item.innerHTML = `
        <div class="task-name">${task.name}${task.completed ? ' ✓' : ''}</div>
        <div class="task-desc">${task.desc}</div>
        <div class="task-progress-bar">
          <div class="task-progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="task-progress-text">${progress} / ${task.target}</div>
        ${rewardText ? `<div class="task-reward">奖励: ${rewardText}</div>` : ''}
      `;
      
      this.taskList.appendChild(item);
    });
  }

  loadData(data) {
    if (data.tasks) {
      data.tasks.forEach(savedTask => {
        const task = this.tasks.find(t => t.id === savedTask.id);
        if (task) {
          task.progress = savedTask.progress || 0;
          task.completed = savedTask.completed || false;
          task.claimed = savedTask.claimed || false;
        }
      });
    }
    if (data.experiencedTides) {
      this.experiencedTides = new Set(data.experiencedTides);
    }
  }

  toJSON() {
    return {
      tasks: this.tasks.map(task => ({
        id: task.id,
        progress: task.progress,
        completed: task.completed,
        claimed: task.claimed
      })),
      experiencedTides: Array.from(this.experiencedTides)
    };
  }
}
