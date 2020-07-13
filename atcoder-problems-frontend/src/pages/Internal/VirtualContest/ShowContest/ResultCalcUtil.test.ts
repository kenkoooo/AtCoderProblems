import Submission from "../../../../interfaces/Submission";
import { reduceUserContestResult } from "./ResultCalcUtil";

test("reduce user's submissions", () => {
  const PROBLEM_ID = "abc999_z";
  const makeSubmission = (
    id: number,
    point: number,
    result: string,
    epoch_second: number
  ): Submission => ({
    id,
    point,
    result,
    epoch_second,
    execution_time: 0,
    problem_id: PROBLEM_ID,
    user_id: "tourism",
    contest_id: "AtCoder Blizzard Contest 999",
    language: "Rust",
    length: 0,
  });

  const submissions = [makeSubmission(0, 0, "WA", 100)];
  expect(reduceUserContestResult(submissions).get(PROBLEM_ID)).toEqual({
    trials: 1,
    penalties: 0,
    accepted: false,
    point: 0,
    lastUpdatedEpochSecond: 100,
  });

  submissions.push(makeSubmission(1, 0, "WA", 200));
  expect(reduceUserContestResult(submissions).get(PROBLEM_ID)).toEqual({
    trials: 2,
    penalties: 0,
    accepted: false,
    point: 0,
    lastUpdatedEpochSecond: 100,
  });

  submissions.push(makeSubmission(2, 30, "WA", 300));
  expect(reduceUserContestResult(submissions).get(PROBLEM_ID)).toEqual({
    trials: 3,
    penalties: 2,
    accepted: false,
    point: 30,
    lastUpdatedEpochSecond: 300,
  });

  submissions.push(makeSubmission(3, 30, "WA", 400));
  expect(reduceUserContestResult(submissions).get(PROBLEM_ID)).toEqual({
    trials: 4,
    penalties: 2,
    accepted: false,
    point: 30,
    lastUpdatedEpochSecond: 300,
  });

  submissions.push(makeSubmission(4, 100, "AC", 500));
  expect(reduceUserContestResult(submissions).get(PROBLEM_ID)).toEqual({
    trials: 5,
    penalties: 4,
    accepted: true,
    point: 100,
    lastUpdatedEpochSecond: 500,
  });

  submissions.push(makeSubmission(5, 100, "AC", 600));
  expect(reduceUserContestResult(submissions).get(PROBLEM_ID)).toEqual({
    trials: 6,
    penalties: 4,
    accepted: true,
    point: 100,
    lastUpdatedEpochSecond: 500,
  });

  submissions.push(makeSubmission(6, 120, "AC", 700));
  expect(reduceUserContestResult(submissions).get(PROBLEM_ID)).toEqual({
    trials: 7,
    penalties: 6,
    accepted: true,
    point: 120,
    lastUpdatedEpochSecond: 700,
  });
});
