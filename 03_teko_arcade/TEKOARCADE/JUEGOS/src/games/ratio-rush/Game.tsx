import { useEffect, useRef, useState } from 'react'
import { Timer, Zap } from 'lucide-react'
import { GameTemplateFrame } from '../core/GameTemplateFrame'
import { getExercisesForTopic } from '../../exercises/data'
import { finishAndRecordGame } from '../core/finishAndRecordGame'
import { registerAttempt, resumeGame, startGame } from '../core/gameEngine'
import { ratioRushConfig } from './game.config'
import type { RatioRushLocalState, RatioRushProps } from './game.types'
import type { GameSession } from '../core/engine.types'
import { calculateRatioRushComboBonus, calculateRatioRushResultMetrics, createRatioRushRound, evaluateRatioRushAnswer, getRemainingTimeMs, isRatioRushTimeExpired } from './ratioRushEngine'
import { useLanguage } from '../../i18n/LanguageProvider'

function localId(): string {
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function timestamp(): string {
  return new Date().toISOString()
}

export function RatioRushGame(props: RatioRushProps) {
  const { t } = useLanguage()
  const exercises = getExercisesForTopic(props.session.topicId)
  const buildRound = (roundNumber: number) => createRatioRushRound(exercises, {
    topicId: props.session.topicId,
    difficulty: props.session.exercise.difficulty,
    sessionId: props.session.sessionId,
    roundNumber,
    selectedExerciseId: props.session.exercise.id,
  }) ?? {
    exercise: props.session.exercise,
    choices: props.session.exercise.expectedAnswer ? [props.session.exercise.expectedAnswer] : [],
  }
  const [roundNumber, setRoundNumber] = useState(1)
  const [round, setRound] = useState(() => buildRound(1))
  const [session, setSession] = useState<GameSession>(() => ({
    ...props.session,
    exerciseId: round.exercise.id,
    exercise: round.exercise,
  }))
  const [local, setLocal] = useState<RatioRushLocalState>({
    selectedOption: null,
    combo: 0,
    bestCombo: 0,
    timeRemainingMs: ratioRushConfig.durationSeconds * 1000,
  })
  const finalized = useRef(false)

  useEffect(() => {
    if (session.status !== 'playing' && session.status !== 'feedback') return
    const startedAt = Date.parse(session.startedAt)
    const timer = window.setInterval(() => {
      const remainingMs = getRemainingTimeMs(ratioRushConfig.durationSeconds * 1000, startedAt, Date.now())
      setLocal((current) => ({ ...current, timeRemainingMs: remainingMs }))
      if (!isRatioRushTimeExpired(remainingMs) || finalized.current) return

      if (session.status !== 'playing' && session.status !== 'feedback') return
      finalized.current = true
      setSession(finishAndRecordGame(
        session,
        'time-expired',
        calculateRatioRushResultMetrics(session.attempts, local.bestCombo),
      ))
    }, 250)

    return () => window.clearInterval(timer)
  }, [session, local.bestCombo])

  const state = {
    phase: session.status,
    round: roundNumber,
    rounds: ratioRushConfig.rounds,
    attempts: session.attempts.length,
    score: session.currentScore.points,
    bestCombo: local.bestCombo,
    isPaused: false,
    feedback: session.currentFeedback,
    result: session.result,
    start: () => {
      finalized.current = false
      setLocal({ selectedOption: null, combo: 0, bestCombo: 0, timeRemainingMs: ratioRushConfig.durationSeconds * 1000 })
      setSession(startGame({
        ...session,
        exerciseId: round.exercise.id,
        exercise: round.exercise,
        startedAt: timestamp(),
      }))
    },
    togglePause: () => undefined,
    checkAnswer: (answer: string | number, ready: boolean) => {
      if (!ready || session.status !== 'playing' || !local.selectedOption) return
      const correct = evaluateRatioRushAnswer(session.exercise.expectedAnswer, String(answer))
      const nextCombo = correct ? local.combo + 1 : 0
      const attempt = registerAttempt(
        session,
        { value: String(answer), submittedAt: timestamp() },
        {
          isCorrect: correct,
          message: correct ? '¡Correcto! Sumaste puntos.' : 'Incorrecto. Seguís en carrera.',
        },
        localId(),
        correct ? calculateRatioRushComboBonus(nextCombo) : 0,
      )
      setSession(attempt)
      setLocal((current) => ({
        ...current,
        combo: nextCombo,
        bestCombo: Math.max(current.bestCombo, nextCombo),
      }))
    },
    showHint: () => undefined,
    continueRound: () => {
      if (session.status !== 'feedback') return
      if (isRatioRushTimeExpired(local.timeRemainingMs)) {
        if (!finalized.current) {
          finalized.current = true
          setSession(finishAndRecordGame(
            session,
            'time-expired',
            calculateRatioRushResultMetrics(session.attempts, local.bestCombo),
          ))
        }
        return
      }

      const nextRoundNumber = roundNumber + 1
      const nextRound = buildRound(nextRoundNumber)
      setRoundNumber(nextRoundNumber)
      setRound(nextRound)
      setLocal((current) => ({ ...current, selectedOption: null }))
      setSession({
        ...resumeGame(session),
        exerciseId: nextRound.exercise.id,
        exercise: nextRound.exercise,
      })
    },
    abandon: () => {
      if (session.status === 'completed' || session.status === 'abandoned') return
      finalized.current = true
      setSession(finishAndRecordGame(
        session,
        'user-exit',
        calculateRatioRushResultMetrics(session.attempts, local.bestCombo),
      ))
    },
  }

  return (
    <GameTemplateFrame {...props} session={session} config={ratioRushConfig} state={state} interactionReady={Boolean(local.selectedOption)} playerAnswer={local.selectedOption ?? ''}>
      <div className="ratio-rush__hud">
        <div><Timer size={17} /><strong>{formatTime(local.timeRemainingMs)}</strong></div>
        <div><Zap size={17} /><strong>{t('game.ratio.combo', { combo: local.combo })}</strong></div>
        <div><span>{t('common.score')}</span><strong>{state.score}</strong></div>
      </div>
      <div className="ratio-rush__options">
        {round.choices.map((option, index) => (
          <button key={`${round.exercise.id}-${option}`} type="button" disabled={session.status !== 'playing'} aria-pressed={local.selectedOption === option} className={`ratio-rush__option${local.selectedOption === option ? ' is-selected' : ''}`} onClick={() => setLocal((current) => ({ ...current, selectedOption: option }))}>
            <span>{String.fromCharCode(65 + index)}</span>{option}
          </button>
        ))}
      </div>
    </GameTemplateFrame>
  )
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000)
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`
}