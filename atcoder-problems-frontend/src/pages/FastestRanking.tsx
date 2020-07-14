import React from "react";
import { List } from "immutable";
import { connect, PromiseState } from "react-refetch";
import { Ranking } from "../components/Ranking";
import { RankingEntry } from "../interfaces/RankingEntry";
import * as CachedApiClient from "../utils/CachedApiClient";

interface Props {
  rankingFetch: PromiseState<List<RankingEntry>>;
}

const InnerFastestRanking: React.FC<Props> = (props) => (
  <Ranking
    title={"Fastest Submission Ranking"}
    ranking={
      props.rankingFetch.fulfilled ? props.rankingFetch.value.toArray() : []
    }
  />
);

export const FastestRanking = connect<{}, Props>(() => ({
  rankingFetch: {
    comparison: null,
    value: CachedApiClient.cachedFastRanking,
  },
}))(InnerFastestRanking);
