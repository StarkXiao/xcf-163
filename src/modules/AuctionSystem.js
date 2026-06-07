import { Storage } from './Storage.js';
import {
  AUCTION_RIVALS,
  AUCTION_MARKET_EVENTS,
  AUCTION_DURATION,
  CONSIGNMENT_FEE_RATE,
  AUCTION_HOUSE_CUT_RATE,
  getRandomRivals,
  getRandomMarketEvent,
  calculateStartingBid,
  calculateRivalBid,
  generateRandomAuctionItem,
  generateConsignmentId,
  generateAuctionId
} from '../data/auction.js';
import { CREATURES, calculateCreatureValue } from '../data/creatures.js';

export class AuctionSystem {
  constructor(game) {
    this.game = game;

    this.marketEvent = AUCTION_MARKET_EVENTS[1];
    this.hallAuctions = [];
    this.activeBidding = null;
    this.consignments = [];
    this.collection = new Map();
    this.stats = {
      totalAuctionsParticipated: 0,
      totalAuctionsWon: 0,
      totalCoinsSpent: 0,
      totalConsignments: 0,
      totalConsignmentsSold: 0,
      totalCoinsEarned: 0,
      highestBid: 0,
      highestSale: 0
    };

    this.modal = null;
    this.tabBtns = null;
    this.tabContents = null;
    this.currentTab = 'hall';
    this.lastRefreshTime = 0;
    this.HALL_REFRESH_MS = 5 * 60 * 1000;

    this.bidTimer = null;
    this.bidEndAt = 0;

    this.initElements();
    this.bindStaticEvents();
    this.refreshHallIfNeeded();
  }

  initElements() {
    this.modal = document.getElementById('auction-modal');
    this.tabBtns = document.querySelectorAll('.auction-tab');
    this.tabContents = document.querySelectorAll('.auction-tab-content');
  }

