import { createContext, useContext } from 'react'

export type AppPlatform = 'web' | 'app'

export interface PlatformResolutionInput {
  native: boolean
  preview: string | null
  isDev: boolean
}

export function resolvePlatform({ native, preview, isDev }: PlatformResolutionInput): AppPlatform {
  if (native) return 'app'
  return isDev && preview === 'app' ? 'app' : 'web'
}

export const PlatformContext = createContext<AppPlatform>('web')

export function usePlatform(): AppPlatform {
  return useContext(PlatformContext)
}
