import { SubmissionUtlis } from "./SubmissionUtils";
import { Submission } from "../model/Submission";

test("extract problems and results", () => {
  let submissions: Array<Submission> = [
    {
      id: 0,
      point: 0,
      result: "AC",
      problem_id: "ac_problem",
      user_id: "kenkoooo",
      language: "lang",
      execution_time: 10,
      epoch_second: 1,
      length: 2
    },
    {
      id: 0,
      point: 0,
      result: "WA",
      problem_id: "wa_problem",
      user_id: "kenkoooo",
      language: "lang",
      execution_time: 10,
      epoch_second: 1,
      length: 2
    },
    {
      id: 0,
      point: 0,
      result: "TLE",
      problem_id: "tle_problem",
      user_id: "kenkoooo",
      language: "lang",
      execution_time: 10,
      epoch_second: 1,
      length: 2
    },
    {
      id: 0,
      point: 0,
      result: "AC",
      problem_id: "iwi_problem",
      user_id: "iwiwi",
      language: "lang",
      execution_time: 10,
      epoch_second: 1,
      length: 2
    }
  ];
  expect(
    SubmissionUtlis.extractProblemIdsByUsers(submissions, new Set(["kenkoooo"]))
  ).toEqual(new Map([["ac_problem", "AC"]]));

  expect(
    SubmissionUtlis.extractProblemIdsByUsers(
      submissions,
      new Set(["kenkoooo"]),
      new Set(["WA", "TLE"])
    )
  ).toEqual(new Map([["wa_problem", "WA"], ["tle_problem", "TLE"]]));
});
