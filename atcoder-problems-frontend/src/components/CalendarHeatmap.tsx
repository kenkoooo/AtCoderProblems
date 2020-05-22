import React from "react";
import { UncontrolledTooltip } from "reactstrap";

const COLOR_GREY = "#ebedf0";

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
  const width = blockWidth * props.columns;
  const height = blockWidth * props.rows;
  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%" }}>
        {tableData.map(({ date, value }, i) => {
          const color =
            value === undefined ? COLOR_GREY : props.getColor(date, value);
          const week = Math.floor(i / props.rows);
          const day = i % props.rows;
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
