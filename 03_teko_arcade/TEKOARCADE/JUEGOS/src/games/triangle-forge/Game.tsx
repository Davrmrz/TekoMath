import { useState } from 'react'
import { GameTemplateFrame } from '../core/GameTemplateFrame'
import { registerAttempt, resumeGame, startGame, useHint as applyGameHint } from '../core/gameEngine'
import { finishAndRecordGame } from '../core/finishAndRecordGame'
import { getExercisesForTopic } from '../../exercises/data'
import { triangleForgeConfig } from './game.config'
import { createTriangleForgeExerciseSet, evaluateTriangleForgeAnswer, getAnswerInputMode, getKnownAngleValue, getKnownSideValue, getTriangleHighlights } from './gameLogic'
import type { TriangleForgeLocalState, TriangleForgeProps } from './game.types'
import { useLanguage } from '../../i18n/LanguageProvider'

function localId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function timestamp(): string {
  return new Date().toISOString()
}

export function TriangleForgeGame(props: TriangleForgeProps) {
  const { t } = useLanguage()
  const [exercises] = useState(() => createTriangleForgeExerciseSet(
    props.session.exercise,
    getExercisesForTopic(props.session.topicId),
    triangleForgeConfig.rounds,
  ))
  const [session, setSession] = useState(() => ({
    ...props.session,
    exerciseId: exercises[0].id,
    exercise: exercises[0],
  }))
  const [round, setRound] = useState(1)
  const [roundHintsUsed, setRoundHintsUsed] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [local, setLocal] = useState<TriangleForgeLocalState>({ answer: '' })
  const exercise = session.exercise
  const knownValues = Object.entries(exercise.knownValues).slice(0, 3)
  const highlights = getTriangleHighlights(exercise)
  const mathLabels: Record<string, string> = {
    catetoOpuesto: `${t('math.cathetus')} ${t('math.opposite')}`,
    catetoAdyacente: `${t('math.cathetus')} ${t('math.adjacent')}`,
    hipotenusa: t('math.hypotenuse'),
    angulo: t('math.angle'),
    razon: t('game.triangle.unknownRatio'),
    expresion: t('game.triangle.unknownExpression'),
    funcion: t('game.triangle.unknownFunction'),
    sen: 'sen',
    cos: 'cos',
    tan: 'tan',
    senAlpha: 'sen(α)',
    cosBeta: 'cos(β)',
    tanAlpha: 'tan(α)',
    cscAlpha: 'csc(α)',
    secAlpha: 'sec(α)',
    cotAlpha: 'cot(α)',
  }
  const answerLabel = mathLabels[exercise.unknown] ?? (exercise.unknown || t('game.triangle.answerLabel'))
  const state = {
    phase: session.status,
    round,
    rounds: triangleForgeConfig.rounds,
    attempts: session.attempts.length,
    score: session.currentScore.points,
    isPaused,
    feedback: session.currentFeedback,
    result: session.result,
    start: () => {
      setIsPaused(false)
      setSession((current) => startGame(current))
    },
    togglePause: () => setIsPaused((paused) => !paused),
    checkAnswer: (answer: string | number, ready: boolean) => {
      if (!ready || session.status !== 'playing' || isPaused) return
      setSession((current) => registerAttempt(
        current,
        { value: answer, submittedAt: timestamp() },
        evaluateTriangleForgeAnswer(current.exercise, String(answer)),
        localId('attempt'),
      ))
    },
    showHint: () => {
      if (session.status !== 'playing' || isPaused) return
      if (!session.exercise.hints[roundHintsUsed]) {
        setSession((current) => ({
          ...current,
          status: 'feedback',
          currentFeedback: { kind: 'hint', message: 'No hay más pistas para este ejercicio.' },
        }))
        return
      }
      setRoundHintsUsed((count) => count + 1)
      setSession((current) => {
        const hinted = applyGameHint({ ...current, hintsUsed: roundHintsUsed })
        return { ...hinted, hintsUsed: current.hintsUsed + 1 }
      })
    },
    continueRound: () => {
      if (session.status !== 'feedback' || isPaused) return
      if (session.currentFeedback?.kind !== 'correct') {
        setSession((current) => resumeGame(current))
        return
      }
      if (round >= triangleForgeConfig.rounds) {
        setSession(finishAndRecordGame(session, 'completed'))
        return
      }

      const nextRound = round + 1
      setRound(nextRound)
      setRoundHintsUsed(0)
      setLocal({ answer: '' })
      setSession((current) => {
        const resumed = resumeGame(current)
        const nextExercise = exercises[nextRound - 1]
        return {
          ...resumed,
          exerciseId: nextExercise.id,
          exercise: nextExercise,
        }
      })
    },
    abandon: () => {
      if (session.status === 'completed' || session.status === 'abandoned') return
      setSession(finishAndRecordGame(session, 'user-exit'))
    },
  }

  return (
    <GameTemplateFrame {...props} session={session} config={triangleForgeConfig} state={state} interactionReady={local.answer.trim().length > 0} playerAnswer={local.answer}>
      <div className={`triangle-forge__layout${state.feedback?.kind === 'correct' ? ' is-correct' : ''}`}>
        <div className="triangle-forge__diagram" aria-label={t('game.triangle.diagramLabel')}>
          <svg viewBox="0 0 320 230" role="img" aria-label={t('game.triangle.practiceDiagram')}>
            <path d="M52 188 L52 42 L260 188 Z" className="triangle-forge__shape" />
            <path d="M52 188 L52 42" className={`triangle-forge__side${highlights.opposite ? ' is-target' : ''}${getKnownSideValue(exercise, 'opposite') ? ' is-known' : ''}`} />
            <path d="M52 188 L260 188" className={`triangle-forge__side${highlights.adjacent ? ' is-target' : ''}${getKnownSideValue(exercise, 'adjacent') ? ' is-known' : ''}`} />
            <path d="M52 42 L260 188" className={`triangle-forge__side${highlights.hypotenuse ? ' is-target' : ''}${getKnownSideValue(exercise, 'hypotenuse') ? ' is-known' : ''}`} />
            <path d="M52 169 L71 169 L71 188" className="triangle-forge__right-angle" />
            <path d="M220 188 A40 40 0 0 0 228 160" className={`triangle-forge__angle-arc${highlights.angle ? ' is-target' : ''}${getKnownAngleValue(exercise) ? ' is-known' : ''}`} />
            <text x="233" y="151" className={highlights.angle ? 'is-target' : ''}>{getKnownAngleValue(exercise) ? `${getKnownAngleValue(exercise)}°` : 'θ'}</text>
            <text x="18" y="116">{getKnownSideValue(exercise, 'opposite') ?? 'opuesto'}</text>
            <text x="122" y="214">{getKnownSideValue(exercise, 'adjacent') ?? 'adyacente'}</text>
            <text x="171" y="98">{getKnownSideValue(exercise, 'hypotenuse') ?? 'hipotenusa'}</text>
          </svg>
        </div>
        <div className="triangle-forge__answer">
          <span className="game-field-label">{answerLabel}</span>
          <input inputMode={getAnswerInputMode(exercise)} value={local.answer} disabled={state.phase !== 'playing' || isPaused} onChange={(event) => setLocal((value) => ({ ...value, answer: event.target.value }))} placeholder={t('game.triangle.answerPlaceholder')} aria-label={t('game.triangle.answerAria')} />
          <span className="triangle-forge__known">{knownValues.map(([key, value]) => <span key={key}>{mathLabels[key] ?? key}: <strong>{value}</strong></span>)}</span>
        </div>
      </div>
    </GameTemplateFrame>
  )
}