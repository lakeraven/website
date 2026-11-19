// Builds the AI/AN Medicaid scorecard from aian-scorecard/data.
// Grades are computed here from the evidence files; no grade is ever typed by hand.
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { gradeState } = require("../lib/aian-grade");

const dir = path.join(__dirname, "../aian-scorecard/data");
const load = (f) => yaml.load(fs.readFileSync(f, "utf8"));

module.exports = function () {
  const rubric = load(path.join(dir, "rubric.yaml"));
  const problems = [];
  const states = fs
    .readdirSync(path.join(dir, "states"))
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => {
      const s = load(path.join(dir, "states", f));
      // Every "meets" or "contradicts" must trace to a published source.
      for (const [id, c] of Object.entries(s.components || {})) {
        if (c.mark !== "unpublished" && !(c.url && c.quote))
          problems.push(`${s.state}.${id}: ${c.mark} needs a quote and url`);
      }
      const result = gradeState(s, rubric);
      const requirements = rubric.requirements.map((r) => ({
        ...r,
        ...((s.components || {})[r.id] || { mark: "unpublished" }),
      }));
      const bestPractices = rubric.best_practices.map((r) => ({
        ...r,
        ...((s.components || {})[r.id] || { mark: "unpublished" }),
      }));
      return { ...s, slug: s.state.toLowerCase(), ...result, requirements, bestPractices };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // How each state raises its grade: for every requirement it does not meet, the fix, the grade it
  // would reach with only that fix, and model language from a state whose policy meets it.
  const byCode = Object.fromEntries(states.map((s) => [s.state, s]));
  for (const r of rubric.requirements) {
    const m = byCode[r.model];
    const c = m && m.requirements.find((x) => x.id === r.id);
    if (!c || c.mark !== "meets") problems.push(`rubric.${r.id}: model state ${r.model} must meet this requirement`);
  }
  const withMark = (s, id, mark) => ({ ...s, components: { ...(s.components || {}), [id]: { mark } } });
  for (const s of states) {
    if (s.status === "not_subject") { s.improvements = []; s.fixContradicts = []; s.fixUnpublished = []; continue; }
    s.improvements = s.requirements.filter((r) => r.mark !== "meets").map((r) => {
      const m = byCode[r.model];
      const mc = m.requirements.find((x) => x.id === r.id);
      return {
        id: r.id, label: r.label, short: r.short, citation: r.citation, mark: r.mark, fix: r.fix,
        gradeIfFixed: gradeState(withMark(s, r.id, "meets"), rubric).grade,
        model: { state: m.state, name: m.name, slug: m.slug, quote: mc.quote, url: mc.url },
      };
    });
    // Contradictions first: fixing one lowers the contradiction count and raises the score together.
    s.improvements.sort((a, b) => (a.mark === "contradicts" ? 0 : 1) - (b.mark === "contradicts" ? 0 : 1));
    // Smallest set of fixes, in that order, that reaches a better grade.
    const rank = ["A", "B", "C", "D", "F", "Not graded"];
    s.nextStep = null;
    let t = s;
    for (let k = 0; k < s.improvements.length; k++) {
      t = withMark(t, s.improvements[k].id, "meets");
      const g = gradeState(t, rubric).grade;
      if (rank.indexOf(g) < rank.indexOf(s.grade)) {
        s.nextStep = { grade: g, fixes: s.improvements.slice(0, k + 1).map((i) => i.label) };
        break;
      }
    }
    s.fixContradicts = s.improvements.filter((i) => i.mark === "contradicts");
    s.fixUnpublished = s.improvements.filter((i) => i.mark === "unpublished");
    s.gradeIfAllFixed = gradeState({ ...s, components: Object.fromEntries(rubric.requirements.map((r) => [r.id, { mark: "meets" }])) }, rubric).grade;
  }

  // Impact: estimated exemptable people, as 0-5 dots on a log scale (see rubric.impact).
  const pop = Object.fromEntries(
    fs.readFileSync(path.join(dir, "population.csv"), "utf8").trim().split("\n").slice(1)
      .map((line) => line.split(",")).map((c) => [c[0], Number(c[2])])
  );
  const imp = rubric.impact;
  for (const s of states) {
    if (!(s.state in pop)) { problems.push(`${s.state}: no population row`); continue; }
    const est = pop[s.state] * imp.subject_share;
    // Three significant figures, so the shown number never crosses a dot boundary the dots do not (e.g. 39,935 shows as 39,900, not 40,000).
    const rounded = Number(est.toPrecision(3));
    const subject = s.status !== "not_subject";
    // One whole dot per dot_size, rounded down; under dot_size shows a single half dot (Kimball, 18 Nov 2026).
    const full = subject ? Math.floor(est / imp.dot_size) : 0;
    const part = subject && full === 0 ? 0.5 : 0;
    s.impact = { population: pop[s.state], estimate: rounded, full, part, published: (imp.published || {})[s.state] || null };
  }

  if (problems.length) throw new Error("AI/AN scorecard evidence is missing sources:\n" + problems.join("\n"));

  const order = ["A", "B", "C", "D", "F", "Not graded", "Not subject"];
  const counts = order.map((g) => ({ grade: g, n: states.filter((s) => s.grade === g).length }));
  const lastChecked = states.map((s) => s.checked).filter(Boolean).sort().pop();
  // Quantitative summary over states subject to the expansion-group rules.
  const subject = states.filter((s) => s.status !== "not_subject");
  const total = rubric.requirements.length;
  const mets = subject.map((s) => s.met).sort((x, y) => x - y);
  const mid = Math.floor(mets.length / 2);
  const median = mets.length % 2 ? mets[mid] : (mets[mid - 1] + mets[mid]) / 2;
  const summary = {
    subject: subject.length,
    total,
    allMet: subject.filter((s) => s.met === total).length,
    median,
    anyContradiction: subject.filter((s) => s.contradicts > 0).length,
    tribalChannel: subject.filter((s) => s.bestPractices.some((b) => b.id === "tribal_or_clinic_channel" && b.mark === "meets")).length,
  };
  // Roster order: by score (most met, then fewest contradicted, then fewest silent), then name.
  const ranked = [...subject].sort((a, b) => b.met - a.met || a.contradicts - b.contradicts || a.unpublished - b.unpublished || a.name.localeCompare(b.name))
    .concat(states.filter((s) => s.status === "not_subject"));
  return { rubric, states, ranked, counts, lastChecked, summary };
};
