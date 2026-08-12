import type { DecisionHistoryItem, HistoryStoreV1 } from '../types/decision'

export const HISTORY_STORAGE_KEY = 'decision-lab:history'
const HISTORY_LIMIT = 50

function defaultStorage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function writeHistory(items: DecisionHistoryItem[], storage?: Storage): void {
  if (!storage) return

  const payload: HistoryStoreV1 = {
    version: 1,
    items: items.slice(0, HISTORY_LIMIT),
  }

  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // The decision flow stays usable when browser storage is unavailable.
  }
}

export function readHistory(storage: Storage | undefined = defaultStorage()): DecisionHistoryItem[] {
  if (!storage) return []

  try {
    const raw = storage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('version' in parsed) ||
      parsed.version !== 1 ||
      !('items' in parsed) ||
      !Array.isArray(parsed.items)
    ) {
      return []
    }

    return parsed.items.slice(0, HISTORY_LIMIT) as DecisionHistoryItem[]
  } catch {
    return []
  }
}

export function saveHistoryItem(
  item: DecisionHistoryItem,
  storage: Storage | undefined = defaultStorage(),
): void {
  const existing = readHistory(storage).filter((record) => record.id !== item.id)
  writeHistory([item, ...existing], storage)
}

export function deleteHistoryItem(
  id: string,
  storage: Storage | undefined = defaultStorage(),
): void {
  writeHistory(
    readHistory(storage).filter((record) => record.id !== id),
    storage,
  )
}

export function clearHistory(storage: Storage | undefined = defaultStorage()): void {
  if (!storage) return
  try {
    storage.removeItem(HISTORY_STORAGE_KEY)
  } catch {
    // Storage can be denied in privacy modes; clearing is best effort.
  }
}
