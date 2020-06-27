import { getRatingColor, isAccepted, RatingColors } from "../../../utils";
import { groupBy } from "../../../utils/GroupBy";
import { normalizeLanguage } from "../../../utils/LanguageNormalizer";
import { Trophy, TrophySubmission } from "./Trophy";

const generateACCountTrophiesByTag = (
  tag: string | null,
  count: number,
  idPrefix: string
): Trophy[] => {
  const milestones: [string, number][] = [
    ["Beginning", 1],
    ["Tutorial Finished", 10],
    ["Way into Solving", 30],
    ["Curious about Solving", 50],
    ["Finished this game", 100],
    ["Serious about Solving", 200],
    ["I can stop solving whenever I want.", 300],
    ["Can't Stop Solving", 500],
    ["Extremely into Solving", 700],
    ["Solving is My Life", 1000],
    ["Fiend for Solving", 1200],
    ["Fanatic for Solving", 1500],
    ["Almost done", 2000],
    ["Looking for a new problem", 2500],
    ["AtCoder has only a few problems.", 3000],
    ["You're tourist of Solving.", 3500],
  ];

  return milestones.map(([draftTitle, milestoneCount]) => {
    const header = tag ? `[${tag}] ` : "";
    const title = header + draftTitle;
    const reason = header + `AC count >= ${milestoneCount}`;
    const achieved = count >= milestoneCount;
    const sortId = `ac-count-${idPrefix}-${milestoneCount
      .toString()
      .padStart(5, "0")}`;
    return { title, reason, achieved, sortId, group: "AC Count" };
  });
};

const countUniqueProblems = (submissions: TrophySubmission[]): number =>
  new Set(submissions.map((s) => s.submission.problem_id)).size;

export const generateACCountTrophies = (
  allSubmissions: TrophySubmission[]
): Trophy[] => {
  const acSubmissions = allSubmissions.filter((s) =>
    isAccepted(s.submission.result)
  );
  const trophies = [] as Trophy[];

  const submissionsByLanguage = groupBy(acSubmissions, (s) =>
    normalizeLanguage(s.submission.language)
  );
  Array.from(submissionsByLanguage).forEach(([language, submissions]) => {
    const count = countUniqueProblems(submissions);
    trophies.push(
      ...generateACCountTrophiesByTag(language, count, `language-${language}`)
    );
  });

  const submissionsByDiff = groupBy(acSubmissions, (s) => {
    const difficulty = s.problemModel?.difficulty;
    return difficulty !== undefined ? getRatingColor(difficulty) : undefined;
  });
  Array.from(submissionsByDiff).forEach(([color, submissions]) => {
    if (color) {
      const count = countUniqueProblems(submissions);
      const index = RatingColors.indexOf(color);
      trophies.push(
        ...generateACCountTrophiesByTag(color, count, `difficulty-${index}`)
      );
    }
  });
  const count = countUniqueProblems(acSubmissions);
  trophies.push(...generateACCountTrophiesByTag(null, count, "all"));

  return trophies;
};
