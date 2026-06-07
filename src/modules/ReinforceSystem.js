import {
  AFFIX_POOL,
  AFFIX_CATEGORIES,
  RARITY_MAX_TIER,
  MATERIALS,
  SCRAP_MATERIAL_MAP,
  getUpgradeCost,
  generateRandomAffixes,
  calculateCreatureValue
} from '../data/creatures.js';

export class ReinforceSystem {
  constructor(game) {
    this.game = game;
    this.materials = {};
    this.stats = {
      scrapCount: 0,
      upgradeCount: 0,
      rerollCount: 0,
      maxTierReached: 1
    };

    this.modal = document.getElementById('reinforce-modal');
    this.workshopModal = document.getElementById('workshop-modal');
    this.gridEl = document.getElementById('reinforce-grid');
    this.titleEl = document.getElementById('reinforce-title');
    this.displayEl = document.getElementById('reinforce-display');
    this.nameEl = document.getElementById('reinforce-name');
    this.rarityEl = document.getElementById('reinforce-rarity');
    this.tierEl = document.getElementById('reinforce-tier');
    this.affixesEl = document.getElementById('reinforce-affixes');
    this.costEl = document.getElementById('reinforce-cost');
    this.scrapCostEl = document.getElementById('scrap-reward');
    this.materialsEl = document.getElementById('workshop-materials');

    this.selectedItem = null;

    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btn-close-reinforce').addEventListener('click', () => this.closeReinforce());
    document.getElementById('btn-close-workshop').addEventListener('click', () => this.closeWorkshop());
    document.getElementById('btn-upgrade').addEventListener('click', () => this.upgradeSelected());
    document.getElementById('btn-scrap').addEventListener('click', () => this.scrapSelected());
    document.getElementById('btn-reroll-affix').addEventListener('click', () => this.rerollAffixSelected());
  }

  addMaterial(materialId, count) {
    if (!this.materials[materialId]) {
      this.materials[materialId] = 0;
    }
    const before = this.materials[materialId];
    this.materials[materialId] += count;
    this.game.saveProgress();
    this.renderMaterials();
    this.game.checkTasks('material_change', { id: materialId, change: count, before, after: this.materials[materialId] });
  }

  removeMaterial(materialId, count) {
    if (!this.materials[materialId] || this.materials[materialId] < count) {
      return false;
    }
    const before = this.materials[materialId];
    this.materials[materialId] -= count;
    if (this.materials[materialId] === 0) {
      delete this.materials[materialId];
    }
    this.game.saveProgress();
    this.renderMaterials();
    this.game.checkTasks('material_change', { id: materialId, change: -count, before, after: this.materials[materialId] || 0 });
    return true;
  }

  getMaterialCount(materialId) {
    return this.materials[materialId] || 0;
  }

  getAllMaterials() {
    return { ...this.materials };
  }

  openWorkshop() {
    this.renderWorkshopGrid();
    this.renderMaterials();
    this.workshopModal.classList.remove('hidden');
    this.game.checkTasks('workshop_open');
  }

  closeWorkshop() {
    this.workshopModal.classList.add('hidden');
    this.selectedItem = null;
  }

  openReinforce(item, inventoryIndex) {
    this.selectedItem = { item, inventoryIndex };
    this.renderReinforceDetail();
    this.modal.classList.remove('hidden');
  }

  closeReinforce() {
    this.modal.classList.add('hidden');
    this.selectedItem = null;
  }

