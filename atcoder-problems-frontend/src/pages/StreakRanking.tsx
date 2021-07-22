import React from "react";
import { Badge, UncontrolledTooltip } from "reactstrap";
import { useStreakRanking, useUserStreakRank } from "../api/APIClient";
import { RemoteRanking } from "../components/Ranking";

export const StreakRanking = () => {
  const [page, setPage] = React.useState(1);
  const [sizePerPage, setSizePerPage] = React.useState(20);
  const data =
    useStreakRanking((page - 1) * sizePerPage, page * sizePerPage).data ?? [];
  const firstUser = data.length === 0 ? "" : data[0].user_id;
  const firstRankOnPage = useUserStreakRank(firstUser).data?.rank ?? 0;
  return (
    <RemoteRanking
      title={
        <>
          Streak Ranking{" "}
          <Badge pill id="streakRankingTooltip">
            ?
          </Badge>
          <UncontrolledTooltip target="streakRankingTooltip" placement="right">
            The streak ranking is based on <strong>Japan Standard Time</strong>{" "}
            (JST, UTC+9).
          </UncontrolledTooltip>
        </>
      }
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
