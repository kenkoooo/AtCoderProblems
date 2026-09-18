import Problem from "../../../interfaces/Problem";
import { restoreOriginalContest } from "./OriginalContest";

const adtProblem: Problem = {
  id: "abc212_e",
  contest_id: "adt_all_20231220_1",
  problem_index: "H",
  name: "Safety Journey",
};
const contestToProblems = new Map([
  ["abc212", [{ ...adtProblem, problem_index: "E" }]],
  ["adt_all_20231220_1", [adtProblem]],
]);

describe("Restore the original contest for recommendations", () => {
  it("restores the contest and index of an ABC problem reused in ADT", () => {
    expect(restoreOriginalContest(adtProblem, contestToProblems)).toEqual({
      ...adtProblem,
      contest_id: "abc212",
      problem_index: "E",
    });
    expect(adtProblem.contest_id).toBe("adt_all_20231220_1");
    expect(adtProblem.problem_index).toBe("H");
  });

  it("uses the contest mapping for legacy numeric task IDs", () => {
    const problem = { ...adtProblem, id: "abc001_1" };
    const contests = new Map([
      ["abc001", [{ ...problem, problem_index: "A" }]],
    ]);
    expect(restoreOriginalContest(problem, contests)).toMatchObject({
      contest_id: "abc001",
      problem_index: "A",
    });
  });

  it("keeps non-ADT contest associations unchanged", () => {
    const problem = { ...adtProblem, contest_id: "another_contest" };
    expect(restoreOriginalContest(problem, contestToProblems)).toBe(problem);
  });

  it("keeps the available metadata while contest mappings are loading", () => {
    expect(restoreOriginalContest(adtProblem, undefined)).toBe(adtProblem);
  });

  it("does not infer an original contest without a matching problem", () => {
    expect(restoreOriginalContest(adtProblem, new Map())).toBe(adtProblem);
    const contests = new Map([
      ["abc212", [{ ...adtProblem, id: "abc212_a", problem_index: "A" }]],
    ]);
    expect(restoreOriginalContest(adtProblem, contests)).toBe(adtProblem);
  });
});
