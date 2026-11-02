"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import gsap from "gsap"
import { SiClaude } from "react-icons/si"
import { cn } from "@/lib/utils"
import { TRACKS } from "@/lib/tracks"
import { KeywordField } from "@/components/keyword-field"

const R_IN = 104
const R_OUT = 184
const R_MID = (R_IN + R_OUT) / 2
const PAD = 1.6 // degrees of gap on each side of a sector
const LIFT = 22 // half the label's height plus its gap

// The fill plays once per page load; coming back to home within the app skips it.
let introPlayed = false

// Angle in degrees, clockwise from 12 o'clock.
function pt(r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return [r * Math.sin(a), -r * Math.cos(a)] as const
}

function sector(center: number) {
  const a1 = center - 45 + PAD
  const a2 = center + 45 - PAD
  const [ox1, oy1] = pt(R_OUT, a1)
  const [ox2, oy2] = pt(R_OUT, a2)
  const [ix2, iy2] = pt(R_IN, a2)
  const [ix1, iy1] = pt(R_IN, a1)
  return `M${ox1} ${oy1}A${R_OUT} ${R_OUT} 0 0 1 ${ox2} ${oy2}L${ix2} ${iy2}A${R_IN} ${R_IN} 0 0 0 ${ix1} ${iy1}Z`
}

