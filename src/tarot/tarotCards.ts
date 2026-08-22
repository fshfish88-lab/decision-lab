import type { TarotCardDefinition } from '../types/decision'

export const TAROT_CARDS: readonly TarotCardDefinition[] = [
  {
    id: 'the-fool', number: 0, numeral: '0', name: 'THE FOOL', chineseName: '愚者',
    upright: { keywords: ['尝试', '冒险', '新开始'], interpretation: '愚者鼓励你先迈出一步，让新的体验替代没有尽头的比较。', strength: 4 },
    reversed: { keywords: ['准备不足', '冲动', '迟疑'], interpretation: '愚者逆位提醒你放慢一点，但别把谨慎变成继续拖延的理由。', strength: 2 },
  },
  {
    id: 'the-magician', number: 1, numeral: 'I', name: 'THE MAGICIAN', chineseName: '魔术师',
    upright: { keywords: ['行动', '掌控', '资源'], interpretation: '魔术师表示条件已经齐备，最适合选择那个能立刻开始的方案。', strength: 5 },
    reversed: { keywords: ['分心', '空转', '错配'], interpretation: '魔术师逆位指出你可能把精力花在包装问题，而不是推进选择。', strength: 2 },
  },
  {
    id: 'the-high-priestess', number: 2, numeral: 'II', name: 'THE HIGH PRIESTESS', chineseName: '女祭司',
    upright: { keywords: ['直觉', '观察', '安静'], interpretation: '女祭司建议相信第一反应，答案可能早已藏在你的偏好里。', strength: 3 },
    reversed: { keywords: ['忽略直觉', '信息噪声', '不安'], interpretation: '女祭司逆位提示外界意见太多，先听清自己真正排斥什么。', strength: 2 },
  },
  {
    id: 'the-empress', number: 3, numeral: 'III', name: 'THE EMPRESS', chineseName: '皇后',
    upright: { keywords: ['舒适', '丰盛', '满足'], interpretation: '皇后偏向能带来真实舒适与满足的选择，不必为享受感到抱歉。', strength: 4 },
    reversed: { keywords: ['过度迁就', '消耗', '失衡'], interpretation: '皇后逆位提醒你别只顾照顾所有人，也要保留自己的需求。', strength: 2 },
  },
  {
    id: 'the-emperor', number: 4, numeral: 'IV', name: 'THE EMPEROR', chineseName: '皇帝',
    upright: { keywords: ['稳定', '秩序', '理性'], interpretation: '皇帝支持结构清楚、风险可控，并且能长期执行的那个方案。', strength: 5 },
    reversed: { keywords: ['僵化', '控制', '规则负担'], interpretation: '皇帝逆位表示规则可能已经压过目的，允许自己换一条路。', strength: 2 },
  },
  {
    id: 'the-hierophant', number: 5, numeral: 'V', name: 'THE HIEROPHANT', chineseName: '教皇',
    upright: { keywords: ['经验', '传统', '可靠'], interpretation: '教皇倾向经过验证的路径，此刻稳妥比刻意求新更有价值。', strength: 4 },
    reversed: { keywords: ['打破惯例', '独立判断', '质疑'], interpretation: '教皇逆位鼓励你暂时放下标准答案，按自己的尺度做决定。', strength: 3 },
  },
  {
    id: 'the-lovers', number: 6, numeral: 'VI', name: 'THE LOVERS', chineseName: '恋人',
    upright: { keywords: ['偏好', '契合', '真心选择'], interpretation: '恋人牌要求价值与行动一致，选择你真正愿意承担后果的那个。', strength: 5 },
    reversed: { keywords: ['摇摆', '不一致', '迎合'], interpretation: '恋人逆位说明你可能在替别人选择，先确认这是否真是你的问题。', strength: 2 },
  },
  {
    id: 'the-chariot', number: 7, numeral: 'VII', name: 'THE CHARIOT', chineseName: '战车',
    upright: { keywords: ['推进', '突破', '决心'], interpretation: '战车认为继续比较的收益已经很低，现在更需要果断推进。', strength: 5 },
    reversed: { keywords: ['方向偏移', '急躁', '失控'], interpretation: '战车逆位提醒你别用速度掩盖方向问题，先校准目标再行动。', strength: 2 },
  },
  {
    id: 'strength', number: 8, numeral: 'VIII', name: 'STRENGTH', chineseName: '力量',
    upright: { keywords: ['耐心', '勇气', '温和坚定'], interpretation: '力量牌支持那个需要一点勇气，却更符合长期内心秩序的选择。', strength: 4 },
    reversed: { keywords: ['自我怀疑', '疲惫', '退缩'], interpretation: '力量逆位表示你可能只是累了，先别把疲惫误判成不适合。', strength: 2 },
  },
  {
    id: 'the-hermit', number: 9, numeral: 'IX', name: 'THE HERMIT', chineseName: '隐者',
    upright: { keywords: ['独处', '审慎', '内省'], interpretation: '隐者建议减少干扰，选择那个经得起独自复盘的方案。', strength: 3 },
    reversed: { keywords: ['过度思考', '封闭', '停滞'], interpretation: '隐者逆位指出复盘已经过量，再想一轮也不会产生新证据。', strength: 2 },
  },
  {
    id: 'wheel-of-fortune', number: 10, numeral: 'X', name: 'WHEEL OF FORTUNE', chineseName: '命运之轮',
    upright: { keywords: ['变化', '机会', '转折'], interpretation: '命运之轮表示环境正在变化，顺势选择比等待完美时机更重要。', strength: 5 },
    reversed: { keywords: ['延误', '反复', '失去节奏'], interpretation: '命运之轮逆位提醒你接受不确定，并给当前方案一次明确期限。', strength: 2 },
  },
  {
    id: 'justice', number: 11, numeral: 'XI', name: 'JUSTICE', chineseName: '正义',
    upright: { keywords: ['平衡', '责任', '清晰'], interpretation: '正义牌支持证据更充分、代价更透明，也更容易解释的选择。', strength: 4 },
    reversed: { keywords: ['偏见', '逃避代价', '失衡'], interpretation: '正义逆位提示你可能低估了某项代价，需要重新看清交换条件。', strength: 2 },
  },
  {
    id: 'the-hanged-man', number: 12, numeral: 'XII', name: 'THE HANGED MAN', chineseName: '倒吊人',
    upright: { keywords: ['换位', '暂停', '新视角'], interpretation: '倒吊人建议换个角度，暂时放弃最熟悉的评判标准。', strength: 3 },
    reversed: { keywords: ['无效等待', '拖延', '固着'], interpretation: '倒吊人逆位说明暂停已经失去意义，是时候结束悬而未决。', strength: 2 },
  },
  {
    id: 'death', number: 13, numeral: 'XIII', name: 'DEATH', chineseName: '死神',
    upright: { keywords: ['结束', '改变', '更新'], interpretation: '死神牌并非坏消息，它要求结束旧循环，为新选择腾出空间。', strength: 5 },
    reversed: { keywords: ['抗拒变化', '留恋', '停滞'], interpretation: '死神逆位指出你留着某个选项，可能只是因为不舍得放弃。', strength: 3 },
  },
  {
    id: 'temperance', number: 14, numeral: 'XIV', name: 'TEMPERANCE', chineseName: '节制',
    upright: { keywords: ['调和', '适度', '耐心'], interpretation: '节制牌偏向可持续的折中方案，让不同需求获得合理位置。', strength: 4 },
    reversed: { keywords: ['过量', '失衡', '急于求成'], interpretation: '节制逆位提醒你当前方案可能太满，删去一项负担会更好。', strength: 2 },
  },
  {
    id: 'the-devil', number: 15, numeral: 'XV', name: 'THE DEVIL', chineseName: '恶魔',
    upright: { keywords: ['欲望', '诱惑', '坦诚'], interpretation: '恶魔牌把隐藏偏好摆上桌面：承认你确实想要什么并不可耻。', strength: 4 },
    reversed: { keywords: ['松绑', '摆脱依赖', '清醒'], interpretation: '恶魔逆位支持离开让你上瘾却持续消耗的那个选择。', strength: 4 },
  },
  {
    id: 'the-tower', number: 16, numeral: 'XVI', name: 'THE TOWER', chineseName: '高塔',
    upright: { keywords: ['打破现状', '突变', '真相'], interpretation: '高塔要求停止维护已经失效的平衡，接受一次必要的重启。', strength: 5 },
    reversed: { keywords: ['避免冲击', '延后改变', '隐患'], interpretation: '高塔逆位表示问题尚可缓冲，但继续回避只会累积更大代价。', strength: 3 },
  },
  {
    id: 'the-star', number: 17, numeral: 'XVII', name: 'THE STAR', chineseName: '星星',
    upright: { keywords: ['希望', '长期期待', '恢复'], interpretation: '星星牌支持那个让你重新期待未来，并愿意长期投入的方案。', strength: 5 },
    reversed: { keywords: ['失望', '信心不足', '距离感'], interpretation: '星星逆位提醒你降低不切实际的期待，但不要彻底否定可能性。', strength: 2 },
  },
  {
    id: 'the-moon', number: 18, numeral: 'XVIII', name: 'THE MOON', chineseName: '月亮',
    upright: { keywords: ['直觉', '不确定', '潜意识'], interpretation: '月亮承认信息仍不完整，此刻可以让直觉替你完成最后一步。', strength: 3 },
    reversed: { keywords: ['迷雾散去', '识破焦虑', '澄清'], interpretation: '月亮逆位表示困惑正在消退，别再让旧焦虑否决新证据。', strength: 3 },
  },
  {
    id: 'the-sun', number: 19, numeral: 'XIX', name: 'THE SUN', chineseName: '太阳',
    upright: { keywords: ['快乐', '明确', '满足'], interpretation: '太阳牌认为答案无需过度解释，选择那个让你直接感到开心的方案。', strength: 5 },
    reversed: { keywords: ['期待过高', '快乐受阻', '想太多'], interpretation: '太阳逆位指出你把简单问题想复杂了，先允许自己选择轻松。', strength: 3 },
  },
  {
    id: 'judgement', number: 20, numeral: 'XX', name: 'JUDGEMENT', chineseName: '审判',
    upright: { keywords: ['觉醒', '复盘', '决定'], interpretation: '审判牌要求根据已经学到的经验作出结论，不再重复旧循环。', strength: 5 },
    reversed: { keywords: ['自我否定', '迟疑', '拒绝结论'], interpretation: '审判逆位提醒你别因害怕后悔而拒绝任何明确答案。', strength: 2 },
  },
  {
    id: 'the-world', number: 21, numeral: 'XXI', name: 'THE WORLD', chineseName: '世界',
    upright: { keywords: ['完成', '整合', '圆满'], interpretation: '世界牌偏向整体最完整的方案，它能让这轮纠结真正收尾。', strength: 5 },
    reversed: { keywords: ['未完成', '差最后一步', '收尾'], interpretation: '世界逆位表示答案已经接近，只差你正式承诺并把它做完。', strength: 4 },
  },
]
