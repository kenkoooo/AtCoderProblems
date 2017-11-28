import * as React from "react";
import * as c3 from "c3";
import { Col } from "react-bootstrap";

export interface UserPagePieChartProps {
  title: string;
  name: string;
  totalCount: number;
  acceptedCount: number;
}

export class UserPagePieChart extends React.Component<
  UserPagePieChartProps,
  {}
> {
  render() {
    c3.generate({
      bindto: `#${this.props.name}`,
      size: {
        height: 200,
        width: 200
      },
      data: {
        columns: [
          ["Accepted", this.props.acceptedCount],
          ["Trying", this.props.totalCount - this.props.acceptedCount]
        ],
        type: "pie",
        colors: {
          Accepted: "#32CD32",
          Trying: "#58616A"
        },
        order: null
      }
    });
    return (
      <Col xs={6} sm={3} className="placeholders">
        <div id={this.props.name}>hi</div>
        <h4>{this.props.title}</h4>
        <span className="text-muted">
          {this.props.acceptedCount}問 / {this.props.totalCount}問
        </span>
      </Col>
    );
  }
}
