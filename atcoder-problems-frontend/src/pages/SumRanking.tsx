import React from 'react';
import * as ApiUrl from "../utils/Api";
import Ranking from "../components/Ranking";

const SumRanking = () => (
    <Ranking
        title="Rated Point Ranking"
        fetch={() => ApiUrl.fetchSumRanking().then(rows => rows.map(row => ({ count: row.point_sum, id: row.user_id })))}
    />
);

export default SumRanking;
