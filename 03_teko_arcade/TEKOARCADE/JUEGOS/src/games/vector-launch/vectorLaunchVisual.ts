import type { VectorChallenge } from './vectorLaunchEngine'

export interface VectorPoint {
  x: number
  y: number
}

export interface VectorLaunchScene {
  origin: VectorPoint
  target: VectorPoint
  landing: VectorPoint
  horizontalProjection: VectorPoint
  scale: number
}

export function createVectorLaunchScene(challenge: VectorChallenge, travelRatio = 1): VectorLaunchScene {
  const maximumComponent = Math.max(challenge.horizontalComponent, challenge.verticalComponent, 1)
  const scale = Math.min(12, 230 / (maximumComponent * 1.4))
  const origin = { x: 48, y: 220 }
  const target = {
    x: origin.x + challenge.horizontalComponent * scale,
    y: origin.y - challenge.verticalComponent * scale,
  }
  const horizontalProjection = { x: target.x, y: origin.y }
  const ratio = Math.min(1.4, Math.max(0.15, travelRatio))
  const landing = {
    x: origin.x + (target.x - origin.x) * ratio,
    y: origin.y + (target.y - origin.y) * ratio,
  }

  return { origin, target, landing, horizontalProjection, scale }
}