import Submission from "../../../interfaces/Submission";
import { isAccepted } from "../../../utils";
import { groupBy } from "../../../utils/GroupBy";
import { normalizeLanguage } from "../../../utils/LanguageNormalizer";
import { Trophy } from "./Trophy";

const generateACCountTrophiesByTag = (
  tag: string | null,
  count: number
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
  ];

  return milestones.map(([draftTitle, c]) => {
    const header = tag ? `[${tag}] ` : "";
    const title = header + draftTitle;
    const reason = header + `AC count >= ${c}`;
    const achieved = count >= c;
    const sortId = `ac-count-${tag ? tag : "all"}-${count
      .toString()
      .padStart(5, "0")}`;
    return { title, reason, achieved, sortId };
  });
};

const countUniqueProblems = (submissions: Submission[]): number =>
  new Set(submissions.map((s) => s.problem_id)).size;

export const generateACCountTrophies = (
  allSubmissions: Submission[]
): Trophy[] => {
  const acSubmissions = allSubmissions.filter((s) => isAccepted(s.result));

  const submissionsByLanguage = groupBy(acSubmissions, (s) =>
    normalizeLanguage(s.language)
  );

  const trophies = [] as Trophy[];
  Array.from(submissionsByLanguage).forEach(([language, submissions]) => {
    const count = countUniqueProblems(submissions);
    trophies.push(...generateACCountTrophiesByTag(language, count));
  });
  const count = countUniqueProblems(acSubmissions);
  trophies.push(...generateACCountTrophiesByTag(null, count));

  return trophies;
};
