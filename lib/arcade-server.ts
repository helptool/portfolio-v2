import "server-only"
import { createHmac, randomBytes } from "crypto"

/**
 * Per-game score rules. Used to reject obviously fabricated submissions.
 * - maxScorePerSecond caps the score rate. Above this = bypass attempt.
 * - minDuration is a soft floor to reject instant-finish submissions.
 * - maxDuration caps runaway sessions.
 */
export const GAME_RULES = {
  "rune-chase": { maxScorePerSecond: 5, minDurationMs: 6_000, maxDurationMs: 120_000, fixedDurationSec: 60 },
  "glyph-reflex": { maxScorePerSecond: 12, minDurationMs: 5_000, maxDurationMs: 90_000, fixedDurationSec: 30 },
  "memory-pulse": { maxScorePerSecond: 2, minDurationMs: 2_500, maxDurationMs: 300_000, fixedDurationSec: null as number | null },
  "rune-match": { maxScorePerSecond: 8, minDurationMs: 4_000, maxDurationMs: 180_000, fixedDurationSec: null as number | null },
  "sigil-trace": { maxScorePerSecond: 60, minDurationMs: 1_800, maxDurationMs: 30_000, fixedDurationSec: null as number | null },
  "sigil-forge": { maxScorePerSecond: 12, minDurationMs: 4_000, maxDurationMs: 180_000, fixedDurationSec: 90 },
} as const

export type GameId = keyof typeof GAME_RULES

type Session = {
  id: string
  game: GameId
  startedAt: number
  submitted: boolean
  // A salt bound into the HMAC. Rotated per-session.
  salt: string
}

type ScoreRow = {
  id: string
  game: GameId
  name: string
  score: number
  stats: Record<string, string | number>
  createdAt: number
}

// Singleton stores. Attached to globalThis so hot-reload in dev keeps them.
declare global {
  // eslint-disable-next-line no-var
  var __vaish_arcade__: {
    sessions: Map<string, Session>
    leaderboard: Map<GameId, ScoreRow[]>
    secret: string
  } | undefined
}

function store() {
  if (!globalThis.__vaish_arcade__) {
    globalThis.__vaish_arcade__ = {
      sessions: new Map(),
      leaderboard: new Map(),
      secret: process.env.ARCADE_SECRET || randomBytes(32).toString("hex"),
    }
  }
  return globalThis.__vaish_arcade__
}

function sign(payload: string) {
  const s = store()
  return createHmac("sha256", s.secret).update(payload).digest("hex")
}

function cleanupOldSessions() {
  const s = store()
  const now = Date.now()
  for (const [id, sess] of s.sessions) {
    if (sess.submitted || now - sess.startedAt > 30 * 60 * 1000) s.sessions.delete(id)
  }
}

export function openSession(game: GameId) {
  cleanupOldSessions()
  const s = store()
  const id = randomBytes(12).toString("hex")
  const salt = randomBytes(8).toString("hex")
  const startedAt = Date.now()
  s.sessions.set(id, { id, game, startedAt, submitted: false, salt })
  const token = sign(`${id}|${game}|${startedAt}|${salt}`)
  return { sessionId: id, token, startedAt, game }
}

function sanitizeName(input: string) {
  const trimmed = (input || "").trim().slice(0, 20)
  // Keep letters, digits, spaces, hyphens, underscores and a few safe unicode marks
  const safe = trimmed.replace(/[^\p{L}\p{N}\p{M} _.\-]/gu, "")
  return safe || "Wanderer"
}

function sanitizeStats(stats: Record<string, unknown> | undefined) {
  const out: Record<string, string | number> = {}
  if (!stats) return out
  let entries = 0
  for (const [k, v] of Object.entries(stats)) {
    if (entries >= 6) break
    const key = String(k).slice(0, 24)
    if (typeof v === "number" && Number.isFinite(v)) out[key] = v
    else if (typeof v === "string") out[key] = v.slice(0, 48)
    entries++
  }
  return out
}

export type SubmissionResult =
  | { ok: true; rank: number | null; top: ScoreRow[] }
  | { ok: false; reason: string }

export function submit(opts: {
  sessionId: string
  token: string
  game: GameId
  score: number
  name: string
  durationMs?: number
  stats?: Record<string, unknown>
}): SubmissionResult {
  const s = store()
  const sess = s.sessions.get(opts.sessionId)
  if (!sess) return { ok: false, reason: "Session missing or expired." }
  if (sess.submitted) return { ok: false, reason: "Session already submitted." }
  if (sess.game !== opts.game) return { ok: false, reason: "Session / game mismatch." }

  const expectedToken = sign(`${sess.id}|${sess.game}|${sess.startedAt}|${sess.salt}`)
  if (expectedToken !== opts.token) return { ok: false, reason: "Token invalid." }

  const rules = GAME_RULES[sess.game]
  const now = Date.now()
  const durationMs = Math.max(0, Math.min(opts.durationMs ?? now - sess.startedAt, now - sess.startedAt + 2000))
  if (durationMs < rules.minDurationMs) return { ok: false, reason: "Duration too short." }
  if (durationMs > rules.maxDurationMs) return { ok: false, reason: "Duration out of range." }

  if (!Number.isFinite(opts.score) || opts.score < 0 || opts.score > 100_000) {
    return { ok: false, reason: "Score out of range." }
  }

  const durationSec = durationMs / 1000
  const maxExpected = rules.maxScorePerSecond * Math.max(durationSec, 1)
  if (opts.score > maxExpected * 1.25) return { ok: false, reason: "Score rate not plausible." }

  const name = sanitizeName(opts.name)
  const row: ScoreRow = {
    id: randomBytes(6).toString("hex"),
    game: sess.game,
    name,
    score: Math.floor(opts.score),
    stats: sanitizeStats(opts.stats),
    createdAt: now,
  }

  sess.submitted = true

  const existing = s.leaderboard.get(sess.game) ?? []
  existing.push(row)
  existing.sort((a, b) => b.score - a.score || a.createdAt - b.createdAt)
  const trimmed = existing.slice(0, 20)
  s.leaderboard.set(sess.game, trimmed)

  const rank = trimmed.findIndex((r) => r.id === row.id)
  return { ok: true, rank: rank >= 0 ? rank + 1 : null, top: trimmed }
}

export function getTop(game: GameId): ScoreRow[] {
  return store().leaderboard.get(game) ?? []
}

export function getAllTop(): Record<GameId, ScoreRow[]> {
  const out = {} as Record<GameId, ScoreRow[]>
  for (const g of Object.keys(GAME_RULES) as GameId[]) {
    out[g] = getTop(g)
  }
  return out
}
