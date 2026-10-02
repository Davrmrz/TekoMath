import { useState } from 'react'
import { GameTemplateFrame } from '../core/GameTemplateFrame'
import { finishAndRecordGame } from '../core/finishAndRecordGame'
import { registerAttempt, resumeGame, startGame, useHint as applyGameHint } from '../core/gameEngine'
import { graphLabConfig } from './game.config'
import type { GraphLabLocalState, GraphLabProps } from './game.types'
import type { GameSession } from '../core/engine.types'
import { calculateGraphComboBonus, calculateGraphResultMetrics, createGraphChallenge, evaluateGraphAnswer, formatGraphAngle, generateGraphPath, getGraphBounds, graphFunctions, graphPoint } from './graphEngine'
import type { GraphFunctionName } from './graphEngine'
import { useLanguage } from '../../i18n/LanguageProvider'

function localId(): string {
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function timestamp(): string {
  return new Date().toISOString()
}

function asGameExercise(challenge: ReturnType<typeof createGraphChallenge>, session: GameSession['exercise']): GameSession['exercise'] {
  return {
    ...session,
    id: challenge.id,
    topicId: challenge.functionName,
    prompt: challenge.prompt,
    unknown: challenge.kind,
    expectedAnswer: challenge.expectedAnswer,
    hints: challenge.hints,
  }
}

export function GraphLabGame(props: GraphLabProps) {
  const { t } = useLanguage()
  const initialFunction: GraphFunctionName = graphFunctions.includes(props.session.topicId as GraphFunctionName)
    ? props.session.topicId as GraphFunctionName
    : 'sin'
  const [round, setRound] = useState(1)
  const [local, setLocal] = useState<GraphLabLocalState>({
    functionName: initialFunction,
    selectedAnswer: null,
    combo: 0,
    bestCombo: 0,
  })
  const [session, setSession] = useState<GameSession>(() => {
    const challenge = createGraphChallenge(initialFunction, 1)
    return {
      ...props.session,
      exerciseId: challenge.id,
      exercise: asGameExercise(challenge, props.session.exercise),
    }
  })
  const [isPaused, setIsPaused] = useState(false)
  const challenge = createGraphChallenge(local.functionName, round)
  const localizedPrompt = challenge.kind === 'value'
    ? t('game.graph.promptValue', { x: formatGraphAngle(challenge.queryX ?? 0) })
    : challenge.kind === 'maximum'
      ? t('game.graph.promptMaximum')
      : t('game.graph.promptZero')
  const displaySession = {
    ...session,
    exercise: { ...session.exercise, prompt: localizedPrompt },
  }
  const bounds = getGraphBounds(local.functionName)
  const curvePath = generateGraphPath(local.functionName)
  const xToSvg = (value: number) => bounds.left + ((value - bounds.xMin) / (bounds.xMax - bounds.xMin)) * (bounds.right - bounds.left)
  const yToSvg = (value: number) => bounds.bottom - ((value - bounds.yMin) / (bounds.yMax - bounds.yMin)) * (bounds.bottom - bounds.top)
  const xTicks = Array.from({ length: 9 }, (_, index) => -2 * Math.PI + index * Math.PI / 2)
  const yTicks = local.functionName === 'tan' ? [-2, -1, 0, 1, 2] : [-1, 0, 1]
  const queryPoint = challenge.queryX === null ? null : graphPoint(local.functionName, challenge.queryX)
  const pointChoices = challenge.pointOptions.map((x) => ({ x, point: graphPoint(local.functionName, x) }))

  const chooseFunction = (functionName: GraphLabLocalState['functionName']) => {
    if (session.status === 'feedback' || session.status === 'completed' || session.status === 'abandoned') return
    const nextChallenge = createGraphChallenge(functionName, round)
    setLocal((current) => ({ ...current, functionName, selectedAnswer: null }))
    setSession((current) => ({
      ...current,
      exerciseId: nextChallenge.id,
      exercise: asGameExercise(nextChallenge, current.exercise),
    }))
  }

  const state = {
    phase: session.status,
    round,
    rounds: graphLabConfig.rounds,
    attempts: session.attempts.length,
    score: session.currentScore.points,
    bestCombo: local.bestCombo,
    isFinalRound: round === graphLabConfig.rounds,
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
      const correct = evaluateGraphAnswer(challenge, String(answer))
      const nextCombo = correct ? local.combo + 1 : 0
      setSession(registerAttempt(
        session,
        { value: String(answer), submittedAt: timestamp() },
        {
          isCorrect: correct,
          message: correct ? '¡Bien! El punto coincide con la gráfica.' : 'Ese valor o punto no coincide con la curva.',
        },
        localId(),
        correct ? calculateGraphComboBonus(nextCombo) : 0,
      ))
      setLocal((current) => ({
        ...current,
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
      if (round >= graphLabConfig.rounds) {
        setSession(finishAndRecordGame(
          session,
          'completed',
          calculateGraphResultMetrics(session.attempts, local.bestCombo),
        ))
        return
      }
      const nextRound = round + 1
      const nextChallenge = createGraphChallenge(local.functionName, nextRound)
      setRound(nextRound)
      setLocal((current) => ({ ...current, selectedAnswer: null }))
      setSession({
        ...resumeGame(session),
        exerciseId: nextChallenge.id,
        exercise: asGameExercise(nextChallenge, session.exercise),
      })
    },
    abandon: () => {
      if (session.status === 'completed' || session.status === 'abandoned') return
      setSession(finishAndRecordGame(
        session,
        'user-exit',
        calculateGraphResultMetrics(session.attempts, local.bestCombo),
      ))
    },
  }

  const selectAnswer = (answer: string) => {
    if (session.status === 'playing' && !isPaused) setLocal((current) => ({ ...current, selectedAnswer: answer }))
  }

  return (
    <GameTemplateFrame {...props} session={displaySession} config={graphLabConfig} state={state} interactionReady={Boolean(local.selectedAnswer)} playerAnswer={local.selectedAnswer ?? ''}>
      <div className="graph-lab__stage">
        <div className="graph-lab__function-picker" aria-label={t('game.graph.functionPicker')}>
          {graphFunctions.map((name) => <button key={name} type="button" disabled={session.status === 'feedback'} aria-pressed={local.functionName === name} className={local.functionName === name ? 'is-selected' : ''} onClick={() => chooseFunction(name)}>{name}</button>)}
        </div>
        <div className="graph-lab__plot">
          <svg viewBox={`0 0 ${bounds.width} ${bounds.height}`} role="img" aria-label={t('game.graph.plotAria', { function: local.functionName })}>
            <path className="graph-lab__grid" d={[
              ...xTicks.map((tick) => `M${xToSvg(tick)} ${bounds.top}V${bounds.bottom}`),
              ...yTicks.map((tick) => `M${bounds.left} ${yToSvg(tick)}H${bounds.right}`),
            ].join(' ')} />
            <path className="graph-lab__axis" d={`M${bounds.left} ${yToSvg(0)}H${bounds.right}M${xToSvg(0)} ${bounds.top}V${bounds.bottom}`} />
            <path className="graph-lab__curve" d={curvePath} />
            {challenge.kind === 'value' && queryPoint ? (
              <>
                <path className="graph-lab__query-line" d={`M${queryPoint.x} ${yToSvg(0)}V${queryPoint.y}`} />
                <circle cx={queryPoint.x} cy={queryPoint.y} r="7" className="graph-lab__query-point" />
                <text x={queryPoint.x} y={bounds.bottom + 22} textAnchor="middle" className="graph-lab__tick-label">{formatGraphAngle(challenge.queryX ?? 0)}</text>
              </>
            ) : null}
            {pointChoices.map(({ x, point }) => point ? (
              <g
                key={x}
                role="button"
                tabIndex={session.status === 'playing' ? 0 : -1}
                aria-label={t('game.graph.pointAria', { point: formatGraphAngle(x) })}
                aria-pressed={local.selectedAnswer === String(x)}
                className={`graph-lab__point-choice${local.selectedAnswer === String(x) ? ' is-selected' : ''}`}
                onClick={() => selectAnswer(String(x))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') selectAnswer(String(x))
                }}
              >
                <circle cx={point.x} cy={point.y} r="9" />
              </g>
            ) : null)}
            {xTicks.map((tick) => (
              <text key={tick} x={xToSvg(tick)} y={bounds.bottom + 22} textAnchor="middle" className="graph-lab__tick-label">{formatGraphAngle(tick)}</text>
            ))}
            <text x={bounds.right} y={yToSvg(0) - 8} textAnchor="end" className="graph-lab__axis-label">x</text>
          </svg>
        </div>
        {challenge.kind === 'value' ? (
          <div className="graph-lab__answers" aria-label={t('game.graph.valuesAria')}>
            {challenge.answerOptions.map((option) => (
              <button key={option.label} type="button" disabled={session.status !== 'playing'} aria-pressed={local.selectedAnswer === option.label} className={local.selectedAnswer === option.label ? 'is-selected' : ''} onClick={() => selectAnswer(option.label)}>{option.label}</button>
            ))}
          </div>
        ) : (
          <div className="graph-lab__point-options" aria-label={t('game.graph.pointsAria')}>
            {challenge.pointOptions.map((point) => (
              <button key={point} type="button" disabled={session.status !== 'playing'} aria-pressed={local.selectedAnswer === String(point)} className={local.selectedAnswer === String(point) ? 'is-selected' : ''} onClick={() => selectAnswer(String(point))}>x = {formatGraphAngle(point)}</button>
            ))}
          </div>
        )}
        <div className="graph-lab__status">
          <span>{t('game.combo')} <strong>×{local.combo}</strong></span>
          <span>{t('common.attempts')} <strong>{session.attempts.length}</strong></span>
        </div>
      </div>
    </GameTemplateFrame>
  )
}