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

type Drifter = { el: HTMLSpanElement; x: number; y: number; vx: number; vy: number; w: number; h: number; alpha: number }

/**
 * Keywords drifting across the page in random directions, wrapping at the edges.
 * They thin out near the centre so the logo keeps clear air, and dim while `dim` is set.
 */
export function KeywordField({ show, dim }: { show: boolean; dim: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const level = useRef({ value: 0 })

  useEffect(() => {
    const box = root.current
    if (!box || !show) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const { width, height } = box.getBoundingClientRect()
    // Start each word in its own cell of a shuffled grid, so they begin evenly spread rather than clumped.
    const nodes = [...box.children]
    const cols = Math.ceil(Math.sqrt((nodes.length * width) / height))
    const rows = Math.ceil(nodes.length / cols)
    const cells = gsap.utils.shuffle(nodes.map((_, i) => i))
    const drifters: Drifter[] = nodes.map((node, i) => {
      const el = node as HTMLSpanElement
      const depth = gsap.utils.random(0.35, 1)
      const angle = gsap.utils.random(0, Math.PI * 2)
      const speed = gsap.utils.random(8, 26) * depth // px per second; nearer words move faster
      el.style.fontSize = `${Math.round(11 + depth * 9)}px`
      return {
        el,
        x: ((cells[i] % cols) + gsap.utils.random(0.1, 0.7)) * (width / cols),
        y: (Math.floor(cells[i] / cols) + gsap.utils.random(0.2, 0.8)) * (height / rows),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: el.offsetWidth,
        h: el.offsetHeight,
        alpha: 0.25 + depth * 0.45,
      }
    })

    const tick = (_t: number, dt: number) => {
      const s = reduce ? 0 : dt / 1000
      const { width: W, height: H } = box.getBoundingClientRect()
      const cx = W / 2
      const cy = H / 2
      for (const d of drifters) {
        d.x += d.vx * s
        d.y += d.vy * s
        // Leave one edge fully before coming back in at the opposite one.
        if (d.x < -d.w) d.x = W
        else if (d.x > W) d.x = -d.w
        if (d.y < -d.h) d.y = H
        else if (d.y > H) d.y = -d.h
        const dist = Math.hypot(d.x + d.w / 2 - cx, d.y + d.h / 2 - cy)
        const near = gsap.utils.clamp(0, 1, (dist - CLEAR) / FADE)
        d.el.style.transform = `translate3d(${d.x}px, ${d.y}px, 0)`
        d.el.style.opacity = String(d.alpha * near * level.current.value)
      }
    }
    gsap.ticker.add(tick)
    tick(0, 0)
    return () => gsap.ticker.remove(tick)
  }, [show])

  // Fade the whole field in once the intro is done, and down while the ring is open.
  useEffect(() => {
    if (!show) return
    gsap.to(level.current, { value: dim ? 0.35 : 1, duration: dim ? 0.4 : 1.6, ease: "power2.out", overwrite: true })
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
