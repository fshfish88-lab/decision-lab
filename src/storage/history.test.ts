import { describe, expect, it } from 'vitest'

import type { DecisionHistoryItem } from '../types/decision'
import {
  HISTORY_STORAGE_KEY,
  clearHistory,
  deleteHistoryItem,
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

function createItem(id: string): DecisionHistoryItem {
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

describe('decision history storage', () => {
  it('returns an empty list when no history exists', () => {
    expect(readHistory(new MemoryStorage())).toEqual([])
  })

  it('saves versioned records and reads newest first', () => {
    const storage = new MemoryStorage()
    saveHistoryItem(createItem('1'), storage)
    saveHistoryItem(createItem('2'), storage)

    expect(readHistory(storage).map((item) => item.id)).toEqual(['2', '1'])
    expect(JSON.parse(storage.getItem(HISTORY_STORAGE_KEY) ?? '{}').version).toBe(1)
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
})
