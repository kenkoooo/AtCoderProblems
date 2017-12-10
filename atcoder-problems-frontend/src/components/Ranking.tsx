import * as React from "react";
import { ApiCall } from "../utils/ApiCall";
import { RankPair } from "../model/RankPair";
import { Row, PageHeader } from "react-bootstrap";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { RankingKind } from "../model/RankingKind";
import { HtmlFormatter } from "../utils/HtmlFormatter";

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
    ApiCall.getRanking(this.props.ranking).then(ranking =>
      this.setState({ ranking: ranking.slice(0, 1000) })
    );
  }

  render() {
    let getTitle = (rankingString: string) => {
      switch (rankingString) {
        case RankingKind.Accepted:
          return "Top Problem Solvers";
        case RankingKind.Fastest:
          return "Top Accelerators";
        case RankingKind.First:
          return "Top Speed Runners";
        case RankingKind.Shortest:
          return "Top Code Golfers";
      }
      return "";
    };

    return (
      <Row>
        <PageHeader>{getTitle(this.props.ranking)}</PageHeader>
        <BootstrapTable data={this.state.ranking} striped search>
          <TableHeaderColumn dataField="rank" isKey dataSort>
            Rank
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="userId"
            dataSort
            dataFormat={(user: string) =>
              HtmlFormatter.createLink(`./?user=${user}&kind=user`, user, true)
            }
          >
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
