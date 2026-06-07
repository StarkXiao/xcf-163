import { CREATURES, RARITY_MAX_TIER, calculateCreatureValue } from '../data/creatures.js';
import {
  HULL_MOD_CATEGORIES,
  HULL_NETS,
  HULL_CORES,
  ALL_HULL_MODS,
  getHullModById,
  getHullNets,
  getHullCores,
  calculateNetRange,
  calculateCatchRate,
  calculateNetRarityBoost,
  calculateEnergyRegenRate,
  calculateEnergyCostMultiplier,
  calculateMaxEnergyBonus
} from '../data/hullMods.js';

export class Inventory {
  constructor(game) {
    this.game = game;
    this.backpack = [];
    this.collection = new Set();
    this.rarityCatchStats = {};
    this.creatureCatchTotal = {};
    this.maxSlots = 20;
    this.selectedItem = null;

    this.ownedHullMods = {
      basic_net: true,
      basic_core: true
    };
    this.equippedNet = HULL_NETS.basic_net;
    this.equippedCore = HULL_CORES.basic_core;

    this.hullModal = document.getElementById('hull-mod-modal');
    this.hullTabBtns = null;
    this.hullTabContents = null;
    this.currentHullTab = 'status';
    
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
    document.getElementById('btn-codex-lab').addEventListener('click', () => this.openCodexLabFromDetail());

    const hullBtn = document.getElementById('btn-hull-mod');
    if (hullBtn) {
      hullBtn.addEventListener('click', () => this.openHullMod());
    }
    const closeHullBtn = document.getElementById('btn-close-hull-mod');
    if (closeHullBtn) {
      closeHullBtn.addEventListener('click', () => this.closeHullMod());
    }
    this.hullTabBtns = document.querySelectorAll('.hull-mod-tab');
    this.hullTabContents = document.querySelectorAll('.hull-mod-tab-content');
    if (this.hullTabBtns) {
      this.hullTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          this.switchHullTab(tab);
        });
      });
    }
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
    
    const isNewToCollection = !this.collection.has(creature.id);

    const rarityName = creature.rarity?.name;
    if (rarityName) {
      this.rarityCatchStats[rarityName] = (this.rarityCatchStats[rarityName] || 0) + 1;
    }

    if (this.game.portCommission) {
      this.game.portCommission.checkCollectionUpdate(creature, isNewToCollection);
    }

    this.collection.add(creature.id);
    this.creatureCatchTotal[creature.id] = (this.creatureCatchTotal[creature.id] || 0) + 1;
    this.game.checkTasks('collect_creature', creature);

    if (this.game.codexLab) {
      this.game.codexLab.checkAndGrantUnlocks(creature.id);
    }

    if (this.game.storySystem) {
      this.game.storySystem.onGameEvent('unique_collected');
      this.game.storySystem.onGameEvent('collect_rarity', creature);
    }

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
          if (this.game.portCommission) {
            const portHandled = this.game.portCommission.trySubmitBackpackItem(item, i);
            if (portHandled && portHandled.success) {
              this.game.taskSystem.showHint(portHandled.message);
              return;
            }
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
    const codexLabBtn = document.getElementById('btn-codex-lab');
    if (source === 'backpack') {
      const backpackItem = index >= 0 ? this.backpack[index] : this.backpack.find(i => i.id === item.id);
      const count = backpackItem ? backpackItem.count : 0;
      this.detailCount.textContent = `${count} (价值 ${actualValue}金/个)`;
      this.sellBtn.style.display = '';
      this.sellBtn.textContent = `出售 (${Math.floor(actualValue)}金)`;
      if (reinforceBtn) reinforceBtn.style.display = '';
      if (codexLabBtn) codexLabBtn.style.display = 'none';
    } else {
      this.detailCount.textContent = '已收集';
      this.sellBtn.style.display = 'none';
      if (reinforceBtn) reinforceBtn.style.display = 'none';
      if (codexLabBtn) codexLabBtn.style.display = '';
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

  openCodexLabFromDetail() {
    if (!this.selectedItem) return;
    const { item } = this.selectedItem;
    this.closeDetail();
    if (this.game.codexLab) {
      this.game.codexLab.openLab(item.id);
    }
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

  getTotalCaughtByRarityName(rarityName) {
    return this.rarityCatchStats[rarityName] || 0;
  }

  getCreatureCount(creatureId) {
    return this.backpack
      .filter(item => item.id === creatureId)
      .reduce((sum, item) => sum + item.count, 0);
  }

  getCumulativeCreatureCount(creatureId) {
    return this.creatureCatchTotal[creatureId] || 0;
  }

  hexToRgb(hex) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `${r}, ${g}, ${b}`;
  }

  openHullMod() {
    if (!this.hullModal) return;
    this.hullModal.classList.remove('hidden');
    this.switchHullTab('status');
    this.game.checkTasks('hull_mod_open');
  }

  closeHullMod() {
    if (!this.hullModal) return;
    this.hullModal.classList.add('hidden');
  }

  switchHullTab(tab) {
    this.currentHullTab = tab;
    if (this.hullTabBtns) {
      this.hullTabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
      });
    }
    if (this.hullTabContents) {
      this.hullTabContents.forEach(content => {
        content.classList.toggle('hidden', content.dataset.tab !== tab);
      });
    }
    this.renderHullModAll();
  }

  renderHullModAll() {
    this.renderHullStatus();
    this.renderHullNets();
    this.renderHullCores();
    this.renderHullShop();
  }

  getEquippedNet() {
    return this.equippedNet;
  }

  getEquippedCore() {
    return this.equippedCore;
  }

  getNetRange() {
    return calculateNetRange(this.equippedNet);
  }

  getCatchRate() {
    return calculateCatchRate(this.equippedNet);
  }

  getNetRarityBoost(rarityKey) {
    return calculateNetRarityBoost(this.equippedNet, rarityKey);
  }

  getEnergyRegenRate() {
    return calculateEnergyRegenRate(this.equippedCore);
  }

  getEnergyCostMultiplier() {
    return calculateEnergyCostMultiplier(this.equippedCore);
  }

  getMaxEnergyBonus() {
    return calculateMaxEnergyBonus(this.equippedCore);
  }

  getEquippedNetStats() {
    return this.equippedNet?.stats || null;
  }

  getEquippedCoreStats() {
    return this.equippedCore?.stats || null;
  }

  ownsHullMod(modId) {
    return !!this.ownedHullMods[modId];
  }

  purchaseHullMod(modId) {
    const mod = getHullModById(modId);
    if (!mod) return false;
    if (this.ownsHullMod(modId)) return false;
    if (this.game.stats.coins < mod.price) {
      this.game.taskSystem.showHint(`金币不足！需要 ${mod.price} 金币`);
      return false;
    }
    this.game.updateStats('coins', -mod.price);
    this.ownedHullMods[modId] = true;
    this.game.saveProgress();
    this.game.taskSystem.showHint(`✅ 成功购买「${mod.name}」！`);
    this.game.checkTasks('hull_mod_purchase', mod);
    this.renderHullModAll();
    return true;
  }

  equipHullMod(modId) {
    const mod = getHullModById(modId);
    if (!mod) return false;
    if (!this.ownsHullMod(modId)) return false;

    if (mod.category === 'net') {
      this.equippedNet = mod;
    } else if (mod.category === 'core') {
      this.equippedCore = mod;
    }

    this.game.saveProgress();
    this.game.taskSystem.showHint(`🚀 已装备「${mod.name}」`);
    this.game.checkTasks('hull_mod_equip', mod);
    this.renderHullModAll();
    return true;
  }

  renderHullStatus() {
    const el = document.getElementById('hull-status');
    if (!el) return;

    const net = this.equippedNet;
    const core = this.equippedCore;
    const netRange = this.getNetRange();
    const catchRate = this.getCatchRate();
    const energyRegen = this.getEnergyRegenRate();
    const energyCost = this.getEnergyCostMultiplier();
    const maxEnergyBonus = this.getMaxEnergyBonus();

    const rarityBoostText = [];
    if (net.stats?.rarityBoost) {
      Object.entries(net.stats.rarityBoost).forEach(([k, v]) => {
        if (v > 1.0) {
          const nameMap = { common: '普通', uncommon: '优秀', rare: '稀有', epic: '史诗', legendary: '传说' };
          rarityBoostText.push(`${nameMap[k] || k} +${Math.round((v - 1) * 100)}%`);
        }
      });
    }

    el.innerHTML = `
      <p class="chamber-hint">当前船体装备状态，改装会影响打捞效率和收益</p>
      <div class="hull-equipped-display">
        <div class="hull-equipped-card ${net.rarity.class}">
          <div class="hull-equipped-header">
            <span class="hull-equipped-icon">${net.icon}</span>
            <div>
              <div class="hull-equipped-name">${net.name}</div>
              <div class="hull-equipped-type">${HULL_MOD_CATEGORIES.net.icon} ${HULL_MOD_CATEGORIES.net.name}</div>
            </div>
          </div>
          <div class="hull-equipped-desc">${net.desc}</div>
          <div class="hull-equipped-stats">
            <span>🎯 拖网范围: ×${netRange.toFixed(1)}</span>
            <span>🎣 捕获率: ${Math.round(catchRate * 100)}%</span>
            ${rarityBoostText.length > 0 ? `<span style="color:#ffaa00;">💎 ${rarityBoostText.join(' · ')}</span>` : ''}
          </div>
        </div>
        <div class="hull-equipped-card ${core.rarity.class}">
          <div class="hull-equipped-header">
            <span class="hull-equipped-icon">${core.icon}</span>
            <div>
              <div class="hull-equipped-name">${core.name}</div>
              <div class="hull-equipped-type">${HULL_MOD_CATEGORIES.core.icon} ${HULL_MOD_CATEGORIES.core.name}</div>
            </div>
          </div>
          <div class="hull-equipped-desc">${core.desc}</div>
          <div class="hull-equipped-stats">
            <span>⚡ 能量恢复: ×${energyRegen.toFixed(1)}</span>
            <span>💠 能量消耗: ${Math.round(energyCost * 100)}%</span>
            ${maxEnergyBonus > 0 ? `<span style="color:#00ffff;">🔋 能量上限: +${maxEnergyBonus}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderHullNets() {
    const el = document.getElementById('hull-nets');
    if (!el) return;

    const nets = getHullNets();
    el.innerHTML = `
      <p class="chamber-hint">拖网决定拖网范围、捕获率和稀有掉落加成</p>
      <div class="hull-mod-list">
        ${nets.map(net => this.renderHullModCard(net)).join('')}
      </div>
    `;

    el.querySelectorAll('[data-hull-mod-action]').forEach(btn => {
      const modId = btn.dataset.modId;
      const action = btn.dataset.hullModAction;
      if (action === 'purchase') {
        btn.addEventListener('click', () => this.purchaseHullMod(modId));
      } else if (action === 'equip') {
        btn.addEventListener('click', () => this.equipHullMod(modId));
      }
    });
  }

  renderHullCores() {
    const el = document.getElementById('hull-cores');
    if (!el) return;

    const cores = getHullCores();
    el.innerHTML = `
      <p class="chamber-hint">动力核心决定能量恢复速度、消耗和能量上限</p>
      <div class="hull-mod-list">
        ${cores.map(core => this.renderHullModCard(core)).join('')}
      </div>
    `;

    el.querySelectorAll('[data-hull-mod-action]').forEach(btn => {
      const modId = btn.dataset.modId;
      const action = btn.dataset.hullModAction;
      if (action === 'purchase') {
        btn.addEventListener('click', () => this.purchaseHullMod(modId));
      } else if (action === 'equip') {
        btn.addEventListener('click', () => this.equipHullMod(modId));
      }
    });
  }

  renderHullModCard(mod) {
    const owned = this.ownsHullMod(mod.id);
    const equipped = (mod.category === 'net' && this.equippedNet?.id === mod.id) ||
                     (mod.category === 'core' && this.equippedCore?.id === mod.id);
    const canAfford = this.game.stats.coins >= mod.price;

    let statsHtml = '';
    if (mod.category === 'net') {
      const range = mod.stats.netRange;
      const rate = mod.stats.catchRate;
      statsHtml += `<span>🎯 范围: ×${range.toFixed(1)}</span>`;
      statsHtml += `<span>🎣 捕获率: ${Math.round(rate * 100)}%</span>`;
      if (mod.stats.rarityBoost) {
        const boosts = Object.entries(mod.stats.rarityBoost).filter(([, v]) => v > 1.0);
        if (boosts.length > 0) {
          const nameMap = { common: '普通', uncommon: '优秀', rare: '稀有', epic: '史诗', legendary: '传说' };
          const txt = boosts.map(([k, v]) => `${nameMap[k] || k}+${Math.round((v - 1) * 100)}%`).join(' ');
          statsHtml += `<span style="color:#ffaa00;">💎 ${txt}</span>`;
        }
      }
    } else if (mod.category === 'core') {
      const regen = mod.stats.energyRegenRate;
      const cost = mod.stats.energyCostMultiplier;
      statsHtml += `<span>⚡ 恢复: ×${regen.toFixed(1)}</span>`;
      statsHtml += `<span>💠 消耗: ${Math.round(cost * 100)}%</span>`;
      if (mod.stats.maxEnergyBonus > 0) {
        statsHtml += `<span style="color:#00ffff;">🔋 上限: +${mod.stats.maxEnergyBonus}</span>`;
      }
    }

    let actionHtml = '';
    if (equipped) {
      actionHtml = `<button class="modal-btn accent full-width" disabled>✅ 已装备</button>`;
    } else if (owned) {
      actionHtml = `<button class="modal-btn primary full-width" data-mod-id="${mod.id}" data-hull-mod-action="equip">⚙️ 装备</button>`;
    } else if (mod.price === 0) {
      actionHtml = `<button class="modal-btn secondary full-width" disabled>初始装备</button>`;
    } else {
      actionHtml = `<button class="modal-btn accent full-width" data-mod-id="${mod.id}" data-hull-mod-action="purchase" ${canAfford ? '' : 'disabled'}>💰 购买 ${mod.price}💰</button>`;
    }

    return `
      <div class="hull-mod-card ${mod.rarity.class} ${equipped ? 'equipped' : ''}">
        <div class="hull-mod-header">
          <span class="hull-mod-icon">${mod.icon}</span>
          <div class="hull-mod-info">
            <div class="hull-mod-name">${mod.name}</div>
            <div class="hull-mod-rarity">${mod.rarity.name} · T${mod.tier}</div>
          </div>
        </div>
        <div class="hull-mod-desc">${mod.desc}</div>
        <div class="hull-mod-stats">
          ${statsHtml}
        </div>
        <div class="hull-mod-action">
          ${actionHtml}
        </div>
      </div>
    `;
  }

  renderHullShop() {
    const el = document.getElementById('hull-shop');
    if (!el) return;

    const allMods = [...getHullNets().filter(m => m.price > 0), ...getHullCores().filter(m => m.price > 0)];
    el.innerHTML = `
      <p class="chamber-hint">在船坞商店购买更好的船体改装部件</p>
      <div class="hull-mod-list">
        ${allMods.map(mod => this.renderHullModCard(mod)).join('')}
      </div>
    `;

    el.querySelectorAll('[data-hull-mod-action]').forEach(btn => {
      const modId = btn.dataset.modId;
      const action = btn.dataset.hullModAction;
      if (action === 'purchase') {
        btn.addEventListener('click', () => this.purchaseHullMod(modId));
      } else if (action === 'equip') {
        btn.addEventListener('click', () => this.equipHullMod(modId));
      }
    });
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

    if (data.rarityCatchStats) {
      this.rarityCatchStats = { ...data.rarityCatchStats };
    }

    if (data.creatureCatchTotal) {
      this.creatureCatchTotal = { ...data.creatureCatchTotal };
    } else {
      this.creatureCatchTotal = {};
      this.backpack.forEach(item => {
        this.creatureCatchTotal[item.id] = Math.max(this.creatureCatchTotal[item.id] || 0, item.count);
      });
    }

    if (data.ownedHullMods) {
      this.ownedHullMods = { ...data.ownedHullMods };
    }
    if (data.equippedNetId) {
      const net = getHullModById(data.equippedNetId);
      if (net && net.category === 'net') this.equippedNet = net;
    }
    if (data.equippedCoreId) {
      const core = getHullModById(data.equippedCoreId);
      if (core && core.category === 'core') this.equippedCore = core;
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
      collection: Array.from(this.collection),
      rarityCatchStats: { ...this.rarityCatchStats },
      creatureCatchTotal: { ...this.creatureCatchTotal },
      ownedHullMods: { ...this.ownedHullMods },
      equippedNetId: this.equippedNet?.id,
      equippedCoreId: this.equippedCore?.id
    };
  }
}
