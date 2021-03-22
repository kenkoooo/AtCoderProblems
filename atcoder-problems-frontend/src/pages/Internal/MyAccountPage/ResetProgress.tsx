import { Button, Col, Row, Table } from "reactstrap";
import React from "react";
import { connect, PromiseState } from "react-refetch";
import Octicon, { Trashcan } from "@primer/octicons-react";
import { useProblems } from "../../../api/APIClient";
import { ProblemSearchBox } from "../../../components/ProblemSearchBox";
import { ProgressResetList } from "../types";
import {
  PROGRESS_RESET_ADD,
  PROGRESS_RESET_DELETE,
  PROGRESS_RESET_LIST,
} from "../ApiUrl";
import { ProblemLink } from "../../../components/ProblemLink";
import {
  formatMomentDateTime,
  parseSecond,
  getCurrentUnixtimeInSecond,
} from "../../../utils/DateUtil";

interface Props {
  progressResetList: PromiseState<ProgressResetList | null>;
  addResetProgress: (problemId: string) => void;
  addResetProgressResponse: PromiseState<Record<string, unknown> | null>;
  deleteResetProgress: (problemId: string) => void;
  deleteResetProgressResponse: PromiseState<Record<string, unknown> | null>;
}

const InnerResetProgress: React.FC<Props> = (props) => {
  const progressResetList =
    props.progressResetList.fulfilled && props.progressResetList.value
      ? props.progressResetList.value.items
      : [];
  progressResetList.sort((a, b) => a.reset_epoch_second - b.reset_epoch_second);
  const problems = useProblems() ?? [];
  return (
    <>
      <Row className="my-2">
        <Col sm="12">
          <h2>Reset Progress</h2>
        </Col>
      </Row>
      <Row>
        <Col sm="12">
          <ProblemSearchBox
            problems={problems}
            selectProblem={(problm): void => props.addResetProgress(problm.id)}
          />
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          <Table>
            <thead>
              <tr>
                <th>Problem</th>
                <th>Reset at</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {progressResetList.map((item) => {
                const problem = problems.find((p) => p.id === item.problem_id);
                return (
                  <tr key={item.problem_id}>
                    <td>
                      {problem ? (
                        <ProblemLink
                          problemId={problem.id}
                          contestId={problem.contest_id}
                          problemTitle={problem.title}
                        />
                      ) : (
                        item.problem_id
                      )}
                    </td>
                    <td>
                      {formatMomentDateTime(
                        parseSecond(item.reset_epoch_second)
                      )}
                    </td>
                    <td>
                      <Button
                        color="danger"
                        onClick={(): void =>
                          props.deleteResetProgress(item.problem_id)
                        }
                      >
                        <Octicon icon={Trashcan} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Col>
      </Row>
    </>
  );
};

export const ResetProgress = connect<unknown, Props>(() => ({
  progressResetList: {
    url: PROGRESS_RESET_LIST,
  },
  addResetProgressResponse: { value: null },
  addResetProgress: (problemId: string) => ({
    addResetProgressResponse: {
      force: true,
      refreshing: true,
      url: PROGRESS_RESET_ADD,
      method: "POST",
      body: JSON.stringify({
        problem_id: problemId,
        reset_epoch_second: getCurrentUnixtimeInSecond(),
      }),
      andThen: () => ({
        progressResetList: {
          force: true,
          url: PROGRESS_RESET_LIST,
        },
      }),
    },
  }),
  deleteResetProgress: (problemId: string) => ({
    deleteResetProgressResponse: {
      force: true,
      refreshing: true,
      url: PROGRESS_RESET_DELETE,
      method: "POST",
      body: JSON.stringify({
        problem_id: problemId,
      }),
      andThen: () => ({
        progressResetList: {
          force: true,
          url: PROGRESS_RESET_LIST,
        },
      }),
    },
  }),
  deleteResetProgressResponse: { value: null },
}))(InnerResetProgress);
