import { CREATURES, RARITY_MAX_TIER, calculateCreatureValue } from '../data/creatures.js';

export class Inventory {
  constructor(game) {
    this.game = game;
    this.backpack = [];
    this.collection = new Set();
    this.maxSlots = 20;
    this.selectedItem = null;
    
    this.backpackModal = document.getElementById('backpack-modal');
    this.backpackGrid = document.getElementById('backpack-grid');
    this.collectionModal = document.getElementById('collection-modal');
    this.collectionGrid = document.getElementById('collection-grid');
    this.collectionProgress = document.getElementById('collection-progress');
    this.detailModal = document.getElementById('item-detail-modal');
    
    this.detailDisplay = document.getElementById('detail-display');
    this.detailQuote = document.getElementById('detail-quote');
    this.detailName = document.getElementById('detail-name');
    this.detailRarity = document.getElementById('detail-rarity');
    this.detailDesc = document.getElementById('detail-desc');
    this.detailCount = document.getElementById('detail-count');
    this.detailTitle = document.getElementById('detail-title');
    
    this.sellBtn = document.getElementById('btn-sell-item');
    
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btn-close-backpack').addEventListener('click', () => this.closeBackpack());
    document.getElementById('btn-close-collection').addEventListener('click', () => this.closeCollection());
    document.getElementById('btn-close-detail').addEventListener('click', () => this.closeDetail());
    this.sellBtn.addEventListener('click', () => this.sellSelectedItem());
    document.getElementById('btn-reinforce-item').addEventListener('click', () => this.openReinforceFromDetail());
  }

  addToBackpack(creature) {
    const affixKey = (creature.affixes || []).map(a => a.id).sort().join('|');
    const existing = this.backpack.find(item => 
      item.id === creature.id && 
      (item.tier || 1) === (creature.tier || 1) &&
      ((item.affixes || []).map(a => a.id).sort().join('|') === affixKey)
    );
    if (existing) {
      existing.count++;
    } else {
      if (this.backpack.length >= this.maxSlots) {
        return false;
      }
      this.backpack.push({ 
        ...creature, 
        count: 1,
        tier: creature.tier || 1,
        affixes: creature.affixes || []
      });
    }
    
    this.collection.add(creature.id);
    this.game.saveProgress();
    return true;
  }

  getBackpackItems() {
    return this.backpack;
  }

  getCollection() {
    return this.collection;
  }

  openBackpack() {
    this.renderBackpack();
    this.backpackModal.classList.remove('hidden');
    this.game.checkTasks('backpack_open');
  }

  closeBackpack() {
    this.backpackModal.classList.add('hidden');
  }

  openCollection() {
    this.renderCollection();
    this.collectionModal.classList.remove('hidden');
  }

  closeCollection() {
    this.collectionModal.classList.add('hidden');
  }

  renderBackpack() {
    this.backpackGrid.innerHTML = '';
    
    for (let i = 0; i < this.maxSlots; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      
      if (i < this.backpack.length) {
        const item = this.backpack[i];
        const tier = item.tier || 1;
        slot.className += ` has-item ${item.rarity.class}`;
        slot.innerHTML = `
          <div class="slot-rarity-border"></div>
          <span class="slot-icon">${item.icon}</span>
          ${item.count > 1 ? `<span class="slot-count">${item.count}</span>` : ''}
          ${tier > 1 ? `<span class="slot-tier">+${tier - 1}</span>` : ''}
        `;
        slot.addEventListener('click', () => {
          if (this.game.chamber) {
            const handled = this.game.chamber.tryServeItemFromBackpack(item, i);
            if (handled) return;
            const orderHandled = this.game.chamber.tryFulfillOrderFromBackpack(item, i);
            if (orderHandled) return;
            const bmSellHandled = this.game.chamber.tryBlackMarketSellFromBackpack(item, i);
            if (bmSellHandled) return;
            const bmOrderHandled = this.game.chamber.tryBlackMarketFulfillOrderFromBackpack(item, i);
            if (bmOrderHandled) return;
          }
          this.showItemDetail(item, 'backpack', i);
        });
      }
      
      this.backpackGrid.appendChild(slot);
    }
  }

  renderCollection() {
    this.collectionGrid.innerHTML = '';
    const collected = this.collection.size;
    const total = CREATURES.length;
    this.collectionProgress.textContent = `${collected}/${total}`;
    
    CREATURES.forEach(creature => {
      const slot = document.createElement('div');
      const isCollected = this.collection.has(creature.id);
      
      slot.className = `inventory-slot ${isCollected ? 'has-item ' + creature.rarity.class : 'locked'}`;
      
      if (isCollected) {
        slot.innerHTML = `
          <div class="slot-rarity-border"></div>
          <span class="slot-icon">${creature.icon}</span>
        `;
        slot.addEventListener('click', () => this.showItemDetail(creature, 'collection'));
      } else {
        slot.innerHTML = `
          <span class="slot-icon" style="opacity: 0.3;">❓</span>
        `;
      }
      
      this.collectionGrid.appendChild(slot);
    });
  }

