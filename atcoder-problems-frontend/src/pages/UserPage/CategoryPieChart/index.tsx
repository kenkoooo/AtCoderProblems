import React from "react";
import { Row, Col } from "reactstrap";
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
import { SmallPieChart } from "../PieChartBlock/SmallPieChart";
import {
  classifyContest,
  ContestCategories,
  ContestCategory,
} from "../../../utils/ContestClassifier";
import Contest from "../../../interfaces/Contest";

interface Props {
  userId: string;
}

enum SubmissionStatus {
  TRYING,
  REJECTED,
  ACCEPTED,
}

export const CategoryPieChart: React.FC<Props> = (props) => {
  const contestMap = new Map<string, Contest>(
    useContests().data?.map((contest) => [contest.id, contest])
  );

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
    ([contestId, problems]) => {
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

      return { contestId: contestId, titleStatus: titleStatus };
    }
  );

  const categoryCounts = titleStatuses.reduce((counts, titleStatus) => {
    const contest = contestMap.get(titleStatus.contestId);
    if (contest !== undefined) {
      const category = classifyContest(contest);
      titleStatus.titleStatus.forEach((problemStatuses) => {
        const formerCount = counts.get(category);
        if (formerCount === undefined) return;

        switch (problemStatuses.status) {
          case SubmissionStatus.ACCEPTED:
            formerCount.solved++;
            break;
          case SubmissionStatus.REJECTED:
            formerCount.rejected++;
            break;
          default:
            break;
        }
        formerCount.total++;
      });
    }
    return counts;
  }, new Map<ContestCategory, { solved: number; rejected: number; total: number }>(ContestCategories.map((category) => [category, { solved: 0, rejected: 0, total: 0 }])));

  return (
    <div>
      <Row className="my-3">
        {ContestCategories.map((category) => {
          const count = categoryCounts.get(category);
          if (count !== undefined) {
            return (
              <Col key={category} className="text-center" xs="6" lg="3" xl="2">
                <SmallPieChart
                  accepted={count.solved}
                  rejected={count.rejected}
                  trying={count.total - count.solved - count.rejected}
                  title={`${category}`}
                />
                {category}
              </Col>
            );
          }
        })}
      </Row>
    </div>
  );
};
