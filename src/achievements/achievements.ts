import type { DecisionHistoryItem, DecisionMode } from '../types/decision'

export type AchievementId =
  | 'first-decision'
  | 'ten-decisions'
  | 'random-servant'
  | 'science-believer'
  | 'mystic-reader'
  | 'obedient-five'

export interface AchievementStatus {
  id: AchievementId
  title: string
  description: string
  progress: number
  target: number
  unlocked: boolean
}

interface AchievementDefinition {
  id: AchievementId
  title: string
  description: string
  target: number
  progress: (history: DecisionHistoryItem[]) => number
}

function modeCount(history: DecisionHistoryItem[], mode: DecisionMode): number {
  return history.filter((item) => item.mode === mode).length
}

function obedientStreak(history: DecisionHistoryItem[]): number {
  const newest = [...history].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  )
  let streak = 0
  for (const item of newest) {
    if (item.regrettedAt || streak === 5) break
    streak += 1
  }
  return streak
}

const DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first-decision',
    title: '初次见面',
    description: '完成第一次决策。系统开始记住你的纠结。',
    target: 1,
    progress: (history) => history.length,
  },
  {
    id: 'ten-decisions',
    title: '选择困难症患者',
    description: '累计完成 10 次决策。',
    target: 10,
    progress: (history) => history.length,
  },
  {
    id: 'random-servant',
    title: '命运的奴隶',
    description: '使用随机模式 20 次。',
    target: 20,
    progress: (history) => modeCount(history, 'random'),
  },
  {
    id: 'science-believer',
    title: '科学主义者',
    description: '使用科学模式 10 次。',
    target: 10,
    progress: (history) => modeCount(history, 'scientific'),
  },
  {
    id: 'mystic-reader',
    title: '赛博算命师',
    description: '使用玄学模式 10 次。',
    target: 10,
    progress: (history) => modeCount(history, 'mystic'),
  },
  {
    id: 'obedient-five',
    title: '系统说什么就是什么',
    description: '最近连续 5 次没有反悔。',
    target: 5,
    progress: obedientStreak,
  },
]

export function evaluateAchievements(history: DecisionHistoryItem[]): AchievementStatus[] {
  return DEFINITIONS.map((definition) => {
    const progress = Math.min(definition.progress(history), definition.target)
    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      progress,
      target: definition.target,
      unlocked: progress >= definition.target,
    }
  })
}
