import React from "react";
import {
  Row,
  FormGroup,
  ButtonGroup,
  Button,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Label,
  CustomInput,
  UncontrolledDropdown,
} from "reactstrap";
import {
  getRatingColor,
  RatingColor,
  RatingColors,
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
  problemModels: Map<ProblemId, ProblemModel>;
  submissions: Map<ProblemId, Submission[]>;
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
    <ButtonGroup className="mr-3 table-tab">
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
  );
};

type YRanges = number | "auto";
interface YRangeTabProps {
  active: YRanges;
  setActive: (next: YRanges) => void;
}
const YRangeTabButtons: React.FC<YRangeTabProps> = (props) => {
  const { active, setActive } = props;
  const RANGES: YRanges[] = [10, 20, 50, 100, "auto"];
  return (
    <ButtonGroup>
      <UncontrolledDropdown>
        <DropdownToggle caret>{"Y-Range"}</DropdownToggle>
        <DropdownMenu>
          {RANGES.map((range) => (
            <DropdownItem
              key={range}
              onClick={(): void => setActive(range)}
              active={active === range}
            >
              {range}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </UncontrolledDropdown>
    </ButtonGroup>
  );
};

export const ProgressChartBlock: React.FC<Props> = (props) => {
  const [
    dailyEffortBarChartActiveTab,
    setDailyEffortBarChartActiveTab,
  ] = useLocalStorage<ChartType>("dailyEffortBarChartActiveTab", "Simple");
  const [dailyEffortYRange, setDailyEffortYRange] = useLocalStorage<YRanges>(
    "dailyEffortYRange",
    "auto"
  );
  const [
    climbingLineChartActiveTab,
    setClimbingLineChartActiveTab,
  ] = useLocalStorage<ChartType>("climbingLineChartActiveTab", "Simple");
  const [reverseColorOrder, setReverseColorOrder] = useLocalStorage(
    "climbingLineChartReverseColorOrder",
    false
  );
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

  const dateColorCountMap = Array.from(submissions.values())
    .map((submissionList) =>
      submissionList
        .filter((s) => s.user_id === userId && isAccepted(s.result))
        .sort((a, b) => a.epoch_second - b.epoch_second)
        .find(() => true)
    )
    .filter(
      (submission: Submission | undefined): submission is Submission =>
        submission !== undefined
    )
    .reduce(
      (map, submission) => {
        const date = formatMomentDate(parseSecond(submission.epoch_second));
        const countMap =
          map.get(date) ??
          new Map<RatingColor, number>(
            RatingColors.map((ratingColor) => [ratingColor, 0])
          );
        const model = problemModels.get(submission.problem_id);
        const color =
          model?.difficulty !== undefined
            ? getRatingColor(model.difficulty)
            : "Black";
        const curCount = countMap.get(color) ?? 0;
        countMap.set(color, curCount + 1);
        map.set(date, countMap);
        return map;
      },
      new Map<string, Map<RatingColor, number>>() // date -> color -> count
    );
  const dailyColorCount = Array.from(dateColorCountMap.entries())
    .map(([dateLabel, countMap]) => ({
      dateSecond: parseDateLabel(dateLabel).unix(),
      countMap,
    }))
    .sort((a, b) => a.dateSecond - b.dateSecond);
  const mergeCountMap = (
    lastMap: Map<RatingColor, number>,
    curMap: Map<RatingColor, number>
  ): Map<RatingColor, number> =>
    RatingColors.reduce((map, ratingColor) => {
      map.set(
        ratingColor,
        (lastMap.get(ratingColor) ?? 0) + (curMap.get(ratingColor) ?? 0)
      );
      return map;
    }, new Map<RatingColor, number>());

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
    [] as { dateSecond: number; countMap: Map<RatingColor, number> }[]
  );

  return (
    <>
      <Row className="my-2 border-bottom">
        <h1>Daily Effort</h1>
      </Row>
      <Row>
        <ChartTypeTabButtons
          active={dailyEffortBarChartActiveTab}
          setActive={setDailyEffortBarChartActiveTab}
        />
        <YRangeTabButtons
          active={dailyEffortYRange}
          setActive={setDailyEffortYRange}
        />
      </Row>
      {dailyEffortBarChartActiveTab === "Simple" ? (
        <DailyEffortBarChart
          dailyData={dailyCount.map(({ dateLabel, count }) => ({
            dateSecond: parseDateLabel(dateLabel).unix(),
            count,
          }))}
          yRange={dailyEffortYRange}
        />
      ) : (
        <DailyEffortStackedBarChart
          dailyColorCount={dailyColorCount}
          yRange={dailyEffortYRange}
        />
      )}

      <Row className="my-2 border-bottom">
        <h1>Climbing</h1>
      </Row>
      <Row>
        <ChartTypeTabButtons
          active={climbingLineChartActiveTab}
          setActive={setClimbingLineChartActiveTab}
        />
        {climbingLineChartActiveTab === "Colored" && (
          <FormGroup check inline>
            <Label check>
              <CustomInput
                type="switch"
                id="ReverseColorOrder"
                label="Reverse Color Order"
                checked={reverseColorOrder}
                onChange={(e): void => setReverseColorOrder(e.target.checked)}
              />
            </Label>
          </FormGroup>
        )}
      </Row>
      {climbingLineChartActiveTab === "Simple" ? (
        <ClimbingLineChart climbingData={climbing} />
      ) : (
        <ClimbingAreaChart
          colorClimbing={colorClimbing}
          reverseColorOrder={reverseColorOrder}
        />
      )}

      <Row className="my-2 border-bottom">
        <h1>Heatmap</h1>
      </Row>
      <FilteringHeatmap submissions={userSubmissions} />
    </>
  );
};
