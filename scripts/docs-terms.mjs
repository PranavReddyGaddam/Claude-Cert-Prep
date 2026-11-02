// Rebuilds content/official-docs/<track>-terms.json from local copies of the official docs pages.
//
// The pages themselves (content/official-docs/pages/) are Anthropic's and stay out of git; the app picks
// "read the official docs" links from these word counts instead, so a fresh clone builds the same site.
//
//     node scripts/docs-terms.mjs

import fs from "node:fs"
import path from "node:path"
import { pageTerms } from "../src/lib/doc-terms.ts"

const DOCS = path.join(import.meta.dirname, "..", "content", "official-docs")

for (const file of fs.readdirSync(DOCS).filter((f) => /^[a-z0-9-]+\.json$/.test(f) && !f.endsWith("-terms.json"))) {
  const { pages } = JSON.parse(fs.readFileSync(path.join(DOCS, file), "utf8"))
  const out = {}
  let missing = 0
  for (const p of pages) {
    const f = path.join(DOCS, "pages", `${p.slug}.md`)
    if (!fs.existsSync(f)) {
      missing++
      continue
    }
    const tf = [...pageTerms(p.title, fs.readFileSync(f, "utf8"))].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    out[p.slug] = Object.fromEntries(tf)
  }
  const target = file.replace(/\.json$/, "-terms.json")
  fs.writeFileSync(path.join(DOCS, target), JSON.stringify(out) + "\n")
  console.log(`${target}: ${Object.keys(out).length} pages${missing ? `, ${missing} missing locally` : ""}`)
}
