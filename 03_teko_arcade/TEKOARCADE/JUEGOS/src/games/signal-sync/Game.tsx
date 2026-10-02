import { useState } from 'react'
import { Check } from 'lucide-react'
import { GameTemplateFrame } from '../core/GameTemplateFrame'
import { getExercisesForTopic } from '../../exercises/data'
import { getTopicById } from '../../data/topics'
import { finishAndRecordGame } from '../core/finishAndRecordGame'
import { calculateScore, registerAttempt, resumeGame, startGame, useHint as applyGameHint } from '../core/gameEngine'
import { signalSyncConfig } from './game.config'
import type { SignalSyncLocalState, SignalSyncProps } from './game.types'
import { useLanguage } from '../../i18n/LanguageProvider'
import type { TranslationKey } from '../../i18n/translations'
import { translateExerciseCopy } from '../../i18n/translations'

import { calculateSignalComboBonus, calculateSignalSyncResultMetrics, createSignalSyncDeck, getSignalSyncStatus, isSignalMatch, isSignalSyncComplete, selectSignalCard } from './signalSyncData'
import type { SignalRelation } from './signalSyncData'

const relationTranslationKeys: Record<SignalRelation, TranslationKey> = {
  'ratio-formula': 'game.signal.relationFormula',
  'ratio-sides': 'game.signal.relationSides',
  'expression-value': 'game.signal.relationValue',
  'concept-representation': 'game.signal.relationConcept',
}

function localId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function timestamp(): string {
  return new Date().toISOString()
}

