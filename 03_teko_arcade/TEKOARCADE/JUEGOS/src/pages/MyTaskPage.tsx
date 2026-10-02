import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  FileText,
  ImageUp,
  LoaderCircle,
  Play,
  Sparkles,
  Upload,
  Wand2,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getGamesForTopic } from '../data/gameRegistry'
import type { ExerciseDefinition, GameSessionDefinition, SourceType } from '../types'
import { localExerciseParser, type LocalExerciseParseResult } from '../engine/parser/localExerciseParser'
import { networkManager } from '../services/networkManager'
import {
  createOptionalExerciseGenerationProvider,
  geminiExerciseGenerationEnabled,
  LocalScriptProvider,
} from '../services/exerciseGenerationProvider'
import { recognizeImageText } from '../services/imageTextRecognition'
import { detectTaskTopic, resolveTaskExercise } from '../services/taskExerciseResolver'
import { useLanguage } from '../i18n/LanguageProvider'
import { translateExerciseCopy, type TranslationKey } from '../i18n/translations'

const topicLabels = {
  sin: 'Seno',
  cos: 'Coseno',
  tan: 'Tangente',
  csc: 'Cosecante',
  sec: 'Secante',
  cot: 'Cotangente',
} as const

const topicOptions = Object.entries(topicLabels) as [keyof typeof topicLabels, string][]
const topicExplanationKeys: Record<string, TranslationKey> = {
  sin: 'setup.topicExplanation.sin',
  cos: 'setup.topicExplanation.cos',
  tan: 'setup.topicExplanation.tan',
  csc: 'setup.topicExplanation.csc',
  sec: 'setup.topicExplanation.sec',
  cot: 'setup.topicExplanation.cot',
}
const resultExplanationKeys = topicExplanationKeys

