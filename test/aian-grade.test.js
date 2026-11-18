const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { gradeState } = require("../lib/aian-grade");

const rubric = yaml.load(fs.readFileSync(path.join(__dirname, "../aian-scorecard/data/rubric.yaml"), "utf8"));
const ids = rubric.requirements.map((r) => r.id);
const make = (marks) => ({ components: Object.fromEntries(ids.map((id, i) => [id, { mark: marks[i] }])) });
const M = "meets", C = "contradicts", U = "unpublished";

test("all nine met is A", () => assert.equal(gradeState(make(Array(9).fill(M)), rubric).grade, "A"));
test("eight met, one unpublished is A", () => assert.equal(gradeState(make([...Array(8).fill(M), U]), rubric).grade, "A"));
test("seven met is B", () => assert.equal(gradeState(make([...Array(7).fill(M), U, U]), rubric).grade, "B"));
test("five met is B", () => assert.equal(gradeState(make([...Array(5).fill(M), U, U, U, U]), rubric).grade, "B"));
test("four met, none contradicted is C", () => assert.equal(gradeState(make([...Array(4).fill(M), ...Array(5).fill(U)]), rubric).grade, "C"));
test("eight met with one contradiction is C", () => assert.equal(gradeState(make([...Array(8).fill(M), C]), rubric).grade, "C"));
test("two contradictions is D", () => assert.equal(gradeState(make([...Array(7).fill(M), C, C]), rubric).grade, "D"));
test("three contradictions is F", () => assert.equal(gradeState(make([...Array(6).fill(M), C, C, C]), rubric).grade, "F"));
test("seven unpublished is Not graded, never a pass", () => assert.equal(gradeState(make([M, M, ...Array(7).fill(U)]), rubric).grade, "Not graded"));
test("missing components count as unpublished", () => {
  const r = gradeState({ components: {} }, rubric);
  assert.equal(r.grade, "Not graded");
  assert.equal(r.unpublished, 9);
});
test("unknown mark strings count as unpublished, not met", () => {
  const r = gradeState(make(Array(9).fill("pass")), rubric);
  assert.equal(r.met, 0);
  assert.equal(r.grade, "Not graded");
});
test("unverified state is Not graded", () => assert.equal(gradeState({ ...make(Array(9).fill(M)), unverified: true }, rubric).grade, "Not graded"));
test("not_subject state is Not subject", () => assert.equal(gradeState({ status: "not_subject", components: {} }, rubric).grade, "Not subject"));
test("best practice does not affect the grade", () => {
  const s = make(Array(9).fill(M));
  s.components.tribal_or_clinic_channel = { mark: C };
  assert.equal(gradeState(s, rubric).grade, "A");
});
