import { CREATURES } from '../data/creatures.js';

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
  }

  addToBackpack(creature) {
    const existing = this.backpack.find(item => item.id === creature.id);
    if (existing) {
      existing.count++;
    } else {
      if (this.backpack.length >= this.maxSlots) {
        return false;
      }
      this.backpack.push({ ...creature, count: 1 });
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
        slot.className += ` has-item ${item.rarity.class}`;
        slot.innerHTML = `
          <div class="slot-rarity-border"></div>
          <span class="slot-icon">${item.icon}</span>
          ${item.count > 1 ? `<span class="slot-count">${item.count}</span>` : ''}
        `;
        slot.addEventListener('click', () => this.showItemDetail(item, 'backpack'));
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

  showItemDetail(item, source) {
    this.selectedItem = { item, source };
    
    const quote = item.quotes[Math.floor(Math.random() * item.quotes.length)];
    
    this.detailTitle.textContent = source === 'backpack' ? '物品详情' : '图鉴详情';
    this.detailDisplay.innerHTML = `<span style="font-size: 80px;">${item.icon}</span>`;
    this.detailDisplay.style.background = `radial-gradient(circle, rgba(${this.hexToRgb(item.rarity.color)}, 0.3) 0%, transparent 70%)`;
    this.detailQuote.textContent = `"${quote}"`;
    this.detailName.textContent = item.name;
    this.detailRarity.textContent = item.rarity.name;
    this.detailRarity.className = `stat-data ${item.rarity.class}`;
    this.detailDesc.textContent = item.desc;
    
    if (source === 'backpack') {
      const backpackItem = this.backpack.find(i => i.id === item.id);
      this.detailCount.textContent = backpackItem ? backpackItem.count : 0;
      this.sellBtn.style.display = 'block';
    } else {
      this.detailCount.textContent = '已收集';
      this.sellBtn.style.display = 'none';
    }
    
    this.detailModal.classList.remove('hidden');
  }

  closeDetail() {
    this.detailModal.classList.add('hidden');
    this.selectedItem = null;
  }

  sellSelectedItem() {
    if (!this.selectedItem || this.selectedItem.source !== 'backpack') return;
    
    const item = this.selectedItem.item;
    const backpackItem = this.backpack.find(i => i.id === item.id);
    
    if (backpackItem) {
      this.game.updateStats('coins', item.value);
      
      if (backpackItem.count > 1) {
        backpackItem.count--;
      } else {
        const index = this.backpack.findIndex(i => i.id === item.id);
        if (index > -1) {
          this.backpack.splice(index, 1);
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
          return { ...creature, count: savedItem.count };
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
      backpack: this.backpack.map(item => ({ id: item.id, count: item.count })),
      collection: Array.from(this.collection)
    };
  }
}
