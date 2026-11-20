// Site-wide rule: every h2–h4 gets a stable id and a visible "#" link so
// people can link straight to a section. Runs as an Eleventy transform on
// every HTML page, so it covers Markdown, Nunjucks and Liquid alike.
//
// - An id already on a heading (hand-written, or from markdown-it-anchor)
//   is kept as is, so existing links keep working.
// - Headings without an id get a readable slug of their text, made unique
//   on the page (-2, -3, ... on a clash with any id on the page).
// - The "#" link is added unless the heading already has one, sits inside
//   another link (nested links are invalid HTML), or opts out with
//   data-anchor="off". Opting out skips the link only, never the id.

const LEVELS = "234";
const HEADING_RE = /<h([1-6])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', ndash: "-", mdash: "-", hellip: "...",
};

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function headingText(inner) {
  return decodeEntities(inner.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function escapeAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function getAttr(attrs, name) {
  const m = (attrs || "").match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4]) : null;
}

// How many <a> elements are open at `index` (to avoid nesting links).
function linkDepthAt(html, index) {
  const before = html.slice(0, index);
  const opens = (before.match(/<a[\s>]/gi) || []).length;
  const closes = (before.match(/<\/a\s*>/gi) || []).length;
  return opens - closes;
}

function addHeadingAnchors(html) {
  const used = new Set();
  for (const m of html.matchAll(/\sid\s*=\s*["']([^"']+)["']/gi)) used.add(m[1]);

  const unique = (base) => {
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };

  return html.replace(HEADING_RE, (whole, level, attrs = "", inner, offset) => {
    if (!LEVELS.includes(level)) return whole;
    const text = headingText(inner);
    let id = getAttr(attrs, "id");
    if (!id) {
      id = unique(slugify(text));
      attrs = ` id="${id}"${attrs}`;
    }
    const optOut = getAttr(attrs, "data-anchor") === "off";
    const hasLink = /class="[^"]*\bheading-anchor\b/.test(inner);
    if (optOut || hasLink || linkDepthAt(html, offset) > 0) return `<h${level}${attrs}>${inner}</h${level}>`;
    const label = escapeAttr(`Link to this section: ${text}`);
    const link = ` <a class="heading-anchor" href="#${escapeAttr(id)}" aria-label="${label}"><span aria-hidden="true">#</span></a>`;
    return `<h${level}${attrs}>${inner.replace(/\s+$/, "")}${link}</h${level}>`;
  });
}

// For the build check: h2–h4 headings that have no id.
function headingsMissingIds(html) {
  const missing = [];
  for (const m of html.matchAll(HEADING_RE)) {
    if (LEVELS.includes(m[1]) && !getAttr(m[2], "id")) missing.push(headingText(m[3]));
  }
  return missing;
}

// For the build check: h2–h4 ids that are used more than once on the page
// (by another heading or any other element), so a link could land wrong.
function duplicateIds(html) {
  const count = new Map();
  for (const m of html.matchAll(/\sid\s*=\s*["']([^"']+)["']/gi)) count.set(m[1], (count.get(m[1]) || 0) + 1);
  const dupes = new Set();
  for (const m of html.matchAll(HEADING_RE)) {
    const id = LEVELS.includes(m[1]) && getAttr(m[2], "id");
    if (id && count.get(id) > 1) dupes.add(id);
  }
  return [...dupes];
}

module.exports = { addHeadingAnchors, headingsMissingIds, duplicateIds, slugify, headingText };
