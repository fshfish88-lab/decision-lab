import { describe, expect, it } from 'vitest'

import type { AchievementStatus } from './achievements'
import { ACHIEVEMENT_NOTICE_KEY, consumeNewlyUnlocked } from './unlockState'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()
  get length(): number { return this.values.size }
  clear(): void { this.values.clear() }
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null }
  removeItem(key: string): void { this.values.delete(key) }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

const statuses: AchievementStatus[] = [
  { id: 'first-decision', title: '初次见面', description: '完成第一次决策。', progress: 1, target: 1, unlocked: true },
  { id: 'ten-decisions', title: '选择困难症患者', description: '累计完成 10 次。', progress: 1, target: 10, unlocked: false },
]

describe('consumeNewlyUnlocked', () => {
  it('returns each unlocked achievement only once', () => {
    const storage = new MemoryStorage()

    expect(consumeNewlyUnlocked(statuses, storage).map((item) => item.id)).toEqual(['first-decision'])
    expect(consumeNewlyUnlocked(statuses, storage)).toEqual([])
    expect(JSON.parse(storage.getItem(ACHIEVEMENT_NOTICE_KEY) ?? '[]')).toEqual(['first-decision'])
  })

  it('recovers from unavailable or corrupted storage', () => {
    const storage = new MemoryStorage()
    storage.setItem(ACHIEVEMENT_NOTICE_KEY, '{broken')
    expect(consumeNewlyUnlocked(statuses, storage)).toHaveLength(1)
    expect(consumeNewlyUnlocked(statuses, undefined)).toEqual([])
  })
})
