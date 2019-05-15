import React from "react";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";

import Submission from "../../interfaces/Submission";
import { formatDate } from "../../utils/DateFormat";
import * as Url from "../../utils/Url";
import { isAccepted } from "../../utils";
import { Badge } from "reactstrap";

const SubmissionList = ({
  submissions,
  problems
}: {
  submissions: Submission[];
  problems: { id: string; title: string }[];
}) => {
  const title_map = problems.reduce(
    (map, p) => map.set(p.id, p.title),
    new Map<string, string>()
  );

  let verdictOptions: any = {};
  submissions
    .reduce((set, s) => set.add(s.result), new Set<string>())
    .forEach((verdict, index) => {
      verdictOptions[index] = verdict;
    });
  return (
    <BootstrapTable
      data={submissions
        .sort((a, b) => b.epoch_second - a.epoch_second)
        .map(s => ({ title: title_map.get(s.problem_id), ...s }))}
      keyField="id"
      height="auto"
      hover
      striped
      search
      pagination
      options={{
        paginationPosition: "top",
        sizePerPage: 20,
        sizePerPageList: [
          {
            text: "20",
            value: 20
          },
          {
            text: "50",
            value: 50
          },
          {
            text: "100",
            value: 100
          },
          {
            text: "200",
            value: 200
          },
          {
            text: "All",
            value: submissions.length
          }
        ]
      }}
    >
      <TableHeaderColumn
        dataSort
        dataField="epoch_second"
        dataFormat={(second: number) => formatDate(second)}
      >
        Date
      </TableHeaderColumn>
      <TableHeaderColumn
        filterFormatted
        dataSort
        dataField="problem_id"
        dataFormat={(_: string, { problem_id, contest_id }: Submission) => (
          <a
            target="_blank"
            href={Url.formatProblemUrl(problem_id, contest_id)}
          >
            {title_map.get(problem_id)}
          </a>
        )}
      >
        Problem
      </TableHeaderColumn>
      <TableHeaderColumn
        dataSort
        filter={{ type: "SelectFilter", options: verdictOptions }}
        dataField="result"
        dataAlign="center"
        dataFormat={result =>
          isAccepted(result) ? (
            <Badge color="success">{result}</Badge>
          ) : (
            <Badge color="warning">{result}</Badge>
          )
        }
      >
        Status
      </TableHeaderColumn>
      <TableHeaderColumn dataSort dataField="language">
        Language
      </TableHeaderColumn>
      <TableHeaderColumn
        dataSort
        dataField="id"
        dataFormat={(_: number, { id, contest_id }: Submission) => (
          <a target="_blank" href={Url.formatSubmissionUrl(id, contest_id)}>
            Detail
          </a>
        )}
      >
        Detail
      </TableHeaderColumn>
      <TableHeaderColumn dataField="title" hidden />
    </BootstrapTable>
  );
};

export default SubmissionList;
