import type { AchievementStatus } from './achievements'

export const ACHIEVEMENT_NOTICE_KEY = 'decision-lab:achievement-notices'

function getDefaultStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function readSeenIds(storage: Storage): string[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(ACHIEVEMENT_NOTICE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function consumeNewlyUnlocked(
  statuses: AchievementStatus[],
  storage?: Storage,
): AchievementStatus[] {
  const activeStorage = arguments.length >= 2 ? storage : getDefaultStorage()

  if (!activeStorage) {
    return []
  }

  const seenIds = new Set(readSeenIds(activeStorage))
  const unlocked = statuses.filter((item) => item.unlocked)
  const newlyUnlocked = unlocked.filter((item) => !seenIds.has(item.id))

  unlocked.forEach((item) => seenIds.add(item.id))

  try {
    activeStorage.setItem(ACHIEVEMENT_NOTICE_KEY, JSON.stringify([...seenIds]))
  } catch {
    // Statistics remain available even when storage is blocked or full.
  }

  return newlyUnlocked
}
