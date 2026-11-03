"""Quality gate for question files: content/assessments/<track>/scenarios/*.json (one scenario, 15 questions)
and content/assessments/<track>/bank/*.json (standalone questions for one domain, any number).

Fails a file when the answer can be guessed from the shape of the options rather than their content.

    python3 scripts/check-scenarios.py [file ...]   (no args: every scenario and bank file)
"""

import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "content"
QUESTIONS = 15
MAX_LONGEST = 5  # correct option may be the single longest (or the single shortest) in at most 5 of 15
MAX_RATIO = 1.12  # mean correct length / mean distractor length
MIN_RATIO = 0.9  # and no trimming the correct option until it is the tell
MAX_POSITION = 6  # no answer slot used more than 6 times in 15
MIN_EXPLANATION = 280


def check(path: Path) -> list[str]:
    errs: list[str] = []
    track = path.parent.parent.name
    blueprint = json.loads((ROOT / "tracks" / f"{track}.json").read_text())
    objectives = {d["id"]: set(d["objectives"]) for d in blueprint["domains"]}
    data = json.loads(path.read_text())
    bank = path.parent.name == "bank"
    for key in ("id", "title", "questions") if bank else ("id", "title", "setup", "questions"):
        if not data.get(key):
            errs.append(f"missing '{key}'")
    qs = data.get("questions", [])
    if bank and len(qs) < 8:
        errs.append(f"{len(qs)} questions, expected at least 8")
    if not bank and len(qs) != QUESTIONS:
        errs.append(f"{len(qs)} questions, expected {QUESTIONS}")

    longest = 0
    shortest = 0
    ratios = []
    positions: Counter[int] = Counter()
    ids = set()
    for q in qs:
        qid = q.get("id", "?")
        if qid in ids:
            errs.append(f"{qid}: duplicate id")
        ids.add(qid)
        opts, correct = q.get("options", []), q.get("correct", [])
        multi = q.get("type") == "multiple"
        if q.get("type") not in ("single", "multiple"):
            errs.append(f"{qid}: type must be single or multiple")
        if len(opts) != (5 if multi else 4):
            errs.append(f"{qid}: {len(opts)} options ({'5 for multiple' if multi else '4 for single'})")
        if not correct or len(correct) != (2 if multi else 1) or any(not 0 <= c < len(opts) for c in correct):
            errs.append(f"{qid}: bad 'correct' {correct}")
            continue
        if q.get("domain") not in objectives:
            errs.append(f"{qid}: unknown domain {q.get('domain')}")
        elif q.get("objective") not in objectives[q["domain"]]:
            errs.append(f"{qid}: objective not in blueprint: {q.get('objective')}")
        if len(q.get("explanation", "")) < MIN_EXPLANATION:
            errs.append(f"{qid}: explanation too short to justify every distractor")
        refs = q.get("references") or []
        if not refs or not all(r.startswith("https://") for r in refs):
            errs.append(f"{qid}: references must be official https URLs")
        if len(q.get("prompt", "")) < 160:
            errs.append(f"{qid}: prompt too thin; give the concrete case")

        lens = [len(o) for o in opts]
        wrong = [n for i, n in enumerate(lens) if i not in correct]
        right = [lens[c] for c in correct]
        if max(lens) in right and lens.count(max(lens)) == 1:
            longest += 1
        if min(lens) in right and lens.count(min(lens)) == 1:
            shortest += 1
        ratios.append((sum(right) / len(right)) / (sum(wrong) / len(wrong)))
        if min(lens) < 0.6 * max(lens):
            errs.append(f"{qid}: option lengths too uneven ({min(lens)} vs {max(lens)} chars)")
        if not multi:
            positions[correct[0]] += 1

    # Scenario limits are set for 15 questions; a bank of any size gets the same proportions.
    max_longest = MAX_LONGEST * len(qs) / QUESTIONS if bank else MAX_LONGEST
    max_position = max(MAX_POSITION, round(sum(positions.values()) * 0.4)) if bank else MAX_POSITION
    if qs:
        if longest > max_longest:
            errs.append(f"correct option is the longest in {longest}/{len(qs)} (max {max_longest:.0f})")
        if shortest > max_longest:
            errs.append(f"correct option is the shortest in {shortest}/{len(qs)} (max {max_longest:.0f})")
        ratio = sum(ratios) / len(ratios)
        if ratio < MIN_RATIO:
            errs.append(f"correct options average {ratio:.2f}x distractor length (min {MIN_RATIO})")
        if ratio > MAX_RATIO:
            errs.append(f"correct options average {ratio:.2f}x distractor length (max {MAX_RATIO})")
        if positions and max(positions.values()) > max_position:
            errs.append(f"answer positions unbalanced: {dict(sorted(positions.items()))}")
    return errs


def main() -> None:
    files = [Path(a).resolve() for a in sys.argv[1:]] or sorted(ROOT.glob("assessments/*/scenarios/*.json")) + sorted(
        ROOT.glob("assessments/*/bank/*.json")
    )
    failed = 0
    for f in files:
        errs = check(f)
        print(f"{'FAIL' if errs else 'ok  '} {f.relative_to(ROOT)}")
        for e in errs:
            print(f"     - {e}")
        failed += bool(errs)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
