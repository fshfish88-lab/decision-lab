import type { TarotCardDefinition, TarotMeaning, TarotOrientation } from '../types/decision'

type Symbols = readonly [string, string, string]

function richMeaning(
  cardName: string,
  symbols: Symbols,
  orientation: TarotOrientation,
  keywords: string[],
  interpretation: string,
  strength: number,
  finalImage: string,
): TarotMeaning {
  const [primary, secondary, hidden] = symbols
  const upright = orientation === 'upright'
  return {
    keywords,
    interpretation,
    strength,
    omen: upright
      ? `${primary}越过${secondary}的边界，${hidden}随之显出此前未被看见的轮廓。牌面没有发出声音，周围的光却已悄然改变方向。`
      : `${primary}倒映在${secondary}背面，${hidden}被拉成一段迟到的影子。原本清楚的秩序正在暗处交换位置。`,
    resonance: upright
      ? `${cardName}把「{option}」放在${primary}与${hidden}交会的节点。这个名字像一枚早已落下、此刻才被听见的回声。`
      : `逆位${cardName}让「{option}」停在${secondary}尚未闭合的缝隙里。名字没有消失，只以另一种方向回应牌阵。`,
    echo: upright
      ? `${finalImage}；当最后一道光退回门后，仍有某个未被命名的符号留在原处。`
      : `${finalImage}；一切恢复平静以后，远处又传来一次不属于任何人的轻响。`,
  }
}

function card(
  definition: Omit<TarotCardDefinition, 'upright' | 'reversed'>,
  symbols: Symbols,
  upright: [string[], string, number],
  reversed: [string[], string, number],
  finalImage: string,
): TarotCardDefinition {
  return {
    ...definition,
    upright: richMeaning(definition.chineseName, symbols, 'upright', ...upright, finalImage),
    reversed: richMeaning(definition.chineseName, symbols, 'reversed', ...reversed, finalImage),
  }
}

