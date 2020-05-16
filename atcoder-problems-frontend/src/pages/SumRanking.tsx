import React from "react";
import Ranking from "../components/Ranking";
import { RankingEntry } from "../interfaces/RankingEntry";
import { connect, PromiseState } from "react-refetch";
import * as CachedApiClient from "../utils/CachedApiClient";

interface Props {
  rankingFetch: PromiseState<RankingEntry[]>;
}

const SumRanking: React.FC<Props> = props => (
  <Ranking
    title="Rated Point Ranking"
    ranking={props.rankingFetch.fulfilled ? props.rankingFetch.value : []}
  />
);

export default connect<{}, Props>(() => ({
  rankingFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedSumRanking()
  }
}))(SumRanking);
