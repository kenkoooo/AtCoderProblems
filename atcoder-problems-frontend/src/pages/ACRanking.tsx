import React from "react";
import Ranking from "../components/Ranking";
import { RankingEntry } from "../interfaces/RankingEntry";
import { List } from "immutable";
import { connect, PromiseState } from "react-refetch";
import * as Api from "../utils/Api";

interface InnerProps {
  rankingFetch: PromiseState<List<RankingEntry>>;
}

const ACRanking = (props: InnerProps) => (
  <Ranking
    title="AC Count Ranking"
    ranking={props.rankingFetch.fulfilled ? props.rankingFetch.value : List()}
  />
);

export default connect<{}, InnerProps>(() => ({
  rankingFetch: {
    comparison: null,
    value: () => Api.fetchACRanking()
  }
}))(ACRanking);
