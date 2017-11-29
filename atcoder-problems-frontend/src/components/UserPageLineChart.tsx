import * as React from "react";
import * as c3 from "c3";
import { Col, Row } from "react-bootstrap";
import { Submission } from "../model/Submission";
import { TimeFormatter } from "../utils/TimeFormatter";

export interface UserPageLineChartProps {
  acceptedSubmissions: Array<Submission>;
}

export class UserPageLineChart extends React.Component<
  UserPageLineChartProps,
  {}
> {
  render() {
    let name = "user_page_line_chart";

    let problemSet = new Set<string>();
    let ticks: Array<any> = ["x"];
    let data: Array<any> = ["Accepted"];
    this.props.acceptedSubmissions
      .sort((a, b) => a.epoch_second - b.epoch_second)
      .forEach(s => {
        if (!problemSet.has(s.problem_id)) {
          problemSet.add(s.problem_id);
          ticks.push(TimeFormatter.getDateString(s.epoch_second * 1000));
          data.push(data.length + 1);
        }
      });

    c3.generate({
      bindto: `#${name}`,
      data: {
        x: "x",
        columns: [ticks, data]
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            count: 10,
            format: "%Y-%m-%d"
          }
        }
      }
    });

    return <Row className="placeholders" id={name} />;
  }
}
