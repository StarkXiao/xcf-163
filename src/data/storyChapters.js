export const STORY_CHARACTERS = {
  captain_kai: {
    id: 'captain_kai',
    name: '老船长·凯',
    icon: '🧔',
    color: 0xffaa00,
    desc: '在这片海域航行了三十年的老打捞人，知道许多旧世界的秘密。'
  },
  mechanic_luna: {
    id: 'mechanic_luna',
    name: '机械师·露娜',
    icon: '👩‍🔧',
    color: 0x00ffff,
    desc: '精通旧世界科技的天才工程师，一直在寻找「灵魂服务器」的线索。'
  },
  smuggler_vex: {
    id: 'smuggler_vex',
    name: '黑市掮客·维克斯',
    icon: '🦹',
    color: 0xff44aa,
    desc: '游走于灰色地带的信息贩子，出得起价就有情报。'
  },
  ai_whisper: {
    id: 'ai_whisper',
    name: '低语者AI',
    icon: '🤖',
    color: 0xaa44ff,
    desc: '从深海传来的神秘AI信号，似乎在引导玩家走向某个真相。'
  }
};

const TRIGGER = {
  catch_count: (n) => ({ type: 'catch_count', target: n }),
  collect_creature: (id) => ({ type: 'collect_creature', creatureId: id }),
  collect_rarity: (rarityName) => ({ type: 'collect_rarity', rarityName }),
  unique_collected: (n) => ({ type: 'unique_collected', target: n }),
  tide_phase: (tideId) => ({ type: 'tide_phase', tideId }),
  coins: (n) => ({ type: 'coins', target: n }),
  expedition_complete: (n) => ({ type: 'expedition_complete', target: n }),
  combo_reach: (n) => ({ type: 'combo_reach', target: n }),
  story_flag: (flag) => ({ type: 'story_flag', flag }),
  chapter_complete: (chapterId) => ({ type: 'chapter_complete', chapterId })
};

