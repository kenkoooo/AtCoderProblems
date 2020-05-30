import React from "react";
import { Row } from "reactstrap";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
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
  colorClimbing: {
    dateSecond: number;
    countMap: ImmutableMap<ProblemColor, number>;
  }[];
}

export const ClimbingAreaChart: React.FC<Props> = (props) => {
  const { colorClimbing } = props;

  const dailyCount = colorClimbing.map(({ dateSecond, countMap }) => {
    const counts = countMap.toObject();
    counts["dateSecond"] = dateSecond;
    return counts;
  });

  return (
    <Row className="my-3">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
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
              <Area
                type="monotone"
                dataKey={ratingColor}
                key={ratingColor}
                stackId="1"
                stroke={color}
                fill={color}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </Row>
  );
};
