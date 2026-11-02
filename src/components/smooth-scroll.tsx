"use client"

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from "react"
import { usePathname } from "next/navigation"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ScrollSmoother } from "gsap/ScrollSmoother"

gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

// Height of the fixed top bar.
export function topOffset() {
  return 56
}

// Smoothly scroll to an element (or y position), falling back to native
// scrolling when the smoother is off (reduced motion).
export function scrollToTarget(target: Element | number, { gap = 24, smooth = true } = {}) {
  const smoother = ScrollSmoother.get()
  const y =
    typeof target === "number"
      ? target
      : (smoother ? smoother.offset(target, "top top") : target.getBoundingClientRect().top + window.scrollY) -
        topOffset() -
        gap
  const top = Math.max(0, y)
  if (!smoother) return window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" })
  if (!smooth) return smoother.scrollTo(top, false)
  // An unhurried glide that eases in and out, longer for longer trips; any wheel or touch takes back control.
  const distance = Math.abs(top - smoother.scrollTop())
  const tween = gsap.to(smoother, {
    scrollTop: top,
    duration: gsap.utils.clamp(0.9, 1.8, 0.8 + distance / 2500),
    ease: "power3.inOut",
    overwrite: true,
    onComplete: release,
  })
  function release() {
    window.removeEventListener("wheel", cancel)
    window.removeEventListener("touchstart", cancel)
  }
  function cancel() {
    tween.kill()
    release()
  }
  window.addEventListener("wheel", cancel, { passive: true })
  window.addEventListener("touchstart", cancel, { passive: true })
}

/**
 * Keeps an element pinned at the top of the viewport while `bounds` is on screen.
 * Replaces position: sticky, which can't work inside ScrollSmoother's transformed content.
 */
export function usePin(
  el: RefObject<HTMLElement | null>,
  bounds: RefObject<HTMLElement | null>,
  { gap = 0, enabled = true }: { gap?: number; enabled?: boolean } = {}
) {
  useEffect(() => {
    if (!enabled || !el.current || !bounds.current) return
    const pinned = el.current
    const container = bounds.current
    const st = ScrollTrigger.create({
      trigger: pinned,
      pin: true,
      pinSpacing: false,
      start: () => `top ${topOffset() + gap}px`,
      endTrigger: container,
      end: () => `bottom ${topOffset() + gap + pinned.offsetHeight}px`,
      invalidateOnRefresh: true,
    })
    return () => st.kill()
  }, [el, bounds, gap, enabled])
}

const noop = () => () => {}
export function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  )
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Layout effect so the smoother exists before any child creates a ScrollTrigger pin.
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const smoother = ScrollSmoother.create({
      wrapper: wrapper.current!,
      content: content.current!,
      smooth: 1.1,
      smoothTouch: 0.1,
      effects: false,
    })

    // Content height changes on navigation and when quiz answers expand.
    let t: ReturnType<typeof setTimeout>
    const ro = new ResizeObserver(() => {
      clearTimeout(t)
      t = setTimeout(() => ScrollTrigger.refresh(), 120)
    })
    ro.observe(content.current!)

    // In-page anchors (table of contents, footnotes) glide instead of jumping.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.("a[href^='#']") as HTMLAnchorElement | null
      if (!a || e.metaKey || e.ctrlKey) return
      const el = document.getElementById(decodeURIComponent(a.hash.slice(1)))
      if (!el) return
      e.preventDefault()
      history.replaceState(null, "", a.hash)
      scrollToTarget(el)
    }
    document.addEventListener("click", onClick)

    return () => {
      clearTimeout(t)
      ro.disconnect()
      document.removeEventListener("click", onClick)
      smoother.kill()
    }
  }, [])

  // New page: start at the top instantly rather than gliding up from the old position.
  useEffect(() => {
    const smoother = ScrollSmoother.get()
    if (!smoother) return
    smoother.scrollTop(0)
    ScrollTrigger.refresh()
    // Links from search can point at a section ("/…/chapter#heading").
    const id = decodeURIComponent(location.hash.slice(1))
    if (!id) return
    let tries = 0
    let raf = 0
    const seek = () => {
      const el = document.getElementById(id)
      if (el) {
        ScrollTrigger.refresh()
        scrollToTarget(el, { smooth: false })
      } else if (tries++ < 30) raf = requestAnimationFrame(seek)
    }
    raf = requestAnimationFrame(seek)
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  return (
    <div id="smooth-wrapper" ref={wrapper}>
      <div id="smooth-content" ref={content}>
        {children}
      </div>
    </div>
  )
}
