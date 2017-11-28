import * as React from "react";
import { Submission } from "../model/Submission";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";

export interface UserPageTableProps {
  submissions: Array<Submission>;
}

export class UserPageTable extends React.Component<UserPageTableProps, {}> {
  render() {
    return (
      <BootstrapTable data={this.props.submissions} striped search>
        <TableHeaderColumn dataField="epoch_second" isKey>
          Date
        </TableHeaderColumn>
      </BootstrapTable>
    );
  }
}
