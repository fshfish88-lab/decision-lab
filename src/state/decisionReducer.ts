import type {
  Criterion,
  DecisionMode,
  DecisionOption,
  DecisionResult,
  ScientificScoreMap,
} from '../types/decision'

export interface DecisionState {
  question: string
  options: DecisionOption[]
  mode: DecisionMode | null
  criteria: Criterion[]
  scores: ScientificScoreMap
  result: DecisionResult | null
}

export type DecisionAction =
  | { type: 'set-question'; question: string }
  | { type: 'set-option'; id: string; label: string }
  | { type: 'add-option' }
  | { type: 'remove-option'; id: string }
  | { type: 'set-mode'; mode: DecisionMode }
  | { type: 'set-criteria'; criteria: Criterion[] }
  | { type: 'set-score'; optionId: string; criterionId: string; score: number }
  | { type: 'set-result'; result: DecisionResult }
  | { type: 'clear-result' }
  | { type: 'reset-draft' }

export const DEFAULT_CRITERIA: Criterion[] = [
  { id: 'taste', name: '喜欢程度', weight: 40 },
  { id: 'price', name: '价格友好', weight: 25 },
  { id: 'distance', name: '距离便利', weight: 20 },
  { id: 'convenience', name: '执行便利', weight: 15 },
]

export const initialDecisionState: DecisionState = {
  question: '',
  options: [
    { id: 'option-1', label: '' },
    { id: 'option-2', label: '' },
  ],
  mode: null,
  criteria: DEFAULT_CRITERIA,
  scores: {},
  result: null,
}

function nextOptionId(options: DecisionOption[]): string {
  let index = 1
  while (options.some((option) => option.id === `option-${index}`)) index += 1
  return `option-${index}`
}

export function decisionReducer(
  state: DecisionState,
  action: DecisionAction,
): DecisionState {
  switch (action.type) {
    case 'set-question':
      return { ...state, question: action.question }
    case 'set-option':
      return {
        ...state,
        options: state.options.map((option) =>
          option.id === action.id ? { ...option, label: action.label } : option,
        ),
      }
    case 'add-option':
      if (state.options.length >= 10) return state
      return {
        ...state,
        options: [...state.options, { id: nextOptionId(state.options), label: '' }],
      }
    case 'remove-option':
      if (state.options.length <= 2) return state
      return {
        ...state,
        options: state.options.filter((option) => option.id !== action.id),
      }
    case 'set-mode':
      return { ...state, mode: action.mode }
    case 'set-criteria':
      return { ...state, criteria: action.criteria }
    case 'set-score':
      return {
        ...state,
        scores: {
          ...state.scores,
          [action.optionId]: {
            ...state.scores[action.optionId],
            [action.criterionId]: action.score,
          },
        },
      }
    case 'set-result':
      return { ...state, result: action.result }
    case 'clear-result':
      return { ...state, result: null }
    case 'reset-draft':
      return initialDecisionState
    default:
      return state
  }
}
