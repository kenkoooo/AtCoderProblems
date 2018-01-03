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
    switch (this.props.ranking) {
      case RankingKind.Sums:
        ApiCall.getRatedPointSumRanking().then(ranking =>
          this.setState({ ranking: ranking })
        );
        break;
      default:
        ApiCall.getRanking(this.props.ranking).then(ranking =>
          this.setState({ ranking: ranking })
        );
        break;
    }
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
        case RankingKind.Sums:
          return "Rated Point Ranking";
      }
      return "";
    };

    let getColumnName = (rankingString: string) => {
      switch (rankingString) {
        case RankingKind.Sums:
          return "Point Sum";
        default:
          return "Problems";
      }
    };

    return (
      <Row>
        <PageHeader>{getTitle(this.props.ranking)}</PageHeader>
        <BootstrapTable
          data={this.state.ranking}
          striped
          search
          pagination
          options={{
            paginationPosition: "top",
            sizePerPage: 200,
            sizePerPageList: [
              {
                text: "200",
                value: 200
              },
              {
                text: "500",
                value: 500
              },
              {
                text: "1000",
                value: 1000
              },
              {
                text: "All",
                value: this.state.ranking.length
              }
            ]
          }}
        >
          <TableHeaderColumn dataField="rank" isKey dataSort>
            Rank
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="user_id"
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
            {getColumnName(this.props.ranking)}
          </TableHeaderColumn>
        </BootstrapTable>
      </Row>
    );
  }
}
