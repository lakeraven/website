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
