import * as React from "react";
import { ApiCall } from "../utils/ApiCall";
import { RankPair } from "../model/RankPair";
import { pairs } from "d3";
import { Row, PageHeader } from "react-bootstrap";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";

export interface RankingProps {
  ranking: string;
}

interface RankingState {
  ranking: Array<RankPair>;
}

export class Ranking extends React.Component<RankingProps, RankingState> {
  constructor(props: RankingProps) {
    super(props);
    this.state = { ranking: [] };
  }

  componentWillMount() {
    let url = `./atcoder-api/info/${this.props.ranking}`;
    ApiCall.getRanking(url).then(ranking =>
      this.setState({ ranking: ranking.slice(0, 1000) })
    );
  }

  render() {
    return (
      <Row>
        <PageHeader />
        <BootstrapTable data={this.state.ranking} striped search>
          <TableHeaderColumn dataField="rank" isKey dataSort>
            Rank
          </TableHeaderColumn>
          <TableHeaderColumn dataField="userId" dataSort>
            User ID
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="count"
            dataSort
            dataAlign="right"
            headerAlign="left"
          >
            Problems
          </TableHeaderColumn>
        </BootstrapTable>
      </Row>
    );
  }
}
