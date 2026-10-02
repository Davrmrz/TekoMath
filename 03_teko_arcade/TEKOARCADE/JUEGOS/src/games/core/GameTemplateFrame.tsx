import { ArrowLeft, Check, CircleHelp, Pause, Play, RotateCcw, Target } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { GameTemplateFrameProps } from './game.types'
import { useLanguage } from '../../i18n/LanguageProvider'
import { translateExerciseCopy, type TranslationKey } from '../../i18n/translations'
import { useSound } from '../../audio/useSound'
import { missionService } from '../../services/missionService'
import { progressService } from '../../services/progressService'

export function GameTemplateFrame({ game, session, state, interactionReady, playerAnswer, children }: GameTemplateFrameProps) {
  const { language, t } = useLanguage()
  const { playSound } = useSound()
  const feedback = state.feedback
  const feedbackSignature = feedback ? `${feedback.kind}:${feedback.message}` : null
  const previousFeedback = useRef<string | null>(feedbackSignature)
  const previousPhase = useRef(state.phase)
  const initialXp = useRef<number | null>(null)
  const initialMissionStatuses = useRef<Map<string, string> | null>(null)
  if (initialXp.current === null) initialXp.current = progressService.getUserProgress().xp
  if (initialMissionStatuses.current === null) {
    initialMissionStatuses.current = new Map(missionService.getMissions().map((mission) => [mission.id, mission.status]))
  }
  const hintIndex = feedback?.kind === 'hint' ? session.exercise.hints.indexOf(feedback.message) : -1
  const prompt = translateExerciseCopy({
    id: session.exercise.id,
    topicId: session.exercise.topicId,
    difficulty: session.exercise.difficulty,
    knownValues: session.exercise.knownValues,
    expectedAnswer: session.exercise.expectedAnswer,
  }, 'prompt', language, session.exercise.prompt)
  const graphHintKey: TranslationKey | undefined = game.id === 'graph-lab'
    ? session.exercise.id.includes('-value-')
      ? 'game.graph.hintValue'
      : session.exercise.id.includes('-maximum-')
        ? 'game.graph.hintMaximum'
        : 'game.graph.hintZero'
    : undefined
  const isTriangleForge = game.id === 'triangle-forge'
  const isPairMatrix = game.id === 'pair-matrix'
  const isSignalSync = game.id === 'signal-sync'
  const isRatioRush = game.id === 'ratio-rush'
  const isVectorLaunch = game.id === 'vector-launch'
  const isGraphLab = game.id === 'graph-lab'
  const feedbackLabel = feedback ? t(`game.feedback.${feedback.kind}Label` as TranslationKey) : ''
  const feedbackMessage = feedback
    ? feedback.kind === 'hint'
      ? hintIndex >= 0
        ? graphHintKey
          ? t(graphHintKey)
          : translateExerciseCopy({
            id: session.exercise.id,
            topicId: session.exercise.topicId,
            difficulty: session.exercise.difficulty,
            knownValues: session.exercise.knownValues,
            expectedAnswer: session.exercise.expectedAnswer,
          }, 'hint', language, feedback.message, hintIndex)
        : feedback.message === 'No hay más pistas para este ejercicio.'
          ? t('game.noMoreHints')
          : feedback.message
      : t(`game.feedback.${feedback.kind}` as TranslationKey)
    : ''
  const continueLabel = feedback?.kind === 'hint'
    ? t('game.continueHint')
    : isRatioRush
      ? t('game.nextQuestion')
      : isVectorLaunch
        ? state.round === state.rounds ? t('game.viewResult') : t('game.nextLaunch')
        : isGraphLab
          ? state.round === state.rounds ? t('game.viewResult') : t('game.nextChallenge')
          : feedback?.kind === 'incorrect'
            ? t('game.retry')
            : ((isPairMatrix || isSignalSync) ? state.isFinalRound : state.round === state.rounds)
              ? t('game.viewResult')
              : isTriangleForge
                ? t('game.nextExercise')
                : isSignalSync
                  ? t('game.nextConnection')
                  : t('game.continue')

  useEffect(() => {
    if (feedbackSignature && feedbackSignature !== previousFeedback.current) {
      const soundId = feedback?.kind === 'correct'
        ? 'game.correct'
        : feedback?.kind === 'incorrect'
          ? 'game.incorrect'
          : feedback?.kind === 'hint'
            ? 'game.hint'
            : null
      if (soundId) playSound(soundId)
      previousFeedback.current = feedbackSignature
    } else if (!feedbackSignature) {
      previousFeedback.current = null
    }
  }, [feedback?.kind, feedback?.message, feedbackSignature, playSound])

  useEffect(() => {
    const priorPhase = previousPhase.current
    if (priorPhase !== state.phase && state.phase === 'playing' && priorPhase === 'ready') playSound('game.start')
    let rewardTimer: number | undefined
    if (priorPhase !== state.phase && state.phase === 'completed') {
      const result = state.result
      const perfectScore = result?.stars === 3 && result.accuracy === 100
      playSound('game.complete', { variation: perfectScore ? 2 : 1 })

      const currentXp = progressService.getUserProgress().xp
      const reachedLevel = Math.floor(currentXp / 100) > Math.floor((initialXp.current ?? currentXp) / 100)
      const completedMission = missionService.getMissions().some((mission) =>
        mission.status === 'completed'
        && initialMissionStatuses.current?.get(mission.id) !== 'completed'
        && initialMissionStatuses.current?.get(mission.id) !== 'claimed',
      )
      const extraSound = reachedLevel
        ? 'progress.levelUp'
        : completedMission
          ? 'mission.complete'
          : result?.stars
            ? 'reward.star'
            : null
      if (extraSound) {
        rewardTimer = window.setTimeout(() => {
          playSound(extraSound, extraSound === 'reward.star' ? { variation: result?.stars } : undefined)
        }, 300)
      }
    }
    previousPhase.current = state.phase
    return () => {
      if (rewardTimer !== undefined) window.clearTimeout(rewardTimer)
    }
  }, [playSound, state.phase, state.result])

  return (
    <section className={`page-shell game-screen game-screen--${game.id}`}>
      <header className="game-session-header">
        <Link to={`/tema/${session.topicId}`} className="game-session-header__back" aria-label={t('game.backToTopic')} onClick={() => state.abandon('user-exit')}>
          <ArrowLeft size={18} />
        </Link>
        <div className="game-session-header__identity">
          <span>{game.name}</span>
          <small>{session.topicId.toUpperCase()} · {t(`games.${game.id}.activity` as TranslationKey)}</small>
        </div>
        {!isRatioRush && (state.phase === 'playing' || state.phase === 'feedback') ? (
          <button className="game-session-header__pause" type="button" onClick={state.togglePause} aria-label={state.isPaused ? t('game.resume') : t('game.pause')}>
            {state.isPaused ? <Play size={17} /> : <Pause size={17} />}
          </button>
        ) : null}
      </header>

      {!isRatioRush ? <div className="game-round-hud">
        <div className="game-round-hud__copy"><span>{t('game.roundLabel')}</span><strong>{state.round}/{state.rounds}</strong></div>
        <div className="game-round-hud__track" role="progressbar" aria-valuemin={0} aria-valuemax={state.rounds} aria-valuenow={state.round}>
          <span style={{ width: `${(state.round / state.rounds) * 100}%` }} />
        </div>
        <div className="game-round-hud__score"><Target size={15} /><span>{state.score}</span></div>
      </div> : null}

      <div className="game-prompt">
        <span className="game-prompt__eyebrow">{t(`games.${game.id}.instruction` as TranslationKey)}</span>
        <h2>{prompt}</h2>
      </div>

      <div className={`game-play-area${state.isPaused ? ' is-paused' : ''}`}>
        {children}
        {state.isPaused ? (
          <div className="game-pause-overlay" role="dialog" aria-modal="true" aria-label={t('game.paused')}>
            <div className="game-pause-overlay__card">
              <Pause size={23} />
              <strong>{t('game.paused')}</strong>
              <button className="primary-button" type="button" onClick={state.togglePause}>{t('common.continue')}</button>
            </div>
          </div>
        ) : null}
      </div>

      {feedback ? (
        <div className={`game-feedback game-feedback--${feedback.kind}`} role="status">
          <span className="game-feedback__icon">{feedback.kind === 'correct' ? <Check size={17} /> : <CircleHelp size={17} />}</span>
          <div><strong>{feedbackLabel}</strong><p>{feedbackMessage}</p></div>
        </div>
      ) : null}

      <div className="game-actions">
        {state.phase === 'ready' ? (
          <button className="primary-button game-actions__primary" type="button" onClick={state.start}><Play size={17} />{isTriangleForge || isPairMatrix || isSignalSync || isRatioRush || isVectorLaunch || isGraphLab ? t('game.start') : t('game.startTemplate')}</button>
        ) : null}
        {state.phase === 'playing' ? (
          <>
            {!isPairMatrix && !isRatioRush ? <button className="secondary-button game-actions__hint" type="button" onClick={state.showHint}>{t('game.showHint')}</button> : null}
            <button className="primary-button game-actions__primary" type="button" disabled={!interactionReady || state.isPaused} onClick={() => state.checkAnswer(playerAnswer, interactionReady)}>{isRatioRush ? t('game.respond') : t('game.check')}</button>
          </>
        ) : null}
        {state.phase === 'feedback' ? (
          <button className="primary-button game-actions__primary" type="button" onClick={state.continueRound}>
            {continueLabel}
          </button>
        ) : null}
      </div>

      {state.phase === 'completed' ? (
        <section className="game-result-panel" aria-label={t('game.resultAria', { game: game.name })}>
          <div className="game-result-panel__icon"><RotateCcw size={22} /></div>
          <p className="eyebrow">{isTriangleForge || isPairMatrix || isSignalSync || isRatioRush || isVectorLaunch || isGraphLab ? t('game.completed') : t('game.templateCompleted')}</p>
          <h2>{isTriangleForge || isPairMatrix || isSignalSync || isRatioRush || isVectorLaunch || isGraphLab ? t('game.finalResult') : t('game.connectLater')}</h2>
          <div className="game-result-panel__stats">
            {isGraphLab ? (
              <>
                <div><span>{t('game.correct')}</span><strong>{state.result?.correctAnswers ?? session.currentScore.correctAnswers}</strong></div>
                <div><span>{t('game.incorrect')}</span><strong>{state.result?.incorrectAttempts ?? 0}</strong></div>
                <div><span>{t('game.attemptsTotal')}</span><strong>{state.result?.totalAttempts ?? state.result?.attempts ?? state.attempts}</strong></div>
                <div><span>{t('common.accuracy')}</span><strong>{state.result?.accuracy ?? 0}%</strong></div>
                <div><span>{t('common.score')}</span><strong>{state.result?.score ?? state.score}</strong></div>
                <div><span>{t('game.bestCombo')}</span><strong>x{state.result?.bestCombo ?? state.bestCombo ?? 0}</strong></div>
                <div><span>{t('game.xpStars')}</span><strong>{state.result?.xpEarned ?? 0} / {'★'.repeat(state.result?.stars ?? 0)}{'☆'.repeat(3 - (state.result?.stars ?? 0))}</strong></div>
              </>
            ) : isVectorLaunch ? (
              <>
                <div><span>{t('game.correct')}</span><strong>{state.result?.correctAnswers ?? session.currentScore.correctAnswers}</strong></div>
                <div><span>{t('game.incorrect')}</span><strong>{state.result?.incorrectAttempts ?? 0}</strong></div>
                <div><span>{t('game.attemptsTotal')}</span><strong>{state.result?.totalAttempts ?? state.result?.attempts ?? state.attempts}</strong></div>
                <div><span>{t('common.accuracy')}</span><strong>{state.result?.accuracy ?? 0}%</strong></div>
                <div><span>{t('common.score')}</span><strong>{state.result?.score ?? state.score}</strong></div>
                <div><span>{t('game.bestCombo')}</span><strong>x{state.result?.bestCombo ?? state.bestCombo ?? 0}</strong></div>
                <div><span>{t('game.duration')}</span><strong>{formatDuration(state.result?.duration ?? 0)}</strong></div>
                <div><span>{t('game.xpStars')}</span><strong>{state.result?.xpEarned ?? 0} / {'★'.repeat(state.result?.stars ?? 0)}{'☆'.repeat(3 - (state.result?.stars ?? 0))}</strong></div>
              </>
            ) : isRatioRush ? (
              <>
                <div><span>{t('game.correct')}</span><strong>{state.result?.correctAnswers ?? session.currentScore.correctAnswers}</strong></div>
                <div><span>{t('game.incorrect')}</span><strong>{state.result?.incorrectAttempts ?? 0}</strong></div>
                <div><span>{t('game.attemptsTotal')}</span><strong>{state.result?.totalAttempts ?? state.result?.attempts ?? state.attempts}</strong></div>
                <div><span>{t('common.accuracy')}</span><strong>{state.result?.accuracy ?? 0}%</strong></div>
                <div><span>{t('common.score')}</span><strong>{state.result?.score ?? state.score}</strong></div>
                <div><span>{t('game.bestCombo')}</span><strong>x{state.result?.bestCombo ?? state.bestCombo ?? 0}</strong></div>
                <div><span>{t('game.duration')}</span><strong>{formatDuration(state.result?.duration ?? 0)}</strong></div>
                <div><span>{t('game.xpStars')}</span><strong>{state.result?.xpEarned ?? 0} / {'★'.repeat(state.result?.stars ?? 0)}{'☆'.repeat(3 - (state.result?.stars ?? 0))}</strong></div>
              </>
            ) : isSignalSync ? (
              <>
                <div><span>{t('game.correctPairs')}</span><strong>{state.result?.correctPairs ?? session.currentScore.correctAnswers}/{state.rounds}</strong></div>
                <div><span>{t('game.errors')}</span><strong>{state.result?.incorrectAttempts ?? 0}</strong></div>
                <div><span>{t('common.accuracy')}</span><strong>{state.result?.accuracy ?? 0}%</strong></div>
                <div><span>XP</span><strong>{state.result?.xpEarned ?? 0}</strong></div>
                <div><span>{t('topic.stars')}</span><strong>{'★'.repeat(state.result?.stars ?? 0)}{'☆'.repeat(3 - (state.result?.stars ?? 0))}</strong></div>
                <div><span>{t('game.totalAttempts')}</span><strong>{state.result?.totalAttempts ?? state.result?.attempts ?? state.attempts}</strong></div>
                <div><span>{t('game.bestCombo')}</span><strong>x{state.bestCombo ?? 0}</strong></div>
              </>
            ) : isPairMatrix ? (
              <>
                <div><span>{t('game.pairs')}</span><strong>{session.currentScore.correctAnswers}/3</strong></div>
                <div><span>{t('common.accuracy')}</span><strong>{state.result?.accuracy ?? 0}%</strong></div>
                <div><span>XP</span><strong>{state.result?.xpEarned ?? 0}</strong></div>
                <div><span>{t('topic.stars')}</span><strong>{'★'.repeat(state.result?.stars ?? 0)}{'☆'.repeat(3 - (state.result?.stars ?? 0))}</strong></div>
                <div><span>{t('game.attemptsTotal')}</span><strong>{state.result?.attempts ?? state.attempts}</strong></div>
                <div><span>{t('game.bestCombo')}</span><strong>x{state.bestCombo ?? 0}</strong></div>
                <div><span>{t('game.duration')}</span><strong>{formatDuration(state.result?.duration ?? 0)}</strong></div>
              </>
            ) : isTriangleForge ? (
              <>
                <div><span>{t('game.correct')}</span><strong>{session.currentScore.correctAnswers}/3</strong></div>
                <div><span>{t('common.accuracy')}</span><strong>{state.result?.accuracy ?? 0}%</strong></div>
                <div><span>XP</span><strong>{state.result?.xpEarned ?? 0}</strong></div>
                <div><span>{t('topic.stars')}</span><strong>{'★'.repeat(state.result?.stars ?? 0)}{'☆'.repeat(3 - (state.result?.stars ?? 0))}</strong></div>
                <div><span>{t('game.attemptsTotal')}</span><strong>{state.result?.attempts ?? state.attempts}</strong></div>
                <div><span>{t('game.hints')}</span><strong>{state.result?.hintsUsed ?? 0}</strong></div>
              </>
            ) : (
              <>
                <div><span>{t('common.score')}</span><strong>{state.score}</strong></div>
                <div><span>{t('game.attemptsTotal')}</span><strong>{state.attempts}</strong></div>
                <div><span>{t('game.fallbackPrecision')}</span><strong>—</strong></div>
                <div><span>{t('game.fallbackStars')}</span><strong>—</strong></div>
              </>
            )}
          </div>
          <Link className="secondary-button" to={`/tema/${session.topicId}`}>{t('game.backToTopic')}</Link>
        </section>
      ) : null}
    </section>
  )
}

function formatDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}