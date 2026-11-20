# lakeraven/website

11ty site for lakeraven.com. GitHub Pages serves the committed `docs/` folder from `main`, so merging to main publishes. Rebuild with `npm ci && npm run build`, commit `docs/`, and run `npm test`.

## Rules

- **Every heading is linkable.** Every `h2`–`h4` must have a stable `id`, and its text links to that `id`. The build adds both (`lib/heading-anchors.js`), and `npm test` fails if a built page breaks the rule. Never rename an existing heading `id`; keep it explicitly if you change the heading text. Details in `CONTRIBUTING.md` under "Site rule: every heading is linkable".
