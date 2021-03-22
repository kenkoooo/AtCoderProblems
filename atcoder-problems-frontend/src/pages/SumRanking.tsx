import React from "react";
import { useSumRanking } from "../api/APIClient";
import { Ranking } from "../components/Ranking";

export const SumRanking = () => {
  const { data } = useSumRanking();
  return <Ranking title="Rated Point Ranking" ranking={data ?? []} />;
};
