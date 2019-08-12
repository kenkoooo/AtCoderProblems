import React from "react";

import { isAccepted } from "../../utils";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import * as Url from "../../utils/Url";
import Submission from "../../interfaces/Submission";
import Problem from "../../interfaces/Problem";
import { List, Map } from "immutable";
import Contest from "../../interfaces/Contest";

const TOP_PERFORMANCES = 50;
const RECOMMEND_NUM = 10;

interface Props {
  readonly userSubmissions: List<Submission>;
  readonly problems: List<Problem>;
  readonly contests: Map<string, Contest>;
  readonly performances: Map<string, number>;
}

const Recommendations = (props: Props) => {
  const { userSubmissions, problems, performances, contests } = props;
  if (userSubmissions.isEmpty()) {
    return null;
  }

  const acProblemIdSet = userSubmissions
    .filter(s => isAccepted(s.result))
    .map(s => s.problem_id)
    .toSet();

  const acProblemPerf = acProblemIdSet
    .valueSeq()
    .map(id => performances.get(id))
    .filter((perf: number | undefined): perf is number => perf !== undefined)
    .sort((a, b) => b - a)
    .toList();

  const topLastIndex =
    Math.min(Math.ceil(acProblemPerf.size / 5.0), TOP_PERFORMANCES) - 1;
  const predictedPerf = acProblemPerf.get(topLastIndex, 0);

  const recommendedProblems = problems
    .filter(p => !acProblemIdSet.has(p.id))
    .filter(p => performances.has(p.id))
    .map(p => ({ ...p, difficulty: performances.get(p.id, 0) }))
    .sort((a, b) => {
      const da = Math.abs(a.difficulty - predictedPerf);
      const db = Math.abs(b.difficulty - predictedPerf);
      return da - db;
    })
    .slice(0, RECOMMEND_NUM)
    .sort((a, b) => b.difficulty - a.difficulty)
    .toArray();

  return (
    <BootstrapTable
      data={recommendedProblems}
      keyField="id"
      height="auto"
      hover
      striped
    >
      <TableHeaderColumn
        dataField="title"
        dataFormat={(
          title: string,
          { id, contest_id }: { id: string; contest_id: string }
        ) => (
          <a target="_blank" href={Url.formatProblemUrl(id, contest_id)}>
            {title}
          </a>
        )}
      >
        Problem
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="contest_id"
        dataFormat={(contest_id: string, problem: Problem) => {
          const contest = contests.get(contest_id);
          return (
            <a href={Url.formatContestUrl(problem.contest_id)} target="_blank">
              {contest ? contest.title : contest_id}
            </a>
          );
        }}
      >
        Contest
      </TableHeaderColumn>
      <TableHeaderColumn dataField="difficulty">Difficulty</TableHeaderColumn>
    </BootstrapTable>
  );
};

export default Recommendations;
