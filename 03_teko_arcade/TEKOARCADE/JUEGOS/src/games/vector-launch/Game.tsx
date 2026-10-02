import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { GameTemplateFrame } from '../core/GameTemplateFrame'
import { getExercisesForTopic } from '../../exercises/data'
import { finishAndRecordGame } from '../core/finishAndRecordGame'
import { registerAttempt, resumeGame, startGame, useHint as applyGameHint } from '../core/gameEngine'
import { vectorLaunchConfig } from './game.config'
import type { VectorLaunchLocalState, VectorLaunchProps } from './game.types'
import type { GameSession } from '../core/engine.types'
import { calculateVectorComboBonus, calculateVectorResultMetrics, createVectorLaunchChallenges, evaluateVectorAnswer, getVectorComponentLabel } from './vectorLaunchEngine'
import { createVectorLaunchScene } from './vectorLaunchVisual'
import { useLanguage } from '../../i18n/LanguageProvider'
import type { TranslationKey } from '../../i18n/translations'

const componentTranslationKeys = {
  catetoOpuesto: 'game.vector.componentOpposite',
  catetoAdyacente: 'game.vector.componentAdjacent',
  hipotenusa: 'game.vector.componentHypotenuse',
} as const satisfies Record<Parameters<typeof getVectorComponentLabel>[0], TranslationKey>

