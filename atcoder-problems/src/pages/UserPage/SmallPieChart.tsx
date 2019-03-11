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
  data
}: {
  data: { name: string; value: number }[];
}) => (
  <div>
    <h5>Rated Point Sum</h5>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie dataKey="value" data={data} outerRadius="80%" fill="#ff0000">
          {data.map((e, i) => {
            if (e.name === "Trying" || e.name === "Accepted") {
              return <Cell key={i} fill={COLORS[e.name]} />;
            } else {
              throw `Unknown key: ${e.name}`;
            }
          })}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
    <h5 className="text-muted">Text</h5>
  </div>
);

export default SmallPieChart;
