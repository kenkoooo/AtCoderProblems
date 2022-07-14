import { getLikeContest, hasLikeContest } from "./LikeContestUtils";
import { ContestCategory } from "./ContestClassifier";

type GetLikeContestTestType = [ContestCategory, ContestCategory | undefined];
test.each<GetLikeContestTestType>([
  ["ABC", "ABC-Like"],
  ["ARC", "ARC-Like"],
  ["AGC", "AGC-Like"],
  ["ABC-Like", undefined],
  ["ARC-Like", undefined],
  ["AGC-Like", undefined],
  ["PAST", undefined],
  ["JOI", undefined],
  ["JAG", undefined],
  ["AHC", undefined],
  ["Marathon", undefined],
  ["Other Sponsored", undefined],
  ["Other Contests", undefined],
])("Get Like Contest", (contest, result) => {
  expect(getLikeContest(contest)).toBe(result);
});

type HasLikeContestTestType = [ContestCategory, boolean];
test.each<HasLikeContestTestType>([
  ["ABC", true],
  ["ARC", true],
  ["AGC", true],
  ["ABC-Like", false],
  ["ARC-Like", false],
  ["AGC-Like", false],
  ["PAST", false],
  ["JOI", false],
  ["JAG", false],
  ["AHC", false],
  ["Marathon", false],
  ["Other Sponsored", false],
  ["Other Contests", false],
])(`Has Like Contest`, (contest, result) => {
  expect(hasLikeContest(contest)).toBe(result);
});
