import React from "react";
import { connect, PromiseState } from "react-refetch";
import { Ranking } from "../components/Ranking";
import { RankingEntry } from "../interfaces/RankingEntry";
import * as CachedApiClient from "../utils/CachedApiClient";

interface InnerProps {
  rankingFetch: PromiseState<RankingEntry[]>;
}

const InnerACRanking: React.FC<InnerProps> = (props) => (
  <Ranking
    title="AC Count Ranking"
    ranking={props.rankingFetch.fulfilled ? props.rankingFetch.value : []}
  />
);

export const ACRanking = connect<{}, InnerProps>(() => ({
  rankingFetch: {
    comparison: null,
    value: (): Promise<RankingEntry[]> => CachedApiClient.cachedACRanking(),
  },
}))(InnerACRanking);
