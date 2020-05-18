import random from "random";
import seedrandom from "seedrandom";
import { Table } from "reactstrap";
import ProblemLink from "../../../../components/ProblemLink";
import ScoreCell from "./ScoreCell";
import {
  clipDifficulty,
  getRatingColorClass,
  isAccepted,
} from "../../../../utils";
import React from "react";
import { VirtualContestItem } from "../../types";
import { BestSubmissionEntry, extractBestSubmissions } from "./util";
import { connect, PromiseState } from "react-refetch";
import { List, Map as ImmutableMap } from "immutable";
import { ProblemId } from "../../../../interfaces/Status";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel,
  ProblemModelWithDifficultyModel,
  ProblemModelWithTimeModel,
} from "../../../../interfaces/ProblemModel";
import Submission from "../../../../interfaces/Submission";
import {
  cachedProblemModels,
  fetchVirtualContestSubmission,
} from "../../../../utils/CachedApiClient";
import { calculatePerformances } from "../../../../utils/RatingSystem";
import { predictSolveProbability } from "../../../../utils/ProblemModelUtil";

const calcTotalResult = (
  userId: string,
  problems: VirtualContestItem[],
  bestSubmissions: BestSubmissionEntry[]
): {
  trialsBeforeBest: number;
  lastBestSubmissionTime: number;
  point: number;
} => {
  return problems.reduce(
    (state, item) => {
      const problemId = item.id;
      const point = item.point;

      const info = bestSubmissions.find(
        (s) => s.userId === userId && s.problemId === problemId
      )?.bestSubmissionInfo;
      if (!info || info.bestSubmission.point === 0) {
        return state;
      }

      const best = info.bestSubmission;
      if (point !== null && !isAccepted(best.result)) {
        return state;
      }

      return {
        trialsBeforeBest: state.trialsBeforeBest + info.trialsBeforeBest,
        lastBestSubmissionTime: Math.max(
          state.lastBestSubmissionTime,
          best.epoch_second
        ),
        point: state.point + (point ? point : best.point),
      };
    },
    {
      trialsBeforeBest: 0,
      lastBestSubmissionTime: 0,
      point: 0,
    }
  );
};
const getSortedUserIds = (
  users: string[],
  problems: VirtualContestItem[],
  bestSubmissions: BestSubmissionEntry[]
): string[] => {
  return users
    .map((userId) => {
      const result = calcTotalResult(userId, problems, bestSubmissions);
      return { userId, ...result };
    })
    .sort((a, b) => {
      if (a.point === b.point) {
        if (a.lastBestSubmissionTime === b.lastBestSubmissionTime) {
          return a.trialsBeforeBest - b.trialsBeforeBest;
        }
        return a.lastBestSubmissionTime - b.lastBestSubmissionTime;
      }
      return b.point - a.point;
    })
    .map((e) => e.userId);
};

function getEstimatedPerformances(
  participants: string[],
  bestSubmissions: BestSubmissionEntry[],
  start: number,
  end: number,
  problems: VirtualContestItem[],
  modelMap: ImmutableMap<ProblemId, ProblemModel>
): {
  performance: number;
  userId: string;
}[] {
  random.use(seedrandom("atcoder-problems"));

  const keyedProblems: Map<string, VirtualContestItem> = new Map();
  const validatedModelMap: Map<
    ProblemId,
    ProblemModelWithDifficultyModel & ProblemModelWithTimeModel
  > = new Map();
  for (const problem of problems) {
    keyedProblems.set(problem.id, problem);
    const model = modelMap.get(problem.id);
    if (!isProblemModelWithDifficultyModel(model)) {
      return [];
    }
    if (!isProblemModelWithTimeModel(model)) {
      return [];
    }
    validatedModelMap.set(problem.id, model);
  }

  const bootstrapRatings: number[] = [];
  const bootstrapResults: { score: number; penalty: number }[] = [];
  for (
    let bootstrapRating = -1025;
    bootstrapRating <= 4025;
    bootstrapRating += 50
  ) {
    bootstrapRatings.push(bootstrapRating);

    // generating bootstrap result assuming that participants solve problems in the listed order.
    // potentially better to reorder it to maximize these performances.
    let score = 0;
    let penalty = 0;
    let remainingTime = end - start;
    for (const problem of problems) {
      const problemModel = validatedModelMap.get(problem.id)!;
      const solveProbability =
        problemModel.rawDifficulty > -10000
          ? predictSolveProbability(problemModel, bootstrapRating)
          : 1;
      if (random.float() >= solveProbability) {
        continue;
      }
      const logTimeMean =
        problemModel.slope * bootstrapRating + problemModel.intercept;
      const solveTime = random.logNormal(
        logTimeMean,
        Math.sqrt(problemModel.variance)
      )();
      if (solveTime > remainingTime) {
        break;
      }
      score += problem.point ? problem.point : 1;
      penalty += solveTime;
      remainingTime -= solveTime;
    }
    console.log(bootstrapRating, score, penalty);
    bootstrapResults.push({ score, penalty });
  }
  const performances = calculatePerformances(bootstrapRatings);

  return participants.map((userId) => {
    const solvedSubmissions = bestSubmissions
      .filter((b) => b.userId === userId)
      .filter((b) => {
        const result = b.bestSubmissionInfo?.bestSubmission.result;
        return result && isAccepted(result);
      })
      .map((b) =>
        b.bestSubmissionInfo
          ? {
              time: b.bestSubmissionInfo.bestSubmission.epoch_second - start,
              id: b.problemId,
            }
          : undefined
      )
      .filter((obj): obj is { time: number; id: string } => obj !== undefined)
      .sort((a, b) => a.time - b.time);
    const score = solvedSubmissions
      .map((submission) => {
        const point = keyedProblems.get(submission.id)?.point;
        return point ? point : 1;
      })
      .reduce((accum, point) => {
        return accum + point;
      }, 0);
    const penalty = solvedSubmissions.reduce((accum, submission) => {
      return Math.max(accum, submission.time);
    }, 0);
    const position = bootstrapResults
      .map((result) => {
        if (score > result.score) {
          return 0;
        } else if (score === result.score && penalty < result.penalty) {
          return 0;
        } else {
          return 1;
        }
      })
      .reduce((accum: number, lose) => {
        return accum + lose;
      }, 0);

    let performance;
    if (position === 0) {
      performance = performances[0];
    } else if (position === performances.length) {
      performance = performances[performances.length - 1];
    } else {
      performance = (performances[position - 1] + performances[position]) / 2;
    }
    return { performance, userId };
  });
}

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
}

