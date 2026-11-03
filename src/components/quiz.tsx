"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowLeft, ArrowRight, Check, Clock, Flag, RotateCcw, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { domainName, type Bank, type Domains, type Question, type Scenario } from "@/lib/quiz-types"
import { scrollToTarget, usePin } from "@/components/smooth-scroll"
import { type Attempt, EMPTY_ATTEMPTS, EMPTY_RECORD, KEYS, useStored } from "@/lib/store"

type Mode = "practice" | "exam"
type Phase = "setup" | "running" | "results"

const LETTERS = "ABCDEFGH"

function Md({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "quiz-md [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.88em] [&_p]:my-0 [&_p+p]:mt-3",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Keep each scenario's questions together (in their current order), scenarios in order of first appearance.
function groupByScenario(list: Question[]) {
  const order = [...new Set(list.map((q) => q.scenario))]
  return order.flatMap((id) => list.filter((q) => q.scenario === id))
}

// Draw n questions with each domain's share set by its blueprint weight (largest remainder).
function drawByWeight(pool: Question[], domains: Domains, n: number) {
  const byDomain = new Map<string, Question[]>()
  for (const q of pool) if (q.domain) byDomain.set(q.domain, [...(byDomain.get(q.domain) ?? []), q])
  const ids = [...byDomain.keys()]
  const total = ids.reduce((s, d) => s + (domains[d]?.weight ?? 0), 0) || 1
  const exact = ids.map((d) => ({ d, x: (n * (domains[d]?.weight ?? 0)) / total }))
  const quota = new Map(exact.map(({ d, x }) => [d, Math.floor(x)]))
  let left = n - [...quota.values()].reduce((a, b) => a + b, 0)
  for (const { d } of [...exact].sort((a, b) => (b.x % 1) - (a.x % 1))) if (left-- > 0) quota.set(d, quota.get(d)! + 1)
  return ids.flatMap((d) => shuffle(byDomain.get(d)!).slice(0, quota.get(d)))
}

function isCorrect(q: Question, picked: number[] | undefined) {
  if (!picked || picked.length !== q.correct.length) return false
  return q.correct.every((c) => picked.includes(c))
}

// Kept outside the component: only ever called from event handlers.
const clock = () => Date.now()

function fmt(sec: number) {
  const m = Math.floor(Math.abs(sec) / 60)
  const s = Math.abs(sec) % 60
  return `${sec < 0 ? "-" : ""}${m}:${String(s).padStart(2, "0")}`
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string; hint?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-xl border p-4 text-left transition-colors",
            value === o.value ? "border-foreground ring-1 ring-foreground" : "hover:bg-muted/60"
          )}
        >
          <div className="font-heading font-medium">{o.label}</div>
          {o.hint && <div className="mt-1 text-sm text-muted-foreground">{o.hint}</div>}
        </button>
      ))}
    </div>
  )
}

