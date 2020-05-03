import { Table } from "reactstrap";
import ProblemLink from "../../../../components/ProblemLink";
import ScoreCell from "./ScoreCell";
import { getRatingColorClass, isAccepted } from "../../../../utils";
import React from "react";
import { VirtualContestItem, VirtualContestMode } from "../../types";
import {
  BestSubmissionEntry,
  calcPerformance,
  calcTotalResult,
  extractBestSubmissions,
  getSortedUserIds,
  hasBetterSubmission
} from "./util";
import { connect, PromiseState } from "react-refetch";
import { List, Map as ImmutableMap } from "immutable";
import { ProblemId } from "../../../../interfaces/Status";
import ProblemModel from "../../../../interfaces/ProblemModel";
import Submission from "../../../../interfaces/Submission";
import {
  cachedProblemModels,
  fetchVirtualContestSubmission
} from "../../../../utils/CachedApiClient";

function getEstimatedPerformances(
  participants: string[],
  bestSubmissions: BestSubmissionEntry[],
  start: number,
  problems: VirtualContestItem[],
  modelMap: ImmutableMap<ProblemId, ProblemModel>
) {
  return participants.map(userId => {
    const onlySolvedData = bestSubmissions
      .filter(b => b.userId === userId)
      .filter(b => {
        const result = b.bestSubmissionInfo?.bestSubmission.result;
        return result && isAccepted(result);
      })
      .map(b =>
        b.bestSubmissionInfo
          ? {
              time: b.bestSubmissionInfo.bestSubmission.epoch_second,
              id: b.problemId
            }
          : undefined
      )
      .filter((obj): obj is { time: number; id: string } => obj !== undefined)
      .sort((a, b) => a.time - b.time)
      .reduce(
        ({ prev, list }, entry) => ({
          list: list.push({
            problemId: entry.id,
            solved: true,
            time: entry.time - prev
          }),
          prev: entry.time
        }),
        {
          list: List<{ problemId: string; time: number; solved: boolean }>(),
          prev: start
        }
      ).list;
    const solvedData = problems.map(p => {
      const problemId = p.id;
      const entry = onlySolvedData.find(e => e.problemId === problemId);
      return entry ? entry : { problemId: p.id, time: 0, solved: false };
    });
    const performance = calcPerformance(solvedData, modelMap);
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
  readonly mode: VirtualContestMode;
  readonly users: string[];
  readonly start: number;
  readonly end: number;
  readonly enableAutoRefresh: boolean;
}

interface InnerProps extends OuterProps {
  submissions: PromiseState<Submission[]>;
  problemModels: PromiseState<ImmutableMap<ProblemId, ProblemModel>>;
}

const EstimatedPerformance = (props: {
  estimatedPerformance: number | undefined;
}) => {
  if (!props.estimatedPerformance) {
    return null;
  }
  return (
    <p
      className={getRatingColorClass(props.estimatedPerformance)}
      style={{ textAlign: "center", fontWeight: "bold" }}
    >
      {props.estimatedPerformance}
    </p>
  );
};

const InnerContestTable = (props: InnerProps) => {
  const { showProblems, problems, mode, users, start } = props;
  const problemModels = props.problemModels.fulfilled
    ? props.problemModels.value
    : ImmutableMap<ProblemId, ProblemModel>();
  const submissionMap = props.submissions.fulfilled
    ? props.submissions.value
        .filter(s => s.result !== "CE")
        .reduce((map, s) => {
          const list = map.get(s.problem_id) ?? ([] as Submission[]);
          list.push(s);
          map.set(s.problem_id, list);
          return map;
        }, new Map<ProblemId, Submission[]>())
    : new Map<ProblemId, Submission[]>();
  const problemIds = problems.map(p => p.item.id);

  const bestSubmissions = extractBestSubmissions(
    submissionMap,
    users,
    problemIds
  );
  const sortedUserIds = getSortedUserIds(
    users,
    problems.map(p => p.item),
    mode,
    bestSubmissions
  );
  const estimatedPerformances = props.enableEstimatedPerformances
    ? getEstimatedPerformances(
        users,
        bestSubmissions,
        start,
        problems.map(p => p.item),
        problemModels
      )
    : [];

  const items = problems.map(p => ({
    contestId: p.contestId,
    title: p.title,
    ...p.item
  }));

  const showEstimatedPerformances =
    mode !== "lockout" && estimatedPerformances.length > 0;
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
            problems.map(p => p.item),
            mode,
            bestSubmissions
          );
          return (
            <tr key={i}>
              <th>{i + 1}</th>
              <th>{userId}</th>
              {!showProblems
                ? null
                : items.sort(compareProblem).map(problem => {
                    const info = bestSubmissions.find(
                      e => e.userId === userId && e.problemId === problem.id
                    )?.bestSubmissionInfo;
                    if (!info) {
                      return (
                        <td key={problem.id} style={{ textAlign: "center" }}>
                          -
                        </td>
                      );
                    }
                    const best = info.bestSubmission;
                    if (
                      mode === "lockout" &&
                      hasBetterSubmission(
                        problem.id,
                        userId,
                        best,
                        bestSubmissions
                      )
                    ) {
                      return (
                        <td key={problem.id} style={{ textAlign: "center" }}>
                          -
                        </td>
                      );
                    }
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
                      estimatedPerformances.find(e => e.userId === userId)
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

function compareProblem<T extends { id: string; order: number | null }>(
  a: T,
  b: T
) {
  if (a.order !== null && b.order !== null) {
    return a.order - b.order;
  }
  return a.id.localeCompare(b.id);
}

export const ContestTable = connect<OuterProps, InnerProps>(props => ({
  submissions: {
    comparison: null,
    value: () =>
      fetchVirtualContestSubmission(
        props.users,
        props.problems.map(p => p.item.id),
        props.start,
        props.end
      ),
    refreshInterval: props.enableAutoRefresh ? 60_000 : 1_000_000_000,
    force: props.enableAutoRefresh
  },
  problemModels: {
    comparison: null,
    value: () => cachedProblemModels()
  }
}))(InnerContestTable);
