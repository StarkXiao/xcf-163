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
