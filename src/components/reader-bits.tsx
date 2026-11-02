"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { createPortal } from "react-dom"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EMPTY_RECORD, KEYS, useStored } from "@/lib/store"
import { useMounted, usePin } from "@/components/smooth-scroll"
import { TransitionLink } from "@/components/page-transition"

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)
  const mounted = useMounted()
  useEffect(() => {
    if (!bar.current) return
    // Tracks the smoothed position, so the bar glides with the page.
    const setX = gsap.quickSetter(bar.current, "scaleX")
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => setX(self.progress),
    })
    setX(st.progress)
    return () => st.kill()
  }, [mounted])
  if (!mounted) return null
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div ref={bar} className="h-full origin-left scale-x-0 bg-foreground" />
    </div>,
    document.body,
  )
}

export function MarkRead({ id }: { id: string }) {
  const [read, setRead] = useStored(KEYS.read, EMPTY_RECORD)
  const done = !!read[id]
  return (
    <Button
      variant={done ? "outline" : "default"}
      size="lg"
      className="px-4"
      onClick={() =>
        setRead((r) => {
          const n = { ...r }
          if (done) delete n[id]
          else n[id] = true
          return n
        })
      }
    >
      {done ? (
        <>
          <Check className="text-success" /> Read
        </>
      ) : (
        "Mark as read"
      )}
    </Button>
  )
}

/**
 * Slides a marker along a list's left rule to the active item, and keeps that
 * item in view inside the scrollable list, instead of jumping between them.
 */
function useActiveMarker(
  list: React.RefObject<HTMLElement | null>,
  marker: React.RefObject<HTMLElement | null>,
  key: string | null,
) {
  const placed = useRef(false)
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>("[data-active]")
    const bar = marker.current
    if (!el || !bar) {
      if (bar) gsap.to(bar, { autoAlpha: 0, duration: 0.2 })
      return
    }
    const first = !placed.current
    placed.current = true
    const to = { y: el.offsetTop, height: el.offsetHeight, autoAlpha: 1 }
    if (first) gsap.set(bar, to)
    else
      gsap.to(bar, {
        ...to,
        duration: 0.5,
        ease: "power3.out",
        overwrite: true,
      })

    const scroller = list.current?.closest<HTMLElement>("[data-scroller]")
    if (!scroller) return
    const top = el.offsetTop
    const bottom = top + el.offsetHeight
    const view = scroller.scrollTop
    if (top < view + 40 || bottom > view + scroller.clientHeight * 0.6) {
      const target = Math.max(0, top - scroller.clientHeight / 3)
      if (first) scroller.scrollTop = target
      else
        gsap.to(scroller, {
          scrollTop: target,
          duration: 0.6,
          ease: "power2.out",
          overwrite: true,
        })
    }
  }, [list, marker, key])
}

/**
 * "On this page", folded into a column of short lines at the middle of the right edge;
 * hovering (or tabbing into) it opens the full list in place.
 */
