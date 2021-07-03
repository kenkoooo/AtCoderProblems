import Contest from "../../../interfaces/Contest";
import Problem from "../../../interfaces/Problem";
import { ContestId } from "../../../interfaces/Status";
import Submission from "../../../interfaces/Submission";
import {
  ContestCategories,
  ContestCategory,
} from "../../../utils/ContestClassifier";
import {
  decideStatusFromSubmissions,
  statusCounter,
  SubmissionStatus,
  StatusCount,
  makeCategoryCounts,
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

describe("test makeCategoryCounts", () => {
  it("when same problem 1AC 1WA", () => {
    const contests: Contest[] = [
      {
        duration_second: 6000,
        id: "abc043",
        rate_change: " ~ 1199",
        start_epoch_second: 1471089600,
        title: "AtCoder Beginner Contest 043",
      },
    ];

    const abc043Problems: Problem[] = [
      {
        contest_id: "abc043",
        id: "abc043_a",
        title:
          "A. キャンディーとN人の子供イージー / Children and Candies (ABC Edit)",
      },
      {
        contest_id: "abc043",
        id: "abc043_b",
        title: "B. バイナリハックイージー / Unhappy Hacking (ABC Edit)",
      },
      {
        contest_id: "arc059",
        id: "arc059_a",
        title: "C. いっしょ / Be Together",
      },
      {
        contest_id: "arc059",
        id: "arc059_b",
        title: "D. アンバランス / Unbalanced",
      },
    ];
    const contestToProblems: Map<ContestId, Problem[]> = new Map([
      ["abc043", abc043Problems],
    ]);

    const userSubmissions: Submission[] = [
      {
        contest_id: "abc043",
        epoch_second: 1548576902,
        execution_time: 18,
        id: 4095013,
        language: "Python3 (3.4.3)",
        length: 37,
        point: 100,
        problem_id: "abc043_a",
        result: "AC",
        user_id: "user",
      },
      {
        contest_id: "abc043",
        epoch_second: 1548576902,
        execution_time: 18,
        id: 4095013,
        language: "Python3 (3.4.3)",
        length: 37,
        point: 100,
        problem_id: "abc043_a",
        result: "WA",
        user_id: "user",
      },
    ];

    const expected = new Map<ContestCategory, StatusCount>(
      ContestCategories.filter(
        (category) => category !== "ABC"
      ).map((category) => [category, { solved: 0, rejected: 0, total: 0 }])
    );
    expected.set("ABC", { solved: 1, rejected: 0, total: 4 });
    expect(
      makeCategoryCounts(contests, contestToProblems, userSubmissions, "user")
    ).toEqual(expected);
  });

  it("when different problem 1AC 1WA", () => {
    const contests: Contest[] = [
      {
        duration_second: 6000,
        id: "abc043",
        rate_change: " ~ 1199",
        start_epoch_second: 1471089600,
        title: "AtCoder Beginner Contest 043",
      },
    ];

    const abc043Problems: Problem[] = [
      {
        contest_id: "abc043",
        id: "abc043_a",
        title:
          "A. キャンディーとN人の子供イージー / Children and Candies (ABC Edit)",
      },
      {
        contest_id: "abc043",
        id: "abc043_b",
        title: "B. バイナリハックイージー / Unhappy Hacking (ABC Edit)",
      },
      {
        contest_id: "arc059",
        id: "arc059_a",
        title: "C. いっしょ / Be Together",
      },
      {
        contest_id: "arc059",
        id: "arc059_b",
        title: "D. アンバランス / Unbalanced",
      },
    ];
    const contestToProblems: Map<ContestId, Problem[]> = new Map([
      ["abc043", abc043Problems],
    ]);

    const userSubmissions: Submission[] = [
      {
        contest_id: "abc043",
        epoch_second: 1548576902,
        execution_time: 18,
        id: 4095013,
        language: "Python3 (3.4.3)",
        length: 37,
        point: 100,
        problem_id: "abc043_a",
        result: "AC",
        user_id: "user",
      },
      {
        contest_id: "abc043",
        epoch_second: 1548576902,
        execution_time: 18,
        id: 4095013,
        language: "Python3 (3.4.3)",
        length: 37,
        point: 100,
        problem_id: "abc043_b",
        result: "WA",
        user_id: "user",
      },
    ];

    const expected = new Map<ContestCategory, StatusCount>(
      ContestCategories.filter(
        (category) => category !== "ABC"
      ).map((category) => [category, { solved: 0, rejected: 0, total: 0 }])
    );
    expected.set("ABC", { solved: 1, rejected: 1, total: 4 });
    expect(
      makeCategoryCounts(contests, contestToProblems, userSubmissions, "user")
    ).toEqual(expected);
  });

  it("when no submission", () => {
    const contests: Contest[] = [
      {
        duration_second: 6000,
        id: "abc043",
        rate_change: " ~ 1199",
        start_epoch_second: 1471089600,
        title: "AtCoder Beginner Contest 043",
      },
    ];

    const abc043Problems: Problem[] = [
      {
        contest_id: "abc043",
        id: "abc043_a",
        title:
          "A. キャンディーとN人の子供イージー / Children and Candies (ABC Edit)",
      },
      {
        contest_id: "abc043",
        id: "abc043_b",
        title: "B. バイナリハックイージー / Unhappy Hacking (ABC Edit)",
      },
      {
        contest_id: "arc059",
        id: "arc059_a",
        title: "C. いっしょ / Be Together",
      },
      {
        contest_id: "arc059",
        id: "arc059_b",
        title: "D. アンバランス / Unbalanced",
      },
    ];
    const contestToProblems: Map<ContestId, Problem[]> = new Map([
      ["abc043", abc043Problems],
    ]);

    const userSubmissions: Submission[] = [];

    const expected = new Map<ContestCategory, StatusCount>(
      ContestCategories.filter(
        (category) => category !== "ABC"
      ).map((category) => [category, { solved: 0, rejected: 0, total: 0 }])
    );
    expected.set("ABC", { solved: 0, rejected: 0, total: 4 });
    expect(
      makeCategoryCounts(contests, contestToProblems, userSubmissions, "user")
    ).toEqual(expected);
  });
});
