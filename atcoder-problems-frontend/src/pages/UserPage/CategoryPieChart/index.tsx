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

export enum SubmissionStatus {
  TRYING,
  REJECTED,
  ACCEPTED,
}

export type StatusCount = { solved: number; rejected: number; total: number };

type ProblemStatusesByContest = {
  contest: Contest;
  problemStatuses: {
    problem: Problem;
    status: SubmissionStatus;
  }[];
};

export const statusCounter = (
  counter: StatusCount,
  status: SubmissionStatus
) => {
  switch (status) {
    case SubmissionStatus.ACCEPTED:
      counter.solved++;
      break;
    case SubmissionStatus.REJECTED:
      counter.rejected++;
      break;
    default:
      break;
  }
  counter.total++;
};

export const decideStatusFromSubmissions = (
  submissions: Submission[] | undefined
) => {
  return !submissions
    ? SubmissionStatus.TRYING
    : submissions?.find((s) => isAccepted(s.result))
    ? SubmissionStatus.ACCEPTED
    : SubmissionStatus.REJECTED;
};

export const makeCategoryCounts = (
  contestsData: Contest[],
  contestToProblemsData: Map<string, Problem[]>,
  userSubmissionsData: Submission[],
  userId: string
) => {
  const contestMap = new Map<string, Contest>(
    contestsData.map((contest) => [contest.id, contest])
  );

  const submissionsMap = userSubmissionsData.reduce((map, submission) => {
    const submissions = map.get(submission.problem_id) ?? [];
    submissions.push(submission);
    map.set(submission.problem_id, submissions);
    return map;
  }, new Map<ProblemId, Submission[]>());

  const statusByContests = Array.from(contestToProblemsData).reduce(
    (accumulator, [contestId, problems]) => {
      const problemStatuses = problems.map((problem) => {
        const validSubmissions = submissionsMap
          .get(problem.id)
          ?.filter(
            (s) =>
              caseInsensitiveUserId(s.user_id) === userId &&
              isValidResult(s.result)
          );

        const status = decideStatusFromSubmissions(validSubmissions);
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

      statusCounter(formerCount, problemStatus.status);
    });
    return counts;
  }, new Map<ContestCategory, StatusCount>(ContestCategories.map((category) => [category, { solved: 0, rejected: 0, total: 0 }])));
  return categoryCounts;
};

export const CategoryPieChart: React.FC<Props> = (props) => {
  const contests = useContests().data ?? [];
  const contestToProblems =
    useContestToProblems() ?? new Map<ContestId, Problem[]>();
  const userSubmissions = useUserSubmission(props.userId) ?? [];

  const categoryCounts = makeCategoryCounts(
    contests,
    contestToProblems,
    userSubmissions,
    props.userId
  );

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
              </Col>
            );
          }
        })}
      </Row>
    </div>
  );
};