  renderWorkshopGrid() {
    this.gridEl.innerHTML = '';
    const items = this.game.inventory.getBackpackItems();

    if (items.length === 0) {
      this.gridEl.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">背包空空如也，快去打捞吧！</p>';
      return;
    }

    items.forEach((item, index) => {
      const slot = document.createElement('div');
      slot.className = `inventory-slot has-item ${item.rarity.class}`;

      const tierDisplay = item.tier && item.tier > 1 ? `<span class="slot-tier">+${item.tier - 1}</span>` : '';

      slot.innerHTML = `
        <div class="slot-rarity-border"></div>
        <span class="slot-icon">${item.icon}</span>
        ${item.count > 1 ? `<span class="slot-count">${item.count}</span>` : ''}
        ${tierDisplay}
      `;
      slot.addEventListener('click', () => {
        this.closeWorkshop();
        this.openReinforce(item, index);
      });
      this.gridEl.appendChild(slot);
    });
  }

  renderMaterials() {
    if (!this.materialsEl) return;
    this.materialsEl.innerHTML = '';

    const materialList = Object.entries(MATERIALS);
    materialList.forEach(([id, mat]) => {
      const count = this.getMaterialCount(id);
      if (count > 0) {
        const chip = document.createElement('div');
        chip.className = 'material-chip';
        chip.innerHTML = `<span>${mat.icon}</span><span>${mat.name}</span><span class="material-count">${count}</span>`;
        this.materialsEl.appendChild(chip);
      }
    });

    if (this.materialsEl.children.length === 0) {
      this.materialsEl.innerHTML = '<span style="color:#666;font-size:12px;">暂无材料，拆解残骸可获得</span>';
    }
  }

  renderReinforceDetail() {
    if (!this.selectedItem) return;
    const { item } = this.selectedItem;
    const tier = item.tier || 1;
    const maxTier = RARITY_MAX_TIER[item.rarity.name] || 3;
    const affixes = item.affixes || [];

    this.titleEl.textContent = '强化工坊';
    this.displayEl.innerHTML = `<span style="font-size:80px;">${item.icon}</span>`;
    this.displayEl.style.background = `radial-gradient(circle, rgba(${this.hexToRgb(item.rarity.color)}, 0.3) 0%, transparent 70%)`;
    this.nameEl.textContent = item.name;
    this.rarityEl.textContent = item.rarity.name;
    this.rarityEl.className = `stat-data ${item.rarity.class}`;
    this.tierEl.textContent = `品阶 Lv.${tier} / ${maxTier}`;

    this.affixesEl.innerHTML = '';
    if (affixes.length > 0) {
      affixes.forEach(affix => {
        const row = document.createElement('div');
        row.className = 'stat-row';
        row.innerHTML = `<span class="stat-name affix-name affix-tier-${affix.tier}">${affix.name}</span><span class="stat-data">${affix.desc}</span>`;
        this.affixesEl.appendChild(row);
      });
    } else {
      this.affixesEl.innerHTML = '<div class="stat-row"><span class="stat-name">词条</span><span class="stat-data" style="color:#666;">无</span></div>';
    }

    const currentValue = calculateCreatureValue(item, tier, affixes);
    const valueRow = document.createElement('div');
    valueRow.className = 'stat-row';
    valueRow.innerHTML = `<span class="stat-name">当前价值</span><span class="stat-data" style="color:#ffaa00;">${currentValue} 金币</span>`;
    this.affixesEl.appendChild(valueRow);

    this.renderUpgradeCost(item, tier, maxTier);
    this.renderScrapReward(item, tier, affixes);
  }

  renderUpgradeCost(item, tier, maxTier) {
    if (!this.costEl) return;

    if (tier >= maxTier) {
      this.costEl.innerHTML = '<p style="color:#ffaa00;text-align:center;">已达最高品阶！</p>';
      document.getElementById('btn-upgrade').disabled = true;
      return;
    }

    let discount = 0;
    if (item.affixes) {
      item.affixes.forEach(a => {
        if (a.upgradeCostDiscount) discount += a.upgradeCostDiscount;
      });
    }

    const cost = getUpgradeCost(item.rarity, tier);
    const discountedCoins = Math.floor(cost.coins * (1 - discount));

    let html = `<p style="margin-bottom:8px;"><strong>升阶消耗:</strong></p>`;
    html += `<p>💰 金币: ${discountedCoins}${discount > 0 ? ` <span style="color:#44ff44;">(-${Math.floor(discount*100)}%)</span>` : ''}</p>`;

    let canAfford = this.game.stats.coins >= discountedCoins;
    cost.materials.forEach(mc => {
      const mat = MATERIALS[mc.material];
      const owned = this.getMaterialCount(mc.material);
      const enough = owned >= mc.count;
      if (!enough) canAfford = false;
      html += `<p>${mat.icon} ${mat.name}: <span class="${enough ? '' : 'cost-insufficient'}">${owned}/${mc.count}</span></p>`;
    });

    this.costEl.innerHTML = html;
    document.getElementById('btn-upgrade').disabled = !canAfford;
  }

