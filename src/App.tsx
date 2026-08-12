import { Route, Routes } from 'react-router-dom'

import { AppShell } from './components/AppShell'
import { ScrollToTop } from './components/ScrollToTop'
import { AboutPage } from './pages/AboutPage'
import { AiPage } from './pages/AiPage'
import { AnalysisPage } from './pages/AnalysisPage'
import { HistoryPage } from './pages/HistoryPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ResultPage } from './pages/ResultPage'
import { SciencePage } from './pages/SciencePage'
import { StatisticsPage } from './pages/StatisticsPage'

export function AppRoutes(): React.JSX.Element {
  return (
    <AppShell>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/science" element={<SciencePage />} />
        <Route path="/ai" element={<AiPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}
