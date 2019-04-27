import React from "react";
import * as ApiUrl from "../utils/Api";
import Ranking from "../components/Ranking";

const ShortRanking = () => (
  <Ranking
    title="Top Golfers"
    fetch={() => ApiUrl.fetchMergedProblems().then(problems => ApiUrl.getShortRanking(problems).map(({ problem_count, user_id }) => ({ count: problem_count, id: user_id })))}
  />
);

export default ShortRanking;
