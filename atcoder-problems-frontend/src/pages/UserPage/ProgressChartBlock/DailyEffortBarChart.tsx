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
import { formatMomentDate, parseSecond } from "../../../utils/DateUtil";

interface Props {
  dailyData: { dateSecond: number; count: number }[];
}

export const DailyEffortBarChart: React.FC<Props> = (props) => (
  <Row className="my-3">
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={props.dailyData}
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
            typeof dateSecond === "string"
              ? dateSecond
              : formatMomentDate(parseSecond(dateSecond))
          }
        />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  </Row>
);
