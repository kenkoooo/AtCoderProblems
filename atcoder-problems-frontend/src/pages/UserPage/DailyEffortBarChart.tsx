import React from "react";
import { Row } from "reactstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import { formatDate } from "../../utils/DateFormat";

const DailyEffortBarChart = ({
  daily_data
}: {
  daily_data: { date: number; count: number }[];
}) => (
  <Row className="my-3">
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={daily_data}
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
          tickFormatter={(ms: number) => formatDate(ms / 1000)}
        />
        <YAxis />
        <Tooltip labelFormatter={(v: any) => formatDate(v / 1000)} />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  </Row>
);

export default DailyEffortBarChart;
