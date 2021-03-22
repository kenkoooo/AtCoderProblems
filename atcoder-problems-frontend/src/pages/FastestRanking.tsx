import React from "react";
import { useFastRanking } from "../api/APIClient";
import { Ranking } from "../components/Ranking";

export const FastestRanking = () => {
  const ranking = useFastRanking();
  return (
    <Ranking title={"Fastest Submission Ranking"} ranking={ranking ?? []} />
  );
};
