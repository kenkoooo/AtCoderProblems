import React from "react";
import Ranking from "../components/Ranking";
import { getFastRanking } from "../utils/Api";
import { List } from "immutable";
import { RankingEntry } from "../interfaces/RankingEntry";
import { connect, PromiseState } from "react-refetch";
import * as Api from "../utils/Api";

interface Props {
  rankingFetch: PromiseState<List<RankingEntry>>;
}

const FastestRanking = (props: Props) => (
  <Ranking
    title={"Fastest Submission Ranking"}
    ranking={props.rankingFetch.fulfilled ? props.rankingFetch.value : List()}
  />
);

export default connect<{}, Props>(() => ({
  rankingFetch: {
    comparison: null,
    value: () => Api.fetchMergedProblems().then(p => getFastRanking(p.toList()))
  }
}))(FastestRanking);
