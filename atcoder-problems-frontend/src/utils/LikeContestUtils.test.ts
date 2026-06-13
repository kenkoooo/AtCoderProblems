import {
  getLikeContestCategory,
  isLikeContestCategory,
} from "./LikeContestUtils";
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
])("Get Like Contest Category", (contest, result) => {
  expect(getLikeContestCategory(contest)).toBe(result);
});

type IsLikeContestCategoryTestType = [ContestCategory, boolean];
test.each<IsLikeContestCategoryTestType>([
  ["ABC", false],
  ["ARC", false],
  ["AGC", false],
  ["ABC-Like", true],
  ["ARC-Like", true],
  ["AGC-Like", true],
  ["PAST", false],
  ["JOI", false],
  ["JAG", false],
  ["AHC", false],
  ["Marathon", false],
  ["Other Sponsored", false],
  ["Other Contests", false],
])("Is Like Contest Category", (contest, result) => {
  expect(isLikeContestCategory(contest)).toBe(result);
});
