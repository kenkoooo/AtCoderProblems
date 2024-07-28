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
import { useProblemModelMap, useUserSubmission } from "../../../api/APIClient";
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
import {
  countUniqueAcByDate,
  countTeeByDate,
  countTeeMovingAverage,
} from "../../../utils/StreakCounter";
import Submission from "../../../interfaces/Submission";
import { ProblemId } from "../../../interfaces/Status";
import { DailyEffortBarChart } from "./DailyEffortBarChart";
import { DailyEffortStackedBarChart } from "./DailyEffortStackedBarChart";
import { ClimbingLineChart } from "./ClimbingLineChart";
import { ClimbingAreaChart } from "./ClimbingAreaChart";
import { FilteringHeatmap } from "./FilteringHeatmap";
import { TeeChart } from "./TeeChart";

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

type XRanges = (number | "dataMin")[];
interface XRangeTabProps {
  active: XRanges;
  setActive: (next: XRanges) => void;
}
const XRangeTabButtons: React.FC<XRangeTabProps> = (props) => {
  const { active, setActive } = props;
  const yearToSeconds = 365 * 24 * 60 * 60;
  const nowUnixTime = new Date().getTime() / 1000;
  const RANGES: XRanges[] = [
    [nowUnixTime - 1 * yearToSeconds, nowUnixTime],
    [nowUnixTime - 2 * yearToSeconds, nowUnixTime],
    [nowUnixTime - 5 * yearToSeconds, nowUnixTime],
    [nowUnixTime - 10 * yearToSeconds, nowUnixTime],
    ["dataMin", nowUnixTime],
  ];
  const RANGENAMES = [
    "in last 1 year",
    "in last 2 years",
    "in last 5 years",
    "in last 10 years",
    "all time",
  ];
  return (
    <ButtonGroup>
      <UncontrolledDropdown>
        <DropdownToggle caret>{"X-Range"}</DropdownToggle>
        <DropdownMenu>
          {RANGES.map((range, idx) => (
            <DropdownItem
              key={range}
              onClick={(): void => setActive(range)}
              active={active === range}
            >
              {RANGENAMES[idx]}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </UncontrolledDropdown>
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

interface Props {
  userId: string;
}

export const ProgressChartBlock: React.FC<Props> = (props) => {
  const [
    dailyEffortBarChartActiveTab,
    setDailyEffortBarChartActiveTab,
  ] = useLocalStorage<ChartType>("dailyEffortBarChartActiveTab", "Simple");
  const nowUnixTime = new Date().getTime() / 1000;
  const [dailyEffortXRange, setDailyEffortXRange] = useLocalStorage<XRanges>(
    "dailyEffortXRange",
    ["dataMin", nowUnixTime]
  );
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
  const { userId } = props;
  const userSubmissions = useUserSubmission(userId) ?? [];
  const submissionsByProblem = userSubmissions.reduce((map, s) => {
    const submissions = map.get(s.problem_id) ?? [];
    submissions.push(s);
    map.set(s.problem_id, submissions);
    return map;
  }, new Map<ProblemId, Submission[]>());
  const problemModels = useProblemModelMap();
  const dailyCount = countUniqueAcByDate(userSubmissions);

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

  const dailyTeeCount = countTeeByDate(userSubmissions, problemModels);
  const teeClimbing = dailyTeeCount.reduce((list, { dateLabel, count }) => {
    const dateSecond = parseDateLabel(dateLabel).unix();
    const last = list.length === 0 ? undefined : list[list.length - 1];
    if (last) {
      list.push({ dateSecond, count: last.count + count });
    } else {
      list.push({ dateSecond, count });
    }
    return list;
  }, [] as { dateSecond: number; count: number }[]);

  const teeMovingAverage = countTeeMovingAverage(dailyTeeCount);

  const dateColorCountMap = Array.from(submissionsByProblem.values())
    .map((submissionsOfProblem) => {
      const accepted = submissionsOfProblem
        .filter((s) => isAccepted(s.result))
        .sort((a, b) => a.epoch_second - b.epoch_second);
      return accepted.length === 0 ? undefined : accepted[0];
    })
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
        const model = problemModels?.get(submission.problem_id);
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
        <XRangeTabButtons
          active={dailyEffortXRange}
          setActive={setDailyEffortXRange}
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
          xRange={dailyEffortXRange}
          yRange={dailyEffortYRange}
        />
      ) : (
        <DailyEffortStackedBarChart
          dailyColorCount={dailyColorCount}
          xRange={dailyEffortXRange}
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
        <h1>TEE Climbing</h1>
      </Row>
      <TeeChart climbingData={teeClimbing} />

      <Row className="my-2 border-bottom">
        <h1>TEE Moving Average (30 days)</h1>
      </Row>
      <TeeChart climbingData={teeMovingAverage} />

      <Row className="my-2 border-bottom">
        <h1>Heatmap</h1>
      </Row>
      <FilteringHeatmap submissions={userSubmissions} />
    </>
  );
};
