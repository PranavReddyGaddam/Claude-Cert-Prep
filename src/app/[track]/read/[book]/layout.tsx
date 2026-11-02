import { Suspense } from "react"
import { getBook } from "@/lib/content"
import { trackMeta } from "@/lib/tracks"
import { BookNav } from "@/components/reader-bits"

type Params = Promise<{ track: string; book: string }>

// "Chapter 3: Messages, ..." -> 3 / "Messages, ..."; lessons carry their number in the slug.
function split(title: string, slug: string, isLesson: boolean) {
  const m = title.match(/^(?:Chapter\s+)?(\d+)[:.]\s*(.+)$/i)
  if (m) return { n: m[1], title: m[2] }
  return { n: isLesson ? String(Number(slug.slice(0, 2))) : "", title }
}

async function Chapters({ params }: { params: Params }) {
  const { track, book: bookId } = await params
  const book = getBook(track, bookId)
  if (!book) return null
  const meta = trackMeta(track)
  return (
    <BookNav
      title={book.title}
      back={{ href: `/${track}`, label: meta ? `${meta.name} overview` : "Overview" }}
      items={book.docs.map((d) => ({
        id: `${book.id}/${d.slug}`,
        href: `/${track}/read/${book.id}/${d.slug}`,
        ...split(d.title, d.slug, book.id === "lessons"),
      }))}
    />
  )
}

export default function BookLayout({ children, params }: LayoutProps<"/[track]/read/[book]">) {
  return (
    <div className="mx-auto flex w-full max-w-7xl gap-10 px-4 py-8 sm:px-8 lg:py-12">
      <aside className="hidden w-56 shrink-0 xl:block">
        <Suspense>
          <Chapters params={params} />
        </Suspense>
      </aside>
      {children}
    </div>
  )
}
