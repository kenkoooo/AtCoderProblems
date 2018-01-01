import * as React from "react";
import { Submission } from "../model/Submission";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { TimeFormatter } from "../utils/TimeFormatter";
import { HtmlFormatter } from "../utils/HtmlFormatter";
import { UrlFormatter } from "../utils/UrlFormatter";
import { Problem } from "../model/Problem";
import { Label } from "react-bootstrap";

export interface UserPageTableProps {
  submissions: Array<Submission>;
  problems: Array<Problem>;
}

export class UserPageTable extends React.Component<UserPageTableProps, {}> {
  render() {
    let problemMap = new Map(
      this.props.problems.map(p => {
        let tuple: [string, Problem] = [p.id, p];
        return tuple;
      })
    );
    this.props.submissions.sort((a, b) => b.epoch_second - a.epoch_second);
    return (
      <BootstrapTable
        data={this.props.submissions}
        striped
        search
        pagination
        options={{
          paginationPosition: "top",
          sizePerPage: 20,
          sizePerPageList: [
            {
              text: "20",
              value: 20
            },
            {
              text: "50",
              value: 50
            },
            {
              text: "100",
              value: 100
            },
            {
              text: "200",
              value: 200
            },
            {
              text: "All",
              value: this.props.submissions.length
            }
          ]
        }}
      >
        <TableHeaderColumn
          dataField="epoch_second"
          dataFormat={(s: number) => TimeFormatter.getDateString(s * 1000)}
          isKey
          dataSort
        >
          Date
        </TableHeaderColumn>
        <TableHeaderColumn
          dataField="problem_id"
          dataFormat={(problemId: string, submission: Submission) => {
            let url = UrlFormatter.problemUrl(
              submission.contest_id,
              submission.problem_id
            );
            let problem = problemMap.get(problemId);
            if (problem) {
              return HtmlFormatter.createLink(url, problem.title);
            } else {
              return HtmlFormatter.createLink(url, problemId);
            }
          }}
        >
          Problem
        </TableHeaderColumn>
        <TableHeaderColumn
          headerAlign="left"
          dataAlign="center"
          dataField="result"
          dataFormat={(result: string, submission: Submission) => {
            if (result === "AC") {
              return (
                <h5>
                  <Label bsStyle="success">{result}</Label>
                </h5>
              );
            } else {
              return (
                <h5>
                  <Label bsStyle="warning">{result}</Label>
                </h5>
              );
            }
          }}
        >
          Result
        </TableHeaderColumn>
        <TableHeaderColumn
          dataField="id"
          dataFormat={(id: number, submission: Submission) => {
            let url = UrlFormatter.submissionUrl(
              submission.contest_id,
              submission.id
            );
            return HtmlFormatter.createLink(url, "details");
          }}
        >
          Submission
        </TableHeaderColumn>
      </BootstrapTable>
    );
  }
}