interface InnerProps extends OuterProps {
  submissions: PromiseState<Submission[]>;
  problemModels: PromiseState<ImmutableMap<ProblemId, ProblemModel>>;
}

const EstimatedPerformance: React.FC<{
  estimatedPerformance: number | undefined;
}> = (props) => {
  if (props.estimatedPerformance === undefined) {
    return null;
  }
  return (
    <p
      className={getRatingColorClass(props.estimatedPerformance)}
      style={{ textAlign: "center", fontWeight: "bold" }}
    >
      {clipDifficulty(props.estimatedPerformance)}
    </p>
  );
};

function compareProblem<T extends { id: string; order: number | null }>(
  a: T,
  b: T
): number {
  if (a.order !== null && b.order !== null) {
    return a.order - b.order;
  }
  return a.id.localeCompare(b.id);
}

const InnerContestTable: React.FC<InnerProps> = (props) => {
  const { showProblems, problems, users, start, end } = props;
  const problemModels = props.problemModels.fulfilled
    ? props.problemModels.value
    : ImmutableMap<ProblemId, ProblemModel>();
  const submissionMap = props.submissions.fulfilled
    ? props.submissions.value
        .filter((s) => s.result !== "CE")
        .reduce((map, s) => {
          const list = map.get(s.problem_id) ?? ([] as Submission[]);
          list.push(s);
          map.set(s.problem_id, list);
          return map;
        }, new Map<ProblemId, Submission[]>())
    : new Map<ProblemId, Submission[]>();
  const problemIds = problems.map((p) => p.item.id);

  const bestSubmissions = extractBestSubmissions(
    submissionMap,
    users,
    problemIds
  );
  const sortedUserIds = getSortedUserIds(
    users,
    problems.map((p) => p.item),
    bestSubmissions
  );
  const estimatedPerformances = props.enableEstimatedPerformances
    ? getEstimatedPerformances(
        users,
        bestSubmissions,
        start,
        end,
        problems.map((p) => p.item),
        problemModels
      )
    : [];

  const items = problems.map((p) => ({
    contestId: p.contestId,
    title: p.title,
    ...p.item,
  }));

  const showEstimatedPerformances = estimatedPerformances.length > 0;
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
        {sortedUserIds.map((userId, i) => {
          const totalResult = calcTotalResult(
            userId,
            problems.map((p) => p.item),

            bestSubmissions
          );
          return (
            <tr key={i}>
              <th>{i + 1}</th>
              <th>{userId}</th>
              {!showProblems
                ? null
                : items.sort(compareProblem).map((problem) => {
                    const info = bestSubmissions.find(
                      (e) => e.userId === userId && e.problemId === problem.id
                    )?.bestSubmissionInfo;
                    if (!info) {
                      return (
                        <td key={problem.id} style={{ textAlign: "center" }}>
                          -
                        </td>
                      );
                    }
                    const best = info.bestSubmission;
                    const trials =
                      info.trialsBeforeBest +
                      (isAccepted(info.bestSubmission.result) ? 0 : 1);
                    const point =
                      problem.point !== null
                        ? isAccepted(best.result)
                          ? problem.point
                          : 0
                        : best.point;
                    return (
                      <td key={problem.id}>
                        <ScoreCell
                          trials={trials}
                          maxPoint={point}
                          time={best.epoch_second - start}
                        />
                      </td>
                    );
                  })}
              <td>
                <ScoreCell
                  trials={totalResult.trialsBeforeBest}
                  maxPoint={totalResult.point}
                  time={totalResult.lastBestSubmissionTime - start}
                />
              </td>
              {showEstimatedPerformances ? (
                <td>
                  <EstimatedPerformance
                    estimatedPerformance={
                      estimatedPerformances.find((e) => e.userId === userId)
                        ?.performance
                    }
                  />
                </td>
              ) : null}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export const ContestTable = connect<OuterProps, InnerProps>((props) => ({
  submissions: {
    comparison: null,
    value: (): Promise<List<Submission>> =>
      fetchVirtualContestSubmission(
        props.users,
        props.problems.map((p) => p.item.id),
        props.start,
        props.end
      ),
    refreshInterval: props.enableAutoRefresh ? 60_000 : 1_000_000_000,
    force: props.enableAutoRefresh,
  },
  problemModels: {
    comparison: null,
    value: (): any => cachedProblemModels(),
  },
}))(InnerContestTable);
