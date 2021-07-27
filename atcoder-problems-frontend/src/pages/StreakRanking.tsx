import React from "react";
import { Badge, UncontrolledTooltip } from "reactstrap";
import { useStreakRanking, useUserStreakRank } from "../api/APIClient";
import { RemoteRanking } from "../components/Ranking";

export const StreakRanking = () => {
  return (
    <RemoteRanking
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
      rankingSize={1000}
      getRanking={useStreakRanking}
      getUserRank={useUserStreakRank}
    />
  );
};
