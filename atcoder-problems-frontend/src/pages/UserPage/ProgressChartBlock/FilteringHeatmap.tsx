import React, { useState } from "react";
import { Button, ButtonGroup, Row } from "reactstrap";
import moment from "moment";
import { useProblemModelMap } from "../../../api/APIClient";
import { ProblemId } from "../../../interfaces/Status";
import Submission from "../../../interfaces/Submission";
import { calculateTopPlayerEquivalentEffort } from "../../../utils/ProblemModelUtil";
import { getRatingColor, getRatingColorCode, isAccepted } from "../../../utils";
import { CalendarHeatmap } from "../../../components/CalendarHeatmap";
import {
  formatMomentDate,
  getNextSunday,
  getToday,
  parseSecond,
} from "../../../utils/DateUtil";
import {
  default as ProblemModel,
  isProblemModelWithTimeModel,
} from "../../../interfaces/ProblemModel";

type ShowMode = "AC" | "Submissions" | "Unique AC" | "Max Difficulty" | "TEE";

const COLORS_COUNT = ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"];
const COLORS_TEE = [
  "#ebedf0",
  "#c6e48b",
  "#7bc96f",
  "#239a3b",
  "#196127",
  "#0f3a17",
];
const WEEKDAY = 7;
const WEEKS = 53;
const TEE_DIGIT = 2;
const TEE_COLOR_RATIO = 180;

const createTableData = (
  filteredSubmissions: Submission[],
  showMode: ShowMode,
  problemModels: Map<ProblemId, ProblemModel> | undefined
): { date: string; value?: number }[] => {
  const submissionsByDate = new Map<string, Submission[]>();
  filteredSubmissions.forEach((s) => {
    const date = formatMomentDate(parseSecond(s.epoch_second));
    const dateSubmissions = submissionsByDate.get(date) ?? [];
    dateSubmissions.push(s);
    submissionsByDate.set(date, dateSubmissions);
  });

  const today = getToday();
  const nextSunday = getNextSunday(today);
  const startDate = nextSunday.date(nextSunday.date() - WEEKS * WEEKDAY);
  const tableData: { date: string; value?: number }[] = [];
  for (let i = 0; i < WEEKS * WEEKDAY; i++) {
    const date = formatMomentDate(moment(startDate).add(i, "day"));
    if (showMode === "Max Difficulty") {
      const submissions = submissionsByDate.get(date) ?? [];
      const difficulties = submissions.map(
        (s) => problemModels?.get(s.problem_id)?.difficulty ?? -1
      );
      if (difficulties.length > 0) {
        const value = difficulties.reduce(
          (max, difficulty) => Math.max(max, difficulty),
          -1
        );
        tableData.push({ date, value });
      } else {
        tableData.push({ date });
      }
    } else if (showMode === "TEE") {
      const submissions = submissionsByDate.get(date) ?? [];
      const tees = submissions.map((s) => {
        const detail = problemModels?.get(s.problem_id);
        if (isProblemModelWithTimeModel(detail)) {
          return calculateTopPlayerEquivalentEffort(detail);
        } else {
          return 0;
        }
      });
      if (tees.length > 0) {
        const value = tees.reduce((teesum, tee) => teesum + tee, 0);
        if (value > 0) {
          tableData.push({ date, value });
        } else {
          tableData.push({ date });
        }
      } else {
        tableData.push({ date });
      }
    } else {
      const value = submissionsByDate.get(date)?.length;
      tableData.push({ date, value });
    }
  }
  return tableData;
};

interface Props {
  submissions: Submission[];
}

export const filterSubmissions = (
  submissions: Submission[],
  showMode: ShowMode
): Submission[] => {
  switch (showMode) {
    case "Submissions":
      return submissions;
    case "AC":
    case "Max Difficulty":
      return submissions.filter((s) => isAccepted(s.result));
    case "Unique AC":
    case "TEE": {
      const submissionByDate = submissions
        .filter((s) => isAccepted(s.result))
        .sort((a, b) => b.id - a.id)
        .reduce((map, s) => {
          map.set(s.problem_id, s);
          return map;
        }, new Map<ProblemId, Submission>());
      return Array.from(submissionByDate.values());
    }
  }
};

const formatCountTooltip = (
  date: string,
  count: number,
  filter: ShowMode
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

export const FilteringHeatmap: React.FC<Props> = (props) => {
  const [showMode, setShowMode] = useState<ShowMode>("Submissions");
  const { submissions } = props;
  const problemModels = useProblemModelMap();
  const filteredSubmissions = filterSubmissions(submissions, showMode);
  const tableData = createTableData(
    filteredSubmissions,
    showMode,
    problemModels
  );

  const formatTooltip = (() => {
    if (showMode === "Max Difficulty") {
      return (date: string, difficulty: number): string =>
        `${date} Max Difficulty: ${difficulty >= 0 ? difficulty : "-"}`;
    } else if (showMode === "TEE") {
      return (date: string, tee: number): string =>
        `${date} TEE: ${tee.toFixed(TEE_DIGIT)}`;
    } else {
      return (date: string, count: number): string =>
        formatCountTooltip(date, count, showMode);
    }
  })();
  const getColor = (() => {
    if (showMode === "Max Difficulty") {
      return (date: string, difficulty: number): string =>
        getRatingColorCode(getRatingColor(difficulty));
    } else if (showMode === "TEE") {
      return (date: string, tee: number): string =>
        COLORS_TEE[
          Math.min(Math.floor(tee / TEE_COLOR_RATIO) + 1, COLORS_TEE.length - 1)
        ];
    } else {
      return (date: string, count: number): string =>
        COLORS_COUNT[Math.min(count, COLORS_COUNT.length - 1)];
    }
  })();

  return (
    <div>
      <Row className="my-3">
        <ButtonGroup className="mr-3">
          <Button
            onClick={(): void => setShowMode("Submissions")}
            active={showMode === "Submissions"}
          >
            All Submissions
          </Button>
          <Button
            onClick={(): void => setShowMode("AC")}
            active={showMode === "AC"}
          >
            All AC
          </Button>
          <Button
            onClick={(): void => setShowMode("Unique AC")}
            active={showMode === "Unique AC"}
          >
            Unique AC
          </Button>
          <Button
            onClick={(): void => setShowMode("Max Difficulty")}
            active={showMode === "Max Difficulty"}
          >
            Max Difficulty
          </Button>
          <Button
            onClick={(): void => setShowMode("TEE")}
            active={showMode === "TEE"}
          >
            TEE
          </Button>
        </ButtonGroup>
      </Row>
      <Row className="my-5">
        <CalendarHeatmap
          tableData={tableData}
          formatTooltip={formatTooltip}
          getColor={getColor}
          columns={WEEKS}
          rows={WEEKDAY}
        />
      </Row>
    </div>
  );
};
