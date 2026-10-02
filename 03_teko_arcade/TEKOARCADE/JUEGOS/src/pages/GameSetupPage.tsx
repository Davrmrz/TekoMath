import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  FileText,
  ImageUp,
  Sparkles,
  Upload,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ExerciseSourceCard } from '../components/ui/ExerciseSourceCard'
import { SessionSummary } from '../components/ui/SessionSummary'
import { getGameById } from '../data/gameRegistry'
import { getTopicById } from '../data/topics'
import { getExercisesForTopic } from '../exercises/data'
import { localExerciseParser } from '../engine/parser/localExerciseParser'
import { signalSyncConfig } from '../games/signal-sync/game.config'
import {
  createOptionalExerciseGenerationProvider,
  geminiExerciseGenerationEnabled,
} from '../services/exerciseGenerationProvider'
import { useLanguage } from '../i18n/LanguageProvider'
import { translateExerciseCopy, type TranslationKey } from '../i18n/translations'
import type { Difficulty, ExerciseDefinition, GameSessionDefinition, SourceType } from '../types'

type SetupSource = 'teko' | 'text' | 'image'

const difficultyKeys: Record<Difficulty, TranslationKey> = {
  easy: 'difficulty.easy',
  medium: 'difficulty.medium',
  hard: 'difficulty.hard',
}

