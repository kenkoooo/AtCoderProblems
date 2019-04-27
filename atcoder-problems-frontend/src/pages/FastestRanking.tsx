import React from 'react';
import * as ApiUrl from "../utils/Api";
import Ranking from "../components/Ranking";

const FastestRanking = () => (
    <Ranking
        title="Fastest Submission Ranking"
        fetch={() => ApiUrl.fetchMergedProblems().then(problems => ApiUrl.getFastRanking(problems).map(({ problem_count, user_id }) => ({ count: problem_count, id: user_id })))}
    />
);

export default FastestRanking;
