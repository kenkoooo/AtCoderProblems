import { Table } from "reactstrap";
import React from "react";
import { connect, PromiseState } from "react-refetch";
import { VirtualContestItem } from "../../../types";
import { isAccepted } from "../../../../../utils";
import { ProblemId } from "../../../../../interfaces/Status";
import ProblemModel from "../../../../../interfaces/ProblemModel";
import Submission from "../../../../../interfaces/Submission";
import {
  cachedProblemModels,
  fetchVirtualContestSubmission,
} from "../../../../../utils/CachedApiClient";
import { extractBestSubmissions, BestSubmissionEntry } from "../util";
import { compareProblem } from "../ContestTable";
import { convertMap } from "../../../../../utils/ImmutableMigration";
import SmallScoreCell from "./SmallScoreCell";

const calcTotalResult = (
  userId: string,
  problems: VirtualContestItem[],
  bestSubmissions: BestSubmissionEntry[]
): {
  trialsBeforeBest: number;
  lastBestSubmissionTime: number;
  point: number;
  solveCount: number;
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

      const additionalPoint = point ? point : best.point;
      return {
        trialsBeforeBest: state.trialsBeforeBest + info.trialsBeforeBest,
        lastBestSubmissionTime: Math.max(
          state.lastBestSubmissionTime,
          best.epoch_second
        ),
        point: state.point + additionalPoint,
        solveCount: state.solveCount + (additionalPoint > 0 ? 1 : 0),
      };
    },
    {
      trialsBeforeBest: 0,
      lastBestSubmissionTime: 0,
      point: 0,
      solveCount: 0,
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
      if (a.solveCount === b.solveCount) {
        return a.lastBestSubmissionTime - b.lastBestSubmissionTime;
      }
      return b.solveCount - a.solveCount;
    })
    .map((e) => e.userId);
};

interface OuterProps {
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
  problemModels: PromiseState<Map<ProblemId, ProblemModel>>;
}

const InnerContestTable: React.FC<InnerProps> = (props) => {
  const { showProblems, problems, users, start } = props;
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
          <th>Progress</th>
        </tr>
      </thead>
      <tbody>
        {sortedUserIds.map((userId, i) => {
          return (
            <tr key={i}>
              <th>{i + 1}</th>
              <th>{userId}</th>
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
                      const info = bestSubmissions.find(
                        (e) => e.userId === userId && e.problemId === problem.id
                      )?.bestSubmissionInfo;
                      if (!info) {
                        return (
                          <SmallScoreCell
                            key={problem.id}
                            problem={problem}
                            id={`${userId}-${index}`}
                          />
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
                        <SmallScoreCell
                          key={problem.id}
                          problem={problem}
                          trials={trials}
                          maxPoint={point}
                          time={best.epoch_second - start}
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
    problemModels: {
      comparison: null,
      value: () => cachedProblemModels().then((map) => convertMap(map)),
    },
  })
)(InnerContestTable);
