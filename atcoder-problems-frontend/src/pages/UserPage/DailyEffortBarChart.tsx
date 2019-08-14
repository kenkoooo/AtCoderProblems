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

interface Props {
  daily_data: { date: number; count: number }[];
}

import { formatDateSecond } from "../../utils/DateFormat";

const DailyEffortBarChart = (props: Props) => (
  <Row className="my-3">
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={props.daily_data}
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
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  </Row>
);

export default DailyEffortBarChart;
