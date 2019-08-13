import React from "react";
import { Row } from "reactstrap";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { RankingEntry } from "../interfaces/RankingEntry";
import { List } from "immutable";

interface Props {
  title: string;
  ranking: List<RankingEntry>;
}

interface InternalRankEntry {
  readonly rank: number;
  readonly id: string;
  readonly count: number;
}

const refineRanking = (ranking: List<RankingEntry>) =>
  ranking
    .sort((a, b) => b.problem_count - a.problem_count)
    .reduce((list, entry, index) => {
      const last = list.last(undefined);
      return last && last.count == entry.problem_count
        ? list.push({
            rank: last.rank,
            id: entry.user_id,
            count: entry.problem_count
          })
        : list.push({
            rank: index + 1,
            id: entry.user_id,
            count: entry.problem_count
          });
    }, List<InternalRankEntry>());

const Ranking = (props: Props) => (
  <Row>
    <h2>{props.title}</h2>
    <BootstrapTable
      height="auto"
      data={refineRanking(props.ranking).toArray()}
      pagination
      striped
      hover
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
            value: props.ranking.size
          }
        ]
      }}
    >
      <TableHeaderColumn dataField="rank">#</TableHeaderColumn>
      <TableHeaderColumn dataField="id" isKey>
        User
      </TableHeaderColumn>
      <TableHeaderColumn dataField="count">Count</TableHeaderColumn>
    </BootstrapTable>
  </Row>
);

export default Ranking;
