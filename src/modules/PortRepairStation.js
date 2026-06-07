import { Storage } from './Storage.js';
import {
  REPAIR_MATERIALS,
  REPAIR_UPGRADES,
  REPAIR_TYPES,
  getRepairMaterial,
  getAllRepairMaterials,
  getMaterialsByType,
  getRepairUpgradeCost,
  getRepairUpgradeEffect,
  calculateCatchEfficiencyPenalty,
  calculateRarityPenalty,
  calculateEnergyCostPenalty,
  calculateEnergyRegenPenalty,
  calculateBattleDamageMultiplier
} from '../data/portRepair.js';

export class PortRepairStation {
  constructor(game) {
    this.game = game;

    this.status = {
      hull: 100,
      net: 100,
      battery: 100
    };

    this.maxStatus = {
      hull: 100,
      net: 100,
      battery: 100
    };

    this.materials = {};
    this.upgrades = {};
    Object.keys(REPAIR_UPGRADES).forEach(key => {
      this.upgrades[key] = 0;
    });

    this.stats = {
      totalRepairs: 0,
      totalMaterialsUsed: 0,
      totalCoinsSpent: 0,
      totalCatches: 0
    };

    this.modal = document.getElementById('repair-station-modal');
    this.tabBtns = null;
    this.tabContents = null;
    this.currentTab = 'overview';

    this.bindStaticEvents();
  }

