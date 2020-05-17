import React from "react";
import { ProblemId } from "../../../interfaces/Status";
import ProblemModel from "../../../interfaces/ProblemModel";
import {
  getRatingColor,
  getRatingColorCode,
  RatingColor,
  RatingColors,
} from "../../../utils";
import { Row, Col } from "reactstrap";
import { SinglePieChart } from "../../../components/SinglePieChart";

interface Props {
  problemModels: Map<ProblemId, ProblemModel>;
  solvedProblemIds: ProblemId[];
}

export const DifficultyPieChart: React.FC<Props> = (props) => {
  const colorCount = new Map<RatingColor, number>();
  props.problemModels.forEach((model) => {
    if (model.difficulty !== undefined) {
      const color = getRatingColor(model.difficulty);
      const curCount = colorCount.get(color) ?? 0;
      colorCount.set(color, curCount + 1);
    }
  });

  const solvedCount = props.solvedProblemIds.reduce((map, problemId) => {
    const model = props.problemModels.get(problemId);
    if (model?.difficulty !== undefined) {
      const color = getRatingColor(model.difficulty);
      const curCount = map.get(color) ?? 0;
      map.set(color, curCount + 1);
      return map;
    }
    return map;
  }, new Map<RatingColor, number>());

  const data = RatingColors.map((ratingColor) => {
    const totalCount = colorCount.get(ratingColor) ?? 0;
    const solved = solvedCount.get(ratingColor) ?? 0;
    const color = getRatingColorCode(ratingColor);
    return { color, totalCount, solved };
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
                  { name: "Accepted", color: e.color, value: e.solved },
                  {
                    name: "Trying",
                    color: "#58616a",
                    value: e.totalCount - e.solved,
                  },
                ]}
              />
              <h5 className="text-muted">{`${e.solved} / ${e.totalCount}`}</h5>
            </Col>
          ))}
      </Row>
    </div>
  );
};
