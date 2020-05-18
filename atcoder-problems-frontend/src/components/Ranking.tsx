import React from "react";
import { RankingEntry } from "../interfaces/RankingEntry";
import { ReactBootstrapTable } from "./ReactBootstrapTable";

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

const Ranking: React.FC<Props> = (props) => (
  <>
    <h2>{props.title}</h2>
    <ReactBootstrapTable
      striped
      hover
      useSearch
      usePagination
      sizePerPage={20}
      keyField="id"
      data={refineRanking(props.ranking)}
      columns={[
        {
          dataField: "rank",
          headerAlign: "left",
          text: "#",
        },
        {
          dataField: "id",
          headerAlign: "left",
          text: "User",
        },
        {
          dataField: "count",
          headerAlign: "left",
          text: "Count",
        },
      ]}
    />
  </>
);

export default Ranking;
