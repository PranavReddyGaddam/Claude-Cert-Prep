"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollSmoother } from "gsap/ScrollSmoother"
import { Check, CornerDownLeft, Search } from "lucide-react"
import { SiClaude } from "react-icons/si"
import { cn } from "@/lib/utils"
import { EMPTY_RECORD, KEYS, migrateAttempts, useStored } from "@/lib/store"
import { TRACKS, trackMeta } from "@/lib/tracks"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SettingsPanel } from "@/components/reader-settings"
import { SmoothScroll } from "@/components/smooth-scroll"
import { ResetProgress } from "@/components/stats"

export type NavTrack = {
  id: string
  books: { id: string; title: string; docs: { slug: string; title: string; sections: { id: string; text: string }[] }[] }[]
  banks: { id: string; title: string; subtitle: string }[]
}

function ProgressButton({ className }: { className: string }) {
  return (
    <Popover>
      <PopoverTrigger render={<button className={className}>Progress</button>} />
      <PopoverContent align="end" className="w-72 space-y-3 text-sm">
        <p className="leading-relaxed text-muted-foreground">
          Chapters read, quiz scores and missed questions are saved in this browser only, for every certification.
        </p>
        <ResetProgress />
      </PopoverContent>
    </Popover>
  )
}

function SettingsButton() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Theme and text settings">
            <span className="font-heading text-[15px] font-semibold tracking-tight">Aa</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <SettingsPanel />
      </PopoverContent>
    </Popover>
  )
}

/* ---------------- command palette ---------------- */

type Item = { key: string; group: string; label: string; hint?: string; href: string; done?: boolean }

const PER_GROUP = 6

// "Chapter 3: Messages, ..." -> "Messages, ..."
function cleanTitle(t: string) {
  return t.replace(/^(?:Chapter\s+)?\d+[:.]\s*/i, "")
}

// "tool_choice", "tool-choice" and "tool choice" all match each other.
function norm(s: string) {
  return s.toLowerCase().replace(/[_\-–—/]+/g, " ")
}

function rank(label: string, q: string) {
  const l = norm(label)
  if (l.startsWith(q)) return 0
  if (l.includes(" " + q)) return 1
  return 2
}

