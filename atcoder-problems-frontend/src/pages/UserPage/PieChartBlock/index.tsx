import { Col, Row } from "reactstrap";
import React from "react";
import { SmallPieChart } from "./SmallPieChart";
import Problem from "../../../interfaces/Problem";
import Submission from "../../../interfaces/Submission";
import { isAccepted } from "../../../utils";
import { ContestId, ProblemId } from "../../../interfaces/Status";

const solvedCountForPieChart = (
  contestToProblems: [string, Problem[]][],
  submissions: Map<string, Submission[]>,
  userId: string
): {
  total: number;
  solved: number;
}[] => {
  const mapProblemPosition = (contestId: string, problemId: string): number => {
    const contestPrefix = contestId.substring(0, 3);
    const problemPrefix = problemId.substring(0, 3);
    const shift = contestPrefix === "abc" && problemPrefix === "arc";
    switch (problemId.substring(7, 8)) {
      case "1":
      case "a": {
        return shift ? 2 : 0;
      }
      case "2":
      case "b": {
        return shift ? 3 : 1;
      }
      case "3":
      case "c": {
        return 2;
      }
      case "4":
      case "d": {
        return 3;
      }
      case "e": {
        return 4;
      }
      case "f": {
        return 5;
      }
      default: {
        // tslint:disable-next-line
        console.error(`Unsupported problemId: ${contestId}/${problemId}`);
        return 0;
      }
    }
  };

  const userCount = contestToProblems
    .map(([contestId, problems]) => {
      const problemIds = problems
        .filter((problem) => {
          const userAccepted = submissions
            .get(problem.id)
            ?.filter((s) => s.user_id === userId)
            ?.find((s) => isAccepted(s.result));
          return !!userAccepted;
        })
        .map((problem) => problem.id);
      return { contestId, problemIds };
    })
    .map(({ problemIds, contestId }) =>
      problemIds.map((problemId) => mapProblemPosition(contestId, problemId))
    )
    .flatMap((list) => list)
    .reduce(
      (count, position) => {
        count[position] += 1;
        return count;
      },
      [0, 0, 0, 0, 0, 0]
    );
  const totalCount = contestToProblems
    .map(([contestId, problems]) => {
      const problemIds = problems.map((problem) => problem.id);
      return { contestId, problemIds };
    })
    .map(({ problemIds, contestId }) =>
      problemIds.map((problemId) => mapProblemPosition(contestId, problemId))
    )
    .flatMap((list) => list)
    .reduce(
      (count, position) => {
        count[position] += 1;
        return count;
      },
      [0, 0, 0, 0, 0, 0]
    );
  return totalCount
    .map((total, index) => ({
      total,
      solved: userCount[index],
    }))
    .filter((x) => x.total > 0);
};

interface Props {
  userId: string;
  submissions: Map<ProblemId, Submission[]>;
  contestToProblems: Map<ContestId, Problem[]>;
}

export const PieChartBlock: React.FC<Props> = (props) => {
  const { contestToProblems } = props;
  const abcSolved = solvedCountForPieChart(
    Array.from(contestToProblems).filter(([contestId]) =>
      contestId.startsWith("abc")
    ),
    props.submissions,
    props.userId
  );
  const arcSolved = solvedCountForPieChart(
    Array.from(contestToProblems).filter(([contestId]) =>
      contestId.startsWith("arc")
    ),
    props.submissions,
    props.userId
  );
  const agcSolved = solvedCountForPieChart(
    Array.from(contestToProblems).filter(([contestId]) =>
      contestId.startsWith("agc")
    ),
    props.submissions,
    props.userId
  );
  return (
    <>
      <PieCharts problems={abcSolved} title="AtCoder Beginner Contest" />
      <PieCharts problems={arcSolved} title="AtCoder Regular Contest" />
      <PieCharts problems={agcSolved} title="AtCoder Grand Contest" />
    </>
  );
};

interface PieChartsProps {
  problems: { total: number; solved: number }[];
  title: string;
}

const PieCharts: React.FC<PieChartsProps> = ({ problems, title }) => (
  <div>
    <Row className="my-2 border-bottom">
      <h1>{title}</h1>
    </Row>
    <Row className="my-3">
      {problems.map(({ solved, total }, i) => {
        const key = "ABCDEF".charAt(i);
        return (
          <Col
            key={key}
            className="text-center"
            xs="6"
            md={12 / problems.length}
          >
            <SmallPieChart
              accepted={solved}
              trying={total - solved}
              title={`Problem ${key}`}
            />
          </Col>
        );
      })}
    </Row>
  </div>
);