  bindStaticEvents() {
    const btn = document.getElementById('btn-repair-station');
    if (btn) {
      btn.addEventListener('click', () => this.open());
    }
    const closeBtn = document.getElementById('btn-close-repair-station');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    this.tabBtns = document.querySelectorAll('.repair-tab');
    this.tabContents = document.querySelectorAll('.repair-tab-content');
    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          this.switchTab(tab);
        });
      });
    }
  }

  getMaxHull() {
    return 100 + getRepairUpgradeEffect('max_hull', this.upgrades.max_hull || 0);
  }

  getMaxNet() {
    return 100 + getRepairUpgradeEffect('max_net', this.upgrades.max_net || 0);
  }

  getMaxBattery() {
    return 100 + getRepairUpgradeEffect('max_battery', this.upgrades.max_battery || 0);
  }

  getRepairSpeedMultiplier() {
    return 1 + getRepairUpgradeEffect('repair_speed', this.upgrades.repair_speed || 0);
  }

  getRepairDiscount() {
    return getRepairUpgradeEffect('repair_discount', this.upgrades.repair_discount || 0);
  }

  getAutoRepairAmount() {
    return getRepairUpgradeEffect('auto_repair', this.upgrades.auto_repair || 0);
  }

  getMaterialPrice(materialId) {
    const material = getRepairMaterial(materialId);
    if (!material) return Infinity;
    const discount = this.getRepairDiscount();
    return Math.floor(material.basePrice * (1 - discount));
  }

  getHullPercent() {
    return this.status.hull / this.getMaxHull();
  }

  getNetPercent() {
    return this.status.net / this.getMaxNet();
  }

  getBatteryPercent() {
    return this.status.battery / this.getMaxBattery();
  }

  getCatchEfficiencyPenalty() {
    return calculateCatchEfficiencyPenalty(this.getHullPercent(), this.getNetPercent());
  }

  getRarityPenalty() {
    return calculateRarityPenalty(this.getNetPercent());
  }

  getEnergyCostPenalty() {
    return calculateEnergyCostPenalty(this.getBatteryPercent());
  }

  getEnergyRegenPenalty() {
    return calculateEnergyRegenPenalty(this.getBatteryPercent());
  }

  getBattleDamageMultiplier() {
    return calculateBattleDamageMultiplier(this.getHullPercent());
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    this.switchTab('overview');
    this.game.checkTasks('repair_station_open');
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
  }

  switchTab(tab) {
    this.currentTab = tab;
    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
      });
    }
    if (this.tabContents) {
      this.tabContents.forEach(content => {
        content.classList.toggle('hidden', content.dataset.tab !== tab);
      });
    }
    this.renderAll();
  }

  renderAll() {
    this.renderOverview();
    this.renderStatus();
    this.renderMaterials();
    this.renderUpgrades();
    this.renderShop();
  }

  renderOverview() {
    const el = document.getElementById('repair-overview');
    if (!el) return;

    const maxHull = this.getMaxHull();
    const maxNet = this.getMaxNet();
    const maxBattery = this.getMaxBattery();
    const hullPct = Math.floor(this.getHullPercent() * 100);
    const netPct = Math.floor(this.getNetPercent() * 100);
    const batteryPct = Math.floor(this.getBatteryPercent() * 100);

    const catchPenalty = this.getCatchEfficiencyPenalty();
    const rarityPenalty = this.getRarityPenalty();
    const energyCostPenalty = this.getEnergyCostPenalty();
    const energyRegenPenalty = this.getEnergyRegenPenalty();

    const getStatusColor = (pct) => {
      if (pct >= 70) return '#44ff44';
      if (pct >= 40) return '#ffaa00';
      return '#ff4444';
    };

    el.innerHTML = `
      <p class="chamber-hint">港口维修站，维护你的船体、网具和电池，保持最佳打捞效率</p>
      
      <div class="repair-status-overview">
        <div class="repair-status-card">
          <div class="repair-status-header">
            <span class="repair-status-icon">🛡️</span>
            <span class="repair-status-name">船体耐久</span>
          </div>
          <div class="chamber-progress">
            <div class="chamber-progress-fill" style="width:${hullPct}%; background:${getStatusColor(hullPct)};"></div>
          </div>
          <div class="repair-status-value" style="color:${getStatusColor(hullPct)};">
            ${Math.floor(this.status.hull)}/${maxHull} (${hullPct}%)
          </div>
          ${hullPct < 50 ? `<div class="repair-warn">⚠️ 低于50%，打捞效率下降！</div>` : ''}
        </div>

        <div class="repair-status-card">
          <div class="repair-status-header">
            <span class="repair-status-icon">🎣</span>
            <span class="repair-status-name">网具损耗</span>
          </div>
          <div class="chamber-progress">
            <div class="chamber-progress-fill" style="width:${netPct}%; background:${getStatusColor(netPct)};"></div>
          </div>
          <div class="repair-status-value" style="color:${getStatusColor(netPct)};">
            ${Math.floor(this.status.net)}/${maxNet} (${netPct}%)
          </div>
          ${netPct < 40 ? `<div class="repair-warn">⚠️ 低于40%，捕获率和稀有度下降！</div>` : ''}
        </div>

        <div class="repair-status-card">
          <div class="repair-status-header">
            <span class="repair-status-icon">🔋</span>
            <span class="repair-status-name">电池负载</span>
          </div>
          <div class="chamber-progress">
            <div class="chamber-progress-fill" style="width:${batteryPct}%; background:${getStatusColor(batteryPct)};"></div>
          </div>
          <div class="repair-status-value" style="color:${getStatusColor(batteryPct)};">
            ${Math.floor(this.status.battery)}/${maxBattery} (${batteryPct}%)
          </div>
          ${batteryPct < 30 ? `<div class="repair-warn">⚠️ 低于30%，能量消耗增加恢复减慢！</div>` : ''}
        </div>
      </div>

      <div class="repair-efficiency-panel">
        <div class="chamber-stat-label">当前效率影响</div>
        <div class="repair-efficiency-grid">
          <div class="efficiency-item">
            <span class="efficiency-label">🎯 打捞效率</span>
            <span class="efficiency-value ${catchPenalty < 1 ? 'efficiency-bad' : 'efficiency-good'}">
              ${Math.round(catchPenalty * 100)}%
            </span>
          </div>
          <div class="efficiency-item">
            <span class="efficiency-label">💎 稀有度加成</span>
            <span class="efficiency-value ${rarityPenalty < 1 ? 'efficiency-bad' : 'efficiency-good'}">
              ${Math.round(rarityPenalty * 100)}%
            </span>
          </div>
          <div class="efficiency-item">
            <span class="efficiency-label">⚡ 能量消耗</span>
            <span class="efficiency-value ${energyCostPenalty > 1 ? 'efficiency-bad' : 'efficiency-good'}">
              ×${energyCostPenalty.toFixed(2)}
            </span>
          </div>
          <div class="efficiency-item">
            <span class="efficiency-label">🔋 能量恢复</span>
            <span class="efficiency-value ${energyRegenPenalty < 1 ? 'efficiency-bad' : 'efficiency-good'}">
              ×${energyRegenPenalty.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div class="repair-stats-panel">
        <div class="chamber-stat-label">维修站统计</div>
        <div class="repair-stats-grid">
          <div class="chamber-stat-card">
            <div class="chamber-stat-label">累计维修</div>
            <div class="chamber-stat-value">${this.stats.totalRepairs}次</div>
          </div>
          <div class="chamber-stat-card">
            <div class="chamber-stat-label">材料消耗</div>
            <div class="chamber-stat-value">${this.stats.totalMaterialsUsed}</div>
          </div>
          <div class="chamber-stat-card">
            <div class="chamber-stat-label">累计花费</div>
            <div class="chamber-stat-value">${this.stats.totalCoinsSpent}💰</div>
          </div>
          <div class="chamber-stat-card">
            <div class="chamber-stat-label">累计打捞</div>
            <div class="chamber-stat-value">${this.stats.totalCatches}</div>
          </div>
        </div>
      </div>
    `;
  }

  renderStatus() {
    const el = document.getElementById('repair-status-detail');
    if (!el) return;

    const types = Object.values(REPAIR_TYPES);
    el.innerHTML = `
      <p class="chamber-hint">选择维修类型，使用材料或金币进行维修</p>
      <div class="repair-type-list">
        ${types.map(type => this.renderRepairTypeCard(type)).join('')}
      </div>
    `;

    el.querySelectorAll('[data-repair-action]').forEach(btn => {
      const typeId = btn.dataset.repairType;
      const materialId = btn.dataset.repairMaterial;
      const action = btn.dataset.repairAction;
      if (action === 'repair-material') {
        btn.addEventListener('click', () => this.repairWithMaterial(typeId, materialId));
      } else if (action === 'repair-coin') {
        btn.addEventListener('click', () => this.repairWithCoin(typeId));
      } else if (action === 'repair-all') {
        btn.addEventListener('click', () => this.repairAll(typeId));
      }
    });
  }

  renderRepairTypeCard(type) {
    const current = this.status[type.id] || 0;
    const max = this.getMaxForType(type.id);
    const pct = Math.floor((current / max) * 100);
    const materials = getMaterialsByType(type.id);
    const autoRepair = this.getAutoRepairAmount();

    let materialsHtml = '';
    materials.forEach(mat => {
      const owned = this.getMaterialCount(mat.id);
      const canUse = owned > 0 && current < max;
      const repairAmount = Math.floor(mat.repairAmount * this.getRepairSpeedMultiplier());
      materialsHtml += `
        <div class="repair-material-row">
          <span class="repair-material-info">
            <span>${mat.icon} ${mat.name}</span>
            <span class="repair-material-owned">持有: ${owned}</span>
          </span>
          <button class="modal-btn secondary" 
            data-repair-action="repair-material" 
            data-repair-type="${type.id}" 
            data-repair-material="${mat.id}"
            ${canUse ? '' : 'disabled'}>
            使用 (+${repairAmount})
          </button>
        </div>
      `;
    });

    const coinCost = this.getCoinRepairCost(type.id);
    const coinRepairAmount = Math.floor(20 * this.getRepairSpeedMultiplier());
    const canAffordCoin = this.game.stats.coins >= coinCost && current < max;

    const allCost = this.getFullRepairCost(type.id);
    const canAffordAll = this.game.stats.coins >= allCost && current < max;

    return `
      <div class="repair-type-card">
        <div class="repair-type-header">
          <span class="repair-type-icon">${type.icon}</span>
          <div>
            <div class="repair-type-name">${type.name}</div>
            <div class="repair-type-desc">${type.desc}</div>
          </div>
        </div>
        <div class="repair-type-progress">
          <div class="chamber-progress">
            <div class="chamber-progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="repair-type-value">${Math.floor(current)}/${max} (${pct}%)</div>
        </div>
        ${autoRepair > 0 ? `<div class="repair-auto">🤖 自动维修: 每次打捞后 +${autoRepair}</div>` : ''}
        <div class="repair-actions">
          ${materialsHtml}
          <div class="repair-material-row">
            <span class="repair-material-info">
              <span>💰 金币维修</span>
              <span class="repair-material-owned">恢复 +${coinRepairAmount}</span>
            </span>
            <button class="modal-btn primary" 
              data-repair-action="repair-coin" 
              data-repair-type="${type.id}"
              ${canAffordCoin ? '' : 'disabled'}>
              ${coinCost}💰
            </button>
          </div>
          <div class="repair-material-row">
            <span class="repair-material-info">
              <span>💯 完全修复</span>
              <span class="repair-material-owned">恢复至满</span>
            </span>
            <button class="modal-btn accent" 
              data-repair-action="repair-all" 
              data-repair-type="${type.id}"
              ${canAffordAll ? '' : 'disabled'}>
              ${allCost}💰
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getMaxForType(typeId) {
    switch (typeId) {
      case 'hull': return this.getMaxHull();
      case 'net': return this.getMaxNet();
      case 'battery': return this.getMaxBattery();
      default: return 100;
    }
  }

  getCoinRepairCost(typeId) {
    const baseCosts = { hull: 50, net: 60, battery: 80 };
    const base = baseCosts[typeId] || 50;
    const discount = this.getRepairDiscount();
    return Math.floor(base * (1 - discount));
  }

  getFullRepairCost(typeId) {
    const current = this.status[typeId] || 0;
    const max = this.getMaxForType(typeId);
    const missing = max - current;
    if (missing <= 0) return 0;
    const perUnit = { hull: 3, net: 4, battery: 5 };
    const base = perUnit[typeId] || 3;
    const discount = this.getRepairDiscount();
    return Math.ceil(missing * base * (1 - discount));
  }

  repairWithMaterial(typeId, materialId) {
    const material = getRepairMaterial(materialId);
    if (!material) return false;
    if (material.repairType !== typeId) return false;
    if ((this.materials[materialId] || 0) <= 0) {
      this.game.taskSystem.showHint('材料不足！');
      return false;
    }
    const max = this.getMaxForType(typeId);
    if (this.status[typeId] >= max) {
      this.game.taskSystem.showHint('已满，无需维修！');
      return false;
    }

    this.materials[materialId]--;
    if (this.materials[materialId] === 0) delete this.materials[materialId];

    const repairAmount = Math.floor(material.repairAmount * this.getRepairSpeedMultiplier());
    this.status[typeId] = Math.min(max, this.status[typeId] + repairAmount);

    this.stats.totalRepairs++;
    this.stats.totalMaterialsUsed++;
    this.game.saveProgress();
    this.game.taskSystem.showHint(`✅ 使用${material.name}修复 +${repairAmount} ${REPAIR_TYPES[typeId].name}`);
    this.game.checkTasks('repair_count');
    this.renderAll();
    return true;
  }

  repairWithCoin(typeId) {
    const cost = this.getCoinRepairCost(typeId);
    if (this.game.stats.coins < cost) {
      this.game.taskSystem.showHint(`金币不足！需要 ${cost} 金币`);
      return false;
    }
    const max = this.getMaxForType(typeId);
    if (this.status[typeId] >= max) {
      this.game.taskSystem.showHint('已满，无需维修！');
      return false;
    }

    this.game.updateStats('coins', -cost);
    const repairAmount = Math.floor(20 * this.getRepairSpeedMultiplier());
    this.status[typeId] = Math.min(max, this.status[typeId] + repairAmount);

    this.stats.totalRepairs++;
    this.stats.totalCoinsSpent += cost;
    this.game.saveProgress();
    this.game.taskSystem.showHint(`✅ 花费${cost}💰修复 +${repairAmount} ${REPAIR_TYPES[typeId].name}`);
    this.game.checkTasks('repair_count');
    this.renderAll();
    return true;
  }

  repairAll(typeId) {
    const cost = this.getFullRepairCost(typeId);
    if (cost <= 0) {
      this.game.taskSystem.showHint('已满，无需维修！');
      return false;
    }
    if (this.game.stats.coins < cost) {
      this.game.taskSystem.showHint(`金币不足！需要 ${cost} 金币`);
      return false;
    }

    const max = this.getMaxForType(typeId);
    const repaired = max - this.status[typeId];
    this.game.updateStats('coins', -cost);
    this.status[typeId] = max;

    this.stats.totalRepairs++;
    this.stats.totalCoinsSpent += cost;
    this.game.saveProgress();
    this.game.taskSystem.showHint(`✅ 完全修复 ${REPAIR_TYPES[typeId].name} +${repaired}，花费${cost}💰`);
    this.game.checkTasks('repair_count');
    this.renderAll();
    return true;
  }

  renderMaterials() {
    const el = document.getElementById('repair-materials');
    if (!el) return;

    const materials = getAllRepairMaterials();
    el.innerHTML = `
      <p class="chamber-hint">当前持有的维修材料，可通过商店购买或远征获得</p>
      <div class="materials-bar" id="repair-materials-bar">
        ${materials.map(mat => {
          const count = this.getMaterialCount(mat.id);
          return `
            <div class="material-chip ${mat.rarity.class}" ${count > 0 ? '' : 'style="opacity:0.4;"'}>
              <span>${mat.icon}</span>
              <span>${mat.name}</span>
              <span class="material-count">${count}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  getMaterialCount(materialId) {
    return this.materials[materialId] || 0;
  }

  addMaterial(materialId, count = 1) {
    if (!this.materials[materialId]) this.materials[materialId] = 0;
    this.materials[materialId] += count;
    this.game.saveProgress();
    this.renderMaterials();
  }

  renderUpgrades() {
    const el = document.getElementById('repair-upgrades');
    if (!el) return;

    const upgrades = Object.entries(REPAIR_UPGRADES);
    el.innerHTML = `
      <p class="chamber-hint">升级维修站设施，提升维修效率和容量</p>
      <div class="upgrade-list">
        ${upgrades.map(([key, upgrade]) => {
          const level = this.upgrades[key] || 0;
          const maxed = level >= upgrade.maxLevel;
          const cost = maxed ? 0 : getRepairUpgradeCost(key, level);
          const canAfford = !maxed && this.game.stats.coins >= cost;
          const effect = getRepairUpgradeEffect(key, level);
          const nextEffect = maxed ? effect : getRepairUpgradeEffect(key, level + 1);
          let effectText = '';
          if (key === 'repair_speed' || key === 'repair_discount') {
            effectText = `+${Math.round(effect * 100)}% → +${Math.round(nextEffect * 100)}%`;
          } else if (key === 'auto_repair') {
            effectText = `+${effect} → +${nextEffect}`;
          } else {
            effectText = `+${effect} → +${nextEffect}`;
          }
          return `
            <div class="upgrade-card">
              <div class="upgrade-card-header">
                <span class="upgrade-icon">${upgrade.icon}</span>
                <div class="upgrade-info">
                  <div class="upgrade-name">${upgrade.name}</div>
                  <div class="upgrade-level">Lv.${level}/${upgrade.maxLevel}</div>
                </div>
              </div>
              <div class="upgrade-desc">${upgrade.desc}</div>
              <div class="upgrade-effect">
                ${maxed ? '已满级' : `当前效果: ${effectText}`}
              </div>
              <div class="upgrade-action">
                ${maxed ?
                  `<div class="stall-maxed">⭐ 已满级</div>` :
                  `<button class="modal-btn accent full-width" data-repair-upgrade="${key}" ${canAfford ? '' : 'disabled'}>⬆ 升级 (${cost}💰)</button>`
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    el.querySelectorAll('[data-repair-upgrade]').forEach(btn => {
      btn.addEventListener('click', () => this.purchaseUpgrade(btn.dataset.repairUpgrade));
    });
  }

  purchaseUpgrade(upgradeKey) {
    const upgrade = REPAIR_UPGRADES[upgradeKey];
    if (!upgrade) return false;
    const level = this.upgrades[upgradeKey] || 0;
    if (level >= upgrade.maxLevel) return false;
    const cost = getRepairUpgradeCost(upgradeKey, level);
    if (this.game.stats.coins < cost) {
      this.game.taskSystem.showHint(`金币不足！需要 ${cost} 金币`);
      return false;
    }
    this.game.updateStats('coins', -cost);
    this.upgrades[upgradeKey] = level + 1;
    this.stats.totalCoinsSpent += cost;

    if (upgradeKey === 'max_hull') {
      this.status.hull = Math.min(this.status.hull + upgrade.effectPerLevel, this.getMaxHull());
    } else if (upgradeKey === 'max_net') {
      this.status.net = Math.min(this.status.net + upgrade.effectPerLevel, this.getMaxNet());
    } else if (upgradeKey === 'max_battery') {
      this.status.battery = Math.min(this.status.battery + upgrade.effectPerLevel, this.getMaxBattery());
    }

    this.game.saveProgress();
    this.game.taskSystem.showHint(`⬆ ${upgrade.name} 升级到 Lv.${level + 1}！`);
    this.game.checkTasks('repair_upgrade');
    this.renderAll();
    return true;
  }

  renderShop() {
    const el = document.getElementById('repair-shop');
    if (!el) return;

    const materials = getAllRepairMaterials();
    el.innerHTML = `
      <p class="chamber-hint">在港口商店购买维修材料</p>
      <div class="repair-shop-list">
        ${materials.map(mat => {
          const price = this.getMaterialPrice(mat.id);
          const canAfford = this.game.stats.coins >= price;
          return `
            <div class="repair-shop-card ${mat.rarity.class}">
              <div class="repair-shop-header">
                <span class="repair-shop-icon">${mat.icon}</span>
                <div>
                  <div class="repair-shop-name">${mat.name}</div>
                  <div class="repair-shop-type">${REPAIR_TYPES[mat.repairType].icon} 修复${REPAIR_TYPES[mat.repairType].name}</div>
                </div>
              </div>
              <div class="repair-shop-desc">${mat.desc}</div>
              <div class="repair-shop-effect">修复量: +${Math.floor(mat.repairAmount * this.getRepairSpeedMultiplier())}</div>
              <div class="repair-shop-action">
                <button class="modal-btn primary full-width" 
                  data-repair-shop-buy="${mat.id}"
                  ${canAfford ? '' : 'disabled'}>
                  💰 购买 ${price}💰
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    el.querySelectorAll('[data-repair-shop-buy]').forEach(btn => {
      btn.addEventListener('click', () => this.buyMaterial(btn.dataset.repairShopBuy));
    });
  }

  buyMaterial(materialId) {
    const material = getRepairMaterial(materialId);
    if (!material) return false;
    const price = this.getMaterialPrice(materialId);
    if (this.game.stats.coins < price) {
      this.game.taskSystem.showHint(`金币不足！需要 ${price} 金币`);
      return false;
    }
    this.game.updateStats('coins', -price);
    this.addMaterial(materialId, 1);
    this.stats.totalCoinsSpent += price;
    this.game.saveProgress();
    this.game.taskSystem.showHint(`✅ 购买了 ${material.icon} ${material.name}`);
    this.game.checkTasks('repair_buy_material');
    this.renderAll();
    return true;
  }

  applyCatchWear(hullLoss = 1, netLoss = 2, batteryLoss = 1) {
    this.status.hull = Math.max(0, this.status.hull - hullLoss);
    this.status.net = Math.max(0, this.status.net - netLoss);
    this.status.battery = Math.max(0, this.status.battery - batteryLoss);
    this.stats.totalCatches++;

    const auto = this.getAutoRepairAmount();
    if (auto > 0) {
      this.status.hull = Math.min(this.getMaxHull(), this.status.hull + auto);
      this.status.net = Math.min(this.getMaxNet(), this.status.net + auto);
      this.status.battery = Math.min(this.getMaxBattery(), this.status.battery + auto);
    }

    this.game.saveProgress();
  }

  applyBattleDamage(damage) {
    const mult = this.getBattleDamageMultiplier();
    const finalDamage = Math.floor(damage * mult);
    this.status.hull = Math.max(0, this.status.hull - finalDamage);
    this.game.saveProgress();
    return finalDamage;
  }

  toJSON() {
    return {
      status: { ...this.status },
      materials: { ...this.materials },
      upgrades: { ...this.upgrades },
      stats: { ...this.stats }
    };
  }

  loadData(data) {
    if (!data) return;
    if (data.status) {
      this.status = { hull: 100, net: 100, battery: 100, ...data.status };
    }
    if (data.materials) this.materials = { ...data.materials };
    if (data.upgrades) {
      Object.keys(this.upgrades).forEach(key => {
        if (typeof data.upgrades[key] === 'number') {
          this.upgrades[key] = data.upgrades[key];
        }
      });
    }
    if (data.stats) this.stats = { ...this.stats, ...data.stats };
  }
}
