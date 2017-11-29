import { UrlFormatter } from "./UrlFormatter";

test("format contest url", () => {
  let url = UrlFormatter.contestUrl("contest-name");
  expect(url).toEqual("https://beta.atcoder.jp/contests/contest-name/");
});

test("format problem url", () => {
  let url = UrlFormatter.problemUrl("contest-name", "problem-id");
  expect(url).toEqual(
    "https://beta.atcoder.jp/contests/contest-name/tasks/problem-id"
  );
});

test("format submission url", () => {
  let url = UrlFormatter.submissionUrl("contest-name", 114514);
  expect(url).toEqual(
    "https://beta.atcoder.jp/contests/contest-name/submissions/114514"
  );
});
