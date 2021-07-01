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

type StatusCount = { solved: number; rejected: number; total: number };

type ProblemStatusesByContest = {
  contest: Contest;
  problemStatuses: {
    problem: Problem;
    status: SubmissionStatus;
  }[];
};

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

  const statusByContests = Array.from(contestToProblems).reduce(
    (accumulator, [contestId, problems]) => {
      const problemStatuses = problems.map((problem) => {
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

      const contest = contestMap.get(contestId);

      if (contest !== undefined) {
        accumulator.push({
          contest: contest,
          problemStatuses: problemStatuses,
        });
      }

      return accumulator;
    },
    [] as ProblemStatusesByContest[]
  );

  const categoryCounts = statusByContests.reduce((counts, statusByContest) => {
    const category = classifyContest(statusByContest.contest);
    statusByContest.problemStatuses.forEach((problemStatus) => {
      const formerCount = counts.get(category);
      if (formerCount === undefined) return;

      switch (problemStatus.status) {
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
    return counts;
  }, new Map<ContestCategory, StatusCount>(ContestCategories.map((category) => [category, { solved: 0, rejected: 0, total: 0 }])));

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
