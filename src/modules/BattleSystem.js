import { getRandomCreature } from '../data/creatures.js';

export class BattleSystem {
  constructor(game) {
    this.game = game;
    this.currentCreature = null;
    this.isBattling = false;
    
    this.modal = document.getElementById('battle-modal');
    this.titleEl = document.getElementById('battle-title');
    this.displayEl = document.getElementById('creature-display');
    this.quoteEl = document.getElementById('creature-quote');
    this.nameEl = document.getElementById('creature-name');
    this.rarityEl = document.getElementById('creature-rarity');
    this.valueEl = document.getElementById('creature-value');
    
    this.collectBtn = document.getElementById('btn-collect');
    this.releaseBtn = document.getElementById('btn-release');
    
    this.bindEvents();
  }

  bindEvents() {
    this.collectBtn.addEventListener('click', () => this.collectCreature());
    this.releaseBtn.addEventListener('click', () => this.releaseCreature());
  }

  startBattle() {
    if (this.isBattling) return;
    
    this.isBattling = true;
    this.currentCreature = getRandomCreature();
    
    this.showModal();
    this.game.updateStats('catchCount', 1);
    this.game.checkTasks('catch_count');
    this.game.checkTasks('find_rarity', this.currentCreature.rarity);
  }

  showModal() {
    const c = this.currentCreature;
    const quote = c.quotes[Math.floor(Math.random() * c.quotes.length)];
    
    this.titleEl.textContent = c.rarity.name === '传说' ? '传说降临！' : 
                              c.rarity.name === '史诗' ? '史诗发现！' :
                              '发现机械残骸！';
    
    this.displayEl.innerHTML = `<span style="font-size: 80px;">${c.icon}</span>`;
    this.displayEl.style.background = `radial-gradient(circle, rgba(${this.hexToRgb(c.rarity.color)}, 0.3) 0%, transparent 70%)`;
    this.quoteEl.textContent = `"${quote}"`;
    this.nameEl.textContent = c.name;
    this.rarityEl.textContent = c.rarity.name;
    this.rarityEl.className = `stat-data ${c.rarity.class}`;
    this.valueEl.textContent = `${c.value} 金币`;
    
    this.modal.classList.remove('hidden');
  }

  hideModal() {
    this.modal.classList.add('hidden');
  }

  collectCreature() {
    if (!this.currentCreature) return;
    
    this.game.addToBackpack(this.currentCreature);
    this.game.checkTasks('collect_rarity', this.currentCreature.rarity);
    this.game.checkTasks('unique_collected');
    
    this.endBattle();
  }

  releaseCreature() {
    if (!this.currentCreature) return;
    
    const bonus = Math.floor(this.currentCreature.value * 0.3);
    this.game.updateStats('coins', bonus);
    
    this.endBattle();
  }

  endBattle() {
    this.hideModal();
    this.currentCreature = null;
    this.isBattling = false;
  }

  hexToRgb(hex) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `${r}, ${g}, ${b}`;
  }
}
