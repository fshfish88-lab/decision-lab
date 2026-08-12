export const DECISION_MACHINE_TICKETS = [
  '火锅',
  '去散步',
  '买吧',
  '睡觉',
  '不去了',
  '再想五分钟',
] as const

export const DECISION_MACHINE_TICKET_INTERVAL_MS = 4200

export function getNextTicketIndex(
  currentIndex: number,
  ticketCount: number,
  randomValue = Math.random(),
): number {
  if (ticketCount <= 1) return 0

  const normalizedRandom = Math.min(Math.max(randomValue, 0), 0.999999)
  const offset = Math.floor(normalizedRandom * (ticketCount - 1)) + 1
  return (currentIndex + offset) % ticketCount
}
