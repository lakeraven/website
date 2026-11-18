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

test("impact dots: California is 5, states not subject get none, every other state 1 to 5", () => {
  const ca = data.states.find((s) => s.state === "CA");
  assert.strictEqual(ca.impact.dots, 5);
  for (const s of data.states) {
    if (s.status === "not_subject") assert.strictEqual(s.impact.dots, 0, s.state);
    else assert.ok(s.impact.dots >= 1 && s.impact.dots <= 5, s.state);
  }
});
