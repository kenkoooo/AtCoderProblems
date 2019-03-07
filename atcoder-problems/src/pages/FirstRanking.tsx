import React from 'react';
import * as ApiUrl from "../utils/Api";
import Ranking from "../components/Ranking";

const FirstRanking = () => (
    <Ranking
        title="First AC Ranking"
        fetch={() => ApiUrl.fetchFirstRanking().then(rows => rows.map(row => ({ count: row.problem_count, id: row.user_id })))}
    />
);

export default FirstRanking;
