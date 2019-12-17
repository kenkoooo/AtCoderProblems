import React from "react";
import Ranking from "../components/Ranking";
import { getShortRanking } from "../utils/Api";
import { List } from "immutable";
import { RankingEntry } from "../interfaces/RankingEntry";
import { connect, PromiseState } from "react-refetch";
import * as Api from "../utils/Api";

interface Props {
  rankingFetch: PromiseState<List<RankingEntry>>;
}

const FirstRanking = (props: Props) => (
  <Ranking
    title={"Top Golfers"}
    ranking={props.rankingFetch.fulfilled ? props.rankingFetch.value : List()}
  />
);

export default connect<{}, Props>(() => ({
  rankingFetch: {
    comparison: null,
    value: () =>
      Api.fetchMergedProblems().then(p => getShortRanking(p.toList()))
  }
}))(FirstRanking);
