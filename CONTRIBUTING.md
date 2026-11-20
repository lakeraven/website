# Welcome!

We're so glad you're thinking about contributing to a [open source project of the U.S. government](https://code.gov/)! If you're unsure about anything, just ask -- or submit the issue or pull request anyway. The worst that can happen is you'll be politely asked to change something. We love all friendly contributions.

We encourage you to read this project's CONTRIBUTING policy (you are here), its [LICENSE](LICENSE.md), and its [README](README.md).

## Policies

We want to ensure a welcoming environment for all of our projects. Our staff follow the [TTS Code of Conduct](https://18f.gsa.gov/code-of-conduct/) and all contributors should do the same.

We adhere to the [18F Open Source Policy](https://github.com/18f/open-source-policy). If you have any questions, just [shoot us an email](mailto:18f@gsa.gov).

As part of a U.S. government agency, the General Services Administration (GSA)’s Technology Transformation Services (TTS) takes seriously our responsibility to protect the public’s information, including financial and personal information, from unwarranted disclosure. For more information about security and vulnerability disclosure for our projects, please read our [18F Vulnerability Disclosure Policy](https://18f.gsa.gov/vulnerability-disclosure-policy/).

## Public domain

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request or issue, you are agreeing to comply with this waiver of copyright interest.

## Site rule: every heading is linkable

Every `h2`, `h3` and `h4` on lakeraven.com has a stable `id`, and the heading text itself is a link to it, so people can link straight to a section (for example `/aian-medicaid-scorecard/ca/#raise`). This is enforced in the build, not page by page:

- `lib/heading-anchors.js` runs as an Eleventy transform on every HTML page (Markdown, Nunjucks and Liquid). It keeps any `id` a heading already has, gives the rest a readable slug of their text (made unique on the page with `-2`, `-3`), and wraps the heading text in a link to that `id`. The link looks like the heading until it is hovered or focused, when it is underlined (keyboard focus also shows the focus ring). Its accessible name is the heading text, so screen readers hear nothing extra.
- Markdown headings get their ids from `markdown-it-anchor` (configured in `.eleventy.js`), so ids on existing posts don't change.
- `npm test` includes a build check (`test/heading-anchors.test.js`) that fails if any built page in `docs/` has an `h2`–`h4` without an `id`, or a heading `id` used twice on a page. Run `npm run build` before `npm test`.

When you write a page:

- Don't rename an existing heading `id`. People and other pages link to it. If you change a heading's text, keep the old `id` by writing it explicitly (`<h2 id="old-id">New text</h2>`).
- Give a heading an explicit short `id` when you link to it from elsewhere (as the scorecard does with `#raise`, `#history`, `#submit`).
- To leave the link off one heading (a hero slogan, say), add `data-anchor="off"`. The heading still gets an `id`.
- A heading that already contains a link (like a blog post title in a list), or sits inside one (a whole clickable card), gets an `id` but no section link, because links can't be nested.
