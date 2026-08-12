import type { DecisionHistoryItem, DecisionMode } from '../types/decision'

const MODES: DecisionMode[] = ['random', 'scientific', 'mystic', 'ai']

export interface StatisticsSummary {
  totalCount: number
  monthCount: number
  regretCount: number
  obedienceRate: number | null
  favoriteModes: DecisionMode[]
  distribution: Array<{ mode: DecisionMode; count: number; percentage: number }>
  trend: Array<{ dateKey: string; label: string; count: number }>
}

function localDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function roundOne(value: number): number {
  return Number(value.toFixed(1))
}

export function calculateStatistics(
  history: DecisionHistoryItem[],
  now = new Date(),
): StatisticsSummary {
  const counts = new Map<DecisionMode, number>(MODES.map((mode) => [mode, 0]))
  for (const item of history) counts.set(item.mode, (counts.get(item.mode) ?? 0) + 1)

  const highestCount = Math.max(0, ...counts.values())
  const favoriteModes = highestCount === 0
    ? []
    : MODES.filter((mode) => counts.get(mode) === highestCount)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const regretCount = history.filter((item) => item.regrettedAt).length

  const trend = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index))
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
    const count = history.filter((item) => {
      const createdAt = new Date(item.createdAt)
      return createdAt >= start && createdAt < end
    }).length
    return {
      dateKey: localDateKey(start),
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      count,
    }
  })

  return {
    totalCount: history.length,
    monthCount: history.filter((item) => {
      const createdAt = new Date(item.createdAt)
      return createdAt >= monthStart && createdAt < nextMonth
    }).length,
    regretCount,
    obedienceRate: history.length
      ? roundOne(((history.length - regretCount) / history.length) * 100)
      : null,
    favoriteModes,
    distribution: MODES.map((mode) => {
      const count = counts.get(mode) ?? 0
      return {
        mode,
        count,
        percentage: history.length ? roundOne((count / history.length) * 100) : 0,
      }
    }),
    trend,
  }
}
