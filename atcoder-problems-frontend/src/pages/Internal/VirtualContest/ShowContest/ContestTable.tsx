import React from "react";
import { useLocation } from "react-router-dom";
import { Alert, Spinner, Table } from "reactstrap";
import {
  useMergedProblemMap,
  useProblemModelMap,
  useVirtualContestSubmissions,
} from "../../../../api/APIClient";
import { ProblemLink } from "../../../../components/ProblemLink";
import { TweetButton } from "../../../../components/TweetButton";
import MergedProblem from "../../../../interfaces/MergedProblem";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel,
  ProblemModelWithDifficultyModel,
  ProblemModelWithTimeModel,
} from "../../../../interfaces/ProblemModel";
import { ProblemId, UserId } from "../../../../interfaces/Status";
import { clipDifficulty, ordinalSuffixOf } from "../../../../utils";
import { getCurrentUnixtimeInSecond } from "../../../../utils/DateUtil";
import {
  calculatePerformances,
  makeBotRunners,
} from "../../../../utils/RatingSystem";
import { VirtualContestItem, VirtualContestProblem } from "../../types";
import { ContestTableRow } from "./ContestTableRow";
import { FirstAcceptanceRow } from "./FirstAcceptanceRow";
import {
  calcUserTotalResult,
  compareTotalResult,
  ReducedProblemResult,
  UserTotalResult,
} from "./ResultCalcUtil";
import { compareProblem, getResultsByUserMap } from "./util";

interface Props {
  readonly contestId: string;
  readonly contestTitle: string;
  readonly showRating: boolean;
  readonly showProblems: boolean;
  readonly problems: VirtualContestProblem[];
  readonly enableEstimatedPerformances: boolean;
  readonly users: string[];
  readonly start: number;
  readonly end: number;
  readonly enableAutoRefresh: boolean;
  readonly atCoderUserId: string;
  readonly pinMe: boolean;
  readonly penaltySecond: number;
}

const getPerformanceByUserId = (
  lookForUserId: string,
  sortedUserIds: UserId[],
  performanceMap: Map<UserId, number>
) => {
  const index = sortedUserIds.indexOf(lookForUserId);
  if (index < 0) {
    return undefined;
  }
  let upper: number | undefined;
  for (let i = index; i < sortedUserIds.length; i++) {
    const userId = sortedUserIds[i];
    const performance = performanceMap.get(userId);
    if (performance !== undefined) {
      upper = performance;
      break;
    }
  }

  let lower: number | undefined;
  for (let i = index; i >= 0; i--) {
    const userId = sortedUserIds[i];
    const performance = performanceMap.get(userId);
    if (performance !== undefined) {
      lower = performance;
      break;
    }
  }

  if (lower !== undefined && upper !== undefined) {
    return (lower + upper) / 2;
  } else if (lower !== undefined) {
    return lower;
  } else if (upper !== undefined) {
    return upper;
  } else {
    return undefined;
  }
};

export const constructPointOverrideMap = <
  T extends { item: VirtualContestItem }
>(
  problems: T[]
) => {
  const pointOverrideMap = new Map<ProblemId, number>();
  problems.forEach(({ item }) => {
    const problemId = item.id;
    const point = item.point;
    if (point !== null) {
      pointOverrideMap.set(problemId, point);
    }
  });
  return pointOverrideMap;
};

const consolidateModels = (
  problems: VirtualContestProblem[],
  problemMap?: Map<ProblemId, MergedProblem>,
  problemModels?: Map<ProblemId, ProblemModel>
) => {
  const modelArray = [] as {
    problemModel: ProblemModelWithDifficultyModel & ProblemModelWithTimeModel;
    problemId: string;
    point: number;
  }[];
  problems.forEach(({ item }) => {
    const problemId = item.id;
    const point = item.point ?? problemMap?.get(problemId)?.point ?? 100;
    const problemModel = problemModels?.get(problemId);
    if (
      isProblemModelWithTimeModel(problemModel) &&
      isProblemModelWithDifficultyModel(problemModel)
    ) {
      modelArray.push({ problemModel, problemId, point });
    }
  });
  return modelArray;
};

