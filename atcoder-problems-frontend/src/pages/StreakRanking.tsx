import React, { useState } from "react";
import { Badge, UncontrolledTooltip } from "reactstrap";
import { useStreakRanking, useUserStreakRank } from "../api/APIClient";
import { DEFAULT_RANKING_RANGE, RemoteRanking } from "../components/Ranking";

export const StreakRanking = () => {
  const [range, setRange] = useState(DEFAULT_RANKING_RANGE);
  const ranking = useStreakRanking(range.from, range.to).data ?? [];
  const firstUser = ranking.length === 0 ? "" : ranking[0].user_id;
  const firstRankOnPage = useUserStreakRank(firstUser).data?.rank ?? 0;
  return (
    <RemoteRanking
      titleComponent={
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
      ranking={ranking}
      firstRankOnPage={firstRankOnPage}
      onChangeRange={setRange}
    />
  );
};
