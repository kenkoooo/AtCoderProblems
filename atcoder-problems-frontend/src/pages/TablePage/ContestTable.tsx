import { List, Map } from "immutable";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import Submission from "../../interfaces/Submission";
import * as Url from "../../utils/Url";
import { Table } from "reactstrap";
import React from "react";
import { StatusLabel } from "./index";

interface Props {
  contests: Map<string, Contest>;
  contestToProblems: Map<string, List<Problem>>;
  showSolved: boolean;
  submissions: Map<string, List<Submission>>;
  userId: string;
  rivals: List<string>;
  problemLabels: Map<string, StatusLabel>;
}

const ContestTable = (props: Props) => (
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
            .map(p => props.problemLabels.get(p.id, ""))
            .every(color => color === "success")
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
                  {problems.map(p => (
                    <td
                      key={p.id}
                      className={"table-" + props.problemLabels.get(p.id, "")}
                    >
                      <a
                        target="_blank"
                        href={Url.formatProblemUrl(p.id, p.contest_id)}
                      >
                        {p.title}
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </Table>
          </div>
        );
      })
      .toArray()}
  </div>
);

export default ContestTable;
