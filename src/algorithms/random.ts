export function cleanOptions(options: string[]): string[] {
  return options
    .map((option) => option.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
}

export interface RandomDraw {
  winner: string
  sample: number
  winningIndex: number
  optionCount: number
}

export function drawRandomOption(
  options: string[],
  random: () => number = Math.random,
): RandomDraw {
  const validOptions = cleanOptions(options)

  if (validOptions.length < 2) {
    throw new Error('至少需要两个有效选项')
  }

  const sample = random()
  if (sample < 0 || sample >= 1) {
    throw new Error('随机源必须返回 [0, 1) 区间内的数值')
  }

  const winningIndex = Math.floor(sample * validOptions.length)
  return {
    winner: validOptions[winningIndex],
    sample,
    winningIndex,
    optionCount: validOptions.length,
  }
}

export function chooseRandomOption(
  options: string[],
  random: () => number = Math.random,
): string {
  return drawRandomOption(options, random).winner
}
