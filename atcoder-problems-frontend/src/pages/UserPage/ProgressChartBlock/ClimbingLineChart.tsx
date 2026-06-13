import React from "react";
import { Row } from "reactstrap";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { formatMomentDate, parseSecond } from "../../../utils/DateUtil";

interface Props {
  climbingData: { dateSecond: number; count: number }[];
}

export const ClimbingLineChart: React.FC<Props> = (props) => (
  <Row className="my-3">
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={props.climbingData}
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
        <Tooltip
          labelFormatter={(dateSecond: number | string): string =>
            typeof dateSecond === "number"
              ? formatMomentDate(parseSecond(dateSecond))
              : dateSecond
          }
        />
        <Line dataKey="count" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  </Row>
);
