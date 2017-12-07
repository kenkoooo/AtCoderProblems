import * as React from "react";
import * as c3 from "c3";
import { Col, Row } from "react-bootstrap";
import { Submission } from "../model/Submission";
import { TimeFormatter } from "../utils/TimeFormatter";

export interface UserPageBarChartProps {
  acceptNewProblemDates: Array<string>;
}

export class UserPageBarChart extends React.Component<
  UserPageBarChartProps,
  {}
> {
  render() {
    let name = "user_page_bar_chart";

    let ticks: Array<any> = ["x"];
    let data: Array<any> = ["Accepted"];

    // create ticks and data
    this.props.acceptNewProblemDates.forEach(date => {
      if (ticks[ticks.length - 1] === date) {
        data[data.length - 1] += 1;
      } else {
        ticks.push(date);
        data.push(1);
      }
    });

    c3.generate({
      bindto: `#${name}`,
      data: {
        x: "x",
        columns: [ticks, data],
        type: "bar",
        colors: {
          Accepted: "#32CD32"
        }
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            count: 10,
            format: "%Y-%m-%d"
          }
        }
      },
      bar: {
        width: {
          ratio: 0.02 // this makes bar width 50% of length between ticks
        }
      }
    });

    return <Row className="placeholders" id={name} />;
  }
}
