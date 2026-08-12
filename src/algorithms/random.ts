export function cleanOptions(options: string[]): string[] {
  return options
    .map((option) => option.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
}

export function chooseRandomOption(
  options: string[],
  random: () => number = Math.random,
): string {
  const validOptions = cleanOptions(options)

  if (validOptions.length < 2) {
    throw new Error('至少需要两个有效选项')
  }

  const sample = random()
  if (sample < 0 || sample >= 1) {
    throw new Error('随机源必须返回 [0, 1) 区间内的数值')
  }

  return validOptions[Math.floor(sample * validOptions.length)]
}
