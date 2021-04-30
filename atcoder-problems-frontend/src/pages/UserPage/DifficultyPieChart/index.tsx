import React from "react";
import { Row, Col } from "reactstrap";
import { useProblemModelMap, useUserSubmission } from "../../../api/APIClient";
import {
  getRatingColor,
  getRatingColorCode,
  RatingColor,
  RatingColors,
} from "../../../utils";
import { SinglePieChart } from "../../../components/SinglePieChart";
import {
  rejectedProblemIdsFromArray,
  solvedProblemIdsFromArray,
} from "../UserUtils";

interface Props {
  userId: string;
}

const getPieChartTitle = (ratingColor: RatingColor): string => {
  if (!RatingColors.includes(ratingColor) || ratingColor === "Black") {
    return "";
  }
  if (ratingColor === "Red") {
    return "Difficulty 2800-";
  }
  const index = RatingColors.indexOf(ratingColor) - 1;
  const str =
    "Difficulty " +
    (index * 400).toString() +
    "-" +
    ((index + 1) * 400 - 1).toString();
  return str;
};

export const DifficultyPieChart: React.FC<Props> = (props) => {
  const submissions = useUserSubmission(props.userId) ?? [];
  const problemModels = useProblemModelMap();
  const colorCount = new Map<RatingColor, number>();
  Array.from(problemModels?.values() ?? []).forEach((model) => {
    if (model.difficulty !== undefined) {
      const color = getRatingColor(model.difficulty);
      const curCount = colorCount.get(color) ?? 0;
      colorCount.set(color, curCount + 1);
    }
  });

  const solvedCount = solvedProblemIdsFromArray(submissions).reduce(
    (map, problemId) => {
      const model = problemModels?.get(problemId);
      if (model?.difficulty !== undefined) {
        const color = getRatingColor(model.difficulty);
        const curCount = map.get(color) ?? 0;
        map.set(color, curCount + 1);
        return map;
      }
      return map;
    },
    new Map<RatingColor, number>()
  );

  // eslint-disable-next-line
  const rejectedIds = rejectedProblemIdsFromArray(submissions);
  const rejectedCount = rejectedIds.reduce((map, problemId) => {
    const model = problemModels?.get(problemId);
    if (model?.difficulty !== undefined) {
      const color = getRatingColor(model.difficulty);
      const curCount = map.get(color) ?? 0;
      map.set(color, curCount + 1);
      return map;
    }
    return map;
  }, new Map<RatingColor, number>());

  const data = RatingColors.filter(
    (ratingColor) => ratingColor !== "Black"
  ).map((ratingColor) => {
    const totalCount = colorCount.get(ratingColor) ?? 0;
    const solved = solvedCount.get(ratingColor) ?? 0;
    const rejected = rejectedCount.get(ratingColor) ?? 0;
    const color = getRatingColorCode(ratingColor);
    const title = getPieChartTitle(ratingColor);
    return { color, totalCount, solved, rejected, title };
  });

  return (
    <div>
      <Row className="my-3">
        {data
          .filter((e) => e.totalCount > 0)
          .map((e) => (
            <Col key={e.color} className="text-center" xs="6" md="3">
              <SinglePieChart
                data={[
                  { name: "AC", color: e.color, value: e.solved },
                  { name: "Non-AC", color: "#fd9", value: e.rejected },
                  {
                    name: "NoSub",
                    color: "#58616a",
                    value: e.totalCount - e.solved - e.rejected,
                  },
                ]}
              />
              <h5 className="text-muted">
                {`${e.solved} / ${e.rejected} /
                ${e.totalCount - e.solved - e.rejected}`}
              </h5>
              <h5>{e.title}</h5>
            </Col>
          ))}
      </Row>
    </div>
  );
};
