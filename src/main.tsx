import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

import { AppRoutes } from './App'
import './index.css'
import { DecisionProvider } from './state/DecisionProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <DecisionProvider>
        <AppRoutes />
      </DecisionProvider>
    </HashRouter>
  </StrictMode>,
)