  renderScrapReward(item, tier, affixes) {
    if (!this.scrapCostEl) return;

    let bonusMultiplier = 1 + (tier - 1) * 0.15;
    if (affixes) {
      affixes.forEach(a => {
        if (a.scrapBonus) bonusMultiplier += a.scrapBonus;
      });
    }

    const materialMap = SCRAP_MATERIAL_MAP[item.rarity.name] || [];
    let html = `<p style="margin-bottom:8px;"><strong>拆解产出:</strong></p>`;
    const baseValue = calculateCreatureValue(item, tier, affixes);
    const coinReturn = Math.floor(baseValue * 0.4);
    html += `<p>💰 金币返还: ${coinReturn}</p>`;

    materialMap.forEach(m => {
      const mat = MATERIALS[m.material];
      const minCount = Math.ceil(m.min * bonusMultiplier);
      const maxCount = Math.ceil(m.max * bonusMultiplier);
      if (maxCount > 0) {
        html += `<p>${mat.icon} ${mat.name}: ${minCount}~${maxCount}</p>`;
      }
    });

    this.scrapCostEl.innerHTML = html;
  }

  upgradeSelected() {
    if (!this.selectedItem) return;
    const { item, inventoryIndex } = this.selectedItem;
    const tier = item.tier || 1;
    const maxTier = RARITY_MAX_TIER[item.rarity.name] || 3;

    if (tier >= maxTier) return;

    let discount = 0;
    if (item.affixes) {
      item.affixes.forEach(a => {
        if (a.upgradeCostDiscount) discount += a.upgradeCostDiscount;
      });
    }

    const cost = getUpgradeCost(item.rarity, tier);
    const discountedCoins = Math.floor(cost.coins * (1 - discount));

    if (this.game.stats.coins < discountedCoins) {
      this.game.taskSystem.showHint('金币不足！');
      return;
    }

    for (const mc of cost.materials) {
      if (this.getMaterialCount(mc.material) < mc.count) {
        this.game.taskSystem.showHint(`材料不足：${MATERIALS[mc.material].name}`);
        return;
      }
    }

    this.game.updateStats('coins', -discountedCoins);
    cost.materials.forEach(mc => this.removeMaterial(mc.material, mc.count));

    const newTier = tier + 1;
    const backpackItem = this.game.inventory.backpack[inventoryIndex];
    if (backpackItem) {
      backpackItem.tier = newTier;

      let luckBonus = 0;
      if (backpackItem.affixes) {
        backpackItem.affixes.forEach(a => {
          if (a.affixLuckBonus) luckBonus += a.affixLuckBonus;
        });
      }

      if (Math.random() < 0.25 + luckBonus && backpackItem.affixes && backpackItem.affixes.length > 0) {
        this.upgradeRandomAffix(backpackItem);
      }

      this.stats.upgradeCount++;
      if (newTier > this.stats.maxTierReached) {
        this.stats.maxTierReached = newTier;
      }
    }

    this.game.saveProgress();
    this.game.checkTasks('upgrade_success');
    this.game.checkTasks('upgrade_tier', newTier);
    if (this.game.guildSystem) {
      this.game.guildSystem.recordPlayerAction('reinforce_success', 1);
    }
    this.game.taskSystem.showHint(`升阶成功！当前品阶 Lv.${newTier}`);
    this.renderReinforceDetail();
    this.game.inventory.renderBackpack();
  }

