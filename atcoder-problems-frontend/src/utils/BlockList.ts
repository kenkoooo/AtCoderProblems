import { ProblemId } from "../interfaces/Status";

const BLOCK_LIST = [
  "future_contest_2020_final_2_b",
  "future_contest_2020_qual_b",
  "future_contest_2019_final_b",
  "future_contest_2019_qual_b",
  "future2018career_b",
  "future_contest_2020_final_b"
];

export const isBlockedProblem = (problemId: ProblemId): boolean =>
  BLOCK_LIST.includes(problemId);
