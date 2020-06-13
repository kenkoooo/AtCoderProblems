import React from "react";
import { UncontrolledTooltip } from "reactstrap";
import { parseDateLabel } from "../utils/DateUtil";

const COLOR_GREY = "#ebedf0";
const DAY_NAMES_SHORT = ["Mon", "Wed", "Fri"];

interface Props {
  tableData: { date: string; value?: number }[];
  formatTooltip: (date: string, value: number) => string;
  getColor: (date: string, value: number) => string;
  columns: number;
  rows: number;
}

export function CalendarHeatmap(props: Props): React.ReactElement {
  const { tableData } = props;

  const blockWidth = 10;
  const xOffset = blockWidth * 1.6;
  const yOffset = blockWidth;
  const width = xOffset + blockWidth * props.columns + blockWidth * 0.5;
  const height = yOffset + blockWidth * props.rows;
  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%" }}>
        {DAY_NAMES_SHORT.map((day_name, i) => (
          <text
            key={day_name}
            x={0}
            y={yOffset * 0.7 + (2 * i + 2) * blockWidth}
            fill="gray"
            fontSize={7}
          >
            {day_name}
          </text>
        ))}
        {tableData.map(({ date }, i) => {
          const week = Math.floor(i / props.rows);
          const day = i % props.rows;
          const d = parseDateLabel(date);
          if (day === 0 && d.date() <= 7) {
            return (
              <text
                key={`text-${date}`}
                x={xOffset + week * blockWidth}
                y={yOffset * 0.7}
                fill="gray"
                fontSize={7}
              >
                {d.format("MMM")}
              </text>
            );
          }
          return null;
        })}
        {tableData.map(({ date, value }, i) => {
          if (parseDateLabel(date).isAfter()) return null;
          const color =
            value === undefined ? COLOR_GREY : props.getColor(date, value);
          const week = Math.floor(i / props.rows);
          const day = i % props.rows;
          return (
            <rect
              key={date}
              id={`rect-${date}`}
              x={xOffset + week * blockWidth}
              y={yOffset + day * blockWidth}
              width={blockWidth * 0.95}
              height={blockWidth * 0.95}
              fill={color}
            />
          );
        })}
      </svg>

      {tableData.map(
        ({ date, value }) =>
          value !== undefined && (
            <UncontrolledTooltip
              delay={{ show: 0, hide: 0 }}
              key={date}
              placement="right"
              target={`rect-${date}`}
            >
              {props.formatTooltip(date, value)}
            </UncontrolledTooltip>
          )
      )}
    </div>
  );
}
