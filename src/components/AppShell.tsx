import type { PropsWithChildren } from 'react'

import { MobileAppShell } from '../mobile/MobileAppShell'
import { usePlatform } from '../platform/PlatformContext'
import { WebAppShell } from '../web/WebAppShell'

export function AppShell({ children }: PropsWithChildren): React.JSX.Element {
  const platform = usePlatform()
  return platform === 'app'
    ? <MobileAppShell>{children}</MobileAppShell>
    : <WebAppShell>{children}</WebAppShell>
}
