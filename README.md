# Claude Cert Prep

A free, community study guide for the Claude certification exams: reading material, practice quizzes, and
scenario-based exam simulations that work the way the real exams do (a fixed system description, then a run of
questions set inside it).

Tracks:

- **Claude Certified Associate – Foundations (CCAO-F)**: original notes (14 chapters), lessons, a diagnostic, a full mock
  exam and a 120-question bank in seven domain sets. The exam simulation draws 60 questions in the blueprint's domain
  proportions.
- **Claude Certified Developer – Foundations (CCDV-F)**: developer guide, lessons, a diagnostic, a full mock exam
  and six practice scenarios.
- **Claude Certified Architect – Foundations (CCAR-F)**: original notes, lessons, a diagnostic, a full mock exam
  and six practice scenarios.
- **Claude Certified Architect – Professional (CCAR-P)**: original notes (13 chapters), lessons, and a 126-question
  bank in seven domain sets. The exam simulation draws 63 questions in the blueprint's domain proportions.

Progress is stored in your browser only. There are no accounts and no tracking.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Contributing questions

Scenario questions live in `content/assessments/<track>/scenarios/*.json`. Each file is one scenario with 15
questions. Standalone questions (used by CCAO-F and CCAR-P, whose exams have no shared scenarios) live in
`content/assessments/<track>/bank/<domain>.json`, one file per blueprint domain. Before opening a pull request, run the quality check, which rejects sets where the answer can be guessed
from the shape of the options (for example, when the correct answer is usually the longest or the shortest one):

```bash
python3 scripts/check-scenarios.py
```

Every fact should match Anthropic's official documentation, and every question should cite the page it relies on.

## Official docs links

Each chapter ends with links to the official documentation. Those links are chosen from
`content/official-docs/<track>-terms.json`. To rebuild that index, put local copies of the pages in
`content/official-docs/pages/` (they are not committed) and run `node scripts/docs-terms.mjs`.

## License and credits

- Application code: [MIT](LICENSE).
- Study material: see [content/LICENSE.md](content/LICENSE.md). The original notes and scenarios are CC BY-NC-SA
  4.0. The developer guide is by [V.Korostyshevskiy](https://github.com/vkorost/claude-certified-developer-guide)
  (CC BY-NC-SA 4.0). The lessons, quizzes and mock exams are from
  [Rohit Ghumare's AI Engineering from Scratch](https://github.com/rohitg00/ai-engineering-from-scratch) (MIT).

This is an unofficial community resource, not affiliated with or endorsed by Anthropic. Claude is a trademark of
Anthropic, PBC.
