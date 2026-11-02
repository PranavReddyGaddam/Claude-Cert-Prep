// Text helpers shared by the app and scripts/docs-terms.mjs, so they import nothing app-specific.
import GithubSlugger from "github-slugger"

// Sections of a doc (H2, or H2–H3 with depth 3), with the same ids rehype-slug gives them.
export function headings(md: string, depth = 2) {
  const slugger = new GithubSlugger()
  const out: { id: string; text: string }[] = []
  let fenced = false
  for (const line of md.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    if (fenced) continue
    const m = line.match(/^(#{1,3})\s+(.+)$/)
    if (!m) continue
    const text = m[2]
      .replace(/[*`]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim()
    const id = slugger.slug(text)
    if (m[1].length >= 2 && m[1].length <= depth) out.push({ id, text })
  }
  return out
}

const STOP = new Set(
  "the and for that with this you your are can not but from have will when what which into than then them they their there these those each also more most only such use used using one two its was were has had any all how why who our out may should would could about other over just like does don get set see".split(
    " "
  )
)

export function terms(md: string) {
  const tf = new Map<string, number>()
  const prose = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .toLowerCase()
  for (const w of prose.match(/[a-z][a-z0-9_]{2,}/g) ?? []) if (!STOP.has(w)) tf.set(w, (tf.get(w) ?? 0) + 1)
  return tf
}

// Term counts for an official docs page. What a page is about lives in its title, headings and opening,
// not in a long tail of reference detail that would make every big page look relevant to everything.
export function pageTerms(title: string, md: string) {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, "")
  const heads = headings(body, 3)
    .slice(0, 30)
    .map((h) => h.text)
    .join("\n")
  const lede = body
    .replace(/```[\s\S]*?```/g, " ")
    .split(/\s+/)
    .slice(0, 350)
    .join(" ")
  return terms(`${title}\n${title}\n${title}\n${heads}\n${lede}`)
}
