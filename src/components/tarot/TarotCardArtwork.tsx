interface TarotCardArtworkProps {
  cardId: string
  className?: string
}

interface ArtworkRecipe {
  paths: string[]
  circles?: Array<readonly [number, number, number]>
  lines?: Array<readonly [number, number, number, number]>
  polygons?: string[]
}

export const TAROT_ARTWORK_IDS = [
  'the-fool', 'the-magician', 'the-high-priestess', 'the-empress',
  'the-emperor', 'the-hierophant', 'the-lovers', 'the-chariot',
  'strength', 'the-hermit', 'wheel-of-fortune', 'justice',
  'the-hanged-man', 'death', 'temperance', 'the-devil',
  'the-tower', 'the-star', 'the-moon', 'the-sun', 'judgement', 'the-world',
] as const

type ArtworkId = (typeof TAROT_ARTWORK_IDS)[number]

const RECIPES: Record<ArtworkId, ArtworkRecipe> = {
  'the-fool': {
    paths: ['M18 92L48 64 67 75 90 46', 'M31 87l8-19 9 12 9-22'],
    circles: [[82, 24, 10], [28, 44, 2], [38, 34, 1.5]],
    lines: [[70, 30, 78, 25]],
  },
  'the-magician': {
    paths: ['M34 28c0-12 16-12 16 0s16 12 16 0-16-12-16 0-16 12-16 0Z', 'M50 38v48m-5-8 5 9 5-9'],
    circles: [[28, 67, 5], [72, 67, 5], [38, 88, 4], [62, 88, 4]],
  },
  'the-high-priestess': {
    paths: ['M25 88V34h14v54M61 88V34h14v54', 'M43 32a15 15 0 1 0 14 0 12 12 0 1 1-14 0Z'],
    circles: [[50, 60, 2], [44, 70, 1.5], [56, 74, 1.5]],
    lines: [[20, 92, 80, 92]],
  },
  'the-empress': {
    paths: ['M31 91V59c0-22 38-22 38 0v32', 'M29 42l7-13 8 8 6-15 6 15 8-8 7 13'],
    circles: [[50, 56, 7], [24, 72, 2], [76, 72, 2]],
    lines: [[27, 88, 38, 70], [73, 88, 62, 70]],
  },
  'the-emperor': {
    paths: ['M27 90V52h12V39h22v13h12v38Z', 'M18 57l18-18 14 10 16-19 16 27'],
    circles: [[50, 66, 6]],
    lines: [[38, 90, 38, 57], [62, 90, 62, 57], [30, 95, 70, 95]],
  },
  'the-hierophant': {
    paths: ['M38 43h24l-4-11H42Zm2-12 10-12 10 12', 'M29 83l42-31M71 83 29 52'],
    circles: [[34, 78, 5], [66, 78, 5]],
    lines: [[28, 94, 72, 94], [34, 88, 66, 88]],
  },
  'the-lovers': {
    paths: ['M22 69c17-25 39-25 56 0M22 51c17 25 39 25 56 0', 'M50 36l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z'],
    circles: [[29, 63, 8], [71, 63, 8], [50, 23, 7]],
  },
  'the-chariot': {
    paths: ['M27 77h46l-7-30H34Z', 'M35 47l-9-14 18 7m21 7 9-14-18 7'],
    circles: [[35, 84, 8], [65, 84, 8]],
    polygons: ['42,29 50,19 58,29 55,38 45,38'],
  },
  strength: {
    paths: ['M28 71l8-31 14 9 14-9 8 31-22 20Z', 'M34 28c0-12 16-12 16 0s16 12 16 0-16-12-16 0-16 12-16 0Z'],
    circles: [[42, 63, 2], [58, 63, 2]],
    lines: [[50, 67, 50, 78], [43, 79, 50, 84], [57, 79, 50, 84]],
  },
  'the-hermit': {
    paths: ['M18 96L50 43l32 53Z', 'M39 52l4-23h14l4 23-11 12Z'],
    circles: [[50, 39, 5], [50, 76, 2]],
    lines: [[32, 63, 43, 52], [68, 63, 57, 52]],
  },
  'wheel-of-fortune': {
    paths: ['M22 55c0-16 12-29 28-31m28 31c0 16-12 29-28 31', 'M28 45l-6 10-7-9m57 19 6-10 7 9'],
    circles: [[50, 55, 31], [50, 55, 21], [50, 55, 8]],
    lines: [[50, 24, 50, 86], [19, 55, 81, 55]],
  },
  justice: {
    paths: ['M50 25v67M43 32h14l-7-12Z', 'M22 50h56M29 50l-12 24h24Zm42 0L59 74h24Z'],
    circles: [[50, 50, 3]],
    lines: [[26, 88, 74, 88], [32, 92, 68, 92]],
  },
  'the-hanged-man': {
    paths: ['M20 31h60M35 31l15 18 15-18', 'M50 49v34m0 0-13 13m13-13 13 13'],
    circles: [[50, 56, 24], [50, 65, 5]],
    lines: [[39, 70, 61, 70]],
  },
  death: {
    paths: ['M31 91V47h38v44M38 47c0-16 24-16 24 0', 'M50 26c-15-12-25 7-9 11-8 14 9 19 9 3 0 16 17 1 9-7-10-15-9-13Z'],
    circles: [[76, 29, 9], [50, 68, 4]],
    lines: [[27, 95, 73, 95]],
  },
  temperance: {
    paths: ['M23 38h25l-5 26H28Zm29 36h25l-5 26H57Z', 'M43 62c16 0 9 15 18 15s1-15 16-15'],
    circles: [[25, 24, 7], [75, 24, 7]],
    lines: [[30, 85, 55, 50]],
  },
  'the-devil': {
    paths: ['M50 28 73 45 64 74H36L27 45Z', 'M18 74h17m30 0h17M22 66l-7-8m63 8 7-8'],
    circles: [[35, 83, 6], [65, 83, 6]],
    lines: [[35, 77, 29, 69], [65, 77, 71, 69]],
  },
  'the-tower': {
    paths: ['M31 95V38h38v57ZM31 38l8-10 11 10 11-10 8 10', 'M61 18 45 48h13L42 77'],
    circles: [[24, 55, 2], [78, 60, 2], [25, 76, 1.5], [75, 82, 1.5]],
  },
  'the-star': {
    paths: ['M50 20 55 40 73 32 62 49 81 55 61 60 70 79 54 67 50 88 46 67 30 79 39 60 19 55 38 49 27 32 45 40Z', 'M27 95c14-8 32-8 46 0M33 101c11-6 23-6 34 0'],
    circles: [[22, 28, 2], [78, 27, 2], [18, 77, 1.5], [82, 78, 1.5], [31, 18, 1.5], [69, 17, 1.5]],
  },
  'the-moon': {
    paths: ['M40 28a14 14 0 1 0 20 0 11 11 0 1 1-20 0Z', 'M28 95V56h14v39m16 0V56h14v39M50 98c-12-14 12-19 0-32'],
    circles: [[22, 35, 5], [78, 35, 5], [50, 48, 3]],
    lines: [[20, 100, 80, 100]],
  },
  'the-sun': {
    paths: ['M50 16v13m0 42v13M16 50h13m42 0h13M26 26l9 9m30 30 9 9m0-48-9 9M35 65l-9 9', 'M29 94l6-15 8 8 7-17 7 17 8-8 6 15'],
    circles: [[50, 50, 21], [50, 50, 7]],
  },
  judgement: {
    paths: ['M25 61h24l19-16v34L49 63H25Z', 'M31 78c4 11 12 17 19 17m-3-24c6 8 13 12 22 12m-17-20c7 5 15 7 23 6'],
    circles: [[24, 62, 4]],
    lines: [[68, 45, 77, 37], [70, 53, 82, 49]],
  },
  'the-world': {
    paths: ['M50 17c24 0 35 17 35 41S74 99 50 99 15 82 15 58 26 17 50 17Z', 'M50 34 67 58 50 82 33 58Z'],
    circles: [[19, 23, 4], [81, 23, 4], [19, 93, 4], [81, 93, 4]],
    lines: [[43, 58, 57, 58]],
  },
}