function CommandPalette({ tracks, trackId, onClose }: { tracks: NavTrack[]; trackId?: string; onClose: () => void }) {
  const router = useRouter()
  const [read] = useStored(KEYS.read, EMPTY_RECORD)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  const track = tracks.find((t) => t.id === trackId)
  const meta = trackMeta(trackId)

  const items = useMemo(() => {
    const docItems = (t: NavTrack, group: (book: string) => string) =>
      t.books.flatMap((b) =>
        b.docs.map((d): Item => ({
          key: `${t.id}/${b.id}/${d.slug}`,
          group: group(b.title),
          label: cleanTitle(d.title),
          hint: b.id === "lessons" ? `Lesson ${Number(d.slug.slice(0, 2))}` : undefined,
          href: `/${t.id}/read/${b.id}/${d.slug}`,
          done: !!read[`${b.id}/${d.slug}`],
        }))
      )
    const practice = (t: NavTrack): Item[] => [
      ...t.banks.map((b) => ({
        key: `${t.id}/q/${b.id}`,
        group: "Practice",
        label: b.title,
        hint: b.subtitle,
        href: `/${t.id}/quiz/${b.id}`,
      })),
      { key: `${t.id}/q/missed`, group: "Practice", label: "Questions you missed", href: `/${t.id}/quiz/missed` },
    ]
    // Section headings say what a chapter covers better than its title does.
    const sectionItems = (t: NavTrack): Item[] =>
      t.books.flatMap((b) =>
        b.docs.flatMap((d) =>
          d.sections.map((sec) => ({
            key: `${t.id}/${b.id}/${d.slug}#${sec.id}`,
            group: "Sections",
            label: sec.text,
            hint: cleanTitle(d.title),
            href: `/${t.id}/read/${b.id}/${d.slug}#${sec.id}`,
          }))
        )
      )
    const certs: Item[] = TRACKS.filter((t) => t.id !== trackId).map((t) => ({
      key: `cert/${t.id}`,
      group: "Certifications",
      label: t.credential,
      hint: t.available ? t.code : "Soon",
      href: `/${t.id}`,
    }))

    const q = norm(query).trim()
    if (!q) {
      if (!track || !meta) return certs
      const out: Item[] = []
      for (const b of track.books) {
        const next = b.docs.find((d) => !read[`${b.id}/${d.slug}`]) ?? b.docs[0]
        out.push({
          key: `continue/${b.id}`,
          group: "Continue reading",
          label: cleanTitle(next.title),
          hint: b.title,
          href: `/${track.id}/read/${b.id}/${next.slug}`,
        })
      }
      out.push(
        { key: "overview", group: meta.code, label: "Overview", href: `/${track.id}` },
        { key: "practice", group: meta.code, label: "All practice", href: `/${track.id}/quiz` },
        ...practice(track).filter((i) => /simulation|diagnostic|mock|missed/i.test(i.label))
      )
      return [...out, ...certs]
    }

    // Search: this certification first, then everything else.
    const tokens = q.split(/\s+/)
    const match = (i: Item) => {
      const text = norm(i.group === "Sections" ? i.label : `${i.label} ${i.hint ?? ""} ${i.group}`)
      return tokens.every((t) => text.includes(t))
    }
    const byRank = (list: Item[]) => list.filter(match).sort((a, b) => rank(a.label, tokens[0]) - rank(b.label, tokens[0]))
    const tiers: [Item[], number][] = []
    if (track) tiers.push([byRank([...docItems(track, (b) => b), ...practice(track), ...sectionItems(track)]), PER_GROUP])
    const others = tracks.filter((t) => t.id !== trackId).flatMap((t) => docItems(t, (b) => `${trackMeta(t.id)?.code} · ${b}`))
    tiers.push([byRank(others), track ? 3 : PER_GROUP], [byRank(certs), PER_GROUP])

    // Group within each tier so this certification's results always come first.
    return tiers.flatMap(([list, cap]) => {
      const groups = new Map<string, Item[]>()
      for (const i of list) {
        const g = groups.get(i.group) ?? []
        if (g.length < cap) g.push(i)
        groups.set(i.group, g)
      }
      return [...groups.values()].flat()
    })
  }, [query, read, track, meta, tracks, trackId])

  const go = (i?: Item) => {
    if (!i) return
    onClose()
    router.push(i.href)
  }

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Opacity rather than autoAlpha: a hidden input can't take focus.
      gsap.from("[data-backdrop]", { opacity: 0, duration: 0.2, ease: "power1.out" })
      gsap.from("[data-panel]", { y: -12, scale: 0.98, opacity: 0, duration: 0.35, ease: "power3.out" })
    }, root)
    input.current?.focus()
    return () => ctx.revert()
  }, [])

  // Freeze the page underneath while the palette is open.
  useEffect(() => {
    const smoother = ScrollSmoother.get()
    smoother?.paused(true)
    return () => {
      smoother?.paused(false)
    }
  }, [])

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(items.length - 1, a + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      go(items[active])
    }
  }

  return (
    <div ref={root} className="fixed inset-0 z-50" role="dialog" aria-modal aria-label="Search">
      <div data-backdrop className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div
        data-panel
        className="relative mx-auto mt-[12vh] w-[min(620px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-[0_24px_80px_-20px_rgb(0_0_0/0.35)] ring-1 ring-foreground/10"
      >
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKey}
            placeholder={meta ? `Search ${meta.code} chapters and quizzes…` : "Search certifications…"}
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            role="combobox"
            aria-expanded
            aria-controls="palette-list"
            aria-activedescendant={items[active] ? `palette-${active}` : undefined}
          />
          <kbd className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">esc</kbd>
        </div>

        <div
          ref={list}
          id="palette-list"
          role="listbox"
          className="max-h-[min(440px,60vh)] overflow-y-auto overscroll-contain p-2"
        >
          {items.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">Nothing matches “{query}”.</p>
          )}
          {items.map((i, n) => (
            <div key={i.key}>
              {i.group !== items[n - 1]?.group && (
                <div className={cn("px-3 pb-1.5 text-xs text-muted-foreground", n > 0 ? "pt-4" : "pt-2")}>{i.group}</div>
              )}
              <button
                id={`palette-${n}`}
                data-index={n}
                role="option"
                aria-selected={n === active}
                onMouseMove={() => setActive(n)}
                onClick={() => go(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] leading-snug",
                  n === active ? "bg-muted text-foreground" : "text-foreground/85"
                )}
              >
                <span className="min-w-0 flex-1 truncate">{i.label}</span>
                {i.done && <Check className="size-3.5 shrink-0 text-success" />}
                {i.hint && <span className="shrink-0 text-xs text-muted-foreground">{i.hint}</span>}
                <CornerDownLeft className={cn("size-3.5 shrink-0 text-muted-foreground", n !== active && "invisible")} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------- shell ---------------- */

function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("px-4 pb-10 text-center text-xs leading-relaxed text-muted-foreground sm:px-8", className)}>
      Unofficial community study guide, not affiliated with or endorsed by Anthropic. Claude is a trademark of Anthropic, PBC.
    </footer>
  )
}

