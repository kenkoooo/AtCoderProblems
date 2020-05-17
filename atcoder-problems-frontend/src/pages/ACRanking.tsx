import React from "react";
import Ranking from "../components/Ranking";
import { RankingEntry } from "../interfaces/RankingEntry";
import { connect, PromiseState } from "react-refetch";
import * as CachedApiClient from "../utils/CachedApiClient";

interface InnerProps {
  rankingFetch: PromiseState<RankingEntry[]>;
}

const ACRanking: React.FC<InnerProps> = (props) => (
  <Ranking
    title="AC Count Ranking"
    ranking={props.rankingFetch.fulfilled ? props.rankingFetch.value : []}
  />
);

export default connect<{}, InnerProps>(() => ({
  rankingFetch: {
    comparison: null,
    value: (): Promise<RankingEntry[]> => CachedApiClient.cachedACRanking(),
  },
}))(ACRanking);
