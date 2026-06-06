import {
  SCRAP_PARTS,
  PART_CATEGORIES,
  EQUIPMENT_TYPES,
  EQUIPMENT_RECIPES,
  getDisassembleParts,
  findRecipesBySinglePart,
  hasAllParts,
  calculateExperimentPenalty,
  getRecipeValue
} from '../data/scrapWorkshop.js';
import { calculateCreatureValue, RARITY_MAX_TIER } from '../data/creatures.js';

export class ScrapWorkshop {
  constructor(game) {
    this.game = game;
    this.parts = {};
    this.equipment = [];
    this.discoveredRecipes = new Set();
    this.stats = {
      disassembleCount: 0,
      assembleSuccessCount: 0,
      assembleFailCount: 0,
      experimentCount: 0,
      maxRarityCrafted: null
    };

    this.modal = document.getElementById('scrap-workshop-modal');
    this.partsEl = document.getElementById('workshop-parts-bar');
    this.tabsEl = document.querySelectorAll('.workshop-tab');
    this.tabContents = document.querySelectorAll('.workshop-tab-content');

    this.disassembleGrid = document.getElementById('disassemble-grid');
    this.disassembleDetail = document.getElementById('disassemble-detail');

    this.recipeList = document.getElementById('recipe-list');
    this.recipeDetail = document.getElementById('recipe-detail');

    this.experimentSlots = document.getElementById('experiment-slots');
    this.experimentResult = document.getElementById('experiment-result');
    this.experimentParts = [];

    this.catalogInput = document.getElementById('catalog-search-input');
    this.catalogResults = document.getElementById('catalog-results');

    this.equipmentGrid = document.getElementById('equipment-grid');
    this.equipmentDetail = document.getElementById('equipment-detail');

    this.selectedCreature = null;
    this.selectedRecipe = null;
    this.selectedEquipment = null;

    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btn-close-scrap-workshop').addEventListener('click', () => this.close());

    this.tabsEl.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    document.getElementById('btn-disassemble-confirm').addEventListener('click', () => this.doDisassemble());
    document.getElementById('btn-craft-confirm').addEventListener('click', () => this.doCraft());
    document.getElementById('btn-experiment-clear').addEventListener('click', () => this.clearExperiment());
    document.getElementById('btn-experiment-confirm').addEventListener('click', () => this.doExperiment());

    if (this.catalogInput) {
      this.catalogInput.addEventListener('input', () => this.doCatalogSearch());
    }
  }

  open() {
    this.modal.classList.remove('hidden');
    this.switchTab('disassemble');
    this.renderParts();
    this.renderDisassembleGrid();
    this.renderRecipeList();
    this.renderEquipmentGrid();
    this.renderExperimentSlots();
    this.game.checkTasks('scrap_workshop_open');
  }

  close() {
    this.modal.classList.add('hidden');
    this.selectedCreature = null;
    this.selectedRecipe = null;
    this.selectedEquipment = null;
    this.experimentParts = [];
  }

  switchTab(tabName) {
    this.tabsEl.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    this.tabContents.forEach(content => {
      content.classList.toggle('hidden', content.dataset.tab !== tabName);
    });

    if (tabName === 'disassemble') this.renderDisassembleGrid();
    if (tabName === 'recipe') this.renderRecipeList();
    if (tabName === 'experiment') this.renderExperimentSlots();
    if (tabName === 'catalog') this.doCatalogSearch();
    if (tabName === 'equipment') this.renderEquipmentGrid();
  }

  addPart(partId, count) {
    if (!this.parts[partId]) this.parts[partId] = 0;
    this.parts[partId] += count;
    this.game.saveProgress();
    this.renderParts();
  }

  removePart(partId, count) {
    if (!this.parts[partId] || this.parts[partId] < count) return false;
    this.parts[partId] -= count;
    if (this.parts[partId] === 0) delete this.parts[partId];
    this.game.saveProgress();
    this.renderParts();
    return true;
  }

  getPartCount(partId) {
    return this.parts[partId] || 0;
  }

  addEquipment(equipment) {
    const existing = this.equipment.find(e => e.id === equipment.id);
    if (existing) {
      existing.count++;
    } else {
      this.equipment.push({ ...equipment, count: 1 });
    }
    this.game.saveProgress();
  }

