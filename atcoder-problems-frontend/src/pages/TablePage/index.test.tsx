import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import { List } from "immutable";
import Contest from "../../interfaces/Contest";
import MergedProblem from "../../interfaces/MergedProblem";
import Submission from "../../interfaces/Submission";
import { RatingInfo } from "../../utils/RatingInfo";
import { TablePage } from ".";

const mockRegularCategories = [
  { category: "ABC", prefix: "abc", digits: 3, rateChange: "-" },
  { category: "ARC", prefix: "arc", digits: 3, rateChange: "-" },
  { category: "AGC", prefix: "agc", digits: 3, rateChange: "-" },
  { category: "AWC", prefix: "awc", digits: 4, rateChange: "-" },
  {
    category: "ABC-Like",
    prefix: "abc_like_",
    digits: 3,
    rateChange: "~ 1999",
  },
  {
    category: "ARC-Like",
    prefix: "arc_like_",
    digits: 3,
    rateChange: "~ 2799",
  },
  { category: "AGC-Like", prefix: "agc_like_", digits: 3, rateChange: "All" },
  { category: "PAST", prefix: "past", digits: 3, rateChange: "-" },
];
const mockContests: Contest[] = Array.from({ length: 161 }, (_, index) => ({
  id: `adt_all_${index}`,
  title: `Daily Training ${index}`,
  start_epoch_second: index,
  duration_second: 3600,
  rate_change: "-",
}));
mockContests.push(
  ...mockRegularCategories.flatMap(({ category, prefix, digits, rateChange }) =>
    Array.from({ length: 51 }, (_, index) => ({
      id: prefix + index.toString().padStart(digits, "0"),
      title: `${category} ${index}`,
      start_epoch_second: 1600000000 + index,
      duration_second: 3600,
      rate_change: rateChange,
    }))
  )
);
const mockContestToProblems = new Map<string, MergedProblem[]>(
  mockContests.map((contest, index) => [
    contest.id,
    [
      {
        id: `problem_${index}`,
        contest_id: contest.id,
        problem_index: "A",
        name: `Problem ${index}`,
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
      },
    ],
  ])
);
const mockSubmissions: Submission[] = [];
const mockRatingInfo = new RatingInfo(0, 0);

jest.mock("../../api/APIClient", () => ({
  useContests: () => ({ data: mockContests }),
  useContestToMergedProblems: () => mockContestToProblems,
  useRatingInfo: () => mockRatingInfo,
  useUserSubmission: () => mockSubmissions,
  useMultipleUserSubmissions: () => ({ data: mockSubmissions }),
  useProblemModelMap: () => new Map(),
}));
jest.mock("../../api/InternalAPIClient", () => ({
  useLoginState: () => ({ data: undefined }),
  useProgressResetList: () => ({ data: undefined }),
}));

describe("Regular contest table pagination", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("contestTableTab", JSON.stringify("ADT"));
    mockSubmissions.length = 0;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    void act(() => {
      ReactDOM.unmountComponentAtNode(container);
    });
    container.remove();
  });

  const renderPage = () => {
    void act(() => {
      ReactDOM.render(<TablePage userId="user" rivals={List()} />, container);
    });
  };
  const rows = () =>
    container.querySelectorAll(".react-bs-container-body tbody tr");
  const click = (selector: string) => {
    const target = container.querySelector(selector);
    if (!target) {
      throw new Error(`Missing element: ${selector}`);
    }
    void act(() => {
      Simulate.click(target);
    });
  };
  const switchTab = (title: string) => {
    const target = Array.from(
      container.querySelectorAll(".table-tab button")
    ).find((button) => button.textContent === title);
    if (!target) {
      throw new Error(`Missing tab: ${title}`);
    }
    void act(() => {
      Simulate.click(target);
    });
  };

  it("limits mounted rows and lets users reach the oldest contests", () => {
    renderPage();
    expect(rows()).toHaveLength(20);
    expect(rows()[0].textContent).toContain("ADT_ALL_160");
    click('.pagination li[title="2"] .page-link');
    expect(rows()).toHaveLength(20);
    expect(rows()[0].textContent).toContain("ADT_ALL_140");
    click('.pagination li[title="9"] .page-link');
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain("ADT_ALL_0");
  });

  it("returns to the newest contests after switching tabs", () => {
    renderPage();
    click('.pagination li[title="9"] .page-link');
    switchTab("ABC");
    expect(rows()).toHaveLength(20);
    expect(rows()[0].textContent).toContain("ABC050");
    click('.pagination li[title="2"] .page-link');
    switchTab("ADT");
    expect(rows()).toHaveLength(20);
    expect(rows()[0].textContent).toContain("ADT_ALL_160");
    switchTab("ABC");
    expect(rows()[0].textContent).toContain("ABC050");
  });

  it("filters all contests before paginating and handles a disappearing last page", () => {
    mockSubmissions.push({
      id: 1,
      epoch_second: 1,
      problem_id: "problem_160",
      contest_id: "adt_all_160",
      user_id: "user",
      language: "C++",
      result: "AC",
      point: 100,
      length: 100,
      execution_time: 1,
    });
    renderPage();
    expect(rows()[0].querySelector(".table-success")).not.toBeNull();
    click('.pagination li[title="9"] .page-link');
    const filter = container.querySelector("#hideCompletedContest");
    if (!filter) {
      throw new Error("Missing completed contest filter");
    }
    void act(() => {
      Simulate.change(filter);
    });
    expect(rows()).toHaveLength(20);
    expect(rows()[0].textContent).toContain("ADT_ALL_159");
    expect(container.querySelector('.pagination li[title="9"]')).toBeNull();
    click('.pagination li[title="8"] .page-link');
    expect(rows()).toHaveLength(20);
    expect(rows()[19].textContent).toContain("ADT_ALL_0");
  });

  it.each(["ADT", ...mockRegularCategories.map(({ category }) => category)])(
    "paginates %s contests with the shared List page controls",
    (category) => {
      localStorage.setItem("contestTableTab", JSON.stringify(category));
      renderPage();
      expect(rows()).toHaveLength(20);
      const firstContest = rows()[0].textContent;
      click('.pagination li[title="2"] .page-link');
      expect(rows()).toHaveLength(20);
      expect(rows()[0].textContent).not.toBe(firstContest);
      click('.pagination li[title="1"] .page-link');
      click(".react-bs-table-sizePerPage-dropdown .dropdown-toggle");
      const sizes = Array.from(
        container.querySelectorAll(
          ".react-bs-table-sizePerPage-dropdown .dropdown-item"
        )
      );
      expect(sizes.map((item) => item.textContent)).toEqual([
        "20",
        "50",
        "100",
        "200",
      ]);
      void act(() => {
        Simulate.click(sizes[1]);
      });
      expect(rows()).toHaveLength(50);
    }
  );
});
