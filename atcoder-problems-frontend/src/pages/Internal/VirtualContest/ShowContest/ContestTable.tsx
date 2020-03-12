import { Table } from "reactstrap";
import ProblemLink from "../../../../components/ProblemLink";
import ScoreCell from "./ScoreCell";
import { getRatingColorClass, isAccepted } from "../../../../utils";
import React from "react";
import { VirtualContestItem, VirtualContestMode } from "../../types";
import {
  BestSubmissionEntry,
  calcTotalResult,
  getSortedUserIds,
  hasBetterSubmission
} from "./util";

interface Props {
  readonly showProblems: boolean;
  readonly problems: {
    item: VirtualContestItem;
    title?: string;
    contestId?: string;
  }[];
  readonly mode: VirtualContestMode;
  readonly bestSubmissions: BestSubmissionEntry[];
  readonly users: string[];
  readonly estimatedPerformances: { performance: number; userId: string }[];
  readonly start: number;
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

export default ({
  showProblems,
  problems,
  mode,
  users,
  bestSubmissions,
  estimatedPerformances,
  start
}: Props) => {
  const sortedUserIds = getSortedUserIds(
    users,
    problems.map(p => p.item),
    mode,
    bestSubmissions
  );

  const items = problems.map(p => ({
    contestId: p.contestId,
    title: p.title,
    ...p.item
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
          {mode !== "lockout" ? (
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
              {mode === "lockout" ? null : (
                <td>
                  <EstimatedPerformance
                    estimatedPerformance={
                      estimatedPerformances.find(e => e.userId === userId)
                        ?.performance
                    }
                  />
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};
export function compareProblem<T extends { id: string; order: number | null }>(
  a: T,
  b: T
) {
  if (a.order !== null && b.order !== null) {
    return a.order - b.order;
  }
  return a.id.localeCompare(b.id);
}
