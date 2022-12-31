import { Button, Col, Row, Table } from "reactstrap";
import React from "react";
import { GoTrashcan } from "react-icons/go";
import { useProblems } from "../../../api/APIClient";
import { ProblemSearchBox } from "../../../components/ProblemSearchBox";
import { ProblemLink } from "../../../components/ProblemLink";
import { formatMomentDateTime, parseSecond } from "../../../utils/DateUtil";
import { useProgressResetList } from "../../../api/InternalAPIClient";
import { addResetProgress, deleteResetProgress } from "./ApiClient";

export const ResetProgress: React.FC = () => {
  const progressResetListFetch = useProgressResetList();
  const progressResetList = progressResetListFetch.data?.items || [];
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
            selectProblem={async (problem) => {
              await addResetProgress(problem.id);
              await progressResetListFetch.mutate();
            }}
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
                          problemIndex={problem.problem_index}
                          problemName={problem.name}
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
                        // eslint-disable-next-line @typescript-eslint/no-misused-promises
                        onClick={async () => {
                          await deleteResetProgress(item.problem_id);
                          await progressResetListFetch.mutate();
                        }}
                      >
                        <GoTrashcan />
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
