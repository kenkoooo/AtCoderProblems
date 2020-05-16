import React from "react";
import { connect, PromiseState } from "react-refetch";
import Submission from "../../../../../interfaces/Submission";
import { VirtualContestItem } from "../../../types";
import { isAccepted } from "../../../../../utils";
import { ProblemId } from "../../../../../interfaces/Status";
import { Table, Row, Col, Card, CardHeader, CardBody } from "reactstrap";
import { fetchVirtualContestSubmission } from "../../../../../utils/CachedApiClient";
import ProblemLink from "../../../../../components/ProblemLink";

const CARD_COLORS = ["success", "danger", "warning", "info", "primary"];

interface LockoutStatus {
  userId: string;
  point: number;
  epochSecond: number;
  color: string;
}

interface OuterProps {
  readonly showProblems: boolean;
  readonly participants: string[];
  readonly start: number;
  readonly end: number;
  readonly enableAutoRefresh: boolean;
  readonly problems: {
    item: VirtualContestItem;
    title?: string;
    contestId?: string;
  }[];
}

interface InnerProps extends OuterProps {
  submissions: PromiseState<Submission[]>;
}

const InnerLockoutContestTable: React.FC<InnerProps> = props => {
  const submissions = props.submissions.fulfilled
    ? props.submissions.value
    : [];
  submissions.sort((a, b) => a.id - b.id);

  const colorMap = new Map<string, string>();
  for (let i = 0; i < props.participants.length; i++) {
    const color = CARD_COLORS[i % CARD_COLORS.length];
    colorMap.set(props.participants[i], color);
  }

  const statusMap = new Map<ProblemId, LockoutStatus>();
  const pointMap = new Map<string, number>();
  submissions
    .filter(s => isAccepted(s.result))
    .forEach(s => {
      if (!statusMap.has(s.problem_id)) {
        const point =
          props.problems.find(p => p.item.id === s.problem_id)?.item?.point ??
          s.point;
        const userId = s.user_id;
        const epochSecond = s.epoch_second;
        const color = colorMap.get(userId) ?? CARD_COLORS[0];
        statusMap.set(s.problem_id, { point, userId, epochSecond, color });
        pointMap.set(userId, (pointMap.get(userId) ?? 0) + point);
      }
    });

  const width = Math.min(5, Math.ceil(Math.sqrt(props.problems.length)));
  const table = [];
  for (let i = 0; i < props.problems.length; i += width) {
    const row = [];
    for (let j = i; j < width + i; j++) {
      if (props.problems.length <= j) {
        row.push({
          problem: undefined,
          status: undefined
        });
      } else {
        const problem = props.problems[j];
        const status = statusMap.get(problem.item.id);
        row.push({ problem, status });
      }
    }
    table.push(row);
  }

  const ranking = props.participants.map(userId => ({
    userId,
    point: pointMap.get(userId) ?? 0
  }));
  ranking.sort((a, b) => b.point - a.point);

  return (
    <>
      <Table>
        <thead>
          <tr>
            <th>User</th>
            <th>Pt</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map(({ userId, point }) => (
            <tr key={userId}>
              <td>{userId}</td>
              <td>{point}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {table.map((row, i) => (
        <Row key={i}>
          {row.map(({ problem, status }, j) => (
            <Col key={j}>
              {problem ? (
                <Card
                  inverse={!!status}
                  color={status ? status.color : undefined}
                >
                  <CardHeader tag="h3">
                    {problem.title && problem.contestId ? (
                      <ProblemLink
                        problemId={problem.item.id}
                        contestId={problem.contestId}
                        problemTitle={problem.title}
                        className={status ? "text-white" : "text-link"}
                      />
                    ) : (
                      problem.title
                    )}
                  </CardHeader>
                  <CardBody className="text-center">
                    {status ? (
                      <h3>
                        <p>{status.userId}</p>
                        <p>+ {status.point} pt</p>
                      </h3>
                    ) : (
                      <h3>
                        {problem.item.point ? `${problem.item.point} pt` : null}
                      </h3>
                    )}
                  </CardBody>
                </Card>
              ) : null}
            </Col>
          ))}
        </Row>
      ))}
    </>
  );
};

export const LockoutContestTable = connect<OuterProps, InnerProps>(props => ({
  submissions: {
    comparison: null,
    value: () =>
      fetchVirtualContestSubmission(
        props.participants,
        props.problems.map(p => p.item.id),
        props.start,
        props.end
      ),
    refreshInterval: props.enableAutoRefresh ? 60_000 : 1_000_000_000,
    force: props.enableAutoRefresh
  }
}))(InnerLockoutContestTable);
