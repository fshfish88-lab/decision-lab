import type { TarotCardDefinition, TarotMeaning, TarotOrientation } from '../types/decision'

type MeaningSeed = readonly [keywords: string[], strength: number]

function readableMeaning(
  cardName: string,
  orientation: TarotOrientation,
  seed: MeaningSeed,
  oppositeKeywords: string[],
): TarotMeaning {
  const [keywords, strength] = seed
  const upright = orientation === 'upright'
  const orientationLabel = upright ? '正位' : '逆位'

  return {
    keywords,
    strength,
    interpretation: upright
      ? `${cardName}正位代表${keywords.join('、')}。它表示这张牌的核心力量能够顺畅发挥，事情更容易呈现出“${keywords[0]}”的状态。`
      : `${cardName}逆位代表${keywords.join('、')}。它表示这张牌的力量受阻、过量或方向偏移，问题通常集中在“${keywords[0]}”。`,
    resonance: upright
      ? `牌阵会指向「{option}」，是因为它最接近${cardName}${orientationLabel}强调的“${keywords[0]}、${keywords[1]}”。在当前候选项里，这个对应关系最直接。`
      : `牌阵会指向「{option}」，不是因为它最完美，而是它最能暴露${cardName}${orientationLabel}所说的“${keywords[0]}、${keywords[1]}”。`,
    echo: upright
      ? `反面是${oppositeKeywords[0]}和${oppositeKeywords[1]}：如果把“${keywords[0]}”放得太大，原本的优势也可能变成新的限制。`
      : `需要留意${keywords[0]}和${keywords[1]}会互相放大，让一个普通选择看起来比实际更糟；逆位不等于彻底否定。`,
    punchline: `Decision Lab 已记录${cardName}${orientationLabel}的意见，责任归属仍显示为“用户本人”。`,
  }
}

function card(
  definition: Omit<TarotCardDefinition, 'upright' | 'reversed'>,
  upright: MeaningSeed,
  reversed: MeaningSeed,
): TarotCardDefinition {
  return {
    ...definition,
    upright: readableMeaning(definition.chineseName, 'upright', upright, reversed[0]),
    reversed: readableMeaning(definition.chineseName, 'reversed', reversed, upright[0]),
  }
}

