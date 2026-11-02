import { Suspense } from "react"
import { notFound } from "next/navigation"
import { availableTracks, getBank, getBanks } from "@/lib/content"
import { Quiz } from "@/components/quiz"
import { QuizSkeleton } from "@/components/skeletons"

export function generateStaticParams() {
  return availableTracks().flatMap((t) => getBanks(t.id).map((b) => ({ track: t.id, id: b.id })))
}

type Params = Promise<{ track: string; id: string }>

export default function QuizPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<QuizSkeleton />}>
      <QuizLoader params={params} />
    </Suspense>
  )
}

async function QuizLoader({ params }: { params: Params }) {
  const { track, id } = await params
  const bank = getBank(track, id)
  if (!bank) notFound()
  return <Quiz bank={bank} />
}