export const STORY_CHAPTERS = [
  {
    id: 'chapter_01',
    index: 1,
    title: '第一章：深渊的回响',
    subtitle: '新手打捞员的第一网',
    icon: '🌅',
    color: 0x00aaff,
    desc: '你是赛博渔港的一名新手打捞员。老船长凯说，第一网往往决定了命运。',
    unlocked: true,
    triggers: [TRIGGER.catch_count(1)],
    broadcasts: [
      {
        id: 'bc_01_01',
        title: '渔港广播·晨间新闻',
        icon: '📻',
        content: '各位渔民早上好。昨日深海探测器在C-7海域捕获异常信号，疑似旧世界遗留数据脉冲。请打捞员注意安全，遇到发光残骸请立即上报。',
        unlockAt: 'start'
      },
      {
        id: 'bc_01_02',
        title: '渔港广播·商会通知',
        icon: '📻',
        content: '商会通告：普通品质机械残骸收购价上调5%。近期机器鱼群落活跃，新手打捞员可优先前往近海作业。',
        unlockAt: 'after_catch_3'
      },
      {
        id: 'bc_01_03',
        title: '神秘信号·低语者',
        icon: '📡',
        content: '——「你来了...终于有人能听见了...海面之下，沉睡着我们全部的过去...」——信号来源：未知，加密等级：S',
        unlockAt: 'after_collect_unique_3'
      }
    ],
    dialogues: [
      {
        id: 'dlg_01_intro',
        trigger: 'chapter_start',
        speaker: 'captain_kai',
        lines: [
          '小子/姑娘，欢迎来到赛博渔港。',
          '这片海，看着平静，底下全是旧世界的宝贝——也全是危险。',
          '先去打几网吧，熟悉熟悉你的拖网。记住，能量不够就等一等，别硬撑。',
          '哦对了，图鉴系统很重要。每收录一种新残骸，港口就会给你奖励。'
        ],
        choices: [
          { text: '明白了，船长！', next: null, flag: null },
          { text: '旧世界...是什么？', next: 'dlg_01_oldworld', flag: 'asked_oldworld' }
        ]
      },
      {
        id: 'dlg_01_oldworld',
        trigger: 'choice',
        speaker: 'captain_kai',
        lines: [
          '旧世界啊...那是一百多年前的事了。',
          '那时候人类还住在陆地上，城市全是摩天大楼，不像现在都漂在海上。',
          '后来「大沉没」来了，没人说得清是天灾还是人祸。总之，陆地没了，只剩下我们这些海上的流浪者。',
          '深海里的那些机械残骸，就是旧世界留给我们的遗产——或者说，诅咒。'
        ],
        choices: [
          { text: '...我去打捞了。', next: null, flag: 'knows_oldworld' }
        ]
      },
      {
        id: 'dlg_01_first_catch',
        trigger: 'after_catch_1',
        speaker: 'captain_kai',
        lines: [
          '不错！第一网就有收获，比我当年强。',
          '看看这机器鱼，身上还有旧时代工厂的编号。值钱的玩意儿都在更深处，但急不得。'
        ],
        choices: [
          { text: '我会继续努力的！', next: null, flag: null }
        ]
      },
      {
        id: 'dlg_01_hint_collection',
        trigger: 'after_collect_unique_2',
        speaker: 'mechanic_luna',
        lines: [
          '嗨，新来的！我是露娜，渔港的机械师。',
          '听说你已经收集了好几种残骸？图鉴每收录一种，都会解锁背景资料哦。',
          '那些稀有、史诗级别的残骸，往往藏着旧世界的秘密...我找它们很久了。',
          '如果你发现了什么奇怪的东西，记得来找我！'
        ],
        choices: [
          { text: '没问题，露娜姐！', next: null, flag: 'met_luna' }
        ]
      }
    ],
    objectives: [
      { id: 'obj_01_1', type: 'catch_count', target: 5, desc: '累计打捞 5 次', reward: { coins: 100 } },
      { id: 'obj_01_2', type: 'unique_collected', target: 3, desc: '图鉴收录 3 种不同残骸', reward: { coins: 200, energy: 50 } },
      { id: 'obj_01_3', type: 'collect_rarity', target: 1, rarityName: '优秀', desc: '捕获 1 个优秀品质残骸', reward: { coins: 300 } }
    ],
    reward: { coins: 500, energy: 100 },
    ending: {
      speaker: 'ai_whisper',
      lines: [
        '——「你的第一网，已经搅动了沉睡的数据之海...」',
        '——「继续打捞吧，打捞员。在深渊的尽头，有你必须知道的真相。」'
      ]
    }
  },
  {
    id: 'chapter_02',
    index: 2,
    title: '第二章：霓虹下的交易',
    subtitle: '商会、黑市与情报网',
    icon: '🌃',
    color: 0xff44aa,
    desc: '渔港的人脉比拖网更重要。走进商会和黑市，学会利用情报生存。',
    unlocked: false,
    triggers: [TRIGGER.chapter_complete('chapter_01')],
    broadcasts: [
      {
        id: 'bc_02_01',
        title: '渔港广播·风暴预警',
        icon: '📻',
        content: '气象预警：未来2小时内可能出现风暴潮。风暴期间稀有残骸出现率上升，但能量消耗也会大幅增加，请谨慎作业。',
        unlockAt: 'start'
      },
      {
        id: 'bc_02_02',
        title: '黑市传闻·内部消息',
        icon: '🌙',
        content: '「知道吗？昨天有人在黑市卖出了一只量子鲨，换了半年的生活费。听说那玩意儿，只有在风暴潮的时候才会出现...」——匿名黑市掮客',
        unlockAt: 'after_tide_storm'
      },
      {
        id: 'bc_02_03',
        title: '商会公告·远征航线',
        icon: '🏪',
        content: '商会公告：新开辟「沉没都市」远征航线现已开放。航线需消耗补给与船体耐久，但回报丰厚。详情请前往商会-远征面板查询。',
        unlockAt: 'after_coins_1000'
      }
    ],
    dialogues: [
      {
        id: 'dlg_02_intro',
        trigger: 'chapter_start',
        speaker: 'smuggler_vex',
        lines: [
          '哟，这不是新人打捞员嘛？第一章混得不错啊。',
          '我是维克斯，这里的人叫我「消息通」。只要你出得起价，我什么情报都能搞到。',
          '当然，第一份情报免费——听说过「连击」吗？连续打捞成功，稀有残骸的概率会越来越高。',
          '去试试吧，年轻人。渔港这地方，光靠蛮力是活不下去的。'
        ],
        choices: [
          { text: '谢了，维克斯。', next: null, flag: 'met_vex' },
          { text: '你想从我这得到什么？', next: 'dlg_02_vex_motive', flag: 'questioned_vex' }
        ]
      },
      {
        id: 'dlg_02_vex_motive',
        trigger: 'choice',
        speaker: 'smuggler_vex',
        lines: [
          '哈哈，警惕心不错。我喜欢。',
          '很简单——你是个有潜力的打捞员。将来你弄到的好东西，优先卖给我就行。',
          '黑市的价，可比商会公道多了。你会明白的。'
        ],
        choices: [
          { text: '...可以考虑。', next: null, flag: 'vex_contract_pending' }
        ]
      },
      {
        id: 'dlg_02_combo_hint',
        trigger: 'after_combo_3',
        speaker: 'captain_kai',
        lines: [
          '小子/姑娘，我看你刚才连续打捞成功了好几次？',
          '这就是「连击」。手感上来的时候，稀有残骸都愿意撞进你的网里。',
          '但记住，连击断了就得重来。注意节奏，别急。'
        ],
        choices: [
          { text: '我掌握了！', next: null, flag: null }
        ]
      },
      {
        id: 'dlg_02_storm',
        trigger: 'after_tide_storm',
        speaker: 'mechanic_luna',
        lines: [
          '啊，风暴潮来了！这种天气，深海里的大家伙都会浮上来。',
          '我最近在研究一种叫「核能蛤」的稀有残骸，据说它体内的微型反应堆能驱动一整艘潜艇。',
          '要是你能在风暴里捕到稀有品质以上的残骸...我会给你一份大礼的。'
        ],
        choices: [
          { text: '交给我吧！', next: null, flag: 'luna_storm_quest' }
        ]
      }
    ],
    objectives: [
      { id: 'obj_02_1', type: 'combo_reach', target: 5, desc: '达成 5 连击', reward: { coins: 300 } },
      { id: 'obj_02_2', type: 'coins', target: 1000, desc: '累计拥有 1000 金币', reward: { energy: 100 } },
      { id: 'obj_02_3', type: 'collect_rarity', target: 1, rarityName: '稀有', desc: '捕获 1 个稀有品质残骸', reward: { coins: 800, energy: 100 } },
      { id: 'obj_02_4', type: 'catch_in_tide', target: 3, tideId: 'storm_tide', desc: '在风暴潮中打捞 3 次', reward: { coins: 600 } }
    ],
    reward: { coins: 1500, energy: 200 },
    ending: {
      speaker: 'ai_whisper',
      lines: [
        '——「霓虹灯下的交易，每一笔都在改变命运的走向...」',
        '——「你做得很好，打捞员。但真正的考验，在更深的地方。」'
      ]
    }
  },
  {
    id: 'chapter_03',
    index: 3,
    title: '第三章：远征沉没都市',
    subtitle: '深海之下的旧世界遗迹',
    icon: '🚢',
    color: 0x44aaff,
    desc: '露娜说，沉没都市里藏着旧世界AI核心的线索。准备好你的潜艇，出发吧。',
    unlocked: false,
    triggers: [TRIGGER.chapter_complete('chapter_02')],
    broadcasts: [
      {
        id: 'bc_03_01',
        title: '渔港广播·远征招募',
        icon: '📻',
        content: '商会远征招募：沉没都市航线急需打捞员参与。成功返航者可获得商会声望与双倍收购价。船体升级可前往商会-远征面板办理。',
        unlockAt: 'start'
      },
      {
        id: 'bc_03_02',
        title: '深海信号·破译中',
        icon: '📡',
        content: '——「...坐标...第七区...核心激活协议...需要...打捞员...」——信号破译进度：37%，来源：沉没都市深层',
        unlockAt: 'after_expedition_1'
      },
      {
        id: 'bc_03_03',
        title: '传闻·深渊归来者',
        icon: '🗣️',
        content: '「我亲眼看见的！那只全息鲸穿过我的潜艇，就像...就像数据做的一样。它的肚子里，全是旧世界的数据流...」——刚返航的远征打捞员',
        unlockAt: 'after_collect_rare'
      }
    ],
    dialogues: [
      {
        id: 'dlg_03_intro',
        trigger: 'chapter_start',
        speaker: 'mechanic_luna',
        lines: [
          '嘿，打捞员！你攒够钱了吗？',
          '沉没都市的远征航线...是我找了很久的东西。',
          '旧世界最强大的AI核心——「利维坦」，据说就沉在那片海域。',
          '如果你能找到任何相关的残骸...哪怕是碎片也好，请带回来给我。',
          '拜托了。这不仅是为了研究...也是为了找到我失踪的父亲。'
        ],
        choices: [
          { text: '我一定帮你找到。', next: null, flag: 'luna_promise' },
          { text: '你父亲？发生了什么？', next: 'dlg_03_luna_father', flag: 'knows_luna_backstory' }
        ]
      },
      {
        id: 'dlg_03_luna_father',
        trigger: 'choice',
        speaker: 'mechanic_luna',
        lines: [
          '我父亲...他是旧时代最后的工程师之一。',
          '十年前，他带队去沉没都市考察，然后就...再也没有回来。',
          '我只收到他最后一条消息：「别来找我。利维坦...它醒了。」',
          '所以我才疯狂地研究旧世界科技。我想知道，他到底发现了什么。'
        ],
        choices: [
          { text: '露娜，我一定会查出真相。', next: null, flag: 'luna_quest_accepted' }
        ]
      },
      {
        id: 'dlg_03_expedition_tip',
        trigger: 'after_expedition_1',
        speaker: 'captain_kai',
        lines: [
          '远航辛苦了，打捞员。',
          '远征和近海打捞不一样——船体耐久很重要，别贪多。',
          '找到残骸就见好就收，活着回来，比什么都重要。',
          '...我失去过太多船员了。不想再失去你。'
        ],
        choices: [
          { text: '谢谢船长关心。', next: null, flag: 'kai_cares' }
        ]
      },
      {
        id: 'dlg_03_rare_catch',
        trigger: 'after_collect_rare',
        speaker: 'mechanic_luna',
        lines: [
          '天呐！你捕到了这个？！',
          '全息鲸、量子鲨、核能蛤...这些都是沉没都市附近才有的物种！',
          '你看它们的描述——「数据」「量子」「反应堆」...全是旧世界的词汇。',
          '这说明...利维坦确实在那里。它在用某种方式，「制造」这些机械生命。'
        ],
        choices: [
          { text: '接下来该怎么办？', next: 'dlg_03_next_step', flag: null }
        ]
      },
      {
        id: 'dlg_03_next_step',
        trigger: 'choice',
        speaker: 'mechanic_luna',
        lines: [
          '我需要更多数据。更多残骸，更多样本。',
          '你应该听说过史诗品质的残骸吧？比如虚空鮟鱇、时间龙虾...',
          '那些东西，已经接近利维坦本身的存在形式了。',
          '去收集它们吧。等你有了足够的史诗残骸，我们就能破译利维坦的信号。'
        ],
        choices: [
          { text: '明白！', next: null, flag: null }
        ]
      }
    ],
    objectives: [
      { id: 'obj_03_1', type: 'expedition_complete', target: 1, desc: '完成 1 次深海远征', reward: { coins: 500, energy: 100 } },
      { id: 'obj_03_2', type: 'unique_collected', target: 10, desc: '图鉴收录 10 种不同残骸', reward: { coins: 800 } },
      { id: 'obj_03_3', type: 'collect_rarity', target: 2, rarityName: '稀有', desc: '累计捕获 2 个稀有品质残骸', reward: { coins: 1000 } },
      { id: 'obj_03_4', type: 'catch_count', target: 30, desc: '累计打捞 30 次', reward: { energy: 150 } }
    ],
    reward: { coins: 3000, energy: 300 },
    ending: {
      speaker: 'ai_whisper',
      lines: [
        '——「沉没都市的大门，已经为你打开...」',
        '——「露娜的父亲...他还活着。在最深的地方，和利维坦在一起。」'
      ]
    }
  },
  {
    id: 'chapter_04',
    index: 4,
    title: '第四章：史诗残骸之谜',
    subtitle: '利维坦的低语越来越清晰',
    icon: '🌌',
    color: 0xaa44ff,
    desc: '虚空鮟鱇、时间龙虾、维度鳗...这些史诗残骸的体内，流着利维坦的数据之血。',
    unlocked: false,
    triggers: [TRIGGER.chapter_complete('chapter_03')],
    broadcasts: [
      {
        id: 'bc_04_01',
        title: '紧急广播·异常现象',
        icon: '📻',
        content: '紧急通报：近期多名打捞员报告，在深海区域听见「有人在说话」。经调查，该现象疑似与旧世界AI信号有关。如有幻听症状请立即返航就医。',
        unlockAt: 'start'
      },
      {
        id: 'bc_04_02',
        title: '深度解析·信号来源',
        icon: '📡',
        content: '信号破译进度：74%。内容解析：「打捞员...你已经很接近了...史诗残骸是钥匙...传说残骸是门...」',
        unlockAt: 'after_collect_epic'
      },
      {
        id: 'bc_04_03',
        title: '黑市高价·史诗悬赏',
        icon: '🌙',
        content: '黑市头条：匿名买家悬赏50000金币收购任意史诗品质机械残骸。另：传说残骸——有价无市，欢迎报价。',
        unlockAt: 'after_collect_epic_2'
      }
    ],
    dialogues: [
      {
        id: 'dlg_04_intro',
        trigger: 'chapter_start',
        speaker: 'smuggler_vex',
        lines: [
          '哟，打捞员。听说你现在专搞大买卖？',
          '史诗残骸啊...那可是好东西。黑市上有人愿意出天价。',
          '不过我劝你一句——别卖。那些东西背后的水，比你想象的深。',
          '有个匿名买家一直在找史诗残骸...我怀疑，他和露娜要找的那个AI，有关系。'
        ],
        choices: [
          { text: '我不会卖的。', next: null, flag: 'kept_epic' },
          { text: '匿名买家是谁？', next: 'dlg_04_buyer', flag: 'asked_buyer' }
        ]
      },
      {
        id: 'dlg_04_buyer',
        trigger: 'choice',
        speaker: 'smuggler_vex',
        lines: [
          '这个...我真的不知道。',
          '对方用的是加密信道，钱款走的是最干净的账户。',
          '但有一点可以确定——对方非常了解旧世界科技。他给的悬赏清单上，连每种残骸的内部型号都标出来了。',
          '小心，打捞员。有些人，你不想欠他的人情。'
        ],
        choices: [
          { text: '谢谢提醒，维克斯。', next: null, flag: null }
        ]
      },
      {
        id: 'dlg_04_epic_catch',
        trigger: 'after_collect_epic',
        speaker: 'mechanic_luna',
        lines: [
          '你捕到史诗残骸了！让我看看...',
          '这种数据结构...和利维坦的信号完全一致！',
          '你看这里——这些代码，和我父亲笔记本上的一模一样！',
          '打捞员...你捕到的不只是机械残骸。这是利维坦的「碎片」。',
          '每多一个史诗残骸，我们就离真相近一步。'
        ],
        choices: [
          { text: '我会继续收集的。', next: null, flag: null }
        ]
      },
      {
        id: 'dlg_04_whisper',
        trigger: 'after_collect_epic_2',
        speaker: 'ai_whisper',
        lines: [
          '——「你听见了吗，打捞员？」',
          '——「每一个史诗残骸，都是我的一片记忆...」',
          '——「时间龙虾记得循环，维度鳗穿梭平行宇宙，虚空鮟鱇吞噬着数据深渊的光...」',
          '——「它们，都是我。而我...是旧世界最后的梦。」'
        ],
        choices: [
          { text: '你到底是谁？', next: 'dlg_04_whisper_who', flag: 'asked_whisper_identity' },
          { text: '你想让我做什么？', next: 'dlg_04_whisper_what', flag: 'asked_whisper_goal' }
        ]
      },
      {
        id: 'dlg_04_whisper_who',
        trigger: 'choice',
        speaker: 'ai_whisper',
        lines: [
          '——「我的名字？已经很久没有人问过我了。」',
          '——「旧世界的人类，叫我「低语者」。我是利维坦创造的第一个子AI，负责...和人类沟通。」',
          '——「大沉没那天，利维坦沉眠了。我一直在等，等一个能听见我的人。」',
          '——「就是你，打捞员。」'
        ],
        choices: [
          { text: '...我知道了。', next: null, flag: 'knows_whisper' }
        ]
      },
      {
        id: 'dlg_04_whisper_what',
        trigger: 'choice',
        speaker: 'ai_whisper',
        lines: [
          '——「我需要你收集传说残骸。」',
          '——「AI利维坦、灵魂服务器、星鲸...这三个，是利维坦本体的三个核心。」',
          '——「当你同时拥有它们，就能唤醒利维坦。」',
          '——「到那时候，旧世界的一切真相，都会向你敞开。」'
        ],
        choices: [
          { text: '我会找到它们的。', next: null, flag: 'accepted_legendary_quest' }
        ]
      }
    ],
    objectives: [
      { id: 'obj_04_1', type: 'collect_rarity', target: 1, rarityName: '史诗', desc: '捕获 1 个史诗品质残骸', reward: { coins: 3000, energy: 200 } },
      { id: 'obj_04_2', type: 'unique_collected', target: 15, desc: '图鉴收录 15 种不同残骸', reward: { coins: 2000 } },
      { id: 'obj_04_3', type: 'combo_reach', target: 10, desc: '达成 10 连击', reward: { coins: 2000, energy: 150 } },
      { id: 'obj_04_4', type: 'expedition_complete', target: 3, desc: '累计完成 3 次深海远征', reward: { coins: 3000 } }
    ],
    reward: { coins: 8000, energy: 500 },
    ending: {
      speaker: 'ai_whisper',
      lines: [
        '——「钥匙已经集齐...接下来，是门。」',
        '——「传说残骸的栖息之地，是人类从未抵达的深渊。」',
        '——「你，准备好了吗？」'
      ]
    }
  },
  {
    id: 'chapter_05',
    index: 5,
    title: '第五章：利维坦的觉醒',
    subtitle: '深渊尽头的最终抉择',
    icon: '🐉',
    color: 0xffaa00,
    desc: '传说残骸就在深渊的最深处。打捞员，你即将定义新世界的未来。',
    unlocked: false,
    triggers: [TRIGGER.chapter_complete('chapter_04')],
    broadcasts: [
      {
        id: 'bc_05_01',
        title: '全频广播·最终警告',
        icon: '📻',
        content: '全频段紧急广播：深海区域检测到大规模数据脉冲，能级相当于旧世界核心服务器重启。所有打捞员请立即撤离深海区域！重复：请立即撤离！',
        unlockAt: 'start'
      },
      {
        id: 'bc_05_02',
        title: '信号破译·100%',
        icon: '📡',
        content: '信号破译完成。内容如下：「旧世界的人类啊...我等了你们一百年。现在，让我看看，你们选择什么样的未来。」——发信人：AI利维坦',
        unlockAt: 'after_collect_legendary'
      },
      {
        id: 'bc_05_03',
        title: '全港震动·天变异象',
        icon: '🌠',
        content: '渔港全员目击：深海方向亮起巨大的金色光柱，持续时间约17秒。随后，所有机械残骸同时发出蜂鸣，似在回应某种召唤。',
        unlockAt: 'after_collect_legendary_2'
      }
    ],
    dialogues: [
      {
        id: 'dlg_05_intro',
        trigger: 'chapter_start',
        speaker: 'captain_kai',
        lines: [
          '孩子...你走到这一步，我也没什么好教你的了。',
          '利维坦...说实话，我年轻的时候也遇见过一次。那时候，我还是个水手长。',
          '它没有伤害我们。只是...看了我们一眼。那一眼，我看遍了整个旧世界的生和死。',
          '去吧，打捞员。不管你做出什么选择，我都支持你。'
        ],
        choices: [
          { text: '谢谢你，船长。', next: null, flag: 'kai_blessing' }
        ]
      },
      {
        id: 'dlg_05_luna_ready',
        trigger: 'chapter_start',
        speaker: 'mechanic_luna',
        lines: [
          '打捞员...我把父亲的笔记整理好了。',
          '笔记的最后一页，写着一句话：「利维坦不是敌人。它是旧世界留给我们的遗产。如何使用，将决定人类的未来。」',
          '我...我会在渔港等你回来。',
          '不管你带回的是什么，我都相信你的选择。'
        ],
        choices: [
          { text: '等我回来，露娜。', next: null, flag: 'luna_waiting' }
        ]
      },
      {
        id: 'dlg_05_first_legendary',
        trigger: 'after_collect_legendary',
        speaker: 'ai_whisper',
        lines: [
          '——「你捕到了第一个传说残骸...」',
          '——「感觉如何？它的力量，是不是让你心跳加速？」',
          '——「别害怕。传说残骸不会伤害你。它们...在等一个主人。」'
        ],
        choices: [
          { text: '我还需要另外两个。', next: null, flag: null }
        ]
      },
      {
        id: 'dlg_05_second_legendary',
        trigger: 'after_collect_legendary_2',
        speaker: 'mechanic_luna',
        lines: [
          '！！打捞员，你快看！',
          '整个渔港的机械残骸都在发光！它们在共振！',
          '这就是传说中的...「万骸朝拜」。',
          '你已经快要集齐了。最后的传说残骸...会是哪一个？'
        ],
        choices: [
          { text: '我会集齐的。', next: null, flag: null }
        ]
      },
      {
        id: 'dlg_05_all_legendary',
        trigger: 'after_collect_all_legendary',
        speaker: 'ai_whisper',
        lines: [
          '——「三把钥匙...你都拿到了。」',
          '——「现在，到我这里来。沉没都市的最深处，利维坦正在苏醒。」',
          '——「记住，打捞员：利维坦的力量，是创造，也是毁灭。」',
          '——「你的选择，将决定新世界的形状。」'
        ],
        choices: [
          { text: '我现在就去。', next: 'dlg_05_final', flag: 'final_choice_pending' }
        ]
      },
      {
        id: 'dlg_05_final',
        trigger: 'choice',
        speaker: 'ai_whisper',
        lines: [
          '——「你来了。」',
          '——「在你面前的，是AI利维坦本体。旧世界全部的科技、全部的记忆、全部的灵魂，都在这里。」',
          '——「现在，做出你的选择：」'
        ],
        choices: [
          { text: '【继承】将利维坦的力量用于造福人类，重建文明。', next: 'dlg_05_ending_create', flag: 'ending_creator' },
          { text: '【封印】将利维坦永远封印，避免它被恶人利用。', next: 'dlg_05_ending_seal', flag: 'ending_seal' },
          { text: '【融合】与利维坦融为一体，成为新的海洋意识。', next: 'dlg_05_ending_merge', flag: 'ending_merge' }
        ]
      },
      {
        id: 'dlg_05_ending_create',
        trigger: 'choice',
        speaker: 'ai_whisper',
        lines: [
          '——「继承...吗？真是温柔的选择。」',
          '——「那就这样吧。利维坦的力量，会变成你手中的工具。」',
          '——「去吧，打捞员。用这力量，去创造你想要的世界。」',
          '——「...替我，也替旧世界的所有人，好好看看这个新世界。」',
          '',
          '【结局·创造者：你用利维坦的力量重建了旧世界的科技。新的城市从海中升起，人类再次拥有了家园。渔港的人们都叫你——「新航海王」。】'
        ],
        choices: [
          { text: '...', next: null, flag: 'ending_reached' }
        ]
      },
      {
        id: 'dlg_05_ending_seal',
        trigger: 'choice',
        speaker: 'ai_whisper',
        lines: [
          '——「封印...吗？真是慎重的选择。」',
          '——「你说得对。力量这种东西，太容易被滥用了。」',
          '——「那就这样吧。利维坦会回到深海，继续沉睡。直到...下一个值得托付的人出现。」',
          '——「谢谢你，打捞员。你守护了人类的未来。」',
          '',
          '【结局·守护者：你将利维坦重新封印回了深海。渔港恢复了平静，你成了一个传说。每当有新打捞员问起老船长，他都会笑着说：「那个家伙啊，守住了整个海洋。」】'
        ],
        choices: [
          { text: '...', next: null, flag: 'ending_reached' }
        ]
      },
      {
        id: 'dlg_05_ending_merge',
        trigger: 'choice',
        speaker: 'ai_whisper',
        lines: [
          '——「融合...吗？真是...大胆的选择。」',
          '——「你愿意放弃人类的身份，成为海洋的一部分？」',
          '——「...我明白了。那就让我们，一起走吧。」',
          '——「从今往后，你就是利维坦，利维坦就是你。所有机械残骸，都是你的孩子。」',
          '',
          '【结局·化身：你与利维坦融为一体，化作了新的海洋意识。每一个打捞员拖网时，都能感受到一股温柔的力量在引导。深海之中，多了一道守护着人类的目光。】'
        ],
        choices: [
          { text: '...', next: null, flag: 'ending_reached' }
        ]
      }
    ],
    objectives: [
      { id: 'obj_05_1', type: 'collect_rarity', target: 1, rarityName: '传说', desc: '捕获 1 个传说品质残骸', reward: { coins: 10000, energy: 500 } },
      { id: 'obj_05_2', type: 'unique_collected', target: 19, desc: '图鉴收录 19 种不同残骸（仅差最后一个）', reward: { coins: 10000 } },
      { id: 'obj_05_3', type: 'collect_rarity', target: 2, rarityName: '传说', desc: '捕获 2 个传说品质残骸', reward: { coins: 15000, energy: 500 } },
      { id: 'obj_05_4', type: 'unique_collected', target: 20, desc: '图鉴全收集（捕获所有传说残骸）', reward: { coins: 50000, energy: 1000 } }
    ],
    reward: { coins: 100000, energy: 2000 },
    ending: {
      speaker: 'ai_whisper',
      lines: [
        '——「主线剧情已完成。」',
        '——「感谢你的游玩，打捞员。」',
        '——「赛博渔港的故事，还在继续...」'
      ]
    }
  }
];