  bindStaticEvents() {
    const btn = document.getElementById('btn-auction');
    if (btn) {
      btn.addEventListener('click', () => this.open());
    }
    const closeBtn = document.getElementById('btn-close-auction');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  bindDynamicEvents() {
    this.tabBtns = document.querySelectorAll('.auction-tab');
    this.tabContents = document.querySelectorAll('.auction-tab-content');

    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          this.switchTab(tab);
        });
      });
    }

    this.bindHallAuctionEvents();
    this.bindConsignmentEvents();
    this.bindBiddingEvents();
  }

  bindHallAuctionEvents() {
    const joinBtns = document.querySelectorAll('[data-auction-join]');
    joinBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const auctionId = btn.dataset.auctionJoin;
        this.joinAuction(auctionId);
      });
    });
  }

  bindConsignmentEvents() {
    const startBtn = document.getElementById('btn-start-consignment');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.openConsignmentSelector());
    }

    const confirmBtn = document.getElementById('btn-confirm-consignment');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirmConsignment());
    }

    const cancelBtns = document.querySelectorAll('[data-consignment-cancel]');
    cancelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const consignId = btn.dataset.consignmentCancel;
        this.cancelConsignment(consignId);
      });
    });
  }

  bindBiddingEvents() {
    const bidBtn = document.getElementById('btn-place-bid');
    if (bidBtn) {
      bidBtn.addEventListener('click', () => this.placePlayerBid());
    }

    const quickBidBtns = document.querySelectorAll('[data-quick-bid]');
    quickBidBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const pct = parseFloat(btn.dataset.quickBid);
        this.quickBid(pct);
      });
    });

    const quitBtn = document.getElementById('btn-quit-bidding');
    if (quitBtn) {
      quitBtn.addEventListener('click', () => this.quitBidding());
    }
  }

  refreshHallIfNeeded() {
    const now = Date.now();
    if (now - this.lastRefreshTime >= this.HALL_REFRESH_MS || this.hallAuctions.length === 0) {
      this.refreshHall();
    }
  }

  refreshHall() {
    this.hallAuctions = [];
    this.marketEvent = getRandomMarketEvent();

    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const item = generateRandomAuctionItem();
      if (!item) continue;

      const startingBid = calculateStartingBid(item.creature, item.tier, item.affixes, this.marketEvent);
      const duration = Object.values(AUCTION_DURATION)[Math.floor(Math.random() * 3)];
      const rivals = getRandomRivals(2 + Math.floor(Math.random() * 2));

      this.hallAuctions.push({
        id: generateAuctionId(),
        seller: { type: 'npc', name: '神秘收藏家', icon: '🎭' },
        creature: item.creature,
        tier: item.tier,
        affixes: item.affixes,
        startingBid,
        currentBid: startingBid,
        highestBidder: null,
        rivals: rivals.map(r => ({ ...r, active: true, lastBid: 0 })),
        duration,
        bidHistory: [{ bidder: '起拍价', amount: startingBid, at: Date.now() }],
        status: 'waiting',
        createdAt: Date.now()
      });
    }

    this.lastRefreshTime = Date.now();
    this.game.saveProgress();
  }

  open() {
    if (!this.modal) return;
    this.refreshHallIfNeeded();
    this.modal.classList.remove('hidden');
    this.game.checkTasks('auction_open');
    this.renderAll();
    this.bindDynamicEvents();
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    this.stopBiddingTimer();
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

  joinAuction(auctionId) {
    const auction = this.hallAuctions.find(a => a.id === auctionId);
    if (!auction) return;
    if (auction.status !== 'waiting') return;

    const minRequired = auction.currentBid;
    if (this.game.stats.coins < minRequired) {
      this.game.taskSystem.showHint(`金币不足！至少需要 ${minRequired} 金币参与竞拍`);
      return;
    }

    this.activeBidding = {
      ...auction,
      playerActive: true,
      playerBid: 0,
      startedAt: Date.now()
    };
    this.bidEndAt = Date.now() + auction.duration.seconds * 1000;
    this.startBiddingTimer();
    this.renderAll();
  }

  startBiddingTimer() {
    this.stopBiddingTimer();

    const tick = () => {
      if (!this.activeBidding) return;

      const now = Date.now();
      if (now >= this.bidEndAt) {
        this.settleAuction();
        return;
      }

      this.processRivalBids();
      this.renderBidding();
    };

    this.bidTimer = setInterval(tick, this.activeBidding.duration.bidInterval);
    tick();
  }

  stopBiddingTimer() {
    if (this.bidTimer) {
      clearInterval(this.bidTimer);
      this.bidTimer = null;
    }
  }

  processRivalBids() {
    if (!this.activeBidding) return;

    const { creature, tier, affixes, rivals, currentBid } = this.activeBidding;

    rivals.forEach(rival => {
      if (!rival.active) return;

      const chance = 0.3 + Math.random() * 0.4;
      if (Math.random() > chance) return;

      const nextBid = calculateRivalBid(rival, currentBid, creature, tier, affixes, this.marketEvent);
      if (nextBid === null) {
        rival.active = false;
        this.activeBidding.bidHistory.push({
          bidder: `${rival.icon} ${rival.name}`,
          amount: -1,
          at: Date.now(),
          note: '退出竞拍'
        });
        return;
      }

      if (nextBid > currentBid) {
        this.activeBidding.currentBid = nextBid;
        this.activeBidding.highestBidder = { type: 'rival', id: rival.id, name: rival.name, icon: rival.icon };
        rival.lastBid = nextBid;
        this.activeBidding.bidHistory.push({
          bidder: `${rival.icon} ${rival.name}`,
          amount: nextBid,
          at: Date.now()
        });
      }
    });
  }

  getMinimumBid() {
    if (!this.activeBidding) return 0;
    return Math.max(
      this.activeBidding.currentBid + 1,
      Math.floor(this.activeBidding.currentBid * 1.05)
    );
  }

  placePlayerBid() {
    if (!this.activeBidding) return;

    const input = document.getElementById('player-bid-input');
    const amount = parseInt(input?.value || '0', 10);
    const minBid = this.getMinimumBid();

    if (isNaN(amount) || amount < minBid) {
      this.game.taskSystem.showHint(`出价必须不低于 ${minBid} 金币`);
      return;
    }
    if (amount > this.game.stats.coins) {
      this.game.taskSystem.showHint('金币不足！');
      return;
    }

    this.executePlayerBid(amount);
  }

  quickBid(percentage) {
    if (!this.activeBidding) return;
    const current = this.activeBidding.currentBid;
    const target = Math.floor(current * (1 + percentage));
    const minBid = this.getMinimumBid();
    const amount = Math.max(minBid, target);

    if (amount > this.game.stats.coins) {
      this.game.taskSystem.showHint('金币不足！');
      return;
    }

    this.executePlayerBid(amount);
  }

  executePlayerBid(amount) {
    if (!this.activeBidding) return;

    this.activeBidding.currentBid = amount;
    this.activeBidding.playerBid = amount;
    this.activeBidding.highestBidder = { type: 'player', name: '你', icon: '🧑' };
    this.activeBidding.bidHistory.push({
      bidder: '🧑 你',
      amount,
      at: Date.now()
    });

    if (amount > this.stats.highestBid) {
      this.stats.highestBid = amount;
    }

    this.game.saveProgress();
    this.renderAll();
  }

  quitBidding() {
    if (!this.activeBidding) return;
    this.activeBidding.playerActive = false;
    this.game.taskSystem.showHint('你已退出本次竞拍');
    this.renderAll();
  }

  settleAuction() {
    if (!this.activeBidding) return;

    const auction = this.activeBidding;
    this.stopBiddingTimer();

    const won = auction.highestBidder?.type === 'player' && auction.playerActive;
    const finalPrice = auction.currentBid;

    this.stats.totalAuctionsParticipated++;

    let record = {
      id: Storage.generateAuctionRecordId(),
      type: 'bid',
      creatureId: auction.creature.id,
      creatureName: auction.creature.name,
      creatureIcon: auction.creature.icon,
      creatureRarity: auction.creature.rarity.name,
      tier: auction.tier,
      affixes: auction.affixes,
      startingBid: auction.startingBid,
      finalPrice,
      won,
      sold: false,
      createdAt: auction.createdAt,
      settledAt: Date.now(),
      sellerName: auction.seller.name
    };

    if (won) {
      this.game.updateStats('coins', -finalPrice);
      this.stats.totalAuctionsWon++;
      this.stats.totalCoinsSpent += finalPrice;

      const success = this.game.inventory.addToBackpack({
        ...auction.creature,
        tier: auction.tier,
        affixes: auction.affixes
      });

      if (!success) {
        this.game.taskSystem.showHint('背包已满！金币已退还');
        this.game.updateStats('coins', finalPrice);
        record.won = false;
      } else {
        this.addToCollection(auction.creature, auction.tier, finalPrice);
        this.game.taskSystem.showHint(`🎉 竞拍成功！以 ${finalPrice} 金币拍得「${auction.creature.name}」`);
      }
    } else if (auction.playerActive) {
      const winner = auction.highestBidder;
      this.game.taskSystem.showHint(
        `竞拍结束，${winner ? `${winner.icon} ${winner.name}` : '无人'}以 ${finalPrice} 金币拍得拍品`
      );
    }

    Storage.saveAuctionRecord(record.id, record);
    this.game.checkTasks('auction_bid');
    if (won) {
      this.game.checkTasks('auction_win');
      this.game.checkTasks('auction_collection');
      this.game.checkTasks('auction_earnings');
    }

    this.hallAuctions = this.hallAuctions.filter(a => a.id !== auction.id);
    this.activeBidding = null;
    this.game.saveProgress();
    this.renderAll();
  }

  openConsignmentSelector() {
    const selector = document.getElementById('consignment-selector');
    if (!selector) return;

    const items = this.game.inventory.getBackpackItems();
    const eligible = items.filter(it => {
      const idx = ['稀有', '史诗', '传说'].indexOf(it.rarity.name);
      return idx >= 0;
    });

    if (eligible.length === 0) {
      this.game.taskSystem.showHint('背包中没有可寄售的稀有及以上品质残骸');
      return;
    }

    selector.innerHTML = `
      <p style="color:#888;font-size:12px;margin-bottom:8px;">选择要寄售的残骸（稀有及以上品质）：</p>
      <div class="consignment-item-list">
        ${eligible.map((it, idx) => {
          const realIdx = this.game.inventory.backpack.findIndex(b => b.id === it.id && b.tier === it.tier);
          return `
            <div class="consignment-item ${it.rarity.class}" data-consign-item="${realIdx}">
              <div class="slot-rarity-border"></div>
              <span class="slot-icon">${it.icon}</span>
              <span class="slot-name">${it.name}</span>
              <span class="slot-tier">Lv.${it.tier || 1}</span>
              <span class="slot-count">x${it.count}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    selector.querySelectorAll('[data-consign-item]').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.consignItem, 10);
        this.selectConsignmentItem(idx);
      });
    });

    selector.classList.remove('hidden');
  }

  selectConsignmentItem(inventoryIndex) {
    const item = this.game.inventory.backpack[inventoryIndex];
    if (!item) return;

    this._pendingConsignment = { inventoryIndex, item };

    const baseValue = calculateCreatureValue(item, item.tier || 1, item.affixes || []);
    const suggestedMin = Math.floor(baseValue * 0.9);

    const minBidInput = document.getElementById('consignment-min-bid');
    if (minBidInput) minBidInput.value = suggestedMin;

    const fee = Math.floor(suggestedMin * CONSIGNMENT_FEE_RATE);
    const feeEl = document.getElementById('consignment-fee');
    if (feeEl) feeEl.textContent = fee;

    const previewEl = document.getElementById('consignment-preview');
    if (previewEl) {
      previewEl.innerHTML = `
        <div class="creature-display" style="background: radial-gradient(circle, rgba(${this.hexToRgb(item.rarity.color)}, 0.3) 0%, transparent 70%);">
          <span style="font-size:48px;">${item.icon}</span>
        </div>
        <p style="text-align:center;margin-top:8px;">
          <strong>${item.name}</strong> 
          <span class="${item.rarity.class}">[${item.rarity.name}]</span>
          Lv.${item.tier || 1}
        </p>
      `;
    }

    const selector = document.getElementById('consignment-selector');
    if (selector) selector.classList.add('hidden');
  }

  confirmConsignment() {
    if (!this._pendingConsignment) return;

    const { inventoryIndex, item } = this._pendingConsignment;
    const minBidInput = document.getElementById('consignment-min-bid');
    const minBid = parseInt(minBidInput?.value || '0', 10);

    if (isNaN(minBid) || minBid < 10) {
      this.game.taskSystem.showHint('起拍价至少 10 金币');
      return;
    }

    const fee = Math.floor(minBid * CONSIGNMENT_FEE_RATE);
    if (this.game.stats.coins < fee) {
      this.game.taskSystem.showHint(`金币不足！需要支付 ${fee} 金币寄售费`);
      return;
    }

    const duration = AUCTION_DURATION.NORMAL;

    this.game.updateStats('coins', -fee);

    const backpackItem = this.game.inventory.backpack[inventoryIndex];
    if (backpackItem && backpackItem.count > 1) {
      backpackItem.count--;
    } else {
      this.game.inventory.backpack.splice(inventoryIndex, 1);
    }

    const consignmentId = generateConsignmentId();
    const consignment = {
      id: consignmentId,
      creature: item,
      tier: item.tier || 1,
      affixes: item.affixes || [],
      minBid,
      currentBid: minBid,
      highestBidder: null,
      rivals: getRandomRivals(2 + Math.floor(Math.random() * 2)).map(r => ({ ...r, active: true, lastBid: 0 })),
      duration,
      bidHistory: [{ bidder: '起拍价', amount: minBid, at: Date.now() }],
      status: 'running',
      createdAt: Date.now(),
      endsAt: Date.now() + duration.seconds * 1000,
      feePaid: fee
    };

    this.consignments.push(consignment);
    this.stats.totalConsignments++;

    this._pendingConsignment = null;
    this.game.inventory.renderBackpack();
    this.game.saveProgress();
    this.game.taskSystem.showHint(`✅ 寄售成功！「${item.name}」已上架，收取 ${fee} 金币手续费`);
    this.game.checkTasks('auction_consign');
    this.renderAll();
  }

  cancelConsignment(consignmentId) {
    const idx = this.consignments.findIndex(c => c.id === consignmentId);
    if (idx < 0) return;

    const consignment = this.consignments[idx];
    if (consignment.status === 'settled') return;

    if (consignment.highestBidder) {
      this.game.taskSystem.showHint('已有买家出价，无法取消！');
      return;
    }

    this.game.inventory.addToBackpack({
      ...consignment.creature,
      tier: consignment.tier,
      affixes: consignment.affixes
    });

    this.consignments.splice(idx, 1);
    this.game.saveProgress();
    this.game.taskSystem.showHint('已取消寄售，残骸已退回背包');
    this.renderAll();
  }

  tickConsignments() {
    const now = Date.now();
    let changed = false;

    this.consignments.forEach(consignment => {
      if (consignment.status !== 'running') return;

      if (now < consignment.endsAt) {
        const { creature, tier, affixes, rivals, currentBid } = consignment;
        rivals.forEach(rival => {
          if (!rival.active) return;
          if (Math.random() > 0.25) return;

          const nextBid = calculateRivalBid(rival, currentBid, creature, tier, affixes, this.marketEvent);
          if (nextBid === null) {
            rival.active = false;
            consignment.bidHistory.push({
              bidder: `${rival.icon} ${rival.name}`,
              amount: -1,
              at: now,
              note: '退出竞拍'
            });
            return;
          }

          if (nextBid > currentBid) {
            consignment.currentBid = nextBid;
            consignment.highestBidder = { type: 'rival', id: rival.id, name: rival.name, icon: rival.icon };
            rival.lastBid = nextBid;
            consignment.bidHistory.push({
              bidder: `${rival.icon} ${rival.name}`,
              amount: nextBid,
              at: now
            });
            changed = true;
          }
        });
        return;
      }

      this.settleConsignment(consignment);
      changed = true;
    });

    if (changed) {
      this.game.saveProgress();
    }
  }

  settleConsignment(consignment) {
    consignment.status = 'settled';
    consignment.settledAt = Date.now();

    const sold = !!consignment.highestBidder;
    const finalPrice = consignment.currentBid;

    let record = {
      id: Storage.generateAuctionRecordId(),
      type: 'consign',
      creatureId: consignment.creature.id,
      creatureName: consignment.creature.name,
      creatureIcon: consignment.creature.icon,
      creatureRarity: consignment.creature.rarity.name,
      tier: consignment.tier,
      affixes: consignment.affixes,
      startingBid: consignment.minBid,
      finalPrice,
      won: false,
      sold,
      createdAt: consignment.createdAt,
      settledAt: consignment.settledAt,
      feePaid: consignment.feePaid
    };

    if (sold) {
      const houseCut = Math.floor(finalPrice * AUCTION_HOUSE_CUT_RATE);
      const earnings = finalPrice - houseCut;
      this.game.updateStats('coins', earnings);
      this.stats.totalConsignmentsSold++;
      this.stats.totalCoinsEarned += earnings;

      if (earnings > this.stats.highestSale) {
        this.stats.highestSale = earnings;
      }

      this.addToCollection(consignment.creature, consignment.tier, null, finalPrice);

      this.game.taskSystem.showHint(
        `💰 「${consignment.creature.name}」售出！成交价 ${finalPrice} 金币，扣除佣金后获得 ${earnings} 金币`
      );
      record.earnings = earnings;
      record.houseCut = houseCut;
    } else {
      this.game.inventory.addToBackpack({
        ...consignment.creature,
        tier: consignment.tier,
        affixes: consignment.affixes
      });
      this.game.taskSystem.showHint(`「${consignment.creature.name}」流拍，已退回背包`);
    }

    Storage.saveAuctionRecord(record.id, record);
    this.game.checkTasks('auction_sale');
    if (sold) {
      this.game.checkTasks('auction_collection');
      this.game.checkTasks('auction_earnings');
    }
  }

  addToCollection(creature, tier, purchasePrice = null, salePrice = null) {
    const key = creature.id;
    if (!this.collection.has(key)) {
      this.collection.set(key, {
        creatureId: creature.id,
        creatureName: creature.name,
        creatureIcon: creature.icon,
        creatureRarity: creature.rarity.name,
        firstAcquiredAt: Date.now(),
        count: 0,
        bestTier: 1,
        highestPurchasePrice: 0,
        highestSalePrice: 0,
        totalPurchased: 0,
        totalSold: 0
      });
    }

    const entry = this.collection.get(key);
    entry.count++;
    entry.bestTier = Math.max(entry.bestTier, tier);
    if (purchasePrice !== null) {
      entry.totalPurchased++;
      if (purchasePrice > entry.highestPurchasePrice) {
        entry.highestPurchasePrice = purchasePrice;
      }
    }
    if (salePrice !== null) {
      entry.totalSold++;
      if (salePrice > entry.highestSalePrice) {
        entry.highestSalePrice = salePrice;
      }
    }
  }

  getCollectionStats() {
    let totalValue = 0;
    let rarest = null;
    const rarityOrder = ['普通', '优秀', '稀有', '史诗', '传说'];

    this.collection.forEach(entry => {
      if (entry.highestPurchasePrice > totalValue) {
        totalValue = entry.highestPurchasePrice;
      }
      if (entry.highestSalePrice > totalValue) {
        totalValue = entry.highestSalePrice;
      }
      if (!rarest || rarityOrder.indexOf(entry.creatureRarity) > rarityOrder.indexOf(rarest.creatureRarity)) {
        rarest = entry;
      }
    });

    return {
      uniqueCount: this.collection.size,
      totalTransactions: this.stats.totalAuctionsWon + this.stats.totalConsignmentsSold,
      highestPurchase: this.stats.highestBid,
      highestSale: this.stats.highestSale,
      rarest
    };
  }

  renderAll() {
    this.renderMarketStatus();
    this.renderHall();
    this.renderConsignments();
    this.renderBidding();
    this.renderCollection();
    this.renderStats();
  }

  renderMarketStatus() {
    const el = document.getElementById('auction-market-status');
    if (!el) return;

    const nextRefresh = Math.max(0, this.HALL_REFRESH_MS - (Date.now() - this.lastRefreshTime));
    const minutes = Math.floor(nextRefresh / 60000);
    const seconds = Math.floor((nextRefresh % 60000) / 1000);

    el.innerHTML = `
      <div class="market-status-card ${this.marketEvent.id}">
        <div class="market-status-header">
          <span class="market-status-icon">${this.marketEvent.icon}</span>
          <div>
            <div class="market-status-name">${this.marketEvent.name}</div>
            <div class="market-status-desc">${this.marketEvent.desc}</div>
          </div>
          <div class="market-status-refresh">
            ${minutes > 0 ? `${minutes}分` : ''}${seconds}秒后刷新
          </div>
        </div>
      </div>
    `;
  }

  renderHall() {
    const el = document.getElementById('auction-hall');
    if (!el) return;

    if (this.hallAuctions.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px;color:#666;">
          <p style="font-size:48px;margin-bottom:16px;">🔨</p>
          <p>暂无拍卖品，刷新中...</p>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <p class="auction-hint">当前拍卖厅中的稀有残骸，点击「参与竞拍」出价</p>
      <div class="auction-list">
        ${this.hallAuctions.map(auction => {
          const c = auction.creature;
          const baseValue = calculateCreatureValue(c, auction.tier, auction.affixes);
          return `
            <div class="auction-card ${c.rarity.class}">
              <div class="auction-card-header">
                <div class="auction-seller">
                  <span>${auction.seller.icon}</span>
                  <span>${auction.seller.name}</span>
                </div>
                <div class="auction-duration">${auction.duration.name}</div>
              </div>
              <div class="auction-card-body">
                <div class="auction-item-display" style="background: radial-gradient(circle, rgba(${this.hexToRgb(c.rarity.color)}, 0.3) 0%, transparent 70%);">
                  <span style="font-size:56px;">${c.icon}</span>
                  ${auction.tier > 1 ? `<span class="auction-tier-badge">+${auction.tier - 1}</span>` : ''}
                </div>
                <div class="auction-item-info">
                  <div class="auction-item-name">${c.name}</div>
                  <div class="auction-item-rarity ${c.rarity.class}">${c.rarity.name}</div>
                  <div class="auction-item-desc">${c.desc}</div>
                </div>
              </div>
              <div class="auction-card-footer">
                <div class="auction-price-info">
                  <div class="auction-price-label">当前出价</div>
                  <div class="auction-price-value">💰 ${auction.currentBid}</div>
                  <div class="auction-price-sub">估价 ≈ ${baseValue} 金</div>
                </div>
                <div class="auction-rivals">
                  ${auction.rivals.map(r => `<span title="${r.name}" style="font-size:18px;">${r.icon}</span>`).join('')}
                  <span style="color:#666;font-size:11px;">${auction.rivals.length}位对手</span>
                </div>
                <button class="modal-btn accent full-width" data-auction-join="${auction.id}">
                  🔨 参与竞拍
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindHallAuctionEvents();
  }

  renderConsignments() {
    this.tickConsignments();

    const el = document.getElementById('auction-consignments');
    if (!el) return;

    const pending = this.consignments.filter(c => c.status === 'running');
    const settled = this.consignments.filter(c => c.status === 'settled').slice(0, 10);

    el.innerHTML = `
      <div class="consignment-actions">
        <button class="modal-btn primary" id="btn-start-consignment">📤 发起寄售</button>
        <span style="color:#888;font-size:12px;margin-left:8px;">
          手续费：起拍价 × ${(CONSIGNMENT_FEE_RATE * 100).toFixed(0)}%，成交佣金：${(AUCTION_HOUSE_CUT_RATE * 100).toFixed(0)}%
        </span>
      </div>

      <div id="consignment-selector" class="hidden"></div>

      <div id="consignment-setup" class="consignment-setup hidden">
        <div id="consignment-preview"></div>
        <div class="consignment-form">
          <div class="stat-row">
            <span class="stat-name">起拍价</span>
            <input type="number" id="consignment-min-bid" min="10" value="100" style="width:120px;" />
          </div>
          <div class="stat-row">
            <span class="stat-name">手续费</span>
            <span class="stat-data" id="consignment-fee">0</span>
          </div>
          <button class="modal-btn accent full-width" id="btn-confirm-consignment">✅ 确认寄售</button>
        </div>
      </div>

      <p class="auction-hint" style="margin-top:16px;">进行中的寄售</p>
      ${pending.length === 0
        ? '<p style="text-align:center;color:#666;padding:20px;">暂无进行中的寄售</p>'
        : `<div class="consignment-list">
            ${pending.map(c => this.renderConsignmentCard(c)).join('')}
          </div>`
      }

      ${settled.length > 0 ? `
        <p class="auction-hint" style="margin-top:16px;">已结算</p>
        <div class="consignment-list">
          ${settled.map(c => this.renderConsignmentCard(c)).join('')}
        </div>
      ` : ''}
    `;

    this.bindConsignmentEvents();
  }

  renderConsignmentCard(c) {
    const remaining = c.status === 'running' ? Math.max(0, c.endsAt - Date.now()) : 0;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    const sold = c.status === 'settled' && c.highestBidder;

    return `
      <div class="consignment-card ${c.creature.rarity.class} ${c.status}">
        <div class="consignment-card-left">
          <div class="consignment-icon" style="background: radial-gradient(circle, rgba(${this.hexToRgb(c.creature.rarity.color)}, 0.3) 0%, transparent 70%);">
            <span>${c.creature.icon}</span>
          </div>
        </div>
        <div class="consignment-card-info">
          <div class="consignment-name">
            ${c.creature.name}
            <span class="${c.creature.rarity.class}">[${c.creature.rarity.name}]</span>
            ${c.tier > 1 ? `<span class="auction-tier-badge">+${c.tier - 1}</span>` : ''}
          </div>
          <div class="consignment-status">
            ${c.status === 'running'
              ? `<span style="color:#00ffff;">⏱️ 竞拍中 · ${minutes}分${seconds}秒</span>`
              : sold
                ? `<span style="color:#44ff44;">✅ 已售出 · ${c.currentBid}金</span>`
                : `<span style="color:#888;">⏹️ 流拍</span>`
            }
          </div>
          <div class="consignment-price">
            起拍: ${c.minBid}金 · 当前: ${c.currentBid}金
            ${c.highestBidder ? ` · 最高: ${c.highestBidder.icon}${c.highestBidder.name}` : ''}
          </div>
        </div>
        <div class="consignment-card-action">
          ${c.status === 'running' && !c.highestBidder
            ? `<button class="modal-btn secondary" data-consignment-cancel="${c.id}">取消</button>`
            : ''
          }
        </div>
      </div>
    `;
  }

  renderBidding() {
    const el = document.getElementById('auction-bidding');
    if (!el) return;

    if (!this.activeBidding) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px;color:#666;">
          <p style="font-size:48px;margin-bottom:16px;">🎯</p>
          <p>选择「拍卖大厅」中的拍品参与竞拍</p>
        </div>
      `;
      return;
    }

    this.renderBiddingContent(el);
    this.bindBiddingEvents();
  }

  renderBiddingContent(el) {
    const a = this.activeBidding;
    const c = a.creature;
    const remaining = Math.max(0, this.bidEndAt - Date.now());
    const minBid = this.getMinimumBid();
    const isHighest = a.highestBidder?.type === 'player' && a.playerActive;
    const activeRivals = a.rivals.filter(r => r.active);

    el.innerHTML = `
      <div class="bidding-header">
        <div class="bidding-timer ${remaining < 10000 ? 'urgent' : ''}">
          ⏱️ ${Math.floor(remaining / 1000)}秒
        </div>
        <div class="bidding-status ${isHighest ? 'leading' : 'losing'}">
          ${!a.playerActive ? '你已退出' : isHighest ? '👑 你领先！' : '📉 你落后'}
        </div>
      </div>

      <div class="bidding-item-section ${c.rarity.class}">
        <div class="bidding-item-display" style="background: radial-gradient(circle, rgba(${this.hexToRgb(c.rarity.color)}, 0.3) 0%, transparent 70%);">
          <span style="font-size:72px;">${c.icon}</span>
          ${a.tier > 1 ? `<span class="auction-tier-badge large">+${a.tier - 1}</span>` : ''}
        </div>
        <div class="bidding-item-info">
          <div class="bidding-item-name">${c.name}</div>
          <div class="bidding-item-rarity ${c.rarity.class}">${c.rarity.name}</div>
          <div class="bidding-item-desc">${c.desc}</div>
          <div class="bidding-quote">"${c.quotes[0]}"</div>
        </div>
      </div>

      <div class="bidding-current-section">
        <div class="bidding-current-label">当前最高出价</div>
        <div class="bidding-current-price">💰 ${a.currentBid}</div>
        <div class="bidding-current-bidder">
          ${a.highestBidder
            ? `${a.highestBidder.icon} ${a.highestBidder.name}`
            : '暂无'
          }
        </div>
      </div>

      <div class="bidding-rivals">
        <div class="bidding-rivals-title">竞拍对手 (${activeRivals.length}/${a.rivals.length})</div>
        <div class="bidding-rivals-list">
          ${a.rivals.map(r => `
            <div class="rival-chip ${r.active ? '' : 'inactive'}" title="${r.desc}">
              <span style="font-size:20px;">${r.icon}</span>
              <span>${r.name}</span>
              ${r.active
                ? (r.lastBid > 0 ? `<span style="color:#ffaa00;">${r.lastBid}金</span>` : '<span style="color:#666;">观望中</span>')
                : '<span style="color:#666;">已退出</span>'
              }
            </div>
          `).join('')}
        </div>
      </div>

      ${a.playerActive ? `
        <div class="bidding-input-section">
          <div class="bidding-quick-bids">
            <button class="modal-btn secondary" data-quick-bid="0.05">+5%</button>
            <button class="modal-btn secondary" data-quick-bid="0.10">+10%</button>
            <button class="modal-btn secondary" data-quick-bid="0.20">+20%</button>
          </div>
          <div class="bidding-manual-input">
            <input type="number" id="player-bid-input" min="${minBid}" value="${minBid}"
                   placeholder="最低 ${minBid}" style="flex:1;padding:8px;" />
            <button class="modal-btn accent" id="btn-place-bid">🔨 出价</button>
          </div>
          <p style="text-align:center;color:#888;font-size:11px;margin-top:4px;">
            你的金币: 💰 ${this.game.stats.coins}
          </p>
          <button class="modal-btn secondary full-width" id="btn-quit-bidding" style="margin-top:8px;">
            🚪 放弃竞拍
          </button>
        </div>
      ` : ''}

      <div class="bidding-history">
        <div class="bidding-history-title">出价记录</div>
        <div class="bidding-history-list">
          ${a.bidHistory.slice().reverse().slice(0, 8).map(h => `
            <div class="bidding-history-item">
              <span class="bidding-history-bidder">${h.bidder}</span>
              <span class="bidding-history-amount">
                ${h.amount < 0 ? (h.note || '退出') : `💰 ${h.amount}`}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderCollection() {
    const el = document.getElementById('auction-collection');
    if (!el) return;

    if (this.collection.size === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px;color:#666;">
          <p style="font-size:48px;margin-bottom:16px;">🏆</p>
          <p>暂无拍卖收藏</p>
          <p style="font-size:12px;margin-top:8px;">竞拍成功或寄售售出后将在此展示</p>
        </div>
      `;
      return;
    }

    const entries = Array.from(this.collection.values());
    const rarityOrder = ['传说', '史诗', '稀有', '优秀', '普通'];
    entries.sort((a, b) => rarityOrder.indexOf(a.creatureRarity) - rarityOrder.indexOf(b.creatureRarity));

    el.innerHTML = `
      <p class="auction-hint">通过拍卖获得或售出的所有稀有残骸</p>
      <div class="auction-collection-grid">
        ${entries.map(entry => {
          const c = CREATURES.find(cr => cr.id === entry.creatureId);
          const color = c ? c.rarity.color : 0x888888;
          return `
            <div class="collection-card rarity-${entry.creatureRarity === '普通' ? 'common' : entry.creatureRarity === '优秀' ? 'uncommon' : entry.creatureRarity === '稀有' ? 'rare' : entry.creatureRarity === '史诗' ? 'epic' : 'legendary'}">
              <div class="collection-card-icon" style="background: radial-gradient(circle, rgba(${this.hexToRgb(color)}, 0.3) 0%, transparent 70%);">
                <span>${entry.creatureIcon}</span>
                ${entry.bestTier > 1 ? `<span class="collection-tier-badge">Lv.${entry.bestTier}</span>` : ''}
              </div>
              <div class="collection-card-name">${entry.creatureName}</div>
              <div class="collection-card-rarity ${entry.creatureRarity === '普通' ? 'rarity-common' : entry.creatureRarity === '优秀' ? 'rarity-uncommon' : entry.creatureRarity === '稀有' ? 'rarity-rare' : entry.creatureRarity === '史诗' ? 'rarity-epic' : 'rarity-legendary'}">${entry.creatureRarity}</div>
              <div class="collection-card-stats">
                <span>收藏×${entry.count}</span>
                ${entry.totalPurchased > 0 ? `<span>购入×${entry.totalPurchased}</span>` : ''}
                ${entry.totalSold > 0 ? `<span>售出×${entry.totalSold}</span>` : ''}
              </div>
              <div class="collection-card-prices">
                ${entry.highestPurchasePrice > 0 ? `<div>最高购入: <span style="color:#ff8844;">${entry.highestPurchasePrice}金</span></div>` : ''}
                ${entry.highestSalePrice > 0 ? `<div>最高售出: <span style="color:#44ff44;">${entry.highestSalePrice}金</span></div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderStats() {
    const el = document.getElementById('auction-stats');
    if (!el) return;

    const records = Storage.listAuctionRecords();
    const wonCount = records.filter(r => r.won).length;
    const soldCount = records.filter(r => r.sold).length;

    el.innerHTML = `
      <div class="auction-stats-grid">
        <div class="auction-stat-card">
          <div class="auction-stat-icon">🎯</div>
          <div class="auction-stat-value">${this.stats.totalAuctionsParticipated}</div>
          <div class="auction-stat-label">参与竞拍</div>
        </div>
        <div class="auction-stat-card">
          <div class="auction-stat-icon">🏆</div>
          <div class="auction-stat-value">${wonCount}</div>
          <div class="auction-stat-label">竞拍成功</div>
        </div>
        <div class="auction-stat-card">
          <div class="auction-stat-icon">💰</div>
          <div class="auction-stat-value">${this.stats.totalCoinsSpent}</div>
          <div class="auction-stat-label">累计花费</div>
        </div>
        <div class="auction-stat-card">
          <div class="auction-stat-icon">📤</div>
          <div class="auction-stat-value">${this.stats.totalConsignments}</div>
          <div class="auction-stat-label">发起寄售</div>
        </div>
        <div class="auction-stat-card">
          <div class="auction-stat-icon">✅</div>
          <div class="auction-stat-value">${soldCount}</div>
          <div class="auction-stat-label">成功售出</div>
        </div>
        <div class="auction-stat-card">
          <div class="auction-stat-icon">💎</div>
          <div class="auction-stat-value">${this.stats.totalCoinsEarned}</div>
          <div class="auction-stat-label">累计收益</div>
        </div>
        <div class="auction-stat-card highlight">
          <div class="auction-stat-icon">📉</div>
          <div class="auction-stat-value">${this.stats.highestBid || '—'}</div>
          <div class="auction-stat-label">最高出价</div>
        </div>
        <div class="auction-stat-card highlight">
          <div class="auction-stat-icon">📈</div>
          <div class="auction-stat-value">${this.stats.highestSale || '—'}</div>
          <div class="auction-stat-label">最高售价</div>
        </div>
      </div>
    `;
  }

  hexToRgb(hex) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `${r}, ${g}, ${b}`;
  }

  loadData(data) {
    if (!data) return;

    if (data.marketEvent) {
      const found = AUCTION_MARKET_EVENTS.find(e => e.id === data.marketEvent);
      if (found) this.marketEvent = found;
    }
    if (data.hallAuctions) {
      this.hallAuctions = data.hallAuctions.map(a => ({
        ...a,
        creature: CREATURES.find(c => c.id === a.creatureId) || a.creature
      })).filter(a => a.creature);
    }
    if (data.consignments) {
      this.consignments = data.consignments.map(c => ({
        ...c,
        creature: CREATURES.find(cr => cr.id === c.creatureId) || c.creature
      })).filter(c => c.creature);
    }
    if (data.collection) {
      this.collection = new Map();
      Object.entries(data.collection).forEach(([k, v]) => {
        this.collection.set(k, v);
      });
    }
    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }
    if (typeof data.lastRefreshTime === 'number') {
      this.lastRefreshTime = data.lastRefreshTime;
    }

    this.refreshHallIfNeeded();
  }

  toJSON() {
    return {
      marketEvent: this.marketEvent?.id,
      hallAuctions: this.hallAuctions.map(a => ({
        ...a,
        creatureId: a.creature?.id,
        creature: undefined
      })),
      consignments: this.consignments.map(c => ({
        ...c,
        creatureId: c.creature?.id,
        creature: undefined
      })),
      collection: Object.fromEntries(this.collection),
      stats: this.stats,
      lastRefreshTime: this.lastRefreshTime
    };
  }
}
