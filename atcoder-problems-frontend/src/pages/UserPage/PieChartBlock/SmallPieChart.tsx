import React from "react";
import { SinglePieChart } from "../../../components/SinglePieChart";

const COLORS = {
  Accepted: "#32cd32",
  Trying: "#58616a"
};

export const SmallPieChart = ({
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
      <SinglePieChart data={data} />
      <h5>{title}</h5>
      <h5 className="text-muted">{`${accepted} / ${accepted + trying}`}</h5>
    </div>
  );
};
