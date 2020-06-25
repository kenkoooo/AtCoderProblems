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

const generateACTrophiesWithProblems = (
  acProblemIds: Set<string>
): Trophy[] => {
  const milestones: [string, string, string[]][] = [
    [
      "World traveler2019",
      "Accept all problems in WorldTourFinals2019",
      ["wtf19_a", "wtf19_b", "wtf19_c1", "wtf19_c2", "wtf19_d", "wtf19_e"],
    ],
  ];
  return milestones.map(([draftTitle, reason, problem_ids]) => {
    const title = draftTitle;
    const achieved = problem_ids.every((problem_id) =>
      acProblemIds.has(problem_id)
    );
    const sortId = `accept-all-${draftTitle}`;
    return { title, reason, achieved, sortId };
  });
};

const uniqueACProblemIds = (submissions: TrophySubmission[]): Set<string> => {
  const acProblemIds = submissions
    .filter((submissions) => submissions.submission.result === "AC")
    .map((submission) => submission.submission.problem_id);
  return new Set(acProblemIds);
};

export const generateACTrophies = (
  allSubmissions: TrophySubmission[]
): Trophy[] => {
  const trophies = [] as Trophy[];
  const acProblemIds = uniqueACProblemIds(allSubmissions);
  trophies.push(...generateACTrophiesWithOneProblem(acProblemIds));
  trophies.push(...generateACTrophiesWithProblems(acProblemIds));
  return trophies;
};
