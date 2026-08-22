import type {
  DecisionOption,
  TarotCardDefinition,
  TarotOrientation,
} from '../types/decision'
import { TAROT_CARDS } from './tarotCards'

export interface TarotSpreadCard {
  position: number
  card: TarotCardDefinition
  orientation: TarotOrientation
  winner: DecisionOption
}

export interface TarotSpread {
  cards: TarotSpreadCard[]
  fingerprint: string
}

function normalizeRandom(random: () => number): number {
  const value = random()
  if (!Number.isFinite(value)) return 0
  return Math.min(0.999999999, Math.max(0, value))
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(normalizeRandom(random) * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }
  return copy
}

function fingerprint(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `TAROT-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`
}

export function createTarotSpread(
  options: readonly DecisionOption[],
  random: () => number = Math.random,
): TarotSpread {
  const validOptions = options
    .filter((option) => option.label.trim())
    .map((option) => ({ ...option, label: option.label.trim() }))
  if (validOptions.length < 2) throw new Error('至少需要两个有效选项')

  const selectedCards = shuffled(TAROT_CARDS, random).slice(0, 7)
  const optionOrder = shuffled(validOptions, random)
  const cards = selectedCards.map((card, position): TarotSpreadCard => ({
    position,
    card,
    orientation: normalizeRandom(random) < 0.68 ? 'upright' : 'reversed',
    winner: optionOrder[position % optionOrder.length],
  }))
  const signature = cards
    .map((entry) => `${entry.card.id}:${entry.orientation}:${entry.winner.id}`)
    .join('|')

  return { cards, fingerprint: fingerprint(signature) }
}

export function selectTarotCard(spread: TarotSpread, position: number): TarotSpreadCard {
  const selected = spread.cards.find((entry) => entry.position === position)
  if (!selected) throw new Error('所选塔罗牌不在当前牌阵中')
  return selected
}
