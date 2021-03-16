import React from "react";
import { Row, Col } from "reactstrap";
import { connect, PromiseState } from "react-refetch";
import { useUserSubmission } from "../../../api/APIClient";
import { ProblemId } from "../../../interfaces/Status";
import ProblemModel from "../../../interfaces/ProblemModel";
import {
  getRatingColor,
  getRatingColorCode,
  RatingColor,
  RatingColors,
} from "../../../utils";
import { SinglePieChart } from "../../../components/SinglePieChart";
import { solvedProblemIdsFromArray } from "../UserUtils";
import { cachedProblemModels } from "../../../utils/CachedApiClient";
import * as ImmutableMigration from "../../../utils/ImmutableMigration";

interface OuterProps {
  userId: string;
}

interface InnerProps extends OuterProps {
  problemModelsFetch: PromiseState<Map<ProblemId, ProblemModel>>;
}

const InnerDifficultyPieChart: React.FC<InnerProps> = (props) => {
  const submissions = useUserSubmission(props.userId) ?? [];
  const problemModels = props.problemModelsFetch.fulfilled
    ? props.problemModelsFetch.value
    : new Map<ProblemId, ProblemModel>();

  const colorCount = new Map<RatingColor, number>();
  problemModels.forEach((model) => {
    if (model.difficulty !== undefined) {
      const color = getRatingColor(model.difficulty);
      const curCount = colorCount.get(color) ?? 0;
      colorCount.set(color, curCount + 1);
    }
  });

  const solvedCount = solvedProblemIdsFromArray(submissions).reduce(
    (map, problemId) => {
      const model = problemModels.get(problemId);
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

  const data = RatingColors.filter(
    (ratingColor) => ratingColor !== "Black"
  ).map((ratingColor) => {
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
                  { name: "AC", color: e.color, value: e.solved },
                  {
                    name: "NoSub",
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

export const DifficultyPieChart = connect<OuterProps, InnerProps>(() => ({
  problemModelsFetch: {
    value: cachedProblemModels().then((map) =>
      ImmutableMigration.convertMap(map)
    ),
  },
}))(InnerDifficultyPieChart);
