import Submission from "../../../interfaces/Submission";
import { groupBy } from "../../../utils/GroupBy";
import { normalizeLanguage } from "../../../utils/LanguageNormalizer";
import { calcStreak, countUniqueAcByDate } from "../../../utils/StreakCounter";
import { Trophy } from "./Trophy";

const generateStreakTrophiesByTag = (
  tag: string | null,
  longestStreak: number
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
    const sortId = `longest-streak-${
      tag ? tag : "all"
    }-${days.toString().padStart(4, "0")}`;
    return { title, reason, achieved, sortId };
  });
};

const calcStreakByTag = (
  submissionsByLanguage: Map<string, Submission[]>
): { language: string; longestStreak: number; totalDays: number }[] => {
  return Array.from(submissionsByLanguage).map(
    ([language, langSubmissions]) => {
      const count = countUniqueAcByDate(langSubmissions);
      const { longestStreak } = calcStreak(count);
      const totalDays = count.length;
      return { language, longestStreak, totalDays };
    }
  );
};

export const generateStreakTrophies = (
  allSubmissions: Submission[]
): Trophy[] => {
  const trophies = [] as Trophy[];
  const streaksByLanguage = calcStreakByTag(
    groupBy(allSubmissions, (s) => normalizeLanguage(s.language))
  );
  streaksByLanguage.forEach(({ language, longestStreak }) => {
    trophies.push(...generateStreakTrophiesByTag(language, longestStreak));
  });

  const count = countUniqueAcByDate(allSubmissions);
  const { longestStreak } = calcStreak(count);
  trophies.push(...generateStreakTrophiesByTag(null, longestStreak));

  return trophies;
};
