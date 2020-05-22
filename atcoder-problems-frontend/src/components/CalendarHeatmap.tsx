import React from "react";
import { UncontrolledTooltip } from "reactstrap";
import { Range, Map as ImmutableMap } from "immutable";
import moment from "moment";
import { formatMomentDate, getNextSunday, getToday } from "../utils/DateUtil";

const WEEKDAY = 7;
const WEEKS = 53;

interface Props<State> {
  tableData: ImmutableMap<string, State>;
  defaultValue: State;
  formatTooltip: (date: string, state: State) => string;
  getColor: (date: string, state: State) => string;
}

function CalendarHeatmap<T>(props: Props<T>): React.ReactElement {
  const today = getToday();
  const nextSunday = getNextSunday(today);

  const startDate = nextSunday.date(nextSunday.date() - WEEKS * WEEKDAY);

  // Generate all entries by date in range, including empty entries.
  const tableData = Range(0, WEEKS * WEEKDAY)
    .map((i) => moment(startDate).add(i, "day"))
    .map((date): string => formatMomentDate(date))
    .map((date) => ({
      date,
      state: props.tableData.get(date, props.defaultValue),
    }))
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
}

export default CalendarHeatmap;
