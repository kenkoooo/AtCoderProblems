import { List, Map } from "immutable";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import Submission from "../../interfaces/Submission";
import * as Url from "../../utils/Url";
import { Table, Row } from "reactstrap";
import React from "react";
import { ProblemId, ProblemStatus, StatusLabel } from "../../interfaces/State";
import { statusLabelToTableColor } from "./index";
import ProblemLink from "../../components/ProblemLink";

interface Props {
  contests: Map<string, Contest>;
  contestToProblems: Map<string, List<Problem>>;
  showSolved: boolean;
  submissions: Map<string, List<Submission>>;
  userId: string;
  rivals: List<string>;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  title: string;
  rendered: boolean;
}

const ContestTable: React.FC<Props> = (props: Props) => {
  if(props.rendered === false){
    return null;
  }

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
              .every(status => !!status && status.label === StatusLabel.Success)
        )
        .map(({ contest, problems }) => {
          return (
            <div key={contest.id}>
              <strong>
                <a target="_blank" href={Url.formatContestUrl(contest.id)}>
                  {contest.title}
                </a>
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
}

export default React.memo(ContestTable);