export const TAROT_CARDS: readonly TarotCardDefinition[] = [
  card(
    { id: 'the-fool', number: 0, numeral: '0', name: 'THE FOOL', chineseName: '愚者' },
    ['悬崖上的远日', '未系紧的行囊', '三颗引路星'],
    [['尝试', '冒险', '新开始'], '愚者鼓励你先迈出一步，让新的体验替代没有尽头的比较。', 4],
    [['准备不足', '冲动', '迟疑'], '愚者逆位提醒你放慢一点，但别把谨慎变成继续拖延的理由。', 2],
    '旅人的脚步尚未落下，崖边的草叶已经向前倾斜',
  ),
  card(
    { id: 'the-magician', number: 1, numeral: 'I', name: 'THE MAGICIAN', chineseName: '魔术师' },
    ['无限结', '四元素法台', '上下相连的权杖'],
    [['行动', '掌控', '资源'], '魔术师表示条件已经齐备，最适合选择那个能立刻开始的方案。', 5],
    [['分心', '空转', '错配'], '魔术师逆位指出你可能把精力花在包装问题，而不是推进选择。', 2],
    '帷幕落下时，法台上仍多出一枚无人放置的银币',
  ),
  card(
    { id: 'the-high-priestess', number: 2, numeral: 'II', name: 'THE HIGH PRIESTESS', chineseName: '女祭司' },
    ['月光帷幕', '黑白双柱', '未开启的卷册'],
    [['直觉', '观察', '安静'], '女祭司建议相信第一反应，答案可能早已藏在你的偏好里。', 3],
    [['忽略直觉', '信息噪声', '不安'], '女祭司逆位提示外界意见太多，先听清自己真正排斥什么。', 2],
    '卷册没有翻页，封口处却留下了一枚潮湿的新月',
  ),
  card(
    { id: 'the-empress', number: 3, numeral: 'III', name: 'THE EMPRESS', chineseName: '皇后' },
    ['十二星冠', '丰盛之门', '沿门生长的麦穗'],
    [['舒适', '丰盛', '满足'], '皇后偏向能带来真实舒适与满足的选择，不必为享受感到抱歉。', 4],
    [['过度迁就', '消耗', '失衡'], '皇后逆位提醒你别只顾照顾所有人，也要保留自己的需求。', 2],
    '花园深处还有一扇小门，门后的香气无人能够辨认',
  ),
  card(
    { id: 'the-emperor', number: 4, numeral: 'IV', name: 'THE EMPEROR', chineseName: '皇帝' },
    ['四方石座', '遥远山峰', '刻着边界的方形印记'],
    [['稳定', '秩序', '理性'], '皇帝支持结构清楚、风险可控，并且能长期执行的那个方案。', 5],
    [['僵化', '控制', '规则负担'], '皇帝逆位表示规则可能已经压过目的，允许自己换一条路。', 2],
    '无人坐在石座上，扶手却在午夜留下新鲜掌纹',
  ),
  card(
    { id: 'the-hierophant', number: 5, numeral: 'V', name: 'THE HIEROPHANT', chineseName: '教皇' },
    ['三重冠', '仪式台阶', '交叠的双钥匙'],
    [['经验', '传统', '可靠'], '教皇倾向经过验证的路径，此刻稳妥比刻意求新更有价值。', 4],
    [['打破惯例', '独立判断', '质疑'], '教皇逆位鼓励你暂时放下标准答案，按自己的尺度做决定。', 3],
    '钟声准时响起，回声却来自建筑从未存在过的一侧',
  ),
  card(
    { id: 'the-lovers', number: 6, numeral: 'VI', name: 'THE LOVERS', chineseName: '恋人' },
    ['相望的双星', '交汇轨道', '上方日轮'],
    [['偏好', '契合', '真心选择'], '恋人牌要求价值与行动一致，选择你真正愿意承担后果的那个。', 5],
    [['摇摆', '不一致', '迎合'], '恋人逆位说明你可能在替别人选择，先确认这是否真是你的问题。', 2],
    '日轮落下以后，两颗星仍把同一个秘密投向不同方向',
  ),
  card(
    { id: 'the-chariot', number: 7, numeral: 'VII', name: 'THE CHARIOT', chineseName: '战车' },
    ['并行双轮', '胜利冠', '朝向相反的双兽'],
    [['推进', '突破', '决心'], '战车认为继续比较的收益已经很低，现在更需要果断推进。', 5],
    [['方向偏移', '急躁', '失控'], '战车逆位提醒你别用速度掩盖方向问题，先校准目标再行动。', 2],
    '尘埃落下后，路面仍留着第三道无人记得的车辙',
  ),
  card(
    { id: 'strength', number: 8, numeral: 'VIII', name: 'STRENGTH', chineseName: '力量' },
    ['沉静狮首', '柔和光环', '不燃烧的无限火'],
    [['耐心', '勇气', '温和坚定'], '力量牌支持那个需要一点勇气，却更符合长期内心秩序的选择。', 4],
    [['自我怀疑', '疲惫', '退缩'], '力量逆位表示你可能只是累了，先别把疲惫误判成不适合。', 2],
    '狮子没有咆哮，只朝黑暗深处看了一眼',
  ),
  card(
    { id: 'the-hermit', number: 9, numeral: 'IX', name: 'THE HERMIT', chineseName: '隐者' },
    ['孤峰提灯', '内收光束', '未融化的霜圈'],
    [['独处', '审慎', '内省'], '隐者建议减少干扰，选择那个经得起独自复盘的方案。', 3],
    [['过度思考', '封闭', '停滞'], '隐者逆位指出复盘已经过量，再想一轮也不会产生新证据。', 2],
    '山峰背面还有一盏更暗的灯，从未被任何地图记录',
  ),
  card(
    { id: 'wheel-of-fortune', number: 10, numeral: 'X', name: 'WHEEL OF FORTUNE', chineseName: '命运之轮' },
    ['三层轮盘', '四象刻度', '相向回转箭头'],
    [['变化', '机会', '转折'], '命运之轮表示环境正在变化，顺势选择比等待完美时机更重要。', 5],
    [['延误', '反复', '失去节奏'], '命运之轮逆位提醒你接受不确定，并给当前方案一次明确期限。', 2],
    '轮盘停止后，最外层仍越过了一个无人留意的符号',
  ),
  card(
    { id: 'justice', number: 11, numeral: 'XI', name: 'JUSTICE', chineseName: '正义' },
    ['水平天平', '对称双柱', '划开影子的直剑'],
    [['平衡', '责任', '清晰'], '正义牌支持证据更充分、代价更透明，也更容易解释的选择。', 4],
    [['偏见', '逃避代价', '失衡'], '正义逆位提示你可能低估了某项代价，需要重新看清交换条件。', 2],
    '空气里留着一道笔直裂缝，没人知道它通往哪一边',
  ),
  card(
    { id: 'the-hanged-man', number: 12, numeral: 'XII', name: 'THE HANGED MAN', chineseName: '倒吊人' },
    ['倒悬三角', '静止光环', '没有风的树枝'],
    [['换位', '暂停', '新视角'], '倒吊人建议换个角度，暂时放弃最熟悉的评判标准。', 3],
    [['无效等待', '拖延', '固着'], '倒吊人逆位说明暂停已经失去意义，是时候结束悬而未决。', 2],
    '树枝落下一滴向上升去的水，方向因此失去意义',
  ),
  card(
    { id: 'death', number: 13, numeral: 'XIII', name: 'DEATH', chineseName: '死神' },
    ['落日前的白花', '开启门扉', '正在消退的旧轮廓'],
    [['结束', '改变', '更新'], '死神牌并非坏消息，它要求结束旧循环，为新选择腾出空间。', 5],
    [['抗拒变化', '留恋', '停滞'], '死神逆位指出你留着某个选项，可能只是因为不舍得放弃。', 3],
    '最后一片花瓣停在门槛上方，等待尚未出现的风',
  ),
  card(
    { id: 'temperance', number: 14, numeral: 'XIV', name: 'TEMPERANCE', chineseName: '节制' },
    ['双杯水流', '日月合流处', '没有落下的银色水滴'],
    [['调和', '适度', '耐心'], '节制牌偏向可持续的折中方案，让不同需求获得合理位置。', 4],
    [['过量', '失衡', '急于求成'], '节制逆位提醒你当前方案可能太满，删去一项负担会更好。', 2],
    '水迹拼成陌生月相，片刻后又被下一滴水打散',
  ),
  card(
    { id: 'the-devil', number: 15, numeral: 'XV', name: 'THE DEVIL', chineseName: '恶魔' },
    ['倒置星形', '断续锁链', '彼此照亮的双火焰'],
    [['欲望', '诱惑', '坦诚'], '恶魔牌把隐藏偏好摆上桌面：承认你确实想要什么并不可耻。', 4],
    [['松绑', '摆脱依赖', '清醒'], '恶魔逆位支持离开让你上瘾却持续消耗的那个选择。', 4],
    '火焰熄灭后锁链仍是温的，黑暗里有人数过每一环',
  ),
  card(
    { id: 'the-tower', number: 16, numeral: 'XVI', name: 'THE TOWER', chineseName: '高塔' },
    ['贯穿裂塔的闪电', '坠落冠顶', '五颗失序星屑'],
    [['打破现状', '突变', '真相'], '高塔要求停止维护已经失效的平衡，接受一次必要的重启。', 5],
    [['避免冲击', '延后改变', '隐患'], '高塔逆位表示问题尚可缓冲，但继续回避只会累积更大代价。', 3],
    '雷声远去后，塔底一扇从不存在的小窗亮了起来',
  ),
  card(
    { id: 'the-star', number: 17, numeral: 'XVII', name: 'THE STAR', chineseName: '星星' },
    ['八芒主星', '七颗伴星', '抵达岸边的三圈涟漪'],
    [['希望', '长期期待', '恢复'], '星星牌支持那个让你重新期待未来，并愿意长期投入的方案。', 5],
    [['失望', '信心不足', '距离感'], '星星逆位提醒你降低不切实际的期待，但不要彻底否定可能性。', 2],
    '天亮以后水面仍保留一颗星，而天空中已找不到它',
  ),
  card(
    { id: 'the-moon', number: 18, numeral: 'XVIII', name: 'THE MOON', chineseName: '月亮' },
    ['三重月相', '沉默双塔', '雾中蜿蜒路径'],
    [['直觉', '不确定', '潜意识'], '月亮承认信息仍不完整，此刻可以让直觉替你完成最后一步。', 3],
    [['迷雾散去', '识破焦虑', '澄清'], '月亮逆位表示困惑正在消退，别再让旧焦虑否决新证据。', 3],
    '路径尽头传来水声，地图上却只有一弯倒置新月',
  ),
  card(
    { id: 'the-sun', number: 19, numeral: 'XIX', name: 'THE SUN', chineseName: '太阳' },
    ['主日轮', '开放花冠', '四向无影光芒'],
    [['快乐', '明确', '满足'], '太阳牌认为答案无需过度解释，选择那个让你直接感到开心的方案。', 5],
    [['期待过高', '快乐受阻', '想太多'], '太阳逆位指出你把简单问题想复杂了，先允许自己选择轻松。', 3],
    '最后一道影子缩回门后，金色尘埃仍停在半空',
  ),
  card(
    { id: 'judgement', number: 20, numeral: 'XX', name: 'JUDGEMENT', chineseName: '审判' },
    ['唤醒号角', '三道上升弧线', '迟到的三重回声'],
    [['觉醒', '复盘', '决定'], '审判牌要求根据已经学到的经验作出结论，不再重复旧循环。', 5],
    [['自我否定', '迟疑', '拒绝结论'], '审判逆位提醒你别因害怕后悔而拒绝任何明确答案。', 2],
    '号角放下以后，远方传来比原声更清晰的第四次回声',
  ),
  card(
    { id: 'the-world', number: 21, numeral: 'XXI', name: 'THE WORLD', chineseName: '世界' },
    ['椭圆花环', '四角守望', '中央完成之印'],
    [['完成', '整合', '圆满'], '世界牌偏向整体最完整的方案，它能让这轮纠结真正收尾。', 5],
    [['未完成', '差最后一步', '收尾'], '世界逆位表示答案已经接近，只差你正式承诺并把它做完。', 4],
    '花环闭合后仍留一道细小开口，通往无人命名的地方',
  ),
]
