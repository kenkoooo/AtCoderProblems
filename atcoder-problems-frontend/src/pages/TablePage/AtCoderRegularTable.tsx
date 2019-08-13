import { List, Map } from "immutable";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import { Row } from "reactstrap";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import * as Url from "../../utils/Url";
import React from "react";
import { StatusLabel } from "./index";

interface Props {
  contests: Map<string, Contest>;
  contestToProblems: Map<string, List<Problem>>;
  showSolved: boolean;
  title: string;
  problemLabels: Map<string, StatusLabel>;
}

export const AtCoderRegularTable = (props: Props) => {
  const { contestToProblems, showSolved, problemLabels } = props;
  const solvedAll = (contest: Contest) => {
    return contestToProblems
      .get(contest.id, List<Problem>())
      .every(p => problemLabels.get(p.id, "") === "success");
  };
  const ithProblem = (contest: Contest, i: number) =>
    contestToProblems
      .get(contest.id, List<Problem>())
      .sort((a, b) => a.title.localeCompare(b.title))
      .get(i);
  const contests = props.contests
    .valueSeq()
    .filter(contest => showSolved || !solvedAll(contest))
    .sort((a, b) => b.start_epoch_second - a.start_epoch_second)
    .toArray();
  const maxProblemCount = contests.reduce(
    (currentCount, contest) =>
      Math.max(
        contestToProblems.get(contest.id, List<string>()).size,
        currentCount
      ),
    0
  );
  const header = ["A", "B", "C", "D", "E", "F", "F2"].slice(0, maxProblemCount);
  return (
    <Row className="my-4">
      <h2>{props.title}</h2>
      <BootstrapTable data={contests}>
        <TableHeaderColumn
          isKey
          dataField="id"
          columnClassName={(_: any, contest: Contest) =>
            contestToProblems
              .get(contest.id, List<Problem>())
              .every(p => problemLabels.get(p.id) === "success")
              ? "table-success"
              : ""
          }
          dataFormat={(_: any, contest: Contest) => (
            <a href={Url.formatContestUrl(contest.id)} target="_blank">
              {contest.id.toUpperCase()}
            </a>
          )}
        >
          Contest
        </TableHeaderColumn>
        {header.map((c, i) => (
          <TableHeaderColumn
            dataField={c}
            key={c}
            columnClassName={(_: any, contest: Contest) => {
              const problem = ithProblem(contest, i);
              return problem
                ? "table-" + problemLabels.get(problem.id, "")
                : "";
            }}
            dataFormat={(_: any, contest: Contest) => {
              const problem = ithProblem(contest, i);
              return problem ? (
                <a
                  href={Url.formatProblemUrl(problem.id, contest.id)}
                  target="_blank"
                >
                  {problem.title}
                </a>
              ) : (
                ""
              );
            }}
          >
            {c}
          </TableHeaderColumn>
        ))}
      </BootstrapTable>
    </Row>
  );
};
