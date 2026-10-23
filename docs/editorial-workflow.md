# Editorial review workflow

Nothing becomes "human-reviewed" automatically. The only path is a decisions file written by a named person.

## Steps
1. Open the live site's **Editorial review** page (`#/review`, also linked in the footer). It lists every item that still needs review: measure explanations, candidate profiles, debate maps, the Thought Atlas, values tradeoffs, the judicial guide, the record example and explainers. Each shows its sources, when it was last checked, and open questions.
2. Click through to each item and its sources. For each, choose **Approve**, **Request corrections** or **Reject**. Corrections and rejections need a note. Enter your name.
3. Click **Download decisions file**. Choices exist only in your browser until you download.
4. In a clone of the repository, run:
   ```sh
   npm run review:apply -- path/to/review-decisions-YYYY-MM-DD.json --dry-run   # preview
   npm run review:apply -- path/to/review-decisions-YYYY-MM-DD.json             # apply
   npm run health && npm test && npm run build
   ```
   then commit and push (`data/elections/colorado-2026.json`, `data/review/decisions.json`, `docs/`).

## What each decision does
| Decision | Measure explanations | Everything else |
| --- | --- | --- |
| Approve | Status becomes `reviewed` with your name and date; the "not human-reviewed" label disappears | Logged in `data/review/decisions.json`; the item shows as human-reviewed on the dashboard |
| Request corrections | Your note is added to the item's check notes; it stays visible with its label | Logged |
| Reject | Status becomes `needs-re-review` and the explanation is **hidden**; your note is recorded | Logged and flagged |

The script refuses a file with unknown items, a missing name, or a missing note on a non-approval, and the result must still validate against the data schema. Tests assert that the shipped log is empty and that no other code path can set `reviewed`.
