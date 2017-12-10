import * as React from "react";
import { Submission } from "../model/Submission";
import { MergedProblem } from "../model/MergedProblem";
import { Table, Row, PageHeader } from "react-bootstrap";
import { PointDistribution } from "../utils/PointDistribution";

export interface RatedPointCountTableProps {
  submissions: Array<Submission>;
  problems: Array<MergedProblem>;
  userId: string;
  rivals: Array<string>;
}

export class RatedPointCountTable extends React.Component<
  RatedPointCountTableProps,
  {}
> {
  render() {
    let points = Array.from(
      new Set(this.props.problems.filter(p => p.point).map(p => p.point))
    ).sort((a, b) => a - b);

    let users = [this.props.userId];
    this.props.rivals.forEach(r => users.push(r));
    let map: Map<string, Map<number, number>> = new Map(
      users.map(user => {
        let count = PointDistribution.countAcceptedByPoint(
          this.props.submissions,
          this.props.problems,
          user
        );
        let t: [string, Map<number, number>] = [user, count];
        return t;
      })
    );

    return (
      <Row>
        <PageHeader />
        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th>User</th>
              {points.map(p => <th>{p}</th>)}
              <th>Sum</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              let sum = 0;
              map.get(user).forEach((count, point) => {
                sum += count * point;
              });

              return (
                <tr>
                  <td>{user}</td>
                  {points.map(point => {
                    let count = map.get(user).get(point);
                    if (!count) {
                      count = 0;
                    }
                    return <td>{count}</td>;
                  })}
                  <td>{sum}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Row>
    );
  }
}
