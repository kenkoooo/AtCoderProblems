import React from "react";
import { Row } from "reactstrap";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { RankingEntry } from "../interfaces/RankingEntry";
import RankingChart from "./RankingChart";

interface Props {
  title: React.ReactNode;
  ranking: RankingEntry[];
}

export interface InternalRankEntry {
  readonly rank: number;
  readonly id: string;
  readonly count: number;
}

const refineRanking = (ranking: RankingEntry[]): InternalRankEntry[] =>
  ranking
    .sort((a, b) => b.problem_count - a.problem_count)
    .reduce((array, entry, index) => {
      const last = array.length === 0 ? undefined : array[array.length - 1];
      const nextEntry =
        last && last.count === entry.problem_count
          ? {
              rank: last.rank,
              id: entry.user_id,
              count: entry.problem_count,
            }
          : {
              rank: index + 1,
              id: entry.user_id,
              count: entry.problem_count,
            };
      array.push(nextEntry);
      return array;
    }, [] as InternalRankEntry[]);

const Ranking: React.FC<Props> = (props) => {
  const refinedRanking = refineRanking(props.ranking);

  return (
    <>
      <Row>
        <h1>{props.title}</h1>
      </Row>

      <Row className="my-3">
        <h2>Ranking Chart</h2>
      </Row>
      <RankingChart data={refinedRanking} />

      <Row className="my-3">
        <h2>Ranking</h2>
        <BootstrapTable
          height="auto"
          data={refinedRanking}
          pagination
          striped
          hover
          search
          options={{
            paginationPosition: "top",
            sizePerPage: 20,
            sizePerPageList: [
              {
                text: "20",
                value: 20,
              },
              {
                text: "50",
                value: 50,
              },
              {
                text: "100",
                value: 100,
              },
              {
                text: "200",
                value: 200,
              },
              {
                text: "All",
                value: props.ranking.length,
              },
            ],
          }}
        >
          <TableHeaderColumn dataField="rank">#</TableHeaderColumn>
          <TableHeaderColumn dataField="id" isKey>
            User
          </TableHeaderColumn>
          <TableHeaderColumn dataField="count">Count</TableHeaderColumn>
        </BootstrapTable>
      </Row>
    </>
  );
};

export default Ranking;
