import React from "react";
import { connect, PromiseState } from "react-refetch";
import { Badge, UncontrolledTooltip } from "reactstrap";
import { Ranking } from "../components/Ranking";
import { RankingEntry } from "../interfaces/RankingEntry";
import * as CachedApiClient from "../utils/CachedApiClient";

interface Props {
  rankingFetch: PromiseState<RankingEntry[]>;
}

const InnerStreakRanking: React.FC<Props> = (props) => (
  <Ranking
    title={
      <>
        Streak Ranking{" "}
        <Badge pill id="streakRankingTooltip">
          ?
        </Badge>
        <UncontrolledTooltip target="streakRankingTooltip" placement="right">
          The streak ranking is based on <strong>Japan Standard Time</strong>{" "}
          (JST, UTC+9).
        </UncontrolledTooltip>
      </>
    }
    ranking={props.rankingFetch.fulfilled ? props.rankingFetch.value : []}
  />
);

export const StreakRanking = connect<{}, Props>(() => ({
  rankingFetch: {
    comparison: null,
    value: CachedApiClient.cachedStreaksRanking,
  },
}))(InnerStreakRanking);
