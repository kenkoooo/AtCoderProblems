import React, { useState } from "react";
import { DEFAULT_RANKING_RANGE, RemoteRanking } from "../components/Ranking";
import { useACRanking, useUserACRank } from "../api/APIClient";

export const ACRanking = () => {
  const [range, setRange] = useState(DEFAULT_RANKING_RANGE);
  const ranking = useACRanking(range.from, range.to).data ?? [];
  const firstUser = ranking.length === 0 ? "" : ranking[0].user_id;
  const firstRankOnPage = useUserACRank(firstUser).data?.rank ?? 0;

  return (
    <RemoteRanking
      titleComponent="AC Count Ranking"
      rankingSize={1000}
      ranking={ranking}
      firstRankOnPage={firstRankOnPage}
      onChangeRange={setRange}
    />
  );
};
