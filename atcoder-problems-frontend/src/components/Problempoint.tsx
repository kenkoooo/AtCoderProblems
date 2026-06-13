import React from "react";

interface Props {
  point: number;
}

const formatPoint = (point: number): string => {
  const INF_POINT = 1e18;
  if (point >= INF_POINT) {
    return "";
  } else {
    return point.toString();
  }
};

export const ProblemPoint: React.FC<Props> = (props) => {
  const { point } = props;
  return <div className="table-problem-point"> {formatPoint(point)} </div>;
};
