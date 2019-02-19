import * as React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { TimeFormatter } from "../utils/TimeFormatter";
import {
  OverlayTrigger,
  Tooltip,
  Row,
  ButtonToolbar,
  ToggleButtonGroup,
  ToggleButton
} from "react-bootstrap";
import { Submission } from "../model/Submission";
import { F_OK } from "constants";

enum SubmissionFilter {
  All = "all",
  UniqueAccepted = "unique",
  AllAccepted = "accepted"
}

interface UserPageHeatMapState {
  filter: SubmissionFilter;
}

export interface UserPageHeatMapProps {
  submissions: Array<Submission>;
}

export class UserPageHeatMap extends React.Component<
  UserPageHeatMapProps,
  UserPageHeatMapState
  > {
  constructor(prop: UserPageHeatMapProps) {
    super(prop);
    this.state = { filter: SubmissionFilter.All };
  }
  render() {
    let dateMap = new Map<string, number>();
    let uniqueProblemSet = new Set<string>();

    this.props.submissions
      .sort((a, b) => a.epoch_second - b.epoch_second)
      .filter(s => {
        switch (this.state.filter) {
          case SubmissionFilter.All:
            return true;
          case SubmissionFilter.AllAccepted:
            return s.result === "AC";
          case SubmissionFilter.UniqueAccepted:
            if (s.result !== "AC") {
              return false;
            }
            let unique = !uniqueProblemSet.has(s.problem_id);
            uniqueProblemSet.add(s.problem_id);
            return unique;
        }
      })
      .map(s => TimeFormatter.getDateString(s.epoch_second * 1000))
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

    let endDate = TimeFormatter.getDateString(Date.now());
    let startDate = TimeFormatter.getDateString(
      Date.now() - 364 * 24 * 3600 * 1000
    );

    let kind =
      this.state.filter == SubmissionFilter.All
        ? "submissions"
        : this.state.filter == SubmissionFilter.UniqueAccepted
          ? "new AC"
          : "AC";

    return (
      <Row>
        <ButtonToolbar>
          <ToggleButtonGroup
            type="radio"
            name="trying"
            defaultValue={SubmissionFilter.All}
            onChange={(x: any) => this.setState({ filter: x })}
          >
            <ToggleButton value={SubmissionFilter.All}>
              All Submissions
            </ToggleButton>
            <ToggleButton value={SubmissionFilter.AllAccepted}>
              All AC
            </ToggleButton>
            <ToggleButton value={SubmissionFilter.UniqueAccepted}>
              Unique AC
            </ToggleButton>
          </ToggleButtonGroup>
        </ButtonToolbar>
        <CalendarHeatmap
          gutterSize={1}
          showOutOfRangeDays={true}
          endDate={new Date(endDate)}
          startDate={new Date(startDate)}
          values={values}
          classForValue={value => {
            if (!value) {
              return "color-empty";
            }
            return `color-github-${Math.min(value.count, 4)}`;
          }}
          transformDayElement={(
            rect,
            value: { date: string; count: number }
          ) => {
            if (value) {
              return (
                <OverlayTrigger
                  overlay={
                    <Tooltip>
                      <strong>{`${value.count} ${kind}`}</strong>
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
      </Row>
    );
  }
}
