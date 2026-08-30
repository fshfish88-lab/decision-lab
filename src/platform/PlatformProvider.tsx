import { Capacitor } from '@capacitor/core'
import type { PropsWithChildren } from 'react'

import { PlatformContext, resolvePlatform } from './PlatformContext'

export function PlatformProvider({ children }: PropsWithChildren): React.JSX.Element {
  const platform = resolvePlatform({
    native: Capacitor.isNativePlatform(),
    preview: new URLSearchParams(window.location.search).get('ui'),
    isDev: import.meta.env.DEV,
  })

  return <PlatformContext.Provider value={platform}>{children}</PlatformContext.Provider>
}
