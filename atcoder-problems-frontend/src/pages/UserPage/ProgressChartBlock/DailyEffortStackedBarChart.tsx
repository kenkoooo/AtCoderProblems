import React from "react";
import { Row } from "reactstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Map as ImmutableMap } from "immutable";
import {
  getProblemColorCode,
  ProblemColor,
  ProblemColors,
} from "../../../utils";
import { formatMomentDate, parseSecond } from "../../../utils/DateUtil";
import { DailyEffortTooltip } from "./DailyEffortTooltip";

interface Props {
  dailyColorCount: {
    dateSecond: number;
    countMap: ImmutableMap<ProblemColor, number>;
  }[];
}

export const DailyEffortStackedBarChart: React.FC<Props> = (props) => {
  const { dailyColorCount } = props;

  const dailyCount = dailyColorCount.map(({ dateSecond, countMap }) => {
    const counts = countMap.toObject();
    counts["dateSecond"] = dateSecond;
    return counts;
  });

  return (
    <Row className="my-3">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={dailyCount}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="dateSecond"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(dateSecond: number): string =>
              formatMomentDate(parseSecond(dateSecond))
            }
          />
          <YAxis />
          <Tooltip content={DailyEffortTooltip} />

          {ProblemColors.map((ratingColor) => {
            const color = getProblemColorCode(ratingColor);
            return (
              <Bar
                dataKey={ratingColor}
                key={ratingColor}
                stackId="1"
                stroke={color}
                fill={color}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </Row>
  );
};
