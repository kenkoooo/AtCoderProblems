import React from "react";
import { Row, ButtonGroup, Button } from "reactstrap";
import { List, Map as ImmutableMap } from "immutable";
import {
  getRatingColor,
  ProblemColor,
  ProblemColors,
  isAccepted,
} from "../../../utils";
import {
  formatMomentDate,
  parseSecond,
  parseDateLabel,
} from "../../../utils/DateUtil";
import { useLocalStorage } from "../../../utils/LocalStorage";
import Submission from "../../../interfaces/Submission";
import ProblemModel from "../../../interfaces/ProblemModel";
import { ProblemId } from "../../../interfaces/Status";
import { DailyEffortBarChart } from "./DailyEffortBarChart";
import { DailyEffortStackedBarChart } from "./DailyEffortStackedBarChart";
import { ClimbingLineChart } from "./ClimbingLineChart";
import { ClimbingAreaChart } from "./ClimbingAreaChart";
import { FilteringHeatmap } from "./FilteringHeatmap";

interface Props {
  problemModels: ImmutableMap<ProblemId, ProblemModel>;
  submissions: ImmutableMap<ProblemId, List<Submission>>;
  userId: string;
  dailyCount: { dateLabel: string; count: number }[];
  userSubmissions: Submission[];
}

const chartTypes = ["Simple", "Colored"] as const;
type ChartType = typeof chartTypes[number];
interface ChartTypeTabProps {
  active: ChartType;
  setActive: (next: ChartType) => void;
}
const ChartTypeTabButtons: React.FC<ChartTypeTabProps> = (props) => {
  const { active, setActive } = props;
  return (
    <Row>
      <ButtonGroup className="table-tab">
        {chartTypes.map((chartType, i) => (
          <Button
            key={i}
            color="secondary"
            onClick={(): void => {
              setActive(chartType);
            }}
            active={active === chartType}
          >
            {chartType}
          </Button>
        ))}
      </ButtonGroup>
    </Row>
  );
};

export const ProgressChartBlock: React.FC<Props> = (props) => {
  const [
    dailyEffortBarChartAactiveTab,
    setDailyEffortBarChartAactiveTab,
  ] = useLocalStorage<ChartType>("dailyEffortBarChartAactiveTab", "Simple");
  const [
    climbingLineChartAactiveTab,
    setClimbingLineChartAactiveTab,
  ] = useLocalStorage<ChartType>("climbingLineChartAactiveTab", "Simple");
  const {
    problemModels,
    submissions,
    userId,
    dailyCount,
    userSubmissions,
  } = props;
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

  const dailyColorCount = submissions
    .map((submissionList) =>
      submissionList
        .filter((s) => s.user_id === userId && isAccepted(s.result))
        .sort((a, b) => a.epoch_second - b.epoch_second)
        .first(undefined)
    )
    .filter(
      (submission: Submission | undefined): submission is Submission =>
        submission !== undefined
    )
    .reduce(
      (map, submission) => {
        const date = formatMomentDate(parseSecond(submission.epoch_second));
        return map.update(
          date,
          ImmutableMap<ProblemColor, number>(
            ProblemColors.map((ratingColor) => [ratingColor, 0])
          ),
          (countMap) => {
            const model = problemModels.get(submission.problem_id);
            const color =
              model?.difficulty !== undefined
                ? getRatingColor(model.difficulty)
                : "Black";
            const curCount = countMap.get(color) ?? 0;
            return countMap.set(color, curCount + 1);
          }
        );
      },
      ImmutableMap<string, ImmutableMap<ProblemColor, number>>() // date -> color -> count
    )
    .entrySeq()
    .map(([dateLabel, countMap]) => ({
      dateSecond: parseDateLabel(dateLabel).unix(),
      countMap,
    }))
    .sort((a, b) => a.dateSecond - b.dateSecond);
  const mergeCountMap = (
    lastMap: ImmutableMap<ProblemColor, number>,
    curMap: ImmutableMap<ProblemColor, number>
  ): ImmutableMap<ProblemColor, number> =>
    curMap
      .keySeq()
      .reduce(
        (map, key) =>
          map.update(
            key,
            0,
            (count) => count + lastMap.get(key, 0) + curMap.get(key, 0)
          ),
        ImmutableMap<ProblemColor, number>()
      );

  const colorClimbing = dailyColorCount.reduce(
    (list, { dateSecond, countMap }) => {
      const last = list.length === 0 ? undefined : list[list.length - 1];
      if (last) {
        list.push({
          dateSecond,
          countMap: mergeCountMap(last.countMap, countMap),
        });
      } else {
        list.push({ dateSecond, countMap });
      }
      return list;
    },
    [] as { dateSecond: number; countMap: ImmutableMap<ProblemColor, number> }[]
  );

  return (
    <>
      <Row className="my-2 border-bottom">
        <h1>Daily Effort</h1>
      </Row>
      <ChartTypeTabButtons
        active={dailyEffortBarChartAactiveTab}
        setActive={setDailyEffortBarChartAactiveTab}
      />
      {dailyEffortBarChartAactiveTab === "Simple" ? (
        <DailyEffortBarChart
          dailyData={dailyCount.map(({ dateLabel, count }) => ({
            dateSecond: parseDateLabel(dateLabel).unix(),
            count,
          }))}
        />
      ) : (
        <DailyEffortStackedBarChart
          dailyColorCount={dailyColorCount.toArray()}
        />
      )}

      <Row className="my-2 border-bottom">
        <h1>Climbing</h1>
      </Row>
      <ChartTypeTabButtons
        active={climbingLineChartAactiveTab}
        setActive={setClimbingLineChartAactiveTab}
      />
      {climbingLineChartAactiveTab === "Simple" ? (
        <ClimbingLineChart climbingData={climbing} />
      ) : (
        <ClimbingAreaChart colorClimbing={colorClimbing} />
      )}

      <Row className="my-2 border-bottom">
        <h1>Heatmap</h1>
      </Row>
      <FilteringHeatmap submissions={userSubmissions} />
    </>
  );
};
