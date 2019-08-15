import React from "react";
import { UncontrolledTooltip } from "reactstrap";
import { formatMoment, getThisSunday, getToday } from "../utils/DateUtil";
import { Range, Map } from "immutable";
import moment from "moment";

const WEEKDAY = 7;
const WEEKS = 53;
const COLORS = ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"];

interface Props {
  dateLabels: string[];
  formatTooltip?: (date: string, count: number) => string;
}

const CalendarHeatmap = (props: Props) => {
  const { dateLabels } = props;

  const today = getToday();
  const nextSunday = getThisSunday(today);

  const startDate = nextSunday.date(nextSunday.date() - WEEKS * WEEKDAY);
  const startLabel = formatMoment(startDate);

  const countMap = Range(0, WEEKS * WEEKDAY)
    .map(i => moment(startDate).add(i, "day"))
    .map(date => ({ label: formatMoment(date), count: 0 }))

    .concat(dateLabels.map(label => ({ label, count: 1 })))
    .filter(({ label }) => label >= startLabel)
    .reduce(
      (map, { label, count }) => map.set(label, map.get(label, 0) + count),
      Map<string, number>()
    );
  const tableData = countMap
    .entrySeq()
    .map(([date, count]) => ({ count, date }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .toArray();

  const block_width = 10;
  const width = block_width * WEEKS;
  const height = block_width * WEEKDAY;
  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%" }}>
        {tableData.map(({ date, count }, i) => {
          const color = COLORS[Math.min(count, COLORS.length - 1)];
          const week = Math.floor(i / WEEKDAY);
          const day = i % WEEKDAY;
          return (
            <rect
              key={date}
              id={`rect-${date}`}
              x={week * block_width}
              y={day * block_width}
              width={block_width}
              height={block_width}
              fill={color}
            />
          );
        })}
      </svg>

      {tableData.map(({ date, count }) => (
        <UncontrolledTooltip
          delay={{ show: 0, hide: 0 }}
          key={date}
          placement="right"
          target={`rect-${date}`}
        >
          {props.formatTooltip
            ? props.formatTooltip(date, count)
            : `${date}: ${count}`}
        </UncontrolledTooltip>
      ))}
    </div>
  );
};

export default CalendarHeatmap;
