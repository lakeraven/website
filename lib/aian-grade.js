// Grades a state's published AI/AN exemption policy against the CMS requirements.
// Pure function: no I/O, so the rules can be tested on their own.

const MARKS = ["meets", "contradicts", "unpublished"];

function gradeState(state, rubric) {
  const required = rubric.requirements.map((r) => r.id);
  const marks = required.map((id) => {
    const c = (state.components || {})[id];
    // Absence of evidence is never a pass: missing component counts as unpublished.
    return c && MARKS.includes(c.mark) ? c.mark : "unpublished";
  });
  const met = marks.filter((m) => m === "meets").length;
  const contradicts = marks.filter((m) => m === "contradicts").length;
  const unpublished = marks.filter((m) => m === "unpublished").length;
  const counts = { met, contradicts, unpublished };

  if (state.status === "not_subject") return { grade: "Not subject", ...counts };
  if (state.unverified || unpublished >= rubric.not_graded_unpublished_min)
    return { grade: "Not graded", ...counts };
  if (contradicts >= 3) return { grade: "F", ...counts };
  if (contradicts === 2) return { grade: "D", ...counts };
  if (contradicts === 1 || met <= 4) return { grade: "C", ...counts };
  if (met >= 8) return { grade: "A", ...counts };
  return { grade: "B", ...counts };
}

module.exports = { gradeState, MARKS };
