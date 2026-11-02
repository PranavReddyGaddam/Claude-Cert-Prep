import { CertRing } from "@/components/cert-ring"

export default function Home() {
  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden px-4">
      <h1 className="sr-only">Claude Cert Study</h1>
      <CertRing />
    </div>
  )
}
