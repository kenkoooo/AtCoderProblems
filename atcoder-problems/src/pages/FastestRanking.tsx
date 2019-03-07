import React from 'react';
import * as ApiUrl from "../utils/Api";
import Ranking from "../components/Ranking";

const FastestRanking = () => (
    <Ranking
        title="Fastest Submission Ranking"
        fetch={() => ApiUrl.fetchFastRanking().then(rows => rows.map(row => ({ count: row.problem_count, id: row.user_id })))}

    />
);

export default FastestRanking;