export const ContestTable = (props: Props) => {
  const {
    contestId,
    contestTitle,
    showRating,
    showProblems,
    problems,
    users,
    start,
    end,
    atCoderUserId,
    pinMe,
    penaltySecond,
  } = props;
  const query = new URLSearchParams(useLocation().search);
  const showBots = !!query.get("bot");
  const problemModels = useProblemModelMap();
  const { data: problemMap } = useMergedProblemMap();
  const submissions = useVirtualContestSubmissions(
    props.users,
    problems.map((p) => p.item.id),
    start,
    end,
    props.enableAutoRefresh
  );
  if (!submissions.data && !submissions.error) {
    return <Spinner />;
  }
  if (!submissions.data) {
    return <Alert color="danger">Failed to fetch submissions.</Alert>;
  }

  const modelArray = consolidateModels(problems, problemMap, problemModels);
  const pointOverrideMap = constructPointOverrideMap(problems);
  const resultsByUser = getResultsByUserMap(
    submissions.data,
    users,
    (problemId) => pointOverrideMap.get(problemId)
  );

  const now = getCurrentUnixtimeInSecond();
  const showEstimatedPerformances =
    props.enableEstimatedPerformances &&
    modelArray.length === problems.length &&
    now >= start;
  const botRunnerIds = new Set<UserId>();
  const ratingMap = new Map<UserId, number>();
  if (showEstimatedPerformances) {
    const runners = makeBotRunners(modelArray, start, end);
    for (let i = 0; i < runners.length; i++) {
      const { rating, result } = runners[i];
      const userId = `Bot: ${clipDifficulty(rating)}`;
      botRunnerIds.add(userId);
      resultsByUser.set(userId, result);
      ratingMap.set(userId, rating);
    }
  }

  const totalResultByUser = new Map<UserId, UserTotalResult>();
  resultsByUser.forEach((map, userId) => {
    const totalResult = calcUserTotalResult(map);
    totalResultByUser.set(userId, totalResult);
  });

  const sortedUserIds = Array.from(totalResultByUser)
    .sort(([aId, aResult], [bId, bResult]) => {
      const c = compareTotalResult(aResult, bResult, penaltySecond);
      return c !== 0 ? c : aId.localeCompare(bId);
    })
    .map(([userId]) => userId);

  const performanceMap = new Map<UserId, number>();
  if (showEstimatedPerformances) {
    const participantsRawRatings = [] as number[];
    const userIds = [] as string[];
    sortedUserIds.forEach((userId) => {
      const rating = ratingMap.get(userId);
      if (rating !== undefined) {
        participantsRawRatings.push(rating);
        userIds.push(userId);
      }
    });
    const performances = calculatePerformances(participantsRawRatings);
    for (let i = 0; i < performances.length; i++) {
      const performance = performances[i];
      const userId = userIds[i];
      performanceMap.set(userId, performance);
    }
  }

  const showingUserIds = sortedUserIds.filter(
    (userId) => !botRunnerIds.has(userId) || showBots
  );

  const loginUserIndex = showingUserIds.findIndex(
    (userId) => userId === atCoderUserId
  );

  const sortedItems = problems
    .map((p) => ({
      contestId: p.contestId,
      title: p.title,
      ...p.item,
    }))
    .sort(compareProblem);

  const loginUserRank = loginUserIndex + 1;
  const tweetButton = end < now && (
    <TweetButton
      id={contestId}
      text={`${atCoderUserId} took ${loginUserRank}${ordinalSuffixOf(
        loginUserRank
      )} place in ${contestTitle}!`}
      color="link"
    >
      Share it!
    </TweetButton>
  );

  return (
    <Table striped bordered size="sm">
      <thead>
        <tr className="text-center">
          <th>#</th>
          <th>Participant</th>
          <th>Score</th>
          {showProblems &&
            sortedItems.map((p, i) => (
              <th key={i}>
                {p.contestId && p.title ? (
                  <ProblemLink
                    problemId={p.id}
                    contestId={p.contestId}
                    problemTitle={`${i + 1}`}
                  />
                ) : (
                  i + 1
                )}
              </th>
            ))}
          {showEstimatedPerformances && <th>Estimated Performance</th>}
        </tr>
      </thead>
      <tbody>
        {pinMe && loginUserIndex >= 0 ? (
          <ContestTableRow
            tweetButton={tweetButton}
            userId={atCoderUserId}
            rank={loginUserIndex}
            sortedItems={sortedItems}
            showRating={showRating}
            showProblems={showProblems}
            start={start}
            estimatedPerformance={getPerformanceByUserId(
              atCoderUserId,
              sortedUserIds,
              performanceMap
            )}
            reducedProblemResults={
              resultsByUser.get(atCoderUserId) ??
              new Map<ProblemId, ReducedProblemResult>()
            }
            userTotalResult={totalResultByUser.get(atCoderUserId)}
            penaltySecond={penaltySecond}
          />
        ) : null}
        {showingUserIds.map((userId, i) => {
          return (
            <ContestTableRow
              tweetButton={atCoderUserId === userId && tweetButton}
              key={userId}
              userId={userId}
              rank={i}
              sortedItems={sortedItems}
              showRating={showRating}
              showProblems={showProblems}
              start={start}
              estimatedPerformance={getPerformanceByUserId(
                userId,
                sortedUserIds,
                performanceMap
              )}
              reducedProblemResults={
                resultsByUser.get(userId) ??
                new Map<ProblemId, ReducedProblemResult>()
              }
              userTotalResult={totalResultByUser.get(userId)}
              penaltySecond={penaltySecond}
            />
          );
        })}
        {showProblems && (
          <FirstAcceptanceRow
            start={start}
            userIds={users}
            problemIds={sortedItems.map((item) => item.id)}
            resultsByUser={resultsByUser}
            showRating={showRating}
          />
        )}
      </tbody>
    </Table>
  );
};
