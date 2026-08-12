import { BarChart3, Clock3, FlaskConical, Home, Info, Menu, X } from 'lucide-react'
import { useState } from 'react'
import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: '首页', icon: Home },
  { to: '/history', label: '决策记录', icon: Clock3 },
  { to: '/statistics', label: '统计分析', icon: BarChart3 },
  { to: '/about', label: '关于', icon: Info },
] as const

export function AppShell({ children }: PropsWithChildren): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const brandMarkUrl = `${import.meta.env.BASE_URL}brand/decision-lab-mark.svg`

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink className="brand" to="/" onClick={() => setMenuOpen(false)}>
            <img src={brandMarkUrl} alt="" width="32" height="32" />
            <span>
              <strong>DECISION LAB</strong>
              <small>HUMAN CHOICE SYSTEM</small>
            </span>
          </NavLink>

          <nav className="desktop-nav" aria-label="主导航">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="header-status" aria-label="系统状态">
            <span />
            LOCAL MODE
          </div>

          <button
            className="mobile-menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? '关闭导航' : '打开导航'}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-navigation" className="mobile-nav" aria-label="移动端导航">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <div className="page-container">{children}</div>

      <footer className="site-footer">
        <div>
          <FlaskConical size={16} aria-hidden="true" />
          DECISION LAB · V1.5
        </div>
        <p>该科学的时候真的计算，该玄学的时候认真胡说。</p>
      </footer>
    </div>
  )
}
