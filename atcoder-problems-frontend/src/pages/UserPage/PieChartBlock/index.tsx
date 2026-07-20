import { Col, Row } from "reactstrap";
import React from "react";
import {
  useContestToProblems,
  useUserSubmission,
} from "../../../api/APIClient";
import Problem from "../../../interfaces/Problem";
import Submission from "../../../interfaces/Submission";
import { ContestId, ProblemId } from "../../../interfaces/Status";
import {
  caseInsensitiveUserId,
  isAccepted,
  isValidResult,
} from "../../../utils";
import { SmallPieChart } from "./SmallPieChart";

const PROBLEM_KEYS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
] as const;

type ProblemKey = typeof PROBLEM_KEYS[number];

type PieChartProblemCount = {
  key: ProblemKey;
  total: number;
  rejected: number;
  solved: number;
};

const PROBLEM_POSITION: Partial<Record<string, number>> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  F2: 5,
  G: 6,
  H: 7,
  Ex: 7,
  I: 8,
  J: 9,
  K: 10,
  L: 11,
  M: 12,
  N: 13,
  O: 14,
};

const solvedCountForPieChart = (
  contestToProblems: [string, Problem[]][],
  submissions: Map<string, Submission[]>,
  userId: string
): PieChartProblemCount[] => {
  const counts: PieChartProblemCount[] = PROBLEM_KEYS.map((key) => ({
    key,
    total: 0,
    rejected: 0,
    solved: 0,
  }));

  contestToProblems.forEach(([, problems]) => {
    problems.forEach((problem) => {
      const position = PROBLEM_POSITION[problem.problem_index];

      if (position === undefined) {
        // tslint:disable-next-line:no-console
        console.error(`Unsupported problemIndex: ${problem.problem_index}`);
        return;
      }

      const validSubmissions = submissions
        .get(problem.id)
        ?.filter(
          (submission) =>
            caseInsensitiveUserId(submission.user_id) === userId &&
            isValidResult(submission.result)
        );

      const count = counts[position];
      count.total++;

      if (
        validSubmissions?.some((submission) => isAccepted(submission.result))
      ) {
        count.solved++;
      } else if (validSubmissions !== undefined) {
        count.rejected++;
      }
    });
  });

  return counts.filter(({ total }) => total > 0);
};

interface Props {
  userId: string;
}

export const PieChartBlock = (props: Props) => {
  const submissionsMap = (useUserSubmission(props.userId) ?? []).reduce(
    (map, submission) => {
      const submissions = map.get(submission.problem_id) ?? [];
      submissions.push(submission);
      map.set(submission.problem_id, submissions);
      return map;
    },
    new Map<ProblemId, Submission[]>()
  );
  const contestToProblems =
    useContestToProblems() ?? new Map<ContestId, Problem[]>();

  const abcSolved = solvedCountForPieChart(
    Array.from(contestToProblems).filter(([contestId]) =>
      contestId.startsWith("abc")
    ),
    submissionsMap,
    props.userId
  );
  const arcSolved = solvedCountForPieChart(
    Array.from(contestToProblems).filter(([contestId]) =>
      contestId.startsWith("arc")
    ),
    submissionsMap,
    props.userId
  );
  const agcSolved = solvedCountForPieChart(
    Array.from(contestToProblems).filter(([contestId]) =>
      contestId.startsWith("agc")
    ),
    submissionsMap,
    props.userId
  );
  const awcSolved = solvedCountForPieChart(
    Array.from(contestToProblems).filter(([contestId]) =>
      contestId.startsWith("awc")
    ),
    submissionsMap,
    props.userId
  );
  return (
    <>
      <PieCharts
        problems={abcSolved}
        title="AtCoder Beginner Contest"
        problemHLabel="H/Ex"
      />
      <PieCharts problems={arcSolved} title="AtCoder Regular Contest" />
      <PieCharts problems={agcSolved} title="AtCoder Grand Contest" />
      <PieCharts problems={awcSolved} title="AtCoder Weekday Contest" />
    </>
  );
};

interface PieChartsProps {
  problems: PieChartProblemCount[];
  title: string;
  problemHLabel?: "H" | "H/Ex";
}

const PieCharts: React.FC<PieChartsProps> = ({
  problems,
  title,
  problemHLabel = "H",
}) => (
  <div>
    <Row className="my-2 border-bottom">
      <h1>{title}</h1>
    </Row>

    <Row className="my-3">
      {problems.map(({ key, solved, rejected, total }) => {
        const displayKey = key === "H" ? problemHLabel : key;

        return (
          <Col
            key={key}
            className="text-center"
            xs="6"
            md={Math.max(2, Math.ceil(12 / problems.length))}
          >
            <SmallPieChart
              accepted={solved}
              rejected={rejected}
              trying={total - solved - rejected}
              title={`Problem ${displayKey}`}
            />
          </Col>
        );
      })}
    </Row>
  </div>
);
