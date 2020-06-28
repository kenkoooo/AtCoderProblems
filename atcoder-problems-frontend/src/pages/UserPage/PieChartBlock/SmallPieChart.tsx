import React from "react";
import { SinglePieChart } from "../../../components/SinglePieChart";

const COLORS = {
  Accepted: "#32cd32",
  Trying: "#58616a",
  Rejected: "#fd9",
};

interface SmallPieChartProps {
  title: string;
  trying: number;
  accepted: number;
  rejected: number;
}

export const SmallPieChart: React.FC<SmallPieChartProps> = ({
  title,
  trying,
  rejected,
  accepted,
}) => {
  const data = [
    { value: accepted, color: COLORS.Accepted, name: "Accepted" },
    { value: rejected, color: COLORS.Rejected, name: "Not Passed" },
    { value: trying, color: COLORS.Trying, name: "Not Submitted" },
  ];
  const totalCount = trying + rejected + accepted;
  return (
    <div>
      <SinglePieChart data={data} hideLegend />
      <h5>{title}</h5>
      <h5 className="text-muted">{`${accepted} / ${totalCount}`}</h5>
    </div>
  );
};
