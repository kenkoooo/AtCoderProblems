import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { Submission } from "../model/Submission";
import { MergedProblem } from "../model/MergedProblem";

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
      first_submission_id: 106882,
      solver_count: 4047,
      fastest_user_id: "rjttrw05",
      execution_time: 0,
      shortest_user_id: "x20",
      shortest_submission_id: 1111208,
      contest_id: "abc001",
      id: "abc001_1",
      fastest_submission_id: 1175983,
      first_user_id: "piyoko212",
      title: "A. 積雪深差",
      source_code_length: 12,
      fastest_contest_id: "",
      shortest_contest_id: "",
      first_contest_id: ""
    }
  ];

  jest.mock("superagent");
  let mockAgent = require("superagent");
  mockAgent.get.mockReturnValueOnce(new MockRequest(response));
  require("./ApiCall")
    .ApiCall.getMergedProblems("")
    .then((problems: MergedProblem[]) => {
      expect(problems).toEqual([
        {
          first_submission_id: 106882,
          solver_count: 4047,
          fastest_user_id: "rjttrw05",
          execution_time: 0,
          shortest_user_id: "x20",
          shortest_submission_id: 1111208,
          contestId: "abc001",
          id: "abc001_1",
          fastest_submission_id: 1175983,
          first_user_id: "piyoko212",
          title: "A. 積雪深差",
          source_code_length: 12
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