export function Toc({ items }: { items: { id: string; text: string }[] }) {
  const [active, setActive] = useState<string | null>(null)
  const list = useRef<HTMLUListElement>(null)
  const marker = useRef<HTMLLIElement>(null)
  const mounted = useMounted()
  // Open while hovered or focused, and fold back the moment the page scrolls underneath.
  const [hover, setHover] = useState(false)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!hover && !focused) return
    const close = () => {
      setHover(false)
      setFocused(false)
      ;(document.activeElement as HTMLElement | null)?.blur?.()
    }
    window.addEventListener("scroll", close, { passive: true, once: true })
    return () => window.removeEventListener("scroll", close)
  }, [hover, focused])
  // Above the first heading, the first section counts as current.
  const current = active ?? items[0]?.id
  useActiveMarker(list, marker, current)
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[]
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActive(vis[0].target.id)
      },
      { rootMargin: "0px 0px -70% 0px" },
    )
    els.forEach((e) => obs.observe(e))
    return () => obs.disconnect()
  }, [items])
  // Fixed positioning needs to escape the smoother's transformed content.
  if (!mounted) return null
  return createPortal(
    <nav
      aria-label="On this page"
      data-open={hover || focused || undefined}
      onPointerMove={() => !hover && setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocused(false)}
      className="group fixed top-1/2 right-5 z-40 hidden -translate-y-1/2 lg:block">
      {/* Folded: one line per section, the current one longer and darker. */}
      <ul
        aria-hidden
        className="flex flex-col items-end gap-2.5 py-3 pl-6 transition-[opacity,filter] duration-300 group-data-open:opacity-0 group-data-open:blur-sm"
      >
        {items.map((i) => (
          <li
            key={i.id}
            className={cn(
              "h-px rounded-full transition-all duration-500 ease-out",
              current === i.id ? "w-6 bg-foreground" : "w-3 bg-muted-foreground/50",
            )}
          />
        ))}
      </ul>

      {/* Open: the plain list in place of the lines, backed only by the page colour so text behind it doesn't show through. */}
      <div className="pointer-events-none absolute top-1/2 right-0 w-64 origin-right -translate-y-1/2 translate-x-2 bg-background py-2 pl-4 opacity-0 transition-all duration-300 ease-out group-data-open:pointer-events-auto group-data-open:translate-x-0 group-data-open:opacity-100">
        <div className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">On this page</div>
        <div data-scroller className="max-h-[60vh] overflow-y-auto overscroll-contain [scrollbar-width:none]">
          <ul ref={list} className="relative space-y-1 border-l text-[13px]">
            <li ref={marker} aria-hidden className="invisible absolute top-0 -left-px w-px bg-foreground" />
            {items.map((i) => (
              <li key={i.id}>
                <a
                  href={`#${i.id}`}
                  data-active={current === i.id || undefined}
                  className={cn(
                    "block py-1 pl-3 leading-snug transition-colors duration-300",
                    current === i.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {i.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>,
    document.body,
  )
}

export type BookNavItem = {
  href: string
  title: string
  n: string
  id: string
}

/** The book's chapters, pinned on the left; a mirror of the "On this page" list. */
export function BackLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </Link>
  )
}

export function BookNav({ title, items, back }: { title: string; items: BookNavItem[]; back: { href: string; label: string } }) {
  // Lives in the book layout so it survives chapter changes and the marker can glide.
  const current = usePathname()
  const [read] = useStored(KEYS.read, EMPTY_RECORD)
  const bounds = useRef<HTMLDivElement>(null)
  const pinned = useRef<HTMLElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const marker = useRef<HTMLLIElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  usePin(pinned, bounds, { gap: 32 })
  useActiveMarker(list, marker, current)
  const currentIdx = items.findIndex((i) => i.href === current)

  // Step aside once reading starts; come back when the pointer drifts to the left edge.
  const [reading, setReading] = useState(false)
  const [near, setNear] = useState(false)
  const [focused, setFocused] = useState(false)
  const hiddenRef = useRef(false)
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 240,
      end: "max",
      onToggle: (self) => setReading(self.isActive),
    })
    return () => st.kill()
  }, [current])
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // A thin strip at the edge while hidden (the page has slid over), the whole column once open.
      const r = bounds.current?.getBoundingClientRect()
      if (r) setNear(e.clientX < (hiddenRef.current ? r.left + 32 : r.right + 32))
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [])
  const hidden = reading && !near && !focused
  useEffect(() => {
    hiddenRef.current = hidden
    const ease = "power3.inOut"
    const duration = hidden ? 0.7 : 0.5
    gsap.to(panel.current, { autoAlpha: hidden ? 0 : 1, x: hidden ? -24 : 0, duration, ease, overwrite: true })
    // Like Preview's sidebar: the page slides over into the freed space (a transform, so lines don't reflow).
    const aside = bounds.current?.parentElement
    const page = aside?.parentElement?.querySelector<HTMLElement>("[data-page]")
    const shift = aside ? (aside.offsetWidth + 40) / 2 : 0
    // Leave the page untouched until it has to move, so a streamed-in page still hydrates cleanly.
    if (page && (hidden || page.style.transform))
      gsap.to(page, { x: hidden ? -shift : 0, duration, ease, overwrite: true })
  }, [hidden])

  return (
    <div ref={bounds} className="h-full">
      <nav
        ref={pinned}
        aria-label={title}
        onFocus={() => setFocused(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocused(false)}
        className="relative"
      >
        <div ref={panel}>
          <BackLink href={back.href} label={back.label} className="mb-8 text-[13px]" />
          <div className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</div>
          <div data-scroller className="max-h-[calc(100vh-14rem)] overflow-y-auto overscroll-contain py-3 [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,transparent,black_28px,black_calc(100%-28px),transparent)]">
            <ol ref={list} className="relative space-y-1 border-l text-[13px]">
              <li ref={marker} aria-hidden className="invisible absolute top-0 -left-px w-px bg-foreground" />
              {items.map((i, idx) => {
                const on = i.href === current
                return (
                  <li key={i.href}>
                    <TransitionLink
                      href={i.href}
                      step={idx < currentIdx ? -1 : 1}
                      aria-current={on ? "page" : undefined}
                      data-active={on || undefined}
                      className={cn(
                        "flex gap-2 py-1 pl-3 leading-snug transition-colors duration-300",
                        on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {i.n && <span className="w-4 shrink-0 text-right tabular-nums opacity-60">{i.n}</span>}
                      <span className="flex-1">{i.title}</span>
                      {read[i.id] && <Check className="mt-0.5 size-3 shrink-0 text-success" />}
                    </TransitionLink>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </nav>
    </div>
  )
}
