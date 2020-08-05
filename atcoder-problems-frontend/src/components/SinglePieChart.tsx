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

  const text: string = ((name: string) => {
    if (name === "Accepted") return "AC";
    else return name;
  })(payload.name);

  return (
    <g>
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        fill={"#111"}
      >{`${value}`}</text>
      <text x={cx} y={cy - 5} dy={18} textAnchor="middle" fill={"#333"}>{`(${(
        percent * 100
      ).toFixed(1)}%)`}</text>
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
        innerRadius={outerRadius + 3}
        outerRadius={outerRadius + 5}
        fill={fill}
      />
    </g>
  );
};

export const SinglePieChart: React.FC<Props> = ({ data, hideLegend }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // eslint-disable-next-line
  const onPieEnter = ({}, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(0);
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            dataKey="value"
            data={data}
            innerRadius="55%"
            outerRadius="80%"
            fill="#ff0000"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
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
