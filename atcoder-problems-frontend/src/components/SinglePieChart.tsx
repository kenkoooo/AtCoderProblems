import React from "react";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface Entry {
  value: number;
  color: string;
  name: string;
}
interface Props {
  data: Entry[];
  hideLegend?: boolean;
}

export const SinglePieChart: React.FC<Props> = ({ data, hideLegend }) => {
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie dataKey="value" data={data} outerRadius="80%" fill="#ff0000">
            {data.map((e) => (
              <Cell key={e.name} fill={e.color} />
            ))}
          </Pie>
          <Tooltip />
          {!hideLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
