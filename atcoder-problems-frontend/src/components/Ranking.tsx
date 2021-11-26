import React from "react";
import { Row, Form, FormGroup, CustomInput } from "reactstrap";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { RankingEntry } from "../interfaces/RankingEntry";
import { useLocalStorage } from "../utils/LocalStorage";
import { UserNameLabel } from "./UserNameLabel";

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
    .sort((a, b) => b.count - a.count)
    .reduce((array, entry, index) => {
      const last = array.length === 0 ? undefined : array[array.length - 1];
      const nextEntry =
        last && last.count === entry.count
          ? {
              rank: last.rank,
              id: entry.user_id,
              count: entry.count,
            }
          : {
              rank: index + 1,
              id: entry.user_id,
              count: entry.count,
            };
      array.push(nextEntry);
      return array;
    }, [] as InternalRankEntry[]);

export const Ranking: React.FC<Props> = (props) => {
  const [showRating, setShowRating] = useLocalStorage("showRating", false);
  const usernameFormatter = (cell: string) => {
    return <UserNameLabel userId={cell} showRating={showRating} />;
  };
  return (
    <Row>
      <Form inline>
        <h2>{props.title}</h2>
        <FormGroup className="ml-3">
          <CustomInput
            type="switch"
            id="showRating"
            label="Show Rating"
            checked={showRating}
            onChange={(): void => setShowRating(!showRating)}
          />
        </FormGroup>
      </Form>
      <BootstrapTable
        height="auto"
        data={refineRanking(props.ranking)}
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
        <TableHeaderColumn dataField="id" isKey dataFormat={usernameFormatter}>
          User
        </TableHeaderColumn>
        <TableHeaderColumn dataField="count">Count</TableHeaderColumn>
      </BootstrapTable>
    </Row>
  );
};

const refineRankingWithOffset = (
  ranking: RankingEntry[],
  firstRankOnPage: number,
  offset: number
): InternalRankEntry[] =>
  ranking
    .sort((a, b) => b.count - a.count)
    .reduce((array, rankingEntry, index) => {
      const previous = array.length === 0 ? undefined : array[array.length - 1];
      const entry = {
        id: rankingEntry.user_id,
        count: rankingEntry.count,
      };
      if (!previous) {
        array.push({
          ...entry,
          rank: firstRankOnPage + 1,
        });
      } else if (previous.count === rankingEntry.count) {
        array.push({
          ...entry,
          rank: previous.rank,
        });
      } else {
        array.push({
          ...entry,
          rank: index + offset + 1,
        });
      }
      return array;
    }, [] as InternalRankEntry[]);

interface RemoteProps {
  titleComponent: React.ReactNode;
  rankingSize: number;
  ranking: RankingEntry[];
  firstRankOnPage: number;
  onChangeRange: (range: { from: number; to: number }) => void;
}
export const DEFAULT_RANKING_RANGE = { from: 0, to: 20 };
export const RemoteRanking: React.FC<RemoteProps> = (props) => {
  const [page, setPage] = React.useState(1);
  const [sizePerPage, setSizePerPage] = React.useState(20);

  const onPageChange = (newPage: number) => {
    setPage(newPage);
    props.onChangeRange({
      from: (newPage - 1) * sizePerPage,
      to: newPage * sizePerPage,
    });
  };
  const onSizePerPageList = (newSizePerPage: number) => {
    setSizePerPage(newSizePerPage);
    props.onChangeRange({
      from: (page - 1) * newSizePerPage,
      to: page * newSizePerPage,
    });
  };
  const offset = (page - 1) * sizePerPage;
  const [showRating, setShowRating] = useLocalStorage("showRating", false);
  const usernameFormatter = (cell: string) => {
    return <UserNameLabel userId={cell} showRating={showRating} />;
  };
  return (
    <Row>
      <Form inline>
        <h2>{props.titleComponent}</h2>
        <FormGroup className="ml-3">
          <CustomInput
            type="switch"
            id="showRating"
            label="Show Rating"
            checked={showRating}
            onChange={(): void => setShowRating(!showRating)}
          />
        </FormGroup>
      </Form>
      <BootstrapTable
        height="auto"
        data={refineRankingWithOffset(
          props.ranking,
          props.firstRankOnPage,
          offset
        )}
        fetchInfo={{ dataTotalSize: props.rankingSize }}
        remote
        pagination
        striped
        hover
        options={{
          onPageChange: onPageChange,
          onSizePerPageList: onSizePerPageList,
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
          ],
        }}
      >
        <TableHeaderColumn dataField="rank">#</TableHeaderColumn>
        <TableHeaderColumn dataField="id" isKey dataFormat={usernameFormatter}>
          User
        </TableHeaderColumn>
        <TableHeaderColumn dataField="count">Count</TableHeaderColumn>
      </BootstrapTable>
    </Row>
  );
};
