import Link from "next/link"
import "./link-arc.css"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"

// Maps a relative link in the source markdown (e.g. "../../08-messages-api/",
// "./03-the-api-surface.md") to a page in this app, if one exists.
function resolveHref(href: string, slugs: Map<string, string>): string | null {
  if (/^(https?:|mailto:)/.test(href) || href.startsWith("#")) return href
  const [pathPart, hash] = href.split("#")
  const last = pathPart.replace(/\/$/, "").split("/").pop()?.replace(/\.md$/, "") ?? ""
  const target = slugs.get(last)
  if (target) return hash ? `${target}#${hash}` : target
  return null
}

type HNode = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: HNode[] }

function textOf(n: HNode): string {
  return n.type === "text" ? (n.value ?? "") : (n.children ?? []).map(textOf).join("")
}

// Gives the items of the list under an "Endnotes" heading ids (endnote-1, ...)
// so the superscript markers in the text can link to them.
function rehypeEndnoteIds() {
  return (tree: HNode) => {
    const kids = tree.children ?? []
    let inEndnotes = false
    for (const n of kids) {
      if (n.type !== "element") continue
      if (/^h[1-6]$/.test(n.tagName ?? "")) inEndnotes = /^endnotes/i.test(textOf(n).trim())
      else if (inEndnotes && n.tagName === "ol") {
        const start = Number(n.properties?.start ?? 1)
        ;(n.children ?? [])
          .filter((li) => li.tagName === "li")
          .forEach((li, i) => (li.properties = { ...li.properties, id: `endnote-${start + i}` }))
      }
    }
  }
}

// The source writes footnote markers as raw <sup>[n]</sup>; turn them into links
// instead of enabling raw HTML.
function prepare(md: string) {
  return md.replace(/<sup>\[(\d+)\]<\/sup>/g, "[$1](#endnote-$1)")
}

// The guides cite with superscript markers ("…the claim.<sup>[3]</sup>") that point at numbered endnotes ending in a URL.
// At each source's first citation, the bold phrase of the citing sentence becomes a link to that URL, so the source is
// one click from the words it supports. The marker and the endnote stay as they are.
function linkCitations(md: string) {
  const notes = md.split(/^#{1,6}\s+endnotes.*$/im)[1]
  if (!notes) return md
  const urls = new Map<string, string>()
  for (const item of notes.split(/^(?=\d+\.\s)/m)) {
    const n = item.match(/^(\d+)\./)?.[1]
    const url = item.match(/https?:\/\/[^\s)>\]]+/g)?.at(-1)
    if (n && url) urls.set(n, url.replace(/[.,;]$/, ""))
  }
  const seen = new Set<string>()
  let inNotes = false
  return md
    .split("\n")
    .map((line) => {
      if (/^#{1,6}\s+endnotes/i.test(line)) inNotes = true
      if (inNotes) return line
      let out = line
      const marker = /<sup>\[(\d+)\]<\/sup>/g
      for (let hit = marker.exec(out); hit; hit = marker.exec(out)) {
        const n = hit[1]
        const url = urls.get(n)
        if (!url || seen.has(n)) continue
        // The citing sentence: back from the marker (past its own full stop and any sibling markers) to the last sentence end.
        const before = out.slice(0, hit.index).replace(/(?:<sup>\[\d+\]<\/sup>|[\s.!?:;,)])+$/, "")
        // Link targets (dots in URLs) aren't sentence ends; mask them at the same length so positions still line up.
        const boundary = before.replace(/\]\([^)]*\)/g, (m) => "x".repeat(m.length)).search(/[.!?]\s+[^.!?]*$/)
        const start = boundary < 0 ? 0 : boundary + 1
        const bold = [...before.slice(start).matchAll(/\*\*([^*[\]]+)\*\*/g)].at(-1)
        if (!bold) continue
        seen.add(n)
        const at = start + bold.index!
        const linked = `**[${bold[1]}](${url})**`
        out = out.slice(0, at) + linked + out.slice(at + bold[0].length)
        marker.lastIndex += linked.length - bold[0].length
      }
      return out
    })
    .join("\n")
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Code spans, existing links, raw tags and bare URLs: nothing inside these gets linked.
const PROTECTED = /`[^`]*`|!?\[[^\]]*\]\([^)]*\)|<[^>]+>|https?:\/\/\S+/g

// Links the first mention of each page in `links` (by its title, e.g. "prompt caching") in the prose, so the
// sources listed at the bottom are also reachable where the text talks about them. Headings, code and
// everything from the endnotes on are left alone; one-word titles ("Hooks", "Pricing") are too generic to find.
function linkMentions(md: string, links: { title: string; source: string }[]) {
  const pending = links
    .map((l) => ({ ...l, phrase: l.title.replace(/^[^:]+:\s*/, "") }))
    .filter((l) => l.phrase.trim().split(/\s+/).length > 1 && !md.includes(`](${l.source}`))
  if (!pending.length) return md
  let fenced = false
  let stop = false
  return md
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
      if (fenced || stop || !pending.length) return line
      if (/^#{1,6}\s/.test(line)) {
        stop = /^#{1,6}\s+endnotes/i.test(line)
        return line
      }
      let out = ""
      let last = 0
      const link = (text: string): string => {
        for (let i = 0; i < pending.length; i++) {
          // "Context windows" should also find "context window", and the reverse.
          const stem = escapeRe(pending[i].phrase.replace(/s$/, ""))
          const re = new RegExp(`(?<![\\w-])${stem}s?(?![\\w-])`, "i")
          const m = text.match(re)
          if (!m || m.index === undefined) continue
          const { source } = pending.splice(i, 1)[0]
          return text.slice(0, m.index) + `[${m[0]}](${source})` + link(text.slice(m.index + m[0].length))
        }
        return text
      }
      for (const m of line.matchAll(PROTECTED)) {
        out += link(line.slice(last, m.index)) + m[0]
        last = m.index! + m[0].length
      }
      return out + link(line.slice(last))
    })
    .join("\n")
}

export function Markdown({
  source,
  slugs,
  mentions = [],
}: {
  source: string
  slugs: Map<string, string>
  mentions?: { title: string; source: string }[]
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug, rehypeEndnoteIds]}
      components={{
        a({ href = "", children }) {
          if (href.startsWith("#endnote-"))
            return (
              <sup className="footnote-ref">
                <a href={href}>{children}</a>
              </sup>
            )
          const to = resolveHref(href, slugs)
          if (!to) return <span className="underline decoration-dotted underline-offset-4">{children}</span>
          if (/^https?:/.test(to))
            return (
              <a href={to} target="_blank" rel="noreferrer">
                {children}
              </a>
            )
          return <Link href={to}>{children}</Link>
        },
        table({ children }) {
          return (
            <div className="not-prose-margin my-6 overflow-x-auto rounded-lg border">
              <table className="my-0! w-full">{children}</table>
            </div>
          )
        },
        img({ src, alt }) {
          if (typeof src !== "string" || !/^https?:/.test(src)) return null
          // eslint-disable-next-line @next/next/no-img-element
          return <img src={src} alt={alt ?? ""} className="rounded-lg border" />
        },
      }}
    >
      {prepare(linkMentions(linkCitations(source), mentions))}
    </ReactMarkdown>
  )
}
