import React from "react";
import Ranking from "../components/Ranking";
import { getFirstRanking } from "../utils/Api";
import { List } from "immutable";
import { RankingEntry } from "../interfaces/RankingEntry";
import { connect, PromiseState } from "react-refetch";
import * as Api from "../utils/Api";

interface Props {
  rankingFetch: PromiseState<List<RankingEntry>>;
}

const FirstRanking = (props: Props) => (
  <Ranking
    title={"First AC Ranking"}
    ranking={props.rankingFetch.fulfilled ? props.rankingFetch.value : List()}
  />
);

export default connect<{}, Props>(() => ({
  rankingFetch: {
    comparison: null,
    value: () =>
      Api.fetchMergedProblems().then(p => getFirstRanking(p.toList()))
  }
}))(FirstRanking);
