import {
  BarChart3,
  ChartNoAxesCombined,
  CircleHelp,
  Clock3,
  History,
  Home,
  Info,
  Sparkles,
} from 'lucide-react'

export const webNavigationItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/history', label: '决策记录', icon: Clock3 },
  { to: '/statistics', label: '统计分析', icon: BarChart3 },
  { to: '/about', label: '关于', icon: Info },
] as const

export const mobilePrimaryNavigation = [
  { label: '决策', to: '/', icon: Sparkles },
  { label: '记录', to: '/history', icon: History },
  { label: '统计', to: '/statistics', icon: ChartNoAxesCombined },
  { label: '关于', to: '/about', icon: CircleHelp },
] as const

export const mobileFlowRoutes = new Set([
  '/science',
  '/tarot',
  '/ai',
  '/analysis',
  '/result',
])

export const mobileFlowTitles: Readonly<Record<string, string>> = {
  '/science': '科学决策',
  '/tarot': '塔罗决策',
  '/ai': 'AI 决策',
  '/analysis': '正在分析',
  '/result': '决策结果',
}
