import { Button, Col, Row, Table } from "reactstrap";
import { ProblemSearchBox } from "../../../components/ProblemSearchBox";
import React from "react";
import { connect, PromiseState } from "react-refetch";
import { ProgressResetList } from "../types";
import Problem from "../../../interfaces/Problem";
import {
  PROGRESS_RESET_ADD,
  PROGRESS_RESET_DELETE,
  PROGRESS_RESET_LIST
} from "../ApiUrl";
import { cachedProblemMap } from "../../../utils/CachedApiClient";
import ProblemLink from "../../../components/ProblemLink";
import Octicon, { Trashcan } from "@primer/octicons-react";
import { formatMomentDateTime, parseSecond } from "../../../utils/DateUtil";

interface Props {
  progressResetList: PromiseState<ProgressResetList | null>;
  addResetProgress: (problemId: string) => void;
  addResetProgressResponse: PromiseState<{} | null>;
  deleteResetProgress: (problemId: string) => void;
  deleteResetProgressResponse: PromiseState<{} | null>;

  problems: PromiseState<Problem[]>;
}

const InnerResetProgress: React.FC<Props> = props => {
  const progressResetList =
    props.progressResetList.fulfilled && props.progressResetList.value
      ? props.progressResetList.value.items
      : [];
  progressResetList.sort((a, b) => a.reset_epoch_second - b.reset_epoch_second);
  const problems = props.problems.fulfilled ? props.problems.value : [];
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
              {progressResetList.map(item => {
                const problem = problems.find(p => p.id === item.problem_id);
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

export const ResetProgress = connect<{}, Props>(() => ({
  progressResetList: {
    url: PROGRESS_RESET_LIST
  },
  problems: {
    comparison: null,
    value: (): Promise<Problem[]> =>
      cachedProblemMap().then(map => map.valueSeq().toArray())
  },
  addResetProgressResponse: { value: null },
  addResetProgress: (problemId: string): any => ({
    addResetProgressResponse: {
      force: true,
      refreshing: true,
      url: PROGRESS_RESET_ADD,
      method: "POST",
      body: JSON.stringify({
        problem_id: problemId,
        reset_epoch_second: Math.floor(new Date().getTime() / 1000)
      }),
      andThen: (): any => ({
        progressResetList: {
          force: true,
          url: PROGRESS_RESET_LIST
        }
      })
    }
  }),
  deleteResetProgress: (problemId: string): any => ({
    deleteResetProgressResponse: {
      force: true,
      refreshing: true,
      url: PROGRESS_RESET_DELETE,
      method: "POST",
      body: JSON.stringify({
        problem_id: problemId
      }),
      andThen: (): any => ({
        progressResetList: {
          force: true,
          url: PROGRESS_RESET_LIST
        }
      })
    }
  }),
  deleteResetProgressResponse: { value: null }
}))(InnerResetProgress);