  renderParts() {
    if (!this.partsEl) return;
    this.partsEl.innerHTML = '';

    const partEntries = Object.entries(this.parts);
    if (partEntries.length === 0) {
      this.partsEl.innerHTML = '<span style="color:#666;font-size:12px;">暂无零件，拆解残骸获得</span>';
      return;
    }

    partEntries.forEach(([id, count]) => {
      const part = SCRAP_PARTS[id];
      if (!part) return;
      const chip = document.createElement('div');
      chip.className = `material-chip ${part.rarity.class}`;
      chip.innerHTML = `<span>${part.icon}</span><span>${part.name}</span><span class="material-count">${count}</span>`;
      chip.title = part.desc;
      this.partsEl.appendChild(chip);
    });
  }

  renderDisassembleGrid() {
    if (!this.disassembleGrid) return;
    this.disassembleGrid.innerHTML = '';

    const items = this.game.inventory.getBackpackItems();
    if (items.length === 0) {
      this.disassembleGrid.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">背包空空如也</p>';
      this.renderDisassembleDetail(null);
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
        this.selectedCreature = { item, index };
        this.renderDisassembleDetail(this.selectedCreature);
      });
      this.disassembleGrid.appendChild(slot);
    });
  }

  renderDisassembleDetail(selected) {
    if (!this.disassembleDetail) return;

    if (!selected) {
      this.disassembleDetail.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">选择要拆解的机械残骸</p>';
      document.getElementById('btn-disassemble-confirm').disabled = true;
      return;
    }

    const { item } = selected;
    const tier = item.tier || 1;
    const parts = getDisassembleParts(item);
    const bonusMultiplier = 1 + (tier - 1) * 0.15;

    let partsHtml = '';
    parts.forEach(p => {
      const part = SCRAP_PARTS[p.part];
      if (!part) return;
      const minCount = Math.ceil(p.min * bonusMultiplier);
      const maxCount = Math.ceil(p.max * bonusMultiplier);
      if (maxCount > 0) {
        partsHtml += `<p>${part.icon} ${part.name}: ${minCount}~${maxCount}</p>`;
      }
    });

    const baseValue = calculateCreatureValue(item, tier, item.affixes || []);
    const coinReturn = Math.floor(baseValue * 0.3);

    this.disassembleDetail.innerHTML = `
      <div class="creature-display" style="background: radial-gradient(circle, rgba(${this.hexToRgb(item.rarity.color)}, 0.3) 0%, transparent 70%);">
        <span style="font-size:60px;">${item.icon}</span>
      </div>
      <div class="battle-stats">
        <div class="stat-row"><span class="stat-name">名称</span><span class="stat-data">${item.name}</span></div>
        <div class="stat-row"><span class="stat-name">稀有度</span><span class="stat-data ${item.rarity.class}">${item.rarity.name}</span></div>
        <div class="stat-row"><span class="stat-name">品阶</span><span class="stat-data">Lv.${tier}</span></div>
      </div>
      <div style="margin-top:12px;">
        <p style="margin-bottom:6px;color:#00ffff;"><strong>拆解产出:</strong></p>
        <p>💰 金币返还: ${coinReturn}</p>
        ${partsHtml}
      </div>
    `;
    document.getElementById('btn-disassemble-confirm').disabled = false;
  }

  doDisassemble() {
    if (!this.selectedCreature) return;
    const { item, index } = this.selectedCreature;
    const tier = item.tier || 1;
    const bonusMultiplier = 1 + (tier - 1) * 0.15;

    const baseValue = calculateCreatureValue(item, tier, item.affixes || []);
    const coinReturn = Math.floor(baseValue * 0.3);
    this.game.updateStats('coins', coinReturn);

    const parts = getDisassembleParts(item);
    const rewards = [];
    parts.forEach(p => {
      const part = SCRAP_PARTS[p.part];
      if (!part) return;
      const minCount = Math.ceil(p.min * bonusMultiplier);
      const maxCount = Math.ceil(p.max * bonusMultiplier);
      if (maxCount > 0) {
        const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
        if (count > 0) {
          this.addPart(p.part, count);
          rewards.push(`${part.icon}${part.name}x${count}`);
        }
      }
    });

    const backpackItem = this.game.inventory.backpack[index];
    if (backpackItem) {
      if (backpackItem.count > 1) {
        backpackItem.count--;
      } else {
        this.game.inventory.backpack.splice(index, 1);
      }
    }

    this.stats.disassembleCount++;
    this.game.saveProgress();
    this.game.checkTasks('disassemble_count');
    const rewardStr = rewards.length > 0 ? `，获得 ${rewards.join(' ')}` : '';
    this.game.taskSystem.showHint(`拆解成功！获得 ${coinReturn} 金币${rewardStr}`);

    this.selectedCreature = null;
    this.renderDisassembleGrid();
    this.renderDisassembleDetail(null);
    this.game.inventory.renderBackpack();
  }

  renderRecipeList() {
    if (!this.recipeList) return;
    this.recipeList.innerHTML = '';

    EQUIPMENT_RECIPES.forEach(recipe => {
      const discovered = this.discoveredRecipes.has(recipe.id);
      const canCraft = hasAllParts(this.parts, recipe);

      const card = document.createElement('div');
      card.className = `recipe-card ${recipe.rarity.class} ${this.selectedRecipe?.id === recipe.id ? 'selected' : ''}`;

      if (discovered) {
        card.innerHTML = `
          <div class="recipe-icon">${recipe.icon}</div>
          <div class="recipe-info">
            <div class="recipe-name">${recipe.name}</div>
            <div class="recipe-type">${EQUIPMENT_TYPES[recipe.type].icon} ${EQUIPMENT_TYPES[recipe.type].name}</div>
            <div class="recipe-rate">成功率: ${Math.floor(recipe.successRate * 100)}%</div>
          </div>
          <div class="recipe-status ${canCraft ? 'can-craft' : 'cannot-craft'}">${canCraft ? '✓' : '✗'}</div>
        `;
      } else {
        card.innerHTML = `
          <div class="recipe-icon locked">❓</div>
          <div class="recipe-info">
            <div class="recipe-name">未知配方</div>
            <div class="recipe-type">${EQUIPMENT_TYPES[recipe.type].icon} ???</div>
            <div class="recipe-rate">尝试试验解锁</div>
          </div>
          <div class="recipe-status locked">🔒</div>
        `;
      }

      card.addEventListener('click', () => {
        if (discovered) {
          this.selectedRecipe = recipe;
          this.renderRecipeDetail(recipe);
          this.renderRecipeList();
        }
      });

      this.recipeList.appendChild(card);
    });
  }

  renderRecipeDetail(recipe) {
    if (!this.recipeDetail) return;
    if (!recipe) {
      this.recipeDetail.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">选择一个已解锁的配方</p>';
      document.getElementById('btn-craft-confirm').disabled = true;
      return;
    }

    const canCraft = hasAllParts(this.parts, recipe);
    const craftValue = getRecipeValue(recipe);

    let partsHtml = '';
    recipe.parts.forEach(rp => {
      const part = SCRAP_PARTS[rp.part];
      if (!part) return;
      const owned = this.getPartCount(rp.part);
      const enough = owned >= rp.count;
      partsHtml += `<p>${part.icon} ${part.name}: <span class="${enough ? '' : 'cost-insufficient'}">${owned}/${rp.count}</span></p>`;
    });

    this.recipeDetail.innerHTML = `
      <div class="creature-display" style="background: radial-gradient(circle, rgba(${this.hexToRgb(recipe.rarity.color)}, 0.3) 0%, transparent 70%);">
        <span style="font-size:60px;">${recipe.icon}</span>
      </div>
      <div class="battle-stats">
        <div class="stat-row"><span class="stat-name">名称</span><span class="stat-data">${recipe.name}</span></div>
        <div class="stat-row"><span class="stat-name">类型</span><span class="stat-data">${EQUIPMENT_TYPES[recipe.type].icon} ${EQUIPMENT_TYPES[recipe.type].name}</span></div>
        <div class="stat-row"><span class="stat-name">稀有度</span><span class="stat-data ${recipe.rarity.class}">${recipe.rarity.name}</span></div>
        <div class="stat-row"><span class="stat-name">描述</span><span class="stat-data" style="font-size:12px;">${recipe.desc}</span></div>
        <div class="stat-row"><span class="stat-name">效果</span><span class="stat-data" style="color:#ffaa00;">${recipe.effect}</span></div>
        <div class="stat-row"><span class="stat-name">成功率</span><span class="stat-data">${Math.floor(recipe.successRate * 100)}%</span></div>
        <div class="stat-row"><span class="stat-name">价值</span><span class="stat-data" style="color:#ffaa00;">${craftValue} 金</span></div>
      </div>
      <div style="margin-top:12px;">
        <p style="margin-bottom:6px;color:#00ffff;"><strong>所需材料:</strong></p>
        ${partsHtml}
      </div>
    `;
    document.getElementById('btn-craft-confirm').disabled = !canCraft;
  }

  doCraft() {
    if (!this.selectedRecipe) return;
    const recipe = this.selectedRecipe;
    if (!hasAllParts(this.parts, recipe)) {
      this.game.taskSystem.showHint('材料不足！');
      return;
    }

    const successBonus = this.getSuccessRateBonus();
    const finalRate = Math.min(0.98, recipe.successRate + successBonus);

    recipe.parts.forEach(rp => this.removePart(rp.part, rp.count));

    if (Math.random() < finalRate) {
      this.addEquipment(recipe);
      if (!this.discoveredRecipes.has(recipe.id)) {
        this.discoveredRecipes.add(recipe.id);
      }
      this.stats.assembleSuccessCount++;
      if (!this.stats.maxRarityCrafted || recipe.rarity.weight < this.stats.maxRarityCrafted.weight) {
        this.stats.maxRarityCrafted = recipe.rarity;
      }
      this.game.saveProgress();
      this.game.checkTasks('craft_success');
      this.game.checkTasks('craft_rarity', recipe.rarity);
      this.game.taskSystem.showHint(`✨ 拼装成功！获得「${recipe.name}」`);
    } else {
      const penalty = calculateExperimentPenalty(recipe.successRate);
      this.applyPenalty(penalty, recipe);
      this.stats.assembleFailCount++;
      this.game.saveProgress();
      this.game.taskSystem.showHint(`💥 拼装失败！${penalty.name}：${penalty.desc}`);
    }

    this.selectedRecipe = null;
    this.renderRecipeList();
    this.renderRecipeDetail(null);
    this.renderEquipmentGrid();
  }

  renderExperimentSlots() {
    if (!this.experimentSlots) return;
    this.experimentSlots.innerHTML = '';

    for (let i = 0; i < 6; i++) {
      const slot = document.createElement('div');
      slot.className = 'experiment-slot';

      const placed = this.experimentParts[i];
      if (placed) {
        const part = SCRAP_PARTS[placed.partId];
        slot.className += ` has-item ${part.rarity.class}`;
        slot.innerHTML = `
          <div class="slot-rarity-border"></div>
          <span class="slot-icon">${part.icon}</span>
          ${placed.count > 1 ? `<span class="slot-count">${placed.count}</span>` : ''}
        `;
        slot.addEventListener('click', () => {
          this.addPart(placed.partId, placed.count);
          this.experimentParts.splice(i, 1);
          this.renderExperimentSlots();
          this.updateExperimentPreview();
        });
      }

      this.experimentSlots.appendChild(slot);
    }

    const partsSelector = document.createElement('div');
    partsSelector.className = 'parts-selector';
    partsSelector.innerHTML = '<p style="color:#666;font-size:12px;margin-bottom:8px;">点击零件加入试验槽：</p>';

    const partEntries = Object.entries(this.parts);
    if (partEntries.length === 0) {
      partsSelector.innerHTML += '<span style="color:#666;font-size:12px;">暂无零件</span>';
    } else {
      partEntries.forEach(([id, count]) => {
        const part = SCRAP_PARTS[id];
        if (!part) return;
        const chip = document.createElement('div');
        chip.className = `material-chip clickable ${part.rarity.class}`;
        chip.innerHTML = `<span>${part.icon}</span><span>${part.name}</span><span class="material-count">${count}</span>`;
        chip.title = `点击添加1个${part.name}`;
        chip.addEventListener('click', () => this.addToExperiment(id));
        partsSelector.appendChild(chip);
      });
    }

    this.experimentSlots.appendChild(partsSelector);
    this.updateExperimentPreview();
  }

  addToExperiment(partId) {
    if (this.getPartCount(partId) <= 0) return;
    if (this.experimentParts.length >= 6) {
      this.game.taskSystem.showHint('试验槽已满（最多6种零件）');
      return;
    }

    const existing = this.experimentParts.find(p => p.partId === partId);
    if (existing) {
      if (this.getPartCount(partId) > existing.count) {
        existing.count++;
      }
    } else {
      this.experimentParts.push({ partId, count: 1 });
    }

    this.removePart(partId, 1);
    this.renderExperimentSlots();
    this.updateExperimentPreview();
  }

  clearExperiment() {
    this.experimentParts.forEach(p => {
      this.addPart(p.partId, p.count);
    });
    this.experimentParts = [];
    this.renderExperimentSlots();
  }

  updateExperimentPreview() {
    if (!this.experimentResult) return;

    if (this.experimentParts.length === 0) {
      this.experimentResult.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">放入零件开始试验</p>';
      document.getElementById('btn-experiment-confirm').disabled = true;
      return;
    }

    const partIds = this.experimentParts.map(p => p.partId);
    const partSet = new Set(partIds);

    const matchedRecipes = EQUIPMENT_RECIPES.filter(recipe => {
      const recipeParts = new Set(recipe.parts.map(p => p.part));
      if (recipeParts.size !== partSet.size) return false;
      for (const rp of recipeParts) if (!partSet.has(rp)) return false;
      return recipe.parts.every(rp => {
        const exp = this.experimentParts.find(e => e.partId === rp.part);
        return exp && exp.count >= rp.count;
      });
    });

    if (matchedRecipes.length > 0) {
      const recipe = matchedRecipes[0];
      const discovered = this.discoveredRecipes.has(recipe.id);
      const successBonus = this.getSuccessRateBonus();
      const finalRate = Math.min(0.98, recipe.successRate + successBonus);

      this.experimentResult.innerHTML = `
        <p style="color:#44ff44;margin-bottom:8px;"><strong>🔍 发现匹配配方！</strong></p>
        <p style="font-size:16px;">${discovered ? recipe.icon + ' ' + recipe.name : '❓ 未知配方'}</p>
        <p>类型: ${EQUIPMENT_TYPES[recipe.type].icon} ${discovered ? EQUIPMENT_TYPES[recipe.type].name : '???'}</p>
        <p>预估成功率: <span style="color:#ffaa00;">${Math.floor(finalRate * 100)}%</span></p>
        ${discovered ? `<p style="color:#aaa;font-size:12px;margin-top:6px;">效果: ${recipe.effect}</p>` : ''}
      `;
    } else {
      const partialMatches = EQUIPMENT_RECIPES.filter(recipe => {
        const recipeParts = recipe.parts.map(p => p.part);
        return recipeParts.some(rp => partSet.has(rp));
      });

      this.experimentResult.innerHTML = `
        <p style="color:#ff8844;margin-bottom:8px;"><strong>⚠️ 未知组合</strong></p>
        <p>放入了 ${partSet.size} 种零件</p>
        <p>可能解锁新配方，也可能失败</p>
        <p style="color:#ff6666;font-size:12px;margin-top:6px;">警告：未知组合失败率很高！</p>
        ${partialMatches.length > 0 ? `<p style="color:#888;font-size:11px;margin-top:8px;">提示：与 ${partialMatches.length} 个已知配方有部分零件重合</p>` : ''}
      `;
    }

    document.getElementById('btn-experiment-confirm').disabled = false;
  }

  doExperiment() {
    if (this.experimentParts.length === 0) return;

    this.stats.experimentCount++;

    const partIds = this.experimentParts.map(p => p.partId);
    const partSet = new Set(partIds);

    const matchedRecipes = EQUIPMENT_RECIPES.filter(recipe => {
      const recipeParts = new Set(recipe.parts.map(p => p.part));
      if (recipeParts.size !== partSet.size) return false;
      for (const rp of recipeParts) if (!partSet.has(rp)) return false;
      return recipe.parts.every(rp => {
        const exp = this.experimentParts.find(e => e.partId === rp.part);
        return exp && exp.count >= rp.count;
      });
    });

    if (matchedRecipes.length > 0) {
      const recipe = matchedRecipes[0];
      const successBonus = this.getSuccessRateBonus();
      const finalRate = Math.min(0.98, recipe.successRate + successBonus);

      this.experimentParts = [];

      if (Math.random() < finalRate) {
        this.addEquipment(recipe);
        if (!this.discoveredRecipes.has(recipe.id)) {
          this.discoveredRecipes.add(recipe.id);
          this.game.taskSystem.showHint(`📖 解锁新配方：${recipe.name}！`);
        }
        this.stats.assembleSuccessCount++;
        if (!this.stats.maxRarityCrafted || recipe.rarity.weight < this.stats.maxRarityCrafted.weight) {
          this.stats.maxRarityCrafted = recipe.rarity;
        }
        this.game.saveProgress();
        this.game.checkTasks('craft_success');
        this.game.checkTasks('craft_rarity', recipe.rarity);
        this.game.taskSystem.showHint(`✨ 试验成功！获得「${recipe.name}」`);
      } else {
        const penalty = calculateExperimentPenalty(recipe.successRate);
        this.applyPenalty(penalty, recipe);
        this.stats.assembleFailCount++;
        this.game.saveProgress();
        this.game.taskSystem.showHint(`💥 试验失败！${penalty.name}：${penalty.desc}`);
      }
    } else {
      const failRate = 0.85;
      this.experimentParts = [];

      if (Math.random() > failRate) {
        const fallbackRecipes = EQUIPMENT_RECIPES.filter(r => r.rarity.name === '普通' || r.rarity.name === '优秀');
        if (fallbackRecipes.length > 0) {
          const lucky = fallbackRecipes[Math.floor(Math.random() * fallbackRecipes.length)];
          this.addEquipment(lucky);
          if (!this.discoveredRecipes.has(lucky.id)) {
            this.discoveredRecipes.add(lucky.id);
          }
          this.stats.assembleSuccessCount++;
          this.game.saveProgress();
          this.game.taskSystem.showHint(`🍀 意外之喜！瞎猫碰到死耗子，获得「${lucky.name}」`);
        }
      } else {
        const penalty = calculateExperimentPenalty(0.2);
        const fakeRecipe = { parts: this.experimentParts, value: 50 };
        this.applyPenalty(penalty, fakeRecipe);
        this.stats.assembleFailCount++;
        this.game.saveProgress();
        this.game.taskSystem.showHint(`💥 试验失败！${penalty.name}：${penalty.desc}`);
      }
    }

    this.renderExperimentSlots();
    this.renderRecipeList();
    this.renderEquipmentGrid();
  }

  applyPenalty(penalty, recipe) {
    const coinLoss = Math.floor((recipe.value || 50) * penalty.coinLoss);
    if (coinLoss > 0) {
      this.game.updateStats('coins', -coinLoss);
    }
    if (penalty.energyLoss) {
      this.game.updateStats('energy', -penalty.energyLoss);
    }
  }

  doCatalogSearch() {
    if (!this.catalogResults) return;
    const query = (this.catalogInput?.value || '').trim().toLowerCase();
    this.catalogResults.innerHTML = '';

    let results = [];

    if (query === '') {
      this.catalogResults.innerHTML = `
        <div style="padding:16px;">
          <p style="color:#888;margin-bottom:12px;">💡 使用方法：</p>
          <ul style="color:#aaa;font-size:12px;line-height:1.8;padding-left:16px;">
            <li>输入<strong style="color:#00ffff;">装备名</strong>查看配方</li>
            <li>输入<strong style="color:#00ffff;">零件名</strong>反查可用装备</li>
            <li>点击下方零件快速反查</li>
          </ul>
          <p style="color:#666;margin-top:16px;font-size:12px;">已解锁配方: ${this.discoveredRecipes.size}/${EQUIPMENT_RECIPES.length}</p>
        </div>
      `;

      const quickBar = document.createElement('div');
      quickBar.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 16px;';
      quickBar.innerHTML = '<p style="width:100%;color:#888;font-size:12px;margin-bottom:4px;">快速反查（点击零件）：</p>';

      Object.values(SCRAP_PARTS).forEach(part => {
        const chip = document.createElement('div');
        chip.className = `material-chip clickable ${part.rarity.class}`;
        chip.innerHTML = `<span>${part.icon}</span><span>${part.name}</span>`;
        chip.addEventListener('click', () => {
          if (this.catalogInput) this.catalogInput.value = part.name;
          this.doCatalogSearch();
        });
        quickBar.appendChild(chip);
      });
      this.catalogResults.appendChild(quickBar);
      return;
    }

    const matchedParts = Object.values(SCRAP_PARTS).filter(p =>
      p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
    );

    if (matchedParts.length > 0) {
      matchedParts.forEach(part => {
        const recipes = findRecipesBySinglePart(part.id);
        const section = document.createElement('div');
        section.className = 'catalog-section';
        section.innerHTML = `
          <div class="catalog-part-header ${part.rarity.class}">
            <span style="font-size:24px;">${part.icon}</span>
            <div>
              <div style="font-weight:bold;">${part.name}</div>
              <div style="font-size:11px;color:#888;">${part.desc}</div>
            </div>
          </div>
        `;

        if (recipes.length === 0) {
          section.innerHTML += '<p style="color:#666;padding:8px 12px;font-size:12px;">该零件暂未发现可用配方</p>';
        } else {
          recipes.forEach(recipe => {
            const discovered = this.discoveredRecipes.has(recipe.id);
            const canCraft = hasAllParts(this.parts, recipe);
            const item = document.createElement('div');
            item.className = `catalog-recipe-item ${recipe.rarity.class}`;
            if (discovered) {
              item.innerHTML = `
                <span style="font-size:20px;">${recipe.icon}</span>
                <div style="flex:1;">
                  <div style="font-weight:bold;">${recipe.name}</div>
                  <div style="font-size:11px;color:#aaa;">${recipe.effect}</div>
                </div>
                <span class="${canCraft ? 'can-craft' : 'cannot-craft'}" style="font-weight:bold;">${canCraft ? '可制作' : '材料不足'}</span>
              `;
              item.addEventListener('click', () => {
                this.selectedRecipe = recipe;
                this.switchTab('recipe');
                this.renderRecipeDetail(recipe);
              });
            } else {
              item.innerHTML = `
                <span style="font-size:20px;opacity:0.4;">❓</span>
                <div style="flex:1;">
                  <div style="font-weight:bold;color:#666;">未解锁配方</div>
                  <div style="font-size:11px;color:#555;">通过试验解锁</div>
                </div>
                <span style="color:#666;">🔒</span>
              `;
            }
            section.appendChild(item);
          });
        }
        this.catalogResults.appendChild(section);
      });
      return;
    }

    const matchedRecipes = EQUIPMENT_RECIPES.filter(r =>
      this.discoveredRecipes.has(r.id) && (
        r.name.toLowerCase().includes(query) ||
        r.desc.toLowerCase().includes(query) ||
        r.effect.toLowerCase().includes(query)
      )
    );

    if (matchedRecipes.length > 0) {
      matchedRecipes.forEach(recipe => {
        const canCraft = hasAllParts(this.parts, recipe);
        let partsHtml = '';
        recipe.parts.forEach(rp => {
          const part = SCRAP_PARTS[rp.part];
          if (!part) return;
          const owned = this.getPartCount(rp.part);
          const enough = owned >= rp.count;
          partsHtml += `<span class="${enough ? '' : 'cost-insufficient'}" style="margin-right:8px;">${part.icon}${owned}/${rp.count}</span>`;
        });

        const item = document.createElement('div');
        item.className = `catalog-recipe-item ${recipe.rarity.class}`;
        item.innerHTML = `
          <span style="font-size:24px;">${recipe.icon}</span>
          <div style="flex:1;">
            <div style="font-weight:bold;">${recipe.name}</div>
            <div style="font-size:11px;color:#aaa;">${recipe.effect}</div>
            <div style="font-size:11px;margin-top:4px;">${partsHtml}</div>
          </div>
          <span class="${canCraft ? 'can-craft' : 'cannot-craft'}" style="font-weight:bold;">${canCraft ? '可制作' : '缺材料'}</span>
        `;
        item.addEventListener('click', () => {
          this.selectedRecipe = recipe;
          this.switchTab('recipe');
          this.renderRecipeDetail(recipe);
        });
        this.catalogResults.appendChild(item);
      });
    } else {
      this.catalogResults.innerHTML = '<p style="text-align:center;color:#666;padding:40px;">未找到匹配结果</p>';
    }
  }

  renderEquipmentGrid() {
    if (!this.equipmentGrid) return;
    this.equipmentGrid.innerHTML = '';

    if (this.equipment.length === 0) {
      this.equipmentGrid.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">暂无装备，快去拼装吧！</p>';
      this.renderEquipmentDetail(null);
      return;
    }

    this.equipment.forEach((eq, index) => {
      const slot = document.createElement('div');
      slot.className = `inventory-slot has-item ${eq.rarity.class} ${this.selectedEquipment === index ? 'selected' : ''}`;
      slot.innerHTML = `
        <div class="slot-rarity-border"></div>
        <span class="slot-icon">${eq.icon}</span>
        ${eq.count > 1 ? `<span class="slot-count">${eq.count}</span>` : ''}
      `;
      slot.addEventListener('click', () => {
        this.selectedEquipment = index;
        this.renderEquipmentDetail(eq);
        this.renderEquipmentGrid();
      });
      this.equipmentGrid.appendChild(slot);
    });
  }

  renderEquipmentDetail(eq) {
    if (!this.equipmentDetail) return;
    if (!eq) {
      this.equipmentDetail.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">选择装备查看详情</p>';
      return;
    }

    const maxTier = RARITY_MAX_TIER[eq.rarity.name] || 3;

    this.equipmentDetail.innerHTML = `
      <div class="creature-display" style="background: radial-gradient(circle, rgba(${this.hexToRgb(eq.rarity.color)}, 0.3) 0%, transparent 70%);">
        <span style="font-size:70px;">${eq.icon}</span>
      </div>
      <p class="creature-quote" style="color:#888;font-size:12px;margin-top:8px;">"${this.getEquipmentFlavor(eq)}"</p>
      <div class="battle-stats">
        <div class="stat-row"><span class="stat-name">名称</span><span class="stat-data">${eq.name}</span></div>
        <div class="stat-row"><span class="stat-name">类型</span><span class="stat-data">${EQUIPMENT_TYPES[eq.type].icon} ${EQUIPMENT_TYPES[eq.type].name}</span></div>
        <div class="stat-row"><span class="stat-name">稀有度</span><span class="stat-data ${eq.rarity.class}">${eq.rarity.name}</span></div>
        <div class="stat-row"><span class="stat-name">描述</span><span class="stat-data" style="font-size:12px;">${eq.desc}</span></div>
        <div class="stat-row"><span class="stat-name">效果</span><span class="stat-data" style="color:#ffaa00;font-weight:bold;">${eq.effect}</span></div>
        <div class="stat-row"><span class="stat-name">持有数</span><span class="stat-data">${eq.count}</span></div>
        <div class="stat-row"><span class="stat-name">价值</span><span class="stat-data" style="color:#ffaa00;">${eq.value} 金/件</span></div>
      </div>
    `;
  }

  getEquipmentFlavor(eq) {
    const flavors = {
      weapon: ['锋刃过处，数据断流。', '每一斩都切开旧世界的残骸。', '它在渴望下一次战斗...'],
      armor: ['钢铁之下，是跳动的心脏。', '抵御虚空，守护最后一人。', '磨损的痕迹，是勋章。'],
      utility: ['工具是手的延伸。', '精准，是匠人的尊严。', '用好它，事半功倍。'],
      accessory: ['小小的饰品，大大的力量。', '戴着它，感觉能看穿一切。', '它似乎在低声细语...']
    };
    const list = flavors[eq.type] || ['杰作！'];
    return list[Math.floor(Math.random() * list.length)];
  }

  getSuccessRateBonus() {
    let bonus = 0;
    const gloves = this.equipment.find(e => e.id === 'circuit_gloves');
    if (gloves) bonus += 0.1;
    const crown = this.equipment.find(e => e.id === 'omniscient_crown');
    if (crown) bonus += 0.2;
    return bonus;
  }

  hexToRgb(hex) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `${r}, ${g}, ${b}`;
  }

  toJSON() {
    return {
      parts: this.parts,
      equipment: this.equipment.map(e => ({ id: e.id, count: e.count })),
      discoveredRecipes: Array.from(this.discoveredRecipes),
      stats: this.stats
    };
  }

  loadData(data) {
    if (!data) return;
    if (data.parts) this.parts = { ...data.parts };
    if (data.equipment) {
      this.equipment = data.equipment.map(saved => {
        const recipe = EQUIPMENT_RECIPES.find(r => r.id === saved.id);
        return recipe ? { ...recipe, count: saved.count } : null;
      }).filter(Boolean);
    }
    if (data.discoveredRecipes) {
      this.discoveredRecipes = new Set(data.discoveredRecipes);
    }
    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }
  }
}
