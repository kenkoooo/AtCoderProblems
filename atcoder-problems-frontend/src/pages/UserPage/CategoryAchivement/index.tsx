import React from "react";
import {
  classifyContest,
  ContestCategories,
} from "../../TablePage/ContestClassifier";
import {
  useContestToProblems,
  useUserSubmission,
  useContests,
} from "../../../api/APIClient";
import Problem from "../../../interfaces/Problem";
import Submission from "../../../interfaces/Submission";
import { ContestId, ProblemId } from "../../../interfaces/Status";
import {
  caseInsensitiveUserId,
  isAccepted,
  isValidResult,
} from "../../../utils";

interface Props {
  userId: string;
}

enum SubmissionStatus {
  TRYING,
  REJECTED,
  ACCEPTED,
}

export const CategoryAchivement: React.FC<Props> = (props) => {
  const { data: contests } = useContests();

  const contestToProblems =
    useContestToProblems() ?? new Map<ContestId, Problem[]>();

  const submissionsMap = (useUserSubmission(props.userId) ?? []).reduce(
    (map, submission) => {
      const submissions = map.get(submission.problem_id) ?? [];
      submissions.push(submission);
      map.set(submission.problem_id, submissions);
      return map;
    },
    new Map<ProblemId, Submission[]>()
  );

  const titleStatuses = Array.from(contestToProblems).map(
    ([contestTitle, problems]) => {
      const titleStatus = problems.map((problem) => {
        const validSubmissions = submissionsMap
          .get(problem.id)
          ?.filter(
            (s) =>
              caseInsensitiveUserId(s.user_id) === props.userId &&
              isValidResult(s.result)
          );

        const status = !validSubmissions
          ? SubmissionStatus.TRYING
          : validSubmissions?.find((s) => isAccepted(s.result))
          ? SubmissionStatus.ACCEPTED
          : SubmissionStatus.REJECTED;
        return { problem: problem, status: status };
      });

      return { contestId: contestTitle, titleStatus: titleStatus };
    }
  );

  const categoryCounts = titleStatuses.reduce(
    (counts, titleStatus) => {
      const contest = contests?.find((c) => c.id === titleStatus.contestId);
      const category = contest && classifyContest(contest);
      if (category !== undefined) {
        const categoryIdx = counts.findIndex(
          (count) => count.category === category
        );
        titleStatus.titleStatus.map((problemStatuses) => {
          if (problemStatuses.status === SubmissionStatus.ACCEPTED) {
            counts[categoryIdx].solved++;
          }
          counts[categoryIdx].problemNum++;
        });
      }
      return counts;
    },
    ContestCategories.map((category) => ({
      category: category,
      solved: 0,
      problemNum: 0,
    }))
  );

  return (
    <p>
      <div></div>
      {categoryCounts.map((categoryCount) => {
        return (
          <p key={categoryCount.category}>
            {categoryCount.category}:{categoryCount.solved}/
            {categoryCount.problemNum}
          </p>
        );
      })}
    </p>
  );
};
