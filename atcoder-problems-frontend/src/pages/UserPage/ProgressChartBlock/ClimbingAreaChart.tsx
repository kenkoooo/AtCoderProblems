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
import {
  getRatingColorCode,
  RatingColor,
  RatingColors,
  mapToObject,
} from "../../../utils";
import { formatMomentDate, parseSecond } from "../../../utils/DateUtil";
import { DailyEffortTooltip } from "./DailyEffortTooltip";

interface Props {
  colorClimbing: {
    dateSecond: number;
    countMap: Map<RatingColor, number>;
  }[];
}

export const ClimbingAreaChart: React.FC<Props> = (props) => {
  const { colorClimbing } = props;

  const dailyCount = colorClimbing.map(({ dateSecond, countMap }) => {
    return { ...mapToObject(countMap), dateSecond };
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

          {RatingColors.map((ratingColor) => {
            const color = getRatingColorCode(ratingColor);
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
