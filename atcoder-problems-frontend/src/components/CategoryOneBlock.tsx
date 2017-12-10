import * as React from "react";
import { Row, PageHeader } from "react-bootstrap";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { some, none, Option } from "ts-option";
import { UrlFormatter } from "../utils/UrlFormatter";
import { HtmlFormatter } from "../utils/HtmlFormatter";

export interface CategoryOneBlockProps {
  categoryTitle: string;
  data: Array<[Contest, Array<Problem>]>;
  header: Array<string>;
  acceptedProblems: Set<string>;
  wrongMap: Map<string, string>;
  rivalProblems: Set<string>;
  rightJustified?: boolean;
}

export class CategoryOneBlock extends React.Component<
  CategoryOneBlockProps,
  {}
> {
  private contestLinkFormatter(contest: Contest) {
    return HtmlFormatter.createLink(
      UrlFormatter.contestUrl(contest.id),
      contest.id.toUpperCase()
    );
  }

  private problemLinkFormatter(
    problem: Option<Problem>,
    row: { [key: string]: any }
  ) {
    let contest = row["contest"];

    return problem.match({
      some: p =>
        HtmlFormatter.createLink(
          UrlFormatter.problemUrl(contest.id, p.id),
          p.title
        ),
      none: () => <span>-</span>
    });
  }

  render() {
    let data = this.props.data.map(d => {
      let contest = d[0];
      let problems = d[1];
      let o: { [key: string]: any } = { contest: d[0] };

      if (this.props.rightJustified) {
        problems.reverse();
        this.props.header.reverse();
      }

      this.props.header.forEach((head, i) => {
        if (problems.length > i) {
          o[head] = some(problems[i]);
        } else {
          o[head] = none;
        }
      });

      if (this.props.rightJustified) {
        problems.reverse();
        this.props.header.reverse();
      }

      return o;
    });

    let columnColorFormatter = (p: Option<Problem>) =>
      HtmlFormatter.getCellColor(
        p,
        this.props.acceptedProblems,
        this.props.rivalProblems,
        this.props.wrongMap
      );

    return (
      <Row>
        <PageHeader>{this.props.categoryTitle}</PageHeader>
        <BootstrapTable data={data}>
          <TableHeaderColumn
            dataField="contest"
            isKey
            dataFormat={this.contestLinkFormatter}
          >
            Contest
          </TableHeaderColumn>
          {this.props.header.map((head, i) => (
            <TableHeaderColumn
              key={i}
              dataField={head}
              dataFormat={this.problemLinkFormatter}
              columnClassName={columnColorFormatter}
            >
              {head}
            </TableHeaderColumn>
          ))}
        </BootstrapTable>
      </Row>
    );
  }
}
