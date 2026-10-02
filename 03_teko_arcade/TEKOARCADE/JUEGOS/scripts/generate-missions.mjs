import { readFileSync } from 'node:fs'
import { generateLocalMissions } from '../src/services/missionEngine.ts'

const inputPath = process.argv[2]
if (!inputPath?.trim() && process.stdin.isTTY) {
  console.error('Uso: npm run missions:generate -- <progress.json | JSON>')
  process.exitCode = 1
} else {
  const input = !inputPath?.trim()
    ? readFileSync(0, 'utf8')
    : inputPath.trimStart().startsWith('{')
      ? inputPath
      : readFileSync(inputPath, 'utf8')
  const progress = JSON.parse(input)
  process.stdout.write(`${JSON.stringify(generateLocalMissions(progress), null, 2)}\n`)
}