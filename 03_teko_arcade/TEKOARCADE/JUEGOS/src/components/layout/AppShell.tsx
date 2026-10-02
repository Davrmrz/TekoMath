import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Home, Map, Trophy, TrendingUp, UserRound, Volume2, VolumeX, Zap } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { progressService } from '../../services/progressService'
import { TekoAssistantBubble } from '../mascot/TekoAssistantBubble'
import { LanguageSelector } from '../../i18n/LanguageSelector'
import { useLanguage } from '../../i18n/LanguageProvider'
import { useSound } from '../../audio/useSound'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useLanguage()
  const { enabled: soundsEnabled, setEnabled: setSoundsEnabled, playSound } = useSound()
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false)
  const soundMenuRef = useRef<HTMLDivElement>(null)
  const progress = progressService.getUserProgress()
  const { xp, streak } = progress

  const menuItems = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/mapa', label: t('nav.map'), icon: Map },
    { to: '/misiones', label: t('nav.missions'), icon: Trophy },
    { to: '/progreso', label: t('nav.progress'), icon: TrendingUp },
  ]

  useEffect(() => {
    if (!isSoundMenuOpen) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!soundMenuRef.current?.contains(event.target as Node)) setIsSoundMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSoundMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isSoundMenuOpen])

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label={t('shell.sidebarLabel')}>
        <div className="sidebar__brand" aria-label="TEKO ARCADE">
          <div className="brand__mark">
            <img src="./mascot/Tejucito/Icon.png" alt="" />
          </div>
          <div className="brand__text">
            <span>TEKO</span>
            <small>ARCADE</small>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label={t('shell.sectionsLabel')}>
          {menuItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar__item ${isActive ? 'is-active' : ''}`}
            >
              <span className="nav-icon">
                <Icon size={18} />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__profile">
            <div className="profile-badge">
              <img src="./mascot/Tejucito/Icon.png" alt="" />
            </div>
            <div>
              <strong>Tejucito</strong>
              <span>{t('profile.tagline')}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-shell__content">
        <header className="topbar">
          <div className="topbar__inner">
            <div className="topbar__title-wrap">
              <span className="topbar__eyebrow" aria-label="TEKO ARCADE">
                <span className="topbar__brand-word topbar__brand-word--dark">TEKO</span>
                <span className="topbar__brand-word topbar__brand-word--purple">ARCADE</span>
              </span>
              <h1 className="topbar__title">{t('shell.title')}</h1>
            </div>

            <div className="topbar__meta">
              <div className="topbar__meta-group">
                <div className="status-pill">
                  <span className="status-pill__dot" />
                  {t('shell.local')}
                </div>
                <div className="xp-pill">
                  <Zap size={14} />
                  {xp} XP
                </div>
              </div>
              <LanguageSelector />
              <div className="profile-audio-menu" ref={soundMenuRef}>
                <button
                  type="button"
                  className="profile-mini"
                  aria-label={t('shell.profileLabel')}
                  aria-haspopup="true"
                  aria-expanded={isSoundMenuOpen}
                  onClick={() => {
                    playSound(isSoundMenuOpen ? 'ui.close' : 'ui.open')
                    setIsSoundMenuOpen((open) => !open)
                  }}
                >
                  <UserRound size={16} />
                </button>
                {isSoundMenuOpen ? (
                  <div className="profile-audio-popover" role="group" aria-label="Sonidos">
                    <button
                      type="button"
                      className="profile-audio-toggle"
                      role="switch"
                      aria-checked={soundsEnabled}
                      aria-label={soundsEnabled ? 'Desactivar efectos de sonido' : 'Activar efectos de sonido'}
                      onClick={() => setSoundsEnabled(!soundsEnabled)}
                    >
                      {soundsEnabled ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
                      <span>Sonidos</span>
                      <strong>{soundsEnabled ? 'ON' : 'OFF'}</strong>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="app-main">{children}</main>
      </div>

      <TekoAssistantBubble />

      <aside className="right-panel" aria-label={t('shell.progressPanelLabel')}>
        <div className="right-panel__card right-panel__card--primary">
          <span className="panel-label">XP</span>
          <strong>{xp}</strong>
        </div>

        <div className="right-panel__card">
          <span className="panel-label">{t('progress.streak')}</span>
          <strong>{t('shell.streakDays', { days: streak })}</strong>
        </div>

        <div className="right-panel__card right-panel__card--quest">
          <span className="panel-label">{t('shell.dailyQuest')}</span>
          <h3>{t('shell.dailyQuestDescription')}</h3>
          <div className="quest-progress">
            <span className="quest-progress__bar" style={{ width: '30%' }} />
          </div>
          <div className="quest-footer">
            <strong>1 / 3</strong>
            <span>{t('common.xpReward', { xp: 30 })}</span>
          </div>
        </div>

      </aside>

      <nav className="bottom-nav" aria-label={t('shell.mobileNavigationLabel')}>
        {menuItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `bottom-nav__item ${isActive ? 'is-active' : ''}`}
          >
            <span className="nav-icon nav-icon--compact">
              <Icon size={17} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
