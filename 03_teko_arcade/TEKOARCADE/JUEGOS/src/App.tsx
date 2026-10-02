import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { LanguageProvider } from './i18n/LanguageProvider'
import { useLanguage } from './i18n/LanguageProvider'
import { AudioProvider } from './audio/AudioProvider'

const GamePage = lazy(() => import('./pages/GamePage').then(({ GamePage }) => ({ default: GamePage })))
const GameSetupPage = lazy(() =>
  import('./pages/GameSetupPage').then(({ GameSetupPage }) => ({ default: GameSetupPage })),
)
const LearningMapPage = lazy(() =>
  import('./pages/LearningMapPage').then(({ LearningMapPage }) => ({ default: LearningMapPage })),
)
const MissionsPage = lazy(() =>
  import('./pages/MissionsPage').then(({ MissionsPage }) => ({ default: MissionsPage })),
)
const MyTaskPage = lazy(() => import('./pages/MyTaskPage').then(({ MyTaskPage }) => ({ default: MyTaskPage })))
const ProgressPage = lazy(() =>
  import('./pages/ProgressPage').then(({ ProgressPage }) => ({ default: ProgressPage })),
)
const TopicPage = lazy(() => import('./pages/TopicPage').then(({ TopicPage }) => ({ default: TopicPage })))

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function RouteLoading() {
  const { t } = useLanguage()
  return <div className="route-loading" role="status">{t('common.loading')}</div>
}

function App() {
  return (
    <AudioProvider>
      <HashRouter>
        <LanguageProvider>
          <ScrollToTop />
          <AppShell>
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/mapa" element={<LearningMapPage />} />
                <Route path="/misiones" element={<MissionsPage />} />
                <Route path="/mi-tarea" element={<MyTaskPage />} />
                <Route path="/progreso" element={<ProgressPage />} />
                <Route path="/tema/:topic" element={<TopicPage />} />
                <Route path="/preparar/:topic/:gameId" element={<GameSetupPage />} />
                <Route path="/juego/:gameId" element={<GamePage />} />
                <Route path="*" element={<Navigate to="/mapa" replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </LanguageProvider>
      </HashRouter>
    </AudioProvider>
  )
}

export default App
