"use client"

import { EMPTY_ATTEMPTS, EMPTY_RECORD, KEYS, useStored } from "@/lib/store"

export function ReadCount({ prefix, slugs }: { prefix: string; slugs: string[] }) {
  const [read] = useStored(KEYS.read, EMPTY_RECORD)
  const done = slugs.filter((s) => read[`${prefix}/${s}`]).length
  return (
    <span className="tabular-nums">
      {done} of {slugs.length}
    </span>
  )
}

export function BestScore({ bankId, fallback = "Not taken" }: { bankId: string; fallback?: string }) {
  const [attempts] = useStored(KEYS.attempts, EMPTY_ATTEMPTS)
  const mine = attempts.filter((a) => a.bankId === bankId)
  if (!mine.length) return <span>{fallback}</span>
  const best = Math.max(...mine.map((a) => Math.round((a.correct / a.total) * 100)))
  const last = mine[mine.length - 1]
  return (
    <span className="tabular-nums">
      {Math.round((last.correct / last.total) * 100)}% last · {best}% best
    </span>
  )
}

export function MissedCount({ ids }: { ids: string[] }) {
  const [missed] = useStored(KEYS.missed, EMPTY_RECORD)
  const n = ids.filter((id) => missed[id]).length
  return <span className="tabular-nums">{n ? `${n} to review` : "None yet"}</span>
}

export function ResetProgress() {
  return (
    <button
      className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
      onClick={() => {
        if (!confirm("Clear reading progress, quiz history and missed questions?")) return
        for (const k of [KEYS.read, KEYS.attempts, KEYS.missed]) localStorage.removeItem(k)
        window.dispatchEvent(new Event("ccdv-store"))
      }}
    >
      Reset all progress
    </button>
  )
}
