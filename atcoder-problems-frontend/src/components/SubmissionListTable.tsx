import Submission from "../interfaces/Submission";
import ProblemModel from "../interfaces/ProblemModel";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { ListPaginationPanel } from "./ListPaginationPanel";
import { formatMomentDateTime, parseSecond } from "../utils/DateUtil";
import ProblemLink from "./ProblemLink";
import { isAccepted } from "../utils";
import { Badge } from "reactstrap";
import * as Url from "../utils/Url";
import React from "react";
import { ProblemId } from "../interfaces/Status";

interface Props {
  submissions: Submission[];
  problems: { id: string; title: string }[];
  problemModels: Map<ProblemId, ProblemModel>;
}

export const SubmissionListTable = (props: Props) => {
  const { submissions, problems, problemModels } = props;
  const titleMap = problems.reduce((map, p) => {
    map.set(p.id, p.title);
    return map;
  }, new Map<string, string>());

  const verdictOptions: { [_: string]: string } = Array.from(
    submissions.reduce((set, s) => {
      set.add(s.result);
      return set;
    }, new Set<string>())
  )
    .sort()
    .reduce((options, s) => {
      options[s] = s;
      return options;
    }, {} as { [_: string]: string });

  const languageOptions: { [_: string]: string } = Array.from(
    submissions.reduce((set, s) => {
      set.add(s.language);
      return set;
    }, new Set<string>())
  )
    .sort()
    .reduce((options, s) => {
      options[s] = s;
      return options;
    }, {} as { [_: string]: string });

  return (
    <BootstrapTable
      data={submissions
        .sort((a, b) => b.epoch_second - a.epoch_second)
        .map(s => ({ title: titleMap.get(s.problem_id), ...s }))}
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
        ],
        paginationPanel: (paginationPanelProps: any) => {
          return <ListPaginationPanel {...paginationPanelProps} />;
        }
      }}
    >
      <TableHeaderColumn
        dataSort
        dataField="epoch_second"
        dataFormat={(second: number) =>
          formatMomentDateTime(parseSecond(second))
        }
      >
        Date
      </TableHeaderColumn>
      <TableHeaderColumn
        filterFormatted
        dataSort
        dataField="title"
        dataFormat={(
          title: string | undefined,
          { problem_id, contest_id }: Submission
        ) => (
          <ProblemLink
            difficulty={problemModels.get(problem_id)?.difficulty}
            isExperimentalDifficulty={
              problemModels.get(problem_id)?.is_experimental
            }
            showDifficulty={true}
            problemId={problem_id}
            problemTitle={title || ""}
            contestId={contest_id}
          />
        )}
      >
        Problem
      </TableHeaderColumn>
      <TableHeaderColumn
        dataSort
        dataField="user_id"
        dataFormat={(userId: string) => (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={Url.formatUserUrl(userId)}
          >
            {userId}
          </a>
        )}
      >
        User
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
      <TableHeaderColumn
        dataSort
        dataField="language"
        filter={{ type: "SelectFilter", options: languageOptions }}
      >
        Language
      </TableHeaderColumn>
      <TableHeaderColumn
        dataSort
        dataField="id"
        dataFormat={(_: number, { id, contest_id }: Submission) => (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={Url.formatSubmissionUrl(id, contest_id)}
          >
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
