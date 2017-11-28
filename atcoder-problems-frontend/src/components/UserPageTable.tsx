import * as React from "react";
import { Submission } from "../model/Submission";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { TimeFormatter } from "../utils/TimeFormatter";
import { HtmlFormatter } from "../utils/HtmlFormatter";
import { UrlFormatter } from "../utils/UrlFormatter";

export interface UserPageTableProps {
  submissions: Array<Submission>;
}

export class UserPageTable extends React.Component<UserPageTableProps, {}> {
  render() {
    let submissionFormatter = this.props.submissions.sort(
      (a, b) => b.epoch_second - a.epoch_second
    );
    return (
      <BootstrapTable data={this.props.submissions} striped search>
        <TableHeaderColumn
          dataField="epoch_second"
          dataFormat={(s: number) => TimeFormatter.getDateString(s * 1000)}
          isKey
        >
          Date
        </TableHeaderColumn>
        <TableHeaderColumn
          dataField="id"
          dataFormat={(id: number, submission: Submission) => {
            let url = UrlFormatter.submissionUrl(submission.);
          }}
        >
          Submission
        </TableHeaderColumn>
      </BootstrapTable>
    );
  }
}
