import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect, useRef } from 'react'

import { usePlatform } from '../../platform/PlatformContext'
import { useMobileNavigation } from './MobileNavigationContext'

export function useNativeBackNavigation(): void {
  const platform = usePlatform()
  const navigation = useMobileNavigation()
  const navigationRef = useRef(navigation)

  useEffect(() => {
    navigationRef.current = navigation
  }, [navigation])

  useEffect(() => {
    if (platform !== 'app' || !Capacitor.isNativePlatform()) return

    let disposed = false
    let activeHandles: Array<{ remove: () => Promise<void> }> = []
    const handlesPromise = Promise.all([
      App.addListener('backButton', async () => {
        const current = navigationRef.current
        if (current.closeTopOverlay()) return
        if (current.historyDepth > 0 || !current.isRoot) {
          current.navigateBack()
          return
        }
        if (!current.exitPending) {
          current.armExit()
          return
        }
        await App.exitApp()
      }),
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) navigationRef.current.clearExitPending()
      }),
    ])

    void handlesPromise.then((handles) => {
      if (disposed) {
        void Promise.all(handles.map((handle) => handle.remove()))
        return
      }
      activeHandles = handles
    })

    return () => {
      disposed = true
      const handles = activeHandles
      activeHandles = []
      void Promise.all(handles.map((handle) => handle.remove()))
    }
  }, [platform])
}
