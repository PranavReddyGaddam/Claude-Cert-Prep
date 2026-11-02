import { Suspense } from "react"
import { notFound } from "next/navigation"
import { availableTracks, getBanks, getTrack, trackQuestions } from "@/lib/content"
import { Quiz } from "@/components/quiz"
import { QuizSkeleton } from "@/components/skeletons"

export function generateStaticParams() {
  return availableTracks().map((t) => ({ track: t.id }))
}

type Params = Promise<{ track: string }>

export default function MissedPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<QuizSkeleton />}>
      <Missed params={params} />
    </Suspense>
  )
}

async function Missed({ params }: { params: Params }) {
  const { track: id } = await params
  const track = getTrack(id)
  const banks = getBanks(id)
  if (!track || !banks.length) notFound()
  return (
    <Quiz
      missedOnly
      bank={{
        id: "missed",
        key: `${id}/missed`,
        track: id,
        domains: banks[0].domains,
        title: "Missed Questions",
        subtitle: "",
        kind: "assessment",
        questions: trackQuestions(id),
      }}
    />
  )
}
