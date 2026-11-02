"use client"

import { useCallback, useSyncExternalStore } from "react"

// Tiny localStorage-backed store shared across components (and tabs).
const EVENT = "ccdv-store"
const cache = new Map<string, { raw: string | null; value: unknown }>()

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(key)
  } catch {
    return fallback
  }
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value as T
  let value: T = fallback
  if (raw != null) {
    try {
      value = JSON.parse(raw) as T
    } catch {}
  }
  cache.set(key, { raw, value })
  return value
}

export function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener("storage", cb)
  }
}

export function useStored<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback
  )
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read(key, fallback)
      write(key, typeof next === "function" ? (next as (p: T) => T)(prev) : next)
    },
    // fallback is expected to be a stable literal per key
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  )
  return [value, set] as const
}

/* ---------- typed keys ---------- */

export type Attempt = {
  bankId: string
  date: number
  mode: "practice" | "exam"
  correct: number
  total: number
  byDomain: Record<string, { correct: number; total: number }>
}

export const KEYS = {
  read: "ccdv:read", // Record<"book/slug", true>
  attempts: "ccdv:attempts", // Attempt[]
  missed: "ccdv:missed", // Record<questionId, true>
  reader: "ccdv:reader", // ReaderPrefs
} as const

// Attempts saved before the app had tracks all belong to CCDV-F.
export function migrateAttempts() {
  try {
    const raw = localStorage.getItem(KEYS.attempts)
    if (!raw) return
    const list = JSON.parse(raw) as Attempt[]
    const legacy = (a: Attempt) => !a.bankId.includes("/") && !a.bankId.startsWith("lesson-")
    if (!list.some(legacy)) return
    localStorage.setItem(KEYS.attempts, JSON.stringify(list.map((a) => (legacy(a) ? { ...a, bankId: `ccdv-f/${a.bankId}` } : a))))
    window.dispatchEvent(new Event(EVENT))
  } catch {}
}

export const THEMES = [
  { id: "light", label: "Light", bg: "#ffffff", fg: "#000000", dark: false },
  { id: "paper", label: "Paper", bg: "#faf7f0", fg: "#1f1b16", dark: false },
  { id: "sepia", label: "Sepia", bg: "#f4ecd8", fg: "#3d2f1f", dark: false },
  { id: "green", label: "Green", bg: "#e7efdf", fg: "#1e2a1b", dark: false },
  { id: "dusk", label: "Dusk", bg: "#1f2023", fg: "#e6e4df", dark: true },
  { id: "dark", label: "Dark", bg: "#000000", fg: "#ffffff", dark: true },
] as const
export type ThemeId = (typeof THEMES)[number]["id"]

export const SIZES = [14, 15, 16, 17, 18, 19, 20, 22, 24, 26] as const
export const LEADINGS = { compact: 1.55, normal: 1.75, relaxed: 2 } as const
export const WIDTHS = { narrow: "60ch", normal: "70ch", wide: "82ch" } as const

export type ReaderPrefs = {
  theme: ThemeId
  size: number // index into SIZES
  font: "onest" | "hanken"
  leading: keyof typeof LEADINGS
  width: keyof typeof WIDTHS
  emphasis: boolean
}
export const DEFAULT_READER: ReaderPrefs = {
  theme: "light",
  size: 3,
  font: "onest",
  leading: "normal",
  width: "normal",
  emphasis: true,
}

// Fills gaps from older saved prefs (e.g. size used to be "s" | "m" | "l").
export function normalizePrefs(p: Partial<ReaderPrefs> | null | undefined): ReaderPrefs {
  const n = { ...DEFAULT_READER, ...(p ?? {}) }
  if (typeof n.size !== "number" || !SIZES[n.size]) n.size = DEFAULT_READER.size
  if (!THEMES.some((t) => t.id === n.theme)) n.theme = DEFAULT_READER.theme
  if (!(n.leading in LEADINGS)) n.leading = DEFAULT_READER.leading
  if (!(n.width in WIDTHS)) n.width = DEFAULT_READER.width
  return n
}

export function applyPrefs(p: ReaderPrefs) {
  const h = document.documentElement
  const theme = THEMES.find((t) => t.id === p.theme) ?? THEMES[0]
  h.dataset.theme = theme.id
  h.classList.toggle("dark", theme.dark)
  h.dataset.emphasis = p.emphasis ? "on" : "off"
  h.style.setProperty("--reader-size", `${SIZES[p.size]}px`)
  h.style.setProperty("--reader-leading", String(LEADINGS[p.leading]))
  h.style.setProperty("--reader-width", WIDTHS[p.width])
  h.style.setProperty("--reader-font", p.font === "hanken" ? "var(--font-heading)" : "var(--font-sans)")
}
export const EMPTY_RECORD: Record<string, true> = {}
export const EMPTY_ATTEMPTS: Attempt[] = []
