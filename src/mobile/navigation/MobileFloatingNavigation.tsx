import { useReducedMotion } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'

import { mobilePrimaryNavigation } from '../../navigation/navigationItems'
import { useMobileNavigation } from './MobileNavigationContext'
import { EASE_OUT_CUBIC, getPrimaryRouteIndex } from './mobilePrimaryNavigationMotion'

export function MobileFloatingNavigation(): React.JSX.Element | null {
  const { pathname } = useLocation()
  const { navigateForward } = useMobileNavigation()
  const reducedMotion = Boolean(useReducedMotion())
  const activeIndex = getPrimaryRouteIndex(pathname)

  if (activeIndex === null) return null

  return (
    <nav className="mobile-app__navigation" aria-label="App 主导航">
      <span
        aria-hidden="true"
        className="mobile-app__navigation-indicator"
        data-active-index={activeIndex}
        data-testid="mobile-navigation-indicator"
        style={{
          transform: `translateX(${activeIndex * 100}%)`,
          transition: reducedMotion ? 'none' : `transform 220ms ${EASE_OUT_CUBIC}`,
        }}
      />
      {mobilePrimaryNavigation.map(({ to, label, icon: Icon }) => (
        <span
          key={to}
          className="mobile-app__navigation-target"
          data-testid={`mobile-navigation-target-${label}`}
        >
          <NavLink
            to={to}
            end={to === '/'}
            aria-label={label}
            onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
              event.preventDefault()
              if (to === pathname) return
              navigateForward(to)
            }}
          >
            <Icon size={21} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        </span>
      ))}
    </nav>
  )
}
