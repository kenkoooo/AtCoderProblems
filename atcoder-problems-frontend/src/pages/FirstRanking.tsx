import React from "react";
import { useFirstRanking } from "../api/APIClient";
import { Ranking } from "../components/Ranking";

export const FirstRanking = () => {
  const ranking = useFirstRanking();
  return <Ranking title={"First AC Ranking"} ranking={ranking ?? []} />;
};
