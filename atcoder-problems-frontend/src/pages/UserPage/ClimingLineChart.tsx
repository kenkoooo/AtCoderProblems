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

import { formatDate } from "../../utils/DateFormat";

const ClimingLineChart = ({
  climing_data
}: {
  climing_data: { date: number; count: number }[];
}) => (
  <Row className="my-3">
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={climing_data}
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
        <Line dataKey="count" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  </Row>
);
export default ClimingLineChart;
