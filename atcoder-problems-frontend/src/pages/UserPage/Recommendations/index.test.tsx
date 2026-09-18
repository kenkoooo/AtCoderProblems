import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import * as APIClient from "../../../api/APIClient";
import { Recommendations } from ".";

jest.mock("../../../api/APIClient");
jest.mock("../../../api/InternalAPIClient", () => ({
  useLoginState: () => ({ data: undefined }),
}));

beforeEach(() => {
  localStorage.clear();
  const problem = {
    id: "abc212_e",
    contest_id: "adt_all_20231220_1",
    problem_index: "H",
    name: "Safety Journey",
    title: "H. Safety Journey",
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
  };
  jest.spyOn(APIClient, "useMergedProblemMap").mockReturnValue({
    data: new Map([[problem.id, problem]]),
  });
  jest
    .spyOn(APIClient, "useContestToProblems")
    .mockReturnValue(
      new Map([["abc212", [{ ...problem, problem_index: "E" }]]])
    );
  jest.spyOn(APIClient, "useContestMap").mockReturnValue(
    new Map([
      [
        "abc212",
        {
          id: "abc212",
          title: "AtCoder Beginner Contest 212",
          start_epoch_second: 1627128000,
          duration_second: 6000,
          rate_change: " ~ 1999",
        },
      ],
    ])
  );
  jest.spyOn(APIClient, "useProblemModelMap").mockReturnValue(
    new Map([
      [
        problem.id,
        {
          difficulty: 1500,
          rawDifficulty: 1500,
          discrimination: 0.01,
          is_experimental: false,
          slope: undefined,
          intercept: undefined,
          variance: undefined,
        },
      ],
    ])
  );
  jest.spyOn(APIClient, "useRatingInfo").mockReturnValue({
    rating: 1500,
    internalRating: 1500,
    participationCount: 10,
  });
  jest.spyOn(APIClient, "useUserSubmission").mockReturnValue([
    {
      id: 1,
      epoch_second: 1,
      problem_id: "abc212_a",
      contest_id: "abc212",
      user_id: "test_user",
      language: "C++",
      point: 100,
      length: 100,
      result: "AC",
      execution_time: 1,
    },
  ]);
});

it.each(["All", "ABC"])(
  "shows the original contest, problem index and links with the %s filter",
  (category) => {
    localStorage.setItem("recommendCategoryOption", JSON.stringify(category));
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Recommendations userId="test_user" />
      </MemoryRouter>
    );
    expect(html).toContain("E. Safety Journey");
    expect(html).toContain("https://atcoder.jp/contests/abc212/tasks/abc212_e");
    expect(html).toContain('href="https://atcoder.jp/contests/abc212"');
    expect(html).not.toContain("H. Safety Journey");
    expect(html).not.toContain("adt_all_20231220_1");
  }
);
