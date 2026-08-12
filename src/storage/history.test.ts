import { describe, expect, it } from 'vitest'

import type { DecisionResult } from '../types/decision'
import {
  HISTORY_STORAGE_KEY,
  clearHistory,
  deleteHistoryItem,
  incrementHistoryItemShare,
  markHistoryItemRegretted,
  readHistory,
  saveHistoryItem,
} from './history'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

function createItem(id: string): DecisionResult {
  return {
    id,
    createdAt: new Date(Date.UTC(2026, 7, 12, 12, Number(id.replace(/\D/g, '')) || 0)).toISOString(),
    question: '今天吃什么？',
    options: [
      { id: 'hotpot', label: '火锅' },
      { id: 'sushi', label: '日料' },
    ],
    mode: 'random',
    winner: { id: 'hotpot', label: '火锅' },
    explanation: '系统已经替你决定。',
    confidence: 88,
    metrics: [],
  }
}

function createAiItem(): DecisionResult {
  return {
    ...createItem('ai-1'),
    id: 'ai-1',
    mode: 'ai',
    confidence: 89,
    details: {
      type: 'ai',
      context: '预算 100 元，今天很累。',
      advice: {
        recommended_option: '火锅',
        confidence: 89,
        verdict: '别把晚饭做成第二份工作。',
        core_reasons: ['更符合今天的体力'],
        main_tradeoff: '可能稍贵。',
        conditions_to_reconsider: ['预算收紧'],
        action_plan: ['现在下单'],
      },
    },
  }
}

describe('decision history storage', () => {
  it('returns an empty list when no history exists', () => {
    expect(readHistory(new MemoryStorage())).toEqual([])
  })

  it('saves versioned records and reads newest first', () => {
    const storage = new MemoryStorage()
    saveHistoryItem(createItem('1'), storage)
    saveHistoryItem(createItem('2'), storage)

    expect(readHistory(storage).map((item) => item.id)).toEqual(['2', '1'])
    expect(JSON.parse(storage.getItem(HISTORY_STORAGE_KEY) ?? '{}').version).toBe(2)
  })

  it('reads V1 records and writes them back as V2 without losing the decision', () => {
    const storage = new MemoryStorage()
    storage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify({ version: 1, items: [createItem('1')] }),
    )

    expect(readHistory(storage)[0]).toMatchObject({ id: '1', shareCount: 0 })

    saveHistoryItem(readHistory(storage)[0], storage)
    expect(JSON.parse(storage.getItem(HISTORY_STORAGE_KEY) ?? '{}').version).toBe(2)
  })

  it('round-trips validated AI advice details', () => {
    const storage = new MemoryStorage()
    saveHistoryItem(createAiItem(), storage)

    expect(readHistory(storage)[0]).toMatchObject({
      mode: 'ai',
      details: {
        type: 'ai',
        context: '预算 100 元，今天很累。',
        advice: {
          recommended_option: '火锅',
          confidence: 89,
          action_plan: ['现在下单'],
        },
      },
    })
  })

  it('rejects AI history with incomplete structured advice', () => {
    const storage = new MemoryStorage()
    const broken = { ...createAiItem(), details: { type: 'ai', context: '很累' } }
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ version: 2, items: [broken] }))

    expect(readHistory(storage)).toEqual([])
  })

  it('records regret once and counts successful shares', () => {
    const storage = new MemoryStorage()
    saveHistoryItem(createItem('1'), storage)

    markHistoryItemRegretted('1', '2026-08-13T08:00:00.000Z', storage)
    markHistoryItemRegretted('1', '2026-08-13T09:00:00.000Z', storage)
    incrementHistoryItemShare('1', '2026-08-13T10:00:00.000Z', storage)
    incrementHistoryItemShare('1', '2026-08-13T11:00:00.000Z', storage)

    expect(readHistory(storage)[0]).toMatchObject({
      regrettedAt: '2026-08-13T08:00:00.000Z',
      shareCount: 2,
      lastSharedAt: '2026-08-13T11:00:00.000Z',
    })
  })

  it('keeps only the 50 most recent records', () => {
    const storage = new MemoryStorage()
    for (let index = 0; index < 55; index += 1) {
      saveHistoryItem(createItem(String(index)), storage)
    }

    const history = readHistory(storage)
    expect(history).toHaveLength(50)
    expect(history[0].id).toBe('54')
    expect(history.at(-1)?.id).toBe('5')
  })

  it('deletes one record and clears all records', () => {
    const storage = new MemoryStorage()
    saveHistoryItem(createItem('1'), storage)
    saveHistoryItem(createItem('2'), storage)

    deleteHistoryItem('2', storage)
    expect(readHistory(storage).map((item) => item.id)).toEqual(['1'])

    clearHistory(storage)
    expect(readHistory(storage)).toEqual([])
  })

  it('recovers safely from corrupted or unsupported data', () => {
    const storage = new MemoryStorage()
    storage.setItem(HISTORY_STORAGE_KEY, '{broken')
    expect(readHistory(storage)).toEqual([])

    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ version: 99, items: [] }))
    expect(readHistory(storage)).toEqual([])
  })

  it('keeps valid records when the stored list also contains invalid entries', () => {
    const storage = new MemoryStorage()
    storage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify({ version: 2, items: [{ id: 'broken' }, createItem('1')] }),
    )

    expect(readHistory(storage).map((item) => item.id)).toEqual(['1'])
  })
})
