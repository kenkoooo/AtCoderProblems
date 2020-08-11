import { isAccepted } from "../../../utils";
import { Trophy, TrophySubmission } from "./Trophy";

const generateACTrophiesWithOneProblem = (
  acProblemIds: Set<string>
): Trophy[] => {
  const milestones: [string, string, string][] = [
    ["2718", "Solved WorldTourFinals2019-E", "wtf19_e"],
  ];
  return milestones.map(([title, reason, problem_id]) => {
    const achieved = acProblemIds.has(problem_id);
    const sortId = `accepted-problem-${problem_id}`;
    return {
      title,
      reason,
      achieved,
      sortId,
      group: "Problems",
      subgroup: "Problems",
      dependsOn: [],
    };
  });
};

const uniqueACProblemIds = (submissions: TrophySubmission[]): Set<string> => {
  const acProblemIds = submissions
    .filter((submissions) => isAccepted(submissions.submission.result))
    .map((submission) => submission.submission.problem_id);
  return new Set(acProblemIds);
};

export const generateACProblemsTrophies = (
  allSubmissions: TrophySubmission[]
): Trophy[] => {
  const trophies = [] as Trophy[];
  const acProblemIds = uniqueACProblemIds(allSubmissions);
  trophies.push(...generateACTrophiesWithOneProblem(acProblemIds));
  return trophies;
};
