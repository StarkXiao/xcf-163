import { getRandomCreature, generateRandomAffixes, calculateCreatureValue } from '../data/creatures.js';

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
    this.tideHintEl = document.getElementById('battle-tide-hint');
    
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
    
    const tideSystem = this.game.tideSystem;
    
    if (tideSystem) {
      const encounterRate = tideSystem.getAdjustedEncounterRate();
      if (Math.random() > encounterRate) {
        this.showEmptyCatch();
        return;
      }
    }
    
    this.currentCreature = getRandomCreature(tideSystem);
    this.currentCreature.tier = 1;
    this.currentCreature.affixes = generateRandomAffixes(this.currentCreature);
    
    if (tideSystem) {
      tideSystem.recordCatch();
    }
    
    this.showModal();
    this.game.updateStats('catchCount', 1);
    this.game.checkTasks('catch_count');
    this.game.checkTasks('find_rarity', this.currentCreature.rarity);
    
    if (tideSystem) {
      this.game.checkTasks('catch_in_tide', tideSystem.getCurrentPhase());
      this.game.checkTasks('find_rarity_in_tide', {
        rarity: this.currentCreature.rarity,
        tide: tideSystem.getCurrentPhase()
      });
    }
  }

  showEmptyCatch() {
    const tidePhase = this.game.tideSystem ? this.game.tideSystem.getCurrentPhase() : null;
    
    this.titleEl.textContent = '一无所获...';
    this.displayEl.innerHTML = '<span style="font-size: 60px;">🌀</span>';
    this.displayEl.style.background = 'radial-gradient(circle, rgba(100, 100, 150, 0.3) 0%, transparent 70%)';
    this.quoteEl.textContent = tidePhase 
      ? `"${tidePhase.name}时海里空空如也，再试一次吧..."`
      : '"这次没捞到东西，再试一次吧..."';
    this.nameEl.textContent = '空网';
    this.rarityEl.textContent = tidePhase ? tidePhase.name : '-';
    this.rarityEl.className = 'stat-data';
    this.valueEl.textContent = '0 金币';
    
    this.collectBtn.style.display = 'none';
    this.releaseBtn.textContent = '继续';
    
    this.modal.classList.remove('hidden');
  }

  showModal() {
    const c = this.currentCreature;
    const quote = c.quotes[Math.floor(Math.random() * c.quotes.length)];
    const actualValue = calculateCreatureValue(c, c.tier || 1, c.affixes);
    
    this.titleEl.textContent = c.rarity.name === '传说' ? '传说降临！' : 
                              c.rarity.name === '史诗' ? '史诗发现！' :
                              '发现机械残骸！';
    
    this.displayEl.innerHTML = `<span style="font-size: 80px;">${c.icon}</span>`;
    this.displayEl.style.background = `radial-gradient(circle, rgba(${this.hexToRgb(c.rarity.color)}, 0.3) 0%, transparent 70%)`;
    this.quoteEl.textContent = `"${quote}"`;
    this.nameEl.textContent = c.name;
    this.rarityEl.textContent = c.rarity.name;
    this.rarityEl.className = `stat-data ${c.rarity.class}`;
    this.valueEl.textContent = `${actualValue} 金币`;
    
    if (c.affixes && c.affixes.length > 0) {
      const affixNames = c.affixes.map(a => a.name).join('、');
      this.valueEl.textContent += ` | ${affixNames}`;
      this.valueEl.style.fontSize = '12px';
      this.valueEl.style.lineHeight = '1.4';
    }
    
    this.collectBtn.style.display = '';
    this.releaseBtn.textContent = '放生';
    
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
    if (this.currentCreature) {
      const actualValue = calculateCreatureValue(this.currentCreature, this.currentCreature.tier || 1, this.currentCreature.affixes);
      const bonus = Math.floor(actualValue * 0.3);
      this.game.updateStats('coins', bonus);
    }
    
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
