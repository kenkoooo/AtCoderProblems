import React from "react";
import { RemoteRanking } from "../components/Ranking";
import { useACRanking, useUserACRank } from "../api/APIClient";

export const ACRanking = () => {
  return (
    <RemoteRanking
      title="AC Count Ranking"
      rankingSize={1000}
      getRanking={useACRanking}
      getUserRank={useUserACRank}
    />
  );
};
