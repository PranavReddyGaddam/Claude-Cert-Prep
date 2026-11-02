export type Question = {
  id: string
  prompt: string
  options: string[]
  correct: number[]
  multi: boolean
  explanation: string
  domain?: string
  objective?: string
  lesson?: string
  // Id of the scenario this question sits in; its setup is shown above the question.
  scenario?: string
  references?: string[]
}

export type Scenario = { id: string; title: string; setup: string }

export type Bank = {
  id: string
  // Storage key for attempts: unique across tracks ("ccdv-f/diagnostic"); lesson quizzes are shared.
  key: string
  track: string
  domains: Domains
  title: string
  subtitle: string
  kind: "assessment" | "lesson" | "scenario"
  timeLimitMinutes?: number
  questions: Question[]
  scenarios?: Scenario[]
  // Exam simulation: each attempt draws this many whole scenarios at random.
  pickScenarios?: number
}

export type Domains = Record<string, { name: string; weight: number }>

export function domainName(domains: Domains, id?: string) {
  return id ? (domains[id]?.name ?? id) : "General"
}
