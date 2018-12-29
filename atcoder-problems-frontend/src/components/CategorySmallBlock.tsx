import * as React from "react";
import { Row, PageHeader, Table } from "react-bootstrap";
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { UrlFormatter } from "../utils/UrlFormatter";
import { Option, some } from "ts-option";
import { HtmlFormatter } from "../utils/HtmlFormatter";

export interface CategorySmallBlockProps {
  data: Array<[Contest, Array<Problem>]>;
  acceptedProblems: Set<string>;
  wrongMap: Map<string, string>;
  rivalProblems: Set<string>;
}

export class CategorySmallBlock extends React.Component<
  CategorySmallBlockProps,
  {}
  > {
  render() {
    let columnColorFormatter = (p: Option<Problem>) =>
      HtmlFormatter.getCellColor(
        p,
        this.props.acceptedProblems,
        this.props.rivalProblems,
        this.props.wrongMap
      );
    return (
      <Row>
        <PageHeader>Other Contests</PageHeader>
        {this.props.data.map((d, index) => {
          let contest = d[0];
          let problems = d[1];
          return (
            <div key={index}>
              <strong>
                <a href={UrlFormatter.contestUrl(contest.id)}>
                  {contest.title}
                </a>
              </strong>
              <Table striped bordered condensed hover responsive>
                <tbody>
                  <tr>
                    {problems.sort((a, b) => a.title > b.title ? 1 : -1).map((problem, i) => (
                      <td
                        key={i}
                        className={columnColorFormatter(some(problem))}
                      >
                        <a
                          href={UrlFormatter.problemUrl(contest.id, problem.id)}
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
