import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import { List } from "immutable";
import Contest from "../../interfaces/Contest";
import MergedProblem from "../../interfaces/MergedProblem";
import Submission from "../../interfaces/Submission";
import { RatingInfo } from "../../utils/RatingInfo";
import { TablePage } from ".";

const mockContests: Contest[] = Array.from({ length: 151 }, (_, index) => ({
  id: `adt_all_${index}`,
  title: `Daily Training ${index}`,
  start_epoch_second: index,
  duration_second: 3600,
  rate_change: "-",
}));
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
mockContests.push({
  id: "abc001",
  title: "AtCoder Beginner Contest 001",
  start_epoch_second: 0,
  duration_second: 3600,
  rate_change: "All",
});
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

describe("ADT table pagination", () => {
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
    expect(rows()).toHaveLength(50);
    expect(rows()[0].textContent).toContain("ADT_ALL_150");
    click('.pagination li[title="2"] .page-link');
    expect(rows()).toHaveLength(50);
    expect(rows()[0].textContent).toContain("ADT_ALL_100");
    click('.pagination li[title="4"] .page-link');
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain("ADT_ALL_0");
  });

  it("returns to the newest contests after switching tabs", () => {
    renderPage();
    click('.pagination li[title="4"] .page-link');
    switchTab("ABC");
    expect(rows()).toHaveLength(1);
    expect(container.querySelector(".pagination")).toBeNull();
    switchTab("ADT");
    expect(rows()).toHaveLength(50);
    expect(rows()[0].textContent).toContain("ADT_ALL_150");
  });

  it("filters all contests before paginating and handles a disappearing last page", () => {
    mockSubmissions.push({
      id: 1,
      epoch_second: 1,
      problem_id: "problem_150",
      contest_id: "adt_all_150",
      user_id: "user",
      language: "C++",
      result: "AC",
      point: 100,
      length: 100,
      execution_time: 1,
    });
    renderPage();
    expect(rows()[0].querySelector(".table-success")).not.toBeNull();
    click('.pagination li[title="4"] .page-link');
    const filter = container.querySelector("#hideCompletedContest");
    if (!filter) {
      throw new Error("Missing completed contest filter");
    }
    void act(() => {
      Simulate.change(filter);
    });
    expect(rows()).toHaveLength(50);
    expect(rows()[0].textContent).toContain("ADT_ALL_149");
    expect(container.querySelector('.pagination li[title="4"]')).toBeNull();
    click('.pagination li[title="3"] .page-link');
    expect(rows()).toHaveLength(50);
    expect(rows()[49].textContent).toContain("ADT_ALL_0");
  });
});
