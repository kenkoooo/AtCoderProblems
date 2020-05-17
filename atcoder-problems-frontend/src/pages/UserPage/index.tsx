import React from "react";
import { Alert, Nav, NavItem, NavLink, Row, Spinner } from "reactstrap";
import { NavLink as RouterLink, useLocation } from "react-router-dom";

import Submission from "../../interfaces/Submission";
import MergedProblem from "../../interfaces/MergedProblem";
import Contest from "../../interfaces/Contest";
import { isAccepted } from "../../utils";
import { formatMomentDate, parseSecond } from "../../utils/DateUtil";
import LanguageCount from "./LanguageCount";
import { Recommendations } from "./Recommendations";
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
import { generatePathWithParams } from "../../utils/QueryString";
import { isRatedContest } from "../TablePage/ContestClassifier";
import { calcStreak } from "./AchievementBlock/StreakCount";
import { DifficultyPieChart } from "./DifficultyPieChart";

const userPageTabs = [
  "Achievement",
  "AtCoder Pie Charts",
  "Difficulty Pies",
  "Progress Charts",
  "Submissions",
  "Recommendation",
  "Languages",
  "All",
] as const;

const TAB_PARAM = "userPageTab";

type UserPageTab = typeof userPageTabs[number];

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

const InnerUserPage: React.FC<InnerProps> = (props) => {
  const location = useLocation();
  const param = new URLSearchParams(location.search).get(TAB_PARAM);
  const userPageTab: UserPageTab =
    userPageTabs.find((t) => t === param) || "Achievement";

  const {
    userId,
    userRatingInfoFetch,
    submissionsFetch,
    mergedProblemsFetch,
    contestToProblemsFetch,
    contestsFetch,
    problemModelsFetch,
  } = props;

  if (submissionsFetch.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  }

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
    ? convertMap(contestToProblemsFetch.value.map((list) => list.toArray()))
    : new Map<ContestId, Problem[]>();

  if (userId.length === 0 || submissions.isEmpty()) {
    return <Alert color="danger">User not found!</Alert>;
  }

  const ratedProblemIds = new Set(
    contests
      .valueSeq()
      .flatMap((contest) => {
        const isRated = isRatedContest(contest);
        const contestProblems = contestToProblems.get(contest.id);
        return isRated && contestProblems ? contestProblems : [];
      })
      .map((problem) => problem.id)
  );

  const userSubmissions = submissions
    .valueSeq()
    .flatMap((list) => list)
    .filter((s) => s.user_id === userId);

  const dailyCount = submissions
    .map((submissionList) =>
      submissionList
        .filter((s) => s.user_id === userId && isAccepted(s.result))
        .map((s) => s.epoch_second)
        .min()
    )
    .filter(
      (second: number | undefined): second is number => second !== undefined
    )
    .map((second) => formatMomentDate(parseSecond(second)))
    .reduce(
      (map, date) => map.update(date, 0, (count) => count + 1),
      ImmutableMap<string, number>()
    )
    .entrySeq()
    .map(([dateLabel, count]) => ({ dateLabel, count }))
    .sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
  const { longestStreak, currentStreak, prevDateLabel } = calcStreak(
    dailyCount.toArray()
  );
  const solvedProblemIds = submissions
    .entrySeq()
    .filter(([, submissionList]) =>
      submissionList.find((submission) => isAccepted(submission.result))
    )
    .map(([problemId]) => problemId)
    .toArray();
  const ratedPointMap = new Map<ProblemId, number>();
  const acceptedRatedSubmissions = submissions
    .valueSeq()
    .flatMap((a) => a)
    .filter((s) => isAccepted(s.result))
    .filter((s) => ratedProblemIds.has(s.problem_id))
    .toArray();
  acceptedRatedSubmissions.sort((a, b) => a.id - b.id);
  acceptedRatedSubmissions.forEach((s) => {
    ratedPointMap.set(s.problem_id, s.point);
  });
  const ratedPointSum = Array.from(ratedPointMap.values()).reduceRight(
    (s, p) => s + p,
    0
  );

  return (
    <div>
      <Row className="my-2 border-bottom">
        <h1>{userId}</h1>
      </Row>
      <Nav tabs>
        {userPageTabs.map((tab) => (
          <NavItem key={tab}>
            <NavLink
              tag={RouterLink}
              isActive={(): boolean => tab === userPageTab}
              to={generatePathWithParams(location, { [TAB_PARAM]: tab })}
            >
              {tab}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      {(userPageTab === "All" || userPageTab === "Achievement") && (
        <AchievementBlock
          userId={userId}
          solvedCount={solvedProblemIds.length}
          ratedPointSum={ratedPointSum}
          longestStreak={longestStreak}
          currentStreak={currentStreak}
          prevDateLabel={prevDateLabel}
        />
      )}
      {(userPageTab === "All" || userPageTab === "AtCoder Pie Charts") && (
        <PieChartBlock
          contestToProblems={contestToProblems}
          userId={userId}
          submissions={convertMap(submissions.map((list) => list.toArray()))}
        />
      )}
      {(userPageTab === "All" || userPageTab === "Difficulty Pies") && (
        <>
          <Row className="my-2 border-bottom">
            <h1>Difficulty Pies</h1>
          </Row>
          <DifficultyPieChart
            problemModels={convertMap(problemModels)}
            solvedProblemIds={solvedProblemIds}
          />
        </>
      )}
      {(userPageTab === "All" || userPageTab === "Progress Charts") && (
        <ProgressChartBlock
          dailyCount={dailyCount.toArray()}
          userSubmissions={userSubmissions.toArray()}
        />
      )}
      {(userPageTab === "All" || userPageTab === "Submissions") && (
        <>
          <Row className="my-2 border-bottom">
            <h1>Submissions</h1>
          </Row>
          <SubmissionListTable
            problemModels={convertMap(problemModels)}
            problems={mergedProblems.valueSeq().toArray()}
            submissions={userSubmissions.toArray()}
          />
        </>
      )}
      {(userPageTab === "All" || userPageTab === "Languages") && (
        <>
          <Row className="my-2 border-bottom">
            <h1>Languages</h1>
          </Row>
          <LanguageCount submissions={userSubmissions.toArray()} />
        </>
      )}
      {(userPageTab === "All" || userPageTab === "Recommendation") && (
        <>
          <Row className="my-2 border-bottom">
            <h1>Recommendation</h1>
          </Row>
          <Recommendations
            userSubmissions={userSubmissions.toList()}
            problems={mergedProblems.valueSeq().toList()}
            contests={contests}
            problemModels={problemModels}
            userRatingInfo={userRatingInfo}
          />
        </>
      )}
    </div>
  );
};

export const UserPage = connect<OuterProps, InnerProps>(({ userId }) => ({
  submissionsFetch: {
    comparison: userId,
    value: (): Promise<ImmutableMap<string, List<Submission>>> =>
      CachedApiClient.cachedUsersSubmissionMap(List([userId])),
  },
  mergedProblemsFetch: {
    comparison: null,
    value: (): Promise<ImmutableMap<string, MergedProblem>> =>
      CachedApiClient.cachedMergedProblemMap(),
  },
  problemModelsFetch: {
    comparison: null,
    value: (): Promise<ImmutableMap<string, ProblemModel>> =>
      CachedApiClient.cachedProblemModels(),
  },
  contestsFetch: {
    comparison: null,
    value: (): Promise<ImmutableMap<string, Contest>> =>
      CachedApiClient.cachedContestMap(),
  },
  userRatingInfoFetch: {
    comparison: userId,
    value: (): Promise<RatingInfo> => CachedApiClient.cachedRatingInfo(userId),
  },
  contestToProblemsFetch: {
    comparison: null,
    value: (): Promise<ImmutableMap<string, List<Problem>>> =>
      CachedApiClient.cachedContestToProblemMap(),
  },
}))(InnerUserPage);