export function Shell({ tracks, children }: { tracks: NavTrack[]; children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const pathname = usePathname()
  const trackId = pathname.split("/")[1]
  const meta = trackMeta(trackId)
  const home = pathname === "/"

  useEffect(() => migrateAttempts(), [])

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      } else if (e.key === "Escape") setPaletteOpen(false)
    }
    window.addEventListener("keydown", on)
    return () => window.removeEventListener("keydown", on)
  }, [])

  const link = (active: boolean) =>
    cn(
      "rounded-md px-2.5 py-1.5 text-sm transition-colors",
      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    )

  return (
    <>
      {!home && (
        <header className="fixed inset-x-0 top-0 z-40 bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/" aria-label="All certifications" className="text-[#D97757] transition-transform hover:rotate-45">
                <SiClaude className="size-5" />
              </Link>
              {meta && (
                <Link href={`/${meta.id}`} className="truncate font-heading text-[15px] font-semibold tracking-tight">
                  {meta.name}
                  <span className="ml-2 font-normal text-muted-foreground">{meta.code}</span>
                </Link>
              )}
            </div>
            <nav className="flex items-center gap-1">
              <button onClick={() => setPaletteOpen(true)} className={cn(link(false), "flex items-center gap-2")}>
                <Search className="size-3.5" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden rounded border px-1 font-sans text-[10px] text-muted-foreground sm:inline">⌘K</kbd>
              </button>
              {meta?.available && (
                <Link href={`/${meta.id}/quiz`} className={link(pathname.startsWith(`/${meta.id}/quiz`))}>
                  Practice
                </Link>
              )}
              {meta?.available && <ProgressButton className={link(false)} />}
              <SettingsButton />
            </nav>
          </div>
        </header>
      )}

      {/* Fixed chrome stays outside the smoother; only the page content is transformed. */}
      <SmoothScroll>
        <main className={cn("min-h-screen", !home && "pt-14")}>{children}</main>
        {!home && <SiteFooter />}
      </SmoothScroll>
      {/* The home page is one centred screen, so its notice sits on the bottom edge instead of below the fold. */}
      {home && <SiteFooter className="pointer-events-none fixed inset-x-0 bottom-0 z-10 pb-5" />}

      {paletteOpen && <CommandPalette tracks={tracks} trackId={meta?.id} onClose={() => setPaletteOpen(false)} />}
    </>
  )
}
