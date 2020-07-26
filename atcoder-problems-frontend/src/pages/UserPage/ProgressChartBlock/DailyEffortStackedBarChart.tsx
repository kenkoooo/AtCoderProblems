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
import {
  getRatingColorCode,
  RatingColor,
  RatingColors,
  mapToObject,
} from "../../../utils";
import { formatMomentDate, parseSecond } from "../../../utils/DateUtil";
import { DailyEffortTooltip } from "./DailyEffortTooltip";

interface Props {
  dailyColorCount: {
    dateSecond: number;
    countMap: Map<RatingColor, number>;
  }[];
  yRange: number | "auto";
}

export const DailyEffortStackedBarChart: React.FC<Props> = (props) => {
  const { dailyColorCount, yRange } = props;

  const dailyCount = dailyColorCount.map(({ dateSecond, countMap }) => {
    return { ...mapToObject(countMap), dateSecond };
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
          <YAxis domain={[0, yRange]} allowDataOverflow={true} />
          <Tooltip content={DailyEffortTooltip} />

          {RatingColors.map((ratingColor) => {
            const color = getRatingColorCode(ratingColor);
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
