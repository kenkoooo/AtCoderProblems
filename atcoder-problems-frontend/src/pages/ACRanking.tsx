import React from "react";
import { RemoteRanking } from "../components/Ranking";
import { useACRanking, useUserACRank } from "../api/APIClient";

export const ACRanking = () => {
  const [page, setPage] = React.useState(1);
  const [sizePerPage, setSizePerPage] = React.useState(20);
  const data =
    useACRanking((page - 1) * sizePerPage, page * sizePerPage).data ?? [];
  const firstUser = data.length === 0 ? "" : data[0].user_id;
  const firstRankOnPage = useUserACRank(firstUser).data?.rank ?? 0;
  return (
    <RemoteRanking
      title="AC Count Ranking"
      rankingSize={1000}
      page={page}
      sizePerPage={sizePerPage}
      firstRankOnPage={firstRankOnPage}
      data={data}
      setPage={setPage}
      setSizePerPage={setSizePerPage}
    />
  );
};
