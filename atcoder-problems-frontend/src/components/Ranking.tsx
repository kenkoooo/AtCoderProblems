import React from "react";
import { Row } from "reactstrap";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { RankingEntry } from "../interfaces/RankingEntry";
import { useACRanking } from "../api/APIClient";

interface Props {
  title: React.ReactNode;
  ranking: RankingEntry[];
}

interface InternalRankEntry {
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

export const Ranking: React.FC<Props> = (props) => (
  <Row>
    <h2>{props.title}</h2>
    <BootstrapTable
      height="auto"
      data={refineRanking(props.ranking)}
      pagination
      striped
      hover
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
);

interface RemoteProps {
  title: React.ReactNode;
}

export const RemoteRanking: React.FC<RemoteProps> = (props) => {
  const rankingSize = 1000;
  const [page, setPage] = React.useState(1);
  const [sizePerPage, setSizePerPage] = React.useState(20);
  const data = useACRanking((page - 1) * sizePerPage, page * sizePerPage);

  function handlePageChange(page: number) {
    setPage(page);
  }

  function handleSizePerPageChange(sizePerPage: number) {
    // When changing the size per page always navigating to the first page
    setSizePerPage(sizePerPage);
  }

  return (
    <Row>
      <h2>{props.title}</h2>
      <BootstrapTable
        height="auto"
        data={refineRanking(data.data ?? [])}
        fetchInfo={{ dataTotalSize: rankingSize }}
        remote
        pagination
        striped
        hover
        options={{
          onPageChange: handlePageChange,
          onSizePerPageList: handleSizePerPageChange,
          page: page,
          sizePerPage: sizePerPage,
          paginationPosition: "top",
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
              text: "1000",
              value: rankingSize,
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
  );
};
