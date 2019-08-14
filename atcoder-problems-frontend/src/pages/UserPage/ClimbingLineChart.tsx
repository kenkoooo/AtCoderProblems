import React from "react";
import { Row } from "reactstrap";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer
} from "recharts";

import { formatDateSecond } from "../../utils/DateFormat";

const ClimbingLineChart = ({
  climbing_data
}: {
  climbing_data: { date: number; count: number }[];
}) => (
  <Row className="my-3">
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={climbing_data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(ms: number) => formatDateSecond(ms / 1000)}
        />
        <YAxis />
        <Tooltip labelFormatter={(v: any) => formatDateSecond(v / 1000)} />
        <Line dataKey="count" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  </Row>
);
export default ClimbingLineChart;
