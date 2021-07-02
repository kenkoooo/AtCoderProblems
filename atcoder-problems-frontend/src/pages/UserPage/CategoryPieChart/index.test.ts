import Submission from "../../../interfaces/Submission";
import {
  decideStatusFromSubmissions,
  statusCounter,
  SubmissionStatus,
  StatusCount,
} from "./index";

describe("test decideStatusFromSubmissions", () => {
  it("when undefine", () => {
    const submissions = undefined;
    expect(decideStatusFromSubmissions(submissions)).toBe(
      SubmissionStatus.TRYING
    );
  });

  it("when AC and WA", () => {
    const submissions: Submission[] = [
      {
        contest_id: "nikkei2019-qual",
        epoch_second: 1548591364,
        execution_time: 17,
        id: 4101008,
        language: "Python3 (3.4.3)",
        length: 268,
        point: 100,
        problem_id: "nikkei2019_qual_a",
        result: "AC",
        user_id: "user",
      },
      {
        contest_id: "nikkei2019-qual",
        epoch_second: 1548591080,
        execution_time: 17,
        id: 4100112,
        language: "Python3 (3.4.3)",
        length: 289,
        point: 0,
        problem_id: "nikkei2019_qual_a",
        result: "WA",
        user_id: "user",
      },
    ];
    expect(decideStatusFromSubmissions(submissions)).toBe(
      SubmissionStatus.ACCEPTED
    );
  });

  it("when 1 RE", () => {
    const submissions: Submission[] = [
      {
        contest_id: "diverta2019-2",
        epoch_second: 1560606350,
        execution_time: 230,
        id: 5934813,
        language: "PyPy3 (2.4.0)",
        length: 2148,
        point: 0,
        problem_id: "diverta2019_2_c",
        result: "RE",
        user_id: "user",
      },
    ];
    expect(decideStatusFromSubmissions(submissions)).toBe(
      SubmissionStatus.REJECTED
    );
  });
});

describe("test statusCounter", () => {
  it("when ACCEPTED", () => {
    const counter: StatusCount = {
      solved: 0,
      rejected: 0,
      total: 0,
    };
    const status: SubmissionStatus = SubmissionStatus.ACCEPTED;

    statusCounter(counter, status);
    expect(counter).toEqual({
      solved: 1,
      rejected: 0,
      total: 1,
    } as StatusCount);
  });

  it("when REJECTED", () => {
    const counter: StatusCount = {
      solved: 0,
      rejected: 0,
      total: 0,
    };
    const status: SubmissionStatus = SubmissionStatus.REJECTED;

    statusCounter(counter, status);
    expect(counter).toEqual({
      solved: 0,
      rejected: 1,
      total: 1,
    } as StatusCount);
  });

  it("when TRYING", () => {
    const counter: StatusCount = {
      solved: 0,
      rejected: 0,
      total: 0,
    };
    const status: SubmissionStatus = SubmissionStatus.TRYING;

    statusCounter(counter, status);
    expect(counter).toEqual({
      solved: 0,
      rejected: 0,
      total: 1,
    } as StatusCount);
  });
});
