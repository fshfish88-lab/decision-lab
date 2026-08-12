import type {
  DecisionHistoryItem,
  DecisionMode,
  DecisionOption,
  DecisionResult,
  HistoryStoreV2,
} from '../types/decision'

export const HISTORY_STORAGE_KEY = 'decision-lab:history'
const HISTORY_LIMIT = 50

function defaultStorage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isDecisionMode(value: unknown): value is DecisionMode {
  return value === 'random' || value === 'scientific' || value === 'mystic' || value === 'ai'
}

function normalizeOption(value: unknown): DecisionOption | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.label !== 'string') {
    return undefined
  }
  return { id: value.id, label: value.label }
}

function normalizeHistoryItem(value: unknown): DecisionHistoryItem | undefined {
  if (!isRecord(value)) return undefined

  const options = Array.isArray(value.options)
    ? value.options.map(normalizeOption).filter((option) => option !== undefined)
    : []
  const winner = normalizeOption(value.winner)
  const metricsValid = Array.isArray(value.metrics) && value.metrics.every((metric) => (
    isRecord(metric) &&
    typeof metric.key === 'string' &&
    typeof metric.label === 'string' &&
    typeof metric.value === 'number' &&
    Number.isFinite(metric.value)
  ))

  if (
    typeof value.id !== 'string' ||
    !isIsoDate(value.createdAt) ||
    typeof value.question !== 'string' ||
    options.length < 2 ||
    !isDecisionMode(value.mode) ||
    !winner ||
    !options.some((option) => option.id === winner.id) ||
    typeof value.explanation !== 'string' ||
    typeof value.confidence !== 'number' ||
    !Number.isFinite(value.confidence) ||
    !metricsValid
  ) {
    return undefined
  }

  const shareCount = typeof value.shareCount === 'number' && Number.isInteger(value.shareCount)
    ? Math.max(0, value.shareCount)
    : 0
  const normalized: DecisionHistoryItem = {
    ...(value as unknown as DecisionResult),
    options,
    winner,
    shareCount,
  }

  if (!isIsoDate(normalized.regrettedAt)) delete normalized.regrettedAt
  if (!isIsoDate(normalized.lastSharedAt)) delete normalized.lastSharedAt

  return normalized
}

function writeHistory(items: Array<DecisionResult | DecisionHistoryItem>, storage?: Storage): void {
  if (!storage) return

  const payload: HistoryStoreV2 = {
    version: 2,
    items: items
      .map(normalizeHistoryItem)
      .filter((item) => item !== undefined)
      .slice(0, HISTORY_LIMIT),
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
      (parsed.version !== 1 && parsed.version !== 2) ||
      !('items' in parsed) ||
      !Array.isArray(parsed.items)
    ) {
      return []
    }

    return parsed.items
      .map(normalizeHistoryItem)
      .filter((item) => item !== undefined)
      .slice(0, HISTORY_LIMIT)
  } catch {
    return []
  }
}

export function saveHistoryItem(
  item: DecisionResult | DecisionHistoryItem,
  storage: Storage | undefined = defaultStorage(),
): void {
  const existing = readHistory(storage).filter((record) => record.id !== item.id)
  writeHistory([item, ...existing], storage)
}

export function markHistoryItemRegretted(
  id: string,
  regrettedAt = new Date().toISOString(),
  storage: Storage | undefined = defaultStorage(),
): DecisionHistoryItem | undefined {
  const items = readHistory(storage)
  let updated: DecisionHistoryItem | undefined
  const nextItems = items.map((item) => {
    if (item.id !== id) return item
    updated = item.regrettedAt ? item : { ...item, regrettedAt }
    return updated
  })
  if (updated) writeHistory(nextItems, storage)
  return updated
}

export function incrementHistoryItemShare(
  id: string,
  sharedAt = new Date().toISOString(),
  storage: Storage | undefined = defaultStorage(),
): DecisionHistoryItem | undefined {
  const items = readHistory(storage)
  let updated: DecisionHistoryItem | undefined
  const nextItems = items.map((item) => {
    if (item.id !== id) return item
    updated = {
      ...item,
      shareCount: item.shareCount + 1,
      lastSharedAt: sharedAt,
    }
    return updated
  })
  if (updated) writeHistory(nextItems, storage)
  return updated
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
