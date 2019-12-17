import { List, Map } from "immutable";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import Submission from "../../interfaces/Submission";
import { Table, Row } from "reactstrap";
import React from "react";
import { ProblemId, ProblemStatus, StatusLabel } from "../../interfaces/Status";
import { statusLabelToTableColor } from "./index";
import ProblemLink from "../../components/ProblemLink";
import ContestLink from "../../components/ContestLink";
import ProblemModel from "../../interfaces/ProblemModel";

interface Props {
  contests: Map<string, Contest>;
  contestToProblems: Map<string, List<Problem>>;
  showSolved: boolean;
  showDifficulty: boolean;
  problemModels: Map<ProblemId, ProblemModel>;
  submissions: Map<string, List<Submission>>;
  userId: string;
  rivals: List<string>;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  title: string;
}

const ContestTable: React.FC<Props> = (props: Props) => {
  return (
    <>
      <Row className="my-4">
        <h2>{props.title}</h2>
      </Row>
      <div>
        {props.contests
          .valueSeq()
          .sort((a, b) => b.start_epoch_second - a.start_epoch_second)
          .map(contest => ({
            contest,
            problems: props.contestToProblems
              .get(contest.id, List<Problem>())
              .sort((a, b) => a.title.localeCompare(b.title))
          }))
          .filter(
            ({ contest, problems }) =>
              props.showSolved ||
              !problems
                .map(p => props.statusLabelMap.get(p.id))
                .every(
                  status => !!status && status.label === StatusLabel.Success
                )
          )
          .map(({ contest, problems }) => {
            return (
              <div key={contest.id}>
                <strong>
                  <ContestLink contest={contest} />
                </strong>
                <Table striped bordered hover responsive>
                  <tbody>
                    <tr>
                      {problems.map(p => {
                        const status = props.statusLabelMap.get(p.id);
                        const color = status
                          ? statusLabelToTableColor(status.label)
                          : "";
                        return (
                          <td key={p.id} className={color}>
                            <ProblemLink
                              difficulty={props.problemModels.getIn(
                                [p.id, "difficulty"],
                                null
                              )}
                              isExperimentalDifficulty={props.problemModels.getIn(
                                [p.id, "is_experimental"],
                                false
                              )}
                              showDifficulty={props.showDifficulty}
                              problemId={p.id}
                              problemTitle={p.title}
                              contestId={p.contest_id}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </Table>
              </div>
            );
          })
          .toArray()}
      </div>
    </>
  );
};

export default React.memo(ContestTable);
