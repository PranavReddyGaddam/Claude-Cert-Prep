// Client-safe track metadata. Full exam details live in content/tracks/<id>.json.
export type TrackMeta = {
  id: string
  code: string
  credential: string
  name: string
  available: boolean
}

// Ordered clockwise from the top-left of the home-page ring.
export const TRACKS: TrackMeta[] = [
  { id: "ccao-f", code: "CCAO-F", credential: "Claude Certified Associate — Foundations", name: "Associate", available: false },
  { id: "ccdv-f", code: "CCDV-F", credential: "Claude Certified Developer — Foundations", name: "Developer", available: true },
  { id: "ccar-f", code: "CCAR-F", credential: "Claude Certified Architect — Foundations", name: "Architect", available: true },
  { id: "ccar-p", code: "CCAR-P", credential: "Claude Certified Architect — Professional", name: "Architect Pro", available: true },
]

export function trackMeta(id?: string) {
  return TRACKS.find((t) => t.id === id)
}
