"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

// Terms from across the four certifications.
const WORDS = [
  "MCP",
  "Agents",
  "Tool use",
  "Subagents",
  "Prompt caching",
  "Claude Code",
  "Hooks",
  "Skills",
  "CLAUDE.md",
  "Plan mode",
  "tool_choice",
  "Streaming",
  "Message Batches",
  "Context window",
  "Extended thinking",
  "Effort",
  "Structured outputs",
  "Evals",
  "RAG",
  "Prompt injection",
  "Guardrails",
  "Agent SDK",
  "Computer use",
  "Citations",
  "Vision",
  "Files API",
  "Fast mode",
  "Model IDs",
  "Rate limits",
  "Embeddings",
  "Permissions",
  "Stop reasons",
  "Messages API",
  "System prompts",
  "Few-shot",
  "XML tags",
  "Prefill",
  "Chain of thought",
  "Tool results",
  "Parallel tool calls",
  "JSON schema",
  "Token counting",
  "max_tokens",
  "Temperature",
  "Retries",
  "Batch API",
  "Webhooks",
  "Context editing",
  "Compaction",
  "Memory",
  "Multi-agent",
  "Orchestrator",
  "Workflows",
  "Human in the loop",
  "Sandboxing",
  "Slash commands",
  "Settings.json",
  "MCP servers",
  "Resources",
  "Prompts",
  "Transports",
  "OAuth",
  "Secrets",
  "Least privilege",
  "Observability",
  "Tracing",
  "Latency",
  "Cost",
  "Haiku",
  "Sonnet",
  "Opus",
  "PDF support",
  "Search results",
  "Code execution",
  "Web search",
  "Fine-grained streaming",
]

const CLEAR = 230 // radius around the logo that stays empty
const FADE = 140 // how far past that radius a word takes to reach full strength
const DRAG = 2.4 // how quickly the launch speed bleeds off, per second
const EDGE = 56 // radius of the logo itself; launching words show from here, so they seem to come off it
const LAUNCH_SCALE = 0.5 // how small a word starts at launch, growing to full size as it slows

type Drifter = {
  el: HTMLSpanElement
  x: number
  y: number
  vx: number
  vy: number
  bx: number // launch velocity, decaying to zero
  by: number
  b0: number // launch speed at the start, to tell how far into its flight a word is
  delay: number // seconds before this word launches
  w: number
  h: number
  alpha: number
}

/**
 * Keywords that burst outward from behind the logo towards the walls, then drift in random directions, wrapping at
 * the edges. They thin out near the centre so the logo keeps clear air, and dim while `dim` is set.
 */
export function KeywordField({ show, dim }: { show: boolean; dim: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const level = useRef({ value: 0 })

  useEffect(() => {
    const box = root.current
    if (!box || !show) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const { width, height } = box.getBoundingClientRect()
    const cx = width / 2
    const cy = height / 2
    const nodes = [...box.children]
    // Evenly spaced launch angles, shuffled across the words, so every direction gets some.
    const slots = gsap.utils.shuffle(nodes.map((_, i) => i))
    const drifters: Drifter[] = nodes.map((node, i) => {
      const el = node as HTMLSpanElement
      const depth = gsap.utils.random(0.35, 1)
      const drift = gsap.utils.random(0, Math.PI * 2)
      const speed = gsap.utils.random(8, 26) * depth // px per second; nearer words move faster
      el.style.fontSize = `${Math.round(11 + depth * 9)}px`
      const w = el.offsetWidth
      const h = el.offsetHeight
      const launch = ((slots[i] + gsap.utils.random(-0.4, 0.4)) / nodes.length) * Math.PI * 2
      const ux = Math.cos(launch)
      const uy = Math.sin(launch)
      // Distance from the centre to the wall along this direction; words land anywhere from the clear ring out to it,
      // weighted outwards so the area fills evenly, and a few overshoot and wrap around.
      const wall = Math.min(Math.abs(cx / ux) || Infinity, Math.abs(cy / uy) || Infinity)
      const reach = CLEAR + (wall * 1.08 - CLEAR) * Math.sqrt(Math.random())
      const x0 = cx - w / 2
      const y0 = cy - h / 2
      return {
        el,
        // With reduced motion there is no burst; words simply start where it would have put them.
        x: reduce ? x0 + ux * reach : x0,
        y: reduce ? y0 + uy * reach : y0,
        vx: Math.cos(drift) * speed,
        vy: Math.sin(drift) * speed,
        bx: reduce ? 0 : ux * reach * DRAG,
        by: reduce ? 0 : uy * reach * DRAG,
        b0: reach * DRAG,
        delay: reduce ? 0 : gsap.utils.random(0, 0.25),
        w,
        h,
        alpha: 0.25 + depth * 0.45,
      }
    })

    const tick = (_t: number, dt: number) => {
      const s = reduce ? 0 : dt / 1000
      const { width: W, height: H } = box.getBoundingClientRect()
      const cx = W / 2
      const cy = H / 2
      for (const d of drifters) {
        if (d.delay > 0) {
          d.delay -= s
          d.el.style.opacity = "0"
          continue
        }
        // Integrating the exponentially decaying launch speed moves each word exactly its chosen reach.
        const decay = Math.exp(-DRAG * s)
        d.x += d.vx * s + (d.bx * (1 - decay)) / DRAG
        d.y += d.vy * s + (d.by * (1 - decay)) / DRAG
        d.bx *= decay
        d.by *= decay
        // Leave one edge fully before coming back in at the opposite one.
        if (d.x < -d.w) d.x = W
        else if (d.x > W) d.x = -d.w
        if (d.y < -d.h) d.y = H
        else if (d.y > H) d.y = -d.h
        // In flight (1 at launch, falling to 0), the clear zone shrinks to the logo's edge so words visibly leave it.
        const flight = Math.hypot(d.bx, d.by) / d.b0
        const clear = CLEAR + (EDGE - CLEAR) * flight
        const fade = FADE + (24 - FADE) * flight
        const dist = Math.hypot(d.x + d.w / 2 - cx, d.y + d.h / 2 - cy)
        const near = gsap.utils.clamp(0, 1, (dist - clear) / fade)
        const scale = 1 - (1 - LAUNCH_SCALE) * flight
        d.el.style.transform = `translate3d(${d.x}px, ${d.y}px, 0) scale(${scale})`
        d.el.style.opacity = String(d.alpha * near * level.current.value)
      }
    }
    gsap.ticker.add(tick)
    tick(0, 0)
    return () => gsap.ticker.remove(tick)
  }, [show])

  // Fade the whole field in quickly once the intro is done, so the burst is visible, and down while the ring is open.
  useEffect(() => {
    if (!show) return
    gsap.to(level.current, { value: dim ? 0.35 : 1, duration: dim ? 0.4 : 0.25, ease: "power2.out", overwrite: true })
  }, [show, dim])

  return (
    <div ref={root} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {WORDS.map((w) => (
        <span
          key={w}
          className="absolute top-0 left-0 font-heading whitespace-nowrap text-muted-foreground opacity-0 will-change-transform"
        >
          {w}
        </span>
      ))}
    </div>
  )
}
