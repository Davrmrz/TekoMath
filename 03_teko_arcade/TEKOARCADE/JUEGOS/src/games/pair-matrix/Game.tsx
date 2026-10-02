import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { GameTemplateFrame } from '../core/GameTemplateFrame'
import { finishAndRecordGame } from '../core/finishAndRecordGame'
import { calculateScore, registerAttempt, resumeGame, startGame, useHint as applyGameHint } from '../core/gameEngine'
import { pairMatrixConfig } from './game.config'
import type { PairMatrixLocalState, PairMatrixProps } from './game.types'
import { calculateComboBonus, getReciprocalPairId, pairMatrixCards, togglePairSelection } from './pairLogic'
import { useLanguage } from '../../i18n/LanguageProvider'

function localId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function timestamp(): string {
  return new Date().toISOString()
}

export function PairMatrixGame(props: PairMatrixProps) {
  const { t } = useLanguage()
  const [session, setSession] = useState(() => ({
    ...props.session,
    exercise: { ...props.session.exercise, prompt: t('game.pair.prompt') },
  }))
  const [local, setLocal] = useState<PairMatrixLocalState>({
    selectedCards: [],
    solvedCards: [],
    solvedPairs: [],
    combo: 0,
    bestCombo: 0,
    elapsedSeconds: 0,
  })
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (session.status !== 'playing' || isPaused) return
    const timer = window.setInterval(() => {
      setLocal((current) => ({
        ...current,
        elapsedSeconds: Math.floor((Date.now() - Date.parse(session.startedAt)) / 1000),
      }))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [session.startedAt, session.status, isPaused])

  const toggleCard = (id: string) => {
    if (session.status !== 'playing' || isPaused || session.currentFeedback) return
    setLocal((value) => ({
      ...value,
      selectedCards: togglePairSelection(value.selectedCards, id, value.solvedCards),
    }))
  }

  const state = {
    phase: session.status,
    round: Math.min(local.solvedPairs.length + 1, pairMatrixConfig.rounds),
    rounds: pairMatrixConfig.rounds,
    attempts: session.attempts.length,
    score: session.currentScore.points,
    bestCombo: local.bestCombo,
    isFinalRound: local.solvedPairs.length === pairMatrixConfig.rounds,
    isPaused,
    feedback: session.currentFeedback,
    result: session.result,
    start: () => {
      const started = startGame({ ...session, startedAt: timestamp() })
      setSession(started)
      setIsPaused(false)
    },
    togglePause: () => setIsPaused((paused) => !paused),
    checkAnswer: (_answer: string | number, ready: boolean) => {
      if (!ready || session.status !== 'playing' || isPaused || session.currentFeedback) return
      const [first, second] = local.selectedCards
      const pairId = getReciprocalPairId(first, second)
      const nextCombo = pairId ? local.combo + 1 : 0
      const attempt = registerAttempt(
        session,
        { value: `${first}:${second}`, submittedAt: timestamp() },
        {
          isCorrect: Boolean(pairId),
          message: pairId
            ? `¡Pareja correcta! ${first} y ${second} son recíprocas.`
            : 'No forman una pareja recíproca. Las tarjetas volverán al tablero.',
        },
        localId('attempt'),
        pairId ? calculateComboBonus(nextCombo) : 0,
      )

      if (pairId) {
        setLocal((current) => ({
          ...current,
          solvedCards: [...current.solvedCards, first, second],
          solvedPairs: [...current.solvedPairs, pairId],
          combo: nextCombo,
          bestCombo: Math.max(current.bestCombo, nextCombo),
        }))
      } else {
        setLocal((current) => ({ ...current, combo: 0 }))
      }
      setSession(attempt)
    },
    showHint: () => {
      if (session.status === 'playing' && !isPaused) setSession(applyGameHint(session))
    },
    continueRound: () => {
      if (session.status !== 'feedback' || isPaused) return
      if (session.currentFeedback?.kind === 'correct' && local.solvedPairs.length === pairMatrixConfig.rounds) {
        setSession(finishAndRecordGame(session, 'completed', {
          correctPairs: session.currentScore.correctAnswers,
          incorrectAttempts: session.attempts.filter((attempt) => attempt.isCorrect === false).length,
          totalAttempts: session.attempts.length,
          bestCombo: local.bestCombo,
        }))
        return
      }
      const resumed = resumeGame(session)
      const attempts = resumed.attempts
      setSession({ ...resumed, currentScore: calculateScore(attempts) })
      setLocal((current) => ({ ...current, selectedCards: [] }))
    },
    abandon: () => {
      if (session.status === 'completed' || session.status === 'abandoned') return
      setSession(finishAndRecordGame(session, 'user-exit', {
        correctPairs: session.currentScore.correctAnswers,
        incorrectAttempts: session.attempts.filter((attempt) => attempt.isCorrect === false).length,
        totalAttempts: session.attempts.length,
        bestCombo: local.bestCombo,
      }))
    },
  }

  return (
    <GameTemplateFrame {...props} session={session} config={pairMatrixConfig} state={state} interactionReady={local.selectedCards.length === 2} playerAnswer={local.selectedCards.join(':')}>
      <div className="pair-matrix__stats" aria-label={t('game.pair.statsAria')}>
        <span>{t('game.pairs')} <strong>{local.solvedPairs.length}/3</strong></span>
        <span>{t('game.combo')} <strong>x{local.combo}</strong></span>
        <span>{t('game.time')} <strong>{Math.floor(local.elapsedSeconds / 60)}:{String(local.elapsedSeconds % 60).padStart(2, '0')}</strong></span>
      </div>
      <div className="pair-matrix__board" aria-label={t('game.pair.boardAria')}>
        {pairMatrixCards.map((card) => {
          const cardKind = card.kind === 'Razón' ? t('game.pair.kind.ratio') : t('game.pair.kind.reciprocal')
          return (
          <button
            key={card.id}
            type="button"
            aria-pressed={local.selectedCards.includes(card.id)}
            aria-label={`${cardKind}: ${card.label}${local.solvedCards.includes(card.id) ? t('game.solvedCardSuffix') : ''}`}
            disabled={session.status !== 'playing' || isPaused || local.solvedCards.includes(card.id) || Boolean(session.currentFeedback)}
            className={`pair-matrix__card${local.selectedCards.includes(card.id) ? ' is-selected' : ''}${local.solvedCards.includes(card.id) ? ' is-solved' : ''}`}
            onClick={() => toggleCard(card.id)}
          >
            <span>{cardKind}</span><strong>{card.label}</strong>
            {local.solvedCards.includes(card.id) ? <Check size={17} aria-hidden="true" /> : null}
          </button>
          )
        })}
      </div>
      <p className="game-stage-note">{t('game.pair.selectedCount', { selected: local.selectedCards.length, attempts: session.attempts.length })}</p>
    </GameTemplateFrame>
  )
}