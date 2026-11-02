"use client"

import { useMemo } from "react"
import { Check, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  applyPrefs,
  DEFAULT_READER,
  KEYS,
  LEADINGS,
  normalizePrefs,
  type ReaderPrefs,
  SIZES,
  THEMES,
  type ThemeId,
  useStored,
  WIDTHS,
} from "@/lib/store"

const NO_PREFS: Partial<ReaderPrefs> | null = null

export function useReaderPrefs() {
  const [raw, setRaw] = useStored(KEYS.reader, NO_PREFS)
  const prefs = useMemo(() => {
    // Before anything is saved, keep whatever theme the pre-paint script chose
    // (the old light/dark toggle or the system setting).
    const domTheme = typeof document !== "undefined" ? (document.documentElement.dataset.theme as ThemeId) : undefined
    return normalizePrefs({ theme: domTheme, ...(raw ?? {}) })
  }, [raw])
  const update = (patch: Partial<ReaderPrefs>) => {
    const next = { ...prefs, ...patch }
    setRaw(next)
    applyPrefs(next)
  }
  return [prefs, update] as const
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-xs font-medium text-muted-foreground">{children}</div>
}

function Segment<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: React.ReactNode }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col overflow-hidden rounded-md border">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex h-8 items-center justify-center px-2 text-xs transition-colors",
            value === o.value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ThemeSwatches({ value, onChange }: { value: ThemeId; onChange: (t: ThemeId) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {THEMES.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className="group flex flex-col items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring" title={t.label}>
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-full border text-[13px] font-semibold transition-shadow",
              value === t.id ? "ring-2 ring-foreground ring-offset-2 ring-offset-popover" : "group-hover:ring-1 group-hover:ring-foreground/30"
            )}
            style={{ background: t.bg, color: t.fg, borderColor: t.dark ? "#ffffff26" : "#0000001a" }}
          >
            {value === t.id ? <Check className="size-4" /> : "Aa"}
          </span>
          <span className={cn("text-[11px]", value === t.id ? "text-foreground" : "text-muted-foreground")}>{t.label}</span>
        </button>
      ))}
    </div>
  )
}

export function SettingsPanel() {
  const [prefs, update] = useReaderPrefs()
  return (
    <div className="space-y-5 p-1.5">
      <div>
        <Label>Theme</Label>
        <ThemeSwatches value={prefs.theme} onChange={(theme) => update({ theme })} />
      </div>

      <div>
        <Label>
          Text size <span className="ml-1 tabular-nums text-foreground">{SIZES[prefs.size]}px</span>
        </Label>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon-sm" disabled={prefs.size === 0} onClick={() => update({ size: prefs.size - 1 })} aria-label="Smaller text">
            <Minus />
          </Button>
          <div className="flex flex-1 items-end justify-between">
            {SIZES.map((s, i) => (
              <button
                key={s}
                onClick={() => update({ size: i })}
                className="flex h-6 flex-1 items-end justify-center"
                aria-label={`${s}px`}
              >
                <span
                  className={cn("w-1 rounded-full transition-colors", i <= prefs.size ? "bg-foreground" : "bg-muted-foreground/30")}
                  style={{ height: 6 + i * 1.8 }}
                />
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={prefs.size === SIZES.length - 1}
            onClick={() => update({ size: prefs.size + 1 })}
            aria-label="Larger text"
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div>
        <Label>Font</Label>
        <Segment
          value={prefs.font}
          onChange={(font) => update({ font })}
          options={[
            { value: "onest", label: <span className="font-sans text-[13px]">Onest</span> },
            { value: "hanken", label: <span className="font-heading text-[13px]">Hanken Grotesk</span> },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Line spacing</Label>
          <Segment
            value={prefs.leading}
            onChange={(leading) => update({ leading })}
            options={(Object.keys(LEADINGS) as (keyof typeof LEADINGS)[]).map((k) => ({
              value: k,
              label: (
                <span className="flex flex-col" style={{ gap: k === "compact" ? 1.5 : k === "normal" ? 3 : 4.5 }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="block h-px w-3.5 bg-current" />
                  ))}
                </span>
              ),
            }))}
          />
        </div>
        <div>
          <Label>Width</Label>
          <Segment
            value={prefs.width}
            onChange={(width) => update({ width })}
            options={(Object.keys(WIDTHS) as (keyof typeof WIDTHS)[]).map((k) => ({
              value: k,
              label: <span className={cn("block h-2.5 rounded-[2px] border border-current", k === "narrow" ? "w-2.5" : k === "normal" ? "w-3.5" : "w-5")} />,
            }))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm">Bold emphasis</div>
          <div className="text-xs text-muted-foreground">The guide bolds key phrases heavily</div>
        </div>
        <button
          role="switch"
          aria-checked={prefs.emphasis}
          onClick={() => update({ emphasis: !prefs.emphasis })}
          className={cn("relative h-5 w-9 rounded-full transition-colors", prefs.emphasis ? "bg-foreground" : "bg-muted-foreground/30")}
        >
          <span className={cn("absolute top-0.5 size-4 rounded-full bg-background transition-all", prefs.emphasis ? "left-[18px]" : "left-0.5")} />
        </button>
      </div>

      <button
        onClick={() => update({ ...DEFAULT_READER, theme: prefs.theme })}
        className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Reset text settings
      </button>
    </div>
  )
}
