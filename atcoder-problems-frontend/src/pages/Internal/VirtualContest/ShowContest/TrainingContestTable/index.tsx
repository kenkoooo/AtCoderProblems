import { Badge, Table } from "reactstrap";
import React from "react";
import { useVirtualContestSubmissions } from "../../../../../api/APIClient";
import { VirtualContestItem } from "../../../types";
import { UserId } from "../../../../../interfaces/Status";
import {
  calcUserTotalResult,
  compareTotalResult,
  UserTotalResult,
} from "../ResultCalcUtil";
import { getResultsByUserMap, compareProblem } from "../util";
import { UserNameLabel } from "../../../../../components/UserNameLabel";
import { SmallScoreCell } from "./SmallScoreCell";

interface Props {
  readonly showRating: boolean;
  readonly showProblems: boolean;
  readonly problems: {
    item: VirtualContestItem;
    title?: string;
    contestId?: string;
  }[];
  readonly users: string[];
  readonly start: number;
  readonly end: number;
  readonly enableAutoRefresh: boolean;
}

export const TrainingContestTable = (props: Props) => {
  const { showRating, showProblems, problems, users, start, end } = props;
  const submissions = useVirtualContestSubmissions(
    props.users,
    problems.map((p) => p.item.id),
    start,
    end,
    props.enableAutoRefresh ? 60_000 : 1_000_000_000
  );
  const resultsByUser = getResultsByUserMap(submissions ?? [], users, () => 1);

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

  const sortedItems = problems
    .map((p) => ({
      contestId: p.contestId,
      title: p.title,
      ...p.item,
    }))
    .sort(compareProblem);

  return (
    <Table striped>
      <thead>
        <tr className="text-center">
          <th>#</th>
          <th>Participant</th>
          <th>Score</th>
          <th>Progress</th>
        </tr>
      </thead>
      <tbody>
        {sortedUserIds.map((userId, i) => {
          const userResult = resultsByUser.get(userId);
          const totalProblemCount = sortedItems.length;
          const solvedProblemCount = Array.from(userResult ?? []).filter(
            ([, result]) => result.accepted
          ).length;
          return (
            <tr key={i}>
              <th className="text-center">{i + 1}</th>
              <th>
                <UserNameLabel userId={userId} showRating={showRating} />
              </th>
              <td className="text-center">
                <Badge>
                  {solvedProblemCount} / {totalProblemCount}
                </Badge>
              </td>
              <td
                style={{
                  lineHeight: 0,
                  minWidth: "15rem",
                  verticalAlign: "middle",
                }}
              >
                {!showProblems
                  ? null
                  : sortedItems.map((problem, index) => {
                      const result = userResult?.get(problem.id);
                      if (!result) {
                        return (
                          <SmallScoreCell
                            key={problem.id}
                            problem={problem}
                            id={`${userId}-${index}`}
                          />
                        );
                      }
                      const trials = result.accepted
                        ? result.penalties
                        : result.trials;
                      return (
                        <SmallScoreCell
                          key={problem.id}
                          problem={problem}
                          trials={trials}
                          maxPoint={result.point}
                          time={result.lastUpdatedEpochSecond - start}
                          id={`${userId}-${index}`}
                        />
                      );
                    })}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};
