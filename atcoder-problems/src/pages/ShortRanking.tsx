import React from 'react';
import * as ApiUrl from "../utils/Api";
import Ranking from "../components/Ranking";

const ShortRanking = () => (
    <Ranking
        title="Top Golfers"
        fetch={() => ApiUrl.fetchShortRanking().then(rows => rows.map(row => ({ count: row.problem_count, id: row.user_id })))}

    />
);

export default ShortRanking;
