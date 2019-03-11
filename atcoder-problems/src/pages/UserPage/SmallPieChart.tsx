import React from "react";
import { PieChart, Pie, ResponsiveContainer } from "recharts";

const SmallPieChart = ({
  data
}: {
  data: { name: string; value: number }[];
}) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        dataKey="value"
        data={data}
        innerRadius="90%"
        outerRadius="100%"
        fill="#ff0000"
        paddingAngle={5}
      />
    </PieChart>
  </ResponsiveContainer>
);

export default SmallPieChart;