export function Quiz({ bank, missedOnly = false }: { bank: Bank; missedOnly?: boolean }) {
  const [missed, setMissed] = useStored(KEYS.missed, EMPTY_RECORD)
  const [attempts, setAttempts] = useStored(KEYS.attempts, EMPTY_ATTEMPTS)

  const pool = useMemo(
    () => (missedOnly ? bank.questions.filter((q) => missed[q.id]) : bank.questions),
    [bank.questions, missed, missedOnly]
  )
  const domains = useMemo(() => {
    const ids = [...new Set(pool.map((q) => q.domain).filter(Boolean) as string[])]
    return ids.sort((a, b) => (bank.domains[b]?.weight ?? 0) - (bank.domains[a]?.weight ?? 0))
  }, [pool, bank.domains])

  const [phase, setPhase] = useState<Phase>("setup")
  const [mode, setMode] = useState<Mode>(bank.timeLimitMinutes && bank.timeLimitMinutes >= 60 ? "exam" : "practice")
  const [shuffled, setShuffled] = useState(true)
  const [domainFilter, setDomainFilter] = useState<string[]>([])
  const [timed, setTimed] = useState(true)

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number[]>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [index, setIndex] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [now, setNow] = useState(0)
  const [reviewWrongOnly, setReviewWrongOnly] = useState(true)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const start = (qs?: Question[]) => {
    let list = qs ?? pool.filter((q) => !domainFilter.length || (q.domain && domainFilter.includes(q.domain)))
    // A simulation sits a few whole scenarios, as the exam does.
    if (!qs && bank.pickScenarios && !missedOnly) {
      const drawn = new Set(
        shuffle(bank.scenarios ?? [])
          .slice(0, bank.pickScenarios)
          .map((s) => s.id)
      )
      list = list.filter((q) => q.scenario && drawn.has(q.scenario))
    }
    // A standalone-item exam draws its length from every domain, in blueprint proportion.
    if (!qs && bank.drawWeighted && !missedOnly) list = drawByWeight(list, bank.domains, bank.drawWeighted)
    if (shuffled) list = shuffle(list)
    list = groupByScenario(list)
    setQuestions(list)
    setAnswers({})
    setRevealed({})
    setFlags({})
    setIndex(0)
    setConfirmFinish(false)
    setStartedAt(clock())
    setNow(clock())
    setPhase("running")
  }

  useEffect(() => {
    if (phase !== "running") return
    const t = setInterval(() => setNow(clock()), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    // Only glide up when the top of the quiz is out of view.
    const el = topRef.current
    if (el && el.getBoundingClientRect().top < 0) scrollToTarget(el, { gap: 0 })
  }, [index, phase])

  usePin(headerRef, topRef, { enabled: phase === "running" })

  const q = questions[index]
  const picked = q ? (answers[q.id] ?? []) : []
  const isRevealed = q ? !!revealed[q.id] : false
  const elapsed = Math.floor((now - startedAt) / 1000)
  const limitSec =
    mode === "exam" && timed && bank.timeLimitMinutes
      ? Math.round((bank.timeLimitMinutes * 60 * questions.length) / Math.max(1, bank.drawWeighted ?? bank.questions.length))
      : null
  const remaining = limitSec != null ? limitSec - elapsed : null

  const toggle = useCallback(
    (i: number) => {
      if (!q || isRevealed || i >= q.options.length) return
      setAnswers((a) => {
        const cur = a[q.id] ?? []
        if (!q.multi) return { ...a, [q.id]: [i] }
        return { ...a, [q.id]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort() }
      })
    },
    [q, isRevealed]
  )

  const finish = useCallback(() => {
    const byDomain: Attempt["byDomain"] = {}
    let correct = 0
    const nextMissed = { ...missed }
    for (const qq of questions) {
      const ok = isCorrect(qq, answers[qq.id])
      if (ok) correct++
      const d = qq.domain ?? "general"
      byDomain[d] ??= { correct: 0, total: 0 }
      byDomain[d].total++
      if (ok) byDomain[d].correct++
      if (ok) delete nextMissed[qq.id]
      else nextMissed[qq.id] = true
    }
    setMissed(nextMissed)
    setAttempts([...attempts, { bankId: bank.key, date: Date.now(), mode, correct, total: questions.length, byDomain }])
    setPhase("results")
  }, [answers, attempts, bank.key, missed, mode, questions, setAttempts, setMissed])

  const next = useCallback(() => {
    if (index < questions.length - 1) setIndex(index + 1)
    else if (mode === "practice") finish()
    else setConfirmFinish(true)
  }, [finish, index, mode, questions.length])

  const primary = useCallback(() => {
    if (!q) return
    if (mode === "practice" && !isRevealed) {
      if (picked.length) setRevealed((r) => ({ ...r, [q.id]: true }))
      return
    }
    next()
  }, [q, mode, isRevealed, picked.length, next])

  useEffect(() => {
    if (phase !== "running") return
    const on = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (/^[1-8]$/.test(k)) toggle(Number(k) - 1)
      else if (/^[a-h]$/.test(k) && k !== "f") toggle(LETTERS.toLowerCase().indexOf(k))
      else if (k === "enter") {
        e.preventDefault()
        primary()
      } else if (k === "arrowright" && mode === "exam") next()
      else if (k === "arrowleft" && mode === "exam") setIndex((i) => Math.max(0, i - 1))
      else if (k === "f" && mode === "exam" && q) setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))
    }
    window.addEventListener("keydown", on)
    return () => window.removeEventListener("keydown", on)
  }, [phase, toggle, primary, next, mode, q])

  const bankAttempts = attempts
    .filter((a) => a.bankId === bank.key)
    .slice(-5)
    .reverse()
  const filteredCount =
    bank.drawWeighted && !missedOnly
      ? Math.min(bank.drawWeighted, pool.length)
      : bank.pickScenarios && !missedOnly
      ? Math.round((pool.length / Math.max(1, bank.scenarios?.length ?? 1)) * bank.pickScenarios)
      : pool.filter((qq) => !domainFilter.length || (qq.domain && domainFilter.includes(qq.domain))).length

  /* ---------------- setup ---------------- */
  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8 lg:py-14">
        <Link
          href={`/${bank.track}/quiz`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> All quizzes
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">{bank.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {missedOnly ? `${pool.length} questions you got wrong last time` : bank.subtitle}
        </p>

        {pool.length === 0 ? (
          <p className="mt-10 rounded-xl border p-6 text-muted-foreground">
            Nothing here yet. Questions you miss will show up here.
          </p>
        ) : (
          <div className="mt-10 space-y-8">
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Mode</h2>
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: "practice", label: "Practice", hint: "See the answer and explanation after each question." },
                  { value: "exam", label: "Exam", hint: "No feedback until the end. Flag and revisit questions." },
                ]}
              />
            </section>

            {domains.length > 1 && !bank.pickScenarios && !bank.drawWeighted && (
              <section>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  Domains {domainFilter.length ? `(${domainFilter.length})` : "(all)"}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {domains.map((d) => {
                    const on = domainFilter.includes(d)
                    return (
                      <button
                        key={d}
                        onClick={() => setDomainFilter((f) => (on ? f.filter((x) => x !== d) : [...f, d]))}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition-colors",
                          on ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {domainName(bank.domains, d)}{" "}
                        <span className="opacity-60">{pool.filter((qq) => qq.domain === d).length}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            <section className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={shuffled}
                  onChange={(e) => setShuffled(e.target.checked)}
                  className="size-4 accent-foreground"
                />
                Shuffle questions
              </label>
              {mode === "exam" && bank.timeLimitMinutes && (
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={timed}
                    onChange={(e) => setTimed(e.target.checked)}
                    className="size-4 accent-foreground"
                  />
                  Timer ({Math.round((bank.timeLimitMinutes * filteredCount) / Math.max(1, bank.drawWeighted ?? bank.questions.length))} min)
                </label>
              )}
            </section>

            <Button size="lg" className="h-11 w-full text-base" disabled={!filteredCount} onClick={() => start()}>
              Start · {filteredCount} questions
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Keys: <kbd>1–8</kbd> or <kbd>A–H</kbd> select · <kbd>Enter</kbd> check / next
              {mode === "exam" && (
                <>
                  {" "}
                  · <kbd>←</kbd> <kbd>→</kbd> move · <kbd>F</kbd> flag
                </>
              )}
            </p>

            {bankAttempts.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">Recent attempts</h2>
                <ul className="divide-y rounded-xl border text-sm">
                  {bankAttempts.map((a) => (
                    <li key={a.date} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-muted-foreground">
                        {new Date(a.date).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        · {a.mode}
                      </span>
                      <span className="font-medium tabular-nums">
                        {a.correct}/{a.total} · {Math.round((a.correct / a.total) * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    )
  }

  /* ---------------- results ---------------- */
  if (phase === "results") {
    const results = questions.map((qq) => ({ q: qq, ok: isCorrect(qq, answers[qq.id]) }))
    const correct = results.filter((r) => r.ok).length
    const pct = Math.round((correct / questions.length) * 100)
    const byDomain = new Map<string, { c: number; t: number }>()
    for (const r of results) {
      const d = r.q.domain ?? "general"
      const v = byDomain.get(d) ?? { c: 0, t: 0 }
      v.t++
      if (r.ok) v.c++
      byDomain.set(d, v)
    }
    const wrong = results.filter((r) => !r.ok).map((r) => r.q)
    const shown = reviewWrongOnly ? results.filter((r) => !r.ok) : results

    return (
      <div ref={topRef} className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:py-14">
        <Link
          href={`/${bank.track}/quiz`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> All quizzes
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{bank.title}</div>
            <div className="font-heading text-6xl font-bold tracking-tight tabular-nums">{pct}%</div>
            <div className="mt-1 text-muted-foreground">
              {correct} of {questions.length} correct · {fmt(elapsed)} elapsed
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {wrong.length > 0 && (
              <Button variant="outline" onClick={() => start(wrong)}>
                <RotateCcw /> Retry {wrong.length} wrong
              </Button>
            )}
            <Button onClick={() => setPhase("setup")}>New attempt</Button>
          </div>
        </div>

        {byDomain.size > 1 && (
          <section className="mt-10 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">By domain</h2>
            {[...byDomain.entries()]
              .sort((a, b) => (bank.domains[b[0]]?.weight ?? 0) - (bank.domains[a[0]]?.weight ?? 0))
              .map(([d, v]) => (
                <div key={d} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
                  <div className="text-sm">
                    {domainName(bank.domains, d)}
                    {bank.domains[d] && (
                      <span className="ml-2 text-xs text-muted-foreground">{bank.domains[d].weight}% of exam</span>
                    )}
                  </div>
                  <div className="text-sm font-medium tabular-nums">
                    {v.c}/{v.t}
                  </div>
                  <Progress value={(v.c / v.t) * 100} className="col-span-2" />
                </div>
              ))}
          </section>
        )}

        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">Review</h2>
            <div className="flex overflow-hidden rounded-md border text-sm">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setReviewWrongOnly(v)}
                  className={cn("px-3 py-1", reviewWrongOnly === v ? "bg-foreground text-background" : "text-muted-foreground")}
                >
                  {v ? `Incorrect (${wrong.length})` : `All (${results.length})`}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {shown.length === 0 && <p className="text-muted-foreground">Nothing wrong. Nice.</p>}
            {shown.map(({ q: qq, ok }) => (
              <QuestionReview
                key={qq.id}
                q={qq}
                picked={answers[qq.id] ?? []}
                ok={ok}
                number={questions.indexOf(qq) + 1}
                domain={domainName(bank.domains, qq.domain)}
                scenario={bank.scenarios?.find((s) => s.id === qq.scenario)?.title}
              />
            ))}
          </div>
        </section>
      </div>
    )
  }

  /* ---------------- running ---------------- */
  const answeredCount = questions.filter((qq) => (answers[qq.id] ?? []).length).length
  const correctNow = q && isRevealed ? isCorrect(q, picked) : null
  const scenario = q?.scenario ? bank.scenarios?.find((s) => s.id === q.scenario) : undefined
  // The real exam names no domain or objective; scenario questions and the simulation keep them for the review.
  const hideTopic = !!q?.scenario || !!bank.drawWeighted

  return (
    <div ref={topRef} className="mx-auto max-w-3xl px-4 py-6 sm:px-8 lg:py-10">
      {/* Pinning wraps the header in a pin-spacer; this outer div keeps that wrapper inside a node React owns,
          so leaving the running view removes it cleanly instead of failing in removeChild. */}
      <div>
        <div ref={headerRef} className="relative z-20 mb-8 border-b bg-background/90 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4 text-sm">
            <button onClick={() => setPhase("setup")} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
            <span className="font-medium tabular-nums">
              {index + 1} / {questions.length}
            </span>
            <span
              className={cn(
                "flex items-center gap-1 tabular-nums text-muted-foreground",
                remaining != null && remaining < 300 && "text-destructive"
              )}
            >
              <Clock className="size-3.5" />
              {remaining != null ? fmt(remaining) : fmt(elapsed)}
            </span>
          </div>
          <Progress value={((index + (isRevealed || mode === "exam" ? 1 : 0)) / questions.length) * 100} className="mt-3" />
        </div>
      </div>

      {q && (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* Scenario questions hide the domain, as the real exam does; it shows up in the review. */}
            {q.domain && !hideTopic && <Badge variant="secondary">{domainName(bank.domains, q.domain)}</Badge>}
            {q.multi && <Badge variant="outline">Select {q.correct.length}</Badge>}
            {flags[q.id] && (
              <Badge variant="outline">
                <Flag /> Flagged
              </Badge>
            )}
          </div>
          {scenario && <ScenarioCard scenario={scenario} />}
          <Md className="font-heading text-xl leading-snug font-medium sm:text-[1.4rem]">{q.prompt}</Md>
          {/* The objective would hint at the answer, so in exam-style sets it waits for the review. */}
          {q.objective && !hideTopic && <p className="mt-2 text-sm text-muted-foreground">{q.objective}</p>}

          <div className="mt-8 space-y-2.5">
            {q.options.map((opt, i) => {
              const sel = picked.includes(i)
              const isAns = q.correct.includes(i)
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  disabled={isRevealed}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    !isRevealed && (sel ? "border-foreground ring-1 ring-foreground" : "hover:bg-muted/60"),
                    isRevealed && isAns && "border-success ring-1 ring-success",
                    isRevealed && sel && !isAns && "border-destructive ring-1 ring-destructive",
                    isRevealed && !sel && !isAns && "opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center border text-xs font-medium",
                      q.multi ? "rounded-md" : "rounded-full",
                      sel && !isRevealed && "border-foreground bg-foreground text-background",
                      isRevealed && isAns && "border-success bg-success text-background",
                      isRevealed && sel && !isAns && "border-destructive bg-destructive text-background"
                    )}
                  >
                    {isRevealed && isAns ? (
                      <Check className="size-3.5" />
                    ) : isRevealed && sel ? (
                      <X className="size-3.5" />
                    ) : (
                      LETTERS[i]
                    )}
                  </span>
                  <Md className="pt-0.5 leading-relaxed">{opt}</Md>
                </button>
              )
            })}
          </div>

          {isRevealed && (
            <div className="mt-6 rounded-xl border bg-muted/40 p-5">
              <div className={cn("mb-2 font-heading font-semibold", correctNow ? "text-success" : "text-destructive")}>
                {correctNow ? "Correct" : `Incorrect · answer: ${q.correct.map((c) => LETTERS[c]).join(", ")}`}
              </div>
              <Md className="leading-relaxed">{q.explanation}</Md>
              <References refs={q.references} />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {mode === "exam" ? (
              <div className="flex gap-2">
                <Button variant="outline" size="lg" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                  <ArrowLeft /> Prev
                </Button>
                <Button variant="ghost" size="lg" onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}>
                  <Flag className={cn(flags[q.id] && "fill-current")} /> {flags[q.id] ? "Unflag" : "Flag"}
                </Button>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{q.multi ? `Choose ${q.correct.length}` : "Choose one"}</span>
            )}
            <Button size="lg" className="px-5" onClick={primary} disabled={mode === "practice" && !isRevealed && !picked.length}>
              {mode === "practice" && !isRevealed ? (
                "Check"
              ) : index === questions.length - 1 ? (
                "Finish"
              ) : (
                <>
                  Next <ArrowRight />
                </>
              )}
            </Button>
          </div>

          {mode === "exam" && (
            <div className="mt-10 border-t pt-6">
              <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {answeredCount} of {questions.length} answered
                </span>
                <Button variant="outline" size="sm" onClick={() => setConfirmFinish(true)}>
                  Finish exam
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {questions.map((qq, i) => (
                  <button
                    key={qq.id}
                    onClick={() => setIndex(i)}
                    className={cn(
                      "relative size-8 rounded-md border text-xs tabular-nums transition-colors",
                      i === index && "ring-2 ring-foreground",
                      (answers[qq.id] ?? []).length ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {i + 1}
                    {flags[qq.id] && (
                      <span className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-background bg-destructive" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {confirmFinish &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setConfirmFinish(false)}
          >
            <div className="w-full max-w-sm rounded-xl border bg-background p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-heading text-lg font-semibold">Finish the exam?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {questions.length - answeredCount > 0
                  ? `${questions.length - answeredCount} unanswered questions will be marked wrong.`
                  : "All questions are answered."}
                {Object.values(flags).filter(Boolean).length > 0 &&
                  ` ${Object.values(flags).filter(Boolean).length} still flagged.`}
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmFinish(false)}>
                  Keep going
                </Button>
                <Button onClick={finish}>Finish</Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

function References({ refs }: { refs?: string[] }) {
  const links = refs?.filter((r) => /^https?:/.test(r))
  if (!links?.length) return null
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {links.map((r) => (
        <a key={r} href={r} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
          {r.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60)}
        </a>
      ))}
    </div>
  )
}

// The system every question in a scenario is set in, kept above the question like the exam does.
function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <div className="mb-6 border-l-2 border-foreground/20 pl-4">
      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Scenario · {scenario.title}</div>
      <Md className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">{scenario.setup}</Md>
    </div>
  )
}

function QuestionReview({
  q,
  picked,
  ok,
  number,
  domain,
  scenario,
}: {
  q: Question
  picked: number[]
  ok: boolean
  number: number
  domain: string
  scenario?: string
}) {
  return (
    <div className="rounded-xl border p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className={cn("font-semibold", ok ? "text-success" : "text-destructive")}>{ok ? "Correct" : "Incorrect"}</span>
        <span>· Q{number}</span>
        {scenario && <span>· {scenario}</span>}
        {q.domain && <span>· {domain}</span>}
      </div>
      <Md className="font-heading font-medium leading-snug">{q.prompt}</Md>
      <ul className="mt-4 space-y-1.5 text-sm">
        {q.options.map((o, i) => {
          const isAns = q.correct.includes(i)
          const sel = picked.includes(i)
          return (
            <li
              key={i}
              className={cn("flex gap-2 rounded-md px-2 py-1.5", isAns && "bg-success/10", sel && !isAns && "bg-destructive/10")}
            >
              <span className="w-4 shrink-0 font-medium">{LETTERS[i]}</span>
              <Md className="flex-1">{o}</Md>
              {isAns && <Check className="size-4 shrink-0 text-success" />}
              {sel && !isAns && <X className="size-4 shrink-0 text-destructive" />}
            </li>
          )
        })}
      </ul>
      <Md className="mt-4 border-t pt-3 text-sm leading-relaxed text-muted-foreground">{q.explanation}</Md>
      <References refs={q.references} />
    </div>
  )
}
