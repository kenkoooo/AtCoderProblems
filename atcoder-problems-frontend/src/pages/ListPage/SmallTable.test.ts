import MergedProblem from "../../interfaces/MergedProblem";
import Submission from "../../interfaces/Submission";
import { getTotalCount, getUserPointCounts } from "./SmallTable";
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
const DEFAULT_MERGED_PROBLEMS: MergedProblem = {
  id: "",
  contest_id: "",
  title: "",
  first_user_id: null,
  first_contest_id: null,
  first_submission_id: null,
  fastest_user_id: null,
  fastest_contest_id: null,
  fastest_submission_id: null,
  execution_time: null,
  shortest_user_id: null,
  shortest_contest_id: null,
  shortest_submission_id: null,
  source_code_length: null,
  solver_count: null,
  point: null,
};

test("test SmallTable's functions", () => {
  const mergedProblems = new Map([
    ["problem_a", { ...DEFAULT_MERGED_PROBLEMS, id: "problem_a", point: 100 }],
    ["problem_b", { ...DEFAULT_MERGED_PROBLEMS, id: "problem_b", point: 200 }],
    ["problem_c", { ...DEFAULT_MERGED_PROBLEMS, id: "problem_c", point: null }],
  ]);
  const submissions: Submission[] = [
    {
      ...DEFAULT_SUBMISSION,
      user_id: "user_1",
      result: "AC",
      problem_id: "problem_a",
    },
    {
      ...DEFAULT_SUBMISSION,
      user_id: "user_1",
      result: "AC",
      problem_id: "problem_b",
    },
    {
      ...DEFAULT_SUBMISSION,
      user_id: "user_1",
      result: "AC",
      problem_id: "problem_b",
    },
    {
      ...DEFAULT_SUBMISSION,
      user_id: "user_2",
      result: "AC",
      problem_id: "problem_a",
    },
    {
      ...DEFAULT_SUBMISSION,
      user_id: "user_2",
      result: "WA",
      problem_id: "problem_b",
    },
    {
      ...DEFAULT_SUBMISSION,
      user_id: "user_2",
      result: "AC",
      problem_id: "problem_c",
    },
    {
      ...DEFAULT_SUBMISSION,
      user_id: "user_3",
      result: "AC",
      problem_id: "problem_c",
    },
    {
      ...DEFAULT_SUBMISSION,
      user_id: "user_4",
      result: "WA",
      problem_id: "problem_a",
    },
  ];

  const totalCount = getTotalCount(mergedProblems);
  expect(totalCount.length).toBe(2);
  expect(totalCount[0]).toStrictEqual({ point: 100, count: 1 });
  expect(totalCount[1]).toStrictEqual({ point: 200, count: 1 });

  const userPointCounts = getUserPointCounts(mergedProblems, submissions);
  expect(userPointCounts.length).toBe(3);
  expect(userPointCounts[0].userId).toBe("user_1");
  expect(userPointCounts[0].countByPoint.get(100)).toBe(1);
  expect(userPointCounts[0].countByPoint.get(200)).toBe(1);
  expect(userPointCounts[1].userId).toBe("user_2");
  expect(userPointCounts[1].countByPoint.get(100)).toBe(1);
  expect(userPointCounts[1].countByPoint.get(200)).toBe(undefined);
  expect(userPointCounts[2].userId).toBe("user_3");
  expect(userPointCounts[2].countByPoint.get(100)).toBe(undefined);
  expect(userPointCounts[2].countByPoint.get(200)).toBe(undefined);
});
