import React from "react";
import { UncontrolledTooltip } from "reactstrap";
import { Range, Map } from "immutable";
import moment from "moment";
import { formatMomentDate, getNextSunday, getToday } from "../utils/DateUtil";
import Submission from "../interfaces/Submission";

const WEEKDAY = 7;
const WEEKS = 53;

type DateStr = string;
interface Props<State> {
  submissions: Submission[];
  reducer: (date: DateStr, subs: Submission[]) => State;
  formatDate: (sub: Submission) => DateStr;
  formatTooltip: (date: DateStr, state: State) => string;
  getColor: (date: DateStr, state: State) => string;
}

const CalendarHeatmap: React.FC<Props<any>> = <T extends {}>(
  props: Props<T>
) => {
  const today = getToday();
  const nextSunday = getNextSunday(today);

  const startDate = nextSunday.date(nextSunday.date() - WEEKS * WEEKDAY);
  const startLabel = formatMomentDate(startDate);

  const countMap = Range(0, WEEKS * WEEKDAY)
    .map((i) => moment(startDate).add(i, "day"))
    .map((date) => ({
      label: formatMomentDate(date),
      submissions: [] as Submission[],
    }))
    .concat(
      props.submissions.map((submission: Submission) => ({
        label: props.formatDate(submission),
        submissions: [submission],
      }))
    )
    .filter(({ label }) => label >= startLabel)
    .reduce(
      (map, { label, submissions }) =>
        map.set(label, map.get(label, [] as Submission[]).concat(submissions)),
      Map<string, Submission[]>()
    )
    .map((value, key) => props.reducer(key, value));
  const tableData = countMap
    .entrySeq()
    .map(([date, state]) => ({ state, date }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .toArray();

  const blockWidth = 10;
  const width = blockWidth * WEEKS;
  const height = blockWidth * WEEKDAY;
  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%" }}>
        {tableData.map(({ date, state }, i) => {
          const color = props.getColor(date, state);
          const week = Math.floor(i / WEEKDAY);
          const day = i % WEEKDAY;
          return (
            <rect
              key={date}
              id={`rect-${date}`}
              x={week * blockWidth}
              y={day * blockWidth}
              width={blockWidth}
              height={blockWidth}
              fill={color}
            />
          );
        })}
      </svg>

      {tableData.map(({ date, state }) => (
        <UncontrolledTooltip
          delay={{ show: 0, hide: 0 }}
          key={date}
          placement="right"
          target={`rect-${date}`}
        >
          {props.formatTooltip(date, state)}
        </UncontrolledTooltip>
      ))}
    </div>
  );
};

export default CalendarHeatmap;
