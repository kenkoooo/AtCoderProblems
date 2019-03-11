import React from "react";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";

import Submission from "../../interfaces/Submission";
import { formatDate } from "../../utils/DateFormat";
import * as Url from "../../utils/Url";
import { isAccepted } from "../../utils";
import { Badge } from "reactstrap";
import { string } from "prop-types";

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
  return (
    <BootstrapTable
      data={submissions.sort((a, b) => b.epoch_second - a.epoch_second)}
      keyField="id"
      height="auto"
      hover
      striped
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
    </BootstrapTable>
  );
};

export default SubmissionList;
