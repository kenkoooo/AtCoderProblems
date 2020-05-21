import React, { useState } from "react";
import { ButtonGroup, Button, Row } from "reactstrap";

import { Map as ImmutableMap } from "immutable";
import { connect, PromiseState } from "react-refetch";
import { ProblemId } from "../../../interfaces/Status";
import Submission from "../../../interfaces/Submission";
import { isAccepted, getRatingColorCode, getRatingColor } from "../../../utils";
import CalendarHeatmap from "../../../components/CalendarHeatmap";
import { formatMomentDate, parseSecond } from "../../../utils/DateUtil";
import ProblemModel from "../../../interfaces/ProblemModel";
import { cachedProblemModels } from "../../../utils/CachedApiClient";

type FilterStatus = "AC" | "Submissions" | "Unique AC";
type ColorMode = "Count" | "Difficulty";

const COLOR_GREY = "#ebedf0";

interface OuterProps {
  submissions: Submission[];
}

interface InnerProps extends OuterProps {
  problemModels: PromiseState<ImmutableMap<ProblemId, ProblemModel>>;
}

export const filterSubmissions = (
  submissions: Submission[],
  filterStatus: FilterStatus
): Submission[] => {
  switch (filterStatus) {
    case "Submissions":
      return submissions;
    case "AC":
      return submissions.filter((s) => isAccepted(s.result));
    case "Unique AC":
      return submissions
        .filter((s) => isAccepted(s.result))
        .sort((a, b) => a.epoch_second - b.epoch_second)
        .reduce(
          (map, s) => map.set(s.problem_id, map.get(s.problem_id, s)),
          ImmutableMap<ProblemId, Submission>()
        )
        .valueSeq()
        .toArray();
  }
};

const formatDate = (s: Submission): string =>
  formatMomentDate(parseSecond(s.epoch_second));

const formatCountTooltip = (
  date: string,
  count: number,
  filter: FilterStatus
): string => {
  if (filter === "Submissions") {
    if (count === 1) {
      return `${date} ${count} submission`;
    } else {
      return `${date} ${count} submissions`;
    }
  } else {
    return `${date} ${count} ${filter}`;
  }
};

export const InnerFilteringHeatmap: React.FC<InnerProps> = (props) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Submissions");
  const [colorMode, setColorMode] = useState<ColorMode>("Count");
  const { submissions } = props;
  const filteredSubmissions = filterSubmissions(submissions, filterStatus);

  return (
    <div>
      <Row className="my-3">
        <ButtonGroup className="mr-3">
          <Button
            onClick={(): void => {
              setFilterStatus("Submissions");
              setColorMode("Count");
            }}
            active={filterStatus === "Submissions" && colorMode === "Count"}
          >
            All Submissions
          </Button>
          <Button
            onClick={(): void => {
              setFilterStatus("AC");
              setColorMode("Count");
            }}
            active={filterStatus === "AC" && colorMode === "Count"}
          >
            All AC
          </Button>
          <Button
            onClick={(): void => {
              setFilterStatus("Unique AC");
              setColorMode("Count");
            }}
            active={filterStatus === "Unique AC" && colorMode === "Count"}
          >
            Unique AC
          </Button>
          <Button
            onClick={(): void => {
              setFilterStatus("AC");
              setColorMode("Difficulty");
            }}
            active={filterStatus === "AC" && colorMode === "Difficulty"}
          >
            Max. Difficulty
          </Button>
        </ButtonGroup>
      </Row>
      <Row className="my-5">
        {colorMode === "Count" && (
          <CalendarHeatmap
            submissions={filteredSubmissions}
            formatDate={formatDate}
            reducer={(date: string, subs: Submission[]): number => subs.length}
            formatTooltip={(date: string, count: number): string =>
              formatCountTooltip(date, count, filterStatus)
            }
            getColor={(date: string, count: number): string => {
              const COLORS = [
                "#ebedf0",
                "#c6e48b",
                "#7bc96f",
                "#239a3b",
                "#196127",
              ];
              return COLORS[Math.min(count, COLORS.length - 1)];
            }}
          />
        )}

        {colorMode === "Difficulty" && (
          <CalendarHeatmap
            submissions={filteredSubmissions}
            formatDate={formatDate}
            reducer={(date: string, subs: Submission[]): number | undefined => {
              if (subs.length === 0) {
                return;
              }

              const problemModels = props.problemModels.fulfilled
                ? props.problemModels.value
                : ImmutableMap<string, ProblemModel>();
              const difficulties = subs.map(
                (sub) => problemModels.get(sub.problem_id)?.difficulty ?? 0
              );
              const maxDifficulty = Math.max(...difficulties);

              return maxDifficulty;
            }}
            formatTooltip={(
              date: string,
              maxDifficulty: number | undefined
            ): string => {
              if (typeof maxDifficulty === "number") {
                return `${date}: Difficulty ${maxDifficulty}`;
              } else {
                return `${date}: No ACs`;
              }
            }}
            getColor={(
              date: string,
              maxDifficulty: number | undefined
            ): string => {
              if (typeof maxDifficulty === "number") {
                return getRatingColorCode(getRatingColor(maxDifficulty));
              } else {
                return COLOR_GREY;
              }
            }}
          />
        )}
      </Row>
    </div>
  );
};

export const FilteringHeatmap = connect<OuterProps, InnerProps>((props) => ({
  problemModels: {
    comparison: null,
    value: (): any => cachedProblemModels(),
  },
}))(InnerFilteringHeatmap);
