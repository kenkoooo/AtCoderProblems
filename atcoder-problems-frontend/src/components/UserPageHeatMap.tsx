import * as React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { TimeFormatter } from "../utils/TimeFormatter";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

export interface UserPageLineHeatMapProps {
  acceptNewProblemSeconds: Array<number>;
}

export class UserPageHeatMap extends React.Component<
  UserPageLineHeatMapProps,
  {}
> {
  render() {
    let dateMap = new Map<string, number>();
    this.props.acceptNewProblemSeconds
      .map(sec => TimeFormatter.getDateString(sec * 1000))
      .forEach(date => {
        if (!dateMap.has(date)) {
          dateMap.set(date, 0);
        }
        dateMap.set(date, dateMap.get(date) + 1);
      });
    let values = Array.from(dateMap.entries()).map(entry => {
      let date = entry[0];
      let count = entry[1];
      return { date: date, count: count };
    });
    return (
      <CalendarHeatmap
        showOutOfRangeDays={true}
        startDate={new Date().getTime() - 365 * 24 * 3600 * 1000}
        values={values}
        classForValue={value => {
          if (!value) {
            return "color-empty";
          }
          return `color-github-${Math.min(value.count, 4)}`;
        }}
        transformDayElement={(
          rect,
          value: { date: string; count: number },
          index
        ) => {
          if (value) {
            return (
              <OverlayTrigger
                overlay={
                  <Tooltip>
                    <strong>{`${value.count} new AC`}</strong>
                    {` on ${value.date}`}
                  </Tooltip>
                }
              >
                {rect}
              </OverlayTrigger>
            );
          } else {
            return rect;
          }
        }}
      />
    );
  }
}
