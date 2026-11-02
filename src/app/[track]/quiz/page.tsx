import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { availableTracks, getBanks, getTrack, trackQuestions } from "@/lib/content"
import { BestScore, MissedCount } from "@/components/stats"

export function generateStaticParams() {
  return availableTracks().map((t) => ({ track: t.id }))
}

type Params = Promise<{ track: string }>

function Row({ href, title, subtitle, right }: { href: string; title: string; subtitle: string; right: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="group flex items-baseline justify-between gap-6 py-2.5">
        <span className="min-w-0">
          <span className="font-heading text-lg font-medium underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-foreground">
            {title}
          </span>
          <span className="block text-sm text-muted-foreground">{subtitle}</span>
        </span>
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{right}</span>
      </Link>
    </li>
  )
}

export default function QuizIndexPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 pt-20 lg:pt-32" />}>
      <QuizIndex params={params} />
    </Suspense>
  )
}

async function QuizIndex({ params }: { params: Params }) {
  const { track: id } = await params
  const track = getTrack(id)
  const banks = getBanks(id)
  if (!track || !banks.length) notFound()
  // The simulation is the closest thing to the real exam, so it leads.
  const main = banks.filter((b) => b.kind === "assessment").sort((a, b) => Number(!!b.pickScenarios) - Number(!!a.pickScenarios))
  const scenarios = banks.filter((b) => b.kind === "scenario")
  const lessons = banks.filter((b) => b.kind === "lesson")
  return (
    <div className="mx-auto max-w-2xl px-6 pt-20 pb-24 sm:px-8 lg:pt-32">
      <p className="text-sm text-muted-foreground">{track.credential}</p>
      <h1 className="mt-3 text-5xl font-semibold tracking-[-0.03em]">Practice</h1>
      <p className="mt-6 text-lg text-muted-foreground">Answer with instant feedback, or sit a timed exam.</p>

      <h2 className="mt-20 mb-6 text-sm text-muted-foreground">Exams</h2>
      <ul>
        {main.map((b) => (
          <Row key={b.id} href={`/${id}/quiz/${b.id}`} title={b.title} subtitle={b.subtitle} right={<BestScore bankId={b.key} />} />
        ))}
        <Row
          href={`/${id}/quiz/missed`}
          title="Missed Questions"
          subtitle="Everything you've answered wrong, until you get it right"
          right={<MissedCount ids={trackQuestions(id).map((q) => q.id)} />}
        />
      </ul>

      {scenarios.length > 0 && (
        <>
          <h2 className="mt-20 mb-6 text-sm text-muted-foreground">By scenario</h2>
          <ul>
            {scenarios.map((b) => (
              <Row key={b.id} href={`/${id}/quiz/${b.id}`} title={b.title} subtitle={b.subtitle} right={<BestScore bankId={b.key} />} />
            ))}
          </ul>
        </>
      )}

      <h2 className="mt-20 mb-6 text-sm text-muted-foreground">By lesson</h2>
      <ul>
        {lessons.map((b) => (
          <Row key={b.id} href={`/${id}/quiz/${b.id}`} title={b.title} subtitle={b.subtitle} right={<BestScore bankId={b.key} />} />
        ))}
      </ul>
    </div>
  )
}
