import { isAccepted } from "../../../utils";
import { Trophy, TrophySubmission } from "./Trophy";

const generateACTrophiesWithOneProblem = (
  acProblemIds: Set<string>
): Trophy[] => {
  const milestones: [string, string, string][] = [
    ["2718", "Accept WorldTourFinals2019-E", "wtf19_e"],
  ];
  return milestones.map(([draftTitle, reason, problem_id]) => {
    const title = draftTitle;
    const achieved = acProblemIds.has(problem_id);
    const sortId = `accept-${problem_id}`;
    return { title, reason, achieved, sortId };
  });
};

const uniqueACProblemIds = (submissions: TrophySubmission[]): Set<string> => {
  const acProblemIds = submissions
    .filter((submissions) => isAccepted(submissions.submission.result))
    .map((submission) => submission.submission.problem_id);
  return new Set(acProblemIds);
};

export const generateACTrophies = (
  allSubmissions: TrophySubmission[]
): Trophy[] => {
  const trophies = [] as Trophy[];
  const acProblemIds = uniqueACProblemIds(allSubmissions);
  trophies.push(...generateACTrophiesWithOneProblem(acProblemIds));
  return trophies;
};
