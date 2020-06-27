import { getRatingColor, RatingColors } from "../../../utils";
import { groupBy } from "../../../utils/GroupBy";
import { normalizeLanguage } from "../../../utils/LanguageNormalizer";
import { calcStreak, countUniqueAcByDate } from "../../../utils/StreakCounter";
import { Trophy, TrophySubmission, TrophyGroup } from "./Trophy";

const generateStreakTrophiesByTag = (
  tag: string | null,
  longestStreak: number,
  idPrefix: string
): Trophy[] => {
  const mileStones: [string, number][] = [
    ["Welcome!", 3],
    ["Golden Week", 7],
    ["Real Golden Week", 14],
    ["Vacation", 31],
    ["Can't Come Back from Vacation", 62],
    ["#SolveProblemEveryDay", 93],
    ["Goal", 100],
    ["Beyond Goal", 101],
    ["Problem Solving is My Job", 180],
    ["Happy Anniversary!", 365],
    ["2nd Anniversary!", 730],
    ["I am no genius. I am simply good at it.", 1000],
    ["I am genius.", 1095],
  ];

  for (let i = 10; i < 100; i += 10) {
    mileStones.push([`Keep solving problems for ${i} days`, i]);
  }
  for (let i = 150; i < 1000; i += 50) {
    mileStones.push([`Keep solving problems for ${i} days`, i]);
  }

  return mileStones.map(([draftTitle, days]) => {
    const header = tag ? `[${tag}] ` : "";
    const title = header + draftTitle;
    const reason = header + `Longest Streak >= ${days} days`;
    const achieved = longestStreak >= days;
    const sortId = `longest-streak-${idPrefix}-${days
      .toString()
      .padStart(4, "0")}`;
    return { title, reason, achieved, sortId, group: TrophyGroup.STREAK };
  });
};

const calcSubmissionsStreak = (
  submissions: TrophySubmission[]
): { totalDays: number; longestStreak: number } => {
  const count = countUniqueAcByDate(submissions.map((s) => s.submission));
  const { longestStreak } = calcStreak(count);
  const totalDays = count.length;
  return { longestStreak, totalDays };
};

export const generateStreakTrophies = (
  allSubmissions: TrophySubmission[]
): Trophy[] => {
  const trophies = [] as Trophy[];
  const submissionsByLanguage = groupBy(allSubmissions, (s) =>
    normalizeLanguage(s.submission.language)
  );
  Array.from(submissionsByLanguage).forEach(([language, submissions]) => {
    const { longestStreak } = calcSubmissionsStreak(submissions);
    trophies.push(
      ...generateStreakTrophiesByTag(
        language,
        longestStreak,
        `language-${language}`
      )
    );
  });

  const submissionsByDifficulty = groupBy(allSubmissions, (s) => {
    const difficulty = s.problemModel?.difficulty;
    return difficulty !== undefined ? getRatingColor(difficulty) : undefined;
  });
  Array.from(submissionsByDifficulty).forEach(([color, submissions]) => {
    if (color) {
      const index = RatingColors.indexOf(color);
      const { longestStreak } = calcSubmissionsStreak(submissions);
      trophies.push(
        ...generateStreakTrophiesByTag(
          color,
          longestStreak,
          `difficulty-${index}`
        )
      );
    }
  });

  const count = countUniqueAcByDate(allSubmissions.map((s) => s.submission));
  const { longestStreak } = calcStreak(count);
  trophies.push(...generateStreakTrophiesByTag(null, longestStreak, "all"));

  return trophies;
};
