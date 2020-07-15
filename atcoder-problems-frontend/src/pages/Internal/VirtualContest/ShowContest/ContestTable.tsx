import { Table } from "reactstrap";
import React from "react";
import { connect, PromiseState } from "react-refetch";
import { useLocation } from "react-router-dom";
import MergedProblem from "../../../../interfaces/MergedProblem";
import { clipDifficulty } from "../../../../utils";
import { VirtualContestItem } from "../../types";
import { ProblemLink } from "../../../../components/ProblemLink";
import { ProblemId, UserId } from "../../../../interfaces/Status";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel,
  ProblemModelWithDifficultyModel,
  ProblemModelWithTimeModel,
} from "../../../../interfaces/ProblemModel";
import Submission from "../../../../interfaces/Submission";
import {
  cachedMergedProblemMap,
  cachedProblemModels,
  fetchVirtualContestSubmission,
} from "../../../../utils/CachedApiClient";
import {
  calculatePerformances,
  makeBotRunners,
} from "../../../../utils/RatingSystem";
import { convertMap } from "../../../../utils/ImmutableMigration";
import {
  calcUserTotalResult,
  compareTotalResult,
  ReducedProblemResult,
  UserTotalResult,
} from "./ResultCalcUtil";
import { ContestTableRow } from "./ContestTableRow";
import { getPointOverrideMap, getResultsByUserMap } from "./util";

interface OuterProps {
  readonly showProblems: boolean;
  readonly problems: {
    item: VirtualContestItem;
    title?: string;
    contestId?: string;
  }[];
  readonly enableEstimatedPerformances: boolean;
  readonly users: string[];
  readonly start: number;
  readonly end: number;
  readonly enableAutoRefresh: boolean;
  readonly atCoderUserId: string;
  readonly pinMe: boolean;
}

interface InnerProps extends OuterProps {
  submissions: PromiseState<Submission[]>;
  problemModels: PromiseState<Map<ProblemId, ProblemModel>>;
  problemMap: PromiseState<Map<ProblemId, MergedProblem>>;
}

export function compareProblem<T extends { id: string; order: number | null }>(
  a: T,
  b: T
): number {
  if (a.order !== null && b.order !== null) {
    return a.order - b.order;
  }
  return a.id.localeCompare(b.id);
}

const InnerContestTable: React.FC<InnerProps> = (props) => {
  const {
    showProblems,
    problems,
    users,
    start,
    end,
    atCoderUserId,
    pinMe,
  } = props;
  const query = new URLSearchParams(useLocation().search);
  const showBots = !!query.get("bot");

  const problemModels = props.problemModels.fulfilled
    ? props.problemModels.value
    : new Map<ProblemId, ProblemModel>();
  const problemMap = props.problemMap.fulfilled
    ? props.problemMap.value
    : new Map<ProblemId, MergedProblem>();

  const modelArray = [] as {
    problemModel: ProblemModelWithDifficultyModel & ProblemModelWithTimeModel;
    problemId: string;
    point: number;
  }[];
  problems.forEach(({ item }) => {
    const problemId = item.id;
    const point = item.point ?? problemMap.get(problemId)?.point ?? 100;
    const problemModel = problemModels.get(problemId);
    if (
      isProblemModelWithTimeModel(problemModel) &&
      isProblemModelWithDifficultyModel(problemModel)
    ) {
      modelArray.push({ problemModel, problemId, point });
    }
  });

  const pointOverrideMap = getPointOverrideMap(problems);
  const resultsByUser = getResultsByUserMap(
    props.submissions.fulfilled ? props.submissions.value : [],
    users,
    (problemId) => pointOverrideMap.get(problemId)
  );

  const showEstimatedPerformances =
    props.enableEstimatedPerformances && modelArray.length === problems.length;
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
      const c = compareTotalResult(aResult, bResult);
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

  const getPerformanceByUserId = (lookForUserId: string) => {
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

  const showingUserIds = sortedUserIds.filter(
    (userId) => !botRunnerIds.has(userId) || showBots
  );

  const loginUserIndex = showingUserIds.findIndex(
    (userId) => userId === atCoderUserId
  );

  const items = problems.map((p) => ({
    contestId: p.contestId,
    title: p.title,
    ...p.item,
  }));

  return (
    <Table striped>
      <thead>
        <tr>
          <th>#</th>
          <th>Participant</th>
          {showProblems
            ? items.sort(compareProblem).map((p, i) => {
                return (
                  <th key={i}>
                    {`${i + 1}. `}
                    {p.contestId && p.title ? (
                      <ProblemLink
                        problemId={p.id}
                        contestId={p.contestId}
                        problemTitle={p.title}
                      />
                    ) : (
                      p.id
                    )}
                    {p.point !== null ? ` (${p.point})` : null}
                  </th>
                );
              })
            : null}
          <th style={{ textAlign: "center" }}>Score</th>
          {showEstimatedPerformances ? (
            <th style={{ textAlign: "center" }}>Estimated Performance</th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {pinMe && loginUserIndex >= 0 ? (
          <ContestTableRow
            userId={atCoderUserId}
            rank={loginUserIndex}
            items={items}
            showProblems={showProblems}
            start={start}
            estimatedPerformance={getPerformanceByUserId(atCoderUserId)}
            reducedProblemResults={
              resultsByUser.get(atCoderUserId) ??
              new Map<ProblemId, ReducedProblemResult>()
            }
            userTotalResult={totalResultByUser.get(atCoderUserId)}
          />
        ) : null}
        {showingUserIds.map((userId, i) => {
          return (
            <ContestTableRow
              key={userId}
              userId={userId}
              rank={i}
              items={items}
              showProblems={showProblems}
              start={start}
              estimatedPerformance={getPerformanceByUserId(userId)}
              reducedProblemResults={
                resultsByUser.get(userId) ??
                new Map<ProblemId, ReducedProblemResult>()
              }
              userTotalResult={totalResultByUser.get(userId)}
            />
          );
        })}
      </tbody>
    </Table>
  );
};

export const ContestTable = connect<OuterProps, InnerProps>((props) => ({
  submissions: {
    comparison: null,
    value: (): Promise<Submission[]> =>
      fetchVirtualContestSubmission(
        props.users,
        props.problems.map((p) => p.item.id),
        props.start,
        props.end
      ).then((submissions) => submissions.toArray()),
    refreshInterval: props.enableAutoRefresh ? 60_000 : 1_000_000_000,
    force: props.enableAutoRefresh,
  },
  problemMap: {
    comparison: null,
    value: () => cachedMergedProblemMap().then((map) => convertMap(map)),
  },
  problemModels: {
    comparison: null,
    value: () => cachedProblemModels().then((map) => convertMap(map)),
  },
}))(InnerContestTable);