function Stars(): React.JSX.Element {
  return (
    <g className="tarot-artwork__stars">
      <circle cx="16" cy="20" r="1.5" />
      <circle cx="84" cy="20" r="1" />
      <path d="M86 42h8M90 38v8" />
    </g>
  )
}

function Artwork({ recipe }: { recipe: ArtworkRecipe }): React.JSX.Element {
  return (
    <g>
      {recipe.paths.map((d) => <path d={d} key={d} />)}
      {recipe.circles?.map(([cx, cy, r]) => <circle cx={cx} cy={cy} key={`${cx}-${cy}-${r}`} r={r} />)}
      {recipe.lines?.map(([x1, y1, x2, y2]) => <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} x2={x2} y1={y1} y2={y2} />)}
      {recipe.polygons?.map((points) => <polygon key={points} points={points} />)}
    </g>
  )
}

function FallbackArtwork(): React.JSX.Element {
  return (
    <g>
      <circle cx="50" cy="58" r="25" />
      <circle cx="50" cy="58" r="8" />
      <path d="M50 22v12M50 82v12M14 58h12M74 58h12" />
    </g>
  )
}

export function TarotCardArtwork({ cardId, className }: TarotCardArtworkProps): React.JSX.Element {
  const known = TAROT_ARTWORK_IDS.includes(cardId as ArtworkId)
  return (
    <svg
      aria-hidden="true"
      className={className}
      data-testid={`tarot-artwork-${known ? cardId : 'fallback'}`}
      fill="none"
      focusable="false"
      viewBox="0 0 100 120"
    >
      <Stars />
      {known ? <Artwork recipe={RECIPES[cardId as ArtworkId]} /> : <FallbackArtwork />}
    </svg>
  )
}
