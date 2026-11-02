"use client"

import { useLayoutEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import gsap from "gsap"

// Which way the reader is moving through the book: 1 = forward, -1 = back.
// Set by the outgoing page, read by the incoming one.
let direction = 1

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** A Link that plays the current page out before navigating, so the next page can rise in. */
export function TransitionLink({
  step = 1,
  onClick,
  ...props
}: React.ComponentProps<typeof Link> & { step?: 1 | -1 }) {
  const router = useRouter()
  return (
    <Link
      {...props}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        const href = String(props.href)
        if (href === location.pathname) return
        direction = step
        const stage = document.querySelector<HTMLElement>("[data-stage]")
        if (!stage || reduced()) return
        e.preventDefault()
        router.prefetch(href)
        gsap.to(stage, {
          autoAlpha: 0,
          y: -28 * step,
          filter: "blur(10px)",
          scale: 0.985,
          duration: 0.38,
          ease: "power2.in",
          overwrite: true,
          onComplete: () => router.push(href),
        })
      }}
    />
  )
}

/**
 * The incoming page: its blocks surface one after another, from below when
 * moving forward and from above when going back, sharpening out of a blur.
 */
export function Stage({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const stage = ref.current
    if (!stage || reduced()) return
    const dir = direction
    direction = 1
    // Only what's on screen is worth staggering; the rest is out of sight anyway.
    const blocks = [...stage.querySelectorAll<HTMLElement>(":scope > *, .reader > *")].filter(
      (el) => !el.classList.contains("reader") && el.getBoundingClientRect().top < window.innerHeight,
    )
    const ctx = gsap.context(() => {
      gsap.set(stage, { autoAlpha: 1 })
      gsap.from(blocks.slice(0, 14), {
        autoAlpha: 0,
        y: 36 * dir,
        filter: "blur(8px)",
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.055,
        clearProps: "all",
      })
    })
    return () => ctx.revert()
  }, [])
  return (
    <div ref={ref} data-stage className={className}>
      {children}
    </div>
  )
}
