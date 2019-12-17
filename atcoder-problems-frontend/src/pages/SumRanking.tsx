import React from "react";
import Ranking from "../components/Ranking";
import { RankingEntry } from "../interfaces/RankingEntry";
import { List } from "immutable";
import { connect, PromiseState } from "react-refetch";
import * as Api from "../utils/Api";

interface Props {
  rankingFetch: PromiseState<List<RankingEntry>>;
}

const SumRanking = (props: Props) => (
  <Ranking
    title="Rated Point Ranking"
    ranking={props.rankingFetch.fulfilled ? props.rankingFetch.value : List()}
  />
);

export default connect<{}, Props>(() => ({
  rankingFetch: {
    comparison: null,
    value: () =>
      Api.fetchSumRanking().then(ranking =>
        ranking.map(r => ({
          problem_count: r.point_sum,
          user_id: r.user_id
        }))
      )
  }
}))(SumRanking);
