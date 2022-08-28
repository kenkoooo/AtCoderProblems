import { getLikeContestCategory } from "./LikeContestUtils";
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
  expect(getLikeContestCategory(contest)).toBe(result);
});
