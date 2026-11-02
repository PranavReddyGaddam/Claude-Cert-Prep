import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getBanks, getBooks, getTrack, trackQuestions } from "@/lib/content"
import { TRACKS } from "@/lib/tracks"
import { BestScore, MissedCount, ReadCount, ResetProgress } from "@/components/stats"

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.id }))
}

type Params = Promise<{ track: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const track = getTrack((await params).track)
  return { title: track ? `${track.code} · Claude Cert Study` : "Claude Cert Study" }
}

// Developer Guide chapters per CCDV-F domain (the guide's own coverage map).
const GUIDE_CHAPTERS: Record<string, string> = {
  "applications-integration": "Ch. 3, 15–18, 23",
  "model-selection-optimization": "Ch. 1, 2, 4, 8",
  "agents-workflows": "Ch. 12, 13",
  "prompt-context-engineering": "Ch. 5–7",
  "tools-mcps": "Ch. 9–11",
  "security-safety": "Ch. 20–22",
  "claude-code": "Ch. 14",
  "eval-testing-debugging": "Ch. 19",
}

const SOURCES: Record<string, { href: string; name: string; license?: string }[]> = {
  "ccdv-f": [
    {
      href: "https://github.com/vkorost/claude-certified-developer-guide",
      name: "vkorost/claude-certified-developer-guide",
      license: "CC BY-NC-SA 4.0",
    },
    {
      href: "https://github.com/rohitg00/ai-engineering-from-scratch",
      name: "rohitg00/ai-engineering-from-scratch",
      license: "MIT",
    },
  ],
  "ccar-f": [
    {
      href: "https://github.com/rohitg00/ai-engineering-from-scratch",
      name: "rohitg00/ai-engineering-from-scratch",
      license: "MIT",
    },
  ],
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-20">
      <h2 className="mb-6 text-sm text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

function Item({ href, title, meta }: { href: string; title: string; meta: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="group flex items-baseline justify-between gap-6 py-2.5">
        <span className="font-heading text-lg font-medium underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-foreground">
          {title}
        </span>
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{meta}</span>
      </Link>
    </li>
  )
}

export default function TrackPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 pt-20 lg:pt-32" />}>
      <TrackHome params={params} />
    </Suspense>
  )
}

async function TrackHome({ params }: { params: Params }) {
  const { track: id } = await params
  const track = getTrack(id)
  if (!track) notFound()
  const books = getBooks(id)
  const banks = getBanks(id)
  const bank = (b: string) => banks.find((x) => x.id === b)
  const lessonNo = (slug: string) => Number(slug.slice(0, 2))

  return (
    <div className="mx-auto max-w-2xl px-6 pt-20 pb-24 sm:px-8 lg:pt-32">
      <p className="text-sm text-muted-foreground">{track.credential}</p>
      <h1 className="mt-3 text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">{track.shortName}</h1>
      <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">{track.summary}</p>
      <p className="mt-6 text-sm text-muted-foreground tabular-nums">
        {track.items} questions · {track.minutes} minutes · 720 of 1000 to pass
      </p>

      {track.available ? (
        <>
          <Section title="Practice">
            <ul>
              {["exam-simulation", "diagnostic", "mock-01"].map((b) => {
                const x = bank(b)
                const title = b === "exam-simulation" ? "Exam simulation" : b === "mock-01" ? "Full mock exam" : "Diagnostic"
                return (
                  x && (
                    <Item
                      key={b}
                      href={`/${id}/quiz/${b}`}
                      title={title}
                      meta={<BestScore bankId={x.key} fallback={`${x.questions.length} questions`} />}
                    />
                  )
                )
              })}
              <Item
                href={`/${id}/quiz/missed`}
                title="Questions you missed"
                meta={<MissedCount ids={trackQuestions(id).map((q) => q.id)} />}
              />
              <Item
                href={`/${id}/quiz`}
                title="Quizzes by lesson"
                meta={`${banks.filter((b) => b.kind === "lesson").length} quizzes`}
              />
            </ul>
          </Section>

          <Section title="Read">
            <ul>
              {books.map((b) => (
                <Item
                  key={b.id}
                  href={`/${id}/read/${b.id}/${b.docs[0].slug}`}
                  title={b.title}
                  meta={<ReadCount prefix={b.id} slugs={b.docs.map((d) => d.slug)} />}
                />
              ))}
            </ul>
          </Section>
        </>
      ) : (
        <p className="mt-20 text-lg">Material for this exam is on its way.</p>
      )}

      <Section title="Where the marks are">
        <ul>
          {track.domains.map((d) => {
            const lessons = track.lessons
              .filter((l) => l.domains.includes(d.id) && lessonNo(l.slug) < 29)
              .map((l) => lessonNo(l.slug))
            const refs = id === "ccdv-f" ? GUIDE_CHAPTERS[d.id] : lessons.length ? `Lessons ${lessons.join(", ")}` : ""
            return (
              <li key={d.id} className="flex items-baseline gap-4 py-2">
                <span className="flex-1">{d.name}</span>
                <span className="hidden text-right text-sm text-muted-foreground sm:inline">{refs}</span>
                <span className="w-14 text-right tabular-nums">{d.weight.toFixed(1)}%</span>
              </li>
            )
          })}
        </ul>
      </Section>

      <footer className="mt-24 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {SOURCES[id] && (
          <p>
            Material from{" "}
            {SOURCES[id].map((s, i) => (
              <span key={s.href}>
                {i > 0 && " and "}
                <a className="underline underline-offset-4 hover:text-foreground" href={s.href} target="_blank" rel="noreferrer">
                  {s.name}
                </a>
                {s.license && ` (${s.license})`}
              </span>
            ))}
            .
          </p>
        )}
        <p>Progress is saved in your browser only.</p>
        <ResetProgress />
      </footer>
    </div>
  )
}
