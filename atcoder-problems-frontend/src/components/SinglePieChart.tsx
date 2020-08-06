import React, { useState } from "react";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Sector,
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
interface RenderProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: Entry;
  value: number;
  percent: number;
}

const renderActiveShape = (props: RenderProps) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value,
    percent,
  } = props;

  return (
    <g className="pie-chart-summary">
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 2}
        outerRadius={outerRadius + 4}
        fill={fill}
      />
      <text x={cx} y={cy}>{`${payload.name} : ${value}`}</text>
      <text x={cx} y={cy} dy={17}>{`${(percent * 100).toFixed(1)}%`}</text>
    </g>
  );
};

export const SinglePieChart: React.FC<Props> = ({ data, hideLegend }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            dataKey="value"
            data={data}
            innerRadius="60%"
            outerRadius="80%"
            fill="#ff0000"
            // eslint-disable-next-line
            onMouseEnter={({}, index: number) => {
              setActiveIndex(index);
            }}
            onMouseLeave={() => {
              setActiveIndex(0);
            }}
          >
            {data.map((e) => (
              <Cell key={e.name} fill={e.color} />
            ))}
          </Pie>
          {!hideLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
