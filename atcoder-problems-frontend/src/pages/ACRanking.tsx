import React from "react";
import { RemoteRanking } from "../components/Ranking";
import { useACRanking } from "../api/APIClient";

export const ACRanking = () => {
  const [page, setPage] = React.useState(1);
  const [sizePerPage, setSizePerPage] = React.useState(20);
  const data = useACRanking((page - 1) * sizePerPage, page * sizePerPage);
  return (
    <RemoteRanking
      title="AC Count Ranking"
      rankingSize={1000}
      page={page}
      sizePerPage={sizePerPage}
      data={data.data ?? []}
      setPage={setPage}
      setSizePerPage={setSizePerPage}
    />
  );
};
