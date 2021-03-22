import React from "react";
import { useACRanking } from "../api/APIClient";
import { Ranking } from "../components/Ranking";

export const ACRanking = () => {
  const { data } = useACRanking();
  return <Ranking title="AC Count Ranking" ranking={data ?? []} />;
};
