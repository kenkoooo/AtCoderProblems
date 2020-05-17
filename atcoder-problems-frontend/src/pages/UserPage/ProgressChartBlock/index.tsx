import React from "react";
import { Row } from "reactstrap";
import { DailyEffortBarChart } from "./DailyEffortBarChart";
import { parseDateLabel } from "../../../utils/DateUtil";
import { ClimbingLineChart } from "./ClimbingLineChart";
import Submission from "../../../interfaces/Submission";
import { FilteringHeatmap } from "./FilteringHeatmap";

interface Props {
  dailyCount: { dateLabel: string; count: number }[];
  userSubmissions: Submission[];
}

export const ProgressChartBlock: React.FC<Props> = (props) => {
  const { dailyCount, userSubmissions } = props;
  const climbing = dailyCount.reduce((list, { dateLabel, count }) => {
    const dateSecond = parseDateLabel(dateLabel).unix();
    const last = list.length === 0 ? undefined : list[list.length - 1];
    if (last) {
      list.push({ dateSecond, count: last.count + count });
    } else {
      list.push({ dateSecond, count });
    }
    return list;
  }, [] as { dateSecond: number; count: number }[]);

  return (
    <>
      <Row className="my-2 border-bottom">
        <h1>Daily Effort</h1>
      </Row>
      <DailyEffortBarChart
        dailyData={dailyCount.map(({ dateLabel, count }) => ({
          dateSecond: parseDateLabel(dateLabel).unix(),
          count,
        }))}
      />

      <Row className="my-2 border-bottom">
        <h1>Climbing</h1>
      </Row>
      <ClimbingLineChart climbingData={climbing} />

      <Row className="my-2 border-bottom">
        <h1>Heatmap</h1>
      </Row>
      <FilteringHeatmap submissions={userSubmissions} />
    </>
  );
};
