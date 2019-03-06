import React from 'react';
import * as ApiUrl from "../utils/Api";
import Ranking from "../components/Ranking";

const ACRanking = () => (
    <Ranking
        title="AC Ranking"
        fetch={() => ApiUrl.fetchACRanking().then(rows => rows.map(row => ({ count: row.problem_count, id: row.user_id })))}

    />
);

export default ACRanking;