export function MyTaskPage() {
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const [selectedMode, setSelectedMode] = useState<'text' | 'image'>('text')
  const [exerciseText, setExerciseText] = useState('')
  const [manualTopic, setManualTopic] = useState<keyof typeof topicLabels>('sin')
  const [imageName, setImageName] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analysisState, setAnalysisState] = useState<'idle' | 'analyzing' | 'ready'>('idle')
  const [parseResult, setParseResult] = useState<LocalExerciseParseResult | null>(null)
  const [exerciseDefinition, setExerciseDefinition] = useState<ExerciseDefinition | null>(null)
  const [analysisMessage, setAnalysisMessage] = useState('')
  const [selectedGameId, setSelectedGameId] = useState('')

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const effectiveTopic = exerciseDefinition?.topic ?? parseResult?.detectedTopic
  const compatibleGames = useMemo(() => effectiveTopic ? getGamesForTopic(effectiveTopic) : [], [effectiveTopic])
  const activeGameId = compatibleGames.some((game) => game.id === selectedGameId)
    ? selectedGameId
    : compatibleGames[0]?.id ?? ''

  const analyzeTaskText = async (
    text: string,
    source: Extract<SourceType, 'user-text' | 'user-image'>,
    topicOverride?: string,
  ) => {
    const normalizedText = text.trim()
    setAnalysisState('analyzing')
    setAnalysisMessage('')
    const parsed = localExerciseParser(normalizedText)
    const topic = detectTaskTopic(normalizedText, topicOverride)
    if (topic && topic in topicLabels) setManualTopic(topic as keyof typeof topicLabels)

    let resolved = topic
      ? resolveTaskExercise(normalizedText, {
          topic: topicOverride,
          difficulty: getGamesForTopic(topic)[0]?.difficulty ?? 'easy',
          source,
        })
      : null
    const displayedParseResult = topic
      ? {
          ...parsed,
          ...(resolved ? { status: 'VALID' as const } : {}),
          detectedTopic: topic,
          topicLabel: topicLabels[topic as keyof typeof topicLabels],
        }
      : parsed
    setParseResult(displayedParseResult)

    if (!resolved && topic && networkManager.getState() === 'ONLINE_GOOD' && geminiExerciseGenerationEnabled) {
      try {
        resolved = await createOptionalExerciseGenerationProvider().generateExercise({
          topic,
          difficulty: getGamesForTopic(topic)[0]?.difficulty ?? 'easy',
          gameId: getGamesForTopic(topic)[0]?.id ?? 'ratio-rush',
          context: { taskText: normalizedText, inputMode: source },
        })
      } catch {
        setAnalysisMessage(t('task.remoteFailed'))
      }
    }

    setExerciseDefinition(resolved)
    setAnalysisState('ready')
  }

  const handleAnalyzeText = () => {
    if (exerciseText.trim()) void analyzeTaskText(exerciseText, 'user-text')
  }

  const handleAnalyzeImage = async () => {
    if (!imageFile) return
    setAnalysisState('analyzing')
    setAnalysisMessage(t('task.imageRecognizing'))
    try {
      const recognizedText = await recognizeImageText(imageFile)
      setExerciseText(recognizedText)
      if (!recognizedText) {
        setParseResult(localExerciseParser(''))
        setExerciseDefinition(null)
        setAnalysisMessage(t('task.noText'))
        setAnalysisState('ready')
        return
      }
      await analyzeTaskText(recognizedText, 'user-image')
    } catch {
      setParseResult(localExerciseParser(''))
      setExerciseDefinition(null)
      setAnalysisMessage(t('task.ocrOffline'))
      setAnalysisState('ready')
    }
  }

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setImageName(file.name)
    setImageFile(file)
    setExerciseText('')
    setExerciseDefinition(null)
    setParseResult(null)
    setAnalysisState('idle')
    setAnalysisMessage('')
    setSelectedMode('image')
  }

  const handleGenerateLocal = async (topic = manualTopic) => {
    setAnalysisState('analyzing')
    setAnalysisMessage(t('task.localPreparing'))
    try {
      const game = getGamesForTopic(topic)[0]
      if (!game) throw new Error('No local practice for selected topic.')
      const generated = await new LocalScriptProvider().generateExercise({
        topic,
        difficulty: game.difficulty,
        gameId: game.id,
        ...(exerciseText.trim() ? { context: { taskText: exerciseText.trim() } } : {}),
      })
      setExerciseDefinition(generated)
      setParseResult({
        status: 'VALID',
        detectedTopic: topic,
        topicLabel: topicLabels[topic],
        values: localExerciseParser(exerciseText).values,
        normalizedText: exerciseText.trim() || generated.statement,
      })
      setAnalysisMessage(t('task.localUsed'))
    } catch {
      setExerciseDefinition(null)
      setAnalysisMessage(t('task.localUnavailable'))
    } finally {
      setAnalysisState('ready')
    }
  }

  const handleManualTopic = async () => {
    const source: Extract<SourceType, 'user-text' | 'user-image'> = selectedMode === 'image' ? 'user-image' : 'user-text'
    const topic = manualTopic
    const taskText = exerciseText.trim()
    if (taskText) {
      const previouslyDetectedTopic = localExerciseParser(taskText).detectedTopic
      if (previouslyDetectedTopic && previouslyDetectedTopic !== topic) {
        setParseResult({
          ...localExerciseParser(taskText),
          detectedTopic: topic,
          topicLabel: topicLabels[topic],
        })
        await handleGenerateLocal(topic)
        return
      }
      await analyzeTaskText(taskText, source, topic)
      return
    }
    await handleGenerateLocal(topic)
  }

  const handleConfirm = () => {
    const exercise = exerciseDefinition
    if (!exercise) return
    const selectedGameForSession = getGamesForTopic(exercise.topic).find((game) => game.id === activeGameId)
      ?? getGamesForTopic(exercise.topic)[0]
    if (!selectedGameForSession) return

    const session: GameSessionDefinition = {
      user: 'mock-user',
      topic: exercise.topic,
      exercise: exercise.statement,
      exerciseId: exercise.id,
      exerciseDefinition: exercise,
      gameId: selectedGameForSession.id,
      source: exercise.source,
      mode: networkManager.getState() === 'OFFLINE' ? 'offline' : 'online',
      date: new Date().toISOString(),
      result: 'pending',
      difficulty: exercise.difficulty,
    }
    sessionStorage.setItem('teko-juegos-session', JSON.stringify(session))
    navigate(`/juego/${selectedGameForSession.id}`)
  }

  const summaryTone = parseResult?.status === 'VALID'
    ? 'valid'
    : parseResult?.status === 'PARTIAL'
      ? 'partial'
      : parseResult?.status === 'UNSUPPORTED' ? 'unsupported' : 'idle'

  return (
    <section className="page-shell my-task-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">{t('task.personalized')}</p>
          <h2>{t('task.title')}</h2>
        </div>
        <Link to="/" className="secondary-button"><ArrowLeft size={16} />{t('nav.home')}</Link>
      </div>

      <div className="task-panel">
        <div className="task-panel__header">
          <div>
            <p className="eyebrow eyebrow--compact">{t('task.inputMode')}</p>
            <h3>{t('task.chooseInput')}</h3>
          </div>
        </div>

        <div className="task-input-grid">
          <button type="button" className={`task-mode ${selectedMode === 'text' ? 'is-selected' : ''}`} onClick={() => setSelectedMode('text')}>
            <FileText size={18} />{t('task.writeExercise')}
          </button>
          <button type="button" className={`task-mode ${selectedMode === 'image' ? 'is-selected' : ''}`} onClick={() => setSelectedMode('image')}>
            <Camera size={18} />{t('task.uploadPhoto')}
          </button>
        </div>

        {selectedMode === 'text' ? (
          <div className="task-entry task-entry--text">
            <label htmlFor="task-exercise" className="sr-only">{t('task.pasteExercise')}</label>
            <textarea
              id="task-exercise"
              value={exerciseText}
              onChange={(event) => {
                setExerciseText(event.target.value)
                setExerciseDefinition(null)
                setParseResult(null)
                setAnalysisState('idle')
              }}
              rows={7}
              placeholder={t('task.exercisePlaceholder')}
            />
            <div className="task-entry__footer">
              <span>{t('setup.characterCount', { count: exerciseText.length })}</span>
              <div className="inline-actions">
                <button type="button" className="primary-button" onClick={handleAnalyzeText}>
                  {analysisState === 'analyzing' ? <LoaderCircle size={16} className="spinner" /> : <Sparkles size={16} />}
                  {t('task.analyze')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="task-entry task-entry--image">
            <label className="upload-dropzone" htmlFor="task-image-upload">
              <input id="task-image-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageSelect} />
              <Upload size={18} /><span>{t('setup.imageDrop')}</span>
            </label>
            {previewUrl ? (
              <div className="image-preview">
                <img src={previewUrl} alt={t('setup.previewImageAlt')} />
                <div className="image-preview__meta"><ImageUp size={16} /><span>{imageName}</span></div>
              </div>
            ) : null}
            {imageFile ? (
              <>
                <label htmlFor="recognized-task-text">{t('task.recognizedText')}</label>
                <textarea
                  id="recognized-task-text"
                  value={exerciseText}
                  onChange={(event) => {
                    setExerciseText(event.target.value)
                    setExerciseDefinition(null)
                    setParseResult(null)
                    setAnalysisState('idle')
                  }}
                  rows={5}
                  placeholder={t('task.recognizedPlaceholder')}
                />
              </>
            ) : null}
            <div className="task-entry__footer">
              <span>{imageName || t('task.noImage')}</span>
              <div className="inline-actions">
                <button type="button" className="primary-button" onClick={handleAnalyzeImage} disabled={!imageFile || analysisState === 'analyzing'}>
                  {analysisState === 'analyzing' ? <LoaderCircle size={16} className="spinner" /> : <Wand2 size={16} />}
                  {t('task.analyzeImage')}
                </button>
                <button type="button" className="secondary-button" onClick={() => void analyzeTaskText(exerciseText, 'user-image')} disabled={!exerciseText.trim() || analysisState === 'analyzing'}>
                  {t('task.analyzeEditedText')}
                </button>
              </div>
            </div>
          </div>
        )}

        {analysisMessage ? <p className="task-analysis-message" role="status">{analysisMessage}</p> : null}

        {analysisState === 'ready' && parseResult ? (
          <div className={`analysis-result analysis-result--${summaryTone}`}>
            {parseResult.status === 'VALID' ? (
              <><CheckCircle2 size={18} /><div><strong>{t('task.resultValid', { topic: parseResult.topicLabel ?? '' })}</strong><p>{t(resultExplanationKeys[parseResult.detectedTopic ?? 'sin'])}</p></div></>
            ) : parseResult.status === 'PARTIAL' ? (
              <><Sparkles size={18} /><div><strong>{t('task.resultPartial')}</strong><p>{t('task.resultPartialHelp')}</p></div></>
            ) : (
              <><XCircle size={18} /><div><strong>{t('task.resultUnsupported')}</strong><p>{t('task.resultUnsupportedHelp')}</p></div></>
            )}
          </div>
        ) : null}

        {analysisState === 'ready' && parseResult ? (
          <div className="task-result-panel">
            <div className="task-result-panel__header">
              <div>
                <p className="eyebrow eyebrow--compact">{t('task.diagnosis')}</p>
                <h3>{parseResult.status === 'VALID' ? t('task.resultValid', { topic: parseResult.topicLabel ?? '' }) : t('task.preparingPractice')}</h3>
              </div>
              {parseResult.status !== 'UNSUPPORTED' ? (
                <span className="task-status-badge">{parseResult.status === 'VALID' ? t('task.detected') : t('task.partial')}</span>
              ) : <span className="task-status-badge task-status-badge--soft">{t('task.noDetection')}</span>}
            </div>
            <div className="task-summary-grid">
              <div className="summary-card"><span className="label">{t('common.topic')}</span><strong>{parseResult.topicLabel ?? t('task.topicUnknown')}</strong></div>
              <div className="summary-card"><span className="label">{t('task.data')}</span><strong>{parseResult.values.length ? parseResult.values.slice(0, 3).join(', ') : t('task.noNumbers')}</strong></div>
              <div className="summary-card"><span className="label">{t('task.mode')}</span><strong>{selectedMode === 'image' ? t('task.photo') : t('task.text')}</strong></div>
            </div>
            {!exerciseDefinition ? (
              <div className="manual-topic-picker">
                <label htmlFor="manual-topic">{t('task.chooseTopic')}</label>
                <select id="manual-topic" value={manualTopic} onChange={(event) => setManualTopic(event.target.value as keyof typeof topicLabels)}>
                  {topicOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
                <button type="button" className="secondary-button" onClick={() => void handleManualTopic()}>{t('task.useTopicContinue')}</button>
                <button type="button" className="secondary-button" onClick={() => void handleGenerateLocal()}>{t('task.generateLocal')}</button>
              </div>
            ) : null}
            {exerciseDefinition ? (
              <div className="task-resolved-exercise">
                <span className="label">{t('task.exerciseReady')}</span>
                <p>{translateExerciseCopy(exerciseDefinition, 'prompt', language, exerciseDefinition.statement)}</p>
                <span>{exerciseDefinition.source === 'ai' ? t('task.remoteValidated') : exerciseDefinition.source === 'teko' ? t('task.localPractice') : t('task.localValidated')}</span>
              </div>
            ) : null}
            {compatibleGames.length ? (
              <div className="recommendation-panel">
                <div className="recommendation-panel__header"><div><p className="eyebrow eyebrow--compact">{t('task.recommendedGame')}</p><h4>{t('task.readyToPlay')}</h4></div></div>
                <div className="game-recommendations">
                  {compatibleGames.map((game) => (
                    <button key={game.id} type="button" className={`recommendation-card ${activeGameId === game.id ? 'is-selected' : ''}`} onClick={() => setSelectedGameId(game.id)}>
                      <div className="recommendation-card__header">
                        <strong>{game.name}</strong>
                        {game.id === compatibleGames[0].id ? <span>{t('task.recommended')}</span> : null}
                      </div>
                      <p>{t(`games.${game.id}.description` as TranslationKey)}</p>
                      <span className={`difficulty-pill difficulty-pill--${game.difficulty}`}>{t(`difficulty.${game.difficulty}` as TranslationKey)}</span>
                    </button>
                  ))}
                </div>
                <button type="button" className="primary-button task-confirm-button" onClick={handleConfirm} disabled={!exerciseDefinition}><Play size={16} />{t('task.start')}</button>
              </div>
            ) : <button type="button" className="secondary-button" onClick={() => navigate('/mapa')}>{t('task.backToMap')}</button>}
          </div>
        ) : null}
      </div>
    </section>
  )
}
