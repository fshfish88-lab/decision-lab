import { ArrowLeft } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import {
  mobileFlowRoutes,
  mobileFlowTitles,
  mobilePrimaryNavigation,
} from '../navigation/navigationItems'
import { useMobileNavigation } from './navigation/MobileNavigationContext'
import { MobileNavigationProvider } from './navigation/MobileNavigationProvider'

export function MobileAppShell({ children }: PropsWithChildren): React.JSX.Element {
  return (
    <MobileNavigationProvider>
      <MobileAppFrame>{children}</MobileAppFrame>
    </MobileNavigationProvider>
  )
}

function MobileAppFrame({ children }: PropsWithChildren): React.JSX.Element {
  const { pathname } = useLocation()
  const { navigateBack, navigateForward } = useMobileNavigation()
  const isFlowRoute = mobileFlowRoutes.has(pathname)

  return (
    <div className="mobile-app">
      {isFlowRoute ? (
        <header className="mobile-app__flow-header">
          <button type="button" aria-label="返回" onClick={navigateBack}>
            <ArrowLeft size={21} aria-hidden="true" />
          </button>
          <strong>{mobileFlowTitles[pathname]}</strong>
          <span aria-hidden="true" />
        </header>
      ) : null}

      <main className="mobile-app__content">{children}</main>

      {!isFlowRoute ? (
        <nav className="mobile-app__navigation" aria-label="App 主导航">
          {mobilePrimaryNavigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              aria-label={label}
              onClick={(event) => {
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                event.preventDefault()
                navigateForward(to)
              }}
            >
              <Icon size={21} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      ) : null}
    </div>
  )
}
