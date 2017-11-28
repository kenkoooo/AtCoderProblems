import * as React from "react";
import * as c3 from "c3";
import { Col } from "react-bootstrap";

export interface UserPagePieChartProps {
  title: string;
  name: string;
  totalCount: number;
  acceptedCount: number;
  columnGrids?: number;
  height?: number;
  width?: number;
}

export class UserPagePieChart extends React.Component<
  UserPagePieChartProps,
  {}
> {
  render() {
    let width = this.props.width ? this.props.width : 200;
    let height = this.props.height ? this.props.height : 200;
    c3.generate({
      bindto: `#${this.props.name}`,
      size: {
        height: height,
        width: width
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

    // how many columns one pie chart use from 12 columns
    let columnGrids = this.props.columnGrids ? this.props.columnGrids : 3;

    return (
      <Col xs={columnGrids * 2} sm={columnGrids} className="placeholders">
        <div id={this.props.name}>hi</div>
        <h4>{this.props.title}</h4>
        <span className="text-muted">
          {this.props.acceptedCount} / {this.props.totalCount}
        </span>
      </Col>
    );
  }
}
