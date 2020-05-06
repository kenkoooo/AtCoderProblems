import React from "react";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend
} from "recharts";

interface Entry {
  value: number;
  color: string;
  name: string;
}
interface Props {
  data: Entry[];
}

export const SinglePieChart = ({ data }: Props) => {
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie dataKey="value" data={data} outerRadius="80%" fill="#ff0000">
            {data.map(e => (
              <Cell key={e.name} fill={e.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
