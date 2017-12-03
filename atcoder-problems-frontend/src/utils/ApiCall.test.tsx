import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { Submission } from "../model/Submission";
import { MergedProblem } from "../model/MergedProblem";
import { RankPair } from "../model/RankPair";

class MockRequest {
  constructor(body: any, error?: any) {
    this.body = body;
    this.error = error;
  }
  get() {
    return this;
  }
  set() {
    return this;
  }
  query() {
    return this;
  }
  body: any = null;
  error: any = null;
  end = jest.fn().mockImplementation(callback => {
    callback(this.error, {
      status() {
        return 200;
      },
      ok() {
        return true;
      },
      get: jest.fn(),
      body: this.body,
      toError: jest.fn()
    });
  });
}

test("get and parse problems", () => {
  let response: any = [
    { id: "problem-id", title: "problem title", contest_id: "contest-id" }
  ];

  jest.mock("superagent");
  let mockAgent = require("superagent");
  mockAgent.get.mockReturnValueOnce(new MockRequest(response));
  require("./ApiCall")
    .ApiCall.getProblems()
    .then((problems: Problem[]) => {
      expect(problems).toEqual([
        {
          id: "problem-id",
          title: "problem title",
          contestId: "contest-id"
        }
      ]);
    });
});

test("get and parse merged problems", () => {
  let response: any = [
    {
      first_submission_id: 799003,
      solver_count: 34,
      fastest_user_id: "joisino",
      execution_time: 19,
      shortest_user_id: "august14",
      first_contest_id: "arc057",
      shortest_submission_id: 800119,
      fastest_contest_id: "arc057",
      contest_id: "arc057",
      id: "arc057_d",
      fastest_submission_id: 1002161,
      shortest_contest_id: "arc057",
      first_user_id: "tozangezan",
      title: "D. 全域木",
      source_code_length: 1079,
      point: 0.0,
      predict: 1.0
    }
  ];

  jest.mock("superagent");
  let mockAgent = require("superagent");
  mockAgent.get.mockReturnValueOnce(new MockRequest(response));
  require("./ApiCall")
    .ApiCall.getMergedProblems()
    .then((problems: MergedProblem[]) => {
      expect(problems).toEqual([
        {
          contestId: "arc057",
          execution_time: 19,
          fastest_contest_id: undefined,
          fastest_submission_id: 1002161,
          fastest_user_id: "joisino",
          first_contest_id: "arc057",
          first_submission_id: 799003,
          first_user_id: "tozangezan",
          id: "arc057_d",
          shortest_contest_id: "arc057",
          shortest_submission_id: 800119,
          shortest_user_id: "august14",
          solver_count: 34,
          source_code_length: 1079,
          title: "D. 全域木",
          point: 0.0,
          predict: 1.0
        }
      ]);
    });
});

test("get and parse contests", () => {
  let response: any = [
    { id: "contest-id", title: "contest title", start_epoch_second: 0 }
  ];

  jest.mock("superagent");
  let mockAgent = require("superagent");
  mockAgent.get.mockReturnValueOnce(new MockRequest(response));
  require("./ApiCall")
    .ApiCall.getContests()
    .then((contests: Contest[]) => {
      expect(contests).toEqual([
        {
          id: "contest-id",
          title: "contest title",
          start_epoch_second: 0
        }
      ]);
    });
});

test("get and parse submissions", () => {
  let response: any = [
    {
      point: 0,
      result: "CE",
      problem_id: "arc013_1",
      user_id: "iwiwi",
      epoch_second: 1363521837,
      id: 74283,
      language: "C (GCC 4.4.7)",
      length: 958
    },
    {
      execution_time: 27,
      point: 100,
      result: "AC",
      problem_id: "arc013_1",
      user_id: "iwiwi",
      epoch_second: 1363521844,
      id: 74285,
      language: "C++ (G++ 4.6.4)",
      length: 958
    }
  ];

  jest.mock("superagent");
  let mockAgent = require("superagent");
  mockAgent.get.mockReturnValueOnce(new MockRequest(response));
  require("./ApiCall")
    .ApiCall.getSubmissions("")
    .then((submissions: Submission[]) => {
      expect(submissions[0].id).toEqual(74283);
      expect(submissions[1].id).toEqual(74285);
    });
});

test("parse ranking", () => {
  let response: any = [
    {
      user_id: "AGE",
      problem_count: 3
    },
    {
      user_id: "Abcdefgprogrammi",
      problem_count: 1
    }
  ];

  jest.mock("superagent");
  let mockAgent = require("superagent");
  mockAgent.get.mockReturnValueOnce(new MockRequest(response));
  require("./ApiCall")
    .ApiCall.getRanking()
    .then((ranks: RankPair[]) => {
      expect(ranks[0]).toEqual({
        userId: "AGE",
        count: 3,
        rank: 1
      });
      expect(ranks[1]).toEqual({
        userId: "Abcdefgprogrammi",
        count: 1,
        rank: 2
      });
    });
});
