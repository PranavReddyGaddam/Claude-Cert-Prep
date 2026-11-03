import "server-only"
import fs from "node:fs"
import path from "node:path"
import { headings, terms } from "@/lib/doc-terms"
import type { Bank, Domains, Question, Scenario } from "@/lib/quiz-types"
import { TRACKS, trackMeta, type TrackMeta } from "@/lib/tracks"

const ROOT = path.join(process.cwd(), "content")

export { headings }

export type Doc = { slug: string; title: string; body: string; words: number }
export type Book = { id: string; title: string; subtitle: string; docs: Doc[] }

function firstHeading(md: string, fallback: string) {
  const m = md.match(/^#\s+(.+)$/m)
  return m ? m[1].replace(/[*`]/g, "").trim() : fallback
}

function countWords(md: string) {
  return md.split(/\s+/).filter(Boolean).length
}

function dirDocs(dir: string, strip: (title: string) => string = (t) => t): Doc[] {
  const abs = path.join(ROOT, dir)
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const body = fs.readFileSync(path.join(abs, f), "utf8")
      const slug = f.replace(/\.md$/, "")
      return { slug, title: strip(firstHeading(body, slug)), body, words: countWords(body) }
    })
}

/* ---------- tracks ---------- */

export type Domain = { id: string; name: string; weight: number; objectives: string[] }
export type Track = TrackMeta & {
  shortName: string
  summary: string
  audience: string
  items: number
  minutes: number
  format: string
  domains: Domain[]
  // Lesson slugs in the curriculum's recommended order, with the domains each covers.
  lessons: { slug: string; domains: string[] }[]
}

type RawTrack = {
  shortName: string
  summary: string
  audience: string
  exam: { items: number; timeLimitMinutes: number; format: string }
  domains: Domain[]
  lessons: { path: string; domains: string[] }[]
}

const trackCache = new Map<string, Track>()

export function getTrack(id: string): Track | undefined {
  const meta = trackMeta(id)
  if (!meta) return undefined
  const cached = trackCache.get(id)
  if (cached) return cached
  const raw = readJson<RawTrack>(`tracks/${id}.json`)
  const track: Track = {
    ...meta,
    shortName: raw.shortName,
    summary: raw.summary,
    audience: raw.audience,
    items: raw.exam.items,
    minutes: raw.exam.timeLimitMinutes,
    format: raw.exam.format,
    domains: [...raw.domains].sort((a, b) => b.weight - a.weight),
    lessons: raw.lessons.map((l) => ({ slug: l.path.split("/").pop()!, domains: l.domains })),
  }
  trackCache.set(id, track)
  return track
}

export function availableTracks() {
  return TRACKS.filter((t) => t.available).map((t) => getTrack(t.id)!)
}

function domainMap(track: Track): Domains {
  return Object.fromEntries(track.domains.map((d) => [d.id, { name: d.name, weight: d.weight }]))
}

/* ---------- books ---------- */

let lessonPool: Map<string, Doc> | null = null
function lessonDoc(slug: string) {
  lessonPool ??= new Map(dirDocs("lessons").map((d) => [d.slug, d]))
  return lessonPool.get(slug)
}

/* ---------- official docs ---------- */

// The collected Anthropic pages aren't reproduced; each chapter points to the ones covering the same ground,
// picked by TF-IDF similarity between the chapter and every page in the track's manifest.
type DocsManifest = { pages: { slug: string; title: string; source: string }[] }
export type DocLink = { title: string; source: string }
type Vec = Map<string, number>

function vector(tf: Map<string, number>, idf: Map<string, number>): Vec {
  const v: Vec = new Map()
  let norm = 0
  for (const [w, n] of tf) {
    const x = (1 + Math.log(n)) * (idf.get(w) ?? 0)
    if (!x) continue
    v.set(w, x)
    norm += x * x
  }
  norm = Math.sqrt(norm) || 1
  for (const [w, x] of v) v.set(w, x / norm)
  return v
}

function cosine(a: Vec, b: Vec) {
  let sum = 0
  for (const [w, x] of a) sum += x * (b.get(w) ?? 0)
  return sum
}

const indexCache = new Map<string, { idf: Map<string, number>; pages: (DocLink & { v: Vec })[] }>()

function docsIndex(trackId: string) {
  const cached = indexCache.get(trackId)
  if (cached) return cached
  // Word counts per page, built from local copies of the pages by scripts/docs-terms.mjs (the pages stay out of git).
  const file = path.join(ROOT, "official-docs", `${trackId}.json`)
  const termsFile = path.join(ROOT, "official-docs", `${trackId}-terms.json`)
  const manifest = fs.existsSync(file) ? readJson<DocsManifest>(`official-docs/${trackId}.json`).pages : []
  const counts = fs.existsSync(termsFile)
    ? readJson<Record<string, Record<string, number>>>(`official-docs/${trackId}-terms.json`)
    : {}
  const raw = manifest.flatMap((p) =>
    counts[p.slug] ? [{ title: p.title, source: p.source, tf: new Map(Object.entries(counts[p.slug])) }] : []
  )
  const df = new Map<string, number>()
  for (const p of raw) for (const w of p.tf.keys()) df.set(w, (df.get(w) ?? 0) + 1)
  const idf = new Map([...df].map(([w, n]) => [w, Math.log((raw.length + 1) / (n + 0.5))]))
  const index = { idf, pages: raw.map((p) => ({ title: p.title, source: p.source, v: vector(p.tf, idf) })) }
  indexCache.set(trackId, index)
  return index
}

// Old hosts and paths the guides cite, rewritten to where those pages live now.
function canonical(url: string) {
  return url
    .replace(/[#?].*$/, "")
    .replace(/[/.,;:]+$/, "")
    .replace(/\.md$/, "")
    .replace(/^http:/, "https:")
    .replace(
      /^https:\/\/docs\.(?:anthropic|claude)\.com\/en\/docs\/(?:agents-and-tools\/)?claude-code\//,
      "https://code.claude.com/docs/en/"
    )
    .replace(/^https:\/\/docs\.(?:anthropic|claude)\.com\/(?:en\/)?(?:docs\/)?/, "https://platform.claude.com/docs/en/")
    .replace(/^https:\/\/anthropic\.com\//, "https://www.anthropic.com/")
    .replace(/^(https:\/\/modelcontextprotocol\.io\/specification\/)(?:draft|latest)\//, "$1latest/")
}

let titles: Map<string, string> | null = null

// Titles of every collected page, keyed by canonical URL (engineering posts answer to both of their addresses).
function knownTitles() {
  if (titles) return titles
  titles = new Map()
  for (const t of TRACKS) {
    const file = path.join(ROOT, "official-docs", `${t.id}.json`)
    if (!fs.existsSync(file)) continue
    for (const p of readJson<DocsManifest>(`official-docs/${t.id}.json`).pages) {
      const url = canonical(p.source).replace(/(specification\/)\d{4}-\d{2}-\d{2}\//, "$1latest/")
      titles.set(url, p.title)
      titles.set(url.replace("/research/", "/engineering/"), p.title)
      titles.set(url.replace("/engineering/", "/research/"), p.title)
    }
  }
  return titles
}

const GENERIC = new Set([
  "overview",
  "index",
  "latest",
  "create",
  "list",
  "python",
  "typescript",
  "basic",
  "discover",
  "changelog",
  "quickstart",
  "introduction",
])
const ACRONYMS: Record<string, string> = {
  api: "API",
  apis: "APIs",
  mcp: "MCP",
  sdk: "SDK",
  ai: "AI",
  json: "JSON",
  cli: "CLI",
  ci: "CI",
}

// A readable name for a cited page outside the collection, from its URL: "/agent-sdk/overview" -> "Agent SDK overview".
function humanize(url: string) {
  const parts = new URL(url).pathname.split("/").filter((p) => p && !/^(\d{4}-\d{2}-\d{2}|latest|draft)$/.test(p))
  const word = (seg: string) =>
    seg
      .replace(/^\d+-/, "")
      .split(/[-_]+/)
      .map((w) => ACRONYMS[w] ?? w)
      .join(" ")
      .replace(/ s /g, "'s ")
  const last = parts.at(-1) ?? ""
  const name = GENERIC.has(last) && parts.length > 1 ? `${word(parts.at(-2)!)} ${word(last)}` : word(last)
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const AREAS: [RegExp, string][] = [
  [/modelcontextprotocol\.io/, "MCP"],
  [/\/agent-sdk\//, "Agent SDK"],
  [/\/managed-agents\//, "Managed Agents"],
]

// "Hooks" alone could be Claude Code's or the Agent SDK's; name the product when the title doesn't.
function withArea(url: string, title: string) {
  const area = AREAS.find(([re]) => re.test(url))?.[1]
  return area && !title.toLowerCase().includes(area.toLowerCase()) ? `${area}: ${title}` : title
}

// The official pages a chapter itself cites, most-cited first.
function citedLinks(md: string): DocLink[] {
  const count = new Map<string, number>()
  const re = /https?:\/\/(?:[\w-]+\.)*(?:claude\.com|anthropic\.com|modelcontextprotocol\.io)\/[^\s)"'<>\]]*/g
  for (const m of md.matchAll(re)) {
    const url = canonical(m[0])
    if (!/\/\/[^/]+\/./.test(url) || /\/(home|en|docs|changelog)$/.test(url)) continue
    count.set(url, (count.get(url) ?? 0) + 1)
  }
  const known = knownTitles()
  // Ties go to pages in the collection: they're the ones checked against the exam blueprint.
  const score = (url: string) => (count.get(url) ?? 0) + (known.has(url) ? 0.5 : 0)
  return [...count]
    .sort((a, b) => score(b[0]) - score(a[0]))
    .map(([url]) => ({ title: withArea(url, known.get(url) ?? humanize(url)), source: url }))
}

/**
 * The official pages to read alongside a chapter: the ones it cites, most-cited first, or when it cites none,
 * the closest pages in the track's collection (the best match plus any nearly as close). At most three.
 */
export function officialLinks(trackId: string, doc: Doc): DocLink[] {
  const cited = citedLinks(doc.body)
  if (cited.length) return cited.slice(0, 3)
  const { idf, pages } = docsIndex(trackId)
  if (!pages.length) return []
  const v = vector(terms(`${doc.title} ${doc.title}\n${doc.body}`), idf)
  const ranked = pages.map((p) => ({ title: p.title, source: p.source, score: cosine(v, p.v) })).sort((a, b) => b.score - a.score)
  const best = ranked[0]?.score ?? 0
  if (best < 0.1) return []
  return ranked
    .filter((p) => p.score >= best * 0.7)
    .slice(0, 3)
    .map(({ title, source }) => ({ title, source }))
}

let devGuide: Doc[] | null = null
let architectNotes: Doc[] | null = null
let architectProNotes: Doc[] | null = null

const booksCache = new Map<string, Book[]>()

export function getBooks(trackId: string): Book[] {
  const cached = booksCache.get(trackId)
  if (cached) return cached
  const track = getTrack(trackId)
  if (!track?.available) return []
  const lessons = track.lessons.map((l) => lessonDoc(l.slug)).filter((d): d is Doc => !!d)
  const books: Book[] = []
  if (trackId === "ccdv-f") {
    devGuide ??= dirDocs("dev-guide")
    books.push({
      id: "guide",
      title: "Developer Guide",
      subtitle: `Practitioner guide · ${devGuide.length} chapters`,
      docs: devGuide,
    })
  }
  if (trackId === "ccar-p") {
    architectProNotes ??= dirDocs("architect-pro-notes")
    books.push({
      id: "pro-notes",
      title: "Architect Professional Notes",
      subtitle: `Original notes · ${architectProNotes.length} chapters`,
      docs: architectProNotes,
    })
  }
  if (trackId === "ccar-f") {
    architectNotes ??= dirDocs("architect-notes")
    books.push({
      id: "notes",
      title: "Architect Notes",
      subtitle: `Original notes · ${architectNotes.length} chapters`,
      docs: architectNotes,
    })
  }
  books.push({ id: "lessons", title: "Lessons", subtitle: `Curriculum route · ${lessons.length} lessons`, docs: lessons })
  booksCache.set(trackId, books)
  return books
}

export function getBook(trackId: string, bookId: string) {
  return getBooks(trackId).find((b) => b.id === bookId)
}

/* ---------- quizzes ---------- */

type RawAssessmentQ = {
  id: string
  domain: string
  objective: string
  type: "single" | "multiple"
  prompt: string
  options: string[]
  correct: number[]
  explanation: string
  references?: string[]
}

type RawLessonQ = {
  stage?: string
  question: string
  options: string[]
  correct: number | number[]
  explanation: string
}

function assessmentQuestion(q: RawAssessmentQ): Question {
  return {
    id: q.id,
    prompt: q.prompt,
    options: q.options,
    correct: q.correct,
    multi: q.type === "multiple",
    explanation: q.explanation,
    domain: q.domain,
    objective: q.objective,
    references: q.references,
  }
}

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8")) as T
}

const banksCache = new Map<string, Bank[]>()

export function getBanks(trackId: string): Bank[] {
  const cached = banksCache.get(trackId)
  if (cached) return cached
  const track = getTrack(trackId)
  if (!track?.available) return []
  const domains = domainMap(track)
  const banks: Bank[] = []

  const assessments: [string, string][] = [
    ["diagnostic", "Diagnostic"],
    ["mock-01", "Full Mock Exam"],
  ]
  for (const [id, title] of assessments) {
    // Optional banks exist for some tracks only.
    if (!fs.existsSync(path.join(ROOT, "assessments", trackId, `${id}.json`))) continue
    const raw = readJson<{ timeLimitMinutes: number; questions: RawAssessmentQ[] }>(`assessments/${trackId}/${id}.json`)
    banks.push({
      id,
      key: `${trackId}/${id}`,
      track: trackId,
      domains,
      title,
      subtitle: `${raw.questions.length} questions · ${raw.timeLimitMinutes} min`,
      kind: "assessment",
      timeLimitMinutes: raw.timeLimitMinutes,
      questions: raw.questions.map(assessmentQuestion),
    })
  }

  // Scenario sets: each file is one system description plus the questions set inside it.
  const scenarioDir = path.join(ROOT, "assessments", trackId, "scenarios")
  const scenarioFiles = fs.existsSync(scenarioDir)
    ? fs
        .readdirSync(scenarioDir)
        .filter((f) => f.endsWith(".json"))
        .sort()
    : []
  const scenarios: Scenario[] = []
  const scenarioQs: Question[] = []
  const perQuestion = track.minutes / track.items
  for (const file of scenarioFiles) {
    const raw = readJson<Scenario & { questions: RawAssessmentQ[] }>(`assessments/${trackId}/scenarios/${file}`)
    const scenario = { id: raw.id, title: raw.title, setup: raw.setup }
    const qs = raw.questions.map((q) => ({ ...assessmentQuestion(q), scenario: raw.id }))
    scenarios.push(scenario)
    scenarioQs.push(...qs)
    banks.push({
      id: `scenario-${raw.id}`,
      key: `${trackId}/scenario-${raw.id}`,
      track: trackId,
      domains,
      title: raw.title,
      subtitle: `Scenario · ${qs.length} questions`,
      kind: "scenario",
      timeLimitMinutes: Math.round(perQuestion * qs.length),
      questions: qs,
      scenarios: [scenario],
    })
  }
  const pick = Math.min(4, scenarios.length)
  if (pick) {
    const drawn = Math.round((scenarioQs.length / scenarios.length) * pick)
    banks.push({
      id: "exam-simulation",
      key: `${trackId}/exam-simulation`,
      track: trackId,
      domains,
      title: "Exam Simulation",
      subtitle: `${pick} random scenarios of ${scenarios.length} · ${drawn} questions · ${Math.round(perQuestion * drawn)} min`,
      kind: "assessment",
      timeLimitMinutes: Math.round(perQuestion * scenarioQs.length),
      questions: scenarioQs,
      scenarios,
      pickScenarios: pick,
    })
  }

  // Domain banks: standalone questions, one file per blueprint domain, for exams whose items are not
  // grouped into scenarios. The simulation draws a full-length exam from them in blueprint proportion.
  const bankDir = path.join(ROOT, "assessments", trackId, "bank")
  const bankFiles = fs.existsSync(bankDir)
    ? fs
        .readdirSync(bankDir)
        .filter((f) => f.endsWith(".json"))
        .sort((a, b) => (domains[b.slice(0, -5)]?.weight ?? 0) - (domains[a.slice(0, -5)]?.weight ?? 0))
    : []
  const bankQs: Question[] = []
  for (const file of bankFiles) {
    const raw = readJson<{ id: string; title: string; questions: RawAssessmentQ[] }>(`assessments/${trackId}/bank/${file}`)
    const qs = raw.questions.map(assessmentQuestion)
    bankQs.push(...qs)
    banks.push({
      id: `domain-${raw.id}`,
      key: `${trackId}/domain-${raw.id}`,
      track: trackId,
      domains,
      title: raw.title,
      subtitle: `${domains[raw.id]?.weight ?? 0}% of the exam · ${qs.length} questions`,
      kind: "domain",
      timeLimitMinutes: Math.round(perQuestion * qs.length),
      questions: qs,
    })
  }
  if (bankQs.length >= track.items) {
    banks.push({
      id: "exam-simulation",
      key: `${trackId}/exam-simulation`,
      track: trackId,
      domains,
      title: "Exam Simulation",
      subtitle: `${track.items} questions drawn from ${bankQs.length} by domain weight · ${track.minutes} min`,
      kind: "assessment",
      timeLimitMinutes: track.minutes,
      questions: bankQs,
      drawWeighted: track.items,
    })
  }

  const lessonQs: Question[] = []
  for (const { slug } of track.lessons) {
    const file = path.join(ROOT, "quizzes/lessons", `${slug}.json`)
    if (!fs.existsSync(file)) continue
    const raw = readJson<{ title?: string; questions: RawLessonQ[] }>(`quizzes/lessons/${slug}.json`)
    const title = raw.title ?? slug
    const qs = raw.questions.map((q, i): Question => {
      const correct = Array.isArray(q.correct) ? q.correct : [q.correct]
      return {
        id: `lesson-${slug}-${i}`,
        prompt: q.question,
        options: q.options,
        correct,
        multi: correct.length > 1,
        explanation: q.explanation,
        objective: title,
        lesson: slug,
      }
    })
    lessonQs.push(...qs)
    banks.push({
      id: `lesson-${slug}`,
      key: `lesson-${slug}`,
      track: trackId,
      domains,
      title,
      subtitle: `Lesson ${Number(slug.slice(0, 2))} · ${qs.length} questions`,
      kind: "lesson",
      questions: qs,
    })
  }

  banks.push({
    id: "all-lessons",
    key: `${trackId}/all-lessons`,
    track: trackId,
    domains,
    title: "All Lesson Questions",
    subtitle: `${lessonQs.length} questions across every lesson`,
    kind: "assessment",
    questions: lessonQs,
  })

  banksCache.set(trackId, banks)
  return banks
}

export function getBank(trackId: string, id: string) {
  return getBanks(trackId).find((b) => b.id === id)
}

// Every question in a track, once each (lesson questions appear in two banks).
export function trackQuestions(trackId: string) {
  const seen = new Map<string, Question>()
  for (const b of getBanks(trackId)) for (const q of b.questions) if (!seen.has(q.id)) seen.set(q.id, q)
  return [...seen.values()]
}
