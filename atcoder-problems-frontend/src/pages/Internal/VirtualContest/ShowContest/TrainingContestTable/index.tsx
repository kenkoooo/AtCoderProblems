import { Badge, Table } from "reactstrap";
import React from "react";
import { connect, PromiseState } from "react-refetch";
import { VirtualContestItem } from "../../../types";
import { UserId } from "../../../../../interfaces/Status";
import Submission from "../../../../../interfaces/Submission";
import { fetchVirtualContestSubmission } from "../../../../../utils/CachedApiClient";
import {
  calcUserTotalResult,
  compareTotalResult,
  UserTotalResult,
} from "../ResultCalcUtil";
import { getResultsByUserMap } from "../util";
import { compareProblem } from "../ContestTable";
import { UserNameLabel } from "../../../../../components/UserNameLabel";
import { SmallScoreCell } from "./SmallScoreCell";

interface OuterProps {
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

interface InnerProps extends OuterProps {
  submissions: PromiseState<Submission[]>;
}

const InnerContestTable: React.FC<InnerProps> = (props) => {
  const { showRating, showProblems, problems, users, start } = props;

  const resultsByUser = getResultsByUserMap(
    props.submissions.fulfilled ? props.submissions.value : [],
    users,
    () => 1
  );

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
          <th>Score</th>
          <th>Progress</th>
        </tr>
      </thead>
      <tbody>
        {sortedUserIds.map((userId, i) => {
          const userResult = resultsByUser.get(userId);
          const totalProblemCount = items.length;
          const solvedProblemCount = Array.from(userResult ?? []).filter(
            ([, result]) => result.accepted
          ).length;
          return (
            <tr key={i}>
              <th>{i + 1}</th>
              <th>
                <UserNameLabel userId={userId} hideRating={!showRating} />
              </th>
              <td>
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
                  : items.sort(compareProblem).map((problem, index) => {
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

export const TrainingContestTable = connect<OuterProps, InnerProps>(
  (props) => ({
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
  })
)(InnerContestTable);
