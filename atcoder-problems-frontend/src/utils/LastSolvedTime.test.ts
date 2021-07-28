import { getLastSolvedTimeMap, isIncludedSolvedTime } from "./LastSolvedTime";

test("get last solved time map", () => {
  const submission1 = {
    execution_time: 1,
    point: 100,
    result: "AC",
    problem_id: "problem1",
    user_id: "user1",
    epoch_second: 0,
    contest_id: "contest1",
    id: 0,
    language: "Python",
    length: 1,
  };
  const submission2 = {
    execution_time: 1,
    point: 100,
    result: "AC",
    problem_id: "problem1",
    user_id: "user2",
    epoch_second: 1,
    contest_id: "contest1",
    id: 1,
    language: "Python",
    length: 1,
  };
  const submission3 = {
    execution_time: 1,
    point: 100,
    result: "WA",
    problem_id: "problem2",
    user_id: "user2",
    epoch_second: 0,
    contest_id: "contest1",
    id: 2,
    language: "Python",
    length: 1,
  };
  const submission4 = {
    execution_time: 2,
    point: 200,
    result: "AC",
    problem_id: "problem3",
    user_id: "user1",
    epoch_second: 0,
    contest_id: "contest2",
    id: 3,
    language: "Rust",
    length: 1,
  };
  const submission5 = {
    execution_time: 2,
    point: 200,
    result: "TLE",
    problem_id: "problem3",
    user_id: "user3",
    epoch_second: 5,
    contest_id: "contest2",
    id: 3,
    language: "Python",
    length: 1,
  };

  const submissions = [
    submission1,
    submission2,
    submission3,
    submission4,
    submission5,
  ];
  const map = getLastSolvedTimeMap(submissions);
  expect(map.get("problem1")).toBe(1);
  expect(map.has("problem2")).toBe(false);
  expect(map.get("problem3")).toBe(0);
});

test("is included solved time", () => {
  const week = 3600 * 24 * 7;
  const month = 3600 * 24 * 30;

  // Exclude all solved
  expect(isIncludedSolvedTime("Exclude", 6 * month + 1, undefined, true)).toBe(
    true
  );
  expect(isIncludedSolvedTime("Exclude", 6 * month + 1, 1, true)).toBe(false);

  // 1 week
  expect(isIncludedSolvedTime("1 Week", 1 * week + 2, 1, true)).toBe(true);
  expect(isIncludedSolvedTime("1 Week", 1 * week + 1, 1, true)).toBe(false);

  // 2 weeks
  expect(isIncludedSolvedTime("2 Weeks", 2 * week + 2, 1, true)).toBe(true);
  expect(isIncludedSolvedTime("2 Weeks", 2 * week + 1, 1, true)).toBe(false);

  // 4 weeks
  expect(isIncludedSolvedTime("4 Weeks", 4 * week + 2, 1, true)).toBe(true);
  expect(isIncludedSolvedTime("4 Weeks", 4 * week + 1, 1, true)).toBe(false);

  // 6 months
  expect(isIncludedSolvedTime("6 Months", 6 * month + 2, 1, true)).toBe(true);
  expect(isIncludedSolvedTime("6 Months", 6 * month + 1, 1, true)).toBe(false);

  // Exclude submitted
  expect(isIncludedSolvedTime("Exclude submitted", 0, undefined, false)).toBe(
    true
  );
  expect(isIncludedSolvedTime("Exclude submitted", 0, undefined, true)).toBe(
    false
  );
  // Don't exclude
  expect(isIncludedSolvedTime("Don't exclude", 0, undefined, false)).toBe(true);
});
