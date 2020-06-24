import Submission from "../../../interfaces/Submission";
import { normalizeLanguage } from "../../../utils/LanguageNormalizer";
import { calcStreak, countUniqueAcByDate } from "../../../utils/StreakCounter";
import { Trophy } from "./Trophy";

const generateLongestStreakTrophies = (
  language: string | null,
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

  mileStones.map(([draft, days]) => {
    return {};
  });

  return mileStones.map(([draftTitle, days]) => {
    const header = language ? `[${language}] ` : "";
    const title = header + draftTitle;
    const reason = header + `Longest Streak >= ${days} days`;
    const achieved = longestStreak >= days;
    const sortId = `longest-streak-${
      language ? language : "all"
    }-${days.toString().padStart(4, "0")}`;
    return { title, reason, achieved, sortId };
  });
};

const calcStreakByLanguage = (
  submissions: Submission[]
): { language: string; longestStreak: number; totalDays: number }[] => {
  const submissionsByLanguage = new Map<string, Submission[]>();
  submissions.forEach((s) => {
    const language = normalizeLanguage(s.language);
    const list = submissionsByLanguage.get(language);
    if (list) {
      list.push(s);
      submissionsByLanguage.set(language, list);
    } else {
      submissionsByLanguage.set(language, [s]);
    }
  });

  return Array.from(submissionsByLanguage).map(
    ([language, langSubmissions]) => {
      const count = countUniqueAcByDate(langSubmissions);
      const { longestStreak } = calcStreak(count);
      const totalDays = count.length;
      return { language, longestStreak, totalDays };
    }
  );
};

export const generateLanguageTrophies = (
  submissions: Submission[]
): Trophy[] => {
  const streaks = calcStreakByLanguage(submissions);
  const trophies = [] as Trophy[];
  streaks.forEach(({ language, longestStreak }) => {
    trophies.push(...generateLongestStreakTrophies(language, longestStreak));
  });

  const count = countUniqueAcByDate(submissions);
  const { longestStreak } = calcStreak(count);
  trophies.push(...generateLongestStreakTrophies(null, longestStreak));

  return trophies;
};
