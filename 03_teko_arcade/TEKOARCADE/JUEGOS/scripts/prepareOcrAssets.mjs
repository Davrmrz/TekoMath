import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const assetCopies = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'public/tesseract/worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', 'public/tesseract/tesseract-core-lstm.wasm.js'],
  ['node_modules/@tesseract.js-data/spa/4.0.0/spa.traineddata.gz', 'public/tesseract/lang/spa.traineddata.gz'],
]

for (const [source, destination] of assetCopies) {
  const output = resolve(projectRoot, destination)
  await mkdir(dirname(output), { recursive: true })
  await copyFile(resolve(projectRoot, source), output)
}

console.info('Prepared local Spanish OCR assets.')