function localId(): string {
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function timestamp(): string {
  return new Date().toISOString()
}

export function VectorLaunchGame(props: VectorLaunchProps) {
  const { t } = useLanguage()
  const [challenges] = useState(() => createVectorLaunchChallenges(
    getExercisesForTopic(props.session.topicId),
    props.session.topicId,
    props.session.exercise.difficulty,
    props.session.sessionId,
    vectorLaunchConfig.rounds,
    props.session.exercise.id,
  ))
  const firstChallenge = challenges[0]
  const [round, setRound] = useState(1)
  const [session, setSession] = useState<GameSession>(() => ({
    ...props.session,
    exerciseId: firstChallenge.exercise.id,
    exercise: firstChallenge.exercise,
  }))
  const [local, setLocal] = useState<VectorLaunchLocalState>({
    answer: '',
    travelRatio: null,
    launchCorrect: null,
    animationKey: 0,
    combo: 0,
    bestCombo: 0,
  })
  const [isPaused, setIsPaused] = useState(false)
  const challenge = challenges[round - 1]
  const scene = createVectorLaunchScene(challenge, local.travelRatio ?? 1)
  const knownComponentLabel = t(componentTranslationKeys[challenge.knownComponent])
  const targetComponentLabel = t(componentTranslationKeys[challenge.targetComponent])

  const state = {
    phase: session.status,
    round,
    rounds: challenges.length,
    attempts: session.attempts.length,
    score: session.currentScore.points,
    bestCombo: local.bestCombo,
    isFinalRound: round === challenges.length,
    isPaused,
    feedback: session.currentFeedback,
    result: session.result,
    start: () => {
      setSession(startGame({ ...session, startedAt: timestamp() }))
      setIsPaused(false)
    },
    togglePause: () => setIsPaused((paused) => !paused),
    checkAnswer: (answer: string | number, ready: boolean) => {
      if (!ready || session.status !== 'playing' || isPaused) return
      const evaluation = evaluateVectorAnswer(challenge, String(answer))
      const nextCombo = evaluation.correct ? local.combo + 1 : 0
      const attempt = registerAttempt(
        session,
        { value: String(answer), submittedAt: timestamp() },
        {
          isCorrect: evaluation.correct,
          message: evaluation.correct
            ? '¡El vector alcanzó el objetivo!'
            : 'El vector quedó corto o se pasó. Revisá el componente y probá de nuevo.',
        },
        localId(),
        evaluation.correct ? calculateVectorComboBonus(nextCombo) : 0,
      )
      setSession(attempt)
      setLocal((current) => ({
        ...current,
        travelRatio: evaluation.travelRatio,
        launchCorrect: evaluation.correct,
        animationKey: current.animationKey + 1,
        combo: nextCombo,
        bestCombo: Math.max(current.bestCombo, nextCombo),
      }))
    },
    showHint: () => {
      if (session.status === 'playing' && !isPaused) setSession(applyGameHint(session))
    },
    continueRound: () => {
      if (session.status !== 'feedback' || isPaused) return
      if (session.currentFeedback?.kind === 'hint') {
        setSession(resumeGame(session))
        return
      }
      if (round >= challenges.length) {
        setSession(finishAndRecordGame(
          session,
          'completed',
          calculateVectorResultMetrics(session.attempts, local.bestCombo),
        ))
        return
      }
      const nextRound = round + 1
      const nextChallenge = challenges[nextRound - 1]
      setRound(nextRound)
      setLocal((current) => ({
        ...current,
        answer: '',
        travelRatio: null,
        launchCorrect: null,
      }))
      setSession({
        ...resumeGame(session),
        exerciseId: nextChallenge.exercise.id,
        exercise: nextChallenge.exercise,
      })
    },
    abandon: () => {
      if (session.status === 'completed' || session.status === 'abandoned') return
      setSession(finishAndRecordGame(
        session,
        'user-exit',
        calculateVectorResultMetrics(session.attempts, local.bestCombo),
      ))
    },
  }

  return (
    <GameTemplateFrame {...props} session={session} config={vectorLaunchConfig} state={state} interactionReady={local.answer.trim().length > 0} playerAnswer={local.answer}>
      <div className="vector-launch__stage">
        <svg className="vector-launch__diagram" viewBox="0 0 360 260" role="img" aria-label={t('game.vector.diagramAria', { angle: challenge.angleDegrees.toFixed(1) })}>
          <path d="M26 232 H334" className="vector-launch__ground" />
          <path d={`M${scene.origin.x} ${scene.origin.y} L${scene.target.x} ${scene.target.y}`} className="vector-launch__guide" />
          <path d={`M${scene.origin.x} ${scene.origin.y} L${scene.horizontalProjection.x} ${scene.horizontalProjection.y} L${scene.target.x} ${scene.target.y}`} className="vector-launch__components" />
          {local.travelRatio !== null ? <path d={`M${scene.origin.x} ${scene.origin.y} L${scene.landing.x} ${scene.landing.y}`} className={`vector-launch__flight${local.launchCorrect ? ' is-correct' : ' is-incorrect'}`} /> : null}
          <circle cx={scene.origin.x} cy={scene.origin.y} r="8" className="vector-launch__origin" />
          <circle cx={scene.target.x} cy={scene.target.y} r="12" className="vector-launch__target" />
          {local.travelRatio !== null ? (
            <circle
              key={local.animationKey}
              cx={scene.origin.x}
              cy={scene.origin.y}
              r="7"
              className={`vector-launch__projectile${local.launchCorrect ? ' is-correct' : ' is-incorrect'}`}
              style={{ '--flight-x': `${scene.landing.x - scene.origin.x}px`, '--flight-y': `${scene.landing.y - scene.origin.y}px` } as CSSProperties}
            />
          ) : null}
          <text x="26" y="251" className="vector-launch__label">{t('game.vector.origin')}</text>
          <text x={scene.target.x} y={scene.target.y - 20} textAnchor="middle" className="vector-launch__label">{t('game.vector.target')}</text>
          <text x={scene.origin.x + 32} y={scene.origin.y - 15} className="vector-launch__angle-label">{challenge.angleDegrees.toFixed(1)}°</text>
          <text x={(scene.origin.x + scene.horizontalProjection.x) / 2} y={scene.origin.y + 18} textAnchor="middle" className="vector-launch__component-label">{challenge.targetComponent === 'catetoAdyacente' ? '?' : `${challenge.horizontalComponent.toFixed(1)}`}</text>
          <text x={scene.target.x + 8} y={(scene.origin.y + scene.target.y) / 2} className="vector-launch__component-label">{challenge.targetComponent === 'catetoOpuesto' ? '?' : `${challenge.verticalComponent.toFixed(1)}`}</text>
        </svg>
        <div className="vector-launch__facts">
          <span>{t('game.vector.angle')} <strong>{challenge.angleDegrees.toFixed(1)}°</strong></span>
          <span>{knownComponentLabel} <strong>{challenge.knownValue}</strong></span>
          <span>{t('game.vector.target')} <strong>{targetComponentLabel}</strong></span>
        </div>
        <label className="vector-launch__answer">
          <span>{t('game.vector.requiredComponent')}</span>
          <input
            inputMode="decimal"
            value={local.answer}
            disabled={session.status !== 'playing' || isPaused}
            onChange={(event) => setLocal((current) => ({ ...current, answer: event.target.value }))}
            aria-label={t('game.vector.answerAria', { component: targetComponentLabel })}
            placeholder={t('game.vector.answerPlaceholder')}
          />
        </label>
        {local.launchCorrect === true ? <p className="vector-launch__feedback is-correct"><Check size={16} /> {t('game.vector.hit')}</p> : null}
        {local.launchCorrect === false ? <p className="vector-launch__feedback is-incorrect"><X size={16} /> {t('game.vector.missed')}</p> : null}
      </div>
    </GameTemplateFrame>
  )
}