import { createWorker, OEM } from 'tesseract.js'

interface OcrWorker {
  recognize(image: Blob): Promise<{ data: { text: string } }>
  terminate(): Promise<unknown>
}

export interface ImageTextRecognitionOptions {
  workerFactory?: () => Promise<OcrWorker>
}

let workerPromise: Promise<OcrWorker> | null = null

export async function recognizeImageText(
  image: Blob,
  options: ImageTextRecognitionOptions = {},
): Promise<string> {
  if (image.size === 0 || image.size > 12 * 1024 * 1024) {
    throw new Error('Image size is not supported for text recognition.')
  }
  const worker = await getWorker(options.workerFactory)
  const result = await worker.recognize(image)
  return result.data.text.normalize('NFC').replace(/\r\n?/g, '\n').trim()
}

export async function terminateImageTextRecognition(): Promise<void> {
  if (!workerPromise) return
  const currentWorker = await workerPromise.catch(() => null)
  workerPromise = null
  await currentWorker?.terminate()
}

async function getWorker(factory?: ImageTextRecognitionOptions['workerFactory']): Promise<OcrWorker> {
  if (!workerPromise) {
    workerPromise = (factory ?? createSpanishWorker)().catch((error: unknown) => {
      workerPromise = null
      throw error
    })
  }
  return workerPromise
}

function createSpanishWorker(): Promise<OcrWorker> {
  const baseUrl = import.meta.env.BASE_URL
  const assetRoot = `${baseUrl.replace(/\/$/, '')}/tesseract`
  return createWorker('spa', OEM.LSTM_ONLY, {
    workerPath: `${assetRoot}/worker.min.js`,
    corePath: `${assetRoot}/tesseract-core-lstm.wasm.js`,
    langPath: `${assetRoot}/lang`,
    gzip: true,
    logger: () => undefined,
  })
}