  upgradeRandomAffix(item) {
    if (!item.affixes || item.affixes.length === 0) return;

    const idx = Math.floor(Math.random() * item.affixes.length);
    const oldAffix = item.affixes[idx];
    const pool = AFFIX_POOL[oldAffix.category];
    const currentTierIdx = pool.findIndex(a => a.id === oldAffix.id);
    if (currentTierIdx < pool.length - 1) {
      const newAffix = pool[currentTierIdx + 1];
      item.affixes[idx] = { ...newAffix, category: oldAffix.category };
      this.game.taskSystem.showHint(`词条强化：${oldAffix.name} → ${newAffix.name}！`);
    }
  }

  scrapSelected() {
    if (!this.selectedItem) return;
    const { item, inventoryIndex } = this.selectedItem;
    const tier = item.tier || 1;
    const affixes = item.affixes || [];

    let bonusMultiplier = 1 + (tier - 1) * 0.15;
    affixes.forEach(a => {
      if (a.scrapBonus) bonusMultiplier += a.scrapBonus;
    });

    const baseValue = calculateCreatureValue(item, tier, affixes);
    const coinReturn = Math.floor(baseValue * 0.4);
    this.game.updateStats('coins', coinReturn);

    const materialMap = SCRAP_MATERIAL_MAP[item.rarity.name] || [];
    const rewards = [];
    materialMap.forEach(m => {
      const minCount = Math.ceil(m.min * bonusMultiplier);
      const maxCount = Math.ceil(m.max * bonusMultiplier);
      if (maxCount > 0) {
        const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
        if (count > 0) {
          this.addMaterial(m.material, count);
          rewards.push(`${MATERIALS[m.material].icon}${MATERIALS[m.material].name}x${count}`);
        }
      }
    });

    const backpackItem = this.game.inventory.backpack[inventoryIndex];
    if (backpackItem) {
      if (backpackItem.count > 1) {
        backpackItem.count--;
      } else {
        this.game.inventory.backpack.splice(inventoryIndex, 1);
      }
    }

    this.stats.scrapCount++;
    this.game.saveProgress();
    this.game.checkTasks('scrap_count');
    const rewardStr = rewards.length > 0 ? `，获得 ${rewards.join(' ')}` : '';
    this.game.taskSystem.showHint(`拆解成功！获得 ${coinReturn} 金币${rewardStr}`);
    this.closeReinforce();
    this.game.inventory.renderBackpack();
  }

  rerollAffixSelected() {
    if (!this.selectedItem) return;
    const { item, inventoryIndex } = this.selectedItem;
    const tier = item.tier || 1;

    const rerollCost = 50 * tier;
    if (this.game.stats.coins < rerollCost) {
      this.game.taskSystem.showHint(`金币不足！重铸需要 ${rerollCost} 金币`);
      return;
    }

    this.game.updateStats('coins', -rerollCost);
    const newAffixes = generateRandomAffixes(item);

    const backpackItem = this.game.inventory.backpack[inventoryIndex];
    if (backpackItem) {
      backpackItem.affixes = newAffixes;
    }

    this.stats.rerollCount++;
    this.game.saveProgress();
    this.game.checkTasks('reroll_count');
    this.game.taskSystem.showHint('词条重铸完成！');
    this.renderReinforceDetail();
  }

  hexToRgb(hex) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `${r}, ${g}, ${b}`;
  }

  toJSON() {
    return {
      materials: this.materials,
      stats: this.stats
    };
  }

  loadData(data) {
    if (data) {
      if (data.materials) {
        this.materials = { ...data.materials };
      }
      if (data.stats) {
        this.stats = { ...this.stats, ...data.stats };
      }
    }
  }
}
