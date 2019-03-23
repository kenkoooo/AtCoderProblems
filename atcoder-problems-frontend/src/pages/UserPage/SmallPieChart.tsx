import React from "react";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend
} from "recharts";

const COLORS = {
  Accepted: "#32cd32",
  Trying: "#58616a"
};

const SmallPieChart = ({
  title,
  trying,
  accepted
}: {
  title: string;
  trying: number;
  accepted: number;
}) => {
  const data = [
    { value: accepted, color: COLORS.Accepted, name: "Accepted" },
    { value: trying, color: COLORS.Trying, name: "Trying" }
  ];
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie dataKey="value" data={data} outerRadius="80%" fill="#ff0000">
            {data.map((e, i) => (
              <Cell key={e.name} fill={e.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <h5>{title}</h5>
      <h5 className="text-muted">{`${accepted} / ${accepted + trying}`}</h5>
    </div>
  );
};

export default SmallPieChart;
