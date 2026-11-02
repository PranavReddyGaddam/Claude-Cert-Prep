import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"
import { trackMeta } from "@/lib/tracks"
import { availableTracks, getBook, getBooks, headings, officialLinks } from "@/lib/content"
import { Markdown } from "@/components/markdown"
import { BackLink, MarkRead, ScrollProgress, Toc } from "@/components/reader-bits"
import { Stage, TransitionLink } from "@/components/page-transition"

export function generateStaticParams() {
  return availableTracks().flatMap((t) =>
    getBooks(t.id).flatMap((b) => b.docs.map((d) => ({ track: t.id, book: b.id, slug: d.slug })))
  )
}

export async function generateMetadata({ params }: { params: Params }) {
  const { track, book, slug } = await params
  const doc = getBook(track, book)?.docs.find((d) => d.slug === slug)
  return { title: doc ? `${doc.title} · Claude Cert Study` : "Claude Cert Study" }
}

type Params = Promise<{ track: string; book: string; slug: string }>

export default function ReadPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ReaderSkeleton />}>
      <Reader params={params} />
    </Suspense>
  )
}

function ReaderSkeleton() {
  return (
    <div className="reader-column mx-auto w-full animate-pulse">
      <div className="mb-8 h-4 w-48 rounded bg-muted" />
      <div className="mb-4 h-10 w-4/5 rounded bg-muted" />
      <div className="mb-10 h-10 w-3/5 rounded bg-muted" />
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="mb-3 h-4 rounded bg-muted" style={{ width: `${70 + ((i * 37) % 30)}%` }} />
      ))}
    </div>
  )
}

async function Reader({ params }: { params: Params }) {
  const { track, book: bookId, slug } = await params
  const book = getBook(track, bookId)
  const idx = book?.docs.findIndex((d) => d.slug === slug) ?? -1
  if (!book || idx < 0) notFound()
  const doc = book.docs[idx]
  const prev = book.docs[idx - 1]
  const next = book.docs[idx + 1]

  const slugs = new Map<string, string>()
  for (const b of getBooks(track)) for (const d of b.docs) slugs.set(d.slug, `/${track}/read/${b.id}/${d.slug}`)

  const meta = trackMeta(track)
  const back = { href: `/${track}`, label: meta ? `${meta.name} overview` : "Overview" }
  const minutes = Math.max(1, Math.round(doc.words / 230))
  const toc = headings(doc.body)
  const official = officialLinks(track, doc)

  return (
    <>
      <ScrollProgress />
      <div className="flex min-w-0 flex-1 gap-10">
        <article data-page className="min-w-0 flex-1">
          <Stage className="reader-column mx-auto">
            {/* The left column carries the back link on wide screens. */}
            <BackLink href={back.href} label={back.label} className="mb-6 text-sm xl:hidden" />
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>{book.title}</span>
                <span>·</span>
                <span className="tabular-nums">
                  {idx + 1} / {book.docs.length}
                </span>
                <span>·</span>
                <span>{minutes} min read</span>
              </div>
            </div>

            <div className="reader prose max-w-none">
              <Markdown source={doc.body} slugs={slugs} mentions={official} />
            </div>

            {official.length > 0 && (
              <section className="mt-14 border-t pt-8">
                <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">For detailed info, read the official docs</h2>
                <ul className="mt-4 space-y-3">
                  {official.map((o) => (
                    <li key={o.source}>
                      <a
                        href={o.source}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-baseline gap-1.5 font-heading font-medium transition-colors hover:text-muted-foreground"
                      >
                        {o.title}
                        <ArrowUpRight className="size-3.5 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                      <div className="text-xs text-muted-foreground">{new URL(o.source).hostname.replace(/^www\./, "")}</div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-14 flex justify-center">
              <MarkRead id={`${book.id}/${doc.slug}`} />
            </div>

            <nav className="mt-10 flex items-center justify-between border-t pt-8 text-sm">
              {prev ? <PageLink href={`/${track}/read/${book.id}/${prev.slug}`} title={prev.title} dir="prev" /> : <span />}
              {next && <PageLink href={`/${track}/read/${book.id}/${next.slug}`} title={next.title} dir="next" />}
            </nav>
          </Stage>
        </article>

        {toc.length > 1 && <Toc items={toc} />}
      </div>
    </>
  )
}

// A link with a hand-drawn underline that bows deeper on hover; the destination's title shows in a pill above it.
function PageLink({ href, title, dir }: { href: string; title: string; dir: "prev" | "next" }) {
  return (
    <TransitionLink
      href={href}
      step={dir === "prev" ? -1 : 1}
      className="group relative inline-flex items-center gap-1.5 focus-visible:outline-none"
    >
      {dir === "prev" && <ArrowLeft className="size-3.5" />}
      <span className="relative">
        {dir === "prev" ? "Previous" : "Next"}
        {/* The underline is a shallow arc that sags further on hover. */}
        <svg
          aria-hidden
          viewBox="0 -1 100 6"
          preserveAspectRatio="none"
          className="pointer-events-none absolute top-[calc(100%+3px)] left-0 h-1.5 w-full overflow-visible fill-none stroke-current stroke-[1.25] opacity-40 transition-opacity duration-400 [stroke-linecap:round] group-hover:opacity-80 group-focus-visible:opacity-80"
        >
          <path
            d="M 0 -0.25 C 27 2.5 70 2.2 100 -0.5"
            vectorEffect="non-scaling-stroke"
            className="transition-[d] duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:[d:path('M_0_-0.25_C_27_4.5_70_3.96_100_-0.5')] group-focus-visible:[d:path('M_0_-0.25_C_27_4.5_70_3.96_100_-0.5')] motion-reduce:transition-none"
          />
        </svg>
      </span>
      {dir === "next" && <ArrowRight className="size-3.5" />}
      <span
        className={`pointer-events-none absolute bottom-full mb-3 w-max max-w-[min(22rem,80vw)] translate-y-1 rounded-full bg-foreground px-3.5 py-1.5 text-xs leading-snug text-background no-underline opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 ${dir === "prev" ? "left-0" : "right-0"}`}
      >
        <span className="block truncate">{title}</span>
      </span>
    </TransitionLink>
  )
}
