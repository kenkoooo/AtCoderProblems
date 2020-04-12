import React from "react";
import { Row } from "reactstrap";

import Submission from "../../interfaces/Submission";
import MergedProblem from "../../interfaces/MergedProblem";
import Contest from "../../interfaces/Contest";
import { isAccepted } from "../../utils";
import { formatMomentDate, parseSecond } from "../../utils/DateUtil";
import LanguageCount from "./LanguageCount";
import Recommendations from "./Recommendations";
import { ContestId, ProblemId } from "../../interfaces/Status";
import { List, Map as ImmutableMap } from "immutable";
import * as CachedApiClient from "../../utils/CachedApiClient";
import ProblemModel from "../../interfaces/ProblemModel";
import { RatingInfo, ratingInfoOf } from "../../utils/RatingInfo";
import Problem from "../../interfaces/Problem";
import { connect, PromiseState } from "react-refetch";
import { SubmissionListTable } from "../../components/SubmissionListTable";
import { convertMap } from "../../utils/ImmutableMigration";
import { PieChartBlock } from "./PieChartBlock";
import { AchievementBlock } from "./AchievementBlock";
import { ProgressChartBlock } from "./ProgressChartBlock";

interface OuterProps {
  userId: string;
}

interface InnerProps extends OuterProps {
  userRatingInfoFetch: PromiseState<RatingInfo>;
  mergedProblemsFetch: PromiseState<ImmutableMap<ProblemId, MergedProblem>>;
  submissionsFetch: PromiseState<ImmutableMap<ProblemId, List<Submission>>>;
  contestsFetch: PromiseState<ImmutableMap<ContestId, Contest>>;
  contestToProblemsFetch: PromiseState<ImmutableMap<ContestId, List<Problem>>>;
  problemModelsFetch: PromiseState<ImmutableMap<ProblemId, ProblemModel>>;
}

const InnerUserPage = (props: InnerProps) => {
  const {
    userId,
    userRatingInfoFetch,
    submissionsFetch,
    mergedProblemsFetch,
    contestToProblemsFetch,
    contestsFetch,
    problemModelsFetch
  } = props;
  const userRatingInfo = userRatingInfoFetch.fulfilled
    ? userRatingInfoFetch.value
    : ratingInfoOf(List());
  const mergedProblems = mergedProblemsFetch.fulfilled
    ? mergedProblemsFetch.value
    : ImmutableMap<ProblemId, MergedProblem>();
  const contests = contestsFetch.fulfilled
    ? contestsFetch.value
    : ImmutableMap<string, Contest>();
  const problemModels = problemModelsFetch.fulfilled
    ? problemModelsFetch.value
    : ImmutableMap<ProblemId, ProblemModel>();
  const submissions = submissionsFetch.fulfilled
    ? submissionsFetch.value
    : ImmutableMap<ProblemId, List<Submission>>();
  const contestToProblems = contestToProblemsFetch.fulfilled
    ? contestToProblemsFetch.value
    : ImmutableMap<ContestId, List<Problem>>();

  if (userId.length === 0 || submissions.isEmpty()) {
    return null;
  }

  const userSubmissions = submissions
    .valueSeq()
    .flatMap(list => list)
    .filter(s => s.user_id === userId);

  const dailyCount = submissions
    .map(submissionList =>
      submissionList
        .filter(s => s.user_id === userId && isAccepted(s.result))
        .map(s => s.epoch_second)
        .min()
    )
    .filter(
      (second: number | undefined): second is number => second !== undefined
    )
    .map(second => formatMomentDate(parseSecond(second)))
    .reduce(
      (map, date) => map.update(date, 0, count => count + 1),
      ImmutableMap<string, number>()
    )
    .entrySeq()
    .map(([dateLabel, count]) => ({ dateLabel, count }))
    .sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));

  return (
    <div>
      <Row className="my-2 border-bottom">
        <h1>{userId}</h1>
      </Row>

      <AchievementBlock userId={userId} dailyCount={dailyCount.toArray()} />

      <PieChartBlock
        contestToProblems={convertMap(
          contestToProblems.map(list => list.toArray())
        )}
        userId={userId}
        submissions={convertMap(submissions.map(list => list.toArray()))}
      />

      <ProgressChartBlock
        dailyCount={dailyCount.toArray()}
        userSubmissions={userSubmissions.toArray()}
      />

      <Row className="my-2 border-bottom">
        <h1>Submissions</h1>
      </Row>
      <SubmissionListTable
        problemModels={convertMap(problemModels)}
        problems={mergedProblems.valueSeq().toArray()}
        submissions={userSubmissions.toArray()}
      />

      <Row className="my-2 border-bottom">
        <h1>Languages</h1>
      </Row>
      <LanguageCount submissions={userSubmissions.toArray()} />

      <Row className="my-2 border-bottom">
        <h1>Recommendations</h1>
      </Row>
      <Recommendations
        userSubmissions={userSubmissions.toList()}
        problems={mergedProblems.valueSeq().toList()}
        contests={contests}
        problemModels={problemModels}
        userRatingInfo={userRatingInfo}
      />
    </div>
  );
};

export const UserPage = connect<OuterProps, InnerProps>(({ userId }) => ({
  submissionsFetch: {
    comparison: userId,
    value: () => CachedApiClient.cachedUsersSubmissionMap(List([userId]))
  },
  mergedProblemsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedMergedProblemMap()
  },
  problemModelsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedProblemModels()
  },
  contestsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedContestMap()
  },
  userRatingInfoFetch: {
    comparison: userId,
    value: () => CachedApiClient.cachedRatingInfo(userId)
  },
  contestToProblemsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedContestToProblemMap()
  }
}))(InnerUserPage);