export function GameSetupPage() {
  const { language, t } = useLanguage()
  const { topic, gameId } = useParams()
  const currentTopic = getTopicById(topic)
  const currentTopicId = currentTopic?.id
  const game = gameId ? getGameById(gameId) : undefined
  const navigate = useNavigate()

  const exercises = useMemo(() => currentTopicId ? getExercisesForTopic(currentTopicId) : [], [currentTopicId])
  const generationProvider = useMemo(() => createOptionalExerciseGenerationProvider(), [])
  const [selectedSource, setSelectedSource] = useState<SetupSource>('teko')
  const [selectedExerciseId, setSelectedExerciseId] = useState(exercises[0]?.id ?? '')
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition | null>(exercises[0] ?? null)
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false)
  const [generationError, setGenerationError] = useState(false)
  const [signalPairCount, setSignalPairCount] = useState(signalSyncConfig.rounds)
  const [exerciseText, setExerciseText] = useState('')
  const [parserResult, setParserResult] = useState<ReturnType<typeof localExerciseParser> | null>(null)
  const [imageName, setImageName] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const visibleExercises = useMemo(
    () => selectedExercise && !exercises.some((exercise) => exercise.id === selectedExercise.id)
      ? [selectedExercise, ...exercises]
      : exercises,
    [exercises, selectedExercise],
  )

  if (!currentTopic || !game) {
    return <Navigate to={currentTopic ? `/tema/${currentTopic.id}` : '/mapa'} replace />
  }

  const topicAccentMap: Record<string, string> = {
    sin: '#7d62f7',
    cos: '#8f7af8',
    tan: '#a36af7',
    csc: '#7b6cf4',
    sec: '#8a7ae8',
    cot: '#927bf1',
  }

  const selectedSourceLabel = selectedSource === 'teko'
    ? selectedExercise?.source === 'ai' ? t('setup.sourceLabelAi') : t('setup.sourceLabelTeko')
    : selectedSource === 'text' ? t('setup.sourceLabelText') : t('setup.sourceLabelImage')
  const setupDifficulty = selectedSource === 'teko' ? selectedExercise?.difficulty ?? game.difficulty : game.difficulty
  const selectedExerciseStatement = selectedExercise
    ? translateExerciseCopy(selectedExercise, 'prompt', language, selectedExercise.statement)
    : ''

  const summaryExercise = selectedSource === 'teko'
    ? selectedExerciseStatement || t('setup.emptySelection')
    : selectedSource === 'text'
      ? exerciseText.trim() || t('setup.textToContinue')
      : imageName || t('setup.imageNameReady')

  const confirmDisabled = selectedSource === 'teko'
    ? !selectedExercise
    : selectedSource === 'text'
      ? exerciseText.trim().length === 0
      : !imageName

  const handleAnalyzeText = () => {
    if (!exerciseText.trim()) return
    setParserResult(localExerciseParser(exerciseText))
  }

  const handleGenerateExercise = async () => {
    if (!geminiExerciseGenerationEnabled || isGeneratingExercise) return
    setIsGeneratingExercise(true)
    setGenerationError(false)
    try {
      const generated = await generationProvider.generateExercise({
        topic: currentTopic.id,
        difficulty: game.difficulty,
        gameId: game.id,
      })
      setSelectedExercise(generated)
      setSelectedExerciseId(generated.id)
    } catch {
      setGenerationError(true)
    } finally {
      setIsGeneratingExercise(false)
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const nextPreview = URL.createObjectURL(file)
    setPreviewUrl(nextPreview)
    setImageName(file.name)
    setSelectedSource('image')
  }

  const handleConfirm = () => {
    const effectiveSource: SourceType = selectedSource === 'teko'
      ? selectedExercise?.source ?? 'teko'
      : selectedSource === 'text' ? 'user-text' : 'user-image'

    const preparedExercise: ExerciseDefinition = selectedSource === 'teko' && selectedExercise
      ? selectedExercise
      : {
          id: `temp-${Date.now()}`,
          topic: currentTopic.id,
          statement: selectedSource === 'image'
            ? t('setup.uploadedImage', { name: imageName || 'ejercicio' })
            : exerciseText.trim() || t('setup.userTask'),
          difficulty: game.difficulty,
          source: effectiveSource,
          knownValues: {},
          unknown: '',
          answer: '',
          hints: [],
          metadata: selectedSource === 'image' ? { fileName: imageName } : undefined,
        }

    const session: GameSessionDefinition = {
      user: 'mock-user',
      topic: currentTopic.id,
      exercise: preparedExercise.statement,
      exerciseId: preparedExercise.id,
      gameId: game.id,
      source: effectiveSource,
      mode: 'offline',
      date: new Date().toISOString(),
      result: 'pending',
      difficulty: preparedExercise.difficulty,
      ...(game.id === 'signal-sync' ? { roundCount: signalPairCount } : {}),
    }

    sessionStorage.setItem('teko-juegos-session', JSON.stringify(session))
    navigate(`/juego/${game.id}`)
  }

  return (
    <section className="page-shell setup-page" style={{ ['--topic-accent' as string]: topicAccentMap[currentTopic.id] ?? '#7d62f7' }}>
      <div className="section-header setup-page__header">
        <div className="setup-page__title-wrap">
          <p className="eyebrow">{t('setup.eyebrow')}</p>
          <h2>{currentTopic.name}</h2>
        </div>
        <Link to={`/tema/${currentTopic.id}`} className="secondary-button setup-page__back">
          <ArrowLeft size={16} />
          {t('common.back')}
        </Link>
      </div>

      <div className="setup-header">
        <div className="setup-header__meta"><span className="label">{t('common.topic')}</span><strong>{currentTopic.name}</strong></div>
        <div className="setup-header__meta"><span className="label">{t('common.game')}</span><strong>{game.name}</strong></div>
        <div className="setup-header__meta"><span className="label">{t('common.difficulty')}</span><strong>{t(difficultyKeys[setupDifficulty])}</strong></div>
      </div>

      {game.id === 'signal-sync' ? (
        <label className="signal-sync-setup-count">
          <span>{t('setup.pairsCount')}</span>
          <select value={signalPairCount} onChange={(event) => setSignalPairCount(Number(event.target.value))}>
            {Array.from({ length: signalSyncConfig.maximumPairs - signalSyncConfig.minimumPairs + 1 }, (_, index) => signalSyncConfig.minimumPairs + index).map((count) => (
              <option key={count} value={count}>{t('setup.pairsOption', { count })}</option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="setup-panel">
        <div className="setup-panel__title">
          <p className="eyebrow">{t('setup.mainQuestion')}</p>
          <h3>{t('setup.title')}</h3>
        </div>

        <div className="source-grid">
          <ExerciseSourceCard title={t('setup.sourceChallenge')} description={t('setup.sourceChallengeDescription')} icon={<Sparkles size={20} />} selected={selectedSource === 'teko'} onClick={() => setSelectedSource('teko')} />
          <ExerciseSourceCard title={t('setup.sourceText')} description={t('setup.sourceTextDescription')} icon={<FileText size={20} />} selected={selectedSource === 'text'} onClick={() => setSelectedSource('text')} />
          <ExerciseSourceCard title={t('setup.sourceImage')} description={t('setup.sourceImageDescription')} icon={<Camera size={20} />} selected={selectedSource === 'image'} onClick={() => setSelectedSource('image')} />
        </div>

        {selectedSource === 'teko' ? (
          <div className="exercise-bank">
            {geminiExerciseGenerationEnabled ? (
              <div className="inline-actions">
                <button type="button" className="secondary-button" disabled={isGeneratingExercise} aria-busy={isGeneratingExercise} onClick={handleGenerateExercise}>
                  <Sparkles size={16} />
                  {isGeneratingExercise ? t('setup.generating') : t('setup.generateAi')}
                </button>
                {generationError ? <span role="status">{t('setup.generatedError')}</span> : null}
              </div>
            ) : null}
            {visibleExercises.map((exercise) => (
              <div key={exercise.id} className={`exercise-bank__item ${selectedExerciseId === exercise.id ? 'is-selected' : ''}`}>
                <div className="exercise-bank__content">
                  <span className="difficulty-pill">{t(difficultyKeys[exercise.difficulty])}</span>
                  <p>{translateExerciseCopy(exercise, 'prompt', language, exercise.statement)}</p>
                </div>
                <button type="button" className="secondary-button" onClick={() => { setSelectedExerciseId(exercise.id); setSelectedExercise(exercise) }}>
                  {selectedExerciseId === exercise.id ? t('setup.selected') : t('setup.useExercise')}
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {selectedSource === 'text' ? (
          <div className="text-exercise-panel">
            <label htmlFor="exercise-text" className="sr-only">{t('setup.exerciseTextLabel')}</label>
            <textarea id="exercise-text" value={exerciseText} onChange={(event) => setExerciseText(event.target.value)} placeholder={t('setup.exerciseTextPlaceholder')} rows={6} />
            <div className="text-exercise-panel__footer">
              <span>{t('setup.characterCount', { count: exerciseText.length })}</span>
              <div className="inline-actions">
                <button type="button" className="secondary-button" onClick={handleAnalyzeText}>{t('setup.analyze')}</button>
                <button type="button" className="secondary-button secondary-button--muted" disabled>{t('setup.analyzeAiSoon')}</button>
              </div>
            </div>
            {parserResult ? (
              <div className="parser-result">
                {parserResult.status === 'VALID' ? (
                  <><CheckCircle2 size={18} /><div><strong>{t('setup.detectedTopic', { topic: parserResult.topicLabel ?? '' })}</strong><p>{t('setup.detectedValues', { values: parserResult.values.join(', ') || t('setup.noNumbers') })}</p></div></>
                ) : parserResult.status === 'PARTIAL' ? (
                  <><Sparkles size={18} /><div><strong>{t('setup.partialUnderstood')}</strong><p>{t('setup.partialContinue')}</p></div></>
                ) : (
                  <><FileText size={18} /><div><strong>{t('setup.parserUnsupportedTitle')}</strong><p>{t('setup.parserUnsupportedDescription')}</p></div></>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {selectedSource === 'image' ? (
          <div className="image-upload-panel">
            <label className="upload-dropzone" htmlFor="image-upload">
              <input id="image-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageSelect} />
              <Upload size={18} />
              <span>{t('setup.imageDrop')}</span>
            </label>
            {previewUrl ? (
              <div className="image-preview">
                <img src={previewUrl} alt={t('setup.previewImageAlt')} />
                <div className="image-preview__meta"><ImageUp size={16} /><span>{imageName}</span></div>
                <p>{t('setup.imageReady')}</p>
                <p>{t('setup.imageRecognitionSoon')}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <SessionSummary
        topic={currentTopic.name}
        gameName={game.name}
        sourceLabel={selectedSourceLabel}
        exercise={summaryExercise}
        difficulty={t(difficultyKeys[setupDifficulty])}
        onConfirm={handleConfirm}
        disabled={confirmDisabled}
      />
    </section>
  )
}
