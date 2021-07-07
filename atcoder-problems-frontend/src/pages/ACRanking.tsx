import React from "react";
import { useACRanking } from "../api/APIClient";
import { Ranking } from "../components/Ranking";

export const ACRanking = () => {
  const { data } = useACRanking(0, 1000);
  return <Ranking title="AC Count Ranking" ranking={data ?? []} />;
};