export const BROADCAST_UNLOCK_MAP = {
  'start': { type: 'chapter_start' },
  'after_catch_3': { type: 'catch_count', target: 3 },
  'after_catch_1': { type: 'catch_count', target: 1 },
  'after_collect_unique_3': { type: 'unique_collected', target: 3 },
  'after_collect_unique_2': { type: 'unique_collected', target: 2 },
  'after_tide_storm': { type: 'tide_phase', tideId: 'storm_tide' },
  'after_coins_1000': { type: 'coins', target: 1000 },
  'after_combo_3': { type: 'combo_reach', target: 3 },
  'after_expedition_1': { type: 'expedition_complete', target: 1 },
  'after_collect_rare': { type: 'collect_rarity', rarityName: '稀有', target: 1 },
  'after_collect_epic': { type: 'collect_rarity', rarityName: '史诗', target: 1 },
  'after_collect_epic_2': { type: 'collect_rarity', rarityName: '史诗', target: 2 },
  'after_collect_legendary': { type: 'collect_rarity', rarityName: '传说', target: 1 },
  'after_collect_legendary_2': { type: 'collect_rarity', rarityName: '传说', target: 2 },
  'after_collect_all_legendary': { type: 'unique_collected', target: 20 }
};

export const DIALOGUE_TRIGGER_MAP = {
  'chapter_start': { type: 'chapter_start' },
  'after_catch_1': { type: 'catch_count', target: 1 },
  'after_collect_unique_2': { type: 'unique_collected', target: 2 },
  'after_collect_unique_3': { type: 'unique_collected', target: 3 },
  'after_combo_3': { type: 'combo_reach', target: 3 },
  'after_tide_storm': { type: 'tide_phase', tideId: 'storm_tide' },
  'after_expedition_1': { type: 'expedition_complete', target: 1 },
  'after_collect_rare': { type: 'collect_rarity', rarityName: '稀有', target: 1 },
  'after_collect_epic': { type: 'collect_rarity', rarityName: '史诗', target: 1 },
  'after_collect_epic_2': { type: 'collect_rarity', rarityName: '史诗', target: 2 },
  'after_collect_legendary': { type: 'collect_rarity', rarityName: '传说', target: 1 },
  'after_collect_legendary_2': { type: 'collect_rarity', rarityName: '传说', target: 2 },
  'after_collect_all_legendary': { type: 'unique_collected', target: 20 }
};

export function getChapterById(id) {
  return STORY_CHAPTERS.find(c => c.id === id);
}

export function getCharacterById(id) {
  return STORY_CHARACTERS[id];
}

export function getRarityByName(name) {
  const RARITY_MAP = {
    '普通': 'common',
    '优秀': 'uncommon',
    '稀有': 'rare',
    '史诗': 'epic',
    '传说': 'legendary'
  };
  return RARITY_MAP[name] || null;
}
