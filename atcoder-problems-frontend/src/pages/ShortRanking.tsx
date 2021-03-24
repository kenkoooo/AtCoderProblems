import React from "react";
import { useShortRanking } from "../api/APIClient";
import { Ranking } from "../components/Ranking";
export const ShortRanking = () => {
  const ranking = useShortRanking();
  return <Ranking title={"Top Golfers"} ranking={ranking ?? []} />;
};