  showItemDetail(item, source, index = -1) {
    this.selectedItem = { item, source, index };
    
    const quote = item.quotes[Math.floor(Math.random() * item.quotes.length)];
    const tier = item.tier || 1;
    const maxTier = RARITY_MAX_TIER[item.rarity.name] || 3;
    const affixes = item.affixes || [];
    const actualValue = calculateCreatureValue(item, tier, affixes);
    
    this.detailTitle.textContent = source === 'backpack' ? '物品详情' : '图鉴详情';
    this.detailDisplay.innerHTML = `<span style="font-size: 80px;">${item.icon}</span>`;
    this.detailDisplay.style.background = `radial-gradient(circle, rgba(${this.hexToRgb(item.rarity.color)}, 0.3) 0%, transparent 70%)`;
    this.detailQuote.textContent = `"${quote}"`;
    this.detailName.textContent = item.name;
    this.detailRarity.textContent = item.rarity.name;
    this.detailRarity.className = `stat-data ${item.rarity.class}`;
    
    const tierEl = document.getElementById('detail-tier');
    if (tierEl) {
      if (source === 'backpack') {
        tierEl.textContent = `Lv.${tier} / ${maxTier}`;
      } else {
        tierEl.textContent = `最高 Lv.${maxTier}`;
      }
    }
    
    this.detailDesc.textContent = item.desc;
    
    const affixesEl = document.getElementById('detail-affixes');
    const affixesRowEl = document.getElementById('detail-affixes-row');
    if (affixesEl && affixesRowEl) {
      if (source === 'backpack' && affixes.length > 0) {
        affixesRowEl.style.display = '';
        affixesEl.innerHTML = affixes.map(a => 
          `<span class="affix-name affix-tier-${a.tier}">${a.name}</span> <span style="color:#888;font-size:12px;">(${a.desc})</span>`
        ).join('<br>');
      } else {
        affixesRowEl.style.display = 'none';
      }
    }
    
    const reinforceBtn = document.getElementById('btn-reinforce-item');
    if (source === 'backpack') {
      const backpackItem = index >= 0 ? this.backpack[index] : this.backpack.find(i => i.id === item.id);
      const count = backpackItem ? backpackItem.count : 0;
      this.detailCount.textContent = `${count} (价值 ${actualValue}金/个)`;
      this.sellBtn.style.display = '';
      this.sellBtn.textContent = `出售 (${Math.floor(actualValue)}金)`;
      if (reinforceBtn) reinforceBtn.style.display = '';
    } else {
      this.detailCount.textContent = '已收集';
      this.sellBtn.style.display = 'none';
      if (reinforceBtn) reinforceBtn.style.display = 'none';
    }
    
    this.detailModal.classList.remove('hidden');
  }

  closeDetail() {
    this.detailModal.classList.add('hidden');
    this.selectedItem = null;
  }

  openReinforceFromDetail() {
    if (!this.selectedItem || this.selectedItem.source !== 'backpack') return;
    const { item, index } = this.selectedItem;
    const invIndex = index >= 0 ? index : this.backpack.findIndex(i => i.id === item.id);
    if (invIndex < 0) return;
    this.closeDetail();
    this.game.reinforceSystem.openReinforce(this.backpack[invIndex], invIndex);
  }

  sellSelectedItem() {
    if (!this.selectedItem || this.selectedItem.source !== 'backpack') return;
    
    const item = this.selectedItem.item;
    const index = this.selectedItem.index;
    const backpackItem = index >= 0 ? this.backpack[index] : this.backpack.find(i => i.id === item.id);
    
    if (backpackItem) {
      const actualValue = calculateCreatureValue(backpackItem, backpackItem.tier || 1, backpackItem.affixes);
      this.game.updateStats('coins', actualValue);
      
      if (backpackItem.count > 1) {
        backpackItem.count--;
      } else {
        const idx = index >= 0 ? index : this.backpack.findIndex(i => i.id === item.id);
        if (idx > -1) {
          this.backpack.splice(idx, 1);
        }
      }
      
      this.game.saveProgress();
      this.closeDetail();
      this.renderBackpack();
    }
  }

  getRarityCount(rarity) {
    return this.backpack
      .filter(item => item.rarity === rarity)
      .reduce((sum, item) => sum + item.count, 0);
  }

  hexToRgb(hex) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `${r}, ${g}, ${b}`;
  }

  loadData(data) {
    if (data.backpack) {
      this.backpack = data.backpack.map(savedItem => {
        const creature = CREATURES.find(c => c.id === savedItem.id);
        if (creature) {
          return { 
            ...creature, 
            count: savedItem.count,
            tier: savedItem.tier || 1,
            affixes: savedItem.affixes || []
          };
        }
        return null;
      }).filter(Boolean);
    }
    
    if (data.collection) {
      this.collection = new Set(data.collection);
    }
  }

  toJSON() {
    return {
      backpack: this.backpack.map(item => ({ 
        id: item.id, 
        count: item.count,
        tier: item.tier || 1,
        affixes: item.affixes || []
      })),
      collection: Array.from(this.collection)
    };
  }
}
