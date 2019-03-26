import React from 'react';
import { UncontrolledTooltip } from 'reactstrap';

const WEEKDAY = 7;
const WEEKS = 53;
const COLORS = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const month_str = month < 10 ? '0' + month : month;
  const day_str = day < 10 ? '0' + day : day;
  return year + '-' + month_str + '-' + day_str;
};

const CalendarHeatmap = (props: { data: Date[]; formatTooltip?: (date: string, count: number) => string }) => {
  const next_sunday = new Date();
  while (next_sunday.getDay() != 0) {
    next_sunday.setDate(next_sunday.getDate() + 1);
  }

  const current_date = new Date(next_sunday);
  current_date.setDate(current_date.getDate() - WEEKS * WEEKDAY);

  const count_map = new Map<string, number>();
  while (formatDate(current_date) !== formatDate(next_sunday)) {
    count_map.set(formatDate(current_date), 0);
    current_date.setDate(current_date.getDate() + 1);
  }

  props.data.forEach((date) => {
    const count = count_map.get(formatDate(date));
    if (count !== undefined) {
      count_map.set(formatDate(date), count + 1);
    }
  });

  const table_data = Array.from(count_map)
    .map(([date, count]) => ({ count, date }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const block_width = 10;
  const width = block_width * WEEKS;
  const height = block_width * WEEKDAY;
  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%" }}>
        {table_data.map(({ date, count }, i) => {
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

      {table_data.map(({ date, count }) => (
        <UncontrolledTooltip delay={{ show: 0, hide: 0 }} key={date} placement="right" target={`rect-${date}`}>
          {props.formatTooltip ? props.formatTooltip(date, count) : `${date}: ${count}`}
        </UncontrolledTooltip>
      ))}
    </div>
  );
};

export default CalendarHeatmap;
