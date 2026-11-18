const test = require("node:test");
const assert = require("node:assert");
const data = require("../_data/aianScorecard.js")();

test("every graded state below A has a path to a better grade", () => {
  for (const s of data.states) {
    if (s.status === "not_subject" || s.grade === "A") continue;
    assert.ok(s.nextStep, `${s.state} has no next step`);
    assert.strictEqual(s.gradeIfAllFixed, "A", `${s.state} fixing everything should earn an A`);
  }
});

test("each open requirement has a fix and model language from a state that meets it", () => {
  for (const s of data.states) {
    for (const i of s.improvements) {
      assert.ok(i.fix, `${s.state}.${i.id} has no fix text`);
      const m = data.states.find((x) => x.state === i.model.state);
      assert.strictEqual(m.requirements.find((r) => r.id === i.id).mark, "meets");
      assert.ok(i.model.quote && i.model.url);
    }
  }
});

test("contradictions are listed before unpublished requirements", () => {
  for (const s of data.states) {
    const marks = s.improvements.map((i) => i.mark);
    const firstUnpub = marks.indexOf("unpublished");
    if (firstUnpub >= 0) assert.ok(!marks.slice(firstUnpub).includes("contradicts"), s.state);
  }
});

test("impact dots are to scale: one per 10,000, California shows 7 whole dots", () => {
  const ca = data.states.find((s) => s.state === "CA");
  assert.strictEqual(ca.impact.full, 7);
  for (const s of data.states) {
    if (s.status === "not_subject") { assert.strictEqual(s.impact.full + s.impact.part, 0, s.state); continue; }
    const est = s.impact.population * data.rubric.impact.subject_share;
    assert.ok(Math.abs((s.impact.full + s.impact.part) * 10000 - est) <= 100, s.state);
  }
});