/** The Claude mark; hovering or tapping it opens a ring of the four certifications. */
export function CertRing() {
  const router = useRouter()
  const root = useRef<HTMLDivElement>(null)
  const logo = useRef<HTMLButtonElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [ready, setReady] = useState(() => introPlayed)

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const ctx = gsap.context(() => {
      gsap.set("[data-ring]", { autoAlpha: 0 })
      // At rest the logo and its label are centred as a pair; the logo settles to dead centre as the ring opens.
      gsap.set([logo.current, "[data-title]"], { y: -LIFT })
      tl.current = gsap
        .timeline({ paused: true, defaults: { ease: "power3.out", duration: reduce ? 0.01 : 0.55 } })
        .to("[data-ring]", { autoAlpha: 1, duration: 0.01 })
        .fromTo(
          "[data-sector]",
          { scale: 0.7, rotation: -24, autoAlpha: 0, svgOrigin: "0 0" },
          { scale: 1, rotation: 0, autoAlpha: 1, svgOrigin: "0 0", stagger: 0.05 },
          0,
        )
        .to("[data-title]", { y: -LIFT - 8, autoAlpha: 0, duration: 0.3 }, 0)
        .fromTo("[data-caption]", { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }, 0.15)
        .to(logo.current, { y: 0, rotation: 45, scale: 0.86, duration: reduce ? 0.01 : 0.7 }, 0)
    }, root)
    return () => ctx.revert()
  }, [])

  // Intro: the mark fills with orange from the bottom up, and nothing is clickable until it's full.
  useLayoutEffect(() => {
    if (introPlayed) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const ctx = gsap.context(() => {
      gsap.set("[data-title]", { autoAlpha: 0 })
      gsap
        .timeline({ delay: 0.25, onComplete: () => ((introPlayed = true), setReady(true)) })
        .fromTo(
          "[data-fill]",
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: reduce ? 0.01 : 1.5, ease: "power2.inOut" },
        )
        .fromTo(logo.current, { scale: 0.94 }, { scale: 1, duration: reduce ? 0.01 : 1.5, ease: "power2.inOut" }, 0)
        .to("[data-title]", { autoAlpha: 1, duration: reduce ? 0.01 : 0.5, ease: "power2.out" }, "-=0.15")
    }, root)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (open) {
      tl.current?.timeScale(1).play()
      for (const t of TRACKS) if (t.available) router.prefetch(`/${t.id}`)
    } else {
      tl.current?.timeScale(1.6).reverse()
    }
  }, [open, router])

  // Close on Escape or a tap outside.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      setOpen(false)
      logo.current?.focus()
    }
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [open])

  const show = () => {
    clearTimeout(closeTimer.current)
    if (!open) setActive(null)
    setOpen(true)
  }
  const hide = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }

  const current = open ? TRACKS.find((t) => t.id === active) : undefined

  return (
    <>
      <KeywordField show={ready} dim={open} />
      {/* Holds every click until the intro finishes. */}
      {!ready && <div aria-hidden className="fixed inset-0 z-50 cursor-progress" />}
      <div
        ref={root}
        className="relative aspect-square w-[min(400px,88vw)]"
        onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
        onPointerEnter={(e) => e.pointerType === "mouse" && open && show()}
        onBlur={(e) => !root.current?.contains(e.relatedTarget as Node) && setOpen(false)}
      >
        <svg
          data-ring
          viewBox="-200 -200 400 400"
          className={cn("invisible absolute inset-0 size-full overflow-visible", !open && "pointer-events-none")}
          aria-hidden={!open}
        >
          {TRACKS.map((t, i) => {
            const center = (315 + i * 90) % 360
            const [lx, ly] = pt(R_MID, center)
            const on = open && active === t.id
            const body = (
              <>
                <path
                  d={sector(center)}
                  className={cn(
                    "transition-colors duration-200",
                    on ? "fill-foreground" : "fill-foreground/[0.04] stroke-border",
                    !t.available && "fill-transparent",
                  )}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={lx}
                  y={ly - 7}
                  textAnchor="middle"
                  className={cn(
                    "font-heading text-[15px] font-medium transition-colors duration-200",
                    on ? "fill-background" : "fill-foreground",
                    !t.available && "fill-muted-foreground",
                  )}
                >
                  {t.name}
                </text>
                <text
                  x={lx}
                  y={ly + 13}
                  textAnchor="middle"
                  className={cn(
                    "text-[10.5px] tracking-[0.12em] transition-colors duration-200",
                    on ? "fill-background/70" : "fill-muted-foreground",
                  )}
                >
                  {t.available ? t.code : "SOON"}
                </text>
              </>
            )
            return (
              <g
                key={t.id}
                data-sector
                onPointerEnter={() => setActive(t.id)}
                onPointerLeave={() => setActive((a) => (a === t.id ? null : a))}
                className={t.available ? "cursor-pointer" : "cursor-default"}
              >
                {t.available ? (
                  <a
                    href={`/${t.id}`}
                    aria-label={t.credential}
                    tabIndex={open ? 0 : -1}
                    className="outline-none"
                    onFocus={() => setActive(t.id)}
                    onClick={(e) => {
                      e.preventDefault()
                      router.push(`/${t.id}`)
                    }}
                  >
                    {body}
                  </a>
                ) : (
                  body
                )}
              </g>
            )
          })}
        </svg>

        <button
          ref={logo}
          type="button"
          aria-label="Choose a certification"
          aria-expanded={open}
          disabled={!ready}
          onPointerEnter={(e) => e.pointerType === "mouse" && show()}
          onClick={show}
          className="absolute top-1/2 left-1/2 -mt-[66px] -ml-[66px] grid size-[132px] place-items-center rounded-full text-[#D97757] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* A faint outline of the mark, with the orange copy clipped over it as it fills. */}
          <SiClaude className="absolute inset-0 size-full text-foreground/10" />
          <SiClaude data-fill className="relative size-full" style={ready ? undefined : { clipPath: "inset(100% 0% 0% 0%)" }} />
        </button>

        {/* Sits under the logo without shifting it off centre; gives way to the ring. */}
        <p
          data-title
          className="pointer-events-none absolute inset-x-0 top-[calc(50%+82px)] text-center font-heading text-lg font-medium tracking-tight"
        >
          Cert Prep
        </p>

        <p data-caption className="invisible absolute inset-x-0 -bottom-14 text-center text-sm text-muted-foreground">
          {current ? (current.available ? current.credential : `${current.credential} · coming soon`) : "Choose a certification"}
        </p>
      </div>
    </>
  )
}