export const TAROT_CARDS: readonly TarotCardDefinition[] = [
  card(
    { id: 'the-fool', number: 0, numeral: '0', name: 'THE FOOL', chineseName: '愚者' },
    [['尝试', '冒险', '新开始'], 4],
    [['准备不足', '冲动', '迟疑'], 2],
  ),
  card(
    { id: 'the-magician', number: 1, numeral: 'I', name: 'THE MAGICIAN', chineseName: '魔术师' },
    [['行动', '掌控', '资源'], 5],
    [['分心', '空转', '错配'], 2],
  ),
  card(
    { id: 'the-high-priestess', number: 2, numeral: 'II', name: 'THE HIGH PRIESTESS', chineseName: '女祭司' },
    [['直觉', '观察', '安静'], 3],
    [['忽略直觉', '信息噪声', '不安'], 2],
  ),
  card(
    { id: 'the-empress', number: 3, numeral: 'III', name: 'THE EMPRESS', chineseName: '皇后' },
    [['舒适', '丰盛', '满足'], 4],
    [['过度迁就', '消耗', '失衡'], 2],
  ),
  card(
    { id: 'the-emperor', number: 4, numeral: 'IV', name: 'THE EMPEROR', chineseName: '皇帝' },
    [['稳定', '秩序', '理性'], 5],
    [['僵化', '控制', '规则负担'], 2],
  ),
  card(
    { id: 'the-hierophant', number: 5, numeral: 'V', name: 'THE HIEROPHANT', chineseName: '教皇' },
    [['经验', '传统', '可靠'], 4],
    [['打破惯例', '独立判断', '质疑'], 3],
  ),
  card(
    { id: 'the-lovers', number: 6, numeral: 'VI', name: 'THE LOVERS', chineseName: '恋人' },
    [['偏好', '契合', '真心选择'], 5],
    [['摇摆', '不一致', '迎合'], 2],
  ),
  card(
    { id: 'the-chariot', number: 7, numeral: 'VII', name: 'THE CHARIOT', chineseName: '战车' },
    [['推进', '突破', '决心'], 5],
    [['方向偏移', '急躁', '失控'], 2],
  ),
  card(
    { id: 'strength', number: 8, numeral: 'VIII', name: 'STRENGTH', chineseName: '力量' },
    [['耐心', '勇气', '温和坚定'], 4],
    [['自我怀疑', '疲惫', '退缩'], 2],
  ),
  card(
    { id: 'the-hermit', number: 9, numeral: 'IX', name: 'THE HERMIT', chineseName: '隐者' },
    [['独处', '审慎', '内省'], 3],
    [['过度思考', '封闭', '停滞'], 2],
  ),
  card(
    { id: 'wheel-of-fortune', number: 10, numeral: 'X', name: 'WHEEL OF FORTUNE', chineseName: '命运之轮' },
    [['变化', '机会', '转折'], 5],
    [['延误', '反复', '失去节奏'], 2],
  ),
  card(
    { id: 'justice', number: 11, numeral: 'XI', name: 'JUSTICE', chineseName: '正义' },
    [['平衡', '责任', '清晰'], 4],
    [['偏见', '逃避代价', '失衡'], 2],
  ),
  card(
    { id: 'the-hanged-man', number: 12, numeral: 'XII', name: 'THE HANGED MAN', chineseName: '倒吊人' },
    [['换位', '暂停', '新视角'], 3],
    [['无效等待', '拖延', '固着'], 2],
  ),
  card(
    { id: 'death', number: 13, numeral: 'XIII', name: 'DEATH', chineseName: '死神' },
    [['结束', '改变', '更新'], 5],
    [['抗拒变化', '留恋', '停滞'], 3],
  ),
  card(
    { id: 'temperance', number: 14, numeral: 'XIV', name: 'TEMPERANCE', chineseName: '节制' },
    [['调和', '适度', '耐心'], 4],
    [['过量', '失衡', '急于求成'], 2],
  ),
  card(
    { id: 'the-devil', number: 15, numeral: 'XV', name: 'THE DEVIL', chineseName: '恶魔' },
    [['欲望', '诱惑', '坦诚'], 4],
    [['松绑', '摆脱依赖', '清醒'], 4],
  ),
  card(
    { id: 'the-tower', number: 16, numeral: 'XVI', name: 'THE TOWER', chineseName: '高塔' },
    [['打破现状', '突变', '真相'], 5],
    [['避免冲击', '延后改变', '隐患'], 3],
  ),
  card(
    { id: 'the-star', number: 17, numeral: 'XVII', name: 'THE STAR', chineseName: '星星' },
    [['希望', '长期期待', '恢复'], 5],
    [['失望', '信心不足', '距离感'], 2],
  ),
  card(
    { id: 'the-moon', number: 18, numeral: 'XVIII', name: 'THE MOON', chineseName: '月亮' },
    [['直觉', '不确定', '潜意识'], 3],
    [['迷雾散去', '识破焦虑', '澄清'], 3],
  ),
  card(
    { id: 'the-sun', number: 19, numeral: 'XIX', name: 'THE SUN', chineseName: '太阳' },
    [['快乐', '明确', '满足'], 5],
    [['期待过高', '快乐受阻', '想太多'], 3],
  ),
  card(
    { id: 'judgement', number: 20, numeral: 'XX', name: 'JUDGEMENT', chineseName: '审判' },
    [['觉醒', '复盘', '决定'], 5],
    [['自我否定', '迟疑', '拒绝结论'], 2],
  ),
  card(
    { id: 'the-world', number: 21, numeral: 'XXI', name: 'THE WORLD', chineseName: '世界' },
    [['完成', '整合', '圆满'], 5],
    [['未完成', '差最后一步', '收尾'], 4],
  ),
]
