const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { addHeadingAnchors, headingsMissingIds, duplicateIds, slugify } = require("../lib/heading-anchors");

test("adds a readable id and makes the heading text the link", () => {
  const out = addHeadingAnchors('<h2 class="x">How we help</h2>');
  assert.strictEqual(out, '<h2 id="how-we-help" class="x"><a class="heading-anchor" href="#how-we-help">How we help</a></h2>');
});

test("a heading that already contains a link keeps it and gets only the id", () => {
  const out = addHeadingAnchors('<h3><a href="/post">Post title</a></h3>');
  assert.strictEqual(out, '<h3 id="post-title"><a href="/post">Post title</a></h3>');
});

test("keeps an existing id so old links keep working", () => {
  const out = addHeadingAnchors('<h2 id="raise">How to raise this grade</h2>');
  assert.strictEqual(out, '<h2 id="raise"><a class="heading-anchor" href="#raise">How to raise this grade</a></h2>');
});

test("makes generated ids unique on the page, including against existing ids", () => {
  const out = addHeadingAnchors('<p id="history"></p><h3>History</h3><h3>History</h3>');
  assert.match(out, /<h3 id="history-2">/);
  assert.match(out, /<h3 id="history-3">/);
  assert.deepStrictEqual(duplicateIds(out), []);
});

test("slugs read well: entities, apostrophes, line breaks, accents", () => {
  assert.strictEqual(slugify("Build your team’s capacity"), "build-your-teams-capacity");
  const out = addHeadingAnchors("<h2>Lakeraven:<br/>Native-owned &amp; health IT.</h2><h3>Build your team&rsquo;s capacity</h3>");
  assert.match(out, /id="lakeraven-native-owned-health-it"/);
  assert.match(out, /id="build-your-teams-capacity"/);
});

test("does not nest a link inside a link, but still adds the id", () => {
  const out = addHeadingAnchors('<a href="/x"><h3>Card</h3></a>');
  assert.strictEqual(out, '<a href="/x"><h3 id="card">Card</h3></a>');
});

test("data-anchor=off skips the link, never the id", () => {
  const out = addHeadingAnchors('<h2 data-anchor="off">Hero</h2>');
  assert.strictEqual(out, '<h2 id="hero" data-anchor="off">Hero</h2>');
});

test("leaves h1, h5 and h6 alone and is idempotent", () => {
  const html = "<h1>Title</h1><h4>Four</h4><h5>Five</h5>";
  const once = addHeadingAnchors(html);
  assert.ok(once.startsWith("<h1>Title</h1>"));
  assert.ok(once.endsWith("<h5>Five</h5>"));
  assert.strictEqual(addHeadingAnchors(once), once);
});

// Build check: every built page must follow the rule. Run `npm run build` first.
test("built site: every h2–h4 has an id, and no page has duplicate ids", () => {
  const root = path.join(__dirname, "..", "docs");
  const pages = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".html")) pages.push(p);
    }
  };
  walk(root);
  assert.ok(pages.length > 0, "no built pages in docs/; run npm run build");
  const problems = [];
  for (const p of pages) {
    const html = fs.readFileSync(p, "utf8");
    const rel = path.relative(root, p);
    for (const h of headingsMissingIds(html)) problems.push(`${rel}: heading without id: "${h}"`);
    for (const id of duplicateIds(html)) problems.push(`${rel}: duplicate id "${id}"`);
  }
  assert.deepStrictEqual(problems, []);
});

test("recognizes link closing tags split across lines", () => {
  const out = addHeadingAnchors('<a href="/"\n>Home</a\n><h2>Next</h2>');
  assert.match(out, /class="heading-anchor"/);
});
