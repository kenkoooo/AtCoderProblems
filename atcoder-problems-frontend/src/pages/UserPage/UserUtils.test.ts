import { ProblemId } from "../../interfaces/Status";
import Submission from "../../interfaces/Submission";
import {
  rejectedProblemIdsFromArray,
  solvedProblemIds,
  solvedProblemIdsFromArray,
} from "./UserUtils";
const DEFAULT_SUBMISSION = {
  execution_time: null,
  point: 0,
  result: "",
  problem_id: "",
  user_id: "",
  epoch_second: 0,
  contest_id: "",
  id: 0,
  language: "",
  length: 0,
};

test("test UserUtils' functions", () => {
  const submissions: Submission[] = [
    {
      ...DEFAULT_SUBMISSION,
      result: "AC",
      problem_id: "problem_a",
    },
    {
      ...DEFAULT_SUBMISSION,
      result: "AC",
      problem_id: "problem_b",
    },
    {
      ...DEFAULT_SUBMISSION,
      result: "WA",
      problem_id: "problem_b",
    },
    {
      ...DEFAULT_SUBMISSION,
      result: "AC",
      problem_id: "problem_c",
    },
    {
      ...DEFAULT_SUBMISSION,
      result: "TLE",
      problem_id: "problem_d",
    },
  ];

  const submissionsMap: Map<ProblemId, Submission[]> = new Map([
    ["problem_a", [{ ...DEFAULT_SUBMISSION, result: "AC" }]],
    [
      "problem_b",
      [
        { ...DEFAULT_SUBMISSION, result: "WA" },
        { ...DEFAULT_SUBMISSION, result: "AC" },
      ],
    ],
    ["problem_c", [{ ...DEFAULT_SUBMISSION, result: "AC" }]],
    ["problem_d", [{ ...DEFAULT_SUBMISSION, result: "TLE" }]],
  ]);

  const solvedIds = solvedProblemIds(submissionsMap);
  expect(solvedIds.length).toBe(3);
  expect(solvedIds).toContain("problem_a");
  expect(solvedIds).toContain("problem_b");
  expect(solvedIds).toContain("problem_c");
  expect(solvedIds).not.toContain("problem_d");

  const solvedIdsFromArray = solvedProblemIdsFromArray(submissions);
  expect(solvedIdsFromArray.length).toBe(3);
  expect(solvedIdsFromArray).toContain("problem_a");
  expect(solvedIdsFromArray).toContain("problem_b");
  expect(solvedIdsFromArray).toContain("problem_c");
  expect(solvedIdsFromArray).not.toContain("problem_d");

  const rejectedIdsFromArray = rejectedProblemIdsFromArray(submissions);
  expect(rejectedIdsFromArray.length).toBe(1);
  expect(rejectedIdsFromArray).not.toContain("problem_a");
  expect(rejectedIdsFromArray).not.toContain("problem_b");
  expect(rejectedIdsFromArray).not.toContain("problem_c");
  expect(rejectedIdsFromArray).toContain("problem_d");
});
