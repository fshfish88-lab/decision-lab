import { mobilePrimaryNavigation } from '../../navigation/navigationItems'
import type { MobileNavigationDirection } from './mobileNavigationState'

export const EASE_OUT_CUBIC = 'cubic-bezier(0.215, 0.61, 0.355, 1)'

export interface MobileRouteMotion {
  kind: 'primary' | 'flow'
  enterX: number
  enterOpacity: number
  duration: number
  ease: typeof EASE_OUT_CUBIC
}

const primaryPaths: readonly string[] = mobilePrimaryNavigation.map(({ to }) => to)

export function getPrimaryRouteIndex(pathname: string): number | null {
  const index = primaryPaths.indexOf(pathname)
  return index < 0 ? null : index
}

export function getPrimaryRouteDirection(fromPathname: string, toPathname: string): -1 | 0 | 1 | null {
  const fromIndex = getPrimaryRouteIndex(fromPathname)
  const toIndex = getPrimaryRouteIndex(toPathname)
  if (fromIndex === null || toIndex === null) return null
  if (fromIndex === toIndex) return 0
  return toIndex > fromIndex ? 1 : -1
}

export function getMobileRouteMotion(
  fromPathname: string,
  toPathname: string,
  navigationDirection: MobileNavigationDirection,
  reducedMotion: boolean,
): MobileRouteMotion {
  const primaryDirection = getPrimaryRouteDirection(fromPathname, toPathname)

  if (reducedMotion) {
    return {
      kind: primaryDirection === null ? 'flow' : 'primary',
      enterX: 0,
      enterOpacity: 1,
      duration: 0,
      ease: EASE_OUT_CUBIC,
    }
  }

  if (primaryDirection === 1) {
    return {
      kind: 'primary',
      enterX: 24,
      enterOpacity: 0.88,
      duration: 0.22,
      ease: EASE_OUT_CUBIC,
    }
  }

  if (primaryDirection === -1) {
    return {
      kind: 'primary',
      enterX: -24,
      enterOpacity: 0.88,
      duration: 0.22,
      ease: EASE_OUT_CUBIC,
    }
  }

  const flowDirection = navigationDirection === 'back' ? -1 : 1
  return {
    kind: 'flow',
    enterX: flowDirection * 10,
    enterOpacity: 0.88,
    duration: 0.18,
    ease: EASE_OUT_CUBIC,
  }
}
