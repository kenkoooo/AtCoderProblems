import Submission from "../../../interfaces/Submission";
import { normalizeLanguage } from "../../../utils/LanguageNormalizer";
import { calcStreak, countUniqueAcByDate } from "../../../utils/StreakCounter";
import { Trophy } from "./Trophy";

const generateLongestStreakTrophies = (
  language: string | null,
  longestStreak: number
): Trophy[] => {
  const inLanguage = language ? ` in ${language}` : "";
  const idHead = language ? `longest-streak-${language}` : "longest-streak";

  const trophies = [
    {
      title: `Started your streak${inLanguage}`,
      reason: `Longest Steak${inLanguage} >= 3 days`,
      achieved: longestStreak >= 3,
      sortId: `${idHead}-0003`,
    },
    {
      title: `Keep solving problems${inLanguage} for a week`,
      reason: `Longest Steak${inLanguage} >= 7 days`,
      achieved: longestStreak >= 7,
      sortId: `${idHead}-0007`,
    },
    {
      title: `Keep solving problems${inLanguage} for 2 weeks`,
      reason: `Longest Steak${inLanguage} >= 14 days`,
      achieved: longestStreak >= 14,
      sortId: `${idHead}-0014`,
    },
    {
      title: `Keep solving problems${inLanguage} for a month`,
      reason: `Longest Steak${inLanguage} >= 30 days`,
      achieved: longestStreak >= 30,
      sortId: `${idHead}-0030`,
    },
    {
      title: `Keep solving problems${inLanguage} for 2 months`,
      reason: `Longest Steak${inLanguage} >= 60 days`,
      achieved: longestStreak >= 60,
      sortId: `${idHead}-0060`,
    },
    {
      title: `Keep solving problems${inLanguage} for a quarter`,
      reason: `Longest Steak${inLanguage} >= 90 days`,
      achieved: longestStreak >= 90,
      sortId: `${idHead}-0090`,
    },
    {
      title: `Keep solving problems${inLanguage} for half a year`,
      reason: `Longest Steak${inLanguage} >= 180 days`,
      achieved: longestStreak >= 180,
      sortId: `${idHead}-0180`,
    },
    {
      title: `Keep solving problems${inLanguage} for a year`,
      reason: `Longest Steak${inLanguage} >= 365 days`,
      achieved: longestStreak >= 365,
      sortId: `${idHead}-0365`,
    },
    {
      title: `Keep solving problems${inLanguage} for 2 years`,
      reason: `Longest Steak${inLanguage} >= 730 days`,
      achieved: longestStreak >= 730,
      sortId: `${idHead}-0730`,
    },
    {
      title: `Keep solving problems${inLanguage} for 3 years`,
      reason: `Longest Steak${inLanguage} >= 1095 days`,
      achieved: longestStreak >= 1095,
      sortId: `${idHead}-1095`,
    },
    {
      title: `1000 days${inLanguage}, can't stop`,
      reason: `Longest Steak${inLanguage} >= 1000 days`,
      achieved: longestStreak >= 1000,
      sortId: `${idHead}-1000`,
    },
  ];
  for (let i = 10; i < 100; i += 10) {
    trophies.push({
      title: `Keep solving problems${inLanguage} for ${i} days`,
      reason: `Longest Steak${inLanguage} >= ${i} days`,
      achieved: longestStreak >= i,
      sortId: `${idHead}-${i.toString().padStart(4, "0")}`,
    });
  }
  for (let i = 100; i < 1000; i += 50) {
    trophies.push({
      title: `Keep solving problems${inLanguage} for ${i} days`,
      reason: `Longest Steak${inLanguage} >= ${i} days`,
      achieved: longestStreak >= i,
      sortId: `${idHead}-${i.toString().padStart(4, "0")}`,
    });
  }
  return trophies;
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
