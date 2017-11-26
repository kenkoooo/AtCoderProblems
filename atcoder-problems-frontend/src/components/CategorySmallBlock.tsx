import * as React from "react";
import { Row, PageHeader, Table } from "react-bootstrap";
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { UrlFormatter } from "../utils/UrlFormatter";

export interface CategorySmallBlockProps {
  data: Array<[Contest, Array<Problem>]>;
}

export class CategorySmallBlock extends React.Component<
  CategorySmallBlockProps,
  {}
> {
  render() {
    return (
      <Row>
        <PageHeader>Other Contests</PageHeader>
        {this.props.data.map((d, index) => {
          let contest = d[0];
          let problems = d[1];
          return (
            <div key={index}>
              <strong>
                <a href={UrlFormatter.contestUrl(contest)}>{contest.title}</a>
              </strong>
              <Table striped bordered condensed hover>
                <tbody>
                  <tr>
                    {problems.map((problem, i) => (
                      <td key={i}>
                        <a
                          href={UrlFormatter.problemUrl(contest, problem)}
                          target="_blank"
                        >
                          {problem.title}
                        </a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </Table>
            </div>
          );
        })}
      </Row>
    );
  }
}
