import React from "react";
import { List } from "immutable";
import { connect, PromiseState } from "react-refetch";
import { Ranking } from "../components/Ranking";
import { RankingEntry } from "../interfaces/RankingEntry";
import * as CachedApiClient from "../utils/CachedApiClient";

interface Props {
  rankingFetch: PromiseState<List<RankingEntry>>;
}

const InnerShortRanking: React.FC<Props> = (props) => (
  <Ranking
    title={"Top Golfers"}
    ranking={
      props.rankingFetch.fulfilled ? props.rankingFetch.value.toArray() : []
    }
  />
);

export const ShortRanking = connect<unknown, Props>(() => ({
  rankingFetch: {
    comparison: null,
    value: CachedApiClient.cachedShortRanking,
  },
}))(InnerShortRanking);
