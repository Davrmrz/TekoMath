import type { NetworkHealth, NetworkState } from '../types'

export interface NetworkManagerOptions {
  healthUrl?: string
  timeoutMs?: number
  goodLatencyMs?: number
  recentFailureWindowMs?: number
  maxRecentFailures?: number
  fetcher?: (url: string, init: { signal: AbortSignal }) => Promise<{ ok: boolean }>
  isOnline?: () => boolean
  now?: () => number
}

const DEFAULT_TIMEOUT_MS = 1800
const DEFAULT_GOOD_LATENCY_MS = 900
const DEFAULT_RECENT_FAILURE_WINDOW_MS = 30_000
const DEFAULT_MAX_RECENT_FAILURES = 2

export class NetworkManager {
  private currentState: NetworkState = 'OFFLINE'
  private failureTimes: number[] = []
  private lastLatency: number | null = null
  private apiAvailable = false
  private listeners = new Set<(state: NetworkState) => void>()
  private readonly handleOnline = () => this.refreshFromConnectivity()
  private readonly handleOffline = () => this.setState('OFFLINE')
  private readonly healthUrl: string | undefined
  private readonly timeoutMs: number
  private readonly goodLatencyMs: number
  private readonly recentFailureWindowMs: number
  private readonly maxRecentFailures: number
  private readonly fetcher: NonNullable<NetworkManagerOptions['fetcher']>
  private readonly isOnline: () => boolean
  private readonly now: () => number

  constructor(options: NetworkManagerOptions = {}) {
    this.healthUrl = options.healthUrl?.trim() || undefined
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.goodLatencyMs = options.goodLatencyMs ?? DEFAULT_GOOD_LATENCY_MS
    this.recentFailureWindowMs = options.recentFailureWindowMs ?? DEFAULT_RECENT_FAILURE_WINDOW_MS
    this.maxRecentFailures = options.maxRecentFailures ?? DEFAULT_MAX_RECENT_FAILURES
    this.fetcher = options.fetcher ?? ((url, init) => fetch(url, init))
    this.isOnline = options.isOnline ?? (() => typeof navigator !== 'undefined' && navigator.onLine)
    this.now = options.now ?? (() => Date.now())
    this.refreshFromConnectivity()
  }

  getState(): NetworkState {
    return this.currentState
  }

  subscribe(callback: (state: NetworkState) => void): () => void {
    if (this.listeners.size === 0) {
      this.refreshFromConnectivity()
      if (typeof window !== 'undefined') {
        window.addEventListener('online', this.handleOnline)
        window.addEventListener('offline', this.handleOffline)
      }
    }

    this.listeners.add(callback)

    return () => {
      this.listeners.delete(callback)
      if (this.listeners.size === 0 && typeof window !== 'undefined') {
        window.removeEventListener('online', this.handleOnline)
        window.removeEventListener('offline', this.handleOffline)
      }
    }
  }

  async healthCheck(): Promise<NetworkHealth> {
    this.pruneFailures()
    if (!this.isOnline()) {
      this.apiAvailable = false
      this.lastLatency = null
      this.setState('OFFLINE')
      return this.snapshot()
    }

    if (!this.healthUrl) {
      this.apiAvailable = false
      this.lastLatency = null
      this.setState('ONLINE_POOR')
      return this.snapshot()
    }

    const controller = new AbortController()
    const startedAt = this.now()
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort()
        reject(new Error('Network health check timed out.'))
      }, this.timeoutMs)
    })

    try {
      const response = await Promise.race([
        this.fetcher(this.healthUrl, { signal: controller.signal }),
        timeout,
      ])
      if (!response.ok) throw new Error('Network health check failed.')

      this.lastLatency = Math.max(0, this.now() - startedAt)
      this.apiAvailable = true
      this.pruneFailures()
      const isGood = this.lastLatency <= this.goodLatencyMs
        && this.failureTimes.length < this.maxRecentFailures
      this.setState(isGood ? 'ONLINE_GOOD' : 'ONLINE_POOR')
    } catch {
      this.recordFailure()
      this.apiAvailable = false
      this.lastLatency = null
      this.setState(this.isOnline() ? 'ONLINE_POOR' : 'OFFLINE')
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      controller.abort()
    }

    return this.snapshot()
  }

  markFailure(): void {
    this.recordFailure()
    this.setState(this.isOnline() ? 'ONLINE_POOR' : 'OFFLINE')
  }

  markSuccess(latencyMs?: number): void {
    this.pruneFailures()
    if (Number.isFinite(latencyMs)) this.lastLatency = Math.max(0, latencyMs as number)
    this.apiAvailable = true
    if (!this.isOnline()) {
      this.apiAvailable = false
      this.setState('OFFLINE')
      return
    }
    const isGood = this.lastLatency !== null
      && this.lastLatency <= this.goodLatencyMs
      && this.failureTimes.length < this.maxRecentFailures
    this.setState(isGood ? 'ONLINE_GOOD' : 'ONLINE_POOR')
  }

  getHealth(): NetworkHealth {
    this.pruneFailures()
    return this.snapshot()
  }

  private refreshFromConnectivity(): void {
    if (!this.isOnline()) {
      this.apiAvailable = false
      this.setState('OFFLINE')
      return
    }
    this.setState(this.apiAvailable ? this.deriveOnlineState() : 'ONLINE_POOR')
  }

  private deriveOnlineState(): NetworkState {
    return this.lastLatency !== null
      && this.lastLatency <= this.goodLatencyMs
      && this.failureTimes.length < this.maxRecentFailures
      ? 'ONLINE_GOOD'
      : 'ONLINE_POOR'
  }

  private recordFailure(): void {
    this.failureTimes.push(this.now())
    this.pruneFailures()
  }

  private pruneFailures(): void {
    const cutoff = this.now() - this.recentFailureWindowMs
    this.failureTimes = this.failureTimes.filter((time) => time >= cutoff)
  }

  private snapshot(): NetworkHealth {
    const online = this.isOnline()
    return {
      state: online ? this.currentState : 'OFFLINE',
      online,
      latency: this.lastLatency,
      apiAvailable: online && this.apiAvailable,
      recentFailures: this.failureTimes.length,
    }
  }

  private setState(nextState: NetworkState): void {
    if (this.currentState === nextState) return
    this.currentState = nextState
    this.notifyListeners(nextState)
  }

  private notifyListeners(state: NetworkState): void {
    this.listeners.forEach((listener) => listener(state))
  }
}

const configuredHealthUrl = import.meta.env?.VITE_NETWORK_HEALTH_URL

export const networkManager = new NetworkManager({ healthUrl: configuredHealthUrl })