export function SignalSyncGame(props: SignalSyncProps) {
  const { language, t } = useLanguage()
  const [deck] = useState(() => {
    const topic = getTopicById(props.session.topicId)
    return topic
      ? createSignalSyncDeck(
          getExercisesForTopic(props.session.topicId),
          topic,
          {
            topicId: props.session.topicId,
            difficulty: props.session.exercise.difficulty,
            roundCount: props.session.roundCount ?? signalSyncConfig.rounds,
            selectedExerciseId: props.session.exercise.id,
          },
        )
      : []
  })
  const [session, setSession] = useState(() => ({
    ...props.session,
    exercise: { ...props.session.exercise, prompt: t('game.signal.prompt') },
  }))
  const [local, setLocal] = useState<SignalSyncLocalState>({
    selection: { source: null, target: null },
    solvedPairIds: [],
    combo: 0,
    bestCombo: 0,
    status: 'waiting',
  })
  const [isPaused, setIsPaused] = useState(false)

  const updateSelection = (side: 'source' | 'target', pairId: string) => {
    if (session.status !== 'playing' || isPaused || session.currentFeedback) return
    setLocal((current) => {
      const selection = selectSignalCard(current.selection, side, pairId, current.solvedPairIds)
      return {
        ...current,
        selection,
        status: getSignalSyncStatus({
          phase: session.status,
          selection,
          feedbackKind: null,
          solvedPairs: current.solvedPairIds.length,
          totalPairs: deck.length,
        }),
      }
    })
  }

  const state = {
    phase: session.status,
    round: Math.min(local.solvedPairIds.length + 1, Math.max(deck.length, 1)),
    rounds: Math.max(deck.length, 1),
    attempts: session.attempts.length,
    score: session.currentScore.points,
    bestCombo: local.bestCombo,
    isFinalRound: isSignalSyncComplete(local.solvedPairIds.length, deck.length),
    isPaused,
    feedback: session.currentFeedback,
    result: session.result,
    start: () => {
      setSession(startGame({ ...session, startedAt: timestamp() }))
      setIsPaused(false)
    },
    togglePause: () => setIsPaused((paused) => !paused),
    checkAnswer: (_answer: string | number, ready: boolean) => {
      if (!ready || session.status !== 'playing' || isPaused || session.currentFeedback) return
      const correct = isSignalMatch(local.selection)
      const nextCombo = correct ? local.combo + 1 : 0
      const attempt = registerAttempt(
        session,
        { value: `${local.selection.source}:${local.selection.target}`, submittedAt: timestamp() },
        {
          isCorrect: correct,
          message: correct
            ? '¡Conexión correcta! La representación coincide.'
            : 'No coinciden. Revisá las tarjetas y probá otra conexión.',
        },
        localId('attempt'),
        correct ? calculateSignalComboBonus(nextCombo) : 0,
      )
      setLocal((current) => ({
        ...current,
        solvedPairIds: correct && local.selection.source
          ? [...current.solvedPairIds, local.selection.source]
          : current.solvedPairIds,
        combo: nextCombo,
        bestCombo: Math.max(current.bestCombo, nextCombo),
        status: correct ? 'correct' : 'incorrect',
      }))
      setSession(attempt)
    },
    showHint: () => {
      if (session.status === 'playing' && !isPaused) setSession(applyGameHint(session))
    },
    continueRound: () => {
      if (session.status !== 'feedback' || isPaused) return
      if (session.currentFeedback?.kind === 'correct' && isSignalSyncComplete(local.solvedPairIds.length, deck.length)) {
        const resultMetrics = calculateSignalSyncResultMetrics(session.attempts, local.bestCombo)
        setSession(finishAndRecordGame(session, 'completed', resultMetrics))
        setLocal((current) => ({ ...current, status: 'completed' }))
        return
      }
      const resumed = resumeGame(session)
      setSession({ ...resumed, currentScore: calculateScore(resumed.attempts) })
      setLocal((current) => {
        const selection = { source: null, target: null }
        return {
          ...current,
          selection,
          status: getSignalSyncStatus({
            phase: resumed.status,
            selection,
            feedbackKind: null,
            solvedPairs: current.solvedPairIds.length,
            totalPairs: deck.length,
          }),
        }
      })
    },
    abandon: () => {
      if (session.status === 'completed' || session.status === 'abandoned') return
      setSession(finishAndRecordGame(session, 'user-exit'))
      setLocal((current) => ({ ...current, status: 'completed' }))
    },
  }

  return (
    <GameTemplateFrame {...props} session={session} config={signalSyncConfig} state={state} interactionReady={Boolean(local.selection.source && local.selection.target)} playerAnswer={`${local.selection.source ?? ''}:${local.selection.target ?? ''}`}>
      <div className={`signal-sync__game signal-sync__game--${local.status}`} data-status={local.status}>
        <div className="signal-sync__stats" aria-label={t('game.signal.statsAria')}>
          <span>{t('game.signal.connections')} <strong>{local.solvedPairIds.length}/{deck.length}</strong></span>
          <span>{t('game.combo')} <strong>x{local.combo}</strong></span>
          <span>{t('common.attempts')} <strong>{session.attempts.length}</strong></span>
        </div>
        <div className="signal-sync__board" aria-label={t('game.signal.boardAria')}>
          <div className="signal-sync__column">
            <span className="game-field-label">{t('game.signal.representations')}</span>
            {deck.map((match) => (
              <button
                type="button"
                key={match.id}
                aria-pressed={local.selection.source === match.id}
                aria-label={t('game.signal.sourceCard', {
                  relation: t(relationTranslationKeys[match.relation]),
                  source: match.relation === 'concept-representation'
                    ? translateExerciseCopy({ id: match.exerciseId }, 'prompt', language, match.source)
                    : match.source,
                  solved: local.solvedPairIds.includes(match.id) ? t('game.solvedCardSuffix') : '',
                })}
                disabled={session.status !== 'playing' || isPaused || local.solvedPairIds.includes(match.id) || Boolean(session.currentFeedback)}
                className={`signal-sync__card${local.selection.source === match.id ? ' is-selected' : ''}${local.solvedPairIds.includes(match.id) ? ' is-solved' : ''}`}
                onClick={() => updateSelection('source', match.id)}
              >
                <span className="signal-sync__relation">{t(relationTranslationKeys[match.relation])}</span>
                <strong>{match.relation === 'concept-representation'
                  ? translateExerciseCopy({ id: match.exerciseId }, 'prompt', language, match.source)
                  : match.source}</strong>
                {local.solvedPairIds.includes(match.id) ? <Check size={17} aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
          <div className="signal-sync__link" aria-hidden="true">⇄</div>
          <div className="signal-sync__column">
            <span className="game-field-label">{t('game.signal.valuesConcepts')}</span>
            {deck.map((match) => (
              <button
                type="button"
                key={match.id}
                aria-pressed={local.selection.target === match.id}
                aria-label={t('game.signal.targetCard', {
                  target: match.target,
                  solved: local.solvedPairIds.includes(match.id) ? t('game.solvedCardSuffix') : '',
                })}
                disabled={session.status !== 'playing' || isPaused || local.solvedPairIds.includes(match.id) || Boolean(session.currentFeedback)}
                className={`signal-sync__card${local.selection.target === match.id ? ' is-selected' : ''}${local.solvedPairIds.includes(match.id) ? ' is-solved' : ''}`}
                onClick={() => updateSelection('target', match.id)}
              >
                <strong>{match.target}</strong>
                {local.solvedPairIds.includes(match.id) ? <Check size={17} aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
        </div>
        <p className="game-stage-note">{t('game.signal.stageNote')}</p>
      </div>
    </GameTemplateFrame>
  )
}