import React from "react";
import Ranking from "../components/Ranking";
import { List } from "immutable";
import { RankingEntry } from "../interfaces/RankingEntry";
import { connect, PromiseState } from "react-refetch";
import * as CachedApiClient from "../utils/CachedApiClient";

interface Props {
  rankingFetch: PromiseState<List<RankingEntry>>;
}

const FirstRanking: React.FC<Props> = props => (
  <Ranking
    title={"Top Golfers"}
    ranking={
      props.rankingFetch.fulfilled ? props.rankingFetch.value.toArray() : []
    }
  />
);

export default connect<{}, Props>(() => ({
  rankingFetch: {
    comparison: null,
    value: CachedApiClient.cachedShortRanking
  }
}))(FirstRanking);
