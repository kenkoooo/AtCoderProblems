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
    let counts = new Map<number, number>();
    this.props.problems.filter(p => p.point).forEach(p => {
      if (counts.has(p.point)) {
        counts.set(p.point, counts.get(p.point) + 1);
      } else {
        counts.set(p.point, 1);
      }
    });
    let points = Array.from(counts.keys()).sort((a, b) => a - b);
    let pointsSum =
      points.length == 0
        ? 0
        : points.map(p => counts.get(p) * p).reduce((a, b) => a + b);
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
            <tr>
              <th>Sum</th>
              {points.map(p => <th>{counts.get(p)}</th>)}
              <th>{pointsSum}</th>
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
