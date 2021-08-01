import React, { useState } from "react";
import { useSumRanking, useUserSumRank } from "../api/APIClient";
import { DEFAULT_RANKING_RANGE, RemoteRanking } from "../components/Ranking";

export const SumRanking = () => {
  const [range, setRange] = useState(DEFAULT_RANKING_RANGE);
  const ranking = useSumRanking(range.from, range.to).data ?? [];
  const firstUser = ranking.length === 0 ? "" : ranking[0].user_id;
  const firstRankOnPage = useUserSumRank(firstUser).data?.rank ?? 0;

  return (
    <RemoteRanking
      titleComponent="Rated Point Ranking"
      rankingSize={1000}
      ranking={ranking}
      firstRankOnPage={firstRankOnPage}
      onChangeRange={setRange}
    />
  );
};
