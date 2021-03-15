import React from "react";
import { Badge, UncontrolledTooltip } from "reactstrap";
import { useStreakRanking } from "../api/APIClient";
import { Ranking } from "../components/Ranking";

export const StreakRanking = () => {
  const { data } = useStreakRanking();
  return (
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
      ranking={data ?? []}
    />
  );
};
