import React from "react";

import { isAccepted } from "../../utils";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import Contest from "../../interfaces/Contest";
import * as Url from "../../utils/Url";

const TOP_PERFORMANCES = 50;
const RECOMMEND_NUM = 10;

const Recommendations = ({
  submissions,
  problems,
  contests,
  performances
}: {
  submissions: { result: string; problem_id: string; epoch_second: number }[];
  problems: { id: string; title: string; contest_id: string }[];
  contests: Contest[];
  performances: { problem_id: string; minimum_performance: number }[];
}) => {
  if (submissions.length == 0) {
    return null;
  }
  const performance_map = performances.reduce(
    (map, { problem_id, minimum_performance }) =>
      map.set(problem_id, minimum_performance),
    new Map<string, number>()
  );

  const contest_map = contests.reduce(
    (map, contest) => map.set(contest.id, contest),
    new Map<string, Contest>()
  );

  const accepted_problem_ids = submissions
    .filter(({ result }) => isAccepted(result))
    .sort((a, b) => b.epoch_second - a.epoch_second)
    .map(s => s.problem_id);
  const accepted_problem_id_set = new Set(accepted_problem_ids);
  const accepted_problem_performances = Array.from(accepted_problem_id_set)
    .map(id => performance_map.get(id))
    .filter(p => p !== undefined) as number[];
  accepted_problem_performances.sort((a, b) => b - a);
  const top_last_index =
    Math.min(
      Math.ceil(accepted_problem_performances.length / 5.0),
      TOP_PERFORMANCES
    ) - 1;
  const predicted_performance = accepted_problem_performances[top_last_index];

  console.log(accepted_problem_performances);
  console.log(predicted_performance);

  const recommended_problems = problems
    .filter(({ id }) => !accepted_problem_id_set.has(id))
    .filter(({ id }) => performance_map.has(id))
    .sort((a, b) => {
      const pa = performance_map.get(a.id) as number;
      const pb = performance_map.get(b.id) as number;
      const da = Math.abs(pa - predicted_performance);
      const db = Math.abs(pb - predicted_performance);
      return da - db;
    })
    .slice(0, RECOMMEND_NUM)
    .map(p => Object.assign({
      difficulty: performance_map.get(p.id) as number,
      contest: contest_map.get(p.contest_id) as Contest
    }, p))
    .sort((a, b) => b.difficulty - a.difficulty);

  return (
    <BootstrapTable
      data={recommended_problems}
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
        dataField="contest"
        dataFormat={(
          {id, title}: {id: string, title: string}
        ) => (
          <a href={Url.formatContestUrl(id)} target="_blank">
            {title}
          </a>
        )}
      >
        Contest
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="difficulty"
      >
        Difficulty
      </TableHeaderColumn>
    </BootstrapTable>
  );
};

export default Recommendations;
