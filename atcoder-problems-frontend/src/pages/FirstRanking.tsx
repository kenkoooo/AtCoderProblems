import React from 'react';
import * as ApiUrl from "../utils/Api";
import Ranking from "../components/Ranking";

const FirstRanking = () => (
    <Ranking
        title="First AC Ranking"
        fetch={() => ApiUrl.fetchMergedProblems().then(problems => ApiUrl.getFirstRanking(problems).map(({ problem_count, user_id }) => ({ count: problem_count, id: user_id })))}
    />
);

export default FirstRanking